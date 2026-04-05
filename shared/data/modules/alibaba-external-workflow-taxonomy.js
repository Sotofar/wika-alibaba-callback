import { WIKA_EXTERNAL_WORKFLOW_TEMPLATE_VERSION } from "./alibaba-external-workflow-governance.js";

export { WIKA_EXTERNAL_WORKFLOW_TEMPLATE_VERSION };

export const WIKA_WORKFLOW_BLOCKER_TAXONOMY_VERSION =
  "2026-04-05.taxonomy-v1";

export const WIKA_WORKFLOW_BLOCKER_TAXONOMY = {
  missing_inquiry_text: {
    code: "missing_inquiry_text",
    applies_to: ["reply"],
    level: "hard",
    definition: "缺少原始询盘文本，系统无法形成可靠回复草稿。",
    next_human_action: "补充客户原始询盘内容后再重新生成回复草稿。",
    draft_can_still_be_produced: false,
    handoff_mandatory: true
  },
  missing_final_quote: {
    code: "missing_final_quote",
    applies_to: ["reply"],
    level: "hard",
    definition: "缺少最终报价确认，系统不能自动承诺正式价格。",
    next_human_action: "人工确认最终报价、币种和报价口径。",
    draft_can_still_be_produced: true,
    handoff_mandatory: true
  },
  missing_lead_time: {
    code: "missing_lead_time",
    applies_to: ["reply", "order"],
    level: "hard",
    definition: "缺少已确认交期，系统不能自动承诺最终交付时间。",
    next_human_action: "人工确认打样期、量产期和起算条件。",
    draft_can_still_be_produced: true,
    handoff_mandatory: true
  },
  missing_destination_country: {
    code: "missing_destination_country",
    applies_to: ["reply", "order"],
    level: "soft",
    definition: "缺少目的国或目的港信息，物流和报价建议只能保守输出。",
    next_human_action: "人工确认目的国、目的港或目标市场。",
    draft_can_still_be_produced: true,
    handoff_mandatory: false
  },
  missing_product_context: {
    code: "missing_product_context",
    applies_to: ["reply"],
    level: "soft",
    definition: "缺少稳定产品上下文，系统只能输出泛化回复草稿。",
    next_human_action: "补充 product_id、产品链接或准确产品名称。",
    draft_can_still_be_produced: true,
    handoff_mandatory: false
  },
  missing_quantity: {
    code: "missing_quantity",
    applies_to: ["reply"],
    level: "soft",
    definition: "缺少数量，价格和交期只能保守表达。",
    next_human_action: "人工确认询盘数量、MOQ 或打样数量。",
    draft_can_still_be_produced: true,
    handoff_mandatory: false
  },
  missing_customer_profile: {
    code: "missing_customer_profile",
    applies_to: ["reply"],
    level: "soft",
    definition: "缺少客户身份信息，问候语和商务判断会偏保守。",
    next_human_action: "补充客户公司、联系人、地区或客户画像。",
    draft_can_still_be_produced: true,
    handoff_mandatory: false
  },
  missing_mockup_assets: {
    code: "missing_mockup_assets",
    applies_to: ["reply"],
    level: "soft",
    definition: "缺少 logo、工艺、颜色或场景素材，效果图需求包无法进入执行。",
    next_human_action: "向客户收集 logo、工艺、颜色和 mockup 场景要求。",
    draft_can_still_be_produced: true,
    handoff_mandatory: false
  },
  missing_buyer_company: {
    code: "missing_buyer_company",
    applies_to: ["order"],
    level: "hard",
    definition: "缺少买家公司主体，订单草稿不能作为可执行商务包继续推进。",
    next_human_action: "人工确认买家公司名称和主体身份。",
    draft_can_still_be_produced: true,
    handoff_mandatory: true
  },
  missing_buyer_contact: {
    code: "missing_buyer_contact",
    applies_to: ["order"],
    level: "hard",
    definition: "缺少买家联系人，后续人工跟进对象不明确。",
    next_human_action: "人工确认买家联系人姓名。",
    draft_can_still_be_produced: true,
    handoff_mandatory: true
  },
  missing_buyer_email: {
    code: "missing_buyer_email",
    applies_to: ["order"],
    level: "hard",
    definition: "缺少买家邮箱，无法形成可交付的外部报价或订单包。",
    next_human_action: "补充买家正式邮箱或其他正式联系渠道。",
    draft_can_still_be_produced: true,
    handoff_mandatory: true
  },
  missing_line_items: {
    code: "missing_line_items",
    applies_to: ["order"],
    level: "hard",
    definition: "缺少行项目，订单草稿无法成立。",
    next_human_action: "补充至少一行产品、SKU 或数量信息。",
    draft_can_still_be_produced: false,
    handoff_mandatory: true
  },
  missing_line_item_quantity: {
    code: "missing_line_item_quantity",
    applies_to: ["order"],
    level: "hard",
    definition: "缺少行项目数量，无法形成有效订单草稿或报价包。",
    next_human_action: "人工确认每个行项目的数量。",
    draft_can_still_be_produced: true,
    handoff_mandatory: true
  },
  missing_line_item_unit_price: {
    code: "missing_line_item_unit_price",
    applies_to: ["order"],
    level: "hard",
    definition: "缺少行项目单价，订单草稿不能转为可执行报价包。",
    next_human_action: "人工确认每个行项目的单价。",
    draft_can_still_be_produced: true,
    handoff_mandatory: true
  },
  missing_total_amount: {
    code: "missing_total_amount",
    applies_to: ["order"],
    level: "hard",
    definition: "缺少总价，订单草稿不能形成商务确认包。",
    next_human_action: "人工确认订单总价或汇总报价。",
    draft_can_still_be_produced: true,
    handoff_mandatory: true
  },
  missing_advance_amount: {
    code: "missing_advance_amount",
    applies_to: ["order"],
    level: "soft",
    definition: "缺少预付款安排，付款条款仍需人工补充。",
    next_human_action: "人工确认定金比例或预付款金额。",
    draft_can_still_be_produced: true,
    handoff_mandatory: false
  },
  missing_trade_term: {
    code: "missing_trade_term",
    applies_to: ["order"],
    level: "soft",
    definition: "缺少贸易术语，物流和价格责任边界仍不明确。",
    next_human_action: "人工确认 FOB / CIF / EXW 等贸易术语。",
    draft_can_still_be_produced: true,
    handoff_mandatory: false
  },
  missing_shipment_method: {
    code: "missing_shipment_method",
    applies_to: ["order"],
    level: "soft",
    definition: "缺少出运方式，物流假设只能保持泛化。",
    next_human_action: "人工确认海运、空运或快递等出运方式。",
    draft_can_still_be_produced: true,
    handoff_mandatory: false
  }
};

