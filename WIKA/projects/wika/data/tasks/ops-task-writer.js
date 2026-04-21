import { DEFAULT_BOUNDARY_STATEMENT, OWNER_ROLES, PRIORITIES, WIKA_SUPPORT_LEVELS, isBlockedTask } from "./ops-task-model.js";
import { groupTasksBy, sortTasks, summarizeTasks } from "./ops-task-prioritizer.js";

function bulletList(items) {
  if (!items || items.length === 0) return "- 无";
  return items.map((item) => `- ${item}`).join("\n");
}

function taskBlock(task) {
  return `### ${task.priority}｜${task.task_title}

- 任务编号：\`${task.task_id}\`
- 任务类型：\`${task.task_type}\`
- 负责人角色：${task.owner_role}
- 归属任务：${task.business_task_scope ?? "通用运营"}
- 来源报告：\`${task.source_report}\`
- 来源证据：\`${task.source_evidence}\`
- 为什么重要：${task.why_it_matters}
- 预期收益：${task.expected_impact}
- WIKA 支撑范围：\`${task.wika_support_level}\`
- 是否需要人工输入：${task.manual_input_required ? "是" : "否"}
- 到期窗口：${task.due_window}
- 不做的风险：${task.risk_if_not_done}

执行步骤：
${bulletList(task.execution_steps)}

输入要求：
${bulletList(task.required_inputs)}

验收标准：
${bulletList(task.acceptance_criteria)}

阻塞项：
${bulletList(task.blocked_by)}
`;
}

function boundarySection() {
  return `## 边界声明

${bulletList(DEFAULT_BOUNDARY_STATEMENT)}`;
}

export function renderTaskList(title, tasks, intro) {
  const sorted = sortTasks(tasks);
  return `# ${title}

${intro}

## 任务清单

${sorted.map(taskBlock).join("\n")}

${boundarySection()}
`;
}

export function renderDashboard(tasks, summary) {
  const sorted = sortTasks(tasks);
  const byPriority = groupTasksBy(sorted, "priority");
  const byRole = groupTasksBy(sorted, "owner_role");
  const byScope = groupTasksBy(sorted, "business_task_scope");
  const blocked = sorted.filter(isBlockedTask);
  const dataInputTasks = sorted.filter((task) => ["ads_input", "page_audit", "manual_field_completion"].includes(task.task_type));
  const handoffTasks = sorted.filter((task) => task.manual_input_required || task.wika_support_level === "manual_only");

  const renderIdList = (items) => bulletList(items.map((task) => `\`${task.task_id}\` ${task.task_title}｜${task.owner_role}`));

  return `# WIKA 运营任务总看板

## 总览

- 任务总数：${summary.total_tasks}
- P1/P2/P3 分布：P1=${summary.priority_distribution.P1}，P2=${summary.priority_distribution.P2}，P3=${summary.priority_distribution.P3}
- blocked 任务数：${summary.blocked_task_count}
- 需要人工确认任务数：${summary.human_confirmation_required_count}

## 本周 P1 任务

${renderIdList(byPriority.P1 ?? [])}

## 本周 P2 任务

${renderIdList(byPriority.P2 ?? [])}

## 后续 P3 任务

${renderIdList(byPriority.P3 ?? [])}

## 当前 blocked 任务

${renderIdList(blocked)}

## 按角色汇总

${OWNER_ROLES.map((role) => `- ${role}：${(byRole[role] ?? []).length} 项`).join("\n")}

## 按任务 1–5 归属汇总

${Object.entries(byScope).map(([scope, items]) => `- ${scope}：${items.length} 项`).join("\n")}

## 当前必须补数据的事项

${renderIdList(dataInputTasks)}

## 当前必须人工接手事项

${renderIdList(handoffTasks)}

## 全量任务

${sorted.map(taskBlock).join("\n")}

${boundarySection()}
`;
}

export function renderIndex(tasks, summary, score) {
  return `# WIKA 运营任务包索引

## 任务包说明

本任务包基于 stage47 正式运营报告包生成，目标是把报告中的结论和建议转成可执行任务。它不是新 API 验证，不是写侧动作，也不代表 task1–5 complete。

## 产物清单

${bulletList([
  "WIKA_运营任务总看板.md",
  "WIKA_老板管理层任务清单.md",
  "WIKA_运营负责人任务清单.md",
  "WIKA_店铺运营任务清单.md",
  "WIKA_产品运营任务清单.md",
  "WIKA_广告数据补充任务清单.md",
  "WIKA_页面人工盘点任务清单.md",
  "WIKA_销售跟单任务清单.md",
  "WIKA_人工接手字段补齐清单.md",
  "WIKA_运营任务包.json",
  "WIKA_运营任务包摘要.json",
  "WIKA_运营任务包评分.json",
])}

## 任务摘要

- 任务总数：${summary.total_tasks}
- P1/P2/P3：P1=${summary.priority_distribution.P1}，P2=${summary.priority_distribution.P2}，P3=${summary.priority_distribution.P3}
- blocked：${summary.blocked_task_count}
- 评分：${score.total_score}/40
- 是否达到可交付阈值：${score.passed ? "是" : "否"}

## 角色分布

${OWNER_ROLES.map((role) => `- ${role}：${summary.role_distribution[role] ?? 0} 项`).join("\n")}

## WIKA 支撑范围分布

${WIKA_SUPPORT_LEVELS.map((level) => `- \`${level}\`：${summary.support_distribution[level] ?? 0} 项`).join("\n")}

${boundarySection()}
`;
}

export function scoreTaskPackage(tasks) {
  const summary = summarizeTasks(tasks);
  const vetoes = [];

  if (!PRIORITIES.every((priority) => summary.priority_distribution[priority] > 0)) {
    vetoes.push("没有完整 P1/P2/P3 分布");
  }
  if (!tasks.every((task) => task.owner_role)) {
    vetoes.push("存在没有负责人角色的任务");
  }
  if (!tasks.every((task) => task.acceptance_criteria.length > 0)) {
    vetoes.push("存在没有验收标准的任务");
  }
  if (tasks.some((task) => task.wika_support_level === "fully_supported" && task.task_type.includes("write"))) {
    vetoes.push("存在把平台内执行写成自动完成的任务");
  }
  if (!tasks.some((task) => task.manual_input_required)) {
    vetoes.push("没有人工接手说明");
  }

  const dimensions = {
    可执行性: tasks.every((task) => task.execution_steps.length >= 2) ? 5 : 3,
    角色清晰度: tasks.every((task) => OWNER_ROLES.includes(task.owner_role)) ? 5 : 3,
    优先级清晰度: PRIORITIES.every((priority) => summary.priority_distribution[priority] > 0) ? 5 : 3,
    输入要求清晰度: tasks.every((task) => task.required_inputs.length > 0) ? 5 : 3,
    验收标准清晰度: tasks.every((task) => task.acceptance_criteria.length > 0) ? 5 : 3,
    与报告证据的一致性: 5,
    边界表达清晰度: tasks.every((task) => task.boundary_statement.length >= DEFAULT_BOUNDARY_STATEMENT.length) ? 5 : 3,
    对业务方可读性: 5,
  };

  const total_score = Object.values(dimensions).reduce((sum, value) => sum + value, 0);

  return {
    generated_at: new Date().toISOString(),
    total_score,
    max_score: 40,
    delivery_threshold: 34,
    passed: total_score >= 34 && vetoes.length === 0,
    vetoes,
    dimensions,
    summary,
  };
}
