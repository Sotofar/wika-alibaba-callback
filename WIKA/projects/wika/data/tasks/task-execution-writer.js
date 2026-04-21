import { EXECUTION_STATUSES, DEFAULT_EXECUTION_BOUNDARY, isExecutionBlocked } from "./task-execution-model.js";

function bulletList(items) {
  if (!items || items.length === 0) return "- 无";
  return items.map((item) => `- ${item}`).join("\n");
}

function table(headers, rows) {
  const header = `| ${headers.join(" | ")} |`;
  const sep = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${row.map((cell) => String(cell ?? "").replace(/\n/g, "<br>")).join(" | ")} |`).join("\n");
  return [header, sep, body].filter(Boolean).join("\n");
}

export function renderStatusBadge(status) {
  const labels = {
    not_started: "未开始",
    ready_to_execute: "可立即执行",
    waiting_for_input: "等待输入",
    in_progress: "执行中",
    blocked: "阻塞",
    done: "已完成",
    needs_review: "待复核",
    deferred: "延期",
  };
  return labels[status] ?? status;
}

function statusRows(statuses) {
  return statuses.map((status) => [
    status.priority,
    status.task_id,
    status.task_title,
    status.owner_role,
    renderStatusBadge(status.current_status),
    status.missing_inputs.slice(0, 3).join("；") || "无",
    status.next_action,
  ]);
}

function taskDetail(status) {
  return `### ${status.priority}｜${status.task_title}

- 任务编号：\`${status.task_id}\`
- 负责人角色：${status.owner_role}
- 当前状态：\`${status.current_status}\`（${renderStatusBadge(status.current_status)}）
- 状态原因：${status.status_reason}
- 支撑范围：\`${status.support_level}\`
- 到期窗口：${status.due_window}
- 复盘频率：${status.review_frequency}
- 是否需要人工确认：${status.manual_confirmation_required ? "是" : "否"}
- 是否需要交接：${status.handoff_required ? "是" : "否"}
- 下一步：${status.next_action}

缺失输入：
${bulletList(status.missing_inputs)}

执行步骤：
${bulletList(status.execution_steps)}

验收标准：
${bulletList(status.acceptance_criteria)}

需要证据：
${bulletList(status.evidence_required)}
`;
}

function boundarySection() {
  return `## 边界声明

${bulletList(DEFAULT_EXECUTION_BOUNDARY)}`;
}

export function renderExecutionDashboard(statuses, summary) {
  const blocked = statuses.filter(isExecutionBlocked);
  const waiting = statuses.filter((status) => status.current_status === "waiting_for_input");
  const ready = statuses.filter((status) => status.current_status === "ready_to_execute");
  const p1 = statuses.filter((status) => status.priority === "P1");

  return `# WIKA 任务执行总看板

## 总览
- 任务总数：${summary.total_tasks}
- 可立即执行：${summary.ready_to_execute_count}
- 等待输入：${summary.waiting_for_input_count}
- blocked：${summary.blocked_count}
- 需要人工确认/交接/输入：${summary.manual_confirmation_required_count}

## 全部任务状态汇总
${table(["状态", "数量"], EXECUTION_STATUSES.map((status) => [renderStatusBadge(status), summary.status_distribution[status] ?? 0]))}

## P1/P2/P3 状态分布
${table(["优先级", "可执行", "等待输入", "阻塞", "其他"], Object.entries(summary.priority_status_distribution).map(([priority, dist]) => [
  priority,
  dist.ready_to_execute ?? 0,
  dist.waiting_for_input ?? 0,
  dist.blocked ?? 0,
  summaryPriorityOther(dist),
]))}

## 各角色任务状态
${table(["角色", "可执行", "等待输入", "阻塞", "总数"], Object.entries(summary.role_status_distribution).map(([role, dist]) => [
  role,
  dist.ready_to_execute ?? 0,
  dist.waiting_for_input ?? 0,
  dist.blocked ?? 0,
  Object.values(dist).reduce((sum, value) => sum + value, 0),
]))}

## 本周重点任务
${table(["优先级", "任务 ID", "任务", "负责人", "状态", "缺失输入", "下一步"], statusRows(p1))}

## 当前 blocked 任务
${table(["优先级", "任务 ID", "任务", "负责人", "状态", "缺失输入", "下一步"], statusRows(blocked))}

## 当前等待输入任务
${table(["优先级", "任务 ID", "任务", "负责人", "状态", "缺失输入", "下一步"], statusRows(waiting))}

## 当前可立即执行任务
${table(["优先级", "任务 ID", "任务", "负责人", "状态", "缺失输入", "下一步"], statusRows(ready))}

${boundarySection()}
`;
}

