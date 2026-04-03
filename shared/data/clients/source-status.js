export const SOURCE_PRIORITY = Object.freeze([
  "official_api",
  "page_request",
  "export_file",
  "browser_automation_readonly"
]);

export const DATA_QUALITY_STATUS = Object.freeze({
  VERIFIED: "已验证可读",
  IMPLEMENTED_NOT_VERIFIED: "已实现未验证",
  PAGE_VISIBLE_PENDING: "页面可见待接入",
  INTERFACE_NOT_FOUND: "接口未找到",
  PERMISSION_LIMITED: "可能受权限限制",
  UNAVAILABLE: "无法获取"
});

export function createSourceDescriptor({
  module,
  sourceType,
  status,
  verifiedFields = [],
  pendingFields = [],
  notes = ""
}) {
  return {
    module,
    sourceType,
    status,
    verifiedFields,
    pendingFields,
    notes
  };
}
