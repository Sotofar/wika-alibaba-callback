import { buildWikaExternalOrderDraftPackage } from "../../../../../shared/data/modules/alibaba-order-drafts.js";

const ORDER_PROFILE_SUMMARY = Object.freeze([
  {
    code: "order_minimal_handoff",
    label: "Minimal order handoff",
    note: "Use when only the basic buyer data and a small amount of line-item context are available for an external order draft."
  },
  {
    code: "order_quote_confirmation_needed",
    label: "Quote confirmation order draft",
    note: "Use when line items are available, but price, total amount, and lead time still need human confirmation."
  },
  {
    code: "order_commercial_review",
    label: "Commercial review order draft",
    note: "Use when the main commercial fields are present, but manual review is still required before any downstream handoff."
  }
]);

function unique(values = []) {
  return [...new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))];
}

export async function buildOrderWorkbench(
  clientConfig,
  query = {},
  preloaded = {}
) {
  const preview =
    preloaded.preview ?? (await buildWikaExternalOrderDraftPackage(clientConfig, {}));

  return {
    report_name: "order_workbench",
    generated_at: new Date().toISOString(),
    workflow_capability: {
      workflow_type: "external_order_draft_package",
      external_only: true,
      platform_order_available: false,
      preview_route: "/integrations/alibaba/wika/tools/order-draft",
      template_version: preview.template_version ?? null
    },
    input_requirements: {
      required_minimum_fields: [
        "buyer.company_name",
        "buyer.contact_name",
        "buyer.email",
        "line_items",
        "shipment_plan.destination_country"
      ],
      optional_fields: [
        "payment_terms.total_amount",
        "payment_terms.advance_amount",
        "shipment_plan.lead_time_text",
        "shipment_plan.trade_term",
        "shipment_plan.shipment_method"
      ],
      preview_mode: "POST body to /integrations/alibaba/wika/tools/order-draft"
    },
    current_order_profiles: ORDER_PROFILE_SUMMARY,
    required_manual_field_system: {
      required_manual_fields: preview.required_manual_fields ?? [],
      required_manual_field_details: preview.required_manual_field_details ?? []
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
      order_diagnostic_snapshot_available: Boolean(
        preview.supporting_context?.order_diagnostic_snapshot
      ),
      line_item_count: preview.workflow_meta?.available_context?.line_item_count ?? 0,
      draft_types: preview.workflow_meta?.available_context?.draft_types ?? []
    },
    blocker_taxonomy_summary: {
      preview_profile: preview.workflow_profile ?? null,
      hard_blocker_codes: unique(preview.hard_blockers?.map((item) => item.blocker_code)),
      soft_blocker_codes: unique(preview.soft_blockers?.map((item) => item.blocker_code)),
      missing_context: preview.missing_context ?? []
    },
    boundary_statement: {
      external_order_draft_only: true,
      not_platform_order_create: true,
      not_platform_internal_create: true,
      no_real_order_creation_attempted: true,
      task6_excluded: true
    }
  };
}
