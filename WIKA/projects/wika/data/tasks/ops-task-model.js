export const PRIORITIES = ["P1", "P2", "P3"];

export const OWNER_ROLES = [
  "老板/管理层",
  "运营负责人",
  "店铺运营",
  "产品运营",
  "销售/跟单",
  "人工接手人员",
];

export const WIKA_SUPPORT_LEVELS = [
  "fully_supported",
  "mostly_supported_needs_human_confirm",
  "preview_or_handoff_only",
  "manual_only",
  "blocked",
];

export const DEFAULT_BOUNDARY_STATEMENT = [
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

export const REQUIRED_TASK_FIELDS = [
  "task_id",
  "task_title",
  "task_type",
  "priority",
  "owner_role",
  "source_report",
  "source_evidence",
  "why_it_matters",
  "expected_impact",
  "wika_support_level",
  "manual_input_required",
  "required_inputs",
  "execution_steps",
  "acceptance_criteria",
  "due_window",
  "risk_if_not_done",
  "blocked_by",
  "boundary_statement",
];

export function createTask(task) {
  const normalized = {
    ...task,
    boundary_statement: task.boundary_statement ?? DEFAULT_BOUNDARY_STATEMENT,
    required_inputs: task.required_inputs ?? [],
    execution_steps: task.execution_steps ?? [],
    acceptance_criteria: task.acceptance_criteria ?? [],
    blocked_by: task.blocked_by ?? [],
    manual_input_required: Boolean(task.manual_input_required),
  };
  validateTask(normalized);
  return normalized;
}

export function validateTask(task) {
  const missing = REQUIRED_TASK_FIELDS.filter((field) => !(field in task));
  if (missing.length > 0) {
    throw new Error(`任务缺少必要字段: ${task.task_id ?? "UNKNOWN"} -> ${missing.join(", ")}`);
  }
  if (!PRIORITIES.includes(task.priority)) {
    throw new Error(`任务优先级非法: ${task.task_id} -> ${task.priority}`);
  }
  if (!OWNER_ROLES.includes(task.owner_role)) {
    throw new Error(`负责人角色非法: ${task.task_id} -> ${task.owner_role}`);
  }
  if (!WIKA_SUPPORT_LEVELS.includes(task.wika_support_level)) {
    throw new Error(`WIKA 支撑级别非法: ${task.task_id} -> ${task.wika_support_level}`);
  }
  for (const listField of ["required_inputs", "execution_steps", "acceptance_criteria", "blocked_by", "boundary_statement"]) {
    if (!Array.isArray(task[listField])) {
      throw new Error(`任务字段必须是数组: ${task.task_id} -> ${listField}`);
    }
  }
  if (task.execution_steps.length === 0) {
    throw new Error(`任务缺少执行步骤: ${task.task_id}`);
  }
  if (task.acceptance_criteria.length === 0) {
    throw new Error(`任务缺少验收标准: ${task.task_id}`);
  }
  return true;
}

export function isBlockedTask(task) {
  return task.wika_support_level === "blocked" || task.blocked_by.length > 0;
}
