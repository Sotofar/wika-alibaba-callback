#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildNextReportInputPackage } from "../projects/wika/data/tasks/task-status-updater.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const executionRoot = path.join(repoRoot, "WIKA", "docs", "tasks", "execution");
const cyclesRoot = path.join(repoRoot, "WIKA", "docs", "reports", "cycles");
const refreshedStatusPath = path.join(executionRoot, "WIKA_任务执行状态_本轮刷新.json");
const basePackagePath = path.join(executionRoot, "WIKA_下一轮报告输入包.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function semanticPackage(value) {
  if (!value) return null;
  return {
    purpose: value.purpose,
    input_groups: value.input_groups,
    manual_input_count: value.manual_input_count,
    next_report_readiness: value.next_report_readiness
  };
}

function main() {
  const generatedAt = new Date().toISOString();
  const statusData = readJson(refreshedStatusPath);
  const statuses = statusData.tasks ?? [];
  const refreshedPackage = {
    generated_at: generatedAt,
    input_status: statusData.input_status ?? "UNKNOWN",
    ...buildNextReportInputPackage(statuses)
  };

  const basePackage = fs.existsSync(basePackagePath) ? readJson(basePackagePath) : null;
  const changeSummary = {
    changed_from_baseline: basePackage
      ? JSON.stringify(semanticPackage(basePackage)) !== JSON.stringify(semanticPackage(refreshedPackage))
      : true,
    baseline_path: path.relative(repoRoot, basePackagePath).replace(/\\/g, "/"),
    refreshed_path: "WIKA/docs/tasks/execution/WIKA_下一轮报告输入包_本轮刷新.json",
    input_status: refreshedPackage.input_status,
    next_report_readiness: refreshedPackage.next_report_readiness,
    manual_input_count: refreshedPackage.manual_input_count
  };

  const executionOutput = path.join(executionRoot, "WIKA_下一轮报告输入包_本轮刷新.json");
  const cycleOutput = path.join(cyclesRoot, "WIKA_下一轮报告输入包_本轮刷新.json");
  const changeOutput = path.join(cyclesRoot, "WIKA_下一轮报告输入包变化摘要.json");
  writeJson(executionOutput, refreshedPackage);
  writeJson(cycleOutput, refreshedPackage);
  writeJson(changeOutput, { generated_at: generatedAt, ...changeSummary });

  console.log(JSON.stringify({
    status: "PASS",
    ...changeSummary
  }, null, 2));
}

main();
