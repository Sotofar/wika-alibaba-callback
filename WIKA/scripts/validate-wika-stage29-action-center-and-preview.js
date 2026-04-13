import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildActionCenter } from "../projects/wika/data/cockpit/action-center.js";
import { buildProductDraftPreview } from "../projects/wika/data/workbench/product-draft-preview.js";
import { buildReplyPreview } from "../projects/wika/data/workbench/reply-preview.js";
import { buildOrderPreview } from "../projects/wika/data/workbench/order-preview.js";
import {
  buildPreviewCenter
} from "../projects/wika/data/workbench/preview-center.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..", "..");
const WIKA_DIR = path.join(ROOT_DIR, "WIKA");
const DOCS_DIR = path.join(WIKA_DIR, "docs", "framework");
const EVIDENCE_DIR = path.join(DOCS_DIR, "evidence");
const PRODUCTION_BASE_URL = "https://api.wikapacking.com";
const POST_DEPLOY_MODE = process.argv.includes("--post-deploy");

const FILES = POST_DEPLOY_MODE
  ? {
      summary: path.join(EVIDENCE_DIR, "wika-stage29-post-deploy-summary.json"),
      actionCenter: path.join(EVIDENCE_DIR, "wika_action_center_post_deploy.json"),
      productDraftPreview: path.join(
        EVIDENCE_DIR,
        "wika_product_draft_preview_post_deploy.json"
      ),
      replyPreview: path.join(EVIDENCE_DIR, "wika_reply_preview_post_deploy.json"),
      orderPreview: path.join(EVIDENCE_DIR, "wika_order_preview_post_deploy.json"),
      previewCenter: path.join(EVIDENCE_DIR, "wika_preview_center_post_deploy.json")
    }
  : {
      summary: path.join(
        EVIDENCE_DIR,
        "wika-stage29-action-center-and-preview-summary.json"
      ),
      actionCenter: path.join(EVIDENCE_DIR, "wika_action_center.json"),
      productDraftPreview: path.join(EVIDENCE_DIR, "wika_product_draft_preview.json"),
      replyPreview: path.join(EVIDENCE_DIR, "wika_reply_preview.json"),
      orderPreview: path.join(EVIDENCE_DIR, "wika_order_preview.json"),
      previewCenter: path.join(EVIDENCE_DIR, "wika_preview_center.json")
    };

const BASELINE_ROUTES = {
  health: "/health",
  authDebug: "/integrations/alibaba/auth/debug",
  operationsManagementSummary:
    "/integrations/alibaba/wika/reports/operations/management-summary",
  productsManagementSummary:
    "/integrations/alibaba/wika/reports/products/management-summary",
  ordersManagementSummary:
    "/integrations/alibaba/wika/reports/orders/management-summary",
  operationsMinimalDiagnostic:
    "/integrations/alibaba/wika/reports/operations/minimal-diagnostic",
  productsMinimalDiagnostic:
    "/integrations/alibaba/wika/reports/products/minimal-diagnostic",
  ordersMinimalDiagnostic:
    "/integrations/alibaba/wika/reports/orders/minimal-diagnostic",
  operationsComparisonSummary:
    "/integrations/alibaba/wika/reports/operations/comparison-summary",
  productsComparisonSummary:
    "/integrations/alibaba/wika/reports/products/comparison-summary",
  ordersComparisonSummary:
    "/integrations/alibaba/wika/reports/orders/comparison-summary",
  businessCockpit: "/integrations/alibaba/wika/reports/business-cockpit",
  productDraftWorkbench:
    "/integrations/alibaba/wika/workbench/product-draft-workbench",
  replyWorkbench: "/integrations/alibaba/wika/workbench/reply-workbench",
  orderWorkbench: "/integrations/alibaba/wika/workbench/order-workbench",
  taskWorkbench: "/integrations/alibaba/wika/workbench/task-workbench"
};

