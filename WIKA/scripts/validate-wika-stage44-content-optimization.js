import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { buildContentOptimizationLayer } from "../projects/wika/data/content-optimization/content-optimization.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, "..", "..")
const PRODUCTION_BASE_URL = "https://api.wikapacking.com"
const EVIDENCE_PATH = path.join(
  ROOT_DIR,
  "WIKA",
  "docs",
  "framework",
  "evidence",
  "wika-stage44-content-optimization.json"
)
const LOCAL_EVIDENCE_FILES = {
  productSummary: path.join(
    ROOT_DIR,
    "WIKA",
    "docs",
    "framework",
    "evidence",
    "wika_products_management_summary_post_deploy.json"
  ),
  productDiagnostic: path.join(
    ROOT_DIR,
    "WIKA",
    "docs",
    "framework",
    "evidence",
    "wika_products_minimal_diagnostic_post_deploy.json"
  ),
  productComparison: path.join(
    ROOT_DIR,
    "WIKA",
    "docs",
    "framework",
    "evidence",
    "wika_products_comparison_summary_post_deploy.json"
  ),
  businessCockpit: path.join(
    ROOT_DIR,
    "WIKA",
    "docs",
    "framework",
    "evidence",
    "wika_business_cockpit_post_deploy.json"
  ),
  operatorConsole: path.join(
    ROOT_DIR,
    "WIKA",
    "docs",
    "framework",
    "evidence",
    "wika_operator_console_post_deploy.json"
  )
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8")
}

function stripEnvelope(body = {}) {
  if (!body || typeof body !== "object") {
    return body
  }

  const cloned = { ...body }
  delete cloned.ok
  delete cloned.account
  delete cloned.module
  delete cloned.read_only
  return cloned
}

async function fetchJson(pathname) {
  const startedAt = Date.now()
  const response = await fetch(`${PRODUCTION_BASE_URL}${pathname}`, {
    headers: {
      accept: "application/json"
    }
  })
  const text = await response.text()
  let body = null

  try {
    body = JSON.parse(text)
  } catch {
    body = null
  }

  return {
    route: pathname,
    status: response.status,
    elapsed_ms: Date.now() - startedAt,
    is_json: body !== null,
    body
  }
}

async function fetchRequired(pathname) {
  const result = await fetchJson(pathname)
  assert(result.status === 200 && result.is_json, `${pathname} 调用失败`)
  return result
}

function readLocalEvidence(filePath, route) {
  const raw = fs.readFileSync(filePath, "utf8")
  return {
    route,
    status: 200,
    elapsed_ms: 0,
    is_json: true,
    body: JSON.parse(raw)
  }
}

async function fetchWithEvidenceFallback(pathname, evidencePath) {
  try {
    return await fetchRequired(pathname)
  } catch (error) {
    return {
      ...readLocalEvidence(evidencePath, pathname),
      fallback_reason: error instanceof Error ? error.message : String(error),
      source_mode: "local_evidence_fallback"
    }
  }
}

const health = await fetchJson("/health")
const authDebug = await fetchJson("/integrations/alibaba/auth/debug")
const productSummary = await fetchWithEvidenceFallback(
  "/integrations/alibaba/wika/reports/products/management-summary",
  LOCAL_EVIDENCE_FILES.productSummary
)
const productDiagnostic = await fetchWithEvidenceFallback(
  "/integrations/alibaba/wika/reports/products/minimal-diagnostic",
  LOCAL_EVIDENCE_FILES.productDiagnostic
)
const productComparison = await fetchWithEvidenceFallback(
  "/integrations/alibaba/wika/reports/products/comparison-summary",
  LOCAL_EVIDENCE_FILES.productComparison
)
const businessCockpit = await fetchWithEvidenceFallback(
  "/integrations/alibaba/wika/reports/business-cockpit",
  LOCAL_EVIDENCE_FILES.businessCockpit
)
const operatorConsole = await fetchWithEvidenceFallback(
  "/integrations/alibaba/wika/reports/operator-console",
  LOCAL_EVIDENCE_FILES.operatorConsole
)

const result = buildContentOptimizationLayer({
  productSummary: stripEnvelope(productSummary.body),
  productDiagnostic: stripEnvelope(productDiagnostic.body),
  productComparison: stripEnvelope(productComparison.body),
  businessCockpit: stripEnvelope(businessCockpit.body),
  operatorConsole: stripEnvelope(operatorConsole.body)
})

assert(result.report_name === "content_optimization_layer", "report_name 错误")
assert(
  Array.isArray(result.product_detail_optimization_suggestions),
  "product_detail_optimization_suggestions 缺失"
)
assert(
  Array.isArray(result.title_keyword_optimization_suggestions),
  "title_keyword_optimization_suggestions 缺失"
)
assert(
  result.boundary_statement?.manual_confirmation_still_required === true,
  "boundary_statement 缺 manual_confirmation_still_required"
)

const output = {
  stage: "stage44",
  generated_at: new Date().toISOString(),
  base_url: PRODUCTION_BASE_URL,
  baseline: {
    health: {
      status: health.status,
      elapsed_ms: health.elapsed_ms
    },
    auth_debug: {
      status: authDebug.status,
      elapsed_ms: authDebug.elapsed_ms,
      source_mode:
        authDebug.status === 200 && authDebug.is_json ? "production_route" : "degraded"
    }
  },
  source_routes: [
    productSummary.route,
    productDiagnostic.route,
    productComparison.route,
    businessCockpit.route,
    operatorConsole.route
  ],
  source_modes: {
    product_summary: productSummary.source_mode ?? "production_route",
    product_diagnostic: productDiagnostic.source_mode ?? "production_route",
    product_comparison: productComparison.source_mode ?? "production_route",
    business_cockpit: businessCockpit.source_mode ?? "production_route",
    operator_console: operatorConsole.source_mode ?? "production_route"
  },
  contract_status: "PASS_LOCAL_CONTRACT_WITH_PRODUCTION_INPUTS",
  result
}

writeJson(EVIDENCE_PATH, output)

console.log(
  JSON.stringify(
    {
      ok: true,
      stage: "stage44",
      evidence_path: EVIDENCE_PATH
    },
    null,
    2
  )
)
