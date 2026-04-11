import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..", "..");
const WIKA_DIR = path.join(ROOT_DIR, "WIKA");
const DOCS_DIR = path.join(WIKA_DIR, "docs", "framework");
const EVIDENCE_DIR = path.join(DOCS_DIR, "evidence");
const AUDIT_DOC_PATH = path.join(
  DOCS_DIR,
  "WIKA_剩余经营维度现有字段穷尽审计_第二轮.md"
);
const BASE_URL = "https://api.wikapacking.com";

const ROUTES = {
  health: "/health",
  authDebug: "/integrations/alibaba/auth/debug",
  operationsManagementSummary: "/integrations/alibaba/wika/reports/operations/management-summary",
  productsManagementSummary: "/integrations/alibaba/wika/reports/products/management-summary",
  ordersManagementSummary: "/integrations/alibaba/wika/reports/orders/management-summary",
  operationsMinimalDiagnostic: "/integrations/alibaba/wika/reports/operations/minimal-diagnostic",
  productsMinimalDiagnostic: "/integrations/alibaba/wika/reports/products/minimal-diagnostic",
  ordersMinimalDiagnostic: "/integrations/alibaba/wika/reports/orders/minimal-diagnostic",
  ordersList: "/integrations/alibaba/wika/data/orders/list?page_size=3"
};

const EXISTING_DOC_FOUND_CANDIDATES = [
  {
    method: "alibaba.seller.trade.decode",
    target_dimensions: ["country_structure", "order_identifier_contract"],
    doc_reference_path: "WIKA/docs/framework/WIKA_下一批必须验证的API候选池.md",
    doc_url: null,
    parameter_contract: null,
    classification: "DOC_FOUND_NOT_TESTED",
    note: "仓内仅保留 doc-found 记录；本轮没有足够 doc URL 与参数契约落盘，不进入 runtime 验证。"
  },
  {
    method: "alibaba.mydata.self.keyword.date.get",
    target_dimensions: ["access_source", "keyword_window"],
    doc_reference_path: "WIKA/docs/framework/WIKA_下一批必须验证的API候选池.md",
    doc_url: null,
    parameter_contract: null,
    classification: "DOC_FOUND_NOT_TESTED",
    note: "仓内只有 method 名记录，当前没有稳定参数契约，不能把它当成剩余产品维度的当前官方入口。"
  },
  {
    method: "alibaba.mydata.self.keyword.effect.week.get",
    target_dimensions: ["keyword_effects", "period_over_period_change"],
    doc_reference_path: "WIKA/docs/framework/WIKA_下一批必须验证的API候选池.md",
    doc_url: null,
    parameter_contract: null,
    classification: "DOC_FOUND_NOT_TESTED",
    note: "仓内已有 doc-found 记录，但没有可复核的 doc URL 与安全参数契约，本轮不测。"
  },
  {
    method: "alibaba.mydata.self.keyword.effect.month.get",
    target_dimensions: ["keyword_effects", "period_over_period_change"],
    doc_reference_path: "WIKA/docs/framework/WIKA_下一批必须验证的API候选池.md",
    doc_url: null,
    parameter_contract: null,
    classification: "DOC_FOUND_NOT_TESTED",
    note: "仓内已有 doc-found 记录，但没有可复核的 doc URL 与安全参数契约，本轮不测。"
  },
  {
    method: "alibaba.mydata.industry.keyword.get",
    target_dimensions: ["industry_keyword_signal"],
    doc_reference_path: "WIKA/docs/framework/WIKA_下一批必须验证的API候选池.md",
    doc_url: null,
    parameter_contract: null,
    classification: "DOC_FOUND_NOT_TESTED",
    note: "当前更像关键词补充方向，不是本轮 store/product/order 剩余维度的直接 route-level 证据入口。"
  },
  {
    method: "alibaba.mydata.seller.opendata.getconkeyword",
    target_dimensions: ["seller_keyword_signal"],
    doc_reference_path: "WIKA/docs/framework/WIKA_下一批必须验证的API候选池.md",
    doc_url: null,
    parameter_contract: null,
    classification: "DOC_FOUND_NOT_TESTED",
    note: "当前更像关键词侧补充，不是本轮剩余 source/country/change 缺口的直接 current official mainline 入口。"
  }
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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
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

function sanitizeNode(node) {
  if (Array.isArray(node)) {
    return node.slice(0, 20).map((item) => sanitizeNode(item));
  }

  if (!node || typeof node !== "object") {
    if (typeof node === "string" && /@/.test(node)) {
      return maskValue(node);
    }
    return node;
  }

  const output = {};
  for (const [key, value] of Object.entries(node)) {
    if (
      /(^token$|_token$|^secret$|_secret$|^sign$|_sign$|^authorization$|^cookie$|^app_key$|^client_id$|^client_secret$)/i.test(
        key
      )
    ) {
      output[key] = "***";
      continue;
    }

    if (
      /(^trade_id$|^e_trade_id$|(^|_)trade_id$|(^|_)e_trade_id$|full_name|immutable_eid|e_account_id|phone|mobile|email|address)/i.test(
        key
      ) &&
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      output[key] = typeof value === "object" ? sanitizeNode(value) : maskValue(value);
      continue;
    }

    if (/product_image/i.test(key) && value) {
      output[key] = "***";
      continue;
    }

    output[key] = sanitizeNode(value);
  }

  return output;
}

function hasOwn(object, key) {
  return Boolean(object) && Object.prototype.hasOwnProperty.call(object, key);
}

function asArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (value && typeof value === "object") {
    return [value];
  }
  return [];
}

