import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { buildOperationsComparisonSummary } from "../projects/wika/data/reports/operations-comparison.js";
import { buildProductsComparisonSummary } from "../projects/wika/data/reports/products-comparison.js";
import { buildOrdersComparisonSummary } from "../projects/wika/data/reports/orders-comparison.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..", "..");
const WIKA_DIR = path.join(ROOT_DIR, "WIKA");
const DOCS_DIR = path.join(WIKA_DIR, "docs", "framework");
const EVIDENCE_DIR = path.join(DOCS_DIR, "evidence");

const RAILWAY_TOKEN_PATH = path.join(os.tmpdir(), "railway-cli-token.txt");
const PROJECT_ID = "7cc408fd-c2a3-403c-9b4e-adaa72a9a712";
const ENVIRONMENT_ID = "4afccea8-ada6-42d5-9bd7-0f73cca404dc";
const SERVICE_ID = "d7abfb5c-25c6-478c-a51a-69d85151127a";
const GRAPHQL_URL = "https://backboard.railway.com/graphql/v2";
const PRODUCTION_BASE_URL = "https://api.wikapacking.com";
const SYNC_URL = "https://open-api.alibaba.com/sync";

const SUMMARY_PATH = path.join(
  EVIDENCE_DIR,
  "wika-stage27-comparison-layer-summary.json"
);
const OPERATIONS_PATH = path.join(
  EVIDENCE_DIR,
  "wika_operations_comparison_summary.json"
);
const PRODUCTS_PATH = path.join(
  EVIDENCE_DIR,
  "wika_products_comparison_summary.json"
);
const ORDERS_PATH = path.join(
  EVIDENCE_DIR,
  "wika_orders_comparison_summary.json"
);

const BASELINE_ROUTES = {
  health: "/health",
  authDebug: "/integrations/alibaba/auth/debug",
  operationsManagementSummary:
    "/integrations/alibaba/wika/reports/operations/management-summary",
  productsManagementSummary:
    "/integrations/alibaba/wika/reports/products/management-summary",
  ordersManagementSummary:
    "/integrations/alibaba/wika/reports/orders/management-summary"
};

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

