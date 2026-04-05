import {
  buildWikaHumanHandoffArtifact,
  getWikaLowRiskWriteBoundary
} from "./alibaba-write-guardrails.js";
import { fetchAlibabaOfficialProductDetail } from "./alibaba-official-extensions.js";
import { fetchAlibabaOfficialOrderDraftTypes } from "./alibaba-official-order-entry.js";
import {
  WIKA_EXTERNAL_WORKFLOW_TEMPLATE_VERSION,
  buildWikaWorkflowBlocker,
  buildWikaWorkflowHandoffField
} from "./alibaba-external-workflow-taxonomy.js";
import {
  buildWikaParameterMissingAlert,
  buildWikaWriteBoundaryAlert
} from "./wika-alerts.js";
import { fetchWikaOrderMinimalDiagnostic } from "./wika-minimal-diagnostic.js";

function normalizeString(value) {
  return String(value ?? "").trim();
}

function extractPrimaryImageUrl(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return normalizeString(value) || null;
  }

  if (Array.isArray(value)) {
    return extractPrimaryImageUrl(value[0]);
  }

  if (typeof value === "object") {
    if (Array.isArray(value.string)) {
      return extractPrimaryImageUrl(value.string[0]);
    }

    if (Array.isArray(value.images?.string)) {
      return extractPrimaryImageUrl(value.images.string[0]);
    }

    if (Array.isArray(value.images)) {
      return extractPrimaryImageUrl(value.images[0]);
    }

    return extractPrimaryImageUrl(Object.values(value)[0]);
  }

  return null;
}

function normalizeList(values = []) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((value) => normalizeString(value))
    .filter(Boolean);
}

const ORDER_WORKFLOW_PROFILES = {
  order_minimal_handoff: {
    code: "order_minimal_handoff",
    label: "最小订单交接包",
    input_expectation: "只有基础行项目或极少买家信息，必须先人工补单再继续。",
    common_blockers: ["missing_buyer_company", "missing_line_items", "missing_line_item_quantity"]
  },
  order_quote_confirmation_needed: {
    code: "order_quote_confirmation_needed",
    label: "报价确认型订单草稿",
    input_expectation: "已有买家和行项目，但价格、总价、交期仍需人工确认。",
    common_blockers: [
      "missing_line_item_unit_price",
      "missing_total_amount",
      "missing_lead_time"
    ]
  },
  order_commercial_review: {
    code: "order_commercial_review",
    label: "商务复核型订单草稿",
    input_expectation: "主要商务字段已具备，可作为人工复核和补单底稿继续处理。",
    common_blockers: ["missing_advance_amount", "missing_trade_term", "missing_shipment_method"]
  }
};

function buildChecklistItem({ code, label, done, reason }) {
  return {
    code,
    label,
    done,
    reason
  };
}

function buildOrderQuestionDetails(blockers = []) {
  return blockers
    .filter((blocker) => blocker.follow_up_question)
    .map((blocker, index) => ({
      sequence: index + 1,
      priority: blocker.blocker_level === "hard" ? "high" : "medium",
      question: blocker.follow_up_question,
      blocker_code: blocker.blocker_code,
      required_field: blocker.required_field
    }));
}

function determineOrderWorkflowProfile({ draft, hardBlockers, softBlockers }) {
  const buyer = draft?.buyer ?? {};
  const lineItems = Array.isArray(draft?.line_items) ? draft.line_items : [];
  const hasBuyerIdentity =
    Boolean(normalizeString(buyer.company_name)) &&
    Boolean(normalizeString(buyer.contact_name)) &&
    Boolean(normalizeString(buyer.email));
  const hasLineItems = lineItems.length > 0;

  if (!hasBuyerIdentity || !hasLineItems) {
    return ORDER_WORKFLOW_PROFILES.order_minimal_handoff;
  }

  if (hardBlockers.length > 0) {
    return ORDER_WORKFLOW_PROFILES.order_quote_confirmation_needed;
  }

  return ORDER_WORKFLOW_PROFILES.order_commercial_review;
}

