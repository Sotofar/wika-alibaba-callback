export const WIKA_WRITE_BLOCKER_CATEGORIES = Object.freeze([
  {
    code: "permission_blocked",
    label: "权限阻塞",
    description: "官方入口存在，但当前应用或账号没有足够权限继续执行。"
  },
  {
    code: "platform_no_entry",
    label: "平台无入口",
    description: "当前没有识别到稳定、可生产复用的官方入口。"
  },
  {
    code: "parameter_missing",
    label: "参数缺失",
    description: "关键入参、业务参数或必填字段不足，无法继续验证或生成草稿。"
  },
  {
    code: "media_unavailable",
    label: "图片/媒体能力不可用",
    description: "图片上传、素材转存或可用媒体资源缺失，写侧流程无法继续。"
  },
  {
    code: "category_attribute_incomplete",
    label: "类目/属性信息不足",
    description: "缺少类目树、属性结构或必填属性，无法生成可靠 payload 草稿。"
  },
  {
    code: "manual_confirmation_required",
    label: "写操作需要人工确认",
    description: "虽然技术上可继续，但执行会影响真实线上对象，必须先人工确认。"
  },
  {
    code: "high_risk_irreversible",
    label: "高风险或不可逆操作",
    description: "操作可能直接发布、覆盖线上信息或产生无法自动回滚的副作用。"
  }
]);

export const WIKA_HUMAN_HANDOFF_TRIGGERS = Object.freeze([
  {
    code: "live_product_publish",
    label: "真实商品发布",
    description: "任何会创建、发布或上架真实商品的操作，都必须人工接管。"
  },
  {
    code: "live_product_update",
    label: "真实商品修改",
    description: "任何会修改线上商品标题、详情、价格或展示状态的操作，都必须人工接管。"
  },
  {
    code: "missing_category_or_attributes",
    label: "类目或属性不足",
    description: "草稿所需的类目、属性或必填项未补齐时，必须人工确认后续信息来源。"
  },
  {
    code: "media_not_ready",
    label: "媒体资源未就绪",
    description: "缺少可上传素材、效果图或主图资源时，必须人工补充。"
  },
  {
    code: "pricing_or_delivery_uncertain",
    label: "价格或交期不确定",
    description: "写入内容涉及价格、MOQ、交期等承诺字段时，必须人工确认。"
  },
  {
    code: "platform_permission_blocked",
    label: "平台权限阻塞",
    description: "平台返回权限错误时，必须人工介入决定是否申请权限或改走替代方案。"
  },
  {
    code: "irreversible_write_risk",
    label: "不可逆写入风险",
    description: "无法证明存在草稿/测试模式时，必须人工决定是否继续。"
  },
  {
    code: "live_order_create",
    label: "真实订单创建",
    description: "任何会触发真实信保下单或真实订单生成的动作，都必须人工接管。"
  }
]);