function readRailwayToken() {
  if (!fs.existsSync(RAILWAY_TOKEN_PATH)) {
    throw new Error(`Missing Railway token file: ${RAILWAY_TOKEN_PATH}`);
  }

  return fs.readFileSync(RAILWAY_TOKEN_PATH, "utf8").trim();
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

function signSha256(apiName, params, appSecret) {
  const keys = Object.keys(params)
    .filter((key) => key !== "sign")
    .sort((left, right) =>
      Buffer.from(left, "utf8").compare(Buffer.from(right, "utf8"))
    );

  let payload = apiName;
  for (const key of keys) {
    const value = params[key];
    if (value === undefined || value === null || value === "") {
      continue;
    }
    payload += `${key}${value}`;
  }

  return crypto
    .createHmac("sha256", appSecret)
    .update(payload, "utf8")
    .digest("hex")
    .toUpperCase();
}

async function fetchJson(url) {
  const startedAt = Date.now();
  const response = await fetch(url);
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

async function queryRailwayVariables(railwayToken) {
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${railwayToken}`
    },
    body: JSON.stringify({
      query:
        "query($projectId:String!,$environmentId:String!,$serviceId:String!){ variables(projectId:$projectId,environmentId:$environmentId,serviceId:$serviceId) }",
      variables: {
        projectId: PROJECT_ID,
        environmentId: ENVIRONMENT_ID,
        serviceId: SERVICE_ID
      }
    })
  });

  const payload = await response.json();
  if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
    throw new Error(JSON.stringify(payload.errors));
  }

  return payload?.data?.variables ?? {};
}

function getRefreshUrl(vars) {
  return String(
    vars.ALIBABA_REFRESH_TOKEN_URL ||
      String(vars.ALIBABA_TOKEN_URL || "").replace(
        "/auth/token/create",
        "/auth/token/refresh"
      )
  ).trim();
}

async function refreshAccessToken({
  appKey,
  appSecret,
  refreshToken,
  refreshUrl,
  partnerId
}) {
  const params = {
    app_key: appKey,
    sign_method: "sha256",
    timestamp: String(Date.now()),
    refresh_token: refreshToken
  };

  if (partnerId) {
    params.partner_id = partnerId;
  }

  params.sign = signSha256("/auth/token/refresh", params, appSecret);

  const response = await fetch(refreshUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
      Accept: "application/json"
    },
    body: JSON.stringify(params)
  });

  const payload = await response.json();
  if (String(payload?.code ?? "0") !== "0") {
    throw new Error(
      `Failed to refresh WIKA access token: ${payload?.code ?? ""} ${payload?.sub_code ?? ""} ${payload?.message ?? payload?.msg ?? ""}`.trim()
    );
  }

  return payload.access_token;
}

function buildClientConfig(vars, accessToken) {
  return {
    account: "wika",
    appKey: String(vars.ALIBABA_CLIENT_ID || "").trim(),
    appSecret: String(vars.ALIBABA_CLIENT_SECRET || "").trim(),
    accessToken,
    partnerId: String(vars.ALIBABA_PARTNER_ID || "").trim() || undefined,
    endpointUrl: SYNC_URL
  };
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

async function run() {
  const summary = {
    stage: "stage27_derived_comparison_layer",
    generated_at: new Date().toISOString(),
    base_url: PRODUCTION_BASE_URL
  };

  const baselineResponses = {
    health: await fetchJson(`${PRODUCTION_BASE_URL}${BASELINE_ROUTES.health}`),
    authDebug: await fetchJson(`${PRODUCTION_BASE_URL}${BASELINE_ROUTES.authDebug}`),
    operationsManagementSummary: await fetchJson(
      `${PRODUCTION_BASE_URL}${BASELINE_ROUTES.operationsManagementSummary}`
    ),
    productsManagementSummary: await fetchJson(
      `${PRODUCTION_BASE_URL}${BASELINE_ROUTES.productsManagementSummary}`
    ),
    ordersManagementSummary: await fetchJson(
      `${PRODUCTION_BASE_URL}${BASELINE_ROUTES.ordersManagementSummary}`
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

  summary.stage24_online_baseline = {
    health: {
      route: BASELINE_ROUTES.health,
      status: baselineResponses.health.status
    },
    auth_debug: {
      route: BASELINE_ROUTES.authDebug,
      status: baselineResponses.authDebug.status,
      body: sanitizeNode(pickAuthDebugFields(baselineResponses.authDebug.body))
    },
    operations_management_summary: {
      route: BASELINE_ROUTES.operationsManagementSummary,
      status: baselineResponses.operationsManagementSummary.status
    },
    products_management_summary: {
      route: BASELINE_ROUTES.productsManagementSummary,
      status: baselineResponses.productsManagementSummary.status
    },
    orders_management_summary: {
      route: BASELINE_ROUTES.ordersManagementSummary,
      status: baselineResponses.ordersManagementSummary.status
    }
  };

  const railwayToken = readRailwayToken();
  const vars = await queryRailwayVariables(railwayToken);
  const accessToken = await refreshAccessToken({
    appKey: String(vars.ALIBABA_CLIENT_ID || "").trim(),
    appSecret: String(vars.ALIBABA_CLIENT_SECRET || "").trim(),
    refreshToken: String(vars.ALIBABA_WIKA_BOOTSTRAP_REFRESH_TOKEN || "").trim(),
    refreshUrl: getRefreshUrl(vars),
    partnerId: String(vars.ALIBABA_PARTNER_ID || "").trim()
  });
  const clientConfig = buildClientConfig(vars, accessToken);

  const operationsResult = await buildOperationsComparisonSummary(clientConfig, {});
  const productsResult = await buildProductsComparisonSummary(clientConfig, {});
  const ordersResult = await buildOrdersComparisonSummary(clientConfig, {
    pageLimit: 6,
    order_page_size: 8
  });

  const operationsEnvelope = buildRouteContractEnvelope("operations", operationsResult);
  const productsEnvelope = buildRouteContractEnvelope("products", productsResult);
  const ordersEnvelope = buildRouteContractEnvelope("orders", ordersResult);

  assert(
    operationsEnvelope.report_name === "operations_comparison_summary",
    "operations comparison report_name mismatch"
  );
  assert(
    productsEnvelope.report_name === "products_comparison_summary",
    "products comparison report_name mismatch"
  );
  assert(
    ordersEnvelope.report_name === "orders_comparison_summary",
    "orders comparison report_name mismatch"
  );

  assert(
    operationsEnvelope.current_window && operationsEnvelope.previous_window,
    "operations comparison missing comparable windows"
  );
  assert(
    productsEnvelope.current_window?.stat_date &&
      hasOwn(productsEnvelope.previous_window, "available"),
    "products comparison missing stat window metadata"
  );
  assert(
    ordersEnvelope.current_window && Array.isArray(ordersEnvelope.unavailable_dimensions),
    "orders comparison missing current window or unavailable dimensions"
  );

  assert(
    operationsEnvelope.official_inputs?.current_metrics?.visitor !== undefined &&
      operationsEnvelope.derived_comparison?.metric_deltas?.visitor,
    "operations comparison missing official input or derived comparison"
  );
  assert(
    productsEnvelope.official_inputs?.current_aggregate_metrics?.click !== undefined &&
      productsEnvelope.derived_comparison?.aggregate_metric_deltas?.click,
    "products comparison missing aggregate official input or delta"
  );
  assert(
    ordersEnvelope.derived_comparison?.observed_order_count_delta &&
      Array.isArray(ordersEnvelope.unavailable_dimensions) &&
      ordersEnvelope.unavailable_dimensions.includes("country_structure"),
    "orders comparison missing derived delta or unavailable country_structure"
  );

  summary.comparison_route_contracts = {
    operations: {
      route: "/integrations/alibaba/wika/reports/operations/comparison-summary",
      status: "PASS_LOCAL_CONTRACT",
      previous_window_available: Boolean(operationsEnvelope.previous_window),
      derived_metric_keys: Object.keys(
        operationsEnvelope.derived_comparison?.metric_deltas ?? {}
      )
    },
    products: {
      route: "/integrations/alibaba/wika/reports/products/comparison-summary",
      status: "PASS_LOCAL_CONTRACT",
      previous_window_available: Boolean(
        productsEnvelope.previous_window?.available
      ),
      derived_metric_keys: Object.keys(
        productsEnvelope.derived_comparison?.aggregate_metric_deltas ?? {}
      )
    },
    orders: {
      route: "/integrations/alibaba/wika/reports/orders/comparison-summary",
      status: "PASS_LOCAL_CONTRACT",
      previous_window_available: Boolean(ordersEnvelope.previous_window),
      derived_metric_keys: Object.keys(
        ordersEnvelope.derived_comparison ?? {}
      )
    }
  };

  summary.official_inputs = {
    operations: Object.keys(operationsEnvelope.official_inputs?.current_metrics ?? {}),
    products: Object.keys(productsEnvelope.official_inputs?.current_aggregate_metrics ?? {}),
    orders: sanitizeNode(ordersEnvelope.official_inputs)
  };
  summary.derived_outputs = {
    operations: {
      metric_deltas: Object.keys(
        operationsEnvelope.derived_comparison?.metric_deltas ?? {}
      ),
      trend_direction_summary:
        operationsEnvelope.derived_comparison?.trend_direction_summary ?? null
    },
    products: {
      aggregate_metric_deltas: Object.keys(
        productsEnvelope.derived_comparison?.aggregate_metric_deltas ?? {}
      ),
      top_risers_by_click_delta_count:
        productsEnvelope.derived_comparison?.top_risers_by_click_delta?.length ?? 0,
      top_decliners_by_click_delta_count:
        productsEnvelope.derived_comparison?.top_decliners_by_click_delta?.length ?? 0
    },
    orders: {
      observed_order_count_delta:
        ordersEnvelope.derived_comparison?.observed_order_count_delta ?? null,
      average_daily_order_count_delta:
        ordersEnvelope.derived_comparison?.average_daily_order_count_delta ?? null,
      product_contribution_delta_available:
        ordersEnvelope.derived_comparison?.product_contribution_delta?.available ?? false
    }
  };
  summary.unavailable_dimensions = {
    operations: operationsEnvelope.unavailable_dimensions ?? [],
    products: productsEnvelope.unavailable_dimensions ?? [],
    orders: ordersEnvelope.unavailable_dimensions ?? []
  };
  summary.comparison_candidate_status = {
    local_contract_ready: true,
    production_deployed: false,
    live_route_expanded_in_production: false
  };
  summary.boundary_statement = {
    not_task_1_complete: true,
    not_task_2_complete: true,
    no_write_action_attempted: true,
    wika_only_thread_for_business_work: true,
    xd_untouched_in_business_execution: true,
    not_full_business_cockpit: true
  };

  writeJson(OPERATIONS_PATH, sanitizeNode(operationsEnvelope));
  writeJson(PRODUCTS_PATH, sanitizeNode(productsEnvelope));
  writeJson(ORDERS_PATH, sanitizeNode(ordersEnvelope));
  writeJson(SUMMARY_PATH, sanitizeNode(summary));

  console.log(JSON.stringify(sanitizeNode(summary), null, 2));
}

function hasOwn(object, key) {
  return Boolean(object) && Object.prototype.hasOwnProperty.call(object, key);
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