function buildOrderHandoffChecklist({ draft, hardBlockers, softBlockers }) {
  const buyer = draft?.buyer ?? {};
  const shipmentPlan = draft?.shipment_plan ?? {};

  return [
    buildChecklistItem({
      code: "buyer_identity",
      label: "买家身份已确认",
      done:
        Boolean(normalizeString(buyer.company_name)) &&
        Boolean(normalizeString(buyer.contact_name)) &&
        Boolean(normalizeString(buyer.email)),
      reason:
        Boolean(normalizeString(buyer.company_name)) &&
        Boolean(normalizeString(buyer.contact_name)) &&
        Boolean(normalizeString(buyer.email))
          ? "买家公司、联系人和邮箱均已具备。"
          : "买家公司、联系人或邮箱仍不完整。"
    }),
    buildChecklistItem({
      code: "pricing_ready",
      label: "价格字段已确认",
      done: !hardBlockers.some((item) => item.blocker_code === "missing_line_item_unit_price" || item.blocker_code === "missing_total_amount"),
      reason: hardBlockers.some((item) => item.blocker_code === "missing_line_item_unit_price" || item.blocker_code === "missing_total_amount")
        ? "单价或总价仍需人工确认。"
        : "单价与总价已具备。"
    }),
    buildChecklistItem({
      code: "delivery_ready",
      label: "交期与物流条件已确认",
      done:
        !hardBlockers.some((item) => item.blocker_code === "missing_lead_time") &&
        !softBlockers.some((item) => item.blocker_code === "missing_trade_term" || item.blocker_code === "missing_shipment_method" || item.blocker_code === "missing_destination_country"),
      reason:
        normalizeString(shipmentPlan.lead_time_text) && normalizeString(shipmentPlan.trade_term)
          ? "交期、贸易术语和出运方式已具备基本上下文。"
          : "交期、目的地或履约条件仍需人工补充。"
    }),
    buildChecklistItem({
      code: "external_only",
      label: "仍属于外部订单草稿",
      done: true,
      reason: "当前草稿只用于外部补单与人工跟进，不会创建平台订单。"
    })
  ];
}

function buildOrderManualCompletionSop({ profile, hardBlockers, softBlockers }) {
  return {
    template_version: WIKA_EXTERNAL_WORKFLOW_TEMPLATE_VERSION,
    workflow_profile: profile.code,
    sections: [
      {
        section_code: "buyer_identity",
        title: "买家身份",
        owner: "sales",
        fields: ["buyer.company_name", "buyer.contact_name", "buyer.email"],
        notes: "买家主体、联系人和邮箱是人工补单和后续报价回传的基础。"
      },
      {
        section_code: "commercial_terms",
        title: "价格与付款条款",
        owner: "sales",
        fields: [
          "line_items[].unit_price",
          "payment_terms.total_amount",
          "payment_terms.advance_amount"
        ],
        notes: "没有实时报价源，价格条款必须人工确认。"
      },
      {
        section_code: "delivery_terms",
        title: "交期与履约条款",
        owner: "sales / logistics",
        fields: [
          "shipment_plan.lead_time_text",
          "shipment_plan.trade_term",
          "shipment_plan.shipment_method",
          "shipment_plan.destination_country"
        ],
        notes: "交期、贸易术语和出运方式决定订单草稿是否可继续人工推进。"
      }
    ],
    blocker_summary: {
      hard_count: hardBlockers.length,
      soft_count: softBlockers.length
    },
    external_boundary: {
      platform_order_available: false,
      draft_can_still_be_produced: true,
      reason: "当前只能生成外部订单草稿，不能视为平台内订单草稿或真实订单。"
    }
  };
}

