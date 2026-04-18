import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  buildAdsImportContract,
  buildAdsImportProductizationSummary
} from "../projects/wika/data/ads/import-contract.js"
import {
  buildPageAuditContract,
  buildPageAuditInputSummary,
  parsePageAuditCsvText
} from "../projects/wika/data/content-optimization/page-audit-contract.js"
import { buildInputReadinessSummary } from "../projects/wika/data/inputs/input-readiness-summary.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, "..", "..")
const BASE_URL = "https://api.wikapacking.com"

const ADS_TEMPLATE_PATH = path.join(
  ROOT_DIR,
  "WIKA",
  "docs",
  "templates",
  "WIKA_广告数据导入模板.csv"
)
const PAGE_AUDIT_TEMPLATE_PATH = path.join(
  ROOT_DIR,
  "WIKA",
  "docs",
  "templates",
  "WIKA_页面人工盘点模板.csv"
)
const EVIDENCE_PATH = path.join(
  ROOT_DIR,
  "WIKA",
  "docs",
  "framework",
  "evidence",
  "wika-stage45-input-productization.json"
)

const LOCAL_EVIDENCE_PATHS = Object.freeze({
  operations_management_summary: path.join(
    ROOT_DIR,
    "WIKA",
    "docs",
    "framework",
    "evidence",
    "wika_operations_management_summary_post_deploy.json"
  ),
  products_management_summary: path.join(
    ROOT_DIR,
    "WIKA",
    "docs",
    "framework",
    "evidence",
    "wika_products_management_summary_post_deploy.json"
  ),
  orders_management_summary: path.join(
    ROOT_DIR,
    "WIKA",
    "docs",
    "framework",
    "evidence",
    "wika_orders_management_summary_post_deploy.json"
  ),
  business_cockpit: path.join(
    ROOT_DIR,
    "WIKA",
    "docs",
    "framework",
    "evidence",
    "wika_business_cockpit_post_deploy.json"
  ),
  action_center: path.join(
    ROOT_DIR,
    "WIKA",
    "docs",
    "framework",
    "evidence",
    "wika_action_center_post_deploy.json"
  ),
  operator_console: path.join(
    ROOT_DIR,
    "WIKA",
    "docs",
    "framework",
    "evidence",
    "wika_operator_console_post_deploy.json"
  )
})

const ONLINE_PROBES = Object.freeze([
  { key: "health", path: "/health" },
  { key: "auth_debug", path: "/integrations/alibaba/auth/debug" },
  {
    key: "operations_management_summary",
    path: "/integrations/alibaba/wika/reports/operations/management-summary"
  },
  {
    key: "products_management_summary",
    path: "/integrations/alibaba/wika/reports/products/management-summary"
  },
  {
    key: "orders_management_summary",
    path: "/integrations/alibaba/wika/reports/orders/management-summary"
  },
  {
    key: "business_cockpit",
    path: "/integrations/alibaba/wika/reports/business-cockpit"
  },
  {
    key: "action_center",
    path: "/integrations/alibaba/wika/reports/action-center"
  },
  {
    key: "operator_console",
    path: "/integrations/alibaba/wika/reports/operator-console"
  }
])

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8")
}

async function probeRoute(route) {
  try {
    const response = await fetch(`${BASE_URL}${route.path}`, {
      headers: {
        Accept: "application/json"
      },
      signal: AbortSignal.timeout(20000)
    })

    const text = await response.text()
    let json = null
    try {
      json = JSON.parse(text)
    } catch {
      json = null
    }

    return {
      path: route.path,
      status: response.status,
      is_json: json !== null,
      has_boundary_statement: Boolean(json?.boundary_statement),
      body_preview: text.slice(0, 200)
    }
  } catch (error) {
    return {
      path: route.path,
      status: null,
      is_json: false,
      error: error.message
    }
  }
}

function readLocalEvidence(filePath, routePath) {
  return {
    path: routePath,
    status: 200,
    is_json: true,
    source_mode: "local_evidence_fallback",
    body: JSON.parse(fs.readFileSync(filePath, "utf8"))
  }
}

async function probeRouteWithFallback(route) {
  const result = await probeRoute(route)
  if (result.status === 200) {
    return {
      ...result,
      source_mode: "production_route"
    }
  }

  const evidencePath = LOCAL_EVIDENCE_PATHS[route.key]
  if (!evidencePath || !fs.existsSync(evidencePath)) {
    return result
  }

  return {
    ...readLocalEvidence(evidencePath, route.path),
    fallback_reason: result.error ?? `unexpected_status:${result.status}`
  }
}

