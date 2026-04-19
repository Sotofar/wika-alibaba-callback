import {
  fetchWikaMinimalDiagnostic,
  fetchWikaOrderMinimalDiagnostic,
  fetchWikaProductMinimalDiagnostic
} from "../../../../../shared/data/modules/wika-minimal-diagnostic.js";
import { buildPartialStatus, loadSectionWithBudget } from "../common/aggregate-runtime.js";
import { buildOperationsComparisonSummary } from "../reports/operations-comparison.js";
import { buildProductsComparisonSummary } from "../reports/products-comparison.js";
import { buildOrdersComparisonSummary } from "../reports/orders-comparison.js";
import { buildTaskWorkbench } from "../workbench/task-workbench.js";
import { buildCrossSectionGaps } from "./cockpit-gaps.js";
import {
  buildTaskCoverageSummary,
  normalizeOrderDiagnostic,
  normalizeProductDiagnostic,
  normalizeStoreDiagnostic
} from "./business-cockpit-normalizers.js";

const STORE_DIAGNOSTIC_BUDGET_MS = 7000;
const PRODUCT_DIAGNOSTIC_BUDGET_MS = 7000;
const ORDER_DIAGNOSTIC_BUDGET_MS = 7000;
const STORE_COMPARISON_BUDGET_MS = 7000;
const PRODUCT_COMPARISON_BUDGET_MS = 7000;
const ORDER_COMPARISON_BUDGET_MS = 7000;
const TASK_WORKBENCH_BUDGET_MS = 10000;

function unique(values = []) {
  return [...new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))];
}

function buildDiagnosticFallback(sectionName, meta) {
  return {
    source_route: `/integrations/alibaba/wika/reports/${sectionName}/minimal-diagnostic`,
    report_name: `${sectionName}_minimal_diagnostic`,
    finding_count: 0,
    recommendation_count: 0,
    top_findings: [],
    top_recommendations: [],
    confidence_hints: {
      degraded: true,
      reason: meta.reason
    },
    unavailable_dimensions_echo: [],
    partial_status: meta
  };
}

function buildComparisonFallback(sectionName, meta) {
  return {
    source_route: `/integrations/alibaba/wika/reports/${sectionName}/comparison-summary`,
    report_name: `${sectionName}_comparison_summary`,
    current_window: null,
    previous_window: null,
    trend_direction: null,
    primary_deltas: null,
    unavailable_dimensions: [],
    partial_status: meta
  };
}

function buildTaskWorkbenchFallback(meta) {
  return {
    report_name: "task_workbench",
    task3_summary: {
      report_name: "product_draft_workbench",
      recommended_next_action:
        "Task3 workbench is temporarily degraded. Retry after the read-side builder recovers.",
      blocking_risks: [`task3_summary_${meta.reason}`]
    },
    task4_summary: {
      report_name: "reply_workbench",
      recommended_next_action:
        "Task4 workbench is temporarily degraded. Retry after the read-side builder recovers.",
      blocker_taxonomy_summary: {
        hard_blocker_codes: [`task4_summary_${meta.reason}`],
        soft_blocker_codes: []
      }
    },
    task5_summary: {
      report_name: "order_workbench",
      recommended_next_action:
        "Task5 workbench is temporarily degraded. Retry after the read-side builder recovers.",
      blocker_taxonomy_summary: {
        hard_blocker_codes: [`task5_summary_${meta.reason}`],
        soft_blocker_codes: []
      }
    },
    shared_blockers: [`task_workbench:${meta.reason}`],
    partial_status: buildPartialStatus([meta]),
    degraded_sections: [meta]
  };
}

function summarizeDiagnosticSection(section = {}) {
  return {
    source_route: section.source_route ?? null,
    report_name: section.report_name ?? null,
    finding_count: Array.isArray(section.diagnostic_findings)
      ? section.diagnostic_findings.length
      : section.finding_count ?? 0,
    recommendation_count: Array.isArray(section.recommendations)
      ? section.recommendations.length
      : section.recommendation_count ?? 0,
    top_findings: Array.isArray(section.diagnostic_findings)
      ? section.diagnostic_findings.slice(0, 3)
      : section.top_findings ?? [],
    top_recommendations: Array.isArray(section.recommendations)
      ? section.recommendations.slice(0, 3)
      : section.top_recommendations ?? [],
    confidence_hints: section.confidence_hints ?? null,
    unavailable_dimensions_echo: section.unavailable_dimensions_echo ?? [],
    partial_status: section.partial_status ?? null
  };
}

