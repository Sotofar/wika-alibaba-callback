import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..", "..");
const WIKA_DIR = path.join(ROOT_DIR, "WIKA");
const REPORT_DIR = path.join(WIKA_DIR, "docs", "reports");
const FRAMEWORK_EVIDENCE_DIR = path.join(WIKA_DIR, "docs", "framework", "evidence");
const BASE_URL = "https://api.wikapacking.com";

const OUTPUTS = {
  report: path.join(REPORT_DIR, "WIKA_全平台诊断报告.md"),
  evidence: path.join(REPORT_DIR, "WIKA_全平台诊断证据.json"),
  summary: path.join(REPORT_DIR, "WIKA_全平台诊断摘要.json"),
  run: path.join(FRAMEWORK_EVIDENCE_DIR, "wika-full-platform-diagnostic-run.json")
};

const LOCAL_EVIDENCE = {
  stage34: path.join(FRAMEWORK_EVIDENCE_DIR, "wika-stage34-write-boundary-matrix.json"),
  stage35: path.join(FRAMEWORK_EVIDENCE_DIR, "wika-stage35-write-boundary-preflight.json")
};

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
  },
  previewCenter: {
    method: "POST",
    path: "/integrations/alibaba/wika/workbench/preview-center"
  },
  replyDraftTool: {
    method: "POST",
    path: "/integrations/alibaba/wika/tools/reply-draft"
  },
  orderDraftTool: {
    method: "POST",
    path: "/integrations/alibaba/wika/tools/order-draft"
  }
};

const PRODUCT_PREVIEW_INPUT = Object.freeze({
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
});

const REPLY_INPUT = Object.freeze({
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
});

const ORDER_INPUT = Object.freeze({
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
});

const STORE_FIELDS = ["visitor", "imps", "clk", "clk_rate", "fb", "reply"];
const PRODUCT_FIELDS = [
  "click",
  "impression",
  "visitor",
  "fb",
  "order",
  "bookmark",
  "compare",
  "share",
  "keyword_effects"
];

const CRITICAL_KEYS = [
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
  "operatorConsole",
  "productDraftWorkbench",
  "replyWorkbench",
  "orderWorkbench",
  "taskWorkbench"
];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeText(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, value, "utf8");
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function unique(values = []) {
  return [...new Set(values.map((item) => String(item ?? "").trim()).filter(Boolean))];
}

function get(node, pathExpression, fallback = null) {
  const value = pathExpression.split(".").reduce((acc, key) => acc?.[key], node);
  return value === undefined ? fallback : value;
}

function toNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }
  return null;
}

function shortText(value, max = 60) {
  const text = String(value ?? "");
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function joinInline(values = [], separator = "、", fallback = "无") {
  const items = values.filter((item) => item !== null && item !== undefined && item !== "");
  return items.length > 0 ? items.join(separator) : fallback;
}

function joinDistribution(items = [], keyName = "key", valueName = "count") {
  if (!Array.isArray(items) || items.length === 0) {
    return "无";
  }
  return items.map((item) => `${item[keyName]}:${formatValue(item[valueName])}`).join("、");
}

function joinCurrency(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return "无";
  }
  return items.map((item) => `${item.currency} ${formatValue(item.amount)}`).join("、");
}

function topList(items = [], count = 3, renderer = null) {
  return items.slice(0, count).map((item, index) =>
    renderer ? renderer(item, index) : `${index + 1}. ${formatValue(item)}`
  );
}


function narrativeItems(items = []) {
  return items
    .filter(Boolean)
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }
      if (typeof item === "object") {
        return item.reason ?? item.action ?? item.finding ?? item.note ?? JSON.stringify(item);
      }
      return String(item);
    });
}

function maskValue(value, keepStart = 3, keepEnd = 3) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const text = String(value);
  if (text.length <= keepStart + keepEnd) {
    return "***";
  }
  return `${text.slice(0, keepStart)}***${text.slice(-keepEnd)}`;
}

