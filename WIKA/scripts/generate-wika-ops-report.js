import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { renderOpsReportMarkdown, renderOpsReportSummaryMarkdown } from "../projects/wika/data/reports/report-layout.js"
import { buildReportModel } from "../projects/wika/data/reports/report-writer.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, "..", "..")
const WIKA_DIR = path.join(ROOT_DIR, "WIKA")
const REPORT_DIR = path.join(WIKA_DIR, "docs", "reports")
const BASE_URL = "https://api.wikapacking.com"

const OUTPUTS = {
  report: path.join(REPORT_DIR, "WIKA_运营示范报告.md"),
  reportSummary: path.join(REPORT_DIR, "WIKA_运营示范报告摘要.md"),
  evidence: path.join(REPORT_DIR, "WIKA_运营示范报告证据.json")
}

const FALLBACK_FILES = {
  summary: path.join(REPORT_DIR, "WIKA_全平台诊断摘要.json"),
  evidence: path.join(REPORT_DIR, "WIKA_全平台诊断证据.json")
}

const ROUTES = {
  health: { method: "GET", path: "/health" },
  authDebug: { method: "GET", path: "/integrations/alibaba/auth/debug" },
  operationsManagementSummary: {
    method: "GET",
    path: "/integrations/alibaba/wika/reports/operations/management-summary"
  },
  productsManagementSummary: {
    method: "GET",
    path: "/integrations/alibaba/wika/reports/products/management-summary"
  },
  ordersManagementSummary: {
    method: "GET",
    path: "/integrations/alibaba/wika/reports/orders/management-summary"
  },
  operationsMinimalDiagnostic: {
    method: "GET",
    path: "/integrations/alibaba/wika/reports/operations/minimal-diagnostic"
  },
  productsMinimalDiagnostic: {
    method: "GET",
    path: "/integrations/alibaba/wika/reports/products/minimal-diagnostic"
  },
  ordersMinimalDiagnostic: {
    method: "GET",
    path: "/integrations/alibaba/wika/reports/orders/minimal-diagnostic"
  },
  operationsComparisonSummary: {
    method: "GET",
    path: "/integrations/alibaba/wika/reports/operations/comparison-summary"
  },
  productsComparisonSummary: {
    method: "GET",
    path: "/integrations/alibaba/wika/reports/products/comparison-summary"
  },
  ordersComparisonSummary: {
    method: "GET",
    path: "/integrations/alibaba/wika/reports/orders/comparison-summary"
  },
  businessCockpit: {
    method: "GET",
    path: "/integrations/alibaba/wika/reports/business-cockpit"
  },
  actionCenter: {
    method: "GET",
    path: "/integrations/alibaba/wika/reports/action-center"
  },
  operatorConsole: {
    method: "GET",
    path: "/integrations/alibaba/wika/reports/operator-console"
  },
  productDraftWorkbench: {
    method: "GET",
    path: "/integrations/alibaba/wika/workbench/product-draft-workbench"
  },
  replyWorkbench: {
    method: "GET",
    path: "/integrations/alibaba/wika/workbench/reply-workbench"
  },
  orderWorkbench: {
    method: "GET",
    path: "/integrations/alibaba/wika/workbench/order-workbench"
  },
  taskWorkbench: {
    method: "GET",
    path: "/integrations/alibaba/wika/workbench/task-workbench"
  },
  productDraftPreview: {
    method: "POST",
    path: "/integrations/alibaba/wika/workbench/product-draft-preview"
  },
  replyPreview: {
    method: "POST",
    path: "/integrations/alibaba/wika/workbench/reply-preview"
  },
  orderPreview: {
    method: "POST",
    path: "/integrations/alibaba/wika/workbench/order-preview"
  }
}

