import { createExecutionStatus, isExecutionBlocked, requiresManualInput } from "./task-execution-model.js";

function unique(items) {
  return [...new Set((items ?? []).filter(Boolean))];
}

function inferStatus(task, override = {}) {
  if (override.current_status) return override.current_status;
  if (task.wika_support_level === "blocked" || (task.blocked_by ?? []).length > 0) return "blocked";
  if (task.wika_support_level === "manual_only") return "waiting_for_input";
  if (task.wika_support_level === "preview_or_handoff_only") return "ready_to_execute";
  if (task.wika_support_level === "mostly_supported_needs_human_confirm") return "ready_to_execute";
  if (task.wika_support_level === "fully_supported") return "ready_to_execute";
  return "not_started";
}

function inferMissingInputs(task, currentStatus, override = {}) {
  if (Array.isArray(override.missing_inputs)) return override.missing_inputs;
  if (currentStatus === "blocked") return unique([...(task.blocked_by ?? []), ...(task.required_inputs ?? [])]);
  if (currentStatus === "waiting_for_input") return unique(task.required_inputs ?? []);
  return [];
}

function inferBlockerOwner(task, currentStatus, override = {}) {
  if (override.blocker_owner) return override.blocker_owner;
  if (currentStatus !== "blocked") return "";
  if (task.task_type === "ads_input") return "运营负责人";
  if (task.task_type === "page_audit") return "店铺运营";
  if (task.task_type === "manual_field_completion") return "人工接手人员";
  return task.owner_role;
}

function inferEvidenceRequired(task) {
  const base = [
    `任务 ${task.task_id} 的执行记录`,
    "执行人、执行时间、证据位置",
    "是否进入下一轮报告的判断",
  ];
  if (task.acceptance_criteria?.length) {
    base.push(...task.acceptance_criteria.map((item) => `验收证据：${item}`));
  }
  return unique(base);
}

function inferReviewFrequency(task) {
  if (task.priority === "P1") return "每日";
  if (task.priority === "P2") return "每周两次";
  return "每周";
}

function inferNextAction(task, currentStatus, missingInputs) {
  if (currentStatus === "blocked") {
    return `先由 ${inferBlockerOwner(task, currentStatus)} 补齐阻塞项：${missingInputs.slice(0, 3).join("；") || "见 blocked_by"}`;
  }
  if (currentStatus === "waiting_for_input") {
    return `先补齐输入：${missingInputs.slice(0, 3).join("；") || "见 required_inputs"}`;
  }
  return task.execution_steps?.[0] ?? "按任务清单执行第一步，并记录执行证据。";
}

export function buildExecutionStatus(task, manualOverride = {}, now = new Date().toISOString()) {
  const currentStatus = inferStatus(task, manualOverride);
  const missingInputs = inferMissingInputs(task, currentStatus, manualOverride);
  const status = createExecutionStatus({
    task_id: task.task_id,
    task_title: task.task_title,
    owner_role: task.owner_role,
    priority: task.priority,
    support_level: task.wika_support_level,
    current_status: currentStatus,
    status_reason: manualOverride.status_reason ?? statusReason(task, currentStatus),
    required_inputs: task.required_inputs ?? [],
    missing_inputs: missingInputs,
    execution_steps: task.execution_steps ?? [],
    acceptance_criteria: task.acceptance_criteria ?? [],
    actual_progress: manualOverride.actual_progress ?? [],
    evidence_required: manualOverride.evidence_required ?? inferEvidenceRequired(task),
    evidence_received: manualOverride.evidence_received ?? [],
    blocked_by: task.blocked_by ?? [],
    blocker_owner: inferBlockerOwner(task, currentStatus, manualOverride),
    next_action: manualOverride.next_action ?? inferNextAction(task, currentStatus, missingInputs),
    due_window: task.due_window,
    review_frequency: manualOverride.review_frequency ?? inferReviewFrequency(task),
    handoff_required: task.wika_support_level === "preview_or_handoff_only" || task.wika_support_level === "manual_only",
    manual_confirmation_required: Boolean(task.manual_input_required),
    updated_at: manualOverride.updated_at ?? now,
    source_report: task.source_report,
    source_evidence: task.source_evidence,
    business_task_scope: task.business_task_scope ?? "通用运营",
    boundary_statement: task.boundary_statement ?? [],
  });

  return status;
}

function statusReason(task, currentStatus) {
  if (currentStatus === "blocked") return "存在 blocked_by 或 support_level=blocked，需要先清障。";
  if (currentStatus === "waiting_for_input") return "任务主要依赖人工输入，需先补齐输入后执行。";
  if (currentStatus === "ready_to_execute") return "WIKA 已提供任务拆解、证据来源和执行步骤，但业务末端仍需人工确认。";
  return "默认状态，等待人工更新。";
}

export function buildExecutionStatuses(tasks, manualInput = {}, now = new Date().toISOString()) {
  const overrides = manualInput.task_overrides ?? {};
  return tasks.map((task) => buildExecutionStatus(task, overrides[task.task_id] ?? {}, now));
}

