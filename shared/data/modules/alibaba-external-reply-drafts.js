import {
  fetchAlibabaOfficialProductDetail,
  fetchAlibabaOfficialProductGroups,
  fetchAlibabaOfficialProductScore
} from "./alibaba-official-extensions.js";
import { fetchAlibabaOfficialProductSchemaRender } from "./alibaba-official-product-schema.js";
import {
  buildWikaNoEntryAlert,
  buildWikaParameterMissingAlert
} from "./wika-alerts.js";
import { fetchWikaProductMinimalDiagnostic } from "./wika-minimal-diagnostic.js";
import { fetchWikaProductList } from "../../../projects/wika/data/products/module.js";

function normalizeString(value) {
  return String(value ?? "").trim();
}

function normalizeList(values = []) {
  if (!Array.isArray(values)) {
    return [];
  }

  return [...new Set(values.map((value) => normalizeString(value)).filter(Boolean))];
}

function buildBlockerItem({
  key,
  label,
  reason,
  followUpQuestion,
  requiredField = null
}) {
  return {
    key,
    label,
    reason,
    follow_up_question: followUpQuestion,
    required_field: requiredField || key
  };
}

function normalizeKeywordValues(value) {
  if (Array.isArray(value)) {
    return normalizeList(value);
  }

  if (!value || typeof value !== "object") {
    return normalizeList(String(value ?? "").split(/[;,]/));
  }

  if (Array.isArray(value.string)) {
    return normalizeList(value.string);
  }

  return Object.values(value)
    .flatMap((item) => normalizeKeywordValues(item))
    .slice(0, 12);
}

function normalizeProductIds(input = {}) {
  if (Array.isArray(input.product_ids)) {
    return normalizeList(input.product_ids);
  }

  const singleId = normalizeString(input.product_id);
  return singleId ? [singleId] : [];
}

function pickLanguage(input = {}) {
  const preferred = normalizeString(
    input.language || input.language_preference
  ).toLowerCase();
  if (preferred.startsWith("zh")) {
    return "zh";
  }

  return "en";
}

function topProblemEntries(problemMap, limit = 5) {
  if (!problemMap) {
    return [];
  }

  if (typeof problemMap === "string") {
    const trimmed = problemMap.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        return topProblemEntries(JSON.parse(trimmed), limit);
      } catch {
        return normalizeList(trimmed.split(/[;,]/)).slice(0, limit);
      }
    }

    return problemMap
      .split(/[;,]/)
      .map((value) => normalizeString(value))
      .filter(Boolean)
      .slice(0, limit);
  }

  if (Array.isArray(problemMap)) {
    return problemMap
      .map((value) => normalizeString(value))
      .filter(Boolean)
      .slice(0, limit);
  }

  if (typeof problemMap === "object") {
    const explicitProblems = [];

    const pushKeysFromMap = (mapValue) => {
      if (!mapValue || typeof mapValue !== "object") {
        return;
      }

      for (const [key, value] of Object.entries(mapValue)) {
        if (value === true || (typeof value === "number" && value > 0)) {
          explicitProblems.push(key);
        }
      }
    };

    pushKeysFromMap(problemMap.extendProblemMap);
    pushKeysFromMap(problemMap.errorReasonMap);

    for (const [key, value] of Object.entries(problemMap)) {
      if (/^errorReason.+Map$/.test(key) && value && typeof value === "object") {
        explicitProblems.push(...Object.keys(value).filter(Boolean));
      }
    }

    return [...new Set(explicitProblems)].slice(0, limit);
  }

  return [];
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

function detectNeedsMockup(text) {
  const normalized = normalizeString(text).toLowerCase();
  if (!normalized) {
    return false;
  }

  return [
    "mockup",
    "render",
    "effect image",
    "visual",
    "logo",
    "artwork",
    "sample image",
    "效果图",
    "示意图",
    "打样图",
    "logo"
  ].some((keyword) => normalized.includes(keyword));
}