const POST_INPUTS = {
  productDraftPreview: {
    product_id: "1601740791024",
    base_name: "Portable eyeglasses case",
    material: "PU leather",
    positioning: "protective eyewear packaging",
    selling_points: ["portable", "custom logo", "anti-scratch"],
    keyword_hints: ["eyeglasses case", "sunglasses holder", "custom logo"],
    application: "optical shop packaging",
    customization: "logo printing",
    packaging_notes: "export carton",
    moq: "1000 pcs",
    lead_time: "25-30 days after artwork approval"
  },
  replyPreview: {
    inquiry_text:
      "Hello, please quote 1000 pcs custom sunglasses cases with logo and confirm lead time.",
    product_id: "1601740791024",
    quantity: "1000 pcs",
    destination_country: "United States",
    target_price: "0.65",
    expected_lead_time: "25-30 days after artwork approval",
    customer_profile: {
      company_name: "TEST BUYER / DO-NOT-USE",
      contact_name: "Sample Buyer"
    },
    language: "en"
  },
  orderPreview: {
    company_name: "TEST BUYER / DO-NOT-USE",
    contact_name: "Sample Buyer",
    email: "buyer@example.com",
    country_name: "United States",
    country_code: "US",
    line_items: [
      {
        product_id: "1601740791024",
        quantity: "1000",
        unit: "Pieces",
        unit_price: "0.65",
        currency: "USD"
      }
    ],
    payment_terms: {
      currency: "USD",
      total_amount: "650",
      advance_amount: "195",
      payment_terms_text: "30% deposit, balance before shipment"
    },
    shipment_plan: {
      trade_term: "FOB",
      shipment_method: "sea",
      lead_time_text: "25-30 days after artwork approval",
      destination_country: "United States"
    }
  }
}

function ensureDir(target) {
  fs.mkdirSync(target, { recursive: true })
}

function writeText(filePath, value) {
  ensureDir(path.dirname(filePath))
  fs.writeFileSync(filePath, value, "utf8")
}

function writeJson(filePath, value) {
  writeText(filePath, `${JSON.stringify(value, null, 2)}\n`)
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"))
}

