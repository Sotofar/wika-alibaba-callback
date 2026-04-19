import { buildPartialStatus, loadSectionWithBudget } from "../common/aggregate-runtime.js";
import { buildPreviewReadinessSummary } from "../workbench/preview-center.js";
import { buildTaskWorkbench } from "../workbench/task-workbench.js";
import { buildActionCenter } from "./action-center.js";
import { buildCrossSectionGaps } from "./cockpit-gaps.js";
import {
  buildBusinessCockpitBoundaryStatement,
  buildTaskCoverageSummary
} from "./business-cockpit-normalizers.js";

const TASK_WORKBENCH_BUDGET_MS = 9000;
const ACTION_CENTER_BUDGET_MS = 8000;

function unique(values = []) {
  return [...new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))];
}

function summarizeTask3(section = {}) {
  return {
    source_route: "/integrations/alibaba/wika/workbench/product-draft-workbench",
    report_name: section.report_name ?? "product_draft_workbench",
    draft_readiness: section.draft_readiness ?? null,
    required_manual_fields_count: Array.isArray(section.required_manual_fields)
      ? section.required_manual_fields.length
      : 0,
    blocking_risk_count: Array.isArray(section.blocking_risks)
      ? section.blocking_risks.length
      : 0,
    recommended_next_action: section.recommended_next_action ?? null,
    boundary_statement: section.boundary_statement ?? null
  };
}

function summarizeTask4(section = {}) {
  const hardBlockerCount = Array.isArray(
    section.blocker_taxonomy_summary?.hard_blocker_codes
  )
    ? section.blocker_taxonomy_summary.hard_blocker_codes.length
    : 0;

  return {
    source_route: "/integrations/alibaba/wika/workbench/reply-workbench",
    report_name: section.report_name ?? "reply_workbench",
    current_reply_profiles: section.current_reply_profiles ?? [],
    hard_blocker_count: hardBlockerCount,
    handoff_pack_capability: section.handoff_pack_capability ?? null,
    sample_availability: section.sample_availability ?? null,
    recommended_next_action: section.recommended_next_action ?? null,
    boundary_statement: section.boundary_statement ?? null
  };
}

function summarizeTask5(section = {}) {
  const hardBlockerCount = Array.isArray(
    section.blocker_taxonomy_summary?.hard_blocker_codes
  )
    ? section.blocker_taxonomy_summary.hard_blocker_codes.length
    : 0;

  return {
    source_route: "/integrations/alibaba/wika/workbench/order-workbench",
    report_name: section.report_name ?? "order_workbench",
    current_order_profiles: section.current_order_profiles ?? [],
    hard_blocker_count: hardBlockerCount,
    handoff_pack_capability: section.handoff_pack_capability ?? null,
    sample_availability: section.sample_availability ?? null,
    recommended_next_action: section.recommended_next_action ?? null,
    boundary_statement: section.boundary_statement ?? null
  };
}

function summarizeActionCenter(section = {}) {
  return {
    source_route: "/integrations/alibaba/wika/reports/action-center",
    report_name: section.report_name ?? "action_center",
    prioritized_action_count: Array.isArray(section.prioritized_actions)
      ? section.prioritized_actions.length
      : 0,
    next_best_actions: Array.isArray(section.prioritized_actions)
      ? section.prioritized_actions.slice(0, 5)
      : [],
    shared_blocker_count: Array.isArray(section.shared_blockers)
      ? section.shared_blockers.length
      : 0,
    partial_status: section.partial_status ?? null,
    degraded_sections: section.degraded_sections ?? [],
    boundary_statement: section.boundary_statement ?? null
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

function buildActionCenterFallback(meta) {
  return {
    report_name: "action_center",
    prioritized_actions: [],
    shared_blockers: [`action_center:${meta.reason}`],
    partial_status: buildPartialStatus([meta]),
    degraded_sections: [meta],
    boundary_statement: {
      action_center_only: true,
      degraded_response_supported: true,
      task6_excluded: true,
      no_write_action_attempted: true
    }
  };
}

function buildBusinessCockpitSummary() {
  const crossSectionGaps = buildCrossSectionGaps();

  return {
    source_route: "/integrations/alibaba/wika/reports/business-cockpit",
    report_name: "business_cockpit",
    task_coverage_summary: buildTaskCoverageSummary(),
    cross_section_gap_count: crossSectionGaps.combined_unavailable_dimensions.length,
    boundary_statement: buildBusinessCockpitBoundaryStatement()
  };
}

export async function buildOperatorConsole(
  clientConfig,
  query = {},
  preloaded = {}
) {
  const businessCockpitSummary = buildBusinessCockpitSummary();
  const previewReadiness =
    preloaded.previewReadiness ?? buildPreviewReadinessSummary({});

  const taskWorkbenchResult = await loadSectionWithBudget({
    section: "task_workbench",
    budgetMs: TASK_WORKBENCH_BUDGET_MS,
    loader: async () => preloaded.taskWorkbench ?? buildTaskWorkbench(clientConfig, query),
    fallbackValue: buildTaskWorkbenchFallback
  });
  const taskWorkbench = taskWorkbenchResult.value;

  const actionCenterResult = await loadSectionWithBudget({
    section: "action_center",
    budgetMs: ACTION_CENTER_BUDGET_MS,
    loader: async () =>
      preloaded.actionCenter ??
      buildActionCenter(clientConfig, query, {
        taskWorkbench
      }),
    fallbackValue: buildActionCenterFallback
  });
  const actionCenter = actionCenterResult.value;

  const degradedSections = [
    taskWorkbenchResult.degradedSection,
    actionCenterResult.degradedSection
  ].filter(Boolean);

  return {
    report_name: "operator_console",
    generated_at: new Date().toISOString(),
    business_cockpit_summary: businessCockpitSummary,
    action_center_summary: summarizeActionCenter(actionCenter),
    task3_summary: summarizeTask3(taskWorkbench.task3_summary),
    task4_summary: summarizeTask4(taskWorkbench.task4_summary),
    task5_summary: summarizeTask5(taskWorkbench.task5_summary),
    preview_readiness: {
      source_route: "/integrations/alibaba/wika/workbench/preview-center",
      ...previewReadiness
    },
    shared_blockers: unique([
      ...(actionCenter.shared_blockers ?? []),
      ...(taskWorkbench.shared_blockers ?? []),
      ...(buildCrossSectionGaps().combined_unavailable_dimensions ?? []),
      ...degradedSections.map((section) => `${section.section}:${section.reason}`)
    ]),
    next_best_actions: Array.isArray(actionCenter.prioritized_actions)
      ? actionCenter.prioritized_actions.slice(0, 5)
      : [],
    partial_status: buildPartialStatus(degradedSections),
    degraded_sections: degradedSections,
    boundary_statement: {
      operator_console_only: true,
      current_official_mainline_plus_derived_layers_only: true,
      task1_to_task5_consumption_layer_only: true,
      not_platform_internal_execution: true,
      degraded_response_supported: true,
      task6_excluded: true,
      no_write_action_attempted: true,
      not_full_business_cockpit: true
    }
  };
}
