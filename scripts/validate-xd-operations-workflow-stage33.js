import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import {
  ROOT,
  exists,
  scanForSensitiveValues
} from "./xd-stage31-common.js";
import { runXdOperationsWorkflow } from "./run-xd-operations-workflow-stage33.js";

const SCRIPT_PATH = "scripts/run-xd-operations-workflow-stage33.js";
const ALLOWED_OVERALL = new Set(["PASS", "DEGRADED", "FAIL"]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function runCli(args) {
  const output = execFileSync("node", [SCRIPT_PATH, ...args], {
    cwd: ROOT,
    encoding: "utf8"
  });
  return JSON.parse(output.trim());
}

function assertSummary(summary, expectedMode) {
  assert(summary.mode === expectedMode, `Unexpected mode: ${summary.mode}`);
  assert(summary.dry_run === true, "Dry-run summary must set dry_run=true.");
  assert(ALLOWED_OVERALL.has(summary.overall_status), `Unexpected overall_status: ${summary.overall_status}`);
  assert(summary.monitoring, "Missing monitoring section.");
  assert(summary.monitoring.checks_total >= 10 || summary.monitoring.status === "failed", "Monitoring checks look incomplete.");
  assert(Array.isArray(summary.boundaries) && summary.boundaries.length >= 4, "Missing workflow boundaries.");
  assert(summary.next_action, "Missing next_action.");
  assert(summary.output_markdown_path, "Missing output_markdown_path.");
  assert(summary.output_json_path, "Missing output_json_path.");
  if (expectedMode === "daily" || expectedMode === "both") {
    assert(summary.daily, "Missing daily section.");
  }
  if (expectedMode === "weekly" || expectedMode === "both") {
    assert(summary.weekly, "Missing weekly section.");
  }
  assert(!scanForSensitiveValues(JSON.stringify(summary)), "Sensitive value pattern detected in workflow summary.");
  assert(!/GMV[:：]\s*\d/i.test(JSON.stringify(summary)), "Workflow summary claims numeric GMV.");
  assert(!/转化率[:：]\s*\d/i.test(JSON.stringify(summary)), "Workflow summary claims numeric conversion.");
  assert(!/国家结构[:：]\s*\d/i.test(JSON.stringify(summary)), "Workflow summary claims numeric country mix.");
}

export async function validateXdOperationsWorkflowStage33() {
  assert(exists(`${ROOT}\\${SCRIPT_PATH.replaceAll("/", "\\")}`), "Missing workflow script.");
  assert(typeof runXdOperationsWorkflow === "function", "Workflow script import missing runXdOperationsWorkflow export.");

  const importProbe = await runXdOperationsWorkflow({
    mode: "daily",
    date: "2026-04-19",
    dryRun: true
  });
  assertSummary(importProbe, "daily");

  const daily = runCli(["--dry-run", "--mode=daily", "--date=2026-04-19"]);
  const weekly = runCli(["--dry-run", "--mode=weekly", "--week-start=2026-04-06", "--week-end=2026-04-12"]);
  const both = runCli([
    "--dry-run",
    "--mode=both",
    "--date=2026-04-19",
    "--week-start=2026-04-06",
    "--week-end=2026-04-12"
  ]);

  assertSummary(daily, "daily");
  assertSummary(weekly, "weekly");
  assertSummary(both, "both");

  const boundaryResults = {
    "scripts/check-boundary.js": exists(`${ROOT}\\scripts\\check-boundary.js`) ? "present_not_run" : "missing",
    "scripts/doc-audit.js": exists(`${ROOT}\\scripts\\doc-audit.js`) ? "present_not_run" : "missing"
  };

  return {
    status: "ok",
    import_probe: "ok",
    daily,
    weekly,
    both,
    boundary_results: boundaryResults
  };
}

async function main() {
  const result = await validateXdOperationsWorkflowStage33();
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error?.stack || String(error));
    process.exitCode = 1;
  });
}