const STAGE29_ROUTES = {
  actionCenter: "/integrations/alibaba/wika/reports/action-center",
  productDraftPreview:
    "/integrations/alibaba/wika/workbench/product-draft-preview",
  replyPreview: "/integrations/alibaba/wika/workbench/reply-preview",
  orderPreview: "/integrations/alibaba/wika/workbench/order-preview",
  previewCenter: "/integrations/alibaba/wika/workbench/preview-center"
};

const REPLY_PREVIEW_INPUT = Object.freeze({
  inquiry_text:
    "Hello, please quote 1000 pcs custom sunglasses cases with logo and confirm lead time.",
  product_id: "AAFwxslEAOVqtWWP0tWvJG1K",
  quantity: "1000 pcs",
  destination_country: "United States",
  target_price: "0.65",
  expected_lead_time: "25-30 days after artwork approval",
  customer_profile: {
    company_name: "TEST BUYER / DO-NOT-USE",
    contact_name: "Sample Buyer"
  },
  language: "en"
});

const ORDER_PREVIEW_INPUT = Object.freeze({
  company_name: "TEST BUYER / DO-NOT-USE",
  contact_name: "Sample Buyer",
  email: "buyer@example.com",
  country_name: "United States",
  country_code: "US",
  line_items: [
    {
      product_id: "AAFwxslEAOVqtWWP0tWvJG1K",
      quantity: "1000",
      unit: "Pieces",
      unit_price: "0.65",
      currency: "USD"
    }
  ],
  payment_terms: {
    currency: "USD",
    total_amount: "650",
    advance_amount: "195",
    payment_terms_text: "30% deposit, balance before shipment"
  },
  shipment_plan: {
    trade_term: "FOB",
    shipment_method: "sea",
    lead_time_text: "25-30 days after artwork approval",
    destination_country: "United States"
  }
});

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function maskValue(value, keepStart = 3, keepEnd = 3) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const text = String(value);
  if (text.length <= keepStart + keepEnd) {
    return "***";
  }

  return `${text.slice(0, keepStart)}***${text.slice(-keepEnd)}`;
}

function unique(values = []) {
  return [...new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))];
}

function sanitizeNode(node) {
  if (Array.isArray(node)) {
    return node.slice(0, 20).map((item) => sanitizeNode(item));
  }

  if (!node || typeof node !== "object") {
    if (typeof node === "string" && /@/.test(node)) {
      return maskValue(node);
    }

    return node;
  }

  const output = {};
  for (const [key, value] of Object.entries(node)) {
    if (
      /(token|secret|sign|authorization|cookie|app_key|client_id|client_secret)/i.test(
        key
      )
    ) {
      output[key] = "***";
      continue;
    }

    if (
      /(trade_id|e_trade_id|phone|mobile|email|address|member|account)/i.test(key) &&
      (typeof value === "string" || typeof value === "number")
    ) {
      output[key] = maskValue(value);
      continue;
    }

    output[key] = sanitizeNode(value);
  }

  return output;
}

async function fetchJson(pathname, options = {}) {
  const startedAt = Date.now();
  const url = pathname.startsWith("http")
    ? pathname
    : `${PRODUCTION_BASE_URL}${pathname}`;
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      ...(options.headers ?? {})
    },
    ...options
  });
  const text = await response.text();
  let body = null;

  try {
    body = JSON.parse(text);
  } catch {
    body = null;
  }

  return {
    status: response.status,
    elapsed_ms: Date.now() - startedAt,
    is_json: body !== null,
    body,
    text
  };
}

async function postJson(pathname, body) {
  return fetchJson(pathname, {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
      Accept: "application/json"
    },
    body: JSON.stringify(body)
  });
}

function pickAuthDebugFields(body = {}) {
  const output = {};
  for (const [key, value] of Object.entries(body ?? {})) {
    if (/^(wika_|app_|session_|state_)/.test(key)) {
      output[key] = value;
    }
  }
  return output;
}

function buildRouteContractEnvelope(moduleName, result) {
  return {
    ok: true,
    module: moduleName,
    account: "wika",
    read_only: true,
    ...result
  };
}

