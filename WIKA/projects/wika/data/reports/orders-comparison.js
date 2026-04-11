import { buildOrdersManagementSummary } from "../../../../../shared/data/modules/wika-order-management-summary.js";
import { buildMetricDelta } from "./comparison-utils.js";

function sumOrderCount(items = []) {
  return items.reduce((sum, item) => sum + Number(item?.order_count ?? 0), 0);
}

function buildComparableSegments(byDay = []) {
  const normalized = [...(Array.isArray(byDay) ? byDay : [])].sort((left, right) =>
    String(left?.date ?? "").localeCompare(String(right?.date ?? ""))
  );

  if (normalized.length < 2) {
    return {
      comparison_ready: false,
      current_segment: normalized.slice(-1),
      previous_segment: []
    };
  }

  const segmentLength = Math.max(1, Math.floor(normalized.length / 2));
  const currentSegment = normalized.slice(-segmentLength);
  const previousSegment = normalized.slice(-(segmentLength * 2), -segmentLength);

  return {
    comparison_ready: previousSegment.length > 0,
    current_segment: currentSegment,
    previous_segment: previousSegment
  };
}

function buildWindowFromSegment(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  return {
    start_date: items[0]?.date ?? null,
    end_date: items[items.length - 1]?.date ?? null,
    observed_point_count: items.length
  };
}

function averageOrderCount(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  return Number((sumOrderCount(items) / items.length).toFixed(4));
}

function buildOrdersBoundaryStatement() {
  return {
    derived_comparison_only: true,
    official_new_fields_added: false,
    derived_from_existing_order_apis_only: true,
    not_full_order_cockpit: true,
    country_structure_unavailable_currently: true,
    product_contribution_delta_not_available: true,
    comparison_is_sample_window_based: true
  };
}

export async function buildOrdersComparisonSummary(clientConfig, query = {}) {
  const generatedAt = new Date().toISOString();
  const currentSummary = await buildOrdersManagementSummary(clientConfig, query);
  const byDay = currentSummary.trend_signal?.by_day ?? [];
  const segments = buildComparableSegments(byDay);
  const currentSegmentTotal = sumOrderCount(segments.current_segment);
  const previousSegmentTotal = sumOrderCount(segments.previous_segment);
  const observedOrderCountDelta = buildMetricDelta(
    currentSegmentTotal,
    segments.previous_segment.length > 0 ? previousSegmentTotal : null
  );
  const averageDailyOrderCountDelta = buildMetricDelta(
    averageOrderCount(segments.current_segment),
    segments.previous_segment.length > 0
      ? averageOrderCount(segments.previous_segment)
      : null
  );

  return {
    report_name: "orders_comparison_summary",
    generated_at: generatedAt,
    comparison_basis: {
      type: "derived_order_window_comparison",
      derived: true,
      current_window_basis:
        "latest contiguous segment from sampled trend_signal.by_day",
      previous_window_basis:
        "immediately preceding contiguous segment of the same observed point count"
    },
    current_window: buildWindowFromSegment(segments.current_segment),
    previous_window: buildWindowFromSegment(segments.previous_segment),
    official_inputs: {
      source_routes: currentSummary.source_routes ?? [],
      observed_trade_count: currentSummary.formal_summary?.observed_trade_count ?? null,
      sampled_trend_point_count: byDay.length,
      sample_or_window_basis: currentSummary.sample_or_window_basis ?? null
    },
    derived_inputs: {
      formal_summary: currentSummary.formal_summary ?? null,
      product_contribution: currentSummary.product_contribution ?? null,
      trend_signal: currentSummary.trend_signal ?? null
    },
    derived_comparison: {
      comparison_ready: segments.comparison_ready,
      observed_order_count_delta: observedOrderCountDelta,
      average_daily_order_count_delta: averageDailyOrderCountDelta,
      current_segment: segments.current_segment,
      previous_segment: segments.previous_segment,
      product_contribution_delta: {
        derived: true,
        available: false,
        reason:
          "current order management summary does not expose comparable previous-window product contribution slices"
      },
      comparison_boundary: {
        sampled_window_based: true,
        derived_from_existing_order_summary_only: true
      }
    },
    unavailable_dimensions: [...(currentSummary.unavailable_dimensions ?? [])],
    boundary_statement: buildOrdersBoundaryStatement()
  };
}