function buildReplySubject(language, productContexts) {
  const firstProduct = productContexts[0];
  const productName = normalizeString(firstProduct?.subject);

  if (language === "zh") {
    return productName
      ? `关于 ${productName} 的询盘回复草稿`
      : "阿里国际站询盘回复草稿";
  }

  return productName
    ? `Draft reply for ${productName}`
    : "Alibaba inquiry reply draft";
}

function buildReplyOpening(language, customerProfile) {
  const companyName = normalizeString(customerProfile?.company_name);

  if (language === "zh") {
    return companyName
      ? `您好，感谢 ${companyName} 的询盘。`
      : "您好，感谢您的询盘。";
  }

  return companyName
    ? `Hello, thank you for your inquiry from ${companyName}.`
    : "Hello, thank you for your inquiry.";
}

function buildProductSupport(productContexts, language) {
  return productContexts.map((item) => {
    const qualitySignals = [];
    if (item.final_score !== null) {
      qualitySignals.push(
        language === "zh"
          ? `质量分 ${item.final_score}`
          : `quality score ${item.final_score}`
      );
    }
    if (item.boutique_tag === true) {
      qualitySignals.push(language === "zh" ? "精品标签已开启" : "boutique tag enabled");
    }

    return {
      product_id: item.product_id,
      subject: item.subject,
      category_id: item.category_id,
      group_id: item.group_id,
      group_name: item.group_name,
      pc_detail_url: item.pc_detail_url,
      main_image_url: item.main_image_url ?? null,
      description_available: item.description_available,
      keywords: item.keywords,
      gmt_modified: item.gmt_modified,
      quality_signals: qualitySignals,
      problem_hints: item.problem_hints
    };
  });
}

function buildPriceSection(language, input, productContexts) {
  const targetPrice = normalizeString(input.target_price);
  const currency = normalizeString(input.currency || "USD") || "USD";

  if (targetPrice) {
    return {
      status: "needs_human_quote",
      text:
        language === "zh"
          ? `客户已给出目标价格参考：${currency} ${targetPrice}。当前系统没有可直接复用的实时报价源，需人工确认最终报价。`
          : `Customer target price reference: ${currency} ${targetPrice}. The current system has no verified live pricing source, so the final quote still requires human confirmation.`,
      blocker_keys: ["final_quote_confirmation"]
    };
  }

  return {
    status: "blocked",
    text:
      language === "zh"
        ? "当前没有可验证的实时报价字段，不能自动生成正式价格。"
        : "There is no verified live pricing field available, so the system cannot generate a firm quote automatically.",
    blocker_keys: ["price", "currency_confirmation"],
    related_products: productContexts.map((item) => item.product_id)
  };
}

function buildLeadTimeSection(language, input) {
  const leadTimeContext =
    normalizeString(input.expected_lead_time) ||
    normalizeString(input.lead_time_context);
  if (leadTimeContext) {
    return {
      status: "contextual_only",
      text:
        language === "zh"
          ? `当前仅有人工补充的交期背景：${leadTimeContext}。最终交期仍需人工确认。`
          : `Current lead-time context is manually supplied: ${leadTimeContext}. Final lead time still requires human confirmation.`,
      blocker_keys: ["final_lead_time_confirmation"]
    };
  }

  return {
    status: "blocked",
    text:
      language === "zh"
        ? "当前没有已验证的交期数据源，不能自动承诺交期。"
        : "There is no verified lead-time data source, so the system cannot commit a delivery schedule automatically.",
    blocker_keys: ["lead_time"]
  };
}