function stripReadOnlyEnvelope(body = {}) {
  if (!body || typeof body !== "object") {
    return body;
  }

  const cloned = { ...body };
  delete cloned.ok;
  delete cloned.account;
  delete cloned.module;
  delete cloned.read_only;
  return cloned;
}

function buildReadResult(body) {
  if (body?.ok === false) {
    return {
      ok: false,
      error: body.error ?? "route_error",
      error_code: body.error_code ?? body.error_category ?? null
    };
  }

  return {
    ok: true,
    value: body
  };
}

async function fetchRequiredRoute(pathname, label) {
  const response = await fetchJson(pathname);
  assert(
    response.status === 200 && response.is_json && response.body?.ok !== false,
    `${label} failed`
  );
  return response;
}

async function buildProductDraftPreloadedData() {
  const listResponse = await fetchRequiredRoute(
    "/integrations/alibaba/wika/data/products/list?page_size=1",
    "product list"
  );
  const listBody = listResponse.body;
  const listItem = Array.isArray(listBody?.items) ? listBody.items[0] : null;

  assert(listItem?.id, "product list missing sample item id");
  assert(listItem?.category_id, "product list missing sample category_id");

  const productId = listItem.id;
  const categoryId = listItem.category_id;
  const groupId = listItem.group_id;

  const [
    detailResponse,
    scoreResponse,
    groupResponse,
    categoryTreeResponse,
    attributesResponse,
    schemaResponse,
    renderResponse,
    draftRenderResponse,
    mediaListResponse,
    mediaGroupsResponse
  ] = await Promise.all([
    fetchRequiredRoute(
      `/integrations/alibaba/wika/data/products/detail?product_id=${encodeURIComponent(
        productId
      )}`,
      "product detail"
    ),
    fetchRequiredRoute(
      `/integrations/alibaba/wika/data/products/score?product_id=${encodeURIComponent(
        productId
      )}`,
      "product score"
    ),
    groupId
      ? fetchRequiredRoute(
          `/integrations/alibaba/wika/data/products/groups?group_id=${encodeURIComponent(
            groupId
          )}`,
          "product groups"
        )
      : Promise.resolve({
          body: {
            ok: false,
            error: "missing_group_id",
            error_code: null
          }
        }),
    fetchRequiredRoute(
      `/integrations/alibaba/wika/data/categories/tree?cat_id=${encodeURIComponent(
        categoryId
      )}`,
      "category tree"
    ),
    fetchRequiredRoute(
      `/integrations/alibaba/wika/data/categories/attributes?cat_id=${encodeURIComponent(
        categoryId
      )}`,
      "category attributes"
    ),
    fetchRequiredRoute(
      `/integrations/alibaba/wika/data/products/schema?cat_id=${encodeURIComponent(
        categoryId
      )}`,
      "product schema"
    ),
    fetchRequiredRoute(
      `/integrations/alibaba/wika/data/products/schema/render?cat_id=${encodeURIComponent(
        categoryId
      )}&product_id=${encodeURIComponent(productId)}`,
      "product schema render"
    ),
    fetchRequiredRoute(
      `/integrations/alibaba/wika/data/products/schema/render/draft?cat_id=${encodeURIComponent(
        categoryId
      )}&product_id=${encodeURIComponent(productId)}`,
      "product schema render draft"
    ),
    fetchRequiredRoute(
      "/integrations/alibaba/wika/data/media/list?page_size=5",
      "media list"
    ),
    fetchRequiredRoute(
      "/integrations/alibaba/wika/data/media/groups",
      "media groups"
    )
  ]);

  return {
    sample_product_id: productId,
    sample_category_id: categoryId,
    sample_group_id: groupId ?? null,
    listResult: listBody,
    detailRead: buildReadResult(detailResponse.body),
    scoreRead: buildReadResult(scoreResponse.body),
    groupRead: buildReadResult(groupResponse.body),
    categoryTreeRead: buildReadResult(categoryTreeResponse.body),
    attributesRead: buildReadResult(attributesResponse.body),
    schemaRead: buildReadResult(schemaResponse.body),
    renderRead: buildReadResult(renderResponse.body),
    draftRenderRead: buildReadResult(draftRenderResponse.body),
    mediaListRead: buildReadResult(mediaListResponse.body),
    mediaGroupsRead: buildReadResult(mediaGroupsResponse.body)
  };
}

