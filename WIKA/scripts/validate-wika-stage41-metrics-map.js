import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, "..", "..")
const EVIDENCE_PATH = path.join(
  ROOT_DIR,
  "WIKA",
  "docs",
  "framework",
  "evidence",
  "wika-stage41-metrics-map.json"
)

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

const raw = fs.readFileSync(EVIDENCE_PATH, "utf8")
const data = JSON.parse(raw)

assert(data.stage === "stage41", "stage 标记错误")
assert(data.domains?.store_operations, "缺 store_operations")
assert(data.domains?.product_operations, "缺 product_operations")
assert(data.domains?.order_operations, "缺 order_operations")
assert(data.domains?.ads_delivery, "缺 ads_delivery")
assert(data.domains?.content_page_optimization, "缺 content_page_optimization")
assert(data.domains?.workbench_inputs, "缺 workbench_inputs")
assert(
  data.domains.ads_delivery.status === "import_required",
  "ads_delivery 状态应为 import_required"
)
assert(
  Array.isArray(data.domains.store_operations.official_fields) &&
    data.domains.store_operations.official_fields.includes("visitor"),
  "store official fields 缺 visitor"
)
assert(
  Array.isArray(data.domains.product_operations.official_fields) &&
    data.domains.product_operations.official_fields.includes("keyword_effects"),
  "product official fields 缺 keyword_effects"
)
assert(
  Array.isArray(data.domains.order_operations.unavailable_dimensions) &&
    data.domains.order_operations.unavailable_dimensions.includes("country_structure"),
  "order unavailable 缺 country_structure"
)

console.log(
  JSON.stringify(
    {
      ok: true,
      stage: "stage41",
      validated_file: EVIDENCE_PATH
    },
    null,
    2
  )
)
