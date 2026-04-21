#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildBlockerList,
  buildExecutionStatuses,
  buildManualInputRequirements,
  summarizeExecution,
} from "../projects/wika/data/tasks/task-status-updater.js";
import {
  renderBlockedDashboard,
  renderExecutionDashboard,
  renderWeeklyPlan,
} from "../projects/wika/data/tasks/task-execution-writer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const tasksRoot = path.join(repoRoot, "WIKA", "docs", "tasks");
const executionRoot = path.join(tasksRoot, "execution");
const inboxRoot = path.join(tasksRoot, "input-inbox");
const cyclesRoot = path.join(repoRoot, "WIKA", "docs", "reports", "cycles");
const taskPackagePath = path.join(tasksRoot, "WIKA_运营任务包.json");
const normalizedInputPath = path.join(inboxRoot, "WIKA_人工输入标准化结果.json");

function readJson(filePath, fallback = null) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeText(filePath, text) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, text, "utf8");
}

function writeJson(filePath, value) {
  writeText(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function inputMatchesTask(inputArea, task) {
  if (inputArea === "ads") return task.task_id.startsWith("ADS-");
  if (inputArea === "page_audit") return task.task_id.startsWith("PAGE-") || task.task_id.startsWith("STORE-");
  if (inputArea === "product_material") return task.task_id.startsWith("PROD-");
  if (inputArea === "sales_followup") return task.task_id.startsWith("SALES-");
  if (inputArea === "order_fields") return task.task_id.startsWith("HANDOFF-") || /order|订单/i.test(`${task.task_type} ${task.task_title}`);
  return false;
}

function buildManualOverrides(tasks, normalizedInput) {
  const acceptedInputs = normalizedInput?.accepted_inputs ?? [];
  if (!acceptedInputs.length) return {};

  const overrides = {};
  for (const task of tasks) {
    const matchedInputs = acceptedInputs.filter((input) => inputMatchesTask(input.input_area, task));
    if (!matchedInputs.length) continue;

    overrides[task.task_id] = {
      current_status: task.blocked_by?.length ? "needs_review" : "in_progress",
      status_reason: "本轮收到相关人工输入，任务需要人工复核输入质量后再进入执行或报告刷新。",
      missing_inputs: [],
      actual_progress: matchedInputs.map((input) => `收到人工输入：${input.stored_as}`),
      evidence_received: matchedInputs.map((input) => input.stored_as),
      next_action: "复核本轮收到的人工输入，确认是否足以解除阻塞并进入下一轮报告。"
    };
  }
  return overrides;
}

function prependCycleHeader(title, body, context) {
  return `# ${title}

- 本轮生成时间：${context.generated_at}
- 人工输入状态：\`${context.input_status}\`
- 通过输入文件数：${context.accepted_count}
- 拒绝输入文件数：${context.rejected_count}
- 说明：本文件是本轮刷新结果，不覆盖 stage49 原始基线看板。

${body.replace(/^# .+\n?/, "")}`;
}

function main() {
  const generatedAt = new Date().toISOString();
  const taskPackage = readJson(taskPackagePath);
  if (!taskPackage?.tasks?.length) {
    throw new Error(`缺少可用任务包：${taskPackagePath}`);
  }

  const normalizedInput = readJson(normalizedInputPath, {
    input_status: "NO_INPUT_RECEIVED",
    accepted_inputs: [],
    rejected_inputs: []
  });
  const manualInput = { task_overrides: buildManualOverrides(taskPackage.tasks, normalizedInput) };
  const statuses = buildExecutionStatuses(taskPackage.tasks, manualInput, generatedAt);
  const summary = summarizeExecution(statuses);
  const blockers = buildBlockerList(statuses);
  const manualInputs = buildManualInputRequirements(statuses);
  const context = {
    generated_at: generatedAt,
    input_status: normalizedInput.input_status ?? "NO_INPUT_RECEIVED",
    accepted_count: normalizedInput.accepted_inputs?.length ?? 0,
    rejected_count: normalizedInput.rejected_inputs?.length ?? 0
  };

  const statusPath = path.join(executionRoot, "WIKA_任务执行状态_本轮刷新.json");
  const blockerPath = path.join(executionRoot, "WIKA_任务阻塞清单_本轮刷新.json");
  const manualInputPath = path.join(executionRoot, "WIKA_人工输入需求_本轮刷新.json");
  const dashboardPath = path.join(executionRoot, "WIKA_任务执行总看板_本轮刷新.md");
  const blockedDashboardPath = path.join(executionRoot, "WIKA_blocked任务清障看板_本轮刷新.md");
  const weeklyPlanPath = path.join(executionRoot, "WIKA_本周执行计划_本轮刷新.md");
  const cycleStatusPath = path.join(cyclesRoot, "WIKA_任务状态刷新摘要.json");

  writeJson(statusPath, {
    generated_at: generatedAt,
    source: "WIKA/docs/tasks/WIKA_运营任务包.json",
    input_status: context.input_status,
    summary,
    tasks: statuses
  });
  writeJson(blockerPath, { generated_at: generatedAt, input_status: context.input_status, count: blockers.length, blockers });
  writeJson(manualInputPath, { generated_at: generatedAt, input_status: context.input_status, count: manualInputs.length, manual_inputs: manualInputs });
  writeText(dashboardPath, prependCycleHeader("WIKA 任务执行总看板_本轮刷新", renderExecutionDashboard(statuses, summary), context));
  writeText(blockedDashboardPath, prependCycleHeader("WIKA blocked任务清障看板_本轮刷新", renderBlockedDashboard(statuses), context));
  writeText(weeklyPlanPath, prependCycleHeader("WIKA 本周执行计划_本轮刷新", renderWeeklyPlan(statuses), context));
  writeJson(cycleStatusPath, {
    generated_at: generatedAt,
    input_status: context.input_status,
    status_distribution: summary.status_distribution,
    blocked_count: blockers.length,
    manual_input_count: manualInputs.length,
    refreshed_files: [
      path.relative(repoRoot, statusPath).replace(/\\/g, "/"),
      path.relative(repoRoot, blockerPath).replace(/\\/g, "/"),
      path.relative(repoRoot, manualInputPath).replace(/\\/g, "/"),
      path.relative(repoRoot, dashboardPath).replace(/\\/g, "/"),
      path.relative(repoRoot, blockedDashboardPath).replace(/\\/g, "/"),
      path.relative(repoRoot, weeklyPlanPath).replace(/\\/g, "/")
    ]
  });

  console.log(JSON.stringify({
    status: "PASS",
    input_status: context.input_status,
    status_distribution: summary.status_distribution,
    blocked_count: blockers.length,
    manual_input_count: manualInputs.length,
    status_path: path.relative(repoRoot, statusPath).replace(/\\/g, "/")
  }, null, 2));
}

main();
