import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..", "..");
const DELIVERABLE_DIR = path.join(ROOT_DIR, "WIKA", "docs", "reports", "deliverables");
const PDF_DIR = path.join(DELIVERABLE_DIR, "pdf");
const EVIDENCE_DIR = path.join(DELIVERABLE_DIR, "evidence");
const DEFAULT_OUTPUT_PATH = path.join(EVIDENCE_DIR, "WIKA_正式运营报告包_STAGE48运行检查.json");
const BASE_URL = process.env.WIKA_STAGE48_BASE_URL || "https://api.wikapacking.com";

const REPORT_NAMES = [
  "WIKA_管理层简报",
  "WIKA_运营周报",
  "WIKA_经营诊断报告",
  "WIKA_产品优化建议报告",
  "WIKA_广告分析报告",
  "WIKA_店铺执行清单",
  "WIKA_销售跟单使用清单",
  "WIKA_人工接手清单"
];

const JSON_FILES = [
  path.join(DELIVERABLE_DIR, "WIKA_正式运营报告包评分.json"),
  path.join(EVIDENCE_DIR, "WIKA_正式运营报告包证据.json"),
  path.join(PDF_DIR, "WIKA_正式运营报告包_PDF清单.json")
];

const SANITY_ROUTES = [
  { key: "health", path: "/health", json: false },
  { key: "auth_debug", path: "/integrations/alibaba/auth/debug", json: true },
  { key: "business_cockpit", path: "/integrations/alibaba/wika/reports/business-cockpit", json: true },
  { key: "operator_console", path: "/integrations/alibaba/wika/reports/operator-console", json: true },
  { key: "action_center", path: "/integrations/alibaba/wika/reports/action-center", json: true }
];

function parseArgs(argv) {
  const args = { dryRun: false, skipPdf: false, skipDesktopCopy: false, outputJson: false, outputPath: DEFAULT_OUTPUT_PATH, checkOnly: false };
  for (const arg of argv) {
    if (arg === "--dry-run") args.dryRun = true;
    if (arg === "--skip-pdf") args.skipPdf = true;
    if (arg === "--skip-desktop-copy") args.skipDesktopCopy = true;
    if (arg === "--check-only") args.checkOnly = true;
    if (arg === "--output-json") args.outputJson = true;
    if (arg.startsWith("--output-json=")) {
      args.outputJson = true;
      args.outputPath = path.resolve(ROOT_DIR, arg.slice("--output-json=".length));
    }
  }
  return args;
}

function fileStatus(filePath) {
  if (!fs.existsSync(filePath)) return { path: filePath, status: "MISSING", size_bytes: 0 };
  const stats = fs.statSync(filePath);
  return { path: filePath, status: stats.size > 0 ? "PASS" : "EMPTY", size_bytes: stats.size };
}

function parseJsonStatus(filePath) {
  const base = fileStatus(filePath);
  if (base.status !== "PASS") return { ...base, parse_status: "SKIPPED" };
  try {
    JSON.parse(fs.readFileSync(filePath, "utf8"));
    return { ...base, parse_status: "PASS" };
  } catch (error) {
    return { ...base, parse_status: "FAIL", error: error.message };
  }
}

function checkMarkdownReports() {
  const reports = REPORT_NAMES.map((name) => fileStatus(path.join(DELIVERABLE_DIR, `${name}.md`)));
  const index = fileStatus(path.join(DELIVERABLE_DIR, "WIKA_正式运营报告包索引.md"));
  return { index, reports, pass_count: reports.filter((item) => item.status === "PASS").length, expected_count: REPORT_NAMES.length };
}

function checkPdfReports(skipPdf) {
  if (skipPdf) return { skipped: true, pass_count: 0, expected_count: REPORT_NAMES.length, reports: [] };
  const reports = REPORT_NAMES.map((name) => fileStatus(path.join(PDF_DIR, `${name}.pdf`)));
  return { skipped: false, reports, pass_count: reports.filter((item) => item.status === "PASS").length, expected_count: REPORT_NAMES.length };
}

function readPdfManifest() {
  const manifestPath = path.join(PDF_DIR, "WIKA_正式运营报告包_PDF清单.json");
  if (!fs.existsSync(manifestPath)) return { manifest_status: "MISSING", files: [] };
  try {
    const parsed = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    return { manifest_status: "PASS", desktop_dir: parsed.desktop_dir || null, files: Array.isArray(parsed.files) ? parsed.files : [] };
  } catch (error) {
    return { manifest_status: "FAIL", error: error.message, files: [] };
  }
}

function checkDesktopCopies(skipDesktopCopy) {
  if (skipDesktopCopy) return { status: "SKIPPED", pass_count: 0, expected_count: REPORT_NAMES.length, files: [] };
  const manifest = readPdfManifest();
  if (manifest.manifest_status !== "PASS") return { status: "DESKTOP_CHECK_UNAVAILABLE", reason: "PDF manifest is unavailable or invalid.", pass_count: 0, expected_count: REPORT_NAMES.length, files: [] };
  const desktopFiles = REPORT_NAMES.map((name) => fileStatus(path.join(manifest.desktop_dir || "", `${name}.pdf`)));
  const passCount = desktopFiles.filter((item) => item.status === "PASS").length;
  return { status: passCount === REPORT_NAMES.length ? "PASS" : "MISSING_IN_CURRENT_DESKTOP_ENV_REPO_PDFS_PRESENT", desktop_dir: manifest.desktop_dir, pass_count: passCount, expected_count: REPORT_NAMES.length, files: desktopFiles };
}

