import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildBusinessCockpit } from "../projects/wika/data/cockpit/business-cockpit.js";
import { buildProductDraftWorkbench } from "../projects/wika/data/workbench/product-draft-workbench.js";
import { buildReplyWorkbench } from "../projects/wika/data/workbench/reply-workbench.js";
import { buildOrderWorkbench } from "../projects/wika/data/workbench/order-workbench.js";
import { buildTaskWorkbench } from "../projects/wika/data/workbench/task-workbench.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..", "..");
const WIKA_DIR = path.join(ROOT_DIR, "WIKA");
const DOCS_DIR = path.join(WIKA_DIR, "docs", "framework");
const EVIDENCE_DIR = path.join(DOCS_DIR, "evidence");
const PRODUCTION_BASE_URL = "https://api.wikapacking.com";

const SUMMARY_PATH = path.join(
  EVIDENCE_DIR,
  "wika-stage28-cockpit-and-workbench-summary.json"
);
const BUSINESS_COCKPIT_PATH = path.join(
  EVIDENCE_DIR,
  "wika_business_cockpit.json"
);
const PRODUCT_DRAFT_WORKBENCH_PATH = path.join(
  EVIDENCE_DIR,
  "wika_product_draft_workbench.json"
);
const REPLY_WORKBENCH_PATH = path.join(
  EVIDENCE_DIR,
  "wika_reply_workbench.json"
);
const ORDER_WORKBENCH_PATH = path.join(
  EVIDENCE_DIR,
  "wika_order_workbench.json"
);
const TASK_WORKBENCH_PATH = path.join(
  EVIDENCE_DIR,
  "wika_task_workbench.json"
);

const BASELINE_ROUTES = {
  health: "/health",
  authDebug: "/integrations/alibaba/auth/debug",
  operationsManagementSummary:
    "/integrations/alibaba/wika/reports/operations/management-summary",
  productsManagementSummary:
    "/integrations/alibaba/wika/reports/products/management-summary",
  ordersManagementSummary:
    "/integrations/alibaba/wika/reports/orders/management-summary",
  operationsComparisonSummary:
    "/integrations/alibaba/wika/reports/operations/comparison-summary",
  productsComparisonSummary:
    "/integrations/alibaba/wika/reports/products/comparison-summary",
  ordersComparisonSummary:
    "/integrations/alibaba/wika/reports/orders/comparison-summary",
  operationsMinimalDiagnostic:
    "/integrations/alibaba/wika/reports/operations/minimal-diagnostic",
  productsMinimalDiagnostic:
    "/integrations/alibaba/wika/reports/products/minimal-diagnostic",
  ordersMinimalDiagnostic:
    "/integrations/alibaba/wika/reports/orders/minimal-diagnostic"
};

