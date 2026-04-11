import {
  buildProductsManagementSummary
} from "../../../../../shared/data/modules/wika-mydata-management-summary.js";
import { getSelfProductDateWindows } from "../../../../../shared/data/modules/alibaba-mydata-product-performance.js";
import {
  buildMetricDelta,
  calculatePreviousComparableStatDate,
  sortMetricDesc,
  summarizeTrendDirections,
  toObjectByKey
} from "./comparison-utils.js";

const PRODUCTS_COMPARISON_FIELDS = Object.freeze([
  "click",
  "impression",
  "visitor",
  "fb",
  "order",
  "bookmark",
  "compare",
  "share"
]);

function hasKeywordEffects(item = {}) {
  const value = item?.official_metrics?.keyword_effects;
  return Boolean(value) && typeof value === "object" && Object.keys(value).length > 0;
}

function buildAggregateMetricComparisons(currentMetrics = {}, previousMetrics = {}) {
  const output = {};

  for (const fieldName of PRODUCTS_COMPARISON_FIELDS) {
    output[fieldName] = buildMetricDelta(
      currentMetrics[fieldName],
      previousMetrics[fieldName]
    );
  }

  return output;
}

function buildRankingDelta(currentItems = [], previousItems = [], metricName) {
  const currentRanking = sortMetricDesc(
    currentItems,
    (item) => item?.official_metrics?.[metricName]
  );
  const previousRanking = sortMetricDesc(
    previousItems,
    (item) => item?.official_metrics?.[metricName]
  );
  const currentPositions = new Map(
    currentRanking.map((item, index) => [String(item?.product_id ?? ""), index + 1])
  );
  const previousPositions = new Map(
    previousRanking.map((item, index) => [String(item?.product_id ?? ""), index + 1])
  );

  return currentRanking
    .map((item) => {
      const productId = String(item?.product_id ?? "");
      const currentRank = currentPositions.get(productId) ?? null;
      const previousRank = previousPositions.get(productId) ?? null;
      const rankDelta =
        currentRank !== null && previousRank !== null ? previousRank - currentRank : null;

      return {
        product_id: item?.product_id ?? null,
        product_name: item?.product_name ?? null,
        metric_name: metricName,
        current_rank: currentRank,
        previous_rank: previousRank,
        rank_delta: rankDelta,
        current_value: item?.official_metrics?.[metricName] ?? null,
        previous_value:
          previousRanking.find((previousItem) => String(previousItem?.product_id ?? "") === productId)
            ?.official_metrics?.[metricName] ?? null
      };
    })
    .filter((item) => item.current_rank !== null)
    .slice(0, 10);
}

function buildTopMovers(currentItems = [], previousItemsById = new Map(), metricName, direction) {
  const normalized = currentItems
    .map((item) => {
      const previousItem = previousItemsById.get(String(item?.product_id ?? "")) ?? null;
      const metricDelta = buildMetricDelta(
        item?.official_metrics?.[metricName],
        previousItem?.official_metrics?.[metricName]
      );

      return {
        product_id: item?.product_id ?? null,
        product_name: item?.product_name ?? null,
        metric_name: metricName,
        ...metricDelta
      };
    })
    .filter((item) => item.delta_value !== null);

  normalized.sort((left, right) =>
    direction === "rise"
      ? right.delta_value - left.delta_value
      : left.delta_value - right.delta_value
  );

  return normalized.slice(0, 5);
}

function buildItemLevelDeltas(currentItems = [], previousItemsById = new Map()) {
  return currentItems.map((item) => {
    const previousItem = previousItemsById.get(String(item?.product_id ?? "")) ?? null;
    const metricComparisons = {};

    for (const fieldName of PRODUCTS_COMPARISON_FIELDS) {
      metricComparisons[fieldName] = buildMetricDelta(
        item?.official_metrics?.[fieldName],
        previousItem?.official_metrics?.[fieldName]
      );
    }

    return {
      product_id: item?.product_id ?? null,
      product_name: item?.product_name ?? null,
      metric_deltas: metricComparisons
    };
  });
}

