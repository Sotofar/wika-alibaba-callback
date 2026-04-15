import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  buildAdsImportSummary,
  parseAdsCsvText
} from "../projects/wika/data/ads/normalizer.js"

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
  "wika-stage42-ads-import-layer.json"
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

const csvText = fs.readFileSync(SAMPLE_CSV_PATH, "utf8")
const rows = parseAdsCsvText(csvText)
const summary = buildAdsImportSummary(rows, {
  source_type: "manual_import"
})

assert(summary.ok === true, "ads import summary 应该通过本地合同")
assert(summary.normalized_row_count === 8, "sample rows 数量不符合预期")
assert(summary.summary?.campaign_count >= 3, "campaign_count 不符合预期")
assert(summary.summary?.metric_totals?.spend > 0, "spend 汇总应大于 0")
assert(summary.summary?.metric_totals?.clicks > 0, "clicks 汇总应大于 0")
assert(
  Array.isArray(summary.unavailable_dimensions) &&
    summary.unavailable_dimensions.includes("official_ads_api_route"),
  "缺 official_ads_api_route unavailable"
)

const output = {
  stage: "stage42",
  generated_at: new Date().toISOString(),
  source_file: SAMPLE_CSV_PATH,
  source_type: "manual_import",
  contract_status: "PASS_LOCAL_CONTRACT",
  summary
}

writeJson(EVIDENCE_PATH, output)

console.log(
  JSON.stringify(
    {
      ok: true,
      stage: "stage42",
      evidence_path: EVIDENCE_PATH
    },
    null,
    2
  )
)