function buildMockupRequest(language, input, productContexts) {
  const mockupNeeded = detectNeedsMockup(input.inquiry_text) || Boolean(input.mockup_required);
  const assetRequirements = [];

  if (!normalizeString(input.logo_file_reference)) {
    assetRequirements.push(
      language === "zh"
        ? "需客户提供 logo / artwork 源文件"
        : "Customer logo / artwork source file is required"
    );
  }

  if (!normalizeString(input.color_requirement)) {
    assetRequirements.push(
      language === "zh"
        ? "需补充颜色 / 工艺要求"
        : "Color / finish requirement needs confirmation"
    );
  }

  if (!normalizeString(input.mockup_scene)) {
    assetRequirements.push(
      language === "zh"
        ? "需确认效果图场景或展示用途"
        : "Mockup scene / usage context needs confirmation"
    );
  }

  return {
    needed: mockupNeeded,
    mockup_request:
      mockupNeeded
        ? language === "zh"
          ? "生成效果图需求包，由人工或设计工具继续执行。"
          : "Prepare a mockup requirement pack for manual or design-tool follow-up."
        : language === "zh"
          ? "当前询盘文本未明确要求效果图。"
          : "The current inquiry does not explicitly request a mockup.",
    visual_requirements: mockupNeeded
      ? [
          language === "zh"
            ? "展示 logo 位置和印刷方式"
            : "Show logo placement and print method",
          language === "zh"
            ? "尽量保留真实材质与开合结构"
            : "Keep real material and closure structure visible"
        ]
      : [],
    asset_requirements: assetRequirements,
    product_references: productContexts.map((item) => ({
      product_id: item.product_id,
      subject: item.subject,
      pc_detail_url: item.pc_detail_url
    }))
  };
}

function buildReplyBody({
  language,
  productContexts,
  inquiryText,
  quantity,
  destination,
  priceSection,
  leadTimeSection
}) {
  const productBullets = productContexts
    .map((item) => {
      const details = [
        item.subject,
        item.group_name,
        item.description_available
          ? language === "zh"
            ? "详情已存在"
            : "description available"
          : language === "zh"
            ? "详情待补"
            : "description needs improvement"
      ].filter(Boolean);
      return `- ${details.join(" | ")}`;
    })
    .join("\n");

  if (language === "zh") {
    return [
      `询盘摘要：${normalizeString(inquiryText) || "待人工补充询盘原文"}`,
      quantity ? `需求数量：${quantity}` : "需求数量：待确认",
      destination ? `目的地：${destination}` : "目的地：待确认",
      productBullets ? `产品参考：\n${productBullets}` : "产品参考：当前未绑定有效产品",
      `价格说明：${priceSection.text}`,
      `交期说明：${leadTimeSection.text}`
    ].join("\n\n");
  }

  return [
    `Inquiry summary: ${normalizeString(inquiryText) || "Inquiry text needs manual input."}`,
    quantity ? `Requested quantity: ${quantity}` : "Requested quantity: to be confirmed.",
    destination ? `Destination: ${destination}` : "Destination: to be confirmed.",
    productBullets ? `Product references:\n${productBullets}` : "Product references: no valid product linked yet.",
    `Price note: ${priceSection.text}`,
    `Lead time note: ${leadTimeSection.text}`
  ].join("\n\n");
}

function buildReplyClosing(language, missingContext) {
  if (language === "zh") {
    return missingContext.length > 0
      ? `请优先补充以下信息后再发送正式回复：${missingContext.join("、")}。`
      : "如需继续推进报价或打样，请在发送前由人工复核最终价格、交期和视觉要求。";
  }

  return missingContext.length > 0
    ? `Please confirm the following items before sending a formal reply: ${missingContext.join(", ")}.`
    : "Please let a human reviewer confirm the final quote, lead time and visual requirements before sending.";
}

function buildEscalationRecommendation(language, missingContext, riskFlags) {
  if (language === "zh") {
    return {
      level: missingContext.length > 0 || riskFlags.length > 0 ? "high" : "medium",
      recommendation:
        missingContext.length > 0
          ? "先人工补齐价格、交期、客户身份或目的地等关键信息，再决定是否进入正式回复。"
          : "先人工复核产品细节、价格承诺和效果图要求，再人工发送。"
    };
  }

  return {
    level: missingContext.length > 0 || riskFlags.length > 0 ? "high" : "medium",
    recommendation:
      missingContext.length > 0
        ? "A human should fill in pricing, lead time, customer identity or destination details before a formal reply is sent."
        : "A human should review product details, pricing commitments and mockup requirements before sending."
  };
}