function buildRequiredManualFieldDetails(requiredFields = []) {
  const detailMap = {
    "buyer.company_name": {
      template_section: "buyer_identity",
      why_required: "缺少买家公司主体，订单草稿无法交接给人工继续推进。",
      example_value: "ABC Trading LLC",
      collection_hint: "从客户签名、名片、邮箱域名或聊天记录中确认。",
      who_should_fill: "sales"
    },
    "buyer.contact_name": {
      template_section: "buyer_identity",
      why_required: "缺少联系人，人工回复和报价回传对象不明确。",
      example_value: "John Smith",
      collection_hint: "优先从询盘落款、邮箱签名或聊天记录获取。",
      who_should_fill: "sales"
    },
    "buyer.email": {
      template_section: "buyer_identity",
      why_required: "缺少正式联系邮箱，无法发送外部报价或订单草稿。",
      example_value: "buyer@example.com",
      collection_hint: "优先收集可正式回传文件的邮箱地址。",
      who_should_fill: "sales"
    },
    "line_items[].quantity": {
      template_section: "commercial_terms",
      why_required: "数量决定价格、交期和包装方案。",
      example_value: "1000",
      collection_hint: "确认正式采购量、MOQ 或打样数量。",
      who_should_fill: "sales"
    },
    "line_items[].unit_price": {
      template_section: "commercial_terms",
      why_required: "单价缺失会导致订单草稿无法形成有效报价包。",
      example_value: "0.65",
      collection_hint: "结合数量、材质、工艺和运费方案人工确认。",
      who_should_fill: "sales"
    },
    "payment_terms.total_amount": {
      template_section: "commercial_terms",
      why_required: "缺少总价，无法形成完整订单草稿包。",
      example_value: "650",
      collection_hint: "按行项目汇总或人工确认总报价。",
      who_should_fill: "sales"
    },
    "payment_terms.advance_amount": {
      template_section: "commercial_terms",
      why_required: "预付款安排影响付款条件和订单执行节奏。",
      example_value: "195",
      collection_hint: "确认定金比例或预付款金额。",
      who_should_fill: "sales"
    },
    "shipment_plan.lead_time_text": {
      template_section: "delivery_terms",
      why_required: "缺少交期会导致订单草稿无法形成明确承诺。",
      example_value: "25-30 days after artwork approval",
      collection_hint: "按打样、排产、出货阶段向业务或生产确认。",
      who_should_fill: "sales / production"
    }
  };

  return requiredFields.map((field) => ({
    field,
    ...(detailMap[field] || {
      template_section: "delivery_terms",
      why_required: "当前字段仍需人工确认。",
      example_value: "TBD by human",
      collection_hint: "请人工补充该字段。",
      who_should_fill: "sales"
    })
  }));
}

function normalizeLineItems(items = []) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item, index) => ({
    line_no: index + 1,
    product_id: normalizeString(item?.product_id) || null,
    product_name: normalizeString(item?.product_name) || null,
    sku_id: normalizeString(item?.sku_id) || null,
    sku_description: normalizeString(item?.sku_description) || null,
    quantity: normalizeString(item?.quantity) || null,
    unit: normalizeString(item?.unit) || null,
    unit_price: normalizeString(item?.unit_price) || null,
    currency: normalizeString(item?.currency) || null,
    image_url: normalizeString(item?.image_url) || null
  }));
}

function normalizePaymentTerms(input = {}) {
  return {
    currency: normalizeString(input.currency) || "USD",
    total_amount: normalizeString(input.total_amount) || null,
    advance_amount: normalizeString(input.advance_amount) || null,
    balance_amount: normalizeString(input.balance_amount) || null,
    payment_terms_text:
      normalizeString(input.payment_terms_text) || "TBD by human confirmation"
  };
}

function normalizeShipmentPlan(input = {}) {
  return {
    trade_term: normalizeString(input.trade_term) || null,
    shipment_method: normalizeString(input.shipment_method) || null,
    lead_time_text:
      normalizeString(input.lead_time_text) || "TBD by human confirmation",
    destination_country: normalizeString(input.destination_country) || null,
    destination_port: normalizeString(input.destination_port) || null,
    logistics_notes: normalizeString(input.logistics_notes) || null
  };
}

