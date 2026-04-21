#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const cyclesRoot = path.join(repoRoot, "WIKA", "docs", "reports", "cycles");
const inboxRoot = path.join(repoRoot, "WIKA", "docs", "tasks", "input-inbox");
const executionRoot = path.join(repoRoot, "WIKA", "docs", "tasks", "execution");

const paths = {
  ingestResult: path.join(inboxRoot, "WIKA_人工输入验收结果.json"),
  normalizedInput: path.join(inboxRoot, "WIKA_人工输入标准化结果.json"),
  refreshedStatus: path.join(executionRoot, "WIKA_任务执行状态_本轮刷新.json"),
  refreshedBlockers: path.join(executionRoot, "WIKA_任务阻塞清单_本轮刷新.json"),
  refreshedManualInputs: path.join(executionRoot, "WIKA_人工输入需求_本轮刷新.json"),
  nextReportPackage: path.join(executionRoot, "WIKA_下一轮报告输入包_本轮刷新.json"),
  reportMd: path.join(cyclesRoot, "WIKA_本轮运营复盘.md"),
  reportSummaryJson: path.join(cyclesRoot, "WIKA_本轮运营复盘摘要.json"),
  nextTasksMd: path.join(cyclesRoot, "WIKA_下一轮任务建议.md")
};

function readJson(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeText(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value, "utf8");
}

