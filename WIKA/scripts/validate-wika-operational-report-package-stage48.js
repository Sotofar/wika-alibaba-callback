import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..", "..");
const DELIVERABLE_DIR = path.join(ROOT_DIR, "WIKA", "docs", "reports", "deliverables");
const PDF_DIR = path.join(DELIVERABLE_DIR, "pdf");

const REQUIRED_FILES = [
  path.join(DELIVERABLE_DIR, "WIKA_正式运营报告包_Runbook_STAGE48.md"),
  path.join(DELIVERABLE_DIR, "distribution", "WIKA_报告包分发说明_STAGE48.md"),
  path.join(DELIVERABLE_DIR, "distribution", "WIKA_角色分发矩阵_STAGE48.csv"),
  path.join(DELIVERABLE_DIR, "distribution", "WIKA_报告包发送话术_STAGE48.md"),
  path.join(DELIVERABLE_DIR, "handoff", "WIKA_人工补数总表_STAGE48.md"),
  path.join(DELIVERABLE_DIR, "handoff", "WIKA_人工补数字段清单_STAGE48.csv"),
  path.join(DELIVERABLE_DIR, "handoff", "WIKA_人工接手执行说明_STAGE48.md"),
  path.join(DELIVERABLE_DIR, "runtime", "WIKA_report_route_degraded_closure_STAGE48.md"),
  path.join(DELIVERABLE_DIR, "runtime", "WIKA_report_route_sanity_STAGE48.json"),
  path.join(ROOT_DIR, "WIKA", "scripts", "run-wika-operational-report-package-stage48.js"),
  path.join(DELIVERABLE_DIR, "evidence", "WIKA_正式运营报告包_STAGE48证据.json")
];

const REPORT_NAMES = ["WIKA_管理层简报", "WIKA_运营周报", "WIKA_经营诊断报告", "WIKA_产品优化建议报告", "WIKA_广告分析报告", "WIKA_店铺执行清单", "WIKA_销售跟单使用清单", "WIKA_人工接手清单"];

function assert(condition, message) { if (!condition) throw new Error(message); }
function readText(filePath) { return fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""); }
function assertExists(filePath) { assert(fs.existsSync(filePath), `Missing required file: ${filePath}`); }
function assertJson(filePath) { assertExists(filePath); JSON.parse(readText(filePath)); }

function assertNoPlainSecrets(filePath) {
  const text = readText(filePath);
  const riskyPatterns = [/access[_-]?token\s*[:=]\s*['"]?[A-Za-z0-9._-]{16,}/i, /refresh[_-]?token\s*[:=]\s*['"]?[A-Za-z0-9._-]{16,}/i, /client[_-]?secret\s*[:=]\s*['"]?[A-Za-z0-9._-]{16,}/i, /cookie\s*[:=]\s*['"]?[A-Za-z0-9._=;-]{24,}/i];
  for (const pattern of riskyPatterns) assert(!pattern.test(text), `Potential plain secret found in ${filePath}`);
}

function assertNoFalseCompleteClaims(filePath) {
  const lines = readText(filePath).split(/\r?\n/);
  lines.forEach((line, index) => {
    const normalized = line.toLowerCase();
    const negativeLine = /(not|不是|未|不应|不能|不得|没有)/i.test(line);
    const groupedTaskRange = /task1-5|task1~5/i.test(line);
    const riskyEnglish = /task\s*[1-5].*complete/.test(normalized) && !negativeLine && !groupedTaskRange;
    const riskyChinese = /task\s*[1-5].*(已完成|完成)/i.test(line) && !negativeLine;
    assert(!riskyEnglish && !riskyChinese, `False task completion claim in ${filePath}:${index + 1}`);
  });
}

function assertBoundaryStatements() {
  const evidencePath = path.join(DELIVERABLE_DIR, "evidence", "WIKA_正式运营报告包_STAGE48证据.json");
  const evidence = JSON.parse(readText(evidencePath));
  const boundaries = evidence.boundaries || [];
  for (const required of ["not task 1 complete", "not task 2 complete", "not task 3 complete", "not task 4 complete", "not task 5 complete", "task 6 excluded", "no write action attempted", "XD untouched in business execution", "not full business cockpit"]) {
    assert(boundaries.includes(required), `Missing boundary: ${required}`);
  }
}

function assertPdfReports() {
  for (const name of REPORT_NAMES) {
    const pdfPath = path.join(PDF_DIR, `${name}.pdf`);
    assertExists(pdfPath);
    assert(fs.statSync(pdfPath).size > 0, `PDF is empty: ${pdfPath}`);
  }
}

function assertRunScriptDryRun() {
  const result = spawnSync(process.execPath, ["WIKA/scripts/run-wika-operational-report-package-stage48.js", "--dry-run", "--check-only", "--output-json"], { cwd: ROOT_DIR, encoding: "utf8", env: { ...process.env, NODE_TLS_REJECT_UNAUTHORIZED: process.env.NODE_TLS_REJECT_UNAUTHORIZED || "0" } });
  assert(result.status === 0, `Run script dry-run failed: ${result.stderr || result.stdout}`);
  assert(result.stdout.includes("overall_status"), "Run script dry-run did not print overall_status.");
}

function main() {
  for (const filePath of REQUIRED_FILES) assertExists(filePath);
  assertJson(path.join(PDF_DIR, "WIKA_正式运营报告包_PDF清单.json"));
  assertJson(path.join(DELIVERABLE_DIR, "WIKA_正式运营报告包评分.json"));
  assertJson(path.join(DELIVERABLE_DIR, "evidence", "WIKA_正式运营报告包证据.json"));
  assertJson(path.join(DELIVERABLE_DIR, "runtime", "WIKA_report_route_sanity_STAGE48.json"));
  assertJson(path.join(DELIVERABLE_DIR, "evidence", "WIKA_正式运营报告包_STAGE48证据.json"));
  assertPdfReports();
  const filesToScan = REQUIRED_FILES.filter((filePath) => /\.(md|csv|json)$/i.test(filePath));
  for (const filePath of filesToScan) {
    assertNoPlainSecrets(filePath);
    assertNoFalseCompleteClaims(filePath);
  }
  assertBoundaryStatements();
  assertRunScriptDryRun();
  console.log(JSON.stringify({ stage: "stage48-wika-report-package-operationalization", validation: "PASS", required_files: REQUIRED_FILES.length, pdf_reports: REPORT_NAMES.length }, null, 2));
}

main();




