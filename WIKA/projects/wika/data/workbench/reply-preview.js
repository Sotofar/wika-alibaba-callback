import { buildWikaExternalReplyDraftPackage } from "../../../../../shared/data/modules/alibaba-external-reply-drafts.js";

export async function buildReplyPreview(clientConfig, input = {}, preloaded = {}) {
  const preview =
    preloaded.preview ?? (await buildWikaExternalReplyDraftPackage(clientConfig, input));

  return {
    report_name: "reply_preview",
    generated_at: new Date().toISOString(),
    preview_input_summary: preview.input_summary ?? {},
    workflow_preview: {
      workflow_profile: preview.workflow_profile ?? null,
      template_version: preview.template_version ?? null,
      reply_draft: preview.reply_draft ?? null,
      minimum_reply_package: preview.minimum_reply_package ?? null,
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
      "Keep this preview in the external reply-draft workflow only and hand off to human review before any send attempt.",
    boundary_statement: {
      input_aware_preview_only: true,
      external_reply_draft_only: true,
      not_platform_reply: true,
      not_platform_internal_send: true,
      no_write_action_attempted: true,
      task6_excluded: true
    }
  };
}
