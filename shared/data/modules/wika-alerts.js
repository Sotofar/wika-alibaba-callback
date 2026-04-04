import {
  buildWikaHumanHandoffArtifact,
  getWriteBlockerCategory
} from "./alibaba-write-guardrails.js";

function normalizeStringList(values = []) {
  return [...new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))];
}

function normalizeLines(values = []) {
  return normalizeStringList(Array.isArray(values) ? values : [values]);
}

function buildBlockerCategory(code) {
  const known = getWriteBlockerCategory(code);

  if (known) {
    return {
      code: known.code,
      label: known.label,
      description: known.description
    };
  }

  return {
    code: String(code ?? "unknown"),
    label: String(code ?? "unknown"),
    description: null
  };
}

export function buildWikaBlockerAlert({
  stageName,
  blockerCategory,
  relatedApis = [],
  relatedModules = [],
  evidence = [],
  reason,
  userNeeds = [],
  suggestedNextSteps = [],
  allowHumanHandoff = true,
  handoffAction = "manual_review",
  triggerCodes = [],
  inputSummary = {},
  account = "wika",
  createdAt = new Date().toISOString()
}) {
  const category = buildBlockerCategory(blockerCategory);

  return {
    schema_version: 1,
    kind: "wika_blocker_alert",
    account,
    stage_name: String(stageName ?? "").trim(),
    blocker_category: category,
    triggered_at: createdAt,
    related_apis: normalizeStringList(relatedApis),
    related_modules: normalizeStringList(relatedModules),
    current_evidence: normalizeLines(evidence),
    cannot_continue_reason: String(reason ?? "").trim(),
    user_needs: normalizeLines(userNeeds),
    suggested_next_steps: normalizeLines(suggestedNextSteps),
    allow_human_handoff: Boolean(allowHumanHandoff),
    human_handoff: buildWikaHumanHandoffArtifact({
      action: handoffAction,
      blockerCategory: category.code,
      triggerCodes,
      account,
      stage: "formal_notification_loop",
      inputSummary,
      evidence: {
        stage_name: String(stageName ?? "").trim(),
        related_apis: normalizeStringList(relatedApis),
        related_modules: normalizeStringList(relatedModules),
        current_evidence: normalizeLines(evidence),
        cannot_continue_reason: String(reason ?? "").trim()
      },
      nextAction: normalizeLines(suggestedNextSteps).join("；"),
      createdAt
    })
  };
}

export function buildWikaPermissionBlockedAlert({
  stageName,
  relatedApis = [],
  relatedModules = [],
  evidence = [],
  userNeeds = [],
  suggestedNextSteps = [],
  inputSummary = {}
}) {
  return buildWikaBlockerAlert({
    stageName,
    blockerCategory: "permission_blocked",
    relatedApis,
    relatedModules,
    evidence,
    reason: "平台返回权限错误，当前系统无法继续自动推进。",
    userNeeds,
    suggestedNextSteps,
    allowHumanHandoff: true,
    handoffAction: "permission_review",
    triggerCodes: ["platform_permission_blocked"],
    inputSummary
  });
}

export function buildWikaNoEntryAlert({
  stageName,
  relatedApis = [],
  relatedModules = [],
  evidence = [],
  userNeeds = [],
  suggestedNextSteps = [],
  inputSummary = {}
}) {
  return buildWikaBlockerAlert({
    stageName,
    blockerCategory: "platform_no_entry",
    relatedApis,
    relatedModules,
    evidence,
    reason: "当前没有识别到稳定、可生产复用的官方入口，系统无法继续自动推进。",
    userNeeds,
    suggestedNextSteps,
    allowHumanHandoff: true,
    handoffAction: "entry_path_review",
    triggerCodes: ["platform_permission_blocked"],
    inputSummary
  });
}

export function buildWikaWriteBoundaryAlert({
  stageName,
  relatedApis = [],
  relatedModules = [],
  evidence = [],
  userNeeds = [],
  suggestedNextSteps = [],
  inputSummary = {}
}) {
  return buildWikaBlockerAlert({
    stageName,
    blockerCategory: "high_risk_irreversible",
    relatedApis,
    relatedModules,
    evidence,
    reason: "当前仍无法证明低风险、可隔离、可清理、可回滚边界，系统不能继续自动执行写侧验证。",
    userNeeds,
    suggestedNextSteps,
    allowHumanHandoff: true,
    handoffAction: "write_boundary_review",
    triggerCodes: ["irreversible_write_risk"],
    inputSummary
  });
}

export function buildWikaParameterMissingAlert({
  stageName,
  relatedApis = [],
  relatedModules = [],
  evidence = [],
  userNeeds = [],
  suggestedNextSteps = [],
  inputSummary = {}
}) {
  return buildWikaBlockerAlert({
    stageName,
    blockerCategory: "parameter_missing",
    relatedApis,
    relatedModules,
    evidence,
    reason: "关键参数或样本 id 缺失，当前无法继续完成真实实证。",
    userNeeds,
    suggestedNextSteps,
    allowHumanHandoff: true,
    handoffAction: "parameter_backfill",
    triggerCodes: ["missing_category_or_attributes"],
    inputSummary
  });
}