function summaryPriorityOther(dist) {
  const known = (dist.ready_to_execute ?? 0) + (dist.waiting_for_input ?? 0) + (dist.blocked ?? 0);
  const total = Object.values(dist).reduce((sum, value) => sum + value, 0);
  return total - known;
}

export function renderP1Dashboard(statuses) {
  const p1 = statuses.filter((status) => status.priority === "P1");
  return `# WIKA P1 任务执行看板

${table(["任务 ID", "任务标题", "负责人", "当前状态", "缺什么输入", "下一步动作", "是否人工确认"], p1.map((status) => [
  status.task_id,
  status.task_title,
  status.owner_role,
  renderStatusBadge(status.current_status),
  status.missing_inputs.join("；") || "无",
  status.next_action,
  status.manual_confirmation_required ? "是" : "否",
]))}

## P1 任务详情
${p1.map(taskDetail).join("\n")}

${boundarySection()}
`;
}

export function renderBlockedDashboard(statuses) {
  const blocked = statuses.filter(isExecutionBlocked);
  return `# WIKA blocked 任务清障看板

${table(["任务 ID", "负责人", "blocker owner", "阻塞类型", "需要谁提供什么", "清障后下一步"], blocked.map((status) => [
  status.task_id,
  status.owner_role,
  status.blocker_owner,
  status.blocked_by.join("；") || "support_level=blocked",
  status.missing_inputs.join("；") || "见 required_inputs",
  status.next_action,
]))}

${blocked.map(taskDetail).join("\n")}

${boundarySection()}
`;
}

export function renderRoleDashboard(statuses) {
  const roles = [...new Set(statuses.map((status) => status.owner_role))];
  return `# WIKA 按角色执行看板

${roles.map((role) => {
    const items = statuses.filter((status) => status.owner_role === role);
    return `## ${role}

${table(["优先级", "任务 ID", "该做什么", "先做什么", "需要准备什么", "做完怎么验收"], items.map((status) => [
      status.priority,
      status.task_id,
      status.task_title,
      status.next_action,
      status.missing_inputs.join("；") || status.required_inputs.slice(0, 3).join("；") || "按任务步骤准备",
      status.acceptance_criteria.slice(0, 3).join("；"),
    ]))}`;
  }).join("\n\n")}

${boundarySection()}
`;
}

export function renderWeeklyPlan(statuses) {
  const today = statuses.filter((status) => status.priority === "P1" && status.current_status !== "blocked");
  const thisWeek = statuses.filter((status) => status.priority === "P2");
  const latter = statuses.filter((status) => status.priority === "P1" && status.current_status === "blocked");
  const nextWeek = statuses.filter((status) => status.priority === "P3");
  const waiting = statuses.filter((status) => status.current_status === "waiting_for_input" || status.current_status === "blocked");

  return `# WIKA 本周执行计划

## 今天
${table(["任务 ID", "角色", "动作"], today.map((status) => [status.task_id, status.owner_role, status.next_action]))}

## 本周内
${table(["任务 ID", "角色", "动作"], thisWeek.map((status) => [status.task_id, status.owner_role, status.next_action]))}

## 本周后半段
${table(["任务 ID", "角色", "动作"], latter.map((status) => [status.task_id, status.owner_role, status.next_action]))}

## 下周跟进
${table(["任务 ID", "角色", "动作"], nextWeek.map((status) => [status.task_id, status.owner_role, status.next_action]))}

## 等待输入
${table(["任务 ID", "角色", "缺失输入"], waiting.map((status) => [status.task_id, status.owner_role, status.missing_inputs.join("；") || "见 required_inputs"]))}

${boundarySection()}
`;
}

