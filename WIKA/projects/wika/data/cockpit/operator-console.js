import { buildBusinessCockpit } from "./business-cockpit.js";
import { buildActionCenter } from "./action-center.js";
import { buildTaskWorkbench } from "../workbench/task-workbench.js";
import { buildPreviewReadinessSummary } from "../workbench/preview-center.js";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

function summarizeBusinessCockpit(section = {}) {
  return {
    source_route: "/integrations/alibaba/wika/reports/business-cockpit",
    report_name: section.report_name ?? "business_cockpit",
    task_coverage_summary: section.task_coverage_summary ?? null,
    cross_section_gap_count:
      section.cross_section_gaps?.combined_unavailable_dimensions?.length ?? 0,
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
    boundary_statement: section.boundary_statement ?? null
  };
}

export async function buildOperatorConsole(
  clientConfig,
  query = {},
  preloaded = {}
) {
  const businessCockpit =
    preloaded.businessCockpit ?? (await buildBusinessCockpit(clientConfig, query));
  if (!preloaded.businessCockpit && !preloaded.taskWorkbench) {
    await sleep(1200);
  }

  const taskWorkbench =
    preloaded.taskWorkbench ?? (await buildTaskWorkbench(clientConfig, query));
  const actionCenter =
    preloaded.actionCenter ??
    (await buildActionCenter(clientConfig, query, {
      businessCockpit,
      taskWorkbench
    }));
  const previewReadiness =
    preloaded.previewReadiness ?? buildPreviewReadinessSummary({});

  return {
    report_name: "operator_console",
    generated_at: new Date().toISOString(),
    business_cockpit_summary: summarizeBusinessCockpit(businessCockpit),
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
      ...(businessCockpit.cross_section_gaps?.combined_unavailable_dimensions ?? [])
    ]),
    next_best_actions: Array.isArray(actionCenter.prioritized_actions)
      ? actionCenter.prioritized_actions.slice(0, 5)
      : [],
    boundary_statement: {
      operator_console_only: true,
      current_official_mainline_plus_derived_layers_only: true,
      task1_to_task5_consumption_layer_only: true,
      not_platform_internal_execution: true,
      task6_excluded: true,
      no_write_action_attempted: true,
      not_full_business_cockpit: true
    }
  };
}