function buildProductsBoundaryStatement() {
  return {
    derived_comparison_only: true,
    official_new_fields_added: false,
    not_full_product_cockpit: true,
    sample_scope_reused_for_previous_window: true,
    comparison_requires_same_product_sample: true,
    conservative_mapping_rules: [
      "retain official field names: click / impression / visitor / fb / order / bookmark / compare / share / keyword_effects",
      "derived comparison does not convert keyword_effects into a new official field",
      "sample-based scope remains explicit and must not be read as full-shop full-history coverage"
    ]
  };
}

export async function buildProductsComparisonSummary(clientConfig, query = {}) {
  const generatedAt = new Date().toISOString();
  const currentSummary = await buildProductsManagementSummary(clientConfig, query);
  const statisticsType = currentSummary.statistics_type ?? "day";
  const dateWindows = await getSelfProductDateWindows(clientConfig, {
    statisticsType
  });
  const previousStatDate = calculatePreviousComparableStatDate(
    currentSummary.stat_date,
    statisticsType,
    dateWindows.date_windows ?? []
  );

  let previousSummary = null;
  if (previousStatDate) {
    previousSummary = await buildProductsManagementSummary(clientConfig, {
      ...query,
      statistics_type: statisticsType,
      stat_date: previousStatDate,
      product_ids: (currentSummary.product_ids_used ?? []).join(","),
      product_id_limit: currentSummary.product_ids_used_count
    });
  }

  const currentItems = currentSummary.items ?? [];
  const previousItems = previousSummary?.items ?? [];
  const previousItemsById = toObjectByKey(previousItems);
  const aggregateComparisons = buildAggregateMetricComparisons(
    currentSummary.aggregate_official_metrics,
    previousSummary?.aggregate_official_metrics ?? {}
  );
  const keywordSignalDelta = buildMetricDelta(
    currentItems.filter((item) => hasKeywordEffects(item)).length,
    previousItems.filter((item) => hasKeywordEffects(item)).length
  );

  return {
    report_name: "products_comparison_summary",
    generated_at: generatedAt,
    comparison_basis: {
      type: "sampled_product_period_comparison",
      derived: true,
      current_window_basis: "current live mydata product summary stat window",
      previous_window_basis: "previous comparable stat_date for the same statistics_type"
    },
    statistics_type: statisticsType,
    current_window: {
      stat_date: currentSummary.stat_date ?? null
    },
    previous_window: {
      stat_date: previousStatDate,
      available: Boolean(previousSummary)
    },
    product_scope_basis: currentSummary.product_scope_basis ?? null,
    product_scope_limit: currentSummary.product_scope_limit ?? null,
    product_scope_truncated: currentSummary.product_scope_truncated ?? null,
    product_ids_used: currentSummary.product_ids_used ?? [],
    product_ids_used_count: currentSummary.product_ids_used_count ?? 0,
    official_inputs: {
      field_names: [...PRODUCTS_COMPARISON_FIELDS],
      current_aggregate_metrics: currentSummary.aggregate_official_metrics ?? {},
      previous_aggregate_metrics: previousSummary?.aggregate_official_metrics ?? null,
      keyword_signal_current: currentSummary.keyword_signal_summary ?? null,
      keyword_signal_previous: previousSummary?.keyword_signal_summary ?? null
    },
    derived_comparison: {
      comparison_ready: Boolean(previousSummary),
      aggregate_metric_deltas: aggregateComparisons,
      keyword_signal_delta: {
        derived: true,
        current_products_with_keyword_effects:
          currentItems.filter((item) => hasKeywordEffects(item)).length,
        previous_products_with_keyword_effects:
          previousItems.filter((item) => hasKeywordEffects(item)).length,
        ...keywordSignalDelta
      },
      ranking_delta: {
        impression: buildRankingDelta(currentItems, previousItems, "impression"),
        click: buildRankingDelta(currentItems, previousItems, "click"),
        order: buildRankingDelta(currentItems, previousItems, "order")
      },
      top_risers_by_click_delta: buildTopMovers(
        currentItems,
        previousItemsById,
        "click",
        "rise"
      ),
      top_decliners_by_click_delta: buildTopMovers(
        currentItems,
        previousItemsById,
        "click",
        "decline"
      ),
      trend_direction_summary: summarizeTrendDirections(aggregateComparisons),
      item_level_deltas: buildItemLevelDeltas(currentItems, previousItemsById)
    },
    unavailable_dimensions: [...(currentSummary.unavailable_dimensions ?? [])],
    boundary_statement: buildProductsBoundaryStatement()
  };
}