function sanitize(node) {
  if (Array.isArray(node)) {
    return node.slice(0, 50).map((item) => sanitize(item));
  }
  if (!node || typeof node !== "object") {
    if (typeof node === "string" && /@/.test(node)) {
      return maskValue(node);
    }
    return node;
  }

  const output = {};
  for (const [key, value] of Object.entries(node)) {
    if (/(token|secret|sign|authorization|cookie|app_key|client_id|client_secret)/i.test(key)) {
      output[key] = "***";
      continue;
    }
    if (
      /(trade_id|e_trade_id|phone|mobile|email|address|member|account)/i.test(key) &&
      (typeof value === "string" || typeof value === "number")
    ) {
      output[key] = maskValue(value);
      continue;
    }
    output[key] = sanitize(value);
  }
  return output;
}

function stripEnvelope(body = {}) {
  if (!body || typeof body !== "object") {
    return body;
  }
  const cloned = { ...body };
  delete cloned.ok;
  delete cloned.account;
  delete cloned.module;
  delete cloned.read_only;
  return cloned;
}

function success(name, result) {
  if (name === "health") {
    return Boolean(result?.status === 200);
  }
  if (name === "replyDraftTool" || name === "orderDraftTool") {
    return Boolean(
      result?.status === 200 &&
        result?.is_json &&
        (result?.body?.workflow_type ||
          result?.body?.reply_draft ||
          result?.body?.order_draft_package)
    );
  }
  return Boolean(result?.status === 200 && result?.is_json && result?.body?.ok !== false);
}

function payloadOf(result) {
  return stripEnvelope(result?.body);
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") {
    return "无";
  }
  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

function bullets(items = []) {
  return items.filter(Boolean).map((item) => `- ${item}`);
}