function summarizeComparisonSection(section = {}) {
  return {
    source_route: section.source_route ?? null,
    report_name: section.report_name ?? null,
    current_window: section.current_window ?? null,
    previous_window: section.previous_window ?? null,
    trend_direction:
      section.derived_comparison?.trend_direction_summary?.overall_direction ??
      section.derived_comparison?.trend_direction ?? null,
    primary_deltas:
      section.derived_comparison?.metric_deltas ??
      section.derived_comparison?.aggregate_metric_deltas ??
      section.primary_deltas ??
      null,
    unavailable_dimensions: section.unavailable_dimensions ?? [],
    partial_status: section.partial_status ?? null
  };
}

function summarizeWorkbenchSection(section = {}, reportName) {
  return {
    report_name: section.report_name ?? reportName,
    recommended_next_action: section.recommended_next_action ?? null,
    blocking_signals: unique([
      ...(section.blocking_risks ?? []),
      ...(section.blocker_taxonomy_summary?.hard_blocker_codes ?? []),
      ...(section.blocker_taxonomy_summary?.soft_blocker_codes ?? [])
    ]),
    boundary_statement: section.boundary_statement ?? null
  };
}

function buildPrioritizedActions({ diagnosticSummaries, taskWorkbench }) {
  const actions = [];

  function pushAction(priority, domain, source, recommendedNextAction, reason) {
    if (!recommendedNextAction) {
      return;
    }

    actions.push({
      priority,
      domain,
      source,
      recommended_next_action: recommendedNextAction,
      reason
    });
  }

  pushAction(
    "high",
    "task3",
    "/integrations/alibaba/wika/workbench/product-draft-workbench",
    taskWorkbench.task3_summary?.recommended_next_action,
    "Task 3 still stays at safe draft preparation and manual field completion."
  );
  pushAction(
    "high",
    "task4",
    "/integrations/alibaba/wika/workbench/reply-workbench",
    taskWorkbench.task4_summary?.recommended_next_action,
    "Task 4 still requires external reply draft handoff and manual send."
  );
  pushAction(
    "high",
    "task5",
    "/integrations/alibaba/wika/workbench/order-workbench",
    taskWorkbench.task5_summary?.recommended_next_action,
    "Task 5 still requires external order draft handoff and manual commercial confirmation."
  );

  pushAction(
    "medium",
    "store",
    "/integrations/alibaba/wika/reports/operations/minimal-diagnostic",
    diagnosticSummaries.store.top_recommendations?.[0],
    "Store diagnostic remains the shortest read-side signal path for task1/task2 follow-up."
  );
  pushAction(
    "medium",
    "product",
    "/integrations/alibaba/wika/reports/products/minimal-diagnostic",
    diagnosticSummaries.product.top_recommendations?.[0],
    "Product diagnostic and comparison stay the main consumer layer for task1/task2."
  );
  pushAction(
    "medium",
    "order",
    "/integrations/alibaba/wika/reports/orders/minimal-diagnostic",
    diagnosticSummaries.order.top_recommendations?.[0],
    "Order diagnostic remains derived and partial, so manual review stays necessary."
  );

  return actions.slice(0, 8);
}

