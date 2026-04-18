import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import {
  ROOT,
  STAGE30_EVIDENCE_PATH,
  STAGE31_EVIDENCE_PATH,
  WEEKLY_REPORT_PATH,
  WEEKLY_REPORT_EVIDENCE_PATH,
  LEDGER_MD_PATH,
  LEDGER_CSV_PATH,
  API_COVERAGE_PATH,
  PERMISSION_GAP_PATH,
  exists,
  readJson,
  readText,
  writeJson,
  scanForSensitiveValues
} from "./xd-stage31-common.js";

const REQUIRED_FILES = [
  LEDGER_MD_PATH,
  LEDGER_CSV_PATH,
  WEEKLY_REPORT_PATH,
  WEEKLY_REPORT_EVIDENCE_PATH,
  `${ROOT}\\scripts\\generate-xd-operations-report-stage31.js`,
  `${ROOT}\\scripts\\validate-xd-operations-report-stage31.js`,
  `${ROOT}\\scripts\\check-xd-critical-routes-stage31.js`,
  `${ROOT}\\scripts\\validate-xd-critical-routes-stage31.js`
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function runNodeScript(scriptName) {
  const output = execFileSync("node", [scriptName], {
    cwd: ROOT,
    encoding: "utf8"
  });
  return JSON.parse(output.trim());
}

function gatherSuspiciousContent(paths) {
  return paths
    .filter((filePath) => exists(filePath))
    .filter((filePath) => scanForSensitiveValues(readText(filePath)));
}

export async function validateStage31Productization() {
  for (const filePath of REQUIRED_FILES) {
    assert(exists(filePath), `Missing required stage31 file: ${filePath}`);
  }

  const operationsValidation = runNodeScript("scripts/validate-xd-operations-report-stage31.js");
  const monitoringValidation = runNodeScript("scripts/validate-xd-critical-routes-stage31.js");

  const stage30 = readJson(STAGE30_EVIDENCE_PATH);
  assert(stage30.remaining_route_gap_count === 0, "route parity gap must remain 0.");
  assert(stage30.remaining_candidate_unresolved_count === 0, "candidate unresolved count must remain 0.");
  assert(stage30.safe_scope_complete === true, "safe_scope_complete must remain true.");

  const weeklyReport = readJson(WEEKLY_REPORT_EVIDENCE_PATH);
  assert(weeklyReport.capability_state?.safe_scope_complete === true, "Weekly report must reflect safe_scope_complete=true.");

  const coverage = readText(API_COVERAGE_PATH);
  const permissionGap = readText(PERMISSION_GAP_PATH);
  assert(coverage.includes("stage31"), "api_coverage.md must mention stage31.");
  assert(permissionGap.includes("stage31"), "permission_gap.md must mention stage31.");

  const suspiciousFiles = gatherSuspiciousContent([
    LEDGER_MD_PATH,
    LEDGER_CSV_PATH,
    WEEKLY_REPORT_PATH,
    WEEKLY_REPORT_EVIDENCE_PATH,
    API_COVERAGE_PATH,
    PERMISSION_GAP_PATH
  ]);
  assert(suspiciousFiles.length === 0, `Sensitive value pattern detected in files: ${suspiciousFiles.join(", ")}`);

  const markdown = readText(WEEKLY_REPORT_PATH);
  assert(!/GMV[:：]\s*\d/i.test(markdown), "Generated weekly report contains claimed GMV value.");
  assert(!/转化率[:：]\s*\d/i.test(markdown), "Generated weekly report contains claimed conversion rate.");
  assert(!/国家结构[:：]\s*\d/i.test(markdown), "Generated weekly report contains claimed country mix.");

  const boundaryResults = {
    "scripts/check-boundary.js": exists(`${ROOT}\\scripts\\check-boundary.js`) ? "present_not_run" : "missing",
    "scripts/doc-audit.js": exists(`${ROOT}\\scripts\\doc-audit.js`) ? "present_not_run" : "missing"
  };

  const evidence = {
    generated_at: new Date().toISOString(),
    safe_scope_complete: true,
    route_gap_count: 0,
    candidate_unresolved_count: 0,
    deliverables_completed: 4,
    permission_ledger_created: true,
    weekly_report_created: true,
    report_generator_created: true,
    critical_route_monitor_created: true,
    validation_results: {
      boundary_results: boundaryResults,
      operations_validation: operationsValidation,
      monitoring_validation: monitoringValidation
    },
    realistic_tasks_codex_can_now_do: [
      "生成 XD 日报",
      "生成 XD 周报",
      "做订单可见样本趋势摘要",
      "做商品基础可见样本摘要",
      "做关键 route 巡检",
      "做打通能力回归检查",
      "做 restriction 对象重开条件判断",
      "为业务侧生成运营摘要草稿"
    ],
    realistic_tasks_codex_should_not_do_without_new_evidence: [
      "继续无证据重试 restriction 对象",
      "扩写侧 / draft-adjacent 动作",
      "编造 GMV / 转化率 / 国家结构 / 全量经营诊断",
      "把当前页样本说成全量数据",
      "重跑 stage26/27/28/29/30 同构验证"
    ],
    biggest_remaining_boundary:
      "No new external tenant/product live evidence exists to change the current restriction-confirmed conclusions.",
    next_reopen_gate:
      "Only reopen after new external tenant/product live evidence, official doc/control-plane evidence, or new verified readonly payload directly changes restriction attribution."
  };

  writeJson(STAGE31_EVIDENCE_PATH, evidence);
  return evidence;
}

async function main() {
  const result = await validateStage31Productization();
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error?.stack || String(error));
    process.exitCode = 1;
  });
}