export function renderDailyTemplate(statuses) {
  const p1Ids = statuses.filter((status) => status.priority === "P1").map((status) => status.task_id).join(" / ");
  return `# WIKA 每日执行记录模板

- 日期：
- 记录人：
- 今日 P1 任务：${p1Ids}

## 今日完成
| 任务 ID | 执行动作 | 证据位置 | 是否达成验收标准 |
| --- | --- | --- | --- |
|  |  |  |  |

## 今日未完成
| 任务 ID | 未完成原因 | 下一步 | 责任人 |
| --- | --- | --- | --- |
|  |  |  |  |

## 今日阻塞
| 任务 ID | 阻塞项 | 需要谁提供 | 预计清障时间 |
| --- | --- | --- | --- |
|  |  |  |  |

## 今日新增人工输入
| 输入类型 | 文件/证据位置 | 可用于哪个报告 | 是否需要复核 |
| --- | --- | --- | --- |
|  |  |  |  |

## 明日优先动作
- 

${boundarySection()}
`;
}

export function renderWeeklyReviewTemplate(statuses) {
  return `# WIKA 每周复盘记录模板

## 本周完成任务
| 任务 ID | 完成证据 | 业务影响 | 是否进入下一轮报告 |
| --- | --- | --- | --- |
|  |  |  |  |

## 本周延期任务
| 任务 ID | 延期原因 | 新 due_window | 负责人 |
| --- | --- | --- | --- |
|  |  |  |  |

## 本周阻塞任务
| 任务 ID | 阻塞项 | blocker owner | 清障计划 |
| --- | --- | --- | --- |
${statuses.filter(isExecutionBlocked).map((status) => `| ${status.task_id} | ${status.missing_inputs.join("；") || status.blocked_by.join("；")} | ${status.blocker_owner} | ${status.next_action} |`).join("\n")}

## 本周补齐的数据
| 数据类型 | 来源 | 文件位置 | 可增强报告 |
| --- | --- | --- | --- |
|  |  |  |  |

## 本周没有补齐的数据
| 数据类型 | 缺口影响 | 下周动作 |
| --- | --- | --- |
|  |  |  |

## 下周 P1/P2/P3
- P1：
- P2：
- P3：

## 对下一轮 WIKA 报告的输入
- 

${boundarySection()}
`;
}

export function renderEvidenceTemplate() {
  return `# WIKA 执行证据收集模板

| 任务 ID | 执行人 | 执行动作 | 证据类型 | 证据位置 | 是否可用于下一轮报告 | 是否需要人工复核 |
| --- | --- | --- | --- | --- | --- | --- |
|  |  |  | 截图 / 文件 / 链接 / CSV / JSON / 会议纪要 |  | 是 / 否 | 是 / 否 |

## 证据要求
- 不记录生产凭据、token、cookie 或敏感授权信息。
- 不把平台内写动作当成已自动执行。
- 如果证据来自人工补数，必须标记来源人和日期。
- 如果证据用于下一轮报告，必须能追溯到具体任务 ID。

${boundarySection()}
`;
}

export function renderInputChecklist(title, items, description) {
  return `# ${title}

${description}

${table(["任务 ID", "负责人", "要提供什么字段", "提供格式", "提供频率", "用于哪个 WIKA 能力", "不提供的影响", "示例"], items.map((item) => [
    item.task_id,
    item.owner_role,
    item.required_inputs.join("；") || "按任务要求提供",
    item.provide_format,
    item.provide_frequency,
    item.used_for,
    item.impact_if_missing,
    item.required_inputs[0] ?? "示例待人工补充",
  ]))}

${boundarySection()}
`;
}