export function buildWikaExternalOrderDraft(input = {}) {
  const buyer = {
    buyer_member_seq: normalizeString(input.buyer_member_seq) || null,
    company_name: normalizeString(input.company_name) || null,
    contact_name: normalizeString(input.contact_name) || null,
    email: normalizeString(input.email) || null,
    phone: normalizeString(input.phone) || null,
    country_code: normalizeString(input.country_code) || null,
    country_name: normalizeString(input.country_name) || null
  };

  const lineItems = normalizeLineItems(input.line_items);
  const paymentTerms = normalizePaymentTerms(input.payment_terms);
  const shipmentPlan = normalizeShipmentPlan(input.shipment_plan);
  const notes = normalizeList(input.notes);
  const lowRiskWriteBoundary = getWikaLowRiskWriteBoundary();

  const autoGeneratedFields = [
    "draft_header",
    "line_items[].line_no",
    "line_items[].product_id",
    "line_items[].product_name",
    "payment_terms.currency",
    "shipment_plan.trade_term",
    "shipment_plan.shipment_method",
    "draft_boundary"
  ];

  const manualRequiredFields = [
    "buyer.company_name",
    "buyer.contact_name",
    "buyer.email",
    "line_items[].quantity",
    "line_items[].unit_price",
    "payment_terms.total_amount",
    "payment_terms.advance_amount",
    "shipment_plan.lead_time_text"
  ];

  const reasonsCannotSubmit = [
    "当前仅形成外部订单草稿，不代表平台内订单已创建。",
    "alibaba.trade.order.create 仍未证明存在非成交、可回滚、无副作用的安全边界。",
    "当前缺少经过确认的买家、价格、交期与履约参数，不能自动发起真实信保下单。"
  ];

  const handoff = buildWikaHumanHandoffArtifact({
    action: "build_order_draft",
    apiName: "alibaba.trade.order.create",
    blockerCategory: "manual_confirmation_required",
    triggerCodes: [
      "live_order_create",
      "pricing_or_delivery_uncertain",
      "irreversible_write_risk"
    ],
    stage: "order_entry_boundary",
    inputSummary: {
      buyer_member_seq: buyer.buyer_member_seq,
      line_item_count: lineItems.length,
      currency: paymentTerms.currency
    },
    evidence: {
      missing_manual_fields: manualRequiredFields,
      reasons_cannot_submit: reasonsCannotSubmit
    },
    nextAction:
      "先由人工补齐买家、价格、交期与履约信息，再决定是否进入订单入口的更深边界验证。"
  });

  return {
    ok: false,
    account: "wika",
    stage: "external_order_draft_only",
    submit_mode: "manual_only",
    ready_for_platform_submit: false,
    draft_header: {
      generated_at: new Date().toISOString(),
      draft_type: "external_order_draft",
      source: "wika_order_entry_boundary"
    },
    buyer,
    line_items: lineItems,
    payment_terms: paymentTerms,
    shipment_plan: shipmentPlan,
    notes,
    auto_generated_fields: autoGeneratedFields,
    manual_required_fields: manualRequiredFields,
    reasons_cannot_submit: reasonsCannotSubmit,
    blocked_automation_fields: {
      trade_order_create: lowRiskWriteBoundary.trade_order_create.blocked_automation_fields
    },
    low_risk_write_boundary: {
      trade_order_create: lowRiskWriteBoundary.trade_order_create
    },
    handoff
  };
}

function normalizeWorkflowMissingContext(draft) {
  const fields = Array.isArray(draft?.manual_required_fields)
    ? draft.manual_required_fields
    : [];

  return [...new Set(fields.map((value) => normalizeString(value)).filter(Boolean))];
}

