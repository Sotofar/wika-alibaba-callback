import {
  fetchWikaOperationsTrafficSummary,
  MYDATA_OVERVIEW_UNAVAILABLE_DIMENSIONS
} from "./alibaba-mydata-overview.js";
import {
  fetchWikaProductPerformanceSummary,
  MYDATA_PRODUCT_UNAVAILABLE_DIMENSIONS
} from "./alibaba-mydata-product-performance.js";
import { fetchWikaProductList } from "../../../WIKA/projects/wika/data/products/module.js";
import {
  buildAggregateDerivedMetrics,
  buildAggregateOfficialMetrics,
  buildKeywordSignalSummary,
  buildTopProductsByMetric
} from "./wika-mydata-product-ranking.js";

function safeArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && typeof value === "object") {
    return [value];
  }

  return [];
}

function toNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toPositiveInteger(value, fallbackValue, maxValue = Number.POSITIVE_INFINITY) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallbackValue;
  }

  return Math.min(parsed, maxValue);
}

function buildOperationsRecommendations(officialMetrics = {}) {
  const visitor = toNumber(officialMetrics.visitor);
  const imps = toNumber(officialMetrics.imps);
  const clk = toNumber(officialMetrics.clk);
  const fb = toNumber(officialMetrics.fb);
  const reply = toNumber(officialMetrics.reply);
  const recommendations = [];

  if (Number.isFinite(imps) && imps > 0 && Number.isFinite(clk) && clk === 0) {
    recommendations.push(
      "当前窗口已有 exposure/imps 但 click 为 0，优先检查主图、标题与关键词相关性。"
    );
  }

  if (Number.isFinite(visitor) && visitor > 0 && Number.isFinite(fb) && fb === 0) {
    recommendations.push(
      "当前窗口已有 visitor 但 fb 为 0，优先检查询盘入口、详情页信任信息与 CTA。"
    );
  }

  if (Number.isFinite(reply) && reply < 0.9) {
    recommendations.push(
      "reply 相关指标低于近期参考线，建议复核首响流程，但不要扩写成广义 response rate。"
    );
  }

  if (recommendations.length === 0) {
    recommendations.push("当前店铺级 mydata 子集没有明显异常，建议继续按周跟踪 visitor / imps / clk / fb / reply。");
  }

  return recommendations;
}

function buildOperationsInterpretation(officialMetrics = {}) {
  return {
    traffic_signal_summary: {
      summary:
        "当前 management summary 只覆盖已确认的 store-level mydata official fields，可用于观察 visitor / imps / clk / clk_rate 的基本流量信号。",
      highlights: {
        visitor: toNumber(officialMetrics.visitor),
        imps: toNumber(officialMetrics.imps),
        clk: toNumber(officialMetrics.clk),
        clk_rate: toNumber(officialMetrics.clk_rate)
      }
    },
    inquiry_reply_signal_summary: {
      summary:
        "当前 management summary 只覆盖 fb 与 reply 相关信号，可用于询盘与首响相关判断，不等于完整客服响应驾驶舱。",
      highlights: {
        fb: toNumber(officialMetrics.fb),
        reply: toNumber(officialMetrics.reply)
      }
    }
  };
}

function buildOperationsBoundaryStatement() {
  return {
    official_mydata_subset_only: true,
    not_full_store_dashboard: true,
    conservative_mapping_rules: [
      "保留 official field names：visitor / imps / clk / clk_rate / fb / reply",
      "UV ~= visitor（business-mapping pending）",
      "使用 exposure / imps 表述，不直接写 PV confirmed",
      "reply 仅按 reply-related metric / recent first-reply-rate 语境使用，不扩写成广义 response rate confirmed"
    ]
  };
}

function buildProductsBoundaryStatement() {
  return {
    official_mydata_subset_only: true,
    not_full_product_cockpit: true,
    conservative_mapping_rules: [
      "保留 official field names：click / impression / visitor / fb / order / bookmark / compare / share / keyword_effects",
      "CTR 仅作为 derived field 暴露，不冒充官方直接字段",
      "当前 product scope 可能是样本聚合，不默认代表全店全量统计"
    ]
  };
}

function buildProductsRecommendations(summary = {}) {
  const aggregate = summary.aggregate_official_metrics ?? {};
  const recommendations = [];

  if ((toNumber(aggregate.impression) ?? 0) > 0 && (toNumber(aggregate.click) ?? 0) === 0) {
    recommendations.push("样本内已有 impression 但 click 为 0，优先检查头部样本的主图与标题吸引力。");
  }

  if ((toNumber(aggregate.visitor) ?? 0) > 0 && (toNumber(aggregate.fb) ?? 0) === 0) {
    recommendations.push("样本内已有 visitor 但 fb 为 0，优先检查详情页询盘承接与报价入口。");
  }

  if ((summary.keyword_signal_summary?.products_with_keyword_effects ?? 0) === 0) {
    recommendations.push("当前样本未见 keyword_effects，有必要继续复核关键词露出与关键词有效性。");
  }

  if (summary.product_scope_truncated) {
    recommendations.push("当前产品经营摘要是带上限的样本聚合，业务使用时必须同时查看 product_scope_limit 与 product_ids_used_count。");
  }

  if (recommendations.length === 0) {
    recommendations.push("当前样本内未见明显经营异常，建议按相同 statistics_type 持续跟踪 click / impression / fb / order。");
  }

  return recommendations;
}

function normalizeProductScopeQuery(query = {}) {
  const productLimit = toPositiveInteger(
    query.productLimit ?? query.product_limit ?? query.product_id_limit,
    5,
    20
  );
  const productPageSize = toPositiveInteger(query.product_page_size, Math.max(productLimit, 20), 30);

  return {
    ...query,
    product_id_limit: productLimit,
    product_page_size: productPageSize
  };
}