export function summarizeExecution(statuses) {
  const status_distribution = {};
  const priority_status_distribution = {};
  const role_status_distribution = {};
  for (const status of statuses) {
    status_distribution[status.current_status] = (status_distribution[status.current_status] ?? 0) + 1;
    if (!priority_status_distribution[status.priority]) priority_status_distribution[status.priority] = {};
    priority_status_distribution[status.priority][status.current_status] =
      (priority_status_distribution[status.priority][status.current_status] ?? 0) + 1;
    if (!role_status_distribution[status.owner_role]) role_status_distribution[status.owner_role] = {};
    role_status_distribution[status.owner_role][status.current_status] =
      (role_status_distribution[status.owner_role][status.current_status] ?? 0) + 1;
  }

  return {
    total_tasks: statuses.length,
    status_distribution,
    priority_status_distribution,
    role_status_distribution,
    blocked_count: statuses.filter(isExecutionBlocked).length,
    waiting_for_input_count: statuses.filter((status) => status.current_status === "waiting_for_input").length,
    ready_to_execute_count: statuses.filter((status) => status.current_status === "ready_to_execute").length,
    manual_confirmation_required_count: statuses.filter(requiresManualInput).length,
  };
}

export function buildBlockerList(statuses) {
  return statuses
    .filter(isExecutionBlocked)
    .map((status) => ({
      task_id: status.task_id,
      task_title: status.task_title,
      owner_role: status.owner_role,
      priority: status.priority,
      current_status: status.current_status,
      blocked_by: status.blocked_by,
      missing_inputs: status.missing_inputs,
      blocker_owner: status.blocker_owner,
      next_action: status.next_action,
      clear_then: status.execution_steps[0] ?? "清障后按任务执行步骤推进。",
    }));
}

export function buildManualInputRequirements(statuses) {
  const items = [];
  for (const status of statuses) {
    const inputs = unique([...status.missing_inputs, ...(status.required_inputs ?? [])]);
    if (inputs.length === 0 && !status.manual_confirmation_required && !status.handoff_required) continue;
    items.push({
      task_id: status.task_id,
      task_title: status.task_title,
      owner_role: status.owner_role,
      priority: status.priority,
      required_inputs: inputs,
      provide_format: inferInputFormat(status),
      provide_frequency: inferInputFrequency(status),
      used_for: status.source_report,
      impact_if_missing: status.status_reason,
      next_action: status.next_action,
    });
  }
  return items;
}

function inferInputFormat(status) {
  if (status.task_id.startsWith("ADS-")) return "按 WIKA 广告数据导入模板提供 CSV/JSON。";
  if (status.task_id.startsWith("PAGE-") || status.task_id.startsWith("STORE-")) return "按页面人工盘点模板或执行记录模板提供。";
  if (status.task_id.startsWith("PROD-")) return "按产品素材、规格、材质、关键词清单提供。";
  if (status.task_id.startsWith("SALES-") || status.task_id.startsWith("HANDOFF-")) return "按销售/订单人工字段清单提供。";
  return "按任务执行记录模板提供。";
}

function inferInputFrequency(status) {
  if (status.priority === "P1") return "每日或本周内一次性补齐";
  if (status.priority === "P2") return "每周";
  return "下次复盘前";
}

export function buildNextReportInputPackage(statuses) {
  const manualInputs = buildManualInputRequirements(statuses);
  return {
    purpose: "把 stage49 执行记录和人工输入回流到下一轮 WIKA 运营报告。",
    generated_from: "WIKA/docs/tasks/WIKA_运营任务包.json",
    input_groups: [
      {
        group: "广告数据",
        source_tasks: statuses.filter((status) => status.task_id.startsWith("ADS-")).map((status) => status.task_id),
        improves_reports: ["WIKA_广告分析报告", "WIKA_运营周报", "WIKA_经营诊断报告"],
        required_before_next_report: true,
      },
      {
        group: "页面人工盘点",
        source_tasks: statuses.filter((status) => status.task_id.startsWith("PAGE-") || status.task_id.startsWith("STORE-")).map((status) => status.task_id),
        improves_reports: ["WIKA_产品优化建议报告", "WIKA_经营诊断报告", "WIKA_店铺执行清单"],
        required_before_next_report: true,
      },
      {
        group: "产品素材与关键词",
        source_tasks: statuses.filter((status) => status.task_id.startsWith("PROD-")).map((status) => status.task_id),
        improves_reports: ["WIKA_产品优化建议报告", "WIKA_运营周报"],
        required_before_next_report: true,
      },
      {
        group: "销售/订单人工字段",
        source_tasks: statuses.filter((status) => status.task_id.startsWith("SALES-") || status.task_id.startsWith("HANDOFF-")).map((status) => status.task_id),
        improves_reports: ["WIKA_销售跟单使用清单", "WIKA_人工接手清单", "WIKA_运营周报"],
        required_before_next_report: true,
      },
    ],
    manual_input_count: manualInputs.length,
    next_report_readiness: statuses.some((status) => status.current_status === "blocked")
      ? "PARTIAL_UNTIL_BLOCKERS_CLEARED"
      : "READY_WITH_CURRENT_EXECUTION_EVIDENCE",
  };
}