function buildReplyWorkflowLayers({
  language,
  input,
  validProductContexts,
  priceSection,
  leadTimeSection,
  mockupRequest
}) {
  const hardBlockers = [];
  const softBlockers = [];
  const assumptions = [];
  const followUpQuestions = [];
  const handoffFields = [];

  const pushBlocker = (collection, blocker) => {
    collection.push(blocker);
    if (blocker.follow_up_question) {
      followUpQuestions.push(blocker.follow_up_question);
    }
    handoffFields.push({
      field: blocker.required_field,
      label: blocker.label,
      reason: blocker.reason,
      source: "human_input_required"
    });
  };

  if (!normalizeString(input.inquiry_text)) {
    pushBlocker(
      hardBlockers,
      buildBlockerItem({
        key: "inquiry_text",
        label: language === "zh" ? "询盘原文" : "Inquiry text",
        reason:
          language === "zh"
            ? "没有询盘原文，无法生成可靠回复。"
            : "No inquiry text was provided, so the system cannot build a reliable reply draft.",
        followUpQuestion:
          language === "zh"
            ? "请提供客户原始询盘内容。"
            : "Please provide the original customer inquiry text."
      })
    );
  }

  if (priceSection.status !== "available") {
    pushBlocker(
      hardBlockers,
      buildBlockerItem({
        key: "final_quote",
        label: language === "zh" ? "最终报价" : "Final quote",
        reason: priceSection.text,
        followUpQuestion:
          language === "zh"
            ? "请确认最终报价、币种和报价口径。"
            : "Please confirm the final quote, currency and quote basis.",
        requiredField: "price.quote_confirmation"
      })
    );
  }

  if (leadTimeSection.status !== "available") {
    pushBlocker(
      hardBlockers,
      buildBlockerItem({
        key: "lead_time",
        label: language === "zh" ? "交期确认" : "Lead time confirmation",
        reason: leadTimeSection.text,
        followUpQuestion:
          language === "zh"
            ? "请确认样品期、量产期和起算条件。"
            : "Please confirm sample lead time, production lead time and the start condition.",
        requiredField: "delivery.lead_time_confirmation"
      })
    );
  }

  if (!normalizeString(input.destination) && !normalizeString(input.destination_country)) {
    pushBlocker(
      softBlockers,
      buildBlockerItem({
        key: "destination_country",
        label: language === "zh" ? "目的国" : "Destination country",
        reason:
          language === "zh"
            ? "没有目的国信息，物流、包装和时效建议会受限。"
            : "Destination is missing, so logistics and delivery suggestions stay generic.",
        followUpQuestion:
          language === "zh"
            ? "请确认目的国或目的港。"
            : "Please confirm the destination country or destination port."
      })
    );
  }

  if (validProductContexts.length === 0) {
    pushBlocker(
      softBlockers,
      buildBlockerItem({
        key: "product_context",
        label: language === "zh" ? "产品上下文" : "Product context",
        reason:
          language === "zh"
            ? "当前没有稳定的产品上下文，回复只能保持泛化。"
            : "No stable product context is available, so the reply will stay generic.",
        followUpQuestion:
          language === "zh"
            ? "请补充 product_id 或至少提供产品名称/链接。"
            : "Please provide product_id or at least the product name / product link."
      })
    );
  }

  if (!normalizeString(input.quantity)) {
    pushBlocker(
      softBlockers,
      buildBlockerItem({
        key: "quantity",
        label: language === "zh" ? "需求数量" : "Requested quantity",
        reason:
          language === "zh"
            ? "没有数量信息，价格和交期只能保持保守表述。"
            : "Quantity is missing, so quote and lead-time statements must stay conservative.",
        followUpQuestion:
          language === "zh"
            ? "请确认目标采购数量。"
            : "Please confirm the target quantity."
      })
    );
  }

  const customerProfile = input.customer_profile && typeof input.customer_profile === "object"
    ? input.customer_profile
    : {};
  if (!normalizeString(customerProfile.company_name) && !normalizeString(customerProfile.contact_name)) {
    pushBlocker(
      softBlockers,
      buildBlockerItem({
        key: "customer_profile",
        label: language === "zh" ? "客户身份" : "Customer identity",
        reason:
          language === "zh"
            ? "当前没有客户身份信息，称呼与商务判断会偏保守。"
            : "Customer identity is missing, so greeting and business judgement stay conservative.",
        followUpQuestion:
          language === "zh"
            ? "请补充客户公司名、联系人或买家画像。"
            : "Please provide buyer company name, contact name or customer profile."
      })
    );
  }

  if (mockupRequest.needed) {
    for (const requirement of mockupRequest.asset_requirements) {
      pushBlocker(
        softBlockers,
        buildBlockerItem({
          key: "mockup_assets",
          label: language === "zh" ? "效果图所需素材" : "Mockup assets",
          reason: requirement,
          followUpQuestion:
            language === "zh"
              ? "请补充 logo、工艺、颜色或展示场景素材。"
              : "Please provide logo, finish, color or scene assets for the mockup package.",
          requiredField: "mockup_request.asset_requirements"
        })
      );
    }
  }

  assumptions.push(
    language === "zh"
      ? "当前草稿只用于外部工作流，不会自动发送平台内回复。"
      : "This draft is for the external workflow only and will not send any platform reply automatically."
  );
  assumptions.push(
    language === "zh"
      ? "如无明确语言偏好，系统默认使用英文草稿。"
      : "If language preference is not explicit, the system defaults to English."
  );
  if (!normalizeString(input.target_price)) {
    assumptions.push(
      language === "zh"
        ? "当前没有实时价格源，系统不会自动给出正式报价。"
        : "There is no verified live pricing source, so the system does not produce a firm quote."
    );
  }
  if (!normalizeString(input.lead_time_context) && !normalizeString(input.expected_lead_time)) {
    assumptions.push(
      language === "zh"
        ? "当前没有已验证交期源，交期只能保持待人工确认。"
        : "There is no verified lead-time source, so lead time remains subject to manual confirmation."
    );
  }

  return {
    hard_blockers: hardBlockers,
    soft_blockers: softBlockers,
    assumptions: [...new Set(assumptions)],
    follow_up_questions: [...new Set(followUpQuestions)],
    handoff_fields: handoffFields
  };
}