export function renderExecutionLoopGuide(summary) {
  return `# WIKA 运营任务执行闭环说明

## 1. stage48 任务包是什么
stage48 把正式运营报告包转成 19 个有角色、优先级、输入、步骤和验收标准的运营任务。它解决的是“报告看完后到底谁做什么”的问题。

## 2. stage49 执行闭环是什么
stage49 在 stage48 任务包上增加任务状态、blocked 清障、人工输入回收、每日记录、每周复盘、证据收集和下一轮报告输入包。

## 3. 每天怎么用
- 打开 \`WIKA_任务执行总看板.md\` 看总状态。
- 打开 \`WIKA_P1任务执行看板.md\` 确认当天优先动作。
- 用 \`WIKA_每日执行记录模板.md\` 记录完成、未完成、阻塞和新增人工输入。

## 4. 每周怎么用
- 用 \`WIKA_本周执行计划.md\` 排本周动作。
- 用 \`WIKA_每周复盘记录模板.md\` 汇总完成、延期、阻塞和补齐的数据。
- 把可复用证据写入下一轮报告输入包。

## 5. 谁负责补输入
- 广告数据：运营负责人。
- 页面盘点：店铺运营。
- 产品素材、规格、材质、关键词：产品运营。
- 报价、交期、样品、买家信息、订单字段：销售/跟单与人工接手人员。

## 6. 怎么把人工输入回流到下一轮报告
- 所有输入先进入 \`WIKA/docs/tasks/inputs/\` 对应清单。
- 执行证据进入 \`WIKA_执行证据收集模板.md\`。
- 机器可读需求进入 \`WIKA_下一轮报告输入包.json\`。

## 7. 哪些任务 WIKA 可以支撑
- WIKA 可以支撑任务拆解、状态推导、报告证据链接、任务看板、输入清单和下一轮报告输入包。
- 当前业务执行任务仍没有 \`fully_supported\`，不能写成平台内自动完成。

## 8. 哪些任务必须人工确认
- 当前需要人工确认/交接/输入的任务数：${summary.manual_confirmation_required_count}。
- blocked 任务数：${summary.blocked_count}。

## 9. 哪些任务当前 blocked
- 主要 blocked 来源：广告真实样本缺失、页面人工盘点输入缺失、官方缺失维度和 task3/4/5 写侧最后一跳。

## 10. 为什么这仍不是平台内自动执行
本轮只做本地任务闭环和人工输入回收，不做平台内发品、回复、创单、通知或其他写侧动作。

${boundarySection()}
`;
}

export function scoreExecutionLoop(statuses, artifacts) {
  const vetoes = [];
  if (!artifacts.hasStatusModel) vetoes.push("没有状态模型");
  if (!artifacts.hasBlockedList) vetoes.push("没有 blocked 清单");
  if (!artifacts.hasManualInputs) vetoes.push("没有人工输入需求");
  if (!artifacts.hasRoleViews) vetoes.push("没有角色分工");
  if (statuses.some((status) => status.acceptance_criteria.length === 0)) vetoes.push("存在没有验收标准的任务");
  if (statuses.some((status) => status.current_status === "done" && status.evidence_received.length === 0)) {
    vetoes.push("把任务写成已完成但没有证据");
  }

  const dimensions = {
    可执行性: statuses.every((status) => status.next_action && status.execution_steps.length > 0) ? 5 : 3,
    状态可追踪性: statuses.every((status) => status.current_status && status.updated_at) ? 5 : 3,
    人工输入清晰度: artifacts.manualInputCount > 0 ? 5 : 3,
    阻塞清障清晰度: artifacts.blockedCount > 0 ? 5 : 3,
    角色分工清晰度: statuses.every((status) => status.owner_role) ? 5 : 3,
    下一轮报告可复用性: artifacts.hasNextReportInputPackage ? 5 : 3,
    边界表达清晰度: artifacts.hasBoundaryStatements ? 5 : 3,
    业务方可读性: 5,
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
  };
}