const WIKA_LOW_RISK_WRITE_BOUNDARY = Object.freeze({
  photobank_upload: {
    api_name: "alibaba.icbu.photobank.upload",
    actual_api_classification: "业务参数错误（说明已过授权层）",
    low_risk_boundary_proven: false,
    decision: "当前无法证明低风险边界，因此不继续实写验证",
    reasons: [
      "官方文档显示成功响应会生成 file_id 与 photobank_url，属于真实图片银行资产，而不是内存态临时对象。",
      "当前已识别到图片银行查询与分组接口，但没有拿到可证明可清理、可回滚的安全删除边界。",
      "官方明确存在 photobank.group.operate，但成功路径会新增、删除或重命名真实分组；在没有 dry-run、资产删除或清理证据前，不应继续实写验证。",
      "当前无法证明上传后的图片天然非公开、不会被后续商品引用或长期残留。"
    ],
    observable_evidence: {
      media_list_verified: true,
      media_groups_verified: true,
      media_group_operate_verified: true,
      media_group_operate_transport: "/sync + access_token + sha256",
      media_group_operate_result:
        "使用空请求对象调用 photobank.group.operate 时返回业务参数错误（query params is null）。",
      observable_fields: [
        "image.id",
        "image.url",
        "image.file_name",
        "image.reference_count",
        "image.file_size",
        "image.gmt_modified"
      ],
      group_observation: "当前已证明图片银行存在独立查询与分组查询通道，但当前店铺返回的 groups 结构不充分，尚不足以证明可稳定隔离测试素材。",
      official_media_management_methods_seen: [
        "alibaba.icbu.photobank.list",
        "alibaba.icbu.photobank.group.list",
        "alibaba.icbu.photobank.group.operate",
        "alibaba.icbu.photobank.upload"
      ],
      asset_delete_or_cleanup_api_identified: false,
      cleanup_evidence_proven: false
    },
    blocked_automation_fields: [
      "main_image.images",
      "product_sku.attributes[].sku_custom_image_url",
      "product_sku.special_skus[].attributes[].sku_custom_image_url",
      "description_html image urls"
    ],
    allowed_next_step: "仅保留参数/边界分析，不进入真实上传。"
  },
  product_add_draft: {
    api_name: "alibaba.icbu.product.add.draft",
    actual_api_classification: "业务参数错误（说明已过授权层）",
    low_risk_boundary_proven: false,
    decision: "当前无法证明低风险边界，因此不继续实写验证",
    reasons: [
      "官方文档显示成功响应会返回混淆后的 product_id，说明会创建真实草稿对象，而不是纯本地草稿。",
      "官方同时存在 schema.render.draft，说明草稿对象会被平台持久化并进入后续编辑链路。",
      "当前公开官方文档里，除 schema.render.draft 外，没有再识别到明确的 draft 查询 / 删除 / 管理接口。",
      "当前没有拿到可证明草稿天然非公开、可回滚、可清理的稳定边界，因此不应做真实 draft 创建验证。"
    ],
    observable_evidence: {
      draft_render_verified: true,
      draft_render_transport: "/sync + access_token + sha256",
      live_product_render_attempt_result:
        "使用正式商品 product_id 调用 schema.render.draft 时返回 biz_success=false 与 Record does not exist。",
      draft_strictly_distinct_from_live_product: true,
      official_explicit_draft_methods_seen: [
        "alibaba.icbu.product.add.draft",
        "alibaba.icbu.product.schema.render.draft",
        "alibaba.icbu.product.schema.add.draft"
      ],
      additional_draft_query_delete_manage_api_identified: false,
      cleanup_evidence_proven: false
    },
    blocked_automation_fields: [
      "final product create",
      "draft create against live seller account"
    ],
    allowed_next_step: "仅继续增强 schema-aware payload 草稿，不进入真实 draft 创建。"
  },
  trade_order_create: {
    api_name: "alibaba.trade.order.create",
    actual_api_classification: "业务参数错误（说明已过授权层）",
    low_risk_boundary_proven: false,
    decision: "当前无法证明低风险边界，因此不继续实写验证",
    reasons: [
      "官方文档明确这是“国际站信保下单”，成功路径天然对应真实订单创建，而不是只读或无副作用的预检查。",
      "当前使用空对象/不完整 payload 调用时，平台返回 MissingParameter，说明已过授权层，但这不等于存在安全草稿模式。",
      "当前公开官方文档里，尚未识别到明确的 create 同家族 precheck / cancel / draft create 读侧边界，可用于证明可回滚或非成交。",
      "在没有可逆、可清理、无外部成交副作用证据前，不应继续真实创单验证。"
    ],
    observable_evidence: {
      official_explicit_related_methods_seen: [
        "alibaba.trade.order.create",
        "alibaba.seller.trade.query.drafttype"
      ],
      create_boundary_result:
        "使用空 param_order_create 调用 alibaba.trade.order.create 时，平台返回 MissingParameter(product_list)。",
      low_risk_precheck_or_draft_api_identified: false,
      cleanup_evidence_proven: false
    },
    blocked_automation_fields: [
      "buyer identity binding",
      "product_list",
      "price terms",
      "payment terms",
      "delivery terms",
      "final order submit"
    ],
    allowed_next_step: "仅继续生成外部订单草稿，不进入真实订单创建。"
  }
});

const CATEGORY_MAP = new Map(
  WIKA_WRITE_BLOCKER_CATEGORIES.map((item) => [item.code, item])
);

const TRIGGER_MAP = new Map(
  WIKA_HUMAN_HANDOFF_TRIGGERS.map((item) => [item.code, item])
);

export function listWriteBlockerCategories() {
  return WIKA_WRITE_BLOCKER_CATEGORIES;
}

export function listHumanHandoffTriggers() {
  return WIKA_HUMAN_HANDOFF_TRIGGERS;
}

export function getWriteBlockerCategory(code) {
  return CATEGORY_MAP.get(code) ?? null;
}

export function getHumanHandoffTrigger(code) {
  return TRIGGER_MAP.get(code) ?? null;
}

export function buildWikaHumanHandoffArtifact({
  action,
  apiName = null,
  blockerCategory,
  triggerCodes = [],
  account = "wika",
  stage = "write_validation",
  inputSummary = {},
  evidence = {},
  nextAction = null,
  severity = "high",
  createdAt = new Date().toISOString()
}) {
  const category = getWriteBlockerCategory(blockerCategory);
  const triggers = triggerCodes
    .map((code) => getHumanHandoffTrigger(code))
    .filter(Boolean);

  return {
    account,
    stage,
    status: "pending_human_handoff",
    severity,
    action,
    api_name: apiName,
    blocker_category: category
      ? {
          code: category.code,
          label: category.label,
          description: category.description
        }
      : {
          code: blockerCategory,
          label: blockerCategory,
          description: null
        },
    triggers: triggers.map((trigger) => ({
      code: trigger.code,
      label: trigger.label,
      description: trigger.description
    })),
    requires_human_handoff: true,
    input_summary: inputSummary,
    evidence,
    next_action: nextAction,
    created_at: createdAt
  };
}

export function getWikaLowRiskWriteBoundary() {
  return JSON.parse(JSON.stringify(WIKA_LOW_RISK_WRITE_BOUNDARY));
}
