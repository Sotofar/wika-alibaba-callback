import { buildProductDraftPreview } from "./product-draft-preview.js";
import { buildReplyPreview } from "./reply-preview.js";
import { buildOrderPreview } from "./order-preview.js";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
  const productInput = input.product_preview_input ?? {};
  const replyInput = input.reply_preview_input ?? {};
  const orderInput = input.order_preview_input ?? {};

  const productPreview =
    preloaded.productPreview ??
    (await buildProductDraftPreview(clientConfig, productInput, preloaded.product ?? {}));
  if (!preloaded.productPreview && !preloaded.replyPreview) {
    await sleep(1200);
  }

  const replyPreview =
    preloaded.replyPreview ??
    (await buildReplyPreview(clientConfig, replyInput, preloaded.reply ?? {}));
  if (!preloaded.replyPreview && !preloaded.orderPreview) {
    await sleep(1200);
  }

  const orderPreview =
    preloaded.orderPreview ??
    (await buildOrderPreview(clientConfig, orderInput, preloaded.order ?? {}));

  return {
    report_name: "preview_center",
    generated_at: new Date().toISOString(),
    product_preview: productPreview,
    reply_preview: replyPreview,
    order_preview: orderPreview,
    preview_readiness: buildPreviewReadinessSummary({
      productPreview,
      replyPreview,
      orderPreview
    }),
    shared_blockers: unique([
      ...summarizeBlockers(productPreview),
      ...summarizeBlockers(replyPreview),
      ...summarizeBlockers(orderPreview)
    ]),
    boundary_statement: {
      input_aware_preview_only: true,
      not_platform_internal_execution: true,
      task6_excluded: true,
      no_write_action_attempted: true
    }
  };
}