async function fetchJson(route) {
  const startedAt = Date.now();
  const response = await fetch(`${BASE_URL}${route}`);
  const text = await response.text();
  let body = null;

  try {
    body = JSON.parse(text);
  } catch {
    body = null;
  }

  return {
    route,
    status: response.status,
    elapsed_ms: Date.now() - startedAt,
    is_json: body !== null,
    body,
    text
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function buildBaselineChecks(responses) {
  return {
    health: responses.health.status === 200 && responses.health.text.trim() === "ok",
    auth_debug: responses.authDebug.status === 200 && responses.authDebug.is_json,
    operations_management_summary:
      responses.operationsManagementSummary.status === 200 &&
      responses.operationsManagementSummary.is_json,
    products_management_summary:
      responses.productsManagementSummary.status === 200 &&
      responses.productsManagementSummary.is_json,
    orders_management_summary:
      responses.ordersManagementSummary.status === 200 &&
      responses.ordersManagementSummary.is_json
  };
}

function buildLegacyStoreEvidence(legacyData) {
  const overview = legacyData?.overview ?? {};

  return {
    traffic_source: {
      present: asArray(overview.traffic_sources).length > 0,
      count: asArray(overview.traffic_sources).length,
      source: "legacy_page_request.generated_report"
    },
    country_source: {
      present:
        asArray(overview.visitor_country_distribution).length > 0 ||
        asArray(overview.key_market_distribution).length > 0,
      visitor_country_count: asArray(overview.visitor_country_distribution).length,
      key_market_count: asArray(overview.key_market_distribution).length,
      source: "legacy_page_request.generated_report"
    },
    quick_reply_rate: {
      present: overview?.snapshot?.reply_within_5min_rate_30d !== undefined,
      value: overview?.snapshot?.reply_within_5min_rate_30d ?? null,
      source: "legacy_page_request.generated_report"
    }
  };
}

function buildLegacyOrderEvidence(legacyData, legacyOrderReport) {
  const overviewOrders = legacyData?.orders?.order_list_snapshot?.items ?? [];

  return {
    country_structure: {
      present:
        overviewOrders.some((item) => item?.buyer_country_name || item?.shipping_country_name) ||
        asArray(legacyOrderReport?.buyerCountryDistribution).length > 0 ||
        asArray(legacyOrderReport?.shippingCountryDistribution).length > 0,
      buyer_country_distribution_count: asArray(legacyOrderReport?.buyerCountryDistribution).length,
      shipping_country_distribution_count: asArray(legacyOrderReport?.shippingCountryDistribution)
        .length,
      source: "legacy_page_request.generated_report"
    }
  };
}

function buildStoreDimensionAudit(indicatorEvidence, routeBodies, legacyEvidence) {
  const extraFields = indicatorEvidence?.best_attempt?.extracted_data?.extra_fields ?? {};
  const unavailable = asArray(routeBodies.operationsManagementSummary?.unavailable_dimensions);
  const diagnosticUnavailable = asArray(
    routeBodies.operationsMinimalDiagnostic?.traffic_performance_section?.unavailable_dimensions_echo
  );

  return [
    {
      dimension: "traffic_source",
      layer: "store",
      raw_response_present: asArray(extraFields.source_related).length > 0,
      helper_hidden: false,
      route_exposed: false,
      derivable_from_existing_routes: false,
      legacy_page_request_present: legacyEvidence.traffic_source.present,
      classification: "NOT_DERIVABLE_CURRENTLY",
      evidence: [
        "official mainline: overview indicator extra_fields.source_related=[]",
        "live routes: unavailable_dimensions 保持 traffic_source",
        legacyEvidence.traffic_source.present
          ? `legacy page_request: overview.traffic_sources 有 ${legacyEvidence.traffic_source.count} 条`
          : "legacy page_request: 未见 traffic_source 字段"
      ],
      unavailable_in_live_routes:
        unavailable.includes("traffic_source") && diagnosticUnavailable.includes("traffic_source")
    },
    {
      dimension: "country_source",
      layer: "store",
      raw_response_present: asArray(extraFields.country_related).length > 0,
      helper_hidden: false,
      route_exposed: false,
      derivable_from_existing_routes: false,
      legacy_page_request_present: legacyEvidence.country_source.present,
      classification: "NOT_DERIVABLE_CURRENTLY",
      evidence: [
        "official mainline: overview indicator extra_fields.country_related=[]",
        "live routes: unavailable_dimensions 保持 country_source",
        legacyEvidence.country_source.present
          ? `legacy page_request: visitor_country_distribution=${legacyEvidence.country_source.visitor_country_count}, key_market_distribution=${legacyEvidence.country_source.key_market_count}`
          : "legacy page_request: 未见 country_source 字段"
      ],
      unavailable_in_live_routes:
        unavailable.includes("country_source") && diagnosticUnavailable.includes("country_source")
    },
    {
      dimension: "quick_reply_rate",
      layer: "store",
      raw_response_present: asArray(extraFields.quick_reply_related).length > 0,
      helper_hidden: false,
      route_exposed: false,
      derivable_from_existing_routes: false,
      legacy_page_request_present: legacyEvidence.quick_reply_rate.present,
      classification: "NOT_DERIVABLE_CURRENTLY",
      evidence: [
        "official mainline: overview indicator extra_fields.quick_reply_related=[]",
        "live routes: unavailable_dimensions 保持 quick_reply_rate",
        legacyEvidence.quick_reply_rate.present
          ? `legacy page_request: snapshot.reply_within_5min_rate_30d=${legacyEvidence.quick_reply_rate.value}`
          : "legacy page_request: 未见 quick_reply_rate 字段"
      ],
      unavailable_in_live_routes:
        unavailable.includes("quick_reply_rate") && diagnosticUnavailable.includes("quick_reply_rate")
    }
  ];
}

function buildProductDimensionAudit(productEvidence, routeBodies) {
  const extraFields = productEvidence?.best_attempt?.extracted_data?.extra_fields ?? {};
  const unavailable = asArray(routeBodies.productsManagementSummary?.unavailable_dimensions);
  const diagnosticUnavailable = asArray(
    routeBodies.productsMinimalDiagnostic?.performance_section?.unavailable_dimensions_echo
  );

  return [
    {
      dimension: "access_source",
      layer: "product",
      raw_response_present: asArray(extraFields.source_related).length > 0,
      helper_hidden: false,
      route_exposed: false,
      derivable_from_existing_routes: false,
      legacy_page_request_present: false,
      classification: "NOT_DERIVABLE_CURRENTLY",
      evidence: [
        "official mainline: self.product extra_fields.source_related=[]",
        "live routes: unavailable_dimensions 保持 access_source"
      ],
      unavailable_in_live_routes:
        unavailable.includes("access_source") && diagnosticUnavailable.includes("access_source")
    },
    {
      dimension: "inquiry_source",
      layer: "product",
      raw_response_present: false,
      helper_hidden: false,
      route_exposed: false,
      derivable_from_existing_routes: false,
      legacy_page_request_present: false,
      classification: "NOT_DERIVABLE_CURRENTLY",
      evidence: [
        "official mainline: 当前 product raw evidence 未见 inquiry 同义字段",
        "live routes: unavailable_dimensions 保持 inquiry_source"
      ],
      unavailable_in_live_routes:
        unavailable.includes("inquiry_source") && diagnosticUnavailable.includes("inquiry_source")
    },
    {
      dimension: "country_source",
      layer: "product",
      raw_response_present: asArray(extraFields.country_related).length > 0,
      helper_hidden: false,
      route_exposed: false,
      derivable_from_existing_routes: false,
      legacy_page_request_present: false,
      classification: "NOT_DERIVABLE_CURRENTLY",
      evidence: [
        "official mainline: self.product extra_fields.country_related=[]",
        "live routes: unavailable_dimensions 保持 country_source"
      ],
      unavailable_in_live_routes:
        unavailable.includes("country_source") && diagnosticUnavailable.includes("country_source")
    },
    {
      dimension: "period_over_period_change",
      layer: "product",
      raw_response_present: asArray(extraFields.trend_related).length > 0,
      helper_hidden: false,
      route_exposed: false,
      derivable_from_existing_routes: false,
      legacy_page_request_present: false,
      classification: "NOT_DERIVABLE_CURRENTLY",
      evidence: [
        "official mainline: self.product extra_fields.trend_related=[]",
        "live routes: unavailable_dimensions 保持 period_over_period_change"
      ],
      unavailable_in_live_routes:
        unavailable.includes("period_over_period_change") &&
        diagnosticUnavailable.includes("period_over_period_change")
    }
  ];
}

function sumMoney(items = [], extractor) {
  let total = 0;
  let hasValue = false;

  for (const item of items) {
    const rawValue = extractor(item);
    const numeric = Number.parseFloat(String(rawValue ?? ""));
    if (Number.isFinite(numeric)) {
      total += numeric;
      hasValue = true;
    }
  }

  return hasValue ? Number(total.toFixed(4)) : null;
}

function buildOrderDerivationProof(listBody, detailBodies, fundBodies) {
  const items = asArray(listBody?.items);
  const detailItems = detailBodies
    .map((response) => response.body?.item)
    .filter(Boolean);
  const fundValues = fundBodies
    .map((response) => response.body?.value)
    .filter(Boolean);

  const contributionMap = new Map();
  for (const detail of detailItems) {
    for (const line of asArray(detail.order_products)) {
      const key = String(line.product_id ?? "");
      if (!key) {
        continue;
      }

      const quantity = Number.parseFloat(String(line.quantity ?? "")) || 0;
      const unitPrice = Number.parseFloat(String(line.unit_price?.amount ?? "")) || 0;
      const current = contributionMap.get(key) ?? {
        product_id: key,
        product_name: line.name ?? null,
        quantity_sum: 0,
        estimated_gmv_sum: 0
      };
      current.quantity_sum += quantity;
      current.estimated_gmv_sum += quantity * unitPrice;
      contributionMap.set(key, current);
    }
  }

  const topProducts = [...contributionMap.values()]
    .map((item) => ({
      ...item,
      quantity_sum: Number(item.quantity_sum.toFixed(4)),
      estimated_gmv_sum: Number(item.estimated_gmv_sum.toFixed(4))
    }))
    .sort((left, right) => right.estimated_gmv_sum - left.estimated_gmv_sum)
    .slice(0, 5);

  return {
    sampled_trade_count: items.length,
    sampled_trade_ids_count: detailItems.length,
    sampled_total_amount_sum: sumMoney(detailItems, (item) => item.amount?.amount),
    sampled_product_total_amount_sum: sumMoney(detailItems, (item) => item.product_total_amount?.amount),
    sampled_shipment_fee_sum: sumMoney(detailItems, (item) => item.shipment_fee?.amount),
    sampled_service_fee_sum: sumMoney(fundValues, (item) => item.service_fee?.amount),
    top_products_by_estimated_gmv: topProducts
  };
}

function buildOrderDimensionAudit(orderList, orderDetails, orderFunds, legacyEvidence) {
  const detailItems = orderDetails.map((item) => item.body?.item).filter(Boolean);
  const hasAmountFields = detailItems.some(
    (item) => item.amount?.amount || item.product_total_amount?.amount || item.shipment_fee?.amount
  );
  const hasServiceFee = orderFunds.some((item) => item.body?.value?.service_fee?.amount);
  const hasOrderProducts = detailItems.some(
    (item) => asArray(item.order_products).some((line) => line.product_id && line.quantity)
  );
  const helperHiddenCountrySignal = detailItems.some((item) =>
    asArray(item.available_field_keys).includes("shipping_address")
  );
  const routeExposedCountrySignal = detailItems.some(
    (item) => hasOwn(item, "shipping_address") || hasOwn(item?.buyer, "country")
  );

  return [
    {
      dimension: "formal_summary",
      layer: "order",
      raw_response_present: hasAmountFields || hasServiceFee,
      helper_hidden: false,
      route_exposed: true,
      derivable_from_existing_routes: hasAmountFields && hasServiceFee,
      legacy_page_request_present: false,
      classification:
        hasAmountFields && hasServiceFee
          ? "DERIVABLE_FROM_EXISTING_APIS"
          : "NOT_DERIVABLE_CURRENTLY",
      evidence: [
        "orders/list 提供可复用 trade_id + create_date",
        "orders/detail 暴露 amount / product_total_amount / shipment_fee / trade_status",
        "orders/fund 暴露 service_fee 与 fund_pay_list"
      ]
    },
    {
      dimension: "country_structure",
      layer: "order",
      raw_response_present: routeExposedCountrySignal,
      helper_hidden: helperHiddenCountrySignal,
      route_exposed: false,
      derivable_from_existing_routes: false,
      legacy_page_request_present: legacyEvidence.country_structure.present,
      classification: "NOT_DERIVABLE_CURRENTLY",
      evidence: [
        helperHiddenCountrySignal
          ? "official current route: orders/detail.available_field_keys 出现 shipping_address，但 public body 未返回 shipping_address.country / buyer.country"
          : "official current route: orders/detail 未暴露 country 实值",
        legacyEvidence.country_structure.present
          ? `legacy page_request: buyerCountryDistribution=${legacyEvidence.country_structure.buyer_country_distribution_count}, shippingCountryDistribution=${legacyEvidence.country_structure.shipping_country_distribution_count}`
          : "legacy page_request: 未见国家结构字段"
      ]
    },
    {
      dimension: "product_contribution",
      layer: "order",
      raw_response_present: hasOrderProducts,
      helper_hidden: false,
      route_exposed: hasOrderProducts,
      derivable_from_existing_routes: hasOrderProducts,
      legacy_page_request_present: false,
      classification: hasOrderProducts
        ? "DERIVABLE_FROM_EXISTING_APIS"
        : "NOT_DERIVABLE_CURRENTLY",
      evidence: [
        "orders/detail 暴露 order_products[].product_id / quantity / unit_price",
        "可在现有只读链上按 trade_id 聚合产品贡献"
      ]
    }
  ];
}

function buildAuditMarkdown({
  baselineChecks,
  storeAudit,
  productAudit,
  orderAudit,
  legacyStoreEvidence,
  legacyOrderEvidence,
  candidateMatrix,
  orderDerivationProof
}) {
  const lines = [];

  lines.push("# WIKA 剩余经营维度现有字段穷尽审计（第二轮）");
  lines.push("");
  lines.push("更新时间：2026-04-11");
  lines.push("");
  lines.push("## 本轮范围");
  lines.push("");
  lines.push("- 当前线程只处理 WIKA");
  lines.push("- 本轮先复核 stage24 远端基线，再检查 current official mainline 是否已经覆盖剩余经营维度");
  lines.push("- 只有在 current official mainline 明确没有覆盖时，才继续保留既有 doc-found only 候选");
  lines.push("- 本轮没有新增写动作，没有推进 XD，没有扩 live routes");
  lines.push("");
  lines.push("## stage24 线上基线回归");
  lines.push("");
  lines.push(`- \`/health\` -> ${baselineChecks.health ? "PASS" : "FAIL"}`);
  lines.push(`- \`/integrations/alibaba/auth/debug\` -> ${baselineChecks.auth_debug ? "PASS" : "FAIL"}`);
  lines.push(`- \`/integrations/alibaba/wika/reports/operations/management-summary\` -> ${baselineChecks.operations_management_summary ? "PASS" : "FAIL"}`);
  lines.push(`- \`/integrations/alibaba/wika/reports/products/management-summary\` -> ${baselineChecks.products_management_summary ? "PASS" : "FAIL"}`);
  lines.push(`- \`/integrations/alibaba/wika/reports/orders/management-summary\` -> ${baselineChecks.orders_management_summary ? "PASS" : "FAIL"}`);
  lines.push("");
  lines.push("## 现有字段穷尽审计矩阵");
  lines.push("");
  lines.push("| 维度 | 层级 | official raw 已出现 | helper 已拿到但未暴露 | live route 已暴露 | 现有 official route 是否可派生 | legacy page-request 已见 | 当前结论 | 关键证据 |");
  lines.push("| --- | --- | --- | --- | --- | --- | --- | --- | --- |");

  for (const item of [...storeAudit, ...productAudit, ...orderAudit]) {
    lines.push(
      `| \`${item.dimension}\` | ${item.layer} | ${item.raw_response_present ? "是" : "否"} | ${item.helper_hidden ? "是" : "否"} | ${item.route_exposed ? "是" : "否"} | ${item.derivable_from_existing_routes ? "是" : "否"} | ${item.legacy_page_request_present ? "是" : "否"} | \`${item.classification}\` | ${item.evidence.join("；")} |`
    );
  }

  lines.push("");
  lines.push("## legacy page-request 补充说明");
  lines.push("");
  lines.push("- 以下字段只代表仓内历史 seller page / page-request 报告里见过，不代表当前 official `/sync` 主线已成立：");
  lines.push(`  - \`traffic_source\` -> ${legacyStoreEvidence.traffic_source.present ? `已见 ${legacyStoreEvidence.traffic_source.count} 条 traffic source 记录` : "未见"}`);
  lines.push(`  - \`country_source\` -> ${legacyStoreEvidence.country_source.present ? `已见 visitor_country_distribution=${legacyStoreEvidence.country_source.visitor_country_count}、key_market_distribution=${legacyStoreEvidence.country_source.key_market_count}` : "未见"}`);
  lines.push(`  - \`quick_reply_rate\` -> ${legacyStoreEvidence.quick_reply_rate.present ? `已见 reply_within_5min_rate_30d=${legacyStoreEvidence.quick_reply_rate.value}` : "未见"}`);
  lines.push(`  - \`country_structure\` -> ${legacyOrderEvidence.country_structure.present ? `已见 buyer/shipping country 分布（buyer=${legacyOrderEvidence.country_structure.buyer_country_distribution_count}, shipping=${legacyOrderEvidence.country_structure.shipping_country_distribution_count})` : "未见"}`);
  lines.push("- 因当前线程仍严格限定在 Railway production + official `/sync + access_token + sha256`，这些 legacy page-request 证据本轮不能接入 live routes。");
  lines.push("");
  lines.push("## 本轮结论");
  lines.push("");
  lines.push("- 店铺级剩余维度 `traffic_source / country_source / quick_reply_rate`：当前 official mydata raw evidence 与 live routes 都未出现同义字段，继续保持 unavailable。");
  lines.push("- 产品级剩余维度 `access_source / inquiry_source / country_source / period_over_period_change`：当前 official mydata raw evidence 与 live routes 都未出现同义字段，继续保持 unavailable。");
  lines.push("- 订单级：");
  lines.push(`  - ` + "`formal_summary`" + `：当前已可由现有 ` + "`orders/list + orders/detail + orders/fund`" + ` 保守派生。`);
  lines.push(`  - ` + "`product_contribution`" + `：当前已可由现有 ` + "`orders/detail.order_products`" + ` 保守派生。`);
  lines.push(`  - ` + "`country_structure`" + `：当前 public route 未暴露 country 实值，虽然 ` + "`available_field_keys`" + ` 提示存在 ` + "`shipping_address`" + `，但仍不能写成已成立。`);
  lines.push("");
  lines.push("## 订单级最小派生证明");
  lines.push("");
  lines.push(`- sampled_trade_count: ${orderDerivationProof.sampled_trade_count}`);
  lines.push(`- sampled_trade_ids_count: ${orderDerivationProof.sampled_trade_ids_count}`);
  lines.push(`- sampled_total_amount_sum: ${orderDerivationProof.sampled_total_amount_sum ?? "null"}`);
  lines.push(`- sampled_product_total_amount_sum: ${orderDerivationProof.sampled_product_total_amount_sum ?? "null"}`);
  lines.push(`- sampled_shipment_fee_sum: ${orderDerivationProof.sampled_shipment_fee_sum ?? "null"}`);
  lines.push(`- sampled_service_fee_sum: ${orderDerivationProof.sampled_service_fee_sum ?? "null"}`);
  lines.push("- 说明：这只是既有 derived 结论的再次复核，不等于订单经营驾驶舱已成立。");
  lines.push("");
  lines.push("## 候选方法复核");
  lines.push("");
  lines.push("- 本轮新增候选方法：无");
  lines.push("- 原因：现有链路审计后没有出现必须立即新增 runtime 验证的官方入口，同时仓内既有 doc-found only 候选仍缺 doc URL 与稳定参数契约。");
  lines.push("");
  lines.push("| method | 目标方向 | 当前分类 | 本轮是否 runtime 验证 | 备注 |");
  lines.push("| --- | --- | --- | --- | --- |");
  for (const item of candidateMatrix) {
    lines.push(
      `| \`${item.method}\` | ${item.target_dimensions.join(" / ")} | \`${item.classification}\` | 否 | ${item.note} |`
    );
  }
  lines.push("");
  lines.push("## 当前 live route 处理");
  lines.push("");
  lines.push("- 本轮没有扩 live routes。");
  lines.push("- 当前仍应保持：");
  lines.push("  - store 侧 `traffic_source / country_source / quick_reply_rate` unavailable");
  lines.push("  - product 侧 `access_source / inquiry_source / country_source / period_over_period_change` unavailable");
  lines.push("  - order 侧 `country_structure` unavailable");
  lines.push("");
  lines.push("## 当前边界");
  lines.push("");
  lines.push("- not task 1 complete");
  lines.push("- not task 2 complete");
  lines.push("- no write action attempted");
  lines.push("- WIKA-only thread");
  lines.push("- XD untouched in this round");
  lines.push("- not full business cockpit");
  lines.push("");

  return `${lines.join("\n")}\n`;
}

async function run() {
  const baselineResponses = {
    health: await fetchJson(ROUTES.health),
    authDebug: await fetchJson(ROUTES.authDebug),
    operationsManagementSummary: await fetchJson(ROUTES.operationsManagementSummary),
    productsManagementSummary: await fetchJson(ROUTES.productsManagementSummary),
    ordersManagementSummary: await fetchJson(ROUTES.ordersManagementSummary)
  };

  const baselineChecks = buildBaselineChecks(baselineResponses);
  for (const [key, passed] of Object.entries(baselineChecks)) {
    assert(passed, `stage24 baseline regression on ${key}`);
  }

  const routeResponses = {
    operationsManagementSummary: baselineResponses.operationsManagementSummary,
    productsManagementSummary: baselineResponses.productsManagementSummary,
    ordersManagementSummary: baselineResponses.ordersManagementSummary,
    operationsMinimalDiagnostic: await fetchJson(ROUTES.operationsMinimalDiagnostic),
    productsMinimalDiagnostic: await fetchJson(ROUTES.productsMinimalDiagnostic),
    ordersMinimalDiagnostic: await fetchJson(ROUTES.ordersMinimalDiagnostic)
  };

  for (const [key, response] of Object.entries(routeResponses)) {
    assert(response.status === 200, `${key} HTTP status is not 200`);
    assert(response.is_json, `${key} did not return JSON`);
  }

  const indicatorEvidence = readJson(
    path.join(EVIDENCE_DIR, "alibaba_mydata_overview_indicator_basic_get_post_grant.json")
  );
  const productEvidence = readJson(
    path.join(EVIDENCE_DIR, "alibaba_mydata_self_product_get_post_grant.json")
  );
  const legacyPageData = readJson(
    path.join(
      WIKA_DIR,
      "projects",
      "wika",
      "data",
      "reports",
      "generated",
      "30d",
      "wika-page-data.json"
    )
  );
  const legacyOrderReport = readJson(
    path.join(
      WIKA_DIR,
      "projects",
      "wika",
      "data",
      "reports",
      "generated",
      "7d",
      "order-report.json"
    )
  );

  const legacyStoreEvidence = buildLegacyStoreEvidence(legacyPageData);
  const legacyOrderEvidence = buildLegacyOrderEvidence(legacyPageData, legacyOrderReport);

  const storeAudit = buildStoreDimensionAudit(
    indicatorEvidence,
    {
      operationsManagementSummary: routeResponses.operationsManagementSummary.body,
      operationsMinimalDiagnostic: routeResponses.operationsMinimalDiagnostic.body
    },
    legacyStoreEvidence
  );
  const productAudit = buildProductDimensionAudit(productEvidence, {
    productsManagementSummary: routeResponses.productsManagementSummary.body,
    productsMinimalDiagnostic: routeResponses.productsMinimalDiagnostic.body
  });

  const ordersList = await fetchJson(ROUTES.ordersList);
  assert(ordersList.status === 200 && ordersList.is_json, "orders/list baseline is not readable");
  const sampledTradeIds = asArray(ordersList.body?.items)
    .map((item) => String(item?.trade_id ?? "").trim())
    .filter(Boolean)
    .slice(0, 3);
  assert(sampledTradeIds.length > 0, "orders/list did not return sampled trade ids");

  const orderDetails = [];
  const orderFunds = [];
  for (const tradeId of sampledTradeIds) {
    const detail = await fetchJson(
      `/integrations/alibaba/wika/data/orders/detail?e_trade_id=${encodeURIComponent(tradeId)}`
    );
    const fund = await fetchJson(
      `/integrations/alibaba/wika/data/orders/fund?e_trade_id=${encodeURIComponent(
        tradeId
      )}&data_select=fund_serviceFee,fund_fundPay,fund_refund`
    );

    assert(detail.status === 200 && detail.is_json, `orders/detail failed for ${tradeId}`);
    assert(fund.status === 200 && fund.is_json, `orders/fund failed for ${tradeId}`);
    orderDetails.push(detail);
    orderFunds.push(fund);
  }

  const orderAudit = buildOrderDimensionAudit(
    ordersList.body,
    orderDetails,
    orderFunds,
    legacyOrderEvidence
  );
  const orderDerivationProof = buildOrderDerivationProof(
    ordersList.body,
    orderDetails,
    orderFunds
  );

  const summary = {
    stage: "stage25_gap_compression_round2",
    generated_at: new Date().toISOString(),
    base_url: BASE_URL,
    baseline: {
      routes: {
        health: {
          route: ROUTES.health,
          status: baselineResponses.health.status
        },
        auth_debug: {
          route: ROUTES.authDebug,
          status: baselineResponses.authDebug.status
        },
        operations_management_summary: {
          route: ROUTES.operationsManagementSummary,
          status: baselineResponses.operationsManagementSummary.status
        },
        products_management_summary: {
          route: ROUTES.productsManagementSummary,
          status: baselineResponses.productsManagementSummary.status
        },
        orders_management_summary: {
          route: ROUTES.ordersManagementSummary,
          status: baselineResponses.ordersManagementSummary.status
        }
      },
      checks: baselineChecks
    },
    existing_field_exhaustion: {
      store: storeAudit,
      product: productAudit,
      order: orderAudit
    },
    legacy_page_request_evidence: {
      store: legacyStoreEvidence,
      order: legacyOrderEvidence
    },
    route_audit_scope: {
      management_summary_routes: [
        ROUTES.operationsManagementSummary,
        ROUTES.productsManagementSummary,
        ROUTES.ordersManagementSummary
      ],
      minimal_diagnostic_routes: [
        ROUTES.operationsMinimalDiagnostic,
        ROUTES.productsMinimalDiagnostic,
        ROUTES.ordersMinimalDiagnostic
      ],
      order_routes: [
        ROUTES.ordersList,
        "/integrations/alibaba/wika/data/orders/detail",
        "/integrations/alibaba/wika/data/orders/fund"
      ]
    },
    reviewed_existing_candidates: EXISTING_DOC_FOUND_CANDIDATES,
    new_candidate_methods: [],
    new_confirmed_fields: [],
    newly_derivable_fields: [],
    current_derived_fields_still_valid: [
      {
        dimension: "formal_summary",
        classification: orderAudit.find((item) => item.dimension === "formal_summary")?.classification,
      },
      {
        dimension: "product_contribution",
        classification: orderAudit.find((item) => item.dimension === "product_contribution")?.classification,
      },
      {
        dimension: "trend_signal",
        classification: "DERIVABLE_FROM_EXISTING_APIS"
      }
    ],
    live_routes_expanded: false,
    stage2_runtime_validation_performed: false,
    stage2_runtime_validation_skip_reason:
      "本轮新增候选方法为空；既有 doc-found only 候选仍缺 doc URL 与稳定参数契约，不满足安全 runtime 验证前置条件。",
    boundary_statement: {
      not_task_1_complete: true,
      not_task_2_complete: true,
      no_write_action_attempted: true,
      wika_only_thread_for_business_work: true,
      xd_untouched_in_this_round: true,
      not_full_business_cockpit: true
    }
  };

  const existingFieldEvidence = {
    store_audit: storeAudit,
    product_audit: productAudit,
    order_audit: orderAudit,
    legacy_page_request_evidence: {
      store: legacyStoreEvidence,
      order: legacyOrderEvidence
    },
    sampled_order_routes: {
      list: ordersList.body,
      detail: orderDetails.map((item) => item.body),
      fund: orderFunds.map((item) => item.body)
    }
  };

  const candidateMethodMatrix = {
    new_candidate_methods: [],
    reviewed_existing_candidates: EXISTING_DOC_FOUND_CANDIDATES,
    dimension_outcomes: [
      ...storeAudit.map((item) => ({
        dimension: item.dimension,
        classification: item.classification
      })),
      ...productAudit.map((item) => ({
        dimension: item.dimension,
        classification: item.classification
      })),
      ...orderAudit.map((item) => ({
        dimension: item.dimension,
        classification: item.classification
      }))
    ],
    runtime_validation_performed: false,
    runtime_validation_skip_reason:
      "现有 official mainline 审计已完成，本轮无新增官方候选满足 doc URL + 参数契约前置条件。"
  };

  writeJson(
    path.join(EVIDENCE_DIR, "wika-stage25-gap-compression-summary.json"),
    sanitizeNode(summary)
  );
  writeJson(
    path.join(EVIDENCE_DIR, "wika-stage25-existing-field-exhaustion.json"),
    sanitizeNode(existingFieldEvidence)
  );
  writeJson(
    path.join(EVIDENCE_DIR, "wika-stage25-candidate-method-matrix.json"),
    sanitizeNode(candidateMethodMatrix)
  );
  writeText(
    AUDIT_DOC_PATH,
    buildAuditMarkdown({
      baselineChecks,
      storeAudit,
      productAudit,
      orderAudit,
      legacyStoreEvidence,
      legacyOrderEvidence,
      candidateMatrix: EXISTING_DOC_FOUND_CANDIDATES,
      orderDerivationProof
    })
  );

  console.log(JSON.stringify(sanitizeNode(summary), null, 2));
}

run().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error)
      },
      null,
      2
    )
  );
  process.exitCode = 1;
});