function sanitize(node) {
  if (Array.isArray(node)) {
    return node.slice(0, 40).map((item) => sanitize(item))
  }

  if (!node || typeof node !== "object") {
    return node
  }

  const output = {}
  for (const [key, value] of Object.entries(node)) {
    if (/^xd_/i.test(key) || /^xd$/i.test(key)) {
      continue
    }

    if (/(token|secret|sign|cookie|authorization|app_key|client_secret)/i.test(key)) {
      output[key] = "***"
      continue
    }

    if (/(trade_id|e_trade_id|email|phone|address|member|buyer)/i.test(key)) {
      output[key] = "***"
      continue
    }

    output[key] = sanitize(value)
  }

  return output
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

function routeSuccess(name, result) {
  if (!result) {
    return false
  }

  if (name === "health") {
    return result.status === 200
  }

  return result.status === 200 && result.is_json && result.body !== null && result.body?.ok !== false
}

async function fetchRoute(name, route) {
  const startedAt = Date.now()
  const response = await fetch(`${BASE_URL}${route.path}`, {
    method: route.method,
    headers: {
      accept: "application/json",
      ...(route.method === "POST" ? { "content-type": "application/json" } : {})
    },
    ...(route.method === "POST" ? { body: JSON.stringify(POST_INPUTS[name] ?? {}) } : {})
  })
  const text = await response.text()
  let body = null
  try {
    body = JSON.parse(text)
  } catch {
    body = null
  }

  return {
    name,
    path: route.path,
    method: route.method,
    status: response.status,
    elapsed_ms: Date.now() - startedAt,
    is_json: body !== null,
    body,
    text,
    source: "live",
    note: response.status === 200 ? "ok" : "live_failed"
  }
}

function buildFallbackResult(name, route, stored = {}) {
  return {
    name,
    path: route.path,
    method: route.method,
    status: stored.status ?? null,
    elapsed_ms: null,
    is_json: Boolean(stored.body),
    body: stored.body ?? null,
    text: null,
    source: "fallback",
    note: "fallback_from_last_report"
  }
}

async function collectRouteResults() {
  const previousEvidence = readJsonIfExists(FALLBACK_FILES.evidence) ?? {}
  const previousRouteResults = previousEvidence.route_results ?? {}
  const results = {}

  for (const [name, route] of Object.entries(ROUTES)) {
    try {
      const live = await fetchRoute(name, route)
      if (routeSuccess(name, live)) {
        results[name] = live
        continue
      }

      if (previousRouteResults[name]) {
        results[name] = buildFallbackResult(name, route, previousRouteResults[name])
        continue
      }

      results[name] = live
    } catch (error) {
      if (previousRouteResults[name]) {
        results[name] = buildFallbackResult(name, route, previousRouteResults[name])
      } else {
        results[name] = {
          name,
          path: route.path,
          method: route.method,
          status: null,
          elapsed_ms: null,
          is_json: false,
          body: null,
          text: null,
          source: "live",
          note: error.message
        }
      }
    }
  }

  return {
    previousEvidence,
    results
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

async function run() {
  const generatedAt = new Date().toISOString()
  const { previousEvidence, results } = await collectRouteResults()
  const routeUsage = Object.values(results).map((item) => ({
    method: item.method,
    path: item.path,
    status: item.status ?? "failed",
    success: routeSuccess(item.name, item),
    source: item.source,
    note: item.note
  }))

  assert(
    routeSuccess("health", results.health),
    "/health 不可用，无法继续生成示范报告。"
  )
  assert(
    routeSuccess("authDebug", results.authDebug),
    "/integrations/alibaba/auth/debug 不可用，无法继续生成示范报告。"
  )

  const criticalKeys = [
    "operationsManagementSummary",
    "productsManagementSummary",
    "ordersManagementSummary",
    "operationsMinimalDiagnostic",
    "productsMinimalDiagnostic",
    "ordersMinimalDiagnostic",
    "operationsComparisonSummary",
    "productsComparisonSummary",
    "ordersComparisonSummary",
    "businessCockpit",
    "actionCenter",
    "operatorConsole"
  ]

  const criticalSuccessCount = criticalKeys.filter((key) => routeSuccess(key, results[key])).length
  assert(
    criticalSuccessCount >= 9,
    "核心 route 成功数量不足，当前无法形成可信示范报告。"
  )

  const data = Object.fromEntries(
    Object.entries(results).map(([key, result]) => [key, stripEnvelope(result.body)])
  )

  const report = buildReportModel({
    generated_at: generatedAt,
    route_usage: routeUsage,
    data
  })

  assert(report.self_score.pass, "示范报告自评分未过线，必须继续修改。")

  const evidence = {
    generated_at: generatedAt,
    report_title: report.title,
    route_usage: routeUsage,
    raw_route_results: Object.fromEntries(
      Object.entries(results).map(([key, value]) => [
        key,
        {
          path: value.path,
          method: value.method,
          status: value.status,
          source: value.source,
          note: value.note,
          body: sanitize(value.body)
        }
      ])
    ),
    previous_report_fallback_available: Boolean(previousEvidence?.route_results),
    report_model: sanitize(report)
  }

  const markdown = renderOpsReportMarkdown(report)
  const summaryMarkdown = renderOpsReportSummaryMarkdown(report)

  writeText(OUTPUTS.report, markdown)
  writeText(OUTPUTS.reportSummary, summaryMarkdown)
  writeJson(OUTPUTS.evidence, evidence)

  console.log(
    JSON.stringify(
      {
        ok: true,
        generated_at: generatedAt,
        report_path: OUTPUTS.report,
        summary_path: OUTPUTS.reportSummary,
        evidence_path: OUTPUTS.evidence,
        route_success_count: routeUsage.filter((item) => item.success).length,
        route_failure_count: routeUsage.filter((item) => !item.success).length,
        self_score: report.self_score
      },
      null,
      2
    )
  )
}

run().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error.message
      },
      null,
      2
    )
  )
  process.exitCode = 1
})