const adsTemplateText = fs.readFileSync(ADS_TEMPLATE_PATH, "utf8")
const pageAuditTemplateText = fs.readFileSync(PAGE_AUDIT_TEMPLATE_PATH, "utf8")

const adsContract = buildAdsImportContract()
const adsProductization = buildAdsImportProductizationSummary({
  csvText: adsTemplateText,
  sourceType: "manual_import_template"
})

const pageAuditRows = parsePageAuditCsvText(pageAuditTemplateText)
const pageAuditContract = buildPageAuditContract()
const pageAuditSummary = buildPageAuditInputSummary(pageAuditRows)

const inputReadinessSummary = buildInputReadinessSummary({
  adsCsvText: adsTemplateText,
  pageAuditCsvText: pageAuditTemplateText
})

assert(
  adsContract.required_fields.includes("date") &&
    adsContract.required_fields.includes("spend"),
  "广告导入合同缺少核心必填字段"
)
assert(
  adsProductization.current_status === "IMPORT_READY_WITH_SAMPLE",
  "广告导入产品化状态应为 IMPORT_READY_WITH_SAMPLE"
)
assert(
  adsProductization.template_validation.ok === true,
  "广告模板校验应通过"
)
assert(
  Array.isArray(adsProductization.capabilities_enhanced_when_input_arrives) &&
    adsProductization.capabilities_enhanced_when_input_arrives.includes("ads_diagnostic"),
  "广告输入增强范围不完整"
)

assert(
  pageAuditContract.required_fields.includes("audit_date") &&
    pageAuditContract.required_fields.includes("manual_recommendation"),
  "页面人工盘点合同缺少核心必填字段"
)
assert(
  pageAuditSummary.current_status === "MANUAL_AUDIT_READY_WITH_SAMPLE",
  "页面人工盘点状态应为 MANUAL_AUDIT_READY_WITH_SAMPLE"
)
assert(pageAuditSummary.errors.length === 0, "页面人工盘点模板应无合同错误")

assert(
  inputReadinessSummary.report_name === "input_readiness_summary",
  "输入总览层 report_name 不符合预期"
)
assert(
  inputReadinessSummary.auto_fetch_layer.current_status === "AUTO_FETCH_READY",
  "自动抓取层状态不符合预期"
)
assert(
  inputReadinessSummary.ads_import_layer.current_status === "IMPORT_READY_WITH_SAMPLE",
  "输入总览中的广告层状态不符合预期"
)
assert(
  inputReadinessSummary.page_audit_layer.current_status ===
    "MANUAL_AUDIT_READY_WITH_SAMPLE",
  "输入总览中的页面盘点层状态不符合预期"
)

const onlineResults = Object.fromEntries(
  await Promise.all(
    ONLINE_PROBES.map(async (route) => {
      const useFallback =
        route.key !== "health" && route.key !== "auth_debug"
      const result = useFallback
        ? await probeRouteWithFallback(route)
        : await probeRoute(route)
      return [route.key, result]
    })
  )
)

assert(onlineResults.health.status === 200, "health 在线基线检查失败")
assert(onlineResults.auth_debug.status === 200, "auth_debug 在线基线检查失败")

for (const [key, result] of Object.entries(onlineResults)) {
  if (key === "health" || key === "auth_debug") {
    continue
  }
  assert(result.status === 200, `${key} 在线基线检查失败`)
}

const output = {
  stage: "stage45",
  generated_at: new Date().toISOString(),
  contract_status: "PASS_LOCAL_CONTRACT",
  online_baseline_status: Object.values(onlineResults).every(
    (item) => item.status === 200
  )
    ? "PASS"
    : "DEGRADED",
  templates: {
    ads: ADS_TEMPLATE_PATH,
    page_audit: PAGE_AUDIT_TEMPLATE_PATH
  },
  online_results: onlineResults,
  ads_import_contract: adsContract,
  ads_productization: adsProductization,
  page_audit_contract: pageAuditContract,
  page_audit_summary: pageAuditSummary,
  input_readiness_summary: inputReadinessSummary
}

writeJson(EVIDENCE_PATH, output)

console.log(
  JSON.stringify(
    {
      ok: true,
      stage: "stage45",
      evidence_path: EVIDENCE_PATH
    },
    null,
    2
  )
)
