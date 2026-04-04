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
  }
]);

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