async function resolveProductContext(clientConfig, productId) {
  const listResult = await fetchWikaProductList(clientConfig, {
    id: productId,
    page_size: 1
  });
  const listItem = Array.isArray(listResult?.items) ? listResult.items[0] : null;
  const detailResult = await fetchAlibabaOfficialProductDetail(
    {
      account: "wika",
      ...clientConfig
    },
    {
      product_id: productId
    }
  );
  const scoreResult = await fetchAlibabaOfficialProductScore(
    {
      account: "wika",
      ...clientConfig
    },
    {
      product_id: productId
    }
  );

  let groupResult = null;
  if (listItem?.group_id) {
    try {
      groupResult = await fetchAlibabaOfficialProductGroups(
        {
          account: "wika",
          ...clientConfig
        },
        {
          group_id: listItem.group_id
        }
      );
    } catch {
      groupResult = null;
    }
  }

  let renderResult = null;
  const categoryId = detailResult?.product?.category_id ?? listItem?.category_id ?? null;
  if (categoryId) {
    try {
      renderResult = await fetchAlibabaOfficialProductSchemaRender(
        {
          account: "wika",
          ...clientConfig
        },
        {
          cat_id: categoryId,
          product_id: productId
        }
      );
    } catch {
      renderResult = null;
    }
  }

  return {
    product_id: normalizeString(productId),
    subject: detailResult?.product?.subject ?? listItem?.subject ?? null,
    category_id: categoryId,
    group_id: listItem?.group_id ?? null,
    group_name:
      listItem?.group_name ??
      groupResult?.product_group?.group_name ??
      null,
    description_available: Boolean(normalizeString(detailResult?.product?.description)),
    keywords: Array.isArray(detailResult?.product?.keywords)
      ? detailResult.product.keywords
      : normalizeKeywordValues(detailResult?.product?.keywords),
    pc_detail_url: detailResult?.product?.pc_detail_url ?? null,
    gmt_modified: detailResult?.product?.gmt_modified ?? listItem?.gmt_modified ?? null,
    final_score:
      typeof scoreResult?.result?.final_score === "number"
        ? scoreResult.result.final_score
        : Number.isFinite(Number(scoreResult?.result?.final_score))
          ? Number(scoreResult.result.final_score)
          : null,
    boutique_tag: Boolean(scoreResult?.result?.boutique_tag),
    problem_hints: topProblemEntries(scoreResult?.result?.problem_map),
    main_image_url: extractPrimaryImageUrl(detailResult?.product?.main_image),
    schema_render_summary: renderResult
      ? {
          cat_id: categoryId,
          field_count: renderResult.response_meta?.render_field_count ?? null
        }
      : null
  };
}

