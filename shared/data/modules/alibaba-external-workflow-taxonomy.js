export const WIKA_EXTERNAL_WORKFLOW_TEMPLATE_VERSION = "2026-04-05.sop-v1";

export const WIKA_WORKFLOW_BLOCKER_TAXONOMY = {
  missing_inquiry_text: {
    code: "missing_inquiry_text",
    level: "hard",
    definition: "缺少原始询盘文本，系统无法形成可靠回复草稿。",
    next_human_action: "补充客户原始询盘内容，再重新生成回复草稿。",
    draft_can_still_be_produced: false,
    handoff_mandatory: true
  },
  missing_final_quote: {
    code: "missing_final_quote",
    level: "hard",
    definition: "缺少最终报价确认，系统不能自动承诺可发送的正式价格。",
    next_human_action: "人工确认最终报价、币种和报价口径。",
    draft_can_still_be_produced: true,
    handoff_mandatory: true
  },
  missing_lead_time: {
    code: "missing_lead_time",
    level: "hard",
    definition: "缺少已确认交期，系统不能自动承诺可发送的最终交期。",
    next_human_action: "人工确认样品期、量产期和起算条件。",
    draft_can_still_be_produced: true,
    handoff_mandatory: true
  },
  missing_destination_country: {
    code: "missing_destination_country",
    level: "soft",
    definition: "缺少目的国或目的港信息，物流、报价和时效建议只能保持保守。",
    next_human_action: "人工确认目的国、目的港或目标市场。",
    draft_can_still_be_produced: true,
    handoff_mandatory: false
  },
  missing_product_context: {
    code: "missing_product_context",
    level: "soft",
    definition: "缺少稳定产品上下文，系统只能输出泛化回复草稿。",
    next_human_action: "人工补充 product_id、产品链接或产品名称。",
    draft_can_still_be_produced: true,
    handoff_mandatory: false
  },
  missing_quantity: {
    code: "missing_quantity",
    level: "soft",
    definition: "缺少数量，报价和交期只能保守表达。",
    next_human_action: "人工确认询盘数量、MOQ 或打样数量。",
    draft_can_still_be_produced: true,
    handoff_mandatory: false
  },
  missing_customer_profile: {
    code: "missing_customer_profile",
    level: "soft",
    definition: "缺少客户身份信息，问候语和商务判断会偏保守。",
    next_human_action: "人工补充客户公司、联系人、地区或客户画像。",
    draft_can_still_be_produced: true,
    handoff_mandatory: false
  },
  missing_mockup_assets: {
    code: "missing_mockup_assets",
    level: "soft",
    definition: "缺少 logo、工艺、颜色或场景素材，效果图需求包无法进入执行。",
    next_human_action: "人工向客户收集 logo、工艺、颜色和 mockup 场景要求。",
    draft_can_still_be_produced: true,
    handoff_mandatory: false
  },
  missing_buyer_company: {
    code: "missing_buyer_company",
    level: "hard",
    definition: "缺少买家公司身份，订单草稿不能作为可执行商务包继续推进。",
    next_human_action: "人工确认买家公司名称和主体身份。",
    draft_can_still_be_produced: true,
    handoff_mandatory: true
  },
  missing_buyer_contact: {
    code: "missing_buyer_contact",
    level: "hard",
    definition: "缺少买家联系人，后续人工跟进和回传对象不明确。",
    next_human_action: "人工确认买家联系人姓名。",
    draft_can_still_be_produced: true,
    handoff_mandatory: true
  },
  missing_buyer_email: {
    code: "missing_buyer_email",
    level: "hard",
    definition: "缺少买家邮箱，无法形成可交付的人工报价或订单包。",
    next_human_action: "人工补充买家邮箱或其他正式联系渠道。",
    draft_can_still_be_produced: true,
    handoff_mandatory: true
  },
  missing_line_items: {
    code: "missing_line_items",
    level: "hard",
    definition: "缺少行项目，订单草稿无法成立。",
    next_human_action: "人工补充至少一行产品、SKU 或数量信息。",
    draft_can_still_be_produced: false,
    handoff_mandatory: true
  },
  missing_line_item_quantity: {
    code: "missing_line_item_quantity",
    level: "hard",
    definition: "缺少行项目数量，无法形成有效的订单草稿或报价包。",
    next_human_action: "人工确认每个行项目的数量。",
    draft_can_still_be_produced: true,
    handoff_mandatory: true
  },
  missing_line_item_unit_price: {
    code: "missing_line_item_unit_price",
    level: "hard",
    definition: "缺少行项目单价，订单草稿不能转为可执行报价包。",
    next_human_action: "人工确认每个行项目的单价。",
    draft_can_still_be_produced: true,
    handoff_mandatory: true
  },
  missing_total_amount: {
    code: "missing_total_amount",
    level: "hard",
    definition: "缺少总价，订单草稿不能形成商务确认包。",
    next_human_action: "人工确认订单总价或汇总报价。",
    draft_can_still_be_produced: true,
    handoff_mandatory: true
  },
  missing_advance_amount: {
    code: "missing_advance_amount",
    level: "soft",
    definition: "缺少预付款安排，付款条款仍需人工补充。",
    next_human_action: "人工确认定金比例或预付款金额。",
    draft_can_still_be_produced: true,
    handoff_mandatory: false
  },
  missing_trade_term: {
    code: "missing_trade_term",
    level: "soft",
    definition: "缺少贸易术语，物流和价格责任边界仍不明确。",
    next_human_action: "人工确认 FOB / CIF / EXW 等贸易术语。",
    draft_can_still_be_produced: true,
    handoff_mandatory: false
  },
  missing_shipment_method: {
    code: "missing_shipment_method",
    level: "soft",
    definition: "缺少出运方式，物流假设只能保持泛化。",
    next_human_action: "人工确认海运、空运或快递等出运方式。",
    draft_can_still_be_produced: true,
    handoff_mandatory: false
  }
};

export function getWikaWorkflowBlockerDefinition(blockerCode) {
  return (
    WIKA_WORKFLOW_BLOCKER_TAXONOMY[blockerCode] || {
      code: blockerCode,
      level: "soft",
      definition: "当前 blocker 未归入细分 taxonomy，需人工复核。",
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
    ...extras
  };
}

export function dedupeStrings(values = []) {
  return [...new Set(values.filter(Boolean))];
}