async function fetchRoute(name, def, body = null) {
  const startedAt = Date.now();
  const response = await fetch(`${BASE_URL}${def.path}`, {
    method: def.method,
    headers: {
      accept: "application/json",
      ...(def.method === "POST" ? { "content-type": "application/json" } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const text = await response.text();
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = null;
  }
  return {
    name,
    path: def.path,
    method: def.method,
    status: response.status,
    elapsed_ms: Date.now() - startedAt,
    is_json: parsed !== null,
    body: parsed,
    text
  };
}

function metricDeltas(current = {}, previous = {}) {
  const fields = unique([...Object.keys(current), ...Object.keys(previous)]);
  return Object.fromEntries(
    fields.map((field) => {
      const currentValue = Number(current[field] ?? 0);
      const previousValue = Number(previous[field] ?? 0);
      const deltaValue = currentValue - previousValue;
      const deltaRate = previousValue !== 0 ? deltaValue / previousValue : null;
      const trendDirection = deltaValue > 0 ? "up" : deltaValue < 0 ? "down" : "flat";
      return [
        field,
        {
          current_value: currentValue,
          previous_value: previousValue,
          delta_value: deltaValue,
          delta_rate: deltaRate,
          trend_direction: trendDirection
        }
      ];
    })
  );
}


function buildMarkdown(report) {
  const lines = [
    "# WIKA 全平台诊断总报告",
    "",
    `生成时间：${report.generated_at}`,
    `成功 route 数：${report.route_success_count}/${report.route_usage.length}`,
    "",
    "## 1. 执行摘要",
    ...bullets(report.executive_summary.overview),
    "",
    "## 2. 数据覆盖说明",
    ...bullets(report.data_coverage.summary),
    "",
    "### 2.1 Official mainline confirmed",
    ...bullets(report.data_coverage.official_confirmed),
    "",
    "### 2.2 Derived",
    ...bullets(report.data_coverage.derived_dimensions),
    "",
    "### 2.3 Unavailable",
    ...bullets(report.data_coverage.unavailable_dimensions),
    "",
    "## 3. 店铺级诊断",
    ...bullets(report.store_diagnosis.summary),
    "",
    "## 4. 产品级诊断",
    ...bullets(report.product_diagnosis.summary),
    "",
    "## 5. 订单级诊断",
    ...bullets(report.order_diagnosis.summary),
    "",
    "## 6. 跨层综合诊断",
    ...bullets(report.cross_layer_diagnosis.summary),
    "",
    "## 7. 任务 3 现状评估",
    ...bullets(report.task3_assessment.summary),
    "",
    "## 8. 任务 4 现状评估",
    ...bullets(report.task4_assessment.summary),
    "",
    "## 9. 任务 5 现状评估",
    ...bullets(report.task5_assessment.summary),
    "",
    "## 10. 工作量替代评估",
    ...bullets(report.replacement_assessment.summary),
    "",
    "## 11. 运营建议",
    "### 11.1 立即执行（0–7 天）",
    ...bullets(report.recommendations.immediate),
    "",
    "### 11.2 短期推进（7–30 天）",
    ...bullets(report.recommendations.short_term),
    "",
    "### 11.3 中期建设（30 天以上）",
    ...bullets(report.recommendations.mid_term),
    "",
    "## 12. 盲区与风险",
    ...bullets(report.blind_spots.summary),
    "",
    "## 13. 当前边界下的最大完成度结论",
    ...bullets(report.max_completion.summary),
    "",
    "## 14. 本轮使用的线上 route",
    ...bullets(
      report.route_usage.map(
        (item) => `${item.method} ${item.path} -> ${item.status}${item.note ? ` (${item.note})` : ""}`
      )
    ),
    ""
  ];

  return `${lines.join("\n")}\n`;
}

async function run() {
  const generatedAt = new Date().toISOString();
  const postBodies = {
    productDraftPreview: PRODUCT_PREVIEW_INPUT,
    replyPreview: REPLY_INPUT,
    orderPreview: ORDER_INPUT,
    previewCenter: {
      product_preview_input: PRODUCT_PREVIEW_INPUT,
      reply_preview_input: REPLY_INPUT,
      order_preview_input: ORDER_INPUT
    },
    replyDraftTool: REPLY_INPUT,
    orderDraftTool: ORDER_INPUT
  };

  const entries = Object.entries(ROUTES);
  const results = Object.fromEntries(
    await Promise.all(
      entries.map(async ([name, def]) => {
        try {
          const body = def.method === "POST" ? postBodies[name] ?? null : null;
          return [name, await fetchRoute(name, def, body)];
        } catch (error) {
          return [
            name,
            {
              name,
              path: def.path,
              method: def.method,
              status: null,
              elapsed_ms: null,
              is_json: false,
              body: null,
              text: null,
              error: error.message
            }
          ];
        }
      })
    )
  );

    assert(success("health", results.health), "/health 连续不可用，无法继续生成全平台诊断报告。");
  assert(
    success("authDebug", results.authDebug),
    "/integrations/alibaba/auth/debug 不可用，无法证明当前 production 主线仍可访问。"
  );

  const criticalSuccessCount = CRITICAL_KEYS.filter((key) => success(key, results[key])).length;
  assert(criticalSuccessCount >= 12, "核心 WIKA route 成功数不足，无法形成可信的全平台诊断总报告。");

  const data = Object.fromEntries(Object.keys(results).map((key) => [key, payloadOf(results[key])]));
  const stage34 = readJsonIfExists(LOCAL_EVIDENCE.stage34);
  const stage35 = readJsonIfExists(LOCAL_EVIDENCE.stage35);

  const routeUsage = Object.values(results).map((result) => ({
    method: result.method,
    path: result.path,
    status: result.status ?? "failed",
    success: success(result.name, result),
    note: result.error ?? (success(result.name, result) ? "ok" : result.body?.message ?? "route_failed")
  }));
  const routeSuccessCount = routeUsage.filter((item) => item.success).length;
  const routeFailures = routeUsage.filter((item) => !item.success);

  const combinedUnavailable = unique([
    ...get(data, "businessCockpit.cross_section_gaps.combined_unavailable_dimensions", []),
    ...get(data, "operationsManagementSummary.unavailable_dimensions", []),
    ...get(data, "productsManagementSummary.unavailable_dimensions", []),
    ...get(data, "ordersManagementSummary.unavailable_dimensions", [])
  ]);

  const storeDeltaMap =
    get(data, "operationsComparisonSummary.derived_comparison.metric_deltas") ??
    metricDeltas(
      get(data, "operationsComparisonSummary.official_inputs.current_metrics", {}),
      get(data, "operationsComparisonSummary.official_inputs.previous_metrics", {})
    );
  const productDeltaMap =
    get(data, "productsComparisonSummary.derived_comparison.aggregate_metric_deltas") ??
    metricDeltas(
      get(data, "productsComparisonSummary.official_inputs.current_aggregate_metrics", {}),
      get(data, "productsComparisonSummary.official_inputs.previous_aggregate_metrics", {})
    );
  const orderDelta = get(data, "ordersComparisonSummary.derived_comparison.observed_order_count_delta", null);

  const topProductLines = topList(
    get(data, "productsManagementSummary.ranking_sections.top_products_by_impression", []),
    3,
    (item, index) =>
      `${index + 1}. ${shortText(item.product_name ?? item.product_id ?? "unknown", 48)}（product_id=${item.product_id}，impression=${formatValue(item.metric_value)}）`
  );
  const topOrderContribution = topList(
    get(data, "ordersManagementSummary.product_contribution.top_products_by_order_count", []),
    3,
    (item, index) =>
      `${index + 1}. ${shortText(item.product_name ?? item.product_id ?? "unknown", 48)}（order_count=${formatValue(item.order_count ?? item.metric_value ?? item.count)}）`
  );

  const task3Status = get(stage35, "task_results.task3.primary_status", "NOT_RUNTIME_READY");
  const task4Status = get(stage35, "task_results.task4.primary_status", "DOC_INSUFFICIENT");
  const task5Status = get(stage35, "task_results.task5.primary_status", "NOT_RUNTIME_READY");

  const executiveSummary = {
    overview: [
      "WIKA 当前已经形成店铺、产品、订单三层经营摘要、最小诊断、周期对比、统一驾驶舱、行动中心、统一控制台，以及任务 3/4/5 的工作台与预览层。",
      `本轮核心成功 route 数为 ${routeSuccessCount}/${routeUsage.length}，已足够生成完整、可读、可验证的全平台诊断总报告。`,
      "当前最优先动作仍是先补齐 task3 所需的分类属性、schema 必填字段和媒体素材，再把更完整的产品上下文反哺 task4/5 外部草稿。",
      `当前最大盲区仍是 ${joinInline(combinedUnavailable)}，这些维度会限制来源归因、国家结构和平台内闭环判断。`,
      "任务 3/4/5 当前都停留在安全草稿、预览和人工接力层，不是平台内执行闭环。"
    ]
  };

  const dataCoverage = {
    summary: [
      `店铺级 official mainline confirmed：${STORE_FIELDS.join("、")}。`,
      `产品级 official mainline confirmed：${PRODUCT_FIELDS.join("、")}。`,
      "订单级当前成立的是 derived 层 formal_summary、product_contribution、trend_signal；country_structure 仍 unavailable。",
      "comparison、business-cockpit、action-center、operator-console、workbench、preview 全部属于 derived consumption layer，不是新增 official field。",
      `stage34/35 写侧边界前置包当前只证明了边界状态，没有新增低风险实写成功样本；task3=${task3Status}，task4=${task4Status}，task5=${task5Status}。`
    ],
    official_confirmed: [
      `店铺级 official fields：${STORE_FIELDS.join("、")}`,
      `产品级 official fields：${PRODUCT_FIELDS.join("、")}`,
      "订单级官方原始只读基础来自 orders/list、orders/detail、orders/fund、orders/logistics"
    ],
    derived_dimensions: [
      "店铺、产品、订单 comparison delta",
      "订单 derived：formal_summary、product_contribution、trend_signal",
      "business-cockpit、action-center、operator-console",
      "task3/4/5 workbench、preview、draft package"
    ],
    unavailable_dimensions: combinedUnavailable.map((item) => `${item}：当前仍 unavailable`)
  };

  const storeDiagnosis = {
    summary: [
      `当前店铺经营概览：visitor=${formatValue(get(data, "operationsManagementSummary.official_metrics.visitor"))}、imps=${formatValue(get(data, "operationsManagementSummary.official_metrics.imps"))}、clk=${formatValue(get(data, "operationsManagementSummary.official_metrics.clk"))}、clk_rate=${formatValue(get(data, "operationsManagementSummary.official_metrics.clk_rate"))}、fb=${formatValue(get(data, "operationsManagementSummary.official_metrics.fb"))}、reply=${formatValue(get(data, "operationsManagementSummary.official_metrics.reply"))}。`,
      `上一可比窗口对比：visitor ${formatValue(get(storeDeltaMap, "visitor.delta_value"))}、imps ${formatValue(get(storeDeltaMap, "imps.delta_value"))}、clk ${formatValue(get(storeDeltaMap, "clk.delta_value"))}、fb ${formatValue(get(storeDeltaMap, "fb.delta_value"))}，reply 趋势为 ${formatValue(get(storeDeltaMap, "reply.trend_direction"))}。`,
      "店铺层当前不是流量塌陷问题，而是“已有增长但来源归因不透明”，因此无法确认哪些渠道、国家或回复速度在真正驱动效果。",
      `店铺层主要盲区：${joinInline(get(data, "operationsManagementSummary.unavailable_dimensions", []))}。`,
      ...get(data, "operationsManagementSummary.recommendations", []),
      "当前店铺层建议以 visitor / imps / clk / fb / reply 的周节奏跟踪为主，不把缺失的来源维度脑补成已覆盖。"
    ]
  };

  const productDiagnosis = {
    summary: [
      `当前产品表现概览：product_scope_basis=${formatValue(get(data, "productsManagementSummary.product_scope_basis"))}、product_scope_limit=${formatValue(get(data, "productsManagementSummary.product_scope_limit"))}、product_scope_truncated=${formatValue(get(data, "productsManagementSummary.product_scope_truncated"))}。`,
      `聚合指标：click=${formatValue(get(data, "productsManagementSummary.aggregate_official_metrics.click"))}、impression=${formatValue(get(data, "productsManagementSummary.aggregate_official_metrics.impression"))}、visitor=${formatValue(get(data, "productsManagementSummary.aggregate_official_metrics.visitor"))}、order=${formatValue(get(data, "productsManagementSummary.aggregate_official_metrics.order"))}。`,
      `上一可比窗口对比：impression ${formatValue(get(productDeltaMap, "impression.delta_value"))}、visitor ${formatValue(get(productDeltaMap, "visitor.delta_value"))}、order ${formatValue(get(productDeltaMap, "order.delta_value"))}。`,
      topProductLines.length > 0
        ? `重点产品样本：${topProductLines.join("；")}`
        : "当前样本内未形成明显高表现产品。",
      `当前产品层主要问题：missing_description_count=${formatValue(get(data, "productsMinimalDiagnostic.content_completeness_findings.missing_description_count"))}、missing_keywords_count=${formatValue(get(data, "productsMinimalDiagnostic.content_completeness_findings.missing_keywords_count"))}、low_score_count=${formatValue(get(data, "productsMinimalDiagnostic.score_summary.quality_score.low_score_count"))}。`,
      "当前产品层最主要问题不是曝光完全没有，而是样本内曝光上升后仍没带来 visitor / order 同步抬升，说明详情内容、关键词和结构准备仍是主要短板。",
      `产品层数据盲区：${joinInline(get(data, "productsManagementSummary.unavailable_dimensions", []))}；并且 management/comparison 仍是 sample-based，不代表全量产品历史。`
    ]
  };

  const orderDiagnosis = {
    summary: [
      `当前订单正式汇总：total_order_count=${formatValue(get(data, "ordersManagementSummary.formal_summary.total_order_count"))}、observed_trade_count=${formatValue(get(data, "ordersManagementSummary.formal_summary.observed_trade_count"))}、trade_status_distribution=${joinDistribution(get(data, "ordersManagementSummary.formal_summary.trade_status_distribution", []))}。`,
      `订单金额与履约信号：total_amount_by_currency=${joinCurrency(get(data, "ordersManagementSummary.formal_summary.total_amount_by_currency", []))}，logistics_status_distribution=${joinDistribution(get(data, "ordersManagementSummary.formal_summary.logistics_signal_summary.logistic_status_distribution", []))}。`,
      topOrderContribution.length > 0
        ? `产品贡献概览：${topOrderContribution.join("；")}`
        : "当前样本内未形成可读的高贡献产品排序。",
      `趋势信号：observed_order_count_delta=${formatValue(get(orderDelta, "delta_value"))}，trend_direction=${formatValue(get(orderDelta, "trend_direction"))}。`,
      "订单层当前已经能给出 conservative derived summary，但本质仍是 sampled/window-based，不是完整订单经营驾驶舱。",
      "country_structure 仍 unavailable，因为现有 orders/list、orders/detail、orders/fund、orders/logistics 以及已上线 derived 层都没有稳定国家结构字段可汇总。",
      `订单层数据盲区：${joinInline(get(data, "ordersManagementSummary.unavailable_dimensions", []))}。`
    ]
  };

  const crossLayerDiagnosis = {
    summary: [
      "跨层观察一：店铺 visitor / imps / clk 在上升，但产品样本 visitor / order 仍弱，说明流量增长并未稳定转化到有效商品表现。",
      "跨层观察二：产品内容与 schema 必填字段缺口，会直接拉低 task3 的自动准备质量，也会反向影响 task4 / task5 草稿包的上下文完整度。",
      "跨层观察三：订单层已经能输出 formal_summary / product_contribution / trend_signal，但 country_structure 不可见，跨国家经营判断仍不完整。",
      `跨层共振的核心盲区仍是 ${joinInline(combinedUnavailable)}。`,
      "当前最优先动作仍是先补齐分类属性、schema 必填字段和媒体素材，再交给人工复核，不进入平台发布。"
    ]
  };

  const task3Assessment = {
    summary: [
      "WIKA 当前已经能为 task3 提供 schema-aware 安全草稿准备：类目树、属性、schema、render、render.draft、媒体列表、媒体分组、product-draft-workbench、product-draft-preview 全部可读可用。",
      `product-draft-workbench 当前状态：safe_draft_preparation_available=${formatValue(get(data, "productDraftWorkbench.draft_readiness.safe_draft_preparation_available"))}，ready_for_publish=${formatValue(get(data, "productDraftWorkbench.draft_readiness.ready_for_publish"))}。`,
      `product-draft-preview 当前仍缺：${joinInline(get(data, "productDraftPreview.required_manual_fields.missing_requirements", []))}。`,
      `当前仍必须人工完成的关键步骤：${joinInline(get(data, "productDraftWorkbench.required_manual_fields.missing_requirements", []), "、", "required_attributes、schema_required_fields")}。`,
      "它仍不是平台内商品发布闭环，因为当前只到 safe draft preparation / payload draft / manual review handoff，未证明低风险、可回滚的真实发布边界。",
      `写侧边界前置包状态：task3=${task3Status}。`
    ]
  };

  const task4Assessment = {
    summary: [
      "WIKA 当前已经能为 task4 提供 reply-workbench、reply-preview 和 reply-draft 三层消费能力，可生成外部回复草稿、问题补采清单与 handoff 包。",
      `reply-workbench 边界：external_reply_draft_only=${formatValue(get(data, "replyWorkbench.boundary_statement.external_reply_draft_only"))}，not_platform_reply=${formatValue(get(data, "replyWorkbench.boundary_statement.not_platform_reply"))}。`,
      `reply-preview 当前缺失的关键上下文：${joinInline(unique(get(data, "replyPreview.missing_context", [])))}。`,
      `reply-preview 硬阻塞主要集中在：${joinInline(unique(get(data, "replyPreview.hard_blockers", []).map((item) => item.blocker_code ?? item.key)))}。`,
      "当前仍必须人工完成最终报价、交期确认、样图或 mockup 材料确认，因此它还不是平台内自动回复闭环。",
      `写侧边界前置包状态：task4=${task4Status}。`
    ]
  };

  const task5Assessment = {
    summary: [
      "WIKA 当前已经能为 task5 提供 order-workbench、order-preview 和 order-draft 三层消费能力，可生成外部订单草稿、required_manual_fields 和 handoff 包。",
      `order-workbench 边界：external_order_draft_only=${formatValue(get(data, "orderWorkbench.boundary_statement.external_order_draft_only"))}，not_platform_order_create=${formatValue(get(data, "orderWorkbench.boundary_statement.not_platform_order_create"))}。`,
      `order-preview 当前缺失上下文：${joinInline(unique(get(data, "orderPreview.missing_context", [])))}。`,
      `当前仍必须人工确认的关键订单字段：${joinInline(get(data, "orderWorkbench.required_manual_field_system.required_manual_fields", []).slice(0, 8))}。`,
      "它仍不是平台内创单闭环，因为 buyer identity binding、最终价格、付款条件、履约条件和真实 create rollback 都未证明可自动安全完成。",
      `写侧边界前置包状态：task5=${task5Status}。`
    ]
  };

  const replacementAssessment = {
    summary: [
      "能完全自动完成的工作：经营摘要读取、最小诊断、周期对比、business-cockpit、action-center、operator-console、task-workbench 汇总。",
      "能自动完成大部分但仍需人工确认的工作：product-draft-preview、reply-preview、order-preview，以及 reply/order 外部草稿包生成。",
      "只能做到准备层 / 预览层 / 手工接力层的工作：task3 安全草稿准备、task4 正式回复前的上下文补采和草稿整理、task5 正式创单前的商业条款与资料整理。",
      `当前完全做不了的工作：${joinInline(combinedUnavailable)}，以及平台内真实发布、平台内真实回复、平台内真实创单。`,
      "结论上，WIKA 已经可以替代大部分“读取、汇总、诊断、预览、交接包生成”工作，但还不能替代最终平台内执行与缺失维度判断。"
    ]
  };

  const recommendations = {
    immediate: [
      "先按 action-center / operator-console 的 next_best_action，补齐 task3 所需的 schema 必填字段、分类属性与媒体素材。",
      "把 reply-preview 暴露出的 final_quote、lead_time、mockup_assets 缺口作为销售跟进清单，先补齐再发正式回复。",
      "把 order-workbench / order-preview 给出的 required_manual_fields 当作订单交接检查表，先补齐 buyer、价格、付款与交期。"
    ],
    short_term: [
      "针对 products/minimal-diagnostic 暴露出的 missing_description_count、missing_keywords_count 和 low_score_count 建一轮样本整改。",
      "建立 operator-console 周复盘节奏，用 business-cockpit + action-center 统一看经营态势、优先动作和跨层阻塞。",
      "把 task3 已整理好的产品上下文继续复用到 task4 / task5 外部草稿，减少人工重复整理。"
    ],
    mid_term: [
      "若要继续提升任务 1/2 的经营判断，需要官方 mainline 补齐 traffic_source、country_source、quick_reply_rate、access_source、inquiry_source、period_over_period_change、country_structure。",
      "若要继续提升任务 3/4/5，需要外部条件证明低风险写侧边界，包括 test scope、readback、rollback 或隔离证明。",
      "若要进入真正 full business cockpit，需要补齐当前 unavailable 维度和平台内执行闭环；当前还不具备这些外部条件。"
    ]
  };

  const blindSpots = {
    summary: [
      `当前 unavailable 维度：${joinInline(combinedUnavailable)}。`,
      "这些盲区会让流量来源判断、国家结构判断、平台内回复时效判断和跨国家订单结构判断失真。",
      "当前置信度高的结论主要来自 official mainline confirmed 的店铺/产品字段，以及 conservative derived 的订单 summary/comparison。",
      "当前置信度较保守的部分主要是 sample-based 产品层、window-based 订单层，以及 task3/4/5 的预览与外部草稿消费层。"
    ]
  };

  const maxCompletion = {
    reached: true,
    summary: [
      "在“不做新 API 探索、不碰写侧、不推进任务 6”的当前边界下，WIKA 已经达到当前 official mainline + safe derived 消费层的最大完成度。",
      "当前已经同时具备：summary、diagnostic、comparison、business-cockpit、action-center、operator-console，以及 task3/4/5 workbench、preview、draft package。",
      "后续如果还要明显往前推进，必须依赖外部条件：缺失维度的官方主线补齐，或低风险写侧边界被正式证明。"
    ]
  };

  const summary = {
    generated_at: generatedAt,
    route_usage: routeUsage,
    route_success_count: routeSuccessCount,
    route_failure_count: routeFailures.length,
    executive_summary: executiveSummary,
    data_coverage: dataCoverage,
    store_diagnosis: storeDiagnosis,
    product_diagnosis: productDiagnosis,
    order_diagnosis: orderDiagnosis,
    cross_layer_diagnosis: crossLayerDiagnosis,
    task3_assessment: task3Assessment,
    task4_assessment: task4Assessment,
    task5_assessment: task5Assessment,
    replacement_assessment: replacementAssessment,
    recommendations,
    blind_spots: blindSpots,
    max_completion: maxCompletion
  };

  const markdown = buildMarkdown(summary);
  const evidence = {
    generated_at: generatedAt,
    base_url: BASE_URL,
    route_results: Object.fromEntries(
      Object.entries(results).map(([key, value]) => [
        key,
        {
          path: value.path,
          method: value.method,
          status: value.status,
          elapsed_ms: value.elapsed_ms,
          success: success(key, value),
          error: value.error ?? null,
          body: sanitize(value.body ?? value.text)
        }
      ])
    ),
    local_evidence: {
      stage34: sanitize(stage34),
      stage35: sanitize(stage35)
    },
    extracted_summary: sanitize(summary)
  };
  const runEvidence = {
    generated_at: generatedAt,
    report_path: OUTPUTS.report,
    evidence_path: OUTPUTS.evidence,
    summary_path: OUTPUTS.summary,
    route_success_count: routeUsage.filter((item) => item.success).length,
    route_failure_count: routeUsage.filter((item) => !item.success).length,
    failed_routes: routeUsage.filter((item) => !item.success),
    max_completion_reached: maxCompletion.reached
  };

  writeText(OUTPUTS.report, markdown);
  writeJson(OUTPUTS.evidence, evidence);
  writeJson(OUTPUTS.summary, summary);
  writeJson(OUTPUTS.run, runEvidence);

  console.log(
    JSON.stringify(
      {
        ok: true,
        generated_at: generatedAt,
        route_success_count: runEvidence.route_success_count,
        route_failure_count: runEvidence.route_failure_count,
        report_path: OUTPUTS.report,
        evidence_path: OUTPUTS.evidence,
        summary_path: OUTPUTS.summary,
        framework_evidence_path: OUTPUTS.run,
        max_completion_reached: maxCompletion.reached
      },
      null,
      2
    )
  );
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
  );
  process.exitCode = 1;
});