function buildProductPreviewInput(productDraftPreloaded) {
  return {
    product_id: productDraftPreloaded.sample_product_id,
    category_id: productDraftPreloaded.sample_category_id,
    base_name: "Custom Sunglasses Case",
    material: "PU leather",
    positioning: "travel organizer",
    selling_points: [
      "zipper closure",
      "logo customization",
      "protective interior"
    ],
    keyword_hints: ["sunglasses case", "custom logo", "travel case"],
    application: "gift and retail packaging",
    customization: "support logo printing and color customization",
    packaging_notes: "export carton packing",
    moq: "1000",
    lead_time: "25-30 days after artwork approval"
  };
}

function buildPreviewCenterInput(productDraftPreloaded) {
  return {
    product_preview_input: buildProductPreviewInput(productDraftPreloaded),
    reply_preview_input: REPLY_PREVIEW_INPUT,
    order_preview_input: ORDER_PREVIEW_INPUT
  };
}

function assertActionCenterContract(body) {
  assert(body.report_name === "action_center", "action center report_name mismatch");
  assert(body.business_cockpit_summary, "action center missing business_cockpit_summary");
  assert(body.diagnostic_signal_summary?.store, "action center missing store diagnostic");
  assert(body.comparison_signal_summary?.product, "action center missing product comparison");
  assert(body.task3_summary, "action center missing task3 summary");
  assert(body.task4_summary, "action center missing task4 summary");
  assert(body.task5_summary, "action center missing task5 summary");
  assert(Array.isArray(body.prioritized_actions), "action center missing prioritized_actions");
  assert(Array.isArray(body.shared_blockers), "action center missing shared_blockers");
  assert(
    body.boundary_statement?.current_official_mainline_plus_derived_layers_only === true,
    "action center missing boundary statement"
  );
}

function assertProductPreviewContract(body) {
  assert(
    body.report_name === "product_draft_preview",
    "product draft preview report_name mismatch"
  );
  assert(body.preview_input_summary, "product draft preview missing preview_input_summary");
  assert(body.product_context, "product draft preview missing product_context");
  assert(body.context_snapshot, "product draft preview missing context_snapshot");
  assert(body.draft_preview, "product draft preview missing draft_preview");
  assert(
    body.required_manual_fields,
    "product draft preview missing required_manual_fields"
  );
  assert(Array.isArray(body.blocking_risks), "product draft preview missing blocking_risks");
  assert(
    body.boundary_statement?.safe_draft_preparation_only === true,
    "product draft preview missing boundary statement"
  );
}

function assertReplyPreviewContract(body) {
  assert(body.report_name === "reply_preview", "reply preview report_name mismatch");
  assert(body.preview_input_summary, "reply preview missing preview_input_summary");
  assert(body.workflow_preview, "reply preview missing workflow_preview");
  assert(Array.isArray(body.hard_blockers), "reply preview missing hard_blockers");
  assert(Array.isArray(body.soft_blockers), "reply preview missing soft_blockers");
  assert(
    body.boundary_statement?.external_reply_draft_only === true,
    "reply preview missing boundary statement"
  );
}

function assertOrderPreviewContract(body) {
  assert(body.report_name === "order_preview", "order preview report_name mismatch");
  assert(body.preview_input_summary, "order preview missing preview_input_summary");
  assert(body.workflow_preview, "order preview missing workflow_preview");
  assert(Array.isArray(body.hard_blockers), "order preview missing hard_blockers");
  assert(Array.isArray(body.soft_blockers), "order preview missing soft_blockers");
  assert(
    body.boundary_statement?.external_order_draft_only === true,
    "order preview missing boundary statement"
  );
}