export async function buildActionCenter(clientConfig, query = {}, preloaded = {}) {
  const crossSectionGaps = buildCrossSectionGaps();

  const [
    storeDiagnosticResult,
    productDiagnosticResult,
    orderDiagnosticResult,
    storeComparisonResult,
    productComparisonResult,
    orderComparisonResult,
    taskWorkbenchResult
  ] = await Promise.all([
    loadSectionWithBudget({
      section: "store_diagnostic",
      budgetMs: STORE_DIAGNOSTIC_BUDGET_MS,
      loader: async () =>
        preloaded.storeDiagnostic ??
        summarizeDiagnosticSection(
          normalizeStoreDiagnostic(
            await fetchWikaMinimalDiagnostic(clientConfig, query)
          )
        ),
      fallbackValue: (meta) => buildDiagnosticFallback("operations", meta)
    }),
    loadSectionWithBudget({
      section: "product_diagnostic",
      budgetMs: PRODUCT_DIAGNOSTIC_BUDGET_MS,
      loader: async () =>
        preloaded.productDiagnostic ??
        summarizeDiagnosticSection(
          normalizeProductDiagnostic(
            await fetchWikaProductMinimalDiagnostic(clientConfig, query)
          )
        ),
      fallbackValue: (meta) => buildDiagnosticFallback("products", meta)
    }),
    loadSectionWithBudget({
      section: "order_diagnostic",
      budgetMs: ORDER_DIAGNOSTIC_BUDGET_MS,
      loader: async () =>
        preloaded.orderDiagnostic ??
        summarizeDiagnosticSection(
          normalizeOrderDiagnostic(
            await fetchWikaOrderMinimalDiagnostic(clientConfig, query)
          )
        ),
      fallbackValue: (meta) => buildDiagnosticFallback("orders", meta)
    }),
    loadSectionWithBudget({
      section: "store_comparison",
      budgetMs: STORE_COMPARISON_BUDGET_MS,
      loader: async () =>
        preloaded.storeComparison ??
        summarizeComparisonSection(
          await buildOperationsComparisonSummary(clientConfig, query)
        ),
      fallbackValue: (meta) => buildComparisonFallback("operations", meta)
    }),
    loadSectionWithBudget({
      section: "product_comparison",
      budgetMs: PRODUCT_COMPARISON_BUDGET_MS,
      loader: async () =>
        preloaded.productComparison ??
        summarizeComparisonSection(
          await buildProductsComparisonSummary(clientConfig, query)
        ),
      fallbackValue: (meta) => buildComparisonFallback("products", meta)
    }),
    loadSectionWithBudget({
      section: "order_comparison",
      budgetMs: ORDER_COMPARISON_BUDGET_MS,
      loader: async () =>
        preloaded.orderComparison ??
        summarizeComparisonSection(await buildOrdersComparisonSummary(clientConfig, query)),
      fallbackValue: (meta) => buildComparisonFallback("orders", meta)
    }),
    loadSectionWithBudget({
      section: "task_workbench",
      budgetMs: TASK_WORKBENCH_BUDGET_MS,
      loader: async () => preloaded.taskWorkbench ?? buildTaskWorkbench(clientConfig, query),
      fallbackValue: buildTaskWorkbenchFallback
    })
  ]);

  const degradedSections = [
    storeDiagnosticResult.degradedSection,
    productDiagnosticResult.degradedSection,
    orderDiagnosticResult.degradedSection,
    storeComparisonResult.degradedSection,
    productComparisonResult.degradedSection,
    orderComparisonResult.degradedSection,
    taskWorkbenchResult.degradedSection
  ].filter(Boolean);

  const diagnosticSignalSummary = {
    store: storeDiagnosticResult.value,
    product: productDiagnosticResult.value,
    order: orderDiagnosticResult.value
  };
  const comparisonSignalSummary = {
    store: storeComparisonResult.value,
    product: productComparisonResult.value,
    order: orderComparisonResult.value
  };
  const taskWorkbench = taskWorkbenchResult.value;

  return {
    report_name: "action_center",
    generated_at: new Date().toISOString(),
    business_cockpit_summary: {
      source_route: "/integrations/alibaba/wika/reports/business-cockpit",
      task_coverage_summary: buildTaskCoverageSummary(),
      combined_gap_count: crossSectionGaps.combined_unavailable_dimensions.length
    },
    diagnostic_signal_summary: diagnosticSignalSummary,
    comparison_signal_summary: comparisonSignalSummary,
    task3_summary: summarizeWorkbenchSection(
      taskWorkbench.task3_summary,
      "product_draft_workbench"
    ),
    task4_summary: summarizeWorkbenchSection(
      taskWorkbench.task4_summary,
      "reply_workbench"
    ),
    task5_summary: summarizeWorkbenchSection(
      taskWorkbench.task5_summary,
      "order_workbench"
    ),
    prioritized_actions: buildPrioritizedActions({
      diagnosticSummaries: diagnosticSignalSummary,
      taskWorkbench
    }),
    shared_blockers: unique([
      ...(crossSectionGaps.combined_unavailable_dimensions ?? []),
      ...(taskWorkbench.shared_blockers ?? []),
      ...degradedSections.map((section) => `${section.section}:${section.reason}`)
    ]),
    partial_status: buildPartialStatus(degradedSections),
    degraded_sections: degradedSections,
    boundary_statement: {
      action_center_only: true,
      current_official_mainline_plus_derived_layers_only: true,
      not_platform_execution: true,
      degraded_response_supported: true,
      task6_excluded: true,
      no_write_action_attempted: true
    }
  };
}