function classifyRoute(payload, status) {
  if (status < 200 || status >= 300) return "FAIL";
  if (!payload || typeof payload !== "object") return "PASS";
  const degraded = Array.isArray(payload.degraded_sections) ? payload.degraded_sections : [];
  if (degraded.length || payload.partial_status?.mode === "degraded") return "PASS_WITH_ACCEPTED_DEGRADED";
  return "PASS";
}

function sanitizePayload(payload) {
  if (Array.isArray(payload)) return payload.slice(0, 10).map(sanitizePayload);
  if (!payload || typeof payload !== "object") return payload;
  const out = {};
  for (const [key, value] of Object.entries(payload)) out[key] = /(token|secret|authorization|cookie|refresh|access)/i.test(key) ? "***" : sanitizePayload(value);
  return out;
}

async function fetchRoute(route, timeoutMs = 20000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();
  try {
    const response = await fetch(`${BASE_URL}${route.path}`, { signal: controller.signal });
    const elapsedMs = Date.now() - startedAt;
    const text = await response.text();
    let payload = null;
    if (route.json) {
      try { payload = JSON.parse(text); } catch (error) {
        return { key: route.key, path: route.path, http_status: response.status, classification: "FAIL", elapsed_ms: elapsedMs, error: `JSON parse failed: ${error.message}` };
      }
    }
    return { key: route.key, path: route.path, http_status: response.status, classification: classifyRoute(payload, response.status), elapsed_ms: elapsedMs, degraded_sections: Array.isArray(payload?.degraded_sections) ? sanitizePayload(payload.degraded_sections) : [], partial_status: payload?.partial_status ? sanitizePayload(payload.partial_status) : undefined };
  } catch (error) {
    return { key: route.key, path: route.path, http_status: null, classification: error.name === "AbortError" ? "FAIL_TIMEOUT" : "FAIL", elapsed_ms: Date.now() - startedAt, error: error.message };
  } finally {
    clearTimeout(timeout);
  }
}

async function runOnlineSanity(dryRun) {
  if (dryRun) return { skipped: true, reason: "dry-run", routes: SANITY_ROUTES.map((route) => ({ key: route.key, path: route.path, classification: "SKIPPED_BY_DRY_RUN" })) };
  const routes = [];
  for (const route of SANITY_ROUTES) routes.push(await fetchRoute(route));
  return { skipped: false, routes };
}

function buildOverallStatus(summary) {
  const hardFailures = [];
  if (summary.markdown.pass_count !== summary.markdown.expected_count) hardFailures.push("markdown_missing");
  if (!summary.pdf.skipped && summary.pdf.pass_count !== summary.pdf.expected_count) hardFailures.push("pdf_missing");
  if (summary.json_files.some((item) => item.parse_status !== "PASS")) hardFailures.push("json_invalid");
  if (summary.online_sanity.routes?.some((item) => item.classification === "FAIL" || item.classification === "FAIL_TIMEOUT")) hardFailures.push("online_sanity_fail");
  if (hardFailures.length) return { overall_status: "FAIL", hard_failures: hardFailures };
  const degradedReasons = [];
  if (summary.desktop_copy.status !== "PASS" && summary.desktop_copy.status !== "SKIPPED") degradedReasons.push(summary.desktop_copy.status);
  if (summary.online_sanity.routes?.some((item) => item.classification === "PASS_WITH_ACCEPTED_DEGRADED")) degradedReasons.push("accepted_route_degraded");
  if (degradedReasons.length) return { overall_status: "DEGRADED", degraded_reasons: degradedReasons };
  return { overall_status: "PASS", degraded_reasons: [] };
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const summary = { stage: "stage48-wika-report-package-operationalization", generated_at: new Date().toISOString(), mode: { dry_run: args.dryRun, check_only: args.checkOnly, skip_pdf: args.skipPdf, skip_desktop_copy: args.skipDesktopCopy }, markdown: checkMarkdownReports(), pdf: checkPdfReports(args.skipPdf), json_files: JSON_FILES.map(parseJsonStatus), desktop_copy: checkDesktopCopies(args.skipDesktopCopy), online_sanity: await runOnlineSanity(args.dryRun), boundaries: ["not task 1 complete", "not task 2 complete", "not task 3 complete", "not task 4 complete", "not task 5 complete", "task 6 excluded", "no write action attempted", "WIKA-only thread for business work", "XD untouched in business execution", "not full business cockpit"] };
  Object.assign(summary, buildOverallStatus(summary));
  if (args.outputJson) writeJson(args.outputPath, summary);
  console.log(JSON.stringify({ stage: summary.stage, overall_status: summary.overall_status, markdown_reports: `${summary.markdown.pass_count}/${summary.markdown.expected_count}`, pdf_reports: summary.pdf.skipped ? "skipped" : `${summary.pdf.pass_count}/${summary.pdf.expected_count}`, desktop_copy_status: summary.desktop_copy.status, online_sanity: summary.online_sanity.routes?.map((item) => ({ key: item.key, classification: item.classification })) }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
