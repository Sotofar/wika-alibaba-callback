export const EXECUTION_STATUSES = [
  "not_started",
  "ready_to_execute",
  "waiting_for_input",
  "in_progress",
  "blocked",
  "done",
  "needs_review",
  "deferred",
];

export const REQUIRED_EXECUTION_FIELDS = [
  "task_id",
  "task_title",
  "owner_role",
  "priority",
  "support_level",
  "current_status",
  "status_reason",
  "required_inputs",
  "missing_inputs",
  "execution_steps",
  "acceptance_criteria",
  "actual_progress",
  "evidence_required",
  "evidence_received",
  "blocked_by",
  "blocker_owner",
  "next_action",
  "due_window",
  "review_frequency",
  "handoff_required",
  "manual_confirmation_required",
  "updated_at",
];

export const DEFAULT_EXECUTION_BOUNDARY = [
  "not task 1 complete",
  "not task 2 complete",
  "not task 3 complete",
  "not task 4 complete",
  "not task 5 complete",
  "task 6 excluded",
  "no write action attempted",
  "WIKA-only thread for business work",
  "XD untouched in business execution",
  "not full business cockpit",
];

export function validateExecutionStatus(status) {
  if (!EXECUTION_STATUSES.includes(status.current_status)) {
    throw new Error(`任务状态非法: ${status.task_id} -> ${status.current_status}`);
  }

  const missing = REQUIRED_EXECUTION_FIELDS.filter((field) => !(field in status));
  if (missing.length > 0) {
    throw new Error(`任务执行状态缺少字段: ${status.task_id ?? "UNKNOWN"} -> ${missing.join(", ")}`);
  }

  for (const field of [
    "required_inputs",
    "missing_inputs",
    "execution_steps",
    "acceptance_criteria",
    "evidence_required",
    "evidence_received",
    "blocked_by",
  ]) {
    if (!Array.isArray(status[field])) {
      throw new Error(`任务执行字段必须是数组: ${status.task_id} -> ${field}`);
    }
  }

  if (!status.owner_role) {
    throw new Error(`任务缺少负责人角色: ${status.task_id}`);
  }
  if (!status.next_action) {
    throw new Error(`任务缺少下一步动作: ${status.task_id}`);
  }
  if (status.acceptance_criteria.length === 0) {
    throw new Error(`任务缺少验收标准: ${status.task_id}`);
  }

  return true;
}

export function createExecutionStatus(status) {
  const normalized = {
    ...status,
    required_inputs: status.required_inputs ?? [],
    missing_inputs: status.missing_inputs ?? [],
    execution_steps: status.execution_steps ?? [],
    acceptance_criteria: status.acceptance_criteria ?? [],
    actual_progress: status.actual_progress ?? [],
    evidence_required: status.evidence_required ?? [],
    evidence_received: status.evidence_received ?? [],
    blocked_by: status.blocked_by ?? [],
    handoff_required: Boolean(status.handoff_required),
    manual_confirmation_required: Boolean(status.manual_confirmation_required),
  };
  validateExecutionStatus(normalized);
  return normalized;
}

export function isExecutionBlocked(status) {
  return status.current_status === "blocked" || status.blocked_by.length > 0;
}

export function requiresManualInput(status) {
  return status.manual_confirmation_required || status.missing_inputs.length > 0 || status.handoff_required;
}