function writeJson(filePath, value) {
  writeText(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function table(headers, rows) {
  const head = `| ${headers.join(" | ")} |`;
  const sep = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.length
    ? rows.map((row) => `| ${row.map((cell) => String(cell ?? "").replace(/\n/g, "<br>")).join(" | ")} |`).join("\n")
    : `| ${headers.map(() => "无").join(" | ")} |`;
  return `${head}\n${sep}\n${body}`;
}

function bullet(items) {
  return items?.length ? items.map((item) => `- ${item}`).join("\n") : "- 无";
}

function pickTasks(statuses, predicate, limit = 8) {
  return statuses.filter(predicate).slice(0, limit);
}

function statusLabel(status) {
  const labels = {
    ready_to_execute: "可直接执行",
    blocked: "阻塞",
    waiting_for_input: "等待输入",
    in_progress: "执行中",
    needs_review: "待复核",
    done: "已完成",
    deferred: "延期",
    not_started: "未开始"
  };
  return labels[status] ?? status;
}

function renderCycleReport(context) {
  const { ingest, normalized, statusData, blockers, manualInputs, nextPackage } = context;
  const statuses = statusData.tasks ?? [];
  const ready = pickTasks(statuses, (item) => item.current_status === "ready_to_execute", 10);
  const waiting = pickTasks(statuses, (item) => item.current_status === "waiting_for_input", 10);
  const blocked = blockers.blockers ?? [];
  const acceptedInputs = normalized.accepted_inputs ?? [];
  const rejectedInputs = normalized.rejected_inputs ?? [];

  return `# WIKA 本轮运营复盘

## 1. 本轮结论
- 本轮人工输入状态：\`${ingest.input_status}\`
- 新增人工输入文件：${ingest.received_count}
- 通过验收：${ingest.accepted_count}
- 被拒绝：${ingest.rejected_count}
- 本轮是否伪造数据：否
- 是否触发平台写侧：否
- 是否新增 Alibaba API 探索：否

${ingest.input_status === "NO_INPUT_RECEIVED" ? "本轮没有收到新的人工输入，因此任务状态、阻塞项和下一轮报告输入包只能基于 stage49 / stage50 已有闭环继续保守刷新。" : "本轮收到人工输入，以下复盘只基于已通过格式验收的文件做状态刷新；业务结论仍需人工复核。"}

## 2. 人工输入验收结果
### 已收到并通过
${acceptedInputs.length ? table(["输入类型", "文件", "用途"], acceptedInputs.map((item) => [item.input_area, item.stored_as, "进入任务状态复核与下一轮报告输入包"])) : "- NO_INPUT_RECEIVED"}

### 被拒绝
${rejectedInputs.length ? table(["文件", "原因"], rejectedInputs.map((item) => [item.original_file, item.reason])) : "- 无"}

## 3. 任务状态刷新结果
- 任务总数：${statusData.summary?.total_tasks ?? statuses.length}
- 可直接执行：${statusData.summary?.ready_to_execute_count ?? 0}
- 等待输入：${statusData.summary?.waiting_for_input_count ?? 0}
- blocked：${statusData.summary?.blocked_count ?? 0}
- 需要人工确认：${statusData.summary?.manual_confirmation_required_count ?? 0}

${table(["状态", "数量"], Object.entries(statusData.summary?.status_distribution ?? {}).map(([status, count]) => [statusLabel(status), count]))}

## 4. blocked 清单变化
${ingest.input_status === "NO_INPUT_RECEIVED" ? "- 本轮没有新增输入，blocked 清单未实质清障。" : "- 本轮已根据通过验收的人工输入刷新相关任务，仍需人工确认是否解除阻塞。"}

${table(["任务 ID", "任务", "负责人角色", "缺失输入", "下一步"], blocked.map((item) => [
  item.task_id,
  item.task_title,
  item.owner_role,
  (item.missing_inputs ?? []).slice(0, 3).join("；") || (item.blocked_by ?? []).slice(0, 3).join("；"),
  item.next_action
]))}

## 5. 仍可直接执行的任务
${table(["优先级", "任务 ID", "任务", "负责人角色", "下一步"], ready.map((item) => [
  item.priority,
  item.task_id,
  item.task_title,
  item.owner_role,
  item.next_action
]))}

## 6. 仍需等待输入的任务
${table(["优先级", "任务 ID", "任务", "负责人角色", "需要输入"], waiting.map((item) => [
  item.priority,
  item.task_id,
  item.task_title,
  item.owner_role,
  (item.required_inputs ?? []).slice(0, 4).join("；")
]))}

## 7. 下一轮报告输入包状态
- 下一轮报告准备状态：\`${nextPackage.next_report_readiness}\`
- 人工输入需求数量：${nextPackage.manual_input_count}
- 关键输入组：
${bullet((nextPackage.input_groups ?? []).map((item) => `${item.group}：影响 ${item.improves_reports.join("、")}；是否下轮前必需：${item.required_before_next_report ? "是" : "否"}`))}

## 8. 业务方下个周期最该补什么
1. 广告真实导出样本：用于广告分析报告、运营周报和经营诊断。
2. 页面人工盘点：用于页面/内容优化建议和店铺执行清单。
3. 产品素材与关键词：用于产品优化建议、产品草稿准备和下一轮任务复盘。
4. 销售/订单人工字段：用于 reply-draft、order-draft 的人工确认与交接。

## 9. 边界声明
- not task 1 complete
- not task 2 complete
- not task 3 complete
- not task 4 complete
- not task 5 complete
- task 6 excluded
- no write action attempted
- WIKA-only thread for business work
- XD untouched in business execution
- not full business cockpit
`;
}

function renderNextTasks(context) {
  const { ingest, statusData, blockers, manualInputs } = context;
  const statuses = statusData.tasks ?? [];
  const p1Ready = pickTasks(statuses, (item) => item.priority === "P1" && item.current_status === "ready_to_execute", 8);
  const p2Ready = pickTasks(statuses, (item) => item.priority === "P2" && item.current_status === "ready_to_execute", 8);
  const blocked = blockers.blockers ?? [];

  return `# WIKA 下一轮任务建议

## 1. 本轮输入状态
- \`${ingest.input_status}\`
- 本轮没有人工输入时，下一轮建议不新增经营判断，只继续推动清障和可执行任务。

## 2. 下一轮 P1
${table(["任务 ID", "任务", "角色", "下一步", "验收标准"], p1Ready.map((item) => [
  item.task_id,
  item.task_title,
  item.owner_role,
  item.next_action,
  (item.acceptance_criteria ?? []).slice(0, 2).join("；")
]))}

## 3. 下一轮 P2
${table(["任务 ID", "任务", "角色", "下一步"], p2Ready.map((item) => [
  item.task_id,
  item.task_title,
  item.owner_role,
  item.next_action
]))}

## 4. 下一轮必须清障
${table(["任务 ID", "任务", "blocker owner", "缺失输入", "清障后下一步"], blocked.map((item) => [
  item.task_id,
  item.task_title,
  item.blocker_owner,
  (item.missing_inputs ?? []).slice(0, 4).join("；"),
  item.next_action
]))}

## 5. 下一轮必须回收的人工输入
${table(["任务 ID", "角色", "输入要求", "影响"], (manualInputs.manual_inputs ?? []).slice(0, 12).map((item) => [
  item.task_id,
  item.owner_role,
  (item.required_inputs ?? []).slice(0, 3).join("；"),
  item.impact_if_missing
]))}

## 6. 执行原则
- 不新增 API。
- 不做平台写侧。
- 不把 preview / draft 写成平台内闭环。
- 没有人工输入就继续输出 \`NO_INPUT_RECEIVED\`，不伪造广告或页面结论。
`;
}

function main() {
  const generatedAt = new Date().toISOString();
  const ingest = readJson(paths.ingestResult, { input_status: "NO_INPUT_RECEIVED", received_count: 0, accepted_count: 0, rejected_count: 0, files: [] });
  const normalized = readJson(paths.normalizedInput, { input_status: ingest.input_status, accepted_inputs: [], rejected_inputs: [] });
  const statusData = readJson(paths.refreshedStatus);
  const blockers = readJson(paths.refreshedBlockers, { count: 0, blockers: [] });
  const manualInputs = readJson(paths.refreshedManualInputs, { count: 0, manual_inputs: [] });
  const nextPackage = readJson(paths.nextReportPackage);
  const context = { generatedAt, ingest, normalized, statusData, blockers, manualInputs, nextPackage };

  writeText(paths.reportMd, renderCycleReport(context));
  writeText(paths.nextTasksMd, renderNextTasks(context));
  writeJson(paths.reportSummaryJson, {
    generated_at: generatedAt,
    input_status: ingest.input_status,
    received_count: ingest.received_count,
    accepted_count: ingest.accepted_count,
    rejected_count: ingest.rejected_count,
    status_distribution: statusData.summary?.status_distribution ?? {},
    blocked_count: blockers.count ?? 0,
    manual_input_count: manualInputs.count ?? 0,
    next_report_readiness: nextPackage.next_report_readiness,
    no_fake_data_generated: true,
    no_business_write_action: true,
    generated_files: {
      report: path.relative(repoRoot, paths.reportMd).replace(/\\/g, "/"),
      summary: path.relative(repoRoot, paths.reportSummaryJson).replace(/\\/g, "/"),
      next_tasks: path.relative(repoRoot, paths.nextTasksMd).replace(/\\/g, "/")
    }
  });

  console.log(JSON.stringify({
    status: "PASS",
    input_status: ingest.input_status,
    blocked_count: blockers.count ?? 0,
    manual_input_count: manualInputs.count ?? 0,
    next_report_readiness: nextPackage.next_report_readiness,
    report: path.relative(repoRoot, paths.reportMd).replace(/\\/g, "/"),
    next_tasks: path.relative(repoRoot, paths.nextTasksMd).replace(/\\/g, "/")
  }, null, 2));
}

main();
