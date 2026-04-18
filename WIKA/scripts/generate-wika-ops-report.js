import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import {
  renderOpsReportMarkdown,
  renderOpsReportSummaryMarkdown
} from "../projects/wika/data/reports/report-layout.js"
import { buildReportModel } from "../projects/wika/data/reports/report-writer.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, "..", "..")
const WIKA_DIR = path.join(ROOT_DIR, "WIKA")
const REPORT_DIR = path.join(WIKA_DIR, "docs", "reports")
const EVIDENCE_DIR = path.join(WIKA_DIR, "docs", "framework", "evidence")
const TEMPLATE_DIR = path.join(WIKA_DIR, "docs", "templates")
const BASE_URL = "https://api.wikapacking.com"
const FETCH_TIMEOUT_MS = 18000

const OUTPUTS = {
  report: path.join(REPORT_DIR, "WIKA_运营示范报告.md"),
  reportSummary: path.join(REPORT_DIR, "WIKA_运营示范报告摘要.md"),
  evidence: path.join(REPORT_DIR, "WIKA_运营示范报告证据.json"),
  score: path.join(REPORT_DIR, "WIKA_运营示范报告评分.json")
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
  previewCenter: {
    method: "GET",
    path: "/integrations/alibaba/wika/workbench/preview-center"
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

function normalizeDegradedMarker(marker) {
  if (!marker) {
    return null
  }

  if (typeof marker === "string") {
    return marker
  }

  if (typeof marker === "object") {
    return (
      marker.section ??
      marker.name ??
      marker.key ??
      marker.reason ??
      marker.code ??
      marker.message ??
      null
    )
  }

  return null
}

function classifyRouteState(name, status, body, text) {
  if (name === "health") {
    return {
      route_state: status === 200 ? "full_success" : "failed",
      degraded_reason: null
    }
  }

  if (status !== 200 || body === null || body?.ok === false) {
    return {
      route_state: "failed",
      degraded_reason: body?.error_message ?? body?.message ?? text?.slice(0, 160) ?? "non_200_or_non_json"
    }
  }

  const degradedReasons = []
  const partialStatus = body?.partial_status
  const topLevelStatus = [body?.status, body?.route_status, body?.report_status, body?.execution_status].find(
    (value) => typeof value === "string"
  )
  const degradedSections = []

  if (Array.isArray(body?.degraded_sections) && body.degraded_sections.length > 0) {
    degradedSections.push(...body.degraded_sections)
  }

  if (typeof partialStatus === "string" && /degraded|partial/i.test(partialStatus)) {
    degradedReasons.push(partialStatus)
  }

  if (partialStatus && typeof partialStatus === "object") {
    if (typeof partialStatus.status === "string" && /degraded|partial/i.test(partialStatus.status)) {
      degradedReasons.push(partialStatus.status)
    }
    if (Array.isArray(partialStatus.degraded_sections) && partialStatus.degraded_sections.length > 0) {
      degradedSections.push(...partialStatus.degraded_sections)
    }
  }

  if (topLevelStatus && /degraded|partial/i.test(topLevelStatus)) {
    degradedReasons.push(topLevelStatus)
  }

  const bodyText = JSON.stringify(
    {
      degraded_sections: degradedSections,
      partial_status: partialStatus,
      error: body?.error,
      message: body?.message,
      status: topLevelStatus
    },
    null,
    2
  )

  if (/time_budget_exceeded|timeout/i.test(bodyText)) {
    degradedReasons.push("time_budget_exceeded")
  }

  if (degradedReasons.length > 0 || degradedSections.length > 0) {
    const readableReasons = [...new Set([...degradedReasons, ...degradedSections].map((item) => normalizeDegradedMarker(item)).filter(Boolean))]
    return {
      route_state: "degraded",
      degraded_reason: readableReasons.join(", ")
    }
  }

  return {
    route_state: "full_success",
    degraded_reason: null
  }
}

async function fetchRoute(name, route) {
  const startedAt = Date.now()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(`${BASE_URL}${route.path}`, {
      method: route.method,
      headers: {
        accept: "application/json",
        ...(route.method === "POST" ? { "content-type": "application/json" } : {})
      },
      signal: controller.signal,
      ...(route.method === "POST" ? { body: JSON.stringify(POST_INPUTS[name] ?? {}) } : {})
    })

    const text = await response.text()
    let body = null
    try {
      body = JSON.parse(text)
    } catch {
      body = null
    }

    const classification = classifyRouteState(name, response.status, body, text)

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
      note: response.status === 200 ? "ok" : "live_failed",
      route_state: classification.route_state,
      degraded_reason: classification.degraded_reason
    }
  } catch (error) {
    return {
      name,
      path: route.path,
      method: route.method,
      status: null,
      elapsed_ms: Date.now() - startedAt,
      is_json: false,
      body: null,
      text: null,
      source: "live",
      note: error.name === "AbortError" ? "timeout" : error.message,
      route_state: "failed",
      degraded_reason: null
    }
  } finally {
    clearTimeout(timeout)
  }
}