function buildOrderWorkflowLayers(input = {}, draft) {
  const hardBlockers = [];
  const softBlockers = [];
  const assumptions = [];
  const followUpQuestionSeed = [];
  const handoffFields = [];

  const pushBlocker = (collection, blocker) => {
    collection.push(blocker);
    if (blocker.follow_up_question) {
      followUpQuestionSeed.push(blocker);
    }
    handoffFields.push(buildWikaWorkflowHandoffField(blocker));
  };

  const buyer = draft?.buyer ?? {};
  const lineItems = Array.isArray(draft?.line_items) ? draft.line_items : [];
  const paymentTerms = draft?.payment_terms ?? {};
  const shipmentPlan = draft?.shipment_plan ?? {};

  if (!normalizeString(buyer.company_name)) {
    pushBlocker(
      hardBlockers,
      buildWikaWorkflowBlocker({
        key: "buyer.company_name",
        blockerCode: "missing_buyer_company",
        label: "Buyer company name",
        reason: "Company identity is missing, so the draft cannot be treated as a usable commercial order package.",
        followUpQuestion: "Please provide the buyer company name.",
        requiredField: "buyer.company_name"
      })
    );
  }

  if (!normalizeString(buyer.contact_name)) {
    pushBlocker(
      hardBlockers,
      buildWikaWorkflowBlocker({
        key: "buyer.contact_name",
        blockerCode: "missing_buyer_contact",
        label: "Buyer contact name",
        reason: "The buyer contact person is missing, so handoff and follow-up cannot be targeted correctly.",
        followUpQuestion: "Please provide the buyer contact name.",
        requiredField: "buyer.contact_name"
      })
    );
  }

  if (!normalizeString(buyer.email)) {
    pushBlocker(
      hardBlockers,
      buildWikaWorkflowBlocker({
        key: "buyer.email",
        blockerCode: "missing_buyer_email",
        label: "Buyer email",
        reason: "No buyer email is available for manual follow-up or quote delivery.",
        followUpQuestion: "Please provide the buyer email address.",
        requiredField: "buyer.email"
      })
    );
  }

  if (lineItems.length === 0) {
    pushBlocker(
      hardBlockers,
      buildWikaWorkflowBlocker({
        key: "line_items",
        blockerCode: "missing_line_items",
        label: "Line items",
        reason: "No line items are present, so no usable order draft can be built.",
        followUpQuestion: "Please add at least one line item with product and quantity.",
        requiredField: "line_items"
      })
    );
  }

  for (const item of lineItems) {
    if (!normalizeString(item.quantity)) {
      pushBlocker(
        hardBlockers,
        buildWikaWorkflowBlocker({
          key: `line_items.${item.line_no}.quantity`,
          blockerCode: "missing_line_item_quantity",
          label: `Line ${item.line_no} quantity`,
          reason: "Quantity is required before any usable quote or order package can be reviewed.",
          followUpQuestion: `Please confirm the quantity for line ${item.line_no}.`,
          requiredField: `line_items[${item.line_no - 1}].quantity`
        })
      );
    }

    if (!normalizeString(item.unit_price)) {
      pushBlocker(
        hardBlockers,
        buildWikaWorkflowBlocker({
          key: `line_items.${item.line_no}.unit_price`,
          blockerCode: "missing_line_item_unit_price",
          label: `Line ${item.line_no} unit price`,
          reason: "Unit price is missing, so the draft cannot become a confirmed quote or order package.",
          followUpQuestion: `Please confirm the unit price for line ${item.line_no}.`,
          requiredField: `line_items[${item.line_no - 1}].unit_price`
        })
      );
    }
  }

  if (!normalizeString(paymentTerms.total_amount)) {
    pushBlocker(
      hardBlockers,
      buildWikaWorkflowBlocker({
        key: "payment_terms.total_amount",
        blockerCode: "missing_total_amount",
        label: "Total amount",
        reason: "Total amount is missing, so the draft remains incomplete for commercial review.",
        followUpQuestion: "Please confirm the total amount or quote total.",
        requiredField: "payment_terms.total_amount"
      })
    );
  }

  if (!normalizeString(paymentTerms.advance_amount)) {
    pushBlocker(
      softBlockers,
      buildWikaWorkflowBlocker({
        key: "payment_terms.advance_amount",
        blockerCode: "missing_advance_amount",
        label: "Advance amount",
        reason: "Advance payment arrangement is missing, so payment terms stay generic.",
        followUpQuestion: "Please confirm the deposit or advance payment amount.",
        requiredField: "payment_terms.advance_amount"
      })
    );
  }

  if (
    !normalizeString(shipmentPlan.lead_time_text) ||
    normalizeString(shipmentPlan.lead_time_text) === "TBD by human confirmation"
  ) {
    pushBlocker(
      hardBlockers,
      buildWikaWorkflowBlocker({
        key: "shipment_plan.lead_time_text",
        blockerCode: "missing_lead_time",
        label: "Lead time",
        reason: "Lead time is still a placeholder, so the draft cannot carry a confirmed delivery commitment.",
        followUpQuestion: "Please confirm the production lead time and shipping readiness condition.",
        requiredField: "shipment_plan.lead_time_text"
      })
    );
  }

  if (!normalizeString(shipmentPlan.destination_country)) {
    pushBlocker(
      softBlockers,
      buildWikaWorkflowBlocker({
        key: "shipment_plan.destination_country",
        blockerCode: "missing_destination_country",
        label: "Destination country",
        reason: "Destination is missing, so logistics, freight and incoterm review remain incomplete.",
        followUpQuestion: "Please confirm the destination country or destination port.",
        requiredField: "shipment_plan.destination_country"
      })
    );
  }

  if (!normalizeString(shipmentPlan.trade_term)) {
    pushBlocker(
      softBlockers,
      buildWikaWorkflowBlocker({
        key: "shipment_plan.trade_term",
        blockerCode: "missing_trade_term",
        label: "Incoterm / trade term",
        reason: "Trade term is missing, so logistics and pricing assumptions remain generic.",
        followUpQuestion: "Please confirm the trade term, for example FOB or CIF.",
        requiredField: "shipment_plan.trade_term"
      })
    );
  }

  if (!normalizeString(shipmentPlan.shipment_method)) {
    pushBlocker(
      softBlockers,
      buildWikaWorkflowBlocker({
        key: "shipment_plan.shipment_method",
        blockerCode: "missing_shipment_method",
        label: "Shipment method",
        reason: "Shipment method is missing, so logistics suggestions remain generic.",
        followUpQuestion: "Please confirm whether the shipment should be by sea, air or express.",
        requiredField: "shipment_plan.shipment_method"
      })
    );
  }

  assumptions.push("This package is an external order draft only and does not create any platform order.");
  assumptions.push("Currency defaults to USD if no confirmed payment currency is supplied.");
  assumptions.push("Any missing commercial field remains subject to human confirmation.");
  if (!normalizeString(input?.shipment_plan?.lead_time_text)) {
    assumptions.push("Lead time stays as a placeholder until a human confirms it.");
  }

  const followUpQuestionDetails = buildOrderQuestionDetails(followUpQuestionSeed);

  return {
    hard_blockers: hardBlockers,
    soft_blockers: softBlockers,
    assumptions: [...new Set(assumptions)],
    follow_up_questions: followUpQuestionDetails.map((item) => item.question),
    follow_up_question_details: followUpQuestionDetails,
    handoff_fields: handoffFields
  };
}