const REPLY_PREVIEW_INPUT = Object.freeze({
  inquiry_text: "Hello, please quote 1000 pcs custom sunglasses cases with logo.",
  product_id: "AAFwxslEAOVqtWWP0tWvJG1K",
  quantity: "1000 pcs",
  destination_country: "United States",
  target_price: "0.65",
  expected_lead_time: "25-30 days after artwork approval",
  customer_profile: {
    company_name: "TEST BUYER / DO-NOT-USE",
    contact_name: "Sample Buyer"
  },
  language: "en",
  notes: ["TEST / DO-NOT-USE", "external reply draft only"]
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
      /(trade_id|e_trade_id|phone|mobile|email|address|member|account|product_image)/i.test(
        key
      ) &&
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

async function run() {
  const summary = {
    stage: "stage28_cockpit_and_workbench",
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
    operationsComparisonSummary: await fetchJson(
      BASELINE_ROUTES.operationsComparisonSummary
    ),
    productsComparisonSummary: await fetchJson(
      BASELINE_ROUTES.productsComparisonSummary
    ),
    ordersComparisonSummary: await fetchJson(
      BASELINE_ROUTES.ordersComparisonSummary
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
  assert(
    baselineResponses.operationsManagementSummary.status === 200 &&
      baselineResponses.operationsManagementSummary.is_json,
    "baseline operations management summary failed"
  );
  assert(
    baselineResponses.productsManagementSummary.status === 200 &&
      baselineResponses.productsManagementSummary.is_json,
    "baseline products management summary failed"
  );
  assert(
    baselineResponses.ordersManagementSummary.status === 200 &&
      baselineResponses.ordersManagementSummary.is_json,
    "baseline orders management summary failed"
  );
  assert(
    baselineResponses.operationsComparisonSummary.status === 200 &&
      baselineResponses.operationsComparisonSummary.is_json,
    "baseline operations comparison summary failed"
  );
  assert(
    baselineResponses.productsComparisonSummary.status === 200 &&
      baselineResponses.productsComparisonSummary.is_json,
    "baseline products comparison summary failed"
  );
  assert(
    baselineResponses.ordersComparisonSummary.status === 200 &&
      baselineResponses.ordersComparisonSummary.is_json,
    "baseline orders comparison summary failed"
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
    operations_management_summary: {
      status: baselineResponses.operationsManagementSummary.status,
      elapsed_ms: baselineResponses.operationsManagementSummary.elapsed_ms
    },
    products_management_summary: {
      status: baselineResponses.productsManagementSummary.status,
      elapsed_ms: baselineResponses.productsManagementSummary.elapsed_ms
    },
    orders_management_summary: {
      status: baselineResponses.ordersManagementSummary.status,
      elapsed_ms: baselineResponses.ordersManagementSummary.elapsed_ms
    },
    operations_comparison_summary: {
      status: baselineResponses.operationsComparisonSummary.status,
      elapsed_ms: baselineResponses.operationsComparisonSummary.elapsed_ms
    },
    products_comparison_summary: {
      status: baselineResponses.productsComparisonSummary.status,
      elapsed_ms: baselineResponses.productsComparisonSummary.elapsed_ms
    },
    orders_comparison_summary: {
      status: baselineResponses.ordersComparisonSummary.status,
      elapsed_ms: baselineResponses.ordersComparisonSummary.elapsed_ms
    }
  };

  const [
    operationsMinimalDiagnostic,
    productsMinimalDiagnostic,
    ordersMinimalDiagnostic,
    productDraftPreloaded,
    replyPreviewResponse,
    orderPreviewResponse
  ] = await Promise.all([
    fetchRequiredRoute(
      BASELINE_ROUTES.operationsMinimalDiagnostic,
      "operations minimal diagnostic"
    ),
    fetchRequiredRoute(
      BASELINE_ROUTES.productsMinimalDiagnostic,
      "products minimal diagnostic"
    ),
    fetchRequiredRoute(
      BASELINE_ROUTES.ordersMinimalDiagnostic,
      "orders minimal diagnostic"
    ),
    buildProductDraftPreloadedData(),
    postJson("/integrations/alibaba/wika/tools/reply-draft", REPLY_PREVIEW_INPUT),
    postJson("/integrations/alibaba/wika/tools/order-draft", ORDER_PREVIEW_INPUT)
  ]);

  assert(
    replyPreviewResponse.status === 200 && replyPreviewResponse.is_json,
    "reply preview route failed"
  );
  assert(
    orderPreviewResponse.status === 200 && orderPreviewResponse.is_json,
    "order preview route failed"
  );

  const businessCockpitPreloaded = {
    storeOverview: stripReadOnlyEnvelope(
      baselineResponses.operationsManagementSummary.body
    ),
    productOverview: stripReadOnlyEnvelope(
      baselineResponses.productsManagementSummary.body
    ),
    orderOverview: stripReadOnlyEnvelope(
      baselineResponses.ordersManagementSummary.body
    ),
    storeComparison: stripReadOnlyEnvelope(
      baselineResponses.operationsComparisonSummary.body
    ),
    productComparison: stripReadOnlyEnvelope(
      baselineResponses.productsComparisonSummary.body
    ),
    orderComparison: stripReadOnlyEnvelope(
      baselineResponses.ordersComparisonSummary.body
    ),
    storeDiagnostic: stripReadOnlyEnvelope(operationsMinimalDiagnostic.body),
    productDiagnostic: stripReadOnlyEnvelope(productsMinimalDiagnostic.body),
    orderDiagnostic: stripReadOnlyEnvelope(ordersMinimalDiagnostic.body)
  };

  const businessCockpit = buildRouteContractEnvelope(
    "business_cockpit",
    await buildBusinessCockpit(null, {
      product_id_limit: 5,
      pageLimit: 3,
      order_sample_limit: 3
    }, businessCockpitPreloaded)
  );
  const productDraftWorkbench = buildRouteContractEnvelope(
    "task3_product_draft_workbench",
    await buildProductDraftWorkbench(null, {}, productDraftPreloaded)
  );
  const replyWorkbench = buildRouteContractEnvelope(
    "task4_reply_workbench",
    await buildReplyWorkbench(null, { language: "zh-CN" }, {
      preview: replyPreviewResponse.body
    })
  );
  const orderWorkbench = buildRouteContractEnvelope(
    "task5_order_workbench",
    await buildOrderWorkbench(null, {}, {
      preview: orderPreviewResponse.body
    })
  );
  const taskWorkbench = buildRouteContractEnvelope(
    "task_workbench",
    await buildTaskWorkbench(null, {}, {
      task3Summary: productDraftWorkbench,
      task4Summary: replyWorkbench,
      task5Summary: orderWorkbench
    })
  );

  assert(
    businessCockpit.report_name === "business_cockpit",
    "business cockpit report_name mismatch"
  );
  assert(businessCockpit.store_overview, "business cockpit missing store_overview");
  assert(businessCockpit.product_overview, "business cockpit missing product_overview");
  assert(businessCockpit.order_overview, "business cockpit missing order_overview");
  assert(businessCockpit.store_comparison, "business cockpit missing store_comparison");
  assert(
    businessCockpit.product_comparison,
    "business cockpit missing product_comparison"
  );
  assert(businessCockpit.order_comparison, "business cockpit missing order_comparison");
  assert(businessCockpit.store_diagnostic, "business cockpit missing store_diagnostic");
  assert(
    businessCockpit.product_diagnostic,
    "business cockpit missing product_diagnostic"
  );
  assert(businessCockpit.order_diagnostic, "business cockpit missing order_diagnostic");
  assert(
    businessCockpit.cross_section_gaps?.combined_unavailable_dimensions,
    "business cockpit missing cross_section_gaps"
  );
  assert(
    businessCockpit.task_coverage_summary?.task6_excluded === true,
    "business cockpit missing task_coverage_summary"
  );
  assert(
    businessCockpit.boundary_statement?.not_full_business_cockpit === true,
    "business cockpit missing boundary statement"
  );

  assert(
    productDraftWorkbench.product_context &&
      productDraftWorkbench.schema_context &&
      productDraftWorkbench.media_context &&
      productDraftWorkbench.draft_readiness &&
      productDraftWorkbench.required_manual_fields &&
      productDraftWorkbench.blocking_risks &&
      productDraftWorkbench.boundary_statement,
    "product draft workbench contract incomplete"
  );

  assert(
    replyWorkbench.workflow_capability &&
      replyWorkbench.input_requirements &&
      replyWorkbench.current_reply_profiles &&
      replyWorkbench.blocker_taxonomy_summary &&
      replyWorkbench.handoff_pack_capability &&
      replyWorkbench.quality_gate_summary &&
      replyWorkbench.sample_availability &&
      replyWorkbench.boundary_statement,
    "reply workbench contract incomplete"
  );

  assert(
    orderWorkbench.workflow_capability &&
      orderWorkbench.input_requirements &&
      orderWorkbench.current_order_profiles &&
      orderWorkbench.required_manual_field_system &&
      orderWorkbench.handoff_pack_capability &&
      orderWorkbench.quality_gate_summary &&
      orderWorkbench.sample_availability &&
      orderWorkbench.boundary_statement,
    "order workbench contract incomplete"
  );

  assert(
    taskWorkbench.task3_summary &&
      taskWorkbench.task4_summary &&
      taskWorkbench.task5_summary &&
      Array.isArray(taskWorkbench.shared_blockers) &&
      Array.isArray(taskWorkbench.shared_handoff_rules) &&
      taskWorkbench.boundary_statement?.task6_excluded === true,
    "task workbench contract incomplete"
  );

  summary.local_contract = {
    business_cockpit: {
      report_name: businessCockpit.report_name,
      unavailable_gap_count:
        businessCockpit.cross_section_gaps?.combined_unavailable_dimensions?.length ?? 0
    },
    product_draft_workbench: {
      report_name: productDraftWorkbench.report_name,
      product_id: productDraftWorkbench.product_context?.product_id ?? null,
      missing_requirement_count:
        productDraftWorkbench.required_manual_fields?.missing_requirements?.length ?? 0
    },
    reply_workbench: {
      report_name: replyWorkbench.report_name,
      preview_profile: replyWorkbench.blocker_taxonomy_summary?.preview_profile ?? null,
      handoff_required: replyWorkbench.quality_gate_summary?.handoff_required ?? null
    },
    order_workbench: {
      report_name: orderWorkbench.report_name,
      preview_profile: orderWorkbench.blocker_taxonomy_summary?.preview_profile ?? null,
      handoff_required: orderWorkbench.quality_gate_summary?.handoff_required ?? null
    },
    task_workbench: {
      report_name: taskWorkbench.report_name,
      shared_blocker_count: taskWorkbench.shared_blockers.length
    }
  };
  summary.preloaded_contract_sources = {
    product_sample_id: productDraftPreloaded.sample_product_id,
    product_sample_category_id: productDraftPreloaded.sample_category_id,
    reply_preview_status: replyPreviewResponse.status,
    order_preview_status: orderPreviewResponse.status,
    baseline_route_count: unique(Object.values(BASELINE_ROUTES)).length
  };

  writeJson(SUMMARY_PATH, sanitizeNode(summary));
  writeJson(BUSINESS_COCKPIT_PATH, sanitizeNode(businessCockpit));
  writeJson(PRODUCT_DRAFT_WORKBENCH_PATH, sanitizeNode(productDraftWorkbench));
  writeJson(REPLY_WORKBENCH_PATH, sanitizeNode(replyWorkbench));
  writeJson(ORDER_WORKBENCH_PATH, sanitizeNode(orderWorkbench));
  writeJson(TASK_WORKBENCH_PATH, sanitizeNode(taskWorkbench));

  console.log(
    JSON.stringify(
      {
        ok: true,
        summary_path: SUMMARY_PATH,
        business_cockpit_path: BUSINESS_COCKPIT_PATH,
        product_draft_workbench_path: PRODUCT_DRAFT_WORKBENCH_PATH,
        reply_workbench_path: REPLY_WORKBENCH_PATH,
        order_workbench_path: ORDER_WORKBENCH_PATH,
        task_workbench_path: TASK_WORKBENCH_PATH
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
