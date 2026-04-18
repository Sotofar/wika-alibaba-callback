import { buildProductDraftWorkbench } from "./product-draft-workbench.js";
import { buildReplyWorkbench } from "./reply-workbench.js";
import { buildOrderWorkbench } from "./order-workbench.js";
import {
  buildPartialStatus,
  loadSectionWithBudget
} from "../common/aggregate-runtime.js";

function unique(values = []) {
  return [...new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))];
}

const TASK3_BUDGET_MS = 12000;
const TASK4_BUDGET_MS = 9000;
const TASK5_BUDGET_MS = 9000;

function buildTask3DegradedSummary(meta) {
  return {
    report_name: "product_draft_workbench",
    generated_at: new Date().toISOString(),
    draft_readiness: {
      stage: "degraded_read_only",
      safe_draft_preparation_available: true,
      ready_for_publish: false,
      ready_for_safe_draft_candidate: false,
      missing_requirement_count: null
    },
    required_manual_fields: {
      missing_requirements: [],
      human_required_fields: [],
      required_attribute_ids: []
    },
    blocking_risks: [`task3_summary_${meta.reason}`],
    recommended_next_action:
      "Task3 summary is temporarily degraded. Retry the product draft workbench after the read-side builder recovers, and keep all work in safe draft preparation only.",
    partial_status: meta,
    boundary_statement: {
      safe_draft_preparation_only: true,
      not_platform_publish: true,
      not_write_side_closed_loop: true,
      degraded_read_only_summary: true
    }
  };
}

function buildTask4DegradedSummary(meta) {
  return {
    report_name: "reply_workbench",
    generated_at: new Date().toISOString(),
    workflow_capability: {
      workflow_type: "external_reply_draft",
      external_only: true,
      platform_reply_available: false
    },
    blocker_taxonomy_summary: {
      preview_profile: null,
      hard_blocker_codes: [`task4_summary_${meta.reason}`],
      soft_blocker_codes: [],
      missing_context: []
    },
    handoff_pack_capability: {
      handoff_checklist_available: false,
      handoff_fields_available: false,
      manual_completion_sop_available: true,
      export_formats: ["json", "markdown"]
    },
    quality_gate_summary: {
      handoff_required: true,
      draft_usable_externally: false,
      alert_payload_available: false,
      follow_up_question_count: 0
    },
    sample_availability: {
      preview_generated_without_platform_send: false,
      product_diagnostic_sample_size: null,
      product_context_count: null
    },
    recommended_next_action:
      "Task4 summary is temporarily degraded. Retry the reply workbench after the read-side builder recovers, and keep the workflow in external draft handoff only.",
    partial_status: meta,
    boundary_statement: {
      external_reply_draft_only: true,
      not_platform_reply: true,
      not_platform_internal_send: true,
      degraded_read_only_summary: true,
      task6_excluded: true
    }
  };
}

function buildTask5DegradedSummary(meta) {
  return {
    report_name: "order_workbench",
    generated_at: new Date().toISOString(),
    workflow_capability: {
      workflow_type: "external_order_draft_package",
      external_only: true,
      platform_order_available: false
    },
    blocker_taxonomy_summary: {
      preview_profile: null,
      hard_blocker_codes: [`task5_summary_${meta.reason}`],
      soft_blocker_codes: [],
      missing_context: []
    },
    handoff_pack_capability: {
      handoff_checklist_available: false,
      handoff_fields_available: false,
      manual_completion_sop_available: true,
      export_formats: ["json", "markdown"]
    },
    quality_gate_summary: {
      handoff_required: true,
      draft_usable_externally: false,
      alert_payload_available: false,
      follow_up_question_count: 0
    },
    sample_availability: {
      order_diagnostic_snapshot_available: false,
      line_item_count: 0,
      draft_types: []
    },
    recommended_next_action:
      "Task5 summary is temporarily degraded. Retry the order workbench after the read-side builder recovers, and keep the workflow in external draft handoff only.",
    partial_status: meta,
    boundary_statement: {
      external_order_draft_only: true,
      not_platform_order_create: true,
      not_platform_internal_create: true,
      degraded_read_only_summary: true,
      task6_excluded: true
    }
  };
}

export async function buildTaskWorkbench(clientConfig, query = {}, preloaded = {}) {
  const [task3Result, task4Result, task5Result] = await Promise.all([
    loadSectionWithBudget({
      section: "task3_summary",
      budgetMs: TASK3_BUDGET_MS,
      loader: () =>
        preloaded.task3Summary ?? buildProductDraftWorkbench(clientConfig, query),
      fallbackValue: buildTask3DegradedSummary
    }),
    loadSectionWithBudget({
      section: "task4_summary",
      budgetMs: TASK4_BUDGET_MS,
      loader: () =>
        preloaded.task4Summary ?? buildReplyWorkbench(clientConfig, query),
      fallbackValue: buildTask4DegradedSummary
    }),
    loadSectionWithBudget({
      section: "task5_summary",
      budgetMs: TASK5_BUDGET_MS,
      loader: () =>
        preloaded.task5Summary ?? buildOrderWorkbench(clientConfig, query),
      fallbackValue: buildTask5DegradedSummary
    })
  ]);

  const task3Summary = task3Result.value;
  const task4Summary = task4Result.value;
  const task5Summary = task5Result.value;
  const degradedSections = [
    task3Result.degradedSection,
    task4Result.degradedSection,
    task5Result.degradedSection
  ].filter(Boolean);

  return {
    report_name: "task_workbench",
    generated_at: new Date().toISOString(),
    task3_summary: task3Summary,
    task4_summary: task4Summary,
    task5_summary: task5Summary,
    shared_blockers: unique([
      ...(task3Summary.blocking_risks ?? []),
      ...(task4Summary.blocker_taxonomy_summary?.hard_blocker_codes ?? []),
      ...(task4Summary.blocker_taxonomy_summary?.soft_blocker_codes ?? []),
      ...(task5Summary.blocker_taxonomy_summary?.hard_blocker_codes ?? []),
      ...(task5Summary.blocker_taxonomy_summary?.soft_blocker_codes ?? []),
      ...degradedSections.map((section) => `${section.section}:${section.reason}`)
    ]),
    shared_handoff_rules: [
      "All task3/4/5 workbenches only produce external drafts or safe draft preparation outputs and do not trigger platform write actions.",
      "If a hard blocker exists, key manual fields are missing, or low-risk boundaries are unproven, the workflow must hand off to manual review.",
      "Task 6 notification provider and real delivery capability are out of scope for this round."
    ],
    partial_status: buildPartialStatus(degradedSections),
    degraded_sections: degradedSections,
    boundary_statement: {
      task3_safe_draft_only: true,
      task4_external_reply_only: true,
      task5_external_order_only: true,
      task3_task4_task5_workbench_only: true,
      not_platform_internal_execution: true,
      degraded_response_supported: true,
      task6_excluded: true,
      no_write_action_attempted: true
    }
  };
}
