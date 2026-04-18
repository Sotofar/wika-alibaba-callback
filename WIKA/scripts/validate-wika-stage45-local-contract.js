import { buildActionCenter } from "../projects/wika/data/cockpit/action-center.js";
import { buildOperatorConsole } from "../projects/wika/data/cockpit/operator-console.js";
import { buildPreviewCenter } from "../projects/wika/data/workbench/preview-center.js";
import { buildTaskWorkbench } from "../projects/wika/data/workbench/task-workbench.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function buildMockTaskWorkbench() {
  return {
    report_name: "task_workbench",
    task3_summary: {
      report_name: "product_draft_workbench",
      draft_readiness: {
        stage: "safe_draft_preparation",
        safe_draft_preparation_available: true
      },
      required_manual_fields: ["subject", "main_image"],
      blocking_risks: ["missing_main_image"],
      recommended_next_action: "Complete product draft inputs before manual publish.",
      boundary_statement: {
        safe_draft_preparation_only: true
      }
    },
    task4_summary: {
      report_name: "reply_workbench",
      current_reply_profiles: ["quotation_follow_up"],
      blocker_taxonomy_summary: {
        hard_blocker_codes: ["manual_confirmation_required"],
        soft_blocker_codes: []
      },
      handoff_pack_capability: {
        manual_completion_sop_available: true
      },
      sample_availability: {
        preview_generated_without_platform_send: true
      },
      recommended_next_action: "Review reply draft manually before sending externally.",
      boundary_statement: {
        external_reply_draft_only: true
      }
    },
    task5_summary: {
      report_name: "order_workbench",
      current_order_profiles: ["sample_quote_order"],
      blocker_taxonomy_summary: {
        hard_blocker_codes: ["manual_price_confirmation_required"],
        soft_blocker_codes: []
      },
      handoff_pack_capability: {
        manual_completion_sop_available: true
      },
      sample_availability: {
        order_diagnostic_snapshot_available: true
      },
      recommended_next_action: "Review order draft manually before any external create action.",
      boundary_statement: {
        external_order_draft_only: true
      }
    },
    shared_blockers: ["manual_confirmation_required"],
    shared_handoff_rules: ["manual_review_required"],
    partial_status: {
      mode: "full_success",
      complete: true,
      degraded_section_count: 0
    },
    degraded_sections: [],
    boundary_statement: {
      task3_task4_task5_workbench_only: true
    }
  };
}

function buildMockDiagnostic(route, reportName) {
  return {
    source_route: route,
    report_name: reportName,
    finding_count: 1,
    recommendation_count: 1,
    top_findings: ["sample_finding"],
    top_recommendations: ["sample_recommendation"],
    confidence_hints: {
      degraded: false
    },
    unavailable_dimensions_echo: []
  };
}

function buildMockComparison(route, reportName) {
  return {
    source_route: route,
    report_name: reportName,
    current_window: { start: "2026-04-01", end: "2026-04-07" },
    previous_window: { start: "2026-03-25", end: "2026-03-31" },
    trend_direction: "mixed",
    primary_deltas: {
      sample_metric: {
        delta_value: 1
      }
    },
    unavailable_dimensions: []
  };
}

const taskWorkbench = await buildTaskWorkbench(
  null,
  {},
  {
    task3Summary: buildMockTaskWorkbench().task3_summary,
    task4Summary: buildMockTaskWorkbench().task4_summary,
    task5Summary: buildMockTaskWorkbench().task5_summary
  }
);

assert(taskWorkbench.report_name === "task_workbench", "task_workbench report_name mismatch");
assert(taskWorkbench.partial_status.mode === "full_success", "task_workbench partial_status mismatch");
assert(Array.isArray(taskWorkbench.shared_handoff_rules), "task_workbench shared_handoff_rules missing");

const actionCenter = await buildActionCenter(
  null,
  {},
  {
    taskWorkbench,
    storeDiagnostic: buildMockDiagnostic(
      "/integrations/alibaba/wika/reports/operations/minimal-diagnostic",
      "operations_minimal_diagnostic"
    ),
    productDiagnostic: buildMockDiagnostic(
      "/integrations/alibaba/wika/reports/products/minimal-diagnostic",
      "products_minimal_diagnostic"
    ),
    orderDiagnostic: buildMockDiagnostic(
      "/integrations/alibaba/wika/reports/orders/minimal-diagnostic",
      "orders_minimal_diagnostic"
    ),
    storeComparison: buildMockComparison(
      "/integrations/alibaba/wika/reports/operations/comparison-summary",
      "operations_comparison_summary"
    ),
    productComparison: buildMockComparison(
      "/integrations/alibaba/wika/reports/products/comparison-summary",
      "products_comparison_summary"
    ),
    orderComparison: buildMockComparison(
      "/integrations/alibaba/wika/reports/orders/comparison-summary",
      "orders_comparison_summary"
    )
  }
);

assert(actionCenter.report_name === "action_center", "action_center report_name mismatch");
assert(actionCenter.business_cockpit_summary, "action_center missing business_cockpit_summary");
assert(actionCenter.diagnostic_signal_summary?.store, "action_center missing store diagnostic summary");
assert(actionCenter.comparison_signal_summary?.product, "action_center missing product comparison summary");
assert(Array.isArray(actionCenter.prioritized_actions), "action_center missing prioritized_actions");
assert(actionCenter.boundary_statement?.degraded_response_supported === true, "action_center missing degraded boundary");

const previewCenter = await buildPreviewCenter(null, { summary_only: true });
assert(previewCenter.report_name === "preview_center", "preview_center report_name mismatch");
assert(previewCenter.task3_preview_summary, "preview_center missing task3_preview_summary");
assert(previewCenter.shared_readiness, "preview_center missing shared_readiness");
assert(Array.isArray(previewCenter.shared_handoff_rules), "preview_center missing shared_handoff_rules");
assert(previewCenter.boundary_statement?.preview_center_summary_only === true, "preview_center summary boundary mismatch");

const operatorConsole = await buildOperatorConsole(
  null,
  {},
  {
    taskWorkbench,
    actionCenter
  }
);

assert(operatorConsole.report_name === "operator_console", "operator_console report_name mismatch");
assert(operatorConsole.action_center_summary, "operator_console missing action_center_summary");
assert(operatorConsole.preview_readiness?.task3_preview_available === true, "operator_console preview readiness mismatch");
assert(Array.isArray(operatorConsole.next_best_actions), "operator_console missing next_best_actions");
assert(operatorConsole.boundary_statement?.degraded_response_supported === true, "operator_console missing degraded boundary");

console.log(
  JSON.stringify(
    {
      ok: true,
      contracts: {
        task_workbench: true,
        action_center: true,
        preview_center: true,
        operator_console: true
      }
    },
    null,
    2
  )
);
