import { buildWikaExternalReplyDraftPackage } from "../../../../../shared/data/modules/alibaba-external-reply-drafts.js";

const REPLY_PROFILE_SUMMARY = Object.freeze([
  {
    code: "reply_minimal_handoff",
    label: "Minimal handoff",
    note: "Use when only the inquiry text or very limited context is available for an external draft."
  },
  {
    code: "reply_quote_confirmation_needed",
    label: "Quote confirmation draft",
    note: "Use when product and customer context already exist, but quote and lead time still need human confirmation."
  },
  {
    code: "reply_mockup_customization",
    label: "Mockup customization draft",
    note: "Use when the reply depends on mockup, logo, or customization follow-up material."
  }
]);

function unique(values = []) {
  return [...new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))];
}

export async function buildReplyWorkbench(
  clientConfig,
  query = {},
  preloaded = {}
) {
  const preview =
    preloaded.preview ??
    (await buildWikaExternalReplyDraftPackage(clientConfig, {
      language: query.language ?? "zh-CN"
    }));

  return {
    report_name: "reply_workbench",
    generated_at: new Date().toISOString(),
    workflow_capability: {
      workflow_type: "external_reply_draft",
      external_only: true,
      platform_reply_available: false,
      preview_route: "/integrations/alibaba/wika/tools/reply-draft",
      template_version: preview.template_version ?? null
    },
    input_requirements: {
      required_minimum_fields: [
        "inquiry_text",
        "product_id or product_ids",
        "destination_country",
        "quantity",
        "customer_profile"
      ],
      optional_fields: ["target_price", "expected_lead_time", "mockup_request"],
      preview_mode: "POST body to /integrations/alibaba/wika/tools/reply-draft"
    },
    current_reply_profiles: REPLY_PROFILE_SUMMARY,
    blocker_taxonomy_summary: {
      preview_profile: preview.workflow_profile ?? null,
      hard_blocker_codes: unique(preview.hard_blockers?.map((item) => item.blocker_code)),
      soft_blocker_codes: unique(preview.soft_blockers?.map((item) => item.blocker_code)),
      missing_context: preview.missing_context ?? []
    },
    handoff_pack_capability: {
      handoff_checklist_available: Boolean(preview.handoff_checklist),
      handoff_fields_available: Array.isArray(preview.handoff_fields),
      manual_completion_sop_available: Boolean(preview.manual_completion_sop),
      export_formats: ["json", "markdown"]
    },
    quality_gate_summary: {
      handoff_required: preview.workflow_meta?.handoff_required ?? true,
      draft_usable_externally: preview.workflow_meta?.draft_usable_externally ?? false,
      alert_payload_available: Boolean(preview.alert_payload),
      follow_up_question_count: Array.isArray(preview.follow_up_questions)
        ? preview.follow_up_questions.length
        : 0
    },
    sample_availability: {
      preview_generated_without_platform_send: true,
      product_diagnostic_sample_size:
        preview.workflow_meta?.available_context?.product_diagnostic_sample_size ?? null,
      product_context_count:
        preview.workflow_meta?.available_context?.product_context_count ?? null
    },
    boundary_statement: {
      external_reply_draft_only: true,
      not_platform_reply: true,
      no_real_send_attempted: true,
      task6_excluded: true
    }
  };
}