export async function buildWikaExternalReplyDraftPackage(clientConfig, input = {}) {
  const language = pickLanguage(input);
  const productIds = normalizeProductIds(input);
  const quantity = normalizeString(input.quantity);
  const destination =
    normalizeString(input.destination) ||
    normalizeString(input.destination_country);
  const customerProfile = input.customer_profile && typeof input.customer_profile === "object"
    ? input.customer_profile
    : {};

  const productDiagnostic = await fetchWikaProductMinimalDiagnostic(clientConfig, {
    product_page_size: Math.max(12, productIds.length || 1),
    product_score_limit: Math.max(8, productIds.length || 1),
    product_detail_limit: Math.max(8, productIds.length || 1)
  });

  const productContexts = [];
  for (const productId of productIds) {
    try {
      productContexts.push(await resolveProductContext(clientConfig, productId));
    } catch {
      productContexts.push({
        product_id: productId,
        lookup_failed: true
      });
    }
  }

  const validProductContexts = productContexts.filter((item) => !item.lookup_failed);
  const priceSection = buildPriceSection(language, input, validProductContexts);
  const leadTimeSection = buildLeadTimeSection(language, input);
  const mockupRequest = buildMockupRequest(language, input, validProductContexts);

  const workflowLayers = buildReplyWorkflowLayers({
    language,
    input,
    validProductContexts,
    priceSection,
    leadTimeSection,
    mockupRequest
  });
  const missingContext = [
    ...workflowLayers.hard_blockers.map((item) => item.key),
    ...workflowLayers.soft_blockers.map((item) => item.key)
  ];

  const riskFlags = [
    "platform_reply_unavailable",
    ...(
      validProductContexts.some((item) => item.description_available === false)
        ? ["product_content_gap"]
        : []
    ),
    ...(mockupRequest.needed && mockupRequest.asset_requirements.length > 0
      ? ["mockup_assets_missing"]
      : [])
  ];

  const escalationRecommendation = buildEscalationRecommendation(
    language,
    missingContext,
    riskFlags
  );

  const alertPayload =
    missingContext.length > 0
      ? buildWikaParameterMissingAlert({
          stageName: "external_reply_draft_workflow",
          relatedApis: [
            "alibaba.seller.customer.batch.get",
            "alibaba.seller.customer.get"
          ],
          relatedModules: [
            "external_reply_draft",
            "wika_minimal_product_diagnostic"
          ],
          evidence: [
            "External reply draft generated from existing read-side signals only.",
            "Current platform reply path is still unavailable or unverified.",
            `Missing context: ${missingContext.join(", ")}`
          ],
          userNeeds: missingContext,
          suggestedNextSteps: [
            "Manually confirm final quote and lead time before sending.",
            "Provide destination, customer identity and artwork files if a mockup is required."
          ],
          inputSummary: {
            product_ids: productIds,
            quantity: quantity || null,
            destination: destination || null
          }
        })
      : buildWikaNoEntryAlert({
          stageName: "external_reply_draft_workflow",
          relatedApis: [],
          relatedModules: ["external_reply_draft"],
          evidence: [
            "No verified platform-native reply send path is available in the current WIKA mainline."
          ],
          userNeeds: ["manual_send"],
          suggestedNextSteps: [
            "Use this draft as an external working draft only.",
            "Let a human send the final reply."
          ],
          inputSummary: {
            product_ids: productIds
          }
        });

  return {
    ok: missingContext.length === 0,
    account: "wika",
    workflow_type: "external_reply_draft",
    reply_draft: {
      subject: buildReplySubject(language, validProductContexts),
      opening: buildReplyOpening(language, customerProfile),
      body: buildReplyBody({
        language,
        productContexts: validProductContexts,
        inquiryText: input.inquiry_text,
        quantity,
        destination,
        priceSection,
        leadTimeSection
      }),
      closing: buildReplyClosing(language, missingContext),
      price_information: priceSection,
      product_support: buildProductSupport(validProductContexts, language),
      lead_time_guidance: leadTimeSection,
      mockup_request: mockupRequest,
      risk_flags: riskFlags,
      escalation_recommendation: escalationRecommendation
    },
    input_summary: {
      inquiry_text_present: Boolean(normalizeString(input.inquiry_text)),
      product_ids: productIds,
      quantity: quantity || null,
      destination_country: destination || null,
      target_price: normalizeString(input.target_price) || null,
      expected_lead_time: normalizeString(input.expected_lead_time) || normalizeString(input.lead_time_context) || null,
      language,
      customer_profile_present:
        Boolean(normalizeString(customerProfile.company_name)) ||
        Boolean(normalizeString(customerProfile.contact_name))
    },
    available_context: {
      product_context_count: validProductContexts.length,
      has_product_diagnostic: Boolean(productDiagnostic),
      has_price_reference: Boolean(normalizeString(input.target_price)),
      has_destination: Boolean(destination),
      has_quantity: Boolean(quantity),
      has_customer_profile:
        Boolean(normalizeString(customerProfile.company_name)) ||
        Boolean(normalizeString(customerProfile.contact_name)),
      has_mockup_signal: Boolean(mockupRequest.needed)
    },
    missing_context: missingContext,
    hard_blockers: workflowLayers.hard_blockers,
    soft_blockers: workflowLayers.soft_blockers,
    assumptions: workflowLayers.assumptions,
    follow_up_questions: workflowLayers.follow_up_questions,
    mockup_request: mockupRequest,
    escalation_recommendation: escalationRecommendation,
    handoff_fields: workflowLayers.handoff_fields,
    alert_payload: alertPayload,
    workflow_meta: {
      generated_at: new Date().toISOString(),
      available_context: {
        inquiry_text: Boolean(normalizeString(input.inquiry_text)),
        product_context_count: validProductContexts.length,
        quantity: quantity || null,
        destination: destination || null,
        language_preference: language,
        product_diagnostic_sample_size: productDiagnostic.sample_size?.product_snapshot_count ?? null
      },
      missing_context: missingContext,
      confidence: missingContext.length >= 3 ? "low" : "medium",
      risk_level: missingContext.length > 0 || riskFlags.length > 0 ? "high" : "medium",
      human_action_required: true,
      alert_payload: alertPayload
    },
    supporting_context: {
      inquiry_text: normalizeString(input.inquiry_text) || null,
      customer_profile: customerProfile,
      product_diagnostic_snapshot: {
        available_signals: productDiagnostic.available_signals,
        score_summary: productDiagnostic.score_summary,
        content_completeness_findings:
          productDiagnostic.content_completeness_findings,
        structure_findings: productDiagnostic.structure_findings
      }
    },
    warnings: [
      "This package is an external draft only and does not send any platform reply.",
      "Price, lead time and mockup commitments still require human confirmation."
    ]
  };
}
