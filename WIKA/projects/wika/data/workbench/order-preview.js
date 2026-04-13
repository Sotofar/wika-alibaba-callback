import { buildWikaExternalOrderDraftPackage } from "../../../../../shared/data/modules/alibaba-order-drafts.js";

export async function buildOrderPreview(clientConfig, input = {}, preloaded = {}) {
  const preview =
    preloaded.preview ?? (await buildWikaExternalOrderDraftPackage(clientConfig, input));

  return {
    report_name: "order_preview",
    generated_at: new Date().toISOString(),
    preview_input_summary: preview.input_summary ?? {},
    workflow_preview: {
      workflow_profile: preview.workflow_profile ?? null,
      template_version: preview.template_version ?? null,
      order_draft_package: preview.order_draft_package ?? null,
      required_manual_fields: preview.required_manual_fields ?? [],
      draft_usable_externally: preview.draft_usable_externally ?? false
    },
    available_context: preview.available_context ?? {},
    missing_context: preview.missing_context ?? [],
    hard_blockers: preview.hard_blockers ?? [],
    soft_blockers: preview.soft_blockers ?? [],
    follow_up_question_details: preview.follow_up_question_details ?? [],
    handoff_fields: preview.handoff_fields ?? [],
    quality_gate_summary: {
      handoff_required: preview.workflow_meta?.handoff_required ?? true,
      confidence: preview.workflow_meta?.confidence ?? null,
      risk_level: preview.workflow_meta?.risk_level ?? null
    },
    recommended_next_action:
      preview.escalation_recommendation?.recommendation ??
      "Keep this preview in the external order-draft workflow only and hand off to human review before any order attempt.",
    boundary_statement: {
      input_aware_preview_only: true,
      external_order_draft_only: true,
      not_platform_order_create: true,
      not_platform_internal_create: true,
      no_write_action_attempted: true,
      task6_excluded: true
    }
  };
}
