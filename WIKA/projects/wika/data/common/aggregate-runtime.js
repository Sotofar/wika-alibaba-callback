function normalizeErrorMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error ?? "unknown_error");
}

export async function loadSectionWithBudget({
  section,
  loader,
  budgetMs,
  fallbackValue
}) {
  const outcome = await Promise.race([
    Promise.resolve()
      .then(loader)
      .then((value) => ({ status: "fulfilled", value }))
      .catch((error) => ({ status: "rejected", error })),
    new Promise((resolve) =>
      setTimeout(() => resolve({ status: "timeout" }), budgetMs)
    )
  ]);

  if (outcome.status === "fulfilled") {
    return {
      value: outcome.value,
      degradedSection: null
    };
  }

  const degradedSection = {
    section,
    reason:
      outcome.status === "timeout"
        ? "time_budget_exceeded"
        : "upstream_read_failure",
    budget_ms: budgetMs,
    error_message:
      outcome.status === "timeout"
        ? `section exceeded ${budgetMs}ms time budget`
        : normalizeErrorMessage(outcome.error)
  };

  return {
    value:
      typeof fallbackValue === "function"
        ? fallbackValue(degradedSection)
        : fallbackValue,
    degradedSection
  };
}

export function buildPartialStatus(degradedSections = []) {
  return {
    mode: degradedSections.length > 0 ? "degraded" : "full_success",
    complete: degradedSections.length === 0,
    degraded_section_count: degradedSections.length
  };
}