async function collectRouteResults() {
  const entries = await Promise.all(
    Object.entries(ROUTES).map(async ([name, route]) => [name, await fetchRoute(name, route)])
  )
  return Object.fromEntries(entries)
}

function buildLocalAssets() {
  return {
    stage45_input_evidence: readJsonIfExists(
      path.join(EVIDENCE_DIR, "wika-stage45-input-productization.json")
    ),
    template_files: {
      ads_csv: path.join(TEMPLATE_DIR, "WIKA_广告数据导入模板.csv"),
      ads_json: path.join(TEMPLATE_DIR, "WIKA_广告数据导入模板.json"),
      page_audit_csv: path.join(TEMPLATE_DIR, "WIKA_页面人工盘点模板.csv"),
      page_audit_json: path.join(TEMPLATE_DIR, "WIKA_页面人工盘点模板.json")
    }
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

async function run() {
  const generatedAt = new Date().toISOString()
  const results = await collectRouteResults()
  const routeUsage = Object.values(results).map((item) => ({
    name: item.name,
    method: item.method,
    path: item.path,
    status: item.status ?? "failed",
    elapsed_ms: item.elapsed_ms,
    is_json: item.is_json,
    route_state: item.route_state,
    degraded_reason: item.degraded_reason,
    note: item.note
  }))

  assert(
    results.health.route_state === "full_success",
    "/health 不可用，当前不能生成可信示范报告。"
  )
  assert(
    results.authDebug.route_state === "full_success",
    "/integrations/alibaba/auth/debug 不可用，当前不能生成可信示范报告。"
  )

  const coreAnalyticKeys = [
    "operationsManagementSummary",
    "productsManagementSummary",
    "ordersManagementSummary",
    "operationsMinimalDiagnostic",
    "productsMinimalDiagnostic",
    "ordersMinimalDiagnostic",
    "operationsComparisonSummary",
    "productsComparisonSummary",
    "ordersComparisonSummary"
  ]

  const coreFullSuccessCount = coreAnalyticKeys.filter(
    (key) => results[key].route_state === "full_success"
  ).length

  assert(coreFullSuccessCount >= 8, "底层稳定 route 成功数量不足，当前无法形成可信示范报告。")

  const data = Object.fromEntries(
    Object.entries(results).map(([key, result]) => [key, stripEnvelope(result.body)])
  )

  const localAssets = buildLocalAssets()
  const report = buildReportModel({
    generated_at: generatedAt,
    route_usage: routeUsage,
    data,
    local_assets: localAssets
  })

  assert(report.self_score.pass, "示范报告自评分未过线，必须继续修改。")

  const evidence = {
    generated_at: generatedAt,
    report_title: report.title,
    route_results: Object.fromEntries(
      Object.entries(results).map(([key, value]) => [
        key,
        {
          path: value.path,
          method: value.method,
          status: value.status,
          route_state: value.route_state,
          degraded_reason: value.degraded_reason,
          elapsed_ms: value.elapsed_ms,
          note: value.note,
          body: sanitize(value.body)
        }
      ])
    ),
    local_assets: sanitize(localAssets),
    report_model: sanitize(report),
    self_score: report.self_score
  }

  const markdown = renderOpsReportMarkdown(report)
  const summaryMarkdown = renderOpsReportSummaryMarkdown(report)

  writeText(OUTPUTS.report, markdown)
  writeText(OUTPUTS.reportSummary, summaryMarkdown)
  writeJson(OUTPUTS.evidence, evidence)
  writeJson(OUTPUTS.score, report.self_score)

  console.log(
    JSON.stringify(
      {
        ok: true,
        generated_at: generatedAt,
        report_path: OUTPUTS.report,
        summary_path: OUTPUTS.reportSummary,
        evidence_path: OUTPUTS.evidence,
        score_path: OUTPUTS.score,
        full_success_count: routeUsage.filter((item) => item.route_state === "full_success").length,
        degraded_count: routeUsage.filter((item) => item.route_state === "degraded").length,
        failed_count: routeUsage.filter((item) => item.route_state === "failed").length,
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
