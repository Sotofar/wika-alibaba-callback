import { buildOperationsManagementSummary } from "../../../../../shared/data/modules/wika-mydata-management-summary.js";
import {
  buildMetricDelta,
  calculatePreviousComparableDateRange,
  summarizeTrendDirections
} from "./comparison-utils.js";

const OPERATIONS_COMPARISON_FIELDS = Object.freeze([
  "visitor",
  "imps",
  "clk",
  "clk_rate",
  "fb",
  "reply"
]);

function buildOperationsBoundaryStatement() {
  return {
    derived_comparison_only: true,
    official_new_fields_added: false,
    not_full_store_dashboard: true,
    comparison_window_is_comparable_period_only: true,
    conservative_mapping_rules: [
      "retain official field names: visitor / imps / clk / clk_rate / fb / reply",
      "UV ~= visitor remains business-mapping pending",
      "use exposure / imps wording, do not assert PV confirmed",
      "reply remains a reply-related metric, not broad response-rate confirmation"
    ]
  };
}

function buildMetricComparisons(currentMetrics = {}, previousMetrics = {}) {
  const output = {};

  for (const fieldName of OPERATIONS_COMPARISON_FIELDS) {
    output[fieldName] = buildMetricDelta(
      currentMetrics[fieldName],
      previousMetrics[fieldName]
    );
  }

  return output;
}

export async function buildOperationsComparisonSummary(clientConfig, query = {}) {
  const generatedAt = new Date().toISOString();
  const currentSummary = await buildOperationsManagementSummary(clientConfig, query);
  const previousWindow = calculatePreviousComparableDateRange(currentSummary.date_range);

  let previousSummary = null;
  if (previousWindow) {
    previousSummary = await buildOperationsManagementSummary(clientConfig, {
      ...query,
      start_date: previousWindow.start_date,
      end_date: previousWindow.end_date,
      industry_id: currentSummary.industry?.industry_id ?? query.industry_id,
      industry_desc: currentSummary.industry?.industry_desc ?? query.industry_desc,
      main_category:
        currentSummary.industry?.main_category ?? query.main_category
    });
  }

  const metricComparisons = buildMetricComparisons(
    currentSummary.official_metrics,
    previousSummary?.official_metrics ?? {}
  );

  return {
    report_name: "operations_comparison_summary",
    generated_at: generatedAt,
    comparison_basis: {
      type: "store_level_period_comparison",
      derived: true,
      current_window_basis: "current live mydata overview window",
      previous_window_basis:
        "same inclusive day span immediately preceding the current window"
    },
    source_methods: currentSummary.source_methods ?? [],
    current_window: currentSummary.date_range ?? null,
    previous_window: previousSummary?.date_range ?? previousWindow ?? null,
    industry: currentSummary.industry ?? null,
    official_inputs: {
      field_names: [...OPERATIONS_COMPARISON_FIELDS],
      current_metrics: currentSummary.official_metrics ?? {},
      previous_metrics: previousSummary?.official_metrics ?? null
    },
    derived_comparison: {
      comparison_ready: Boolean(previousSummary),
      metric_deltas: metricComparisons,
      trend_direction_summary: summarizeTrendDirections(metricComparisons),
      comparison_boundary: {
        current_window_is_live_official_summary: true,
        previous_window_is_shifted_comparable_period: true,
        delta_rate_formula: "(current - previous) / previous when previous != 0"
      }
    },
    unavailable_dimensions: [...(currentSummary.unavailable_dimensions ?? [])],
    boundary_statement: buildOperationsBoundaryStatement()
  };
}
