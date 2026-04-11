export function buildTaskCoverageSummary() {
  return {
    task1_partial_status: {
      status: "partially_reopened",
      complete: false,
      note: "Store, product, and order read-side summaries are available, but several key business dimensions are still missing."
    },
    task2_partial_status: {
      status: "partially_reopened",
      complete: false,
      note: "Minimal diagnostic and comparison layers are available, but this is still not a full business diagnostic cockpit."
    },
    task3_partial_status: {
      status: "partially_reopened",
      complete: false,
      note: "A product safe-draft workbench candidate exists, but it stays at safe draft preparation and does not publish."
    },
    task4_partial_status: {
      status: "partially_reopened",
      complete: false,
      note: "A reply-draft external workbench candidate exists, but it does not send platform replies."
    },
    task5_partial_status: {
      status: "partially_reopened",
      complete: false,
      note: "An order-draft external workbench candidate exists, but it does not create platform orders."
    },
    task6_excluded: true
  };
}

export function buildBusinessCockpitBoundaryStatement() {
  return {
    current_official_mainline_plus_derived_layers_only: true,
    not_full_business_cockpit: true,
    not_task_1_complete: true,
    not_task_2_complete: true,
    not_task_3_complete: true,
    not_task_4_complete: true,
    not_task_5_complete: true,
    task_6_excluded: true,
    no_write_action_attempted: true,
    notes: [
      "This cockpit only aggregates the currently shipped management summary, minimal diagnostic, and comparison layers.",
      "Comparison outputs and order formal_summary / product_contribution / trend_signal remain derived outputs.",
      "Unavailable dimensions stay explicitly visible and are not presented as covered capabilities."
    ]
  };
}

function normalizeDiagnosticCommon(result = {}, sourceRoute) {
  return {
    source_route: sourceRoute,
    report_name: result.report_name ?? result.report_type ?? null,
    generated_at: result.generated_at ?? null,
    diagnostic_findings: Array.isArray(result.diagnostic_findings)
      ? result.diagnostic_findings
      : [],
    recommendations: result.recommendations ?? result.recommendation_block ?? [],
    boundary_statement: result.boundary_statement ?? null
  };
}

export function normalizeStoreDiagnostic(result = {}) {
  return {
    ...normalizeDiagnosticCommon(
      result,
      "/integrations/alibaba/wika/reports/operations/minimal-diagnostic"
    ),
    traffic_performance_section: result.traffic_performance_section ?? null,
    unavailable_dimensions_echo:
      result.unavailable_dimensions_echo ?? result.missing_data_blockers ?? [],
    confidence_hints: result.confidence_hints ?? result.limitations ?? null
  };
}

export function normalizeProductDiagnostic(result = {}) {
  return {
    ...normalizeDiagnosticCommon(
      result,
      "/integrations/alibaba/wika/reports/products/minimal-diagnostic"
    ),
    performance_section: result.performance_section ?? null,
    unavailable_dimensions_echo:
      result.unavailable_dimensions_echo ?? result.missing_data_blockers ?? [],
    confidence_hints: result.confidence_hints ?? result.limitations ?? null
  };
}

export function normalizeOrderDiagnostic(result = {}) {
  return {
    ...normalizeDiagnosticCommon(
      result,
      "/integrations/alibaba/wika/reports/orders/minimal-diagnostic"
    ),
    formal_summary_section: result.formal_summary_section ?? null,
    product_contribution_section: result.product_contribution_section ?? null,
    trend_signal_section: result.trend_signal_section ?? null,
    unavailable_dimensions_echo:
      result.unavailable_dimensions_echo ?? result.missing_data_blockers ?? [],
    confidence_hints: result.confidence_hints ?? result.limitations ?? null
  };
}

export function withSourceRoute(result = {}, sourceRoute) {
  return {
    source_route: sourceRoute,
    ...result
  };
}
