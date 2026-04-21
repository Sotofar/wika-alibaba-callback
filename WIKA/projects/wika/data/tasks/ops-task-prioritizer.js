import { OWNER_ROLES, PRIORITIES, isBlockedTask } from "./ops-task-model.js";

const priorityRank = Object.fromEntries(PRIORITIES.map((priority, index) => [priority, index]));
const roleRank = Object.fromEntries(OWNER_ROLES.map((role, index) => [role, index]));

export function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    const priorityDelta = priorityRank[a.priority] - priorityRank[b.priority];
    if (priorityDelta !== 0) return priorityDelta;
    const roleDelta = roleRank[a.owner_role] - roleRank[b.owner_role];
    if (roleDelta !== 0) return roleDelta;
    return a.task_id.localeCompare(b.task_id, "zh-Hans-CN");
  });
}

export function groupTasksBy(tasks, field) {
  return tasks.reduce((groups, task) => {
    const value = task[field] ?? "未分类";
    if (!groups[value]) groups[value] = [];
    groups[value].push(task);
    return groups;
  }, {});
}

export function summarizeTasks(tasks) {
  const priority_distribution = Object.fromEntries(PRIORITIES.map((priority) => [priority, 0]));
  const role_distribution = {};
  const support_distribution = {};
  const task_scope_distribution = {};

  for (const task of tasks) {
    priority_distribution[task.priority] = (priority_distribution[task.priority] ?? 0) + 1;
    role_distribution[task.owner_role] = (role_distribution[task.owner_role] ?? 0) + 1;
    support_distribution[task.wika_support_level] = (support_distribution[task.wika_support_level] ?? 0) + 1;
    const scope = task.business_task_scope ?? "通用运营";
    task_scope_distribution[scope] = (task_scope_distribution[scope] ?? 0) + 1;
  }

  return {
    total_tasks: tasks.length,
    priority_distribution,
    role_distribution,
    support_distribution,
    task_scope_distribution,
    blocked_task_count: tasks.filter(isBlockedTask).length,
    fully_supported_count: tasks.filter((task) => task.wika_support_level === "fully_supported").length,
    human_confirmation_required_count: tasks.filter((task) => task.manual_input_required).length,
  };
}
