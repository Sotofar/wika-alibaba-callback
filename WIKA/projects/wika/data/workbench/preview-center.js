import { buildProductDraftPreview } from "./product-draft-preview.js";
import { buildReplyPreview } from "./reply-preview.js";
import { buildOrderPreview } from "./order-preview.js";

function unique(values = []) {
  return [...new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))];
}

function summarizeBlockers(preview) {
  return [
    ...(preview.blocking_risks ?? []),
    ...(preview.hard_blockers ?? []).map(
      (item) => item.blocker_code || item.code || item.key || item.requiredField
    ),
    ...(preview.soft_blockers ?? []).map(
      (item) => item.blocker_code || item.code || item.key || item.requiredField
    )
  ];
}

function buildSharedHandoffRules() {
  return [
    "Preview center only provides input-aware preview summaries and never triggers platform-internal publish, reply, or order-create actions.",
    "Task3/4/5 preview results must hand off to manual review whenever key manual fields, hard blockers, or incomplete business context remain.",
    "Task 6 notification provider and real outbound delivery capability remain excluded from this round."
  ];
}

function summarizeTask3Preview(preview = {}) {
  return {
    source_route: "/integrations/alibaba/wika/workbench/product-draft-preview",
    report_name: preview.report_name ?? "product_draft_preview",
    safe_draft_preparation_only: true,
    platform_internal_publish_available: false,
    required_manual_field_count:
      preview.required_manual_fields?.missing_requirements?.length ??
      preview.required_manual_fields?.human_required_fields?.length ??
      0,
    blocking_risk_count: Array.isArray(preview.blocking_risks)
      ? preview.blocking_risks.length
      : 0,
    recommended_next_action:
      preview.recommended_next_action ??
      "Submit product preview input, then complete missing manual fields before any manual publish action.",
    boundary_statement: preview.boundary_statement ?? null
  };
}

function summarizeTask4Preview(preview = {}) {
  return {
    source_route: "/integrations/alibaba/wika/workbench/reply-preview",
    report_name: preview.report_name ?? "reply_preview",
    external_reply_draft_only: true,
    platform_internal_send_available: false,
    hard_blocker_count: Array.isArray(preview.hard_blockers)
      ? preview.hard_blockers.length
      : 0,
    soft_blocker_count: Array.isArray(preview.soft_blockers)
      ? preview.soft_blockers.length
      : 0,
    recommended_next_action:
      preview.recommended_next_action ??
      "Submit reply preview input, then complete manual review before any external send decision.",
    boundary_statement: preview.boundary_statement ?? null
  };
}

function summarizeTask5Preview(preview = {}) {
  return {
    source_route: "/integrations/alibaba/wika/workbench/order-preview",
    report_name: preview.report_name ?? "order_preview",
    external_order_draft_only: true,
    platform_internal_create_available: false,
    hard_blocker_count: Array.isArray(preview.hard_blockers)
      ? preview.hard_blockers.length
      : 0,
    soft_blocker_count: Array.isArray(preview.soft_blockers)
      ? preview.soft_blockers.length
      : 0,
    recommended_next_action:
      preview.recommended_next_action ??
      "Submit order preview input, then complete manual commercial review before any external create decision.",
    boundary_statement: preview.boundary_statement ?? null
  };
}

function buildSummaryOnlyPreviewCenter() {
  const previewReadiness = buildPreviewReadinessSummary({});

  return {
    report_name: "preview_center",
    generated_at: new Date().toISOString(),
    task3_preview_summary: summarizeTask3Preview(),
    task4_preview_summary: summarizeTask4Preview(),
    task5_preview_summary: summarizeTask5Preview(),
    shared_readiness: previewReadiness,
    preview_readiness: previewReadiness,
    shared_blockers: ["preview_center_requires_post_input_payload_for_full_preview"],
    shared_handoff_rules: buildSharedHandoffRules(),
    boundary_statement: {
      input_aware_preview_only: true,
      preview_center_summary_only: true,
      not_platform_internal_execution: true,
      task6_excluded: true,
      no_write_action_attempted: true
    }
  };
}

export function buildPreviewReadinessSummary({
  productPreview,
  replyPreview,
  orderPreview
} = {}) {
  return {
    task3_preview_available: true,
    task4_preview_available: true,
    task5_preview_available: true,
    requires_input_payload: true,
    entrypoints: {
      task3: {
        route: "/integrations/alibaba/wika/workbench/product-draft-preview",
        method: "POST"
      },
      task4: {
        route: "/integrations/alibaba/wika/workbench/reply-preview",
        method: "POST"
      },
      task5: {
        route: "/integrations/alibaba/wika/workbench/order-preview",
        method: "POST"
      }
    },
    preview_profiles: {
      task3: productPreview?.report_name ?? "product_draft_preview",
      task4: replyPreview?.workflow_preview?.workflow_profile ?? null,
      task5: orderPreview?.workflow_preview?.workflow_profile ?? null
    },
    platform_internal_execution_available: false,
    task6_excluded: true
  };
}

export async function buildPreviewCenter(clientConfig, input = {}, preloaded = {}) {
  if (
    input.summary_only === true ||
    input.summaryOnly === true ||
    input.mode === "summary"
  ) {
    return buildSummaryOnlyPreviewCenter();
  }

  const productInput = input.product_preview_input ?? {};
  const replyInput = input.reply_preview_input ?? {};
  const orderInput = input.order_preview_input ?? {};

  const [productPreview, replyPreview, orderPreview] = await Promise.all([
    preloaded.productPreview ??
      buildProductDraftPreview(clientConfig, productInput, preloaded.product ?? {}),
    preloaded.replyPreview ??
      buildReplyPreview(clientConfig, replyInput, preloaded.reply ?? {}),
    preloaded.orderPreview ??
      buildOrderPreview(clientConfig, orderInput, preloaded.order ?? {})
  ]);

  const previewReadiness = buildPreviewReadinessSummary({
    productPreview,
    replyPreview,
    orderPreview
  });

  return {
    report_name: "preview_center",
    generated_at: new Date().toISOString(),
    product_preview: productPreview,
    reply_preview: replyPreview,
    order_preview: orderPreview,
    task3_preview_summary: summarizeTask3Preview(productPreview),
    task4_preview_summary: summarizeTask4Preview(replyPreview),
    task5_preview_summary: summarizeTask5Preview(orderPreview),
    shared_readiness: previewReadiness,
    preview_readiness: previewReadiness,
    shared_blockers: unique([
      ...summarizeBlockers(productPreview),
      ...summarizeBlockers(replyPreview),
      ...summarizeBlockers(orderPreview)
    ]),
    shared_handoff_rules: buildSharedHandoffRules(),
    boundary_statement: {
      input_aware_preview_only: true,
      not_platform_internal_execution: true,
      task6_excluded: true,
      no_write_action_attempted: true
    }
  };
}
