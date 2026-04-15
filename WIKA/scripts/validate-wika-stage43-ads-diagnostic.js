import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { parseAdsCsvText } from "../projects/wika/data/ads/normalizer.js"
import {
  buildAdsActionCenterReport,
  buildAdsComparisonReport,
  buildAdsDiagnosticReport,
  buildAdsSummaryReport
} from "../projects/wika/data/ads/diagnostics.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, "..", "..")
const SAMPLE_CSV_PATH = path.join(
  ROOT_DIR,
  "WIKA",
  "projects",
  "wika",
  "data",
  "ads",
  "sample-import.csv"
)
const EVIDENCE_PATH = path.join(
  ROOT_DIR,
  "WIKA",
  "docs",
  "framework",
  "evidence",
  "wika-stage43-ads-diagnostic.json"
)

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8")
}

const rows = parseAdsCsvText(fs.readFileSync(SAMPLE_CSV_PATH, "utf8"))
const windows = {
  current: { start: "2026-04-08", end: "2026-04-12" },
  previous: { start: "2026-04-01", end: "2026-04-03" }
}

const summary = buildAdsSummaryReport(rows, { source_type: "manual_import" })
const comparison = buildAdsComparisonReport(rows, windows, {
  source_type: "manual_import"
})
const diagnostic = buildAdsDiagnosticReport(rows, windows, {
  source_type: "manual_import"
})
const actionCenter = buildAdsActionCenterReport(rows, windows, {
  source_type: "manual_import"
})

assert(summary.report_name === "ads_summary", "ads_summary report_name 错误")
assert(comparison.report_name === "ads_comparison", "ads_comparison report_name 错误")
assert(diagnostic.report_name === "ads_diagnostic", "ads_diagnostic report_name 错误")
assert(
  actionCenter.report_name === "ads_action_center",
  "ads_action_center report_name 错误"
)
assert(
  Array.isArray(diagnostic.diagnostic_findings) &&
    diagnostic.diagnostic_findings.length > 0,
  "ads diagnostic findings 不能为空"
)
assert(
  Array.isArray(diagnostic.recommendations) && diagnostic.recommendations.length > 0,
  "ads recommendations 不能为空"
)
assert(
  comparison.derived_comparison?.metric_deltas?.spend,
  "ads comparison 缺 spend delta"
)
assert(
  Array.isArray(actionCenter.prioritized_actions) &&
    actionCenter.prioritized_actions.length > 0,
  "ads action center 缺 prioritized_actions"
)

const output = {
  stage: "stage43",
  generated_at: new Date().toISOString(),
  source_file: SAMPLE_CSV_PATH,
  contract_status: "PASS_LOCAL_CONTRACT",
  windows,
  summary,
  comparison,
  diagnostic,
  action_center: actionCenter
}

writeJson(EVIDENCE_PATH, output)

console.log(
  JSON.stringify(
    {
      ok: true,
      stage: "stage43",
      evidence_path: EVIDENCE_PATH
    },
    null,
    2
  )
)