async function buildProductCatalogLookup(clientConfig, query = {}) {
  const pageSize = toPositiveInteger(query.product_page_size, 30, 30);
  const listResult = await fetchWikaProductList(clientConfig, {
    page_size: pageSize
  });

  const itemMap = new Map(
    safeArray(listResult.items).map((item) => [String(item?.id ?? item?.product_id ?? ""), item])
  );

  return {
    listResult,
    itemMap
  };
}

function resolveProductScopeMetadata(performanceSummary, query = {}) {
  const rawProductIds = String(query.product_ids ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const productIdsUsed = safeArray(performanceSummary.product_ids).map((item) => String(item));
  const productIdsUsedCount = productIdsUsed.length;
  const source = performanceSummary?.upstream_context?.product_ids_source ?? "unknown";
  const upstreamTotalItem = toNumber(performanceSummary?.upstream_context?.upstream_total_item);
  const configuredLimit = toPositiveInteger(
    query.productLimit ?? query.product_limit ?? query.product_id_limit,
    productIdsUsedCount || 5,
    20
  );

  const explicitIdsTruncated =
    rawProductIds.length > 0 ? rawProductIds.length > productIdsUsedCount : false;
  const upstreamTruncated =
    source === "/integrations/alibaba/wika/data/products/list" &&
    Number.isFinite(upstreamTotalItem) &&
    upstreamTotalItem > productIdsUsedCount;

  return {
    product_scope_basis:
      rawProductIds.length > 0 ? "explicit_product_ids" : "sample_from_products_list",
    product_scope_limit: configuredLimit,
    product_scope_truncated: explicitIdsTruncated || upstreamTruncated,
    product_ids_used: productIdsUsed,
    product_ids_used_count: productIdsUsedCount,
    upstream_total_item: upstreamTotalItem
  };
}

export async function buildOperationsManagementSummary(clientConfig, query = {}) {
  const trafficSummary = await fetchWikaOperationsTrafficSummary(clientConfig, query);
  const officialMetrics = trafficSummary.official_metrics ?? {};

  return {
    report_name: "operations_management_summary",
    generated_at: new Date().toISOString(),
    report_scope: {
      type: "store_level_mydata_subset",
      sample_based: false
    },
    source_methods: [...safeArray(trafficSummary.source_methods)],
    date_range: trafficSummary.date_range ?? null,
    industry: trafficSummary.industry ?? null,
    official_metrics: officialMetrics,
    derived_metrics: trafficSummary.derived_metrics ?? {},
    interpretation: buildOperationsInterpretation(officialMetrics),
    unavailable_dimensions: [...MYDATA_OVERVIEW_UNAVAILABLE_DIMENSIONS],
    recommendations: buildOperationsRecommendations(officialMetrics),
    boundary_statement: buildOperationsBoundaryStatement()
  };
}

export async function buildProductsManagementSummary(clientConfig, query = {}) {
  const normalizedQuery = normalizeProductScopeQuery(query);
  const performanceSummary = await fetchWikaProductPerformanceSummary(clientConfig, normalizedQuery);
  const { itemMap } = await buildProductCatalogLookup(clientConfig, normalizedQuery);
  const scopeMetadata = resolveProductScopeMetadata(performanceSummary, normalizedQuery);

  const items = safeArray(performanceSummary.items).map((item) => {
    const lookup = itemMap.get(String(item.product_id ?? "")) ?? null;
    return {
      product_id: item.product_id ?? null,
      product_name: lookup?.subject ?? null,
      official_metrics: {
        ...item.official_metrics
      },
      derived_metrics: {
        ...item.derived_metrics
      }
    };
  });

  const aggregateOfficialMetrics = buildAggregateOfficialMetrics(items);
  const aggregateDerivedMetrics = buildAggregateDerivedMetrics(aggregateOfficialMetrics);
  const rankingSections = {
    top_products_by_impression: buildTopProductsByMetric(items, "impression"),
    top_products_by_click: buildTopProductsByMetric(items, "click"),
    top_products_by_fb: buildTopProductsByMetric(items, "fb"),
    top_products_by_order: buildTopProductsByMetric(items, "order")
  };

  const keywordSignalSummary = buildKeywordSignalSummary(items);
  const summary = {
    report_name: "products_management_summary",
    generated_at: new Date().toISOString(),
    report_scope: {
      type: "sampled_product_mydata_subset",
      sample_based: true
    },
    source_methods: [...safeArray(performanceSummary.source_methods)],
    statistics_type: performanceSummary.statistics_type ?? null,
    stat_date: performanceSummary.stat_date ?? null,
    product_scope_basis: scopeMetadata.product_scope_basis,
    product_scope_limit: scopeMetadata.product_scope_limit,
    product_scope_truncated: scopeMetadata.product_scope_truncated,
    product_ids_used: scopeMetadata.product_ids_used,
    product_ids_used_count: scopeMetadata.product_ids_used_count,
    item_count: performanceSummary.item_count ?? items.length,
    aggregate_official_metrics: aggregateOfficialMetrics,
    aggregate_derived_metrics: aggregateDerivedMetrics,
    keyword_signal_summary: keywordSignalSummary,
    ranking_sections: rankingSections,
    top_products_by_impression: rankingSections.top_products_by_impression,
    top_products_by_click: rankingSections.top_products_by_click,
    top_products_by_fb: rankingSections.top_products_by_fb,
    top_products_by_order: rankingSections.top_products_by_order,
    items,
    unavailable_dimensions: [...MYDATA_PRODUCT_UNAVAILABLE_DIMENSIONS],
    boundary_statement: buildProductsBoundaryStatement()
  };

  return {
    ...summary,
    recommendations: buildProductsRecommendations(summary)
  };
}