export const WIKA_WORKFLOW_BLOCKER_USAGE_MATRIX = Object.values(
  WIKA_WORKFLOW_BLOCKER_TAXONOMY
).map((entry) => ({
  code: entry.code,
  applies_to: entry.applies_to,
  hard_or_soft: entry.level,
  draft_can_still_be_produced: entry.draft_can_still_be_produced,
  handoff_mandatory: entry.handoff_mandatory,
  next_human_action: entry.next_human_action
}));

export function getWikaWorkflowBlockerDefinition(blockerCode) {
  return (
    WIKA_WORKFLOW_BLOCKER_TAXONOMY[blockerCode] || {
      code: blockerCode,
      applies_to: ["reply", "order"],
      level: "soft",
      definition: "当前 blocker 未归入细化 taxonomy，需要人工复核。",
      next_human_action: "人工复核当前 blocker 并补充关键信息。",
      draft_can_still_be_produced: true,
      handoff_mandatory: false
    }
  );
}

export function buildWikaWorkflowBlocker({
  key,
  blockerCode,
  label,
  reason,
  followUpQuestion,
  requiredField = null,
  missingReason = null
}) {
  const taxonomy = getWikaWorkflowBlockerDefinition(blockerCode);

  return {
    key,
    label,
    reason,
    follow_up_question: followUpQuestion,
    required_field: requiredField || key,
    blocker_code: taxonomy.code,
    blocker_reason: reason,
    blocker_next_action: taxonomy.next_human_action,
    blocker_level: taxonomy.level,
    blocker_definition: taxonomy.definition,
    applies_to: taxonomy.applies_to,
    draft_can_still_be_produced: taxonomy.draft_can_still_be_produced,
    handoff_mandatory: taxonomy.handoff_mandatory,
    field_meta: {
      source: "human_input_required",
      confidence: "high",
      missing_reason: missingReason || reason
    }
  };
}

export function buildWikaWorkflowHandoffField(blocker, extras = {}) {
  return {
    field: blocker.required_field,
    label: blocker.label,
    reason: blocker.reason,
    source: blocker.field_meta?.source || "human_input_required",
    confidence: blocker.field_meta?.confidence || "high",
    missing_reason: blocker.field_meta?.missing_reason || blocker.reason,
    blocker_code: blocker.blocker_code,
    blocker_level: blocker.blocker_level,
    blocker_next_action: blocker.blocker_next_action,
    handoff_mandatory: blocker.handoff_mandatory ?? false,
    draft_can_still_be_produced:
      blocker.draft_can_still_be_produced ?? true,
    ...extras
  };
}

export function dedupeStrings(values = []) {
  return [...new Set(values.filter(Boolean))];
}