function assertPreviewCenterContract(body) {
  assert(body.report_name === "preview_center", "preview center report_name mismatch");
  assert(body.product_preview, "preview center missing product_preview");
  assert(body.reply_preview, "preview center missing reply_preview");
  assert(body.order_preview, "preview center missing order_preview");
  assert(body.preview_readiness?.task3_preview_available === true, "preview center missing readiness");
  assert(Array.isArray(body.shared_blockers), "preview center missing shared_blockers");
  assert(
    body.boundary_statement?.input_aware_preview_only === true,
    "preview center missing boundary statement"
  );
}

async function run() {
  const summary = {
    stage: POST_DEPLOY_MODE ? "stage29_post_deploy" : "stage29_local_contract",
    generated_at: new Date().toISOString(),
    base_url: PRODUCTION_BASE_URL
  };

  const baselineResponses = {
    health: await fetchJson(BASELINE_ROUTES.health),
    authDebug: await fetchJson(BASELINE_ROUTES.authDebug),
    operationsManagementSummary: await fetchJson(
      BASELINE_ROUTES.operationsManagementSummary
    ),
    productsManagementSummary: await fetchJson(
      BASELINE_ROUTES.productsManagementSummary
    ),
    ordersManagementSummary: await fetchJson(
      BASELINE_ROUTES.ordersManagementSummary
    ),
    operationsMinimalDiagnostic: await fetchJson(
      BASELINE_ROUTES.operationsMinimalDiagnostic
    ),
    productsMinimalDiagnostic: await fetchJson(
      BASELINE_ROUTES.productsMinimalDiagnostic
    ),
    ordersMinimalDiagnostic: await fetchJson(
      BASELINE_ROUTES.ordersMinimalDiagnostic
    ),
    operationsComparisonSummary: await fetchJson(
      BASELINE_ROUTES.operationsComparisonSummary
    ),
    productsComparisonSummary: await fetchJson(
      BASELINE_ROUTES.productsComparisonSummary
    ),
    ordersComparisonSummary: await fetchJson(
      BASELINE_ROUTES.ordersComparisonSummary
    ),
    businessCockpit: await fetchJson(BASELINE_ROUTES.businessCockpit),
    productDraftWorkbench: await fetchJson(BASELINE_ROUTES.productDraftWorkbench),
    replyWorkbench: await fetchJson(BASELINE_ROUTES.replyWorkbench),
    orderWorkbench: await fetchJson(BASELINE_ROUTES.orderWorkbench),
    taskWorkbench: await fetchJson(BASELINE_ROUTES.taskWorkbench),
    replyDraft: await postJson(
      "/integrations/alibaba/wika/tools/reply-draft",
      REPLY_PREVIEW_INPUT
    ),
    orderDraft: await postJson(
      "/integrations/alibaba/wika/tools/order-draft",
      ORDER_PREVIEW_INPUT
    )
  };

  assert(
    baselineResponses.health.status === 200 &&
      baselineResponses.health.text.trim().toLowerCase() === "ok",
    "baseline /health failed"
  );
  assert(
    baselineResponses.authDebug.status === 200 && baselineResponses.authDebug.is_json,
    "baseline auth debug failed"
  );

  for (const [key, response] of Object.entries(baselineResponses)) {
    if (key === "health" || key === "authDebug" || key === "replyDraft" || key === "orderDraft") {
      continue;
    }

    assert(
      response.status === 200 && response.is_json && response.body?.ok !== false,
      `${key} baseline failed`
    );
  }

  assert(
    baselineResponses.replyDraft.status === 200 && baselineResponses.replyDraft.is_json,
    "replyDraft baseline failed"
  );
  assert(
    baselineResponses.orderDraft.status === 200 && baselineResponses.orderDraft.is_json,
    "orderDraft baseline failed"
  );

  summary.online_baseline = {
    health: {
      status: baselineResponses.health.status,
      elapsed_ms: baselineResponses.health.elapsed_ms,
      body: baselineResponses.health.text.trim()
    },
    auth_debug: {
      status: baselineResponses.authDebug.status,
      elapsed_ms: baselineResponses.authDebug.elapsed_ms,
      body: sanitizeNode(pickAuthDebugFields(baselineResponses.authDebug.body))
    },
    stable_route_statuses: Object.fromEntries(
      Object.entries(BASELINE_ROUTES).map(([key, route]) => [
        key,
        {
          route,
          status: baselineResponses[key].status,
          elapsed_ms: baselineResponses[key].elapsed_ms
        }
      ])
    ),
    stable_tool_statuses: {
      reply_draft: {
        route: "/integrations/alibaba/wika/tools/reply-draft",
        method: "POST",
        status: baselineResponses.replyDraft.status,
        elapsed_ms: baselineResponses.replyDraft.elapsed_ms
      },
      order_draft: {
        route: "/integrations/alibaba/wika/tools/order-draft",
        method: "POST",
        status: baselineResponses.orderDraft.status,
        elapsed_ms: baselineResponses.orderDraft.elapsed_ms
      }
    }
  };

  const productDraftPreloaded = await buildProductDraftPreloadedData();
  const productPreviewInput = buildProductPreviewInput(productDraftPreloaded);
  const previewCenterInput = buildPreviewCenterInput(productDraftPreloaded);

  const actionCenter = buildRouteContractEnvelope(
    "action_center",
    await buildActionCenter(null, {}, {
      businessCockpit: stripReadOnlyEnvelope(baselineResponses.businessCockpit.body),
      taskWorkbench: stripReadOnlyEnvelope(baselineResponses.taskWorkbench.body)
    })
  );
  const productDraftPreview = buildRouteContractEnvelope(
    "task3_product_draft_preview",
    await buildProductDraftPreview(null, productPreviewInput, productDraftPreloaded)
  );
  const replyPreview = buildRouteContractEnvelope(
    "task4_reply_preview",
    await buildReplyPreview(null, REPLY_PREVIEW_INPUT, {
      preview: baselineResponses.replyDraft.body
    })
  );
  const orderPreview = buildRouteContractEnvelope(
    "task5_order_preview",
    await buildOrderPreview(null, ORDER_PREVIEW_INPUT, {
      preview: baselineResponses.orderDraft.body
    })
  );
  const previewCenter = buildRouteContractEnvelope(
    "preview_center",
    await buildPreviewCenter(null, previewCenterInput, {
      productPreview: stripReadOnlyEnvelope(productDraftPreview),
      replyPreview: stripReadOnlyEnvelope(replyPreview),
      orderPreview: stripReadOnlyEnvelope(orderPreview)
    })
  );

  assertActionCenterContract(actionCenter);
  assertProductPreviewContract(productDraftPreview);
  assertReplyPreviewContract(replyPreview);
  assertOrderPreviewContract(orderPreview);
  assertPreviewCenterContract(previewCenter);

  summary.local_contract = {
    action_center: {
      prioritized_action_count: actionCenter.prioritized_actions.length,
      shared_blocker_count: actionCenter.shared_blockers.length
    },
    product_draft_preview: {
      product_id: productDraftPreview.product_context?.product_id ?? null,
      blocking_risk_count: productDraftPreview.blocking_risks.length,
      missing_requirement_count:
        productDraftPreview.required_manual_fields?.missing_requirements?.length ?? 0
    },
    reply_preview: {
      workflow_profile: replyPreview.workflow_preview?.workflow_profile ?? null,
      hard_blocker_count: replyPreview.hard_blockers.length
    },
    order_preview: {
      workflow_profile: orderPreview.workflow_preview?.workflow_profile ?? null,
      hard_blocker_count: orderPreview.hard_blockers.length
    },
    preview_center: {
      shared_blocker_count: previewCenter.shared_blockers.length,
      task3_preview_available:
        previewCenter.preview_readiness?.task3_preview_available ?? false
    }
  };

  if (POST_DEPLOY_MODE) {
    const stage29Responses = {
      actionCenter: await fetchJson(STAGE29_ROUTES.actionCenter),
      productDraftPreview: await postJson(
        STAGE29_ROUTES.productDraftPreview,
        productPreviewInput
      ),
      replyPreview: await postJson(STAGE29_ROUTES.replyPreview, REPLY_PREVIEW_INPUT),
      orderPreview: await postJson(STAGE29_ROUTES.orderPreview, ORDER_PREVIEW_INPUT),
      previewCenter: await postJson(STAGE29_ROUTES.previewCenter, previewCenterInput)
    };

    assert(
      stage29Responses.actionCenter.status === 200 &&
        stage29Responses.actionCenter.is_json,
      "post-deploy action center failed"
    );
    assert(
      stage29Responses.productDraftPreview.status === 200 &&
        stage29Responses.productDraftPreview.is_json,
      "post-deploy product draft preview failed"
    );
    assert(
      stage29Responses.replyPreview.status === 200 &&
        stage29Responses.replyPreview.is_json,
      "post-deploy reply preview failed"
    );
    assert(
      stage29Responses.orderPreview.status === 200 &&
        stage29Responses.orderPreview.is_json,
      "post-deploy order preview failed"
    );
    assert(
      stage29Responses.previewCenter.status === 200 &&
        stage29Responses.previewCenter.is_json,
      "post-deploy preview center failed"
    );

    assertActionCenterContract(stripReadOnlyEnvelope(stage29Responses.actionCenter.body));
    assertProductPreviewContract(stripReadOnlyEnvelope(stage29Responses.productDraftPreview.body));
    assertReplyPreviewContract(stripReadOnlyEnvelope(stage29Responses.replyPreview.body));
    assertOrderPreviewContract(stripReadOnlyEnvelope(stage29Responses.orderPreview.body));
    assertPreviewCenterContract(stripReadOnlyEnvelope(stage29Responses.previewCenter.body));

    summary.production_smoke = Object.fromEntries(
      Object.entries(stage29Responses).map(([key, response]) => [
        key,
        {
          route: STAGE29_ROUTES[key],
          method: key === "actionCenter" ? "GET" : "POST",
          status: response.status,
          elapsed_ms: response.elapsed_ms
        }
      ])
    );

    writeJson(
      FILES.actionCenter,
      sanitizeNode(stripReadOnlyEnvelope(stage29Responses.actionCenter.body))
    );
    writeJson(
      FILES.productDraftPreview,
      sanitizeNode(stripReadOnlyEnvelope(stage29Responses.productDraftPreview.body))
    );
    writeJson(
      FILES.replyPreview,
      sanitizeNode(stripReadOnlyEnvelope(stage29Responses.replyPreview.body))
    );
    writeJson(
      FILES.orderPreview,
      sanitizeNode(stripReadOnlyEnvelope(stage29Responses.orderPreview.body))
    );
    writeJson(
      FILES.previewCenter,
      sanitizeNode(stripReadOnlyEnvelope(stage29Responses.previewCenter.body))
    );
  } else {
    writeJson(FILES.actionCenter, sanitizeNode(actionCenter));
    writeJson(FILES.productDraftPreview, sanitizeNode(productDraftPreview));
    writeJson(FILES.replyPreview, sanitizeNode(replyPreview));
    writeJson(FILES.orderPreview, sanitizeNode(orderPreview));
    writeJson(FILES.previewCenter, sanitizeNode(previewCenter));
  }

  writeJson(FILES.summary, sanitizeNode(summary));

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: POST_DEPLOY_MODE ? "post_deploy" : "local_contract",
        summary_path: FILES.summary
      },
      null,
      2
    )
  );
}

run().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error)
      },
      null,
      2
    )
  );
  process.exitCode = 1;
});
