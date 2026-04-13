import { buildBusinessCockpit } from "./business-cockpit.js";
import { buildTaskWorkbench } from "../workbench/task-workbench.js";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function unique(values = []) {
  return [...new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))];
}

function summarizeDiagnosticSection(section = {}) {
  return {
    source_route: section.source_route ?? null,
    report_name: section.report_name ?? null,
    finding_count: Array.isArray(section.diagnostic_findings)
      ? section.diagnostic_findings.length
      : 0,
    recommendation_count: Array.isArray(section.recommendations)
      ? section.recommendations.length
      : 0,
    top_findings: Array.isArray(section.diagnostic_findings)
      ? section.diagnostic_findings.slice(0, 3)
      : [],
    confidence_hints: section.confidence_hints ?? null,
    unavailable_dimensions_echo: section.unavailable_dimensions_echo ?? []
  };
}

function summarizeComparisonSection(section = {}) {
  return {
    source_route: section.source_route ?? null,
    report_name: section.report_name ?? null,
    current_window: section.current_window ?? null,
    previous_window: section.previous_window ?? null,
    trend_direction:
      section.derived_comparison?.trend_direction ??
      section.derived_comparison?.summary?.trend_direction ??
      null,
    primary_deltas:
      section.derived_comparison?.metric_deltas ??
      section.derived_comparison?.delta_summary ??
      null,
    unavailable_dimensions: section.unavailable_dimensions ?? []
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

function buildPrioritizedActions({ cockpit, taskWorkbench }) {
  const actions = [];
  const pushAction = (priority, domain, source, recommended_next_action, reason) => {
    if (!recommended_next_action) {
      return;
    }

    actions.push({
      priority,
      domain,
      source,
      recommended_next_action,
      reason
    });
  };

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

  const storeRecommendation = Array.isArray(cockpit.store_diagnostic?.recommendations)
    ? cockpit.store_diagnostic.recommendations[0]
    : null;
  const productRecommendation = Array.isArray(cockpit.product_diagnostic?.recommendations)
    ? cockpit.product_diagnostic.recommendations[0]
    : null;
  const orderRecommendation = Array.isArray(cockpit.order_diagnostic?.recommendations)
    ? cockpit.order_diagnostic.recommendations[0]
    : null;

  pushAction(
    "medium",
    "store",
    "/integrations/alibaba/wika/reports/operations/minimal-diagnostic",
    storeRecommendation,
    "Store diagnostic remains the shortest read-side signal path for task1/task2 follow-up."
  );
  pushAction(
    "medium",
    "product",
    "/integrations/alibaba/wika/reports/products/minimal-diagnostic",
    productRecommendation,
    "Product diagnostic and comparison stay the main consumer layer for task1/task2."
  );
  pushAction(
    "medium",
    "order",
    "/integrations/alibaba/wika/reports/orders/minimal-diagnostic",
    orderRecommendation,
    "Order diagnostic remains derived and partial, so manual review stays necessary."
  );

  return actions.slice(0, 8);
}

export async function buildActionCenter(clientConfig, query = {}, preloaded = {}) {
  const businessCockpit =
    preloaded.businessCockpit ?? (await buildBusinessCockpit(clientConfig, query));
  if (!preloaded.businessCockpit && !preloaded.taskWorkbench) {
    await sleep(1200);
  }

  const taskWorkbench =
    preloaded.taskWorkbench ?? (await buildTaskWorkbench(clientConfig, query));

  return {
    report_name: "action_center",
    generated_at: new Date().toISOString(),
    business_cockpit_summary: {
      source_route: "/integrations/alibaba/wika/reports/business-cockpit",
      task_coverage_summary: businessCockpit.task_coverage_summary ?? null,
      combined_gap_count:
        businessCockpit.cross_section_gaps?.combined_unavailable_dimensions?.length ?? 0
    },
    diagnostic_signal_summary: {
      store: summarizeDiagnosticSection(businessCockpit.store_diagnostic),
      product: summarizeDiagnosticSection(businessCockpit.product_diagnostic),
      order: summarizeDiagnosticSection(businessCockpit.order_diagnostic)
    },
    comparison_signal_summary: {
      store: summarizeComparisonSection(businessCockpit.store_comparison),
      product: summarizeComparisonSection(businessCockpit.product_comparison),
      order: summarizeComparisonSection(businessCockpit.order_comparison)
    },
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
      cockpit: businessCockpit,
      taskWorkbench
    }),
    shared_blockers: unique([
      ...(businessCockpit.cross_section_gaps?.combined_unavailable_dimensions ?? []),
      ...(taskWorkbench.shared_blockers ?? [])
    ]),
    boundary_statement: {
      action_center_only: true,
      current_official_mainline_plus_derived_layers_only: true,
      not_platform_execution: true,
      task6_excluded: true,
      no_write_action_attempted: true
    }
  };
}
