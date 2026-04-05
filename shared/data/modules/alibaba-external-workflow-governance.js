export const WIKA_EXTERNAL_WORKFLOW_TEMPLATE_VERSION = "2026-04-05.sop-v1";
export const WIKA_EXTERNAL_DRAFT_REVIEW_VERSION = "2026-04-05.review-v1";

export const WIKA_EXTERNAL_WORKFLOW_TEMPLATE_CHANGELOG = [
  {
    version: "2026-04-05.sop-v1",
    scope: "reply / order external workflow",
    summary:
      "Stage 15 stabilized workflow profiles, blocker taxonomy, handoff checklist and manual completion SOP without introducing any platform-side execution."
  }
];

export const WIKA_REPLY_WORKFLOW_PROFILES = {
  reply_minimal_handoff: {
    code: "reply_minimal_handoff",
    label: "最小上下文交接",
    applies_to: "reply",
    input_expectation:
      "只有询盘文本或极少上下文，需要先人工补齐再决定是否可发送。",
    common_blockers: [
      "missing_inquiry_text",
      "missing_product_context",
      "missing_customer_profile",
      "missing_destination_country"
    ]
  },
  reply_quote_confirmation_needed: {
    code: "reply_quote_confirmation_needed",
    label: "报价确认型回复草稿",
    applies_to: "reply",
    input_expectation:
      "已有基本产品和客户上下文，但价格和交期仍需人工确认。",
    common_blockers: [
      "missing_final_quote",
      "missing_lead_time",
      "missing_quantity"
    ]
  },
  reply_mockup_customization: {
    code: "reply_mockup_customization",
    label: "定制 / 效果图回复草稿",
    applies_to: "reply",
    input_expectation:
      "存在定制、logo 或 mockup 需求，需要同步收集素材和工艺信息。",
    common_blockers: [
      "missing_mockup_assets",
      "missing_final_quote",
      "missing_lead_time"
    ]
  }
};

export const WIKA_ORDER_WORKFLOW_PROFILES = {
  order_minimal_handoff: {
    code: "order_minimal_handoff",
    label: "最小订单交接包",
    applies_to: "order",
    input_expectation:
      "只有基础行项目或极少买家信息，必须先人工补单再继续。",
    common_blockers: [
      "missing_buyer_company",
      "missing_line_items",
      "missing_line_item_quantity"
    ]
  },
  order_quote_confirmation_needed: {
    code: "order_quote_confirmation_needed",
    label: "报价确认型订单草稿",
    applies_to: "order",
    input_expectation:
      "已有买家和行项目，但价格、总价、交期仍需人工确认。",
    common_blockers: [
      "missing_line_item_unit_price",
      "missing_total_amount",
      "missing_lead_time"
    ]
  },
  order_commercial_review: {
    code: "order_commercial_review",
    label: "商务复核型订单草稿",
    applies_to: "order",
    input_expectation:
      "主要商务字段已具备，可作为人工复核和补单底稿继续处理。",
    common_blockers: [
      "missing_advance_amount",
      "missing_trade_term",
      "missing_shipment_method"
    ]
  }
};

export const WIKA_WORKFLOW_PROFILE_COVERAGE_MATRIX = [
  ...Object.values(WIKA_REPLY_WORKFLOW_PROFILES),
  ...Object.values(WIKA_ORDER_WORKFLOW_PROFILES)
].map((profile) => ({
  code: profile.code,
  applies_to: profile.applies_to,
  label: profile.label,
  input_expectation: profile.input_expectation,
  common_blockers: profile.common_blockers
}));

export function getWikaReplyWorkflowProfileDefinition(profileCode) {
  return WIKA_REPLY_WORKFLOW_PROFILES[profileCode] || null;
}

export function getWikaOrderWorkflowProfileDefinition(profileCode) {
  return WIKA_ORDER_WORKFLOW_PROFILES[profileCode] || null;
}

export function getWikaWorkflowProfileDefinition(workflowType, profileCode) {
  if (workflowType === "reply") {
    return getWikaReplyWorkflowProfileDefinition(profileCode);
  }

  if (workflowType === "order") {
    return getWikaOrderWorkflowProfileDefinition(profileCode);
  }

  return null;
}

export function getWikaExternalWorkflowTemplateChangelog(version) {
  return (
    WIKA_EXTERNAL_WORKFLOW_TEMPLATE_CHANGELOG.find(
      (entry) => entry.version === version
    ) || null
  );
}