async function hydrateLineItems(clientConfig, lineItems = []) {
  const hydrated = [];

  for (const item of lineItems) {
    const productId = normalizeString(item?.product_id);
    if (!productId || normalizeString(item?.product_name)) {
      hydrated.push(item);
      continue;
    }

    try {
      const detailResult = await fetchAlibabaOfficialProductDetail(
        {
          account: "wika",
          ...clientConfig
        },
        {
          product_id: productId
        }
      );

      hydrated.push({
        ...item,
        product_name:
          normalizeString(item?.product_name) ||
          normalizeString(detailResult?.product?.subject) ||
          null,
        image_url:
          normalizeString(item?.image_url) ||
          extractPrimaryImageUrl(detailResult?.product?.main_image) ||
          null
      });
    } catch {
      hydrated.push(item);
    }
  }

  return hydrated;
}

export async function buildWikaExternalOrderDraftPackage(clientConfig, input = {}) {
  const normalizedInput = {
    ...input,
    line_items: await hydrateLineItems(clientConfig, input.line_items)
  };
  const draft = buildWikaExternalOrderDraft(normalizedInput);
  const workflowLayers = buildOrderWorkflowLayers(normalizedInput, draft);
  const orderDiagnostic = await fetchWikaOrderMinimalDiagnostic(clientConfig, {
    order_page_size: 8,
    order_sample_limit: 5
  });

  let draftTypes = null;
  try {
    draftTypes = await fetchAlibabaOfficialOrderDraftTypes(
      {
        account: "wika",
        ...clientConfig
      },
      {}
    );
  } catch {
    draftTypes = null;
  }

  const missingContext = [
    ...workflowLayers.hard_blockers.map((item) => item.required_field),
    ...workflowLayers.soft_blockers.map((item) => item.required_field)
  ];
  const alertPayload =
    missingContext.length > 0
      ? buildWikaParameterMissingAlert({
          stageName: "external_order_draft_workflow",
          relatedApis: ["alibaba.trade.order.create"],
          relatedModules: ["external_order_draft"],
          evidence: [
            "External order draft generated without platform order creation.",
            `Missing manual fields: ${missingContext.join(", ")}`
          ],
          userNeeds: missingContext,
          suggestedNextSteps: [
            "Fill in buyer identity, final pricing and delivery details manually.",
            "Use the draft package as an external working file only."
          ],
          inputSummary: {
            buyer_member_seq: normalizeString(input.buyer_member_seq) || null,
            line_item_count: Array.isArray(normalizedInput.line_items)
              ? normalizedInput.line_items.length
              : 0
          }
        })
      : buildWikaWriteBoundaryAlert({
          stageName: "external_order_draft_workflow",
          relatedApis: ["alibaba.trade.order.create"],
          relatedModules: ["external_order_draft"],
          evidence: [
            "Platform order create boundary is still unproven.",
            "Current package remains external-only."
          ],
          userNeeds: ["manual_order_submit_decision"],
          suggestedNextSteps: [
            "Keep using the package as an external draft only.",
            "Do not treat this as a platform order draft."
          ],
          inputSummary: {
            line_item_count: Array.isArray(normalizedInput.line_items)
              ? normalizedInput.line_items.length
              : 0
          }
        });
  const workflowProfile = determineOrderWorkflowProfile({
    draft,
    hardBlockers: workflowLayers.hard_blockers,
    softBlockers: workflowLayers.soft_blockers
  });
  const handoffChecklist = buildOrderHandoffChecklist({
    draft,
    hardBlockers: workflowLayers.hard_blockers,
    softBlockers: workflowLayers.soft_blockers
  });
  const manualCompletionSop = buildOrderManualCompletionSop({
    profile: workflowProfile,
    hardBlockers: workflowLayers.hard_blockers,
    softBlockers: workflowLayers.soft_blockers
  });
  const requiredManualFieldDetails = buildRequiredManualFieldDetails(draft.manual_required_fields);
  const enhancedHandoffFields = workflowLayers.handoff_fields.map((item) => {
    const detail = requiredManualFieldDetails.find((field) => field.field === item.field);
    return {
      ...item,
      template_section: detail?.template_section || "delivery_terms",
      why_required: detail?.why_required || item.reason,
      example_value: detail?.example_value || "TBD by human",
      collection_hint: detail?.collection_hint || "请人工补充该字段。",
      who_should_fill: detail?.who_should_fill || "sales"
    };
  });
  const draftUsableExternally = Array.isArray(draft.line_items) && draft.line_items.length > 0;

  return {
    ok: draft.ok,
    account: "wika",
    workflow_type: "external_order_draft_package",
    workflow_profile: workflowProfile.code,
    template_version: WIKA_EXTERNAL_WORKFLOW_TEMPLATE_VERSION,
    input_summary: {
      buyer_company_name: normalizeString(input.company_name) || null,
      buyer_contact_name: normalizeString(input.contact_name) || null,
      destination_country:
        normalizeString(input?.shipment_plan?.destination_country) || null,
      line_item_count: Array.isArray(normalizedInput.line_items)
        ? normalizedInput.line_items.length
        : 0,
      quoted_currency:
        normalizeString(input?.payment_terms?.currency) ||
        normalizeString(
          Array.isArray(normalizedInput.line_items)
            ? normalizedInput.line_items[0]?.currency
            : null
        ) ||
        "USD"
    },
    available_context: {
      has_buyer_identity:
        Boolean(normalizeString(input.company_name)) &&
        Boolean(normalizeString(input.contact_name)) &&
        Boolean(normalizeString(input.email)),
      has_destination: Boolean(
        normalizeString(input?.shipment_plan?.destination_country)
      ),
      has_price_fields: Boolean(
        Array.isArray(normalizedInput.line_items) &&
          normalizedInput.line_items.some((item) => normalizeString(item.unit_price))
      ),
      has_delivery_fields: Boolean(
        normalizeString(input?.shipment_plan?.lead_time_text)
      ),
      line_item_count: Array.isArray(normalizedInput.line_items)
        ? normalizedInput.line_items.length
        : 0,
      draft_types: draftTypes?.types ?? []
    },
    missing_context: [...new Set(missingContext.filter(Boolean))],
    hard_blockers: workflowLayers.hard_blockers,
    soft_blockers: workflowLayers.soft_blockers,
    assumptions: workflowLayers.assumptions,
    required_manual_fields: draft.manual_required_fields,
    required_manual_field_details: requiredManualFieldDetails,
    order_draft_package: draft,
    follow_up_questions: workflowLayers.follow_up_questions,
    follow_up_question_details: workflowLayers.follow_up_question_details,
    escalation_recommendation: {
      level:
        workflowLayers.hard_blockers.length > 0
          ? "high"
          : workflowLayers.soft_blockers.length > 0
            ? "medium"
            : "low",
      recommendation:
        workflowLayers.hard_blockers.length > 0
          ? "Human confirmation is required before this draft can be turned into a quote or any platform-side order attempt."
          : "A human should still review commercial terms, delivery assumptions and buyer identity before reuse."
    },
    handoff_checklist: handoffChecklist,
    handoff_fields: enhancedHandoffFields,
    manual_completion_sop: manualCompletionSop,
    draft_usable_externally: draftUsableExternally,
    alert_payload: alertPayload,
    workflow_meta: {
      generated_at: new Date().toISOString(),
      workflow_profile: workflowProfile.code,
      template_version: WIKA_EXTERNAL_WORKFLOW_TEMPLATE_VERSION,
      available_context: {
        line_item_count: Array.isArray(normalizedInput.line_items)
          ? normalizedInput.line_items.length
          : 0,
        buyer_company_name: normalizeString(input.company_name) || null,
        destination_country:
          normalizeString(input?.shipment_plan?.destination_country) || null,
        draft_types: draftTypes?.types ?? []
      },
      missing_context: missingContext,
      confidence: missingContext.length >= 4 ? "low" : "medium",
      risk_level: "high",
      human_action_required: true,
      handoff_required: workflowLayers.hard_blockers.length > 0,
      draft_usable_externally: draftUsableExternally,
      alert_payload: alertPayload
    },
    supporting_context: {
      order_diagnostic_snapshot: {
        available_signals: orderDiagnostic.available_signals,
        logistics_summary: orderDiagnostic.logistics_summary,
        fund_signal_summary: orderDiagnostic.fund_signal_summary,
        operational_risks: orderDiagnostic.operational_risks
      },
      draft_type_probe: draftTypes
        ? {
            source: draftTypes.source,
            types: draftTypes.types
          }
        : null
    },
    warnings: [
      "This package is an external order draft only and does not create any platform order.",
      "Final price, lead time, buyer identity and fulfillment terms still require human confirmation."
    ]
  };
}
