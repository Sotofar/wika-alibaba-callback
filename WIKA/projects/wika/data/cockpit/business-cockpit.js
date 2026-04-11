import {
  fetchWikaMinimalDiagnostic,
  fetchWikaOrderMinimalDiagnostic,
  fetchWikaProductMinimalDiagnostic
} from "../../../../../shared/data/modules/wika-minimal-diagnostic.js";
import {
  buildOperationsManagementSummary,
  buildProductsManagementSummary
} from "../../../../../shared/data/modules/wika-mydata-management-summary.js";
import { buildOrdersManagementSummary } from "../../../../../shared/data/modules/wika-order-management-summary.js";
import { buildOperationsComparisonSummary } from "../reports/operations-comparison.js";
import { buildProductsComparisonSummary } from "../reports/products-comparison.js";
import { buildOrdersComparisonSummary } from "../reports/orders-comparison.js";
import { buildCrossSectionGaps } from "./cockpit-gaps.js";
import {
  buildBusinessCockpitBoundaryStatement,
  buildTaskCoverageSummary,
  normalizeOrderDiagnostic,
  normalizeProductDiagnostic,
  normalizeStoreDiagnostic,
  withSourceRoute
} from "./business-cockpit-normalizers.js";

function toPositiveInteger(
  value,
  fallbackValue,
  maxValue = Number.POSITIVE_INFINITY
) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallbackValue;
  }

  return Math.min(parsed, maxValue);
}

function normalizeCockpitQuery(query = {}) {
  return {
    ...query,
    product_id_limit: toPositiveInteger(
      query.product_id_limit ?? query.productLimit,
      5,
      20
    ),
    pageLimit: toPositiveInteger(query.pageLimit ?? query.page_limit, 3, 10),
    order_sample_limit: toPositiveInteger(
      query.order_sample_limit ?? query.orderSampleLimit,
      3,
      10
    )
  };
}

function loadOrUse(preloadedValue, loader) {
  if (preloadedValue !== undefined) {
    return preloadedValue;
  }

  return loader();
}

export async function buildBusinessCockpit(
  clientConfig,
  query = {},
  preloaded = {}
) {
  const normalizedQuery = normalizeCockpitQuery(query);
  const [
    storeOverview,
    productOverview,
    orderOverview,
    storeComparison,
    productComparison,
    orderComparison,
    storeDiagnosticRaw,
    productDiagnosticRaw,
    orderDiagnosticRaw
  ] = await Promise.all([
    loadOrUse(preloaded.storeOverview, () =>
      buildOperationsManagementSummary(clientConfig, normalizedQuery)
    ),
    loadOrUse(preloaded.productOverview, () =>
      buildProductsManagementSummary(clientConfig, normalizedQuery)
    ),
    loadOrUse(preloaded.orderOverview, () =>
      buildOrdersManagementSummary(clientConfig, normalizedQuery)
    ),
    loadOrUse(preloaded.storeComparison, () =>
      buildOperationsComparisonSummary(clientConfig, normalizedQuery)
    ),
    loadOrUse(preloaded.productComparison, () =>
      buildProductsComparisonSummary(clientConfig, normalizedQuery)
    ),
    loadOrUse(preloaded.orderComparison, () =>
      buildOrdersComparisonSummary(clientConfig, normalizedQuery)
    ),
    loadOrUse(preloaded.storeDiagnostic, () =>
      fetchWikaMinimalDiagnostic(clientConfig, normalizedQuery)
    ),
    loadOrUse(preloaded.productDiagnostic, () =>
      fetchWikaProductMinimalDiagnostic(clientConfig, normalizedQuery)
    ),
    loadOrUse(preloaded.orderDiagnostic, () =>
      fetchWikaOrderMinimalDiagnostic(clientConfig, normalizedQuery)
    )
  ]);

  return {
    report_name: "business_cockpit",
    generated_at: new Date().toISOString(),
    store_overview: withSourceRoute(
      storeOverview,
      "/integrations/alibaba/wika/reports/operations/management-summary"
    ),
    product_overview: withSourceRoute(
      productOverview,
      "/integrations/alibaba/wika/reports/products/management-summary"
    ),
    order_overview: withSourceRoute(
      orderOverview,
      "/integrations/alibaba/wika/reports/orders/management-summary"
    ),
    store_comparison: withSourceRoute(
      storeComparison,
      "/integrations/alibaba/wika/reports/operations/comparison-summary"
    ),
    product_comparison: withSourceRoute(
      productComparison,
      "/integrations/alibaba/wika/reports/products/comparison-summary"
    ),
    order_comparison: withSourceRoute(
      orderComparison,
      "/integrations/alibaba/wika/reports/orders/comparison-summary"
    ),
    store_diagnostic: normalizeStoreDiagnostic(storeDiagnosticRaw),
    product_diagnostic: normalizeProductDiagnostic(productDiagnosticRaw),
    order_diagnostic: normalizeOrderDiagnostic(orderDiagnosticRaw),
    cross_section_gaps: buildCrossSectionGaps(),
    task_coverage_summary: buildTaskCoverageSummary(),
    boundary_statement: buildBusinessCockpitBoundaryStatement()
  };
}
