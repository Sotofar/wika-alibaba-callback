import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { buildOperationsManagementSummary, buildProductsManagementSummary } from "../shared/data/modules/wika-mydata-management-summary.js";
import {
  fetchWikaMinimalDiagnostic,
  fetchWikaProductMinimalDiagnostic
} from "../shared/data/modules/wika-minimal-diagnostic.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const FRAMEWORK_DIR = path.join(ROOT_DIR, "docs", "framework");
const EVIDENCE_DIR = path.join(FRAMEWORK_DIR, "evidence");

const RAILWAY_TOKEN_PATH = path.join(os.tmpdir(), "railway-cli-token.txt");
const PROJECT_ID = "7cc408fd-c2a3-403c-9b4e-adaa72a9a712";
const ENVIRONMENT_ID = "4afccea8-ada6-42d5-9bd7-0f73cca404dc";
const SERVICE_ID = "d7abfb5c-25c6-478c-a51a-69d85151127a";
const GRAPHQL_URL = "https://backboard.railway.com/graphql/v2";
const PRODUCTION_BASE_URL = "https://api.wikapacking.com";

const SUMMARY_PATH = path.join(
  EVIDENCE_DIR,
  "wika-management-summary-layer-summary.json"
);
const OPERATIONS_MANAGEMENT_PATH = path.join(
  EVIDENCE_DIR,
  "wika_operations_management_summary.json"
);
const PRODUCTS_MANAGEMENT_PATH = path.join(
  EVIDENCE_DIR,
  "wika_products_management_summary.json"
);
const OPERATIONS_DIAGNOSTIC_PATH = path.join(
  EVIDENCE_DIR,
  "wika_operations_minimal_diagnostic_stage21.json"
);
const PRODUCTS_DIAGNOSTIC_PATH = path.join(
  EVIDENCE_DIR,
  "wika_products_minimal_diagnostic_stage21.json"
);

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
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

function sanitizeNode(node, parentKey = "") {
  if (Array.isArray(node)) {
    return node.slice(0, 20).map((item) => sanitizeNode(item, parentKey));
  }

  if (!node || typeof node !== "object") {
    if (typeof node === "string" && /@/.test(node)) {
      return maskValue(node);
    }
    return node;
  }

  const output = {};
  for (const [key, value] of Object.entries(node)) {
    const normalizedKey = `${parentKey}.${key}`.toLowerCase();

    if (typeof value === "boolean") {
      output[key] = value;
      continue;
    }

    if (/(token|secret|sign|authorization|cookie|app_key|client_id)/i.test(key)) {
      output[key] = "***";
      continue;
    }

    if (
      /(trade_id|member|phone|mobile|email|address)/i.test(key) &&
      value !== undefined &&
      value !== null &&
      value !== "" &&
      (typeof value === "string" || typeof value === "number")
    ) {
      output[key] = maskValue(value);
      continue;
    }

    output[key] = sanitizeNode(value, normalizedKey);
  }

  return output;
}

function pickWikaAuthDebugFields(body = {}) {
  const allowedPrefixes = ["wika_", "app_", "session_", "state_"];
  const output = {};

  for (const [key, value] of Object.entries(body ?? {})) {
    if (allowedPrefixes.some((prefix) => key.startsWith(prefix))) {
      output[key] = value;
    }
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
    appKey: String(vars.ALIBABA_CLIENT_ID || "").trim(),
    appSecret: String(vars.ALIBABA_CLIENT_SECRET || "").trim(),
    accessToken,
    partnerId: String(vars.ALIBABA_PARTNER_ID || "").trim() || undefined,
    endpointUrl: "https://open-api.alibaba.com/sync"
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function run() {
  const summary = {
    stage: "stage21_wika_management_summary_layer",
    generated_at: new Date().toISOString(),
    production_http_smoke: {
      new_routes_deployed_pre_push: false,
      reason:
        "当前轮次尚未 push，新路由与扩展后的诊断路由只验证 live helper contract，production HTTP smoke 待部署后执行。"
    }
  };

  const health = await fetchJson(`${PRODUCTION_BASE_URL}/health`);
  const authDebug = await fetchJson(
    `${PRODUCTION_BASE_URL}/integrations/alibaba/auth/debug`
  );
  const representativeRoute = await fetchJson(
    `${PRODUCTION_BASE_URL}/integrations/alibaba/wika/data/products/list?page_size=1`
  );

  summary.base_sentinel = sanitizeNode({
    health: {
      status: health.status,
      elapsed_ms: health.elapsed_ms,
      body: health.body ?? health.text
    },
    auth_debug: {
      status: authDebug.status,
      elapsed_ms: authDebug.elapsed_ms,
      body: pickWikaAuthDebugFields(authDebug.body)
    },
    representative_route: {
      status: representativeRoute.status,
      elapsed_ms: representativeRoute.elapsed_ms,
      body: representativeRoute.body
    }
  });

  assert(health.status === 200, "Base sentinel failed: /health");
  assert(authDebug.status === 200 && authDebug.body, "Base sentinel failed: auth debug");
  assert(representativeRoute.status === 200 && representativeRoute.body, "Base sentinel failed: representative WIKA route");

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

  const operationsManagementSummary = await buildOperationsManagementSummary(
    clientConfig,
    {}
  );
  const productsManagementSummary = await buildProductsManagementSummary(
    clientConfig,
    {}
  );
  const operationsDiagnostic = await fetchWikaMinimalDiagnostic(clientConfig, {});
  const productsDiagnostic = await fetchWikaProductMinimalDiagnostic(clientConfig, {});

  assert(
    operationsManagementSummary.report_name === "operations_management_summary",
    "Operations management summary report_name mismatch"
  );
  assert(
    productsManagementSummary.report_name === "products_management_summary",
    "Products management summary report_name mismatch"
  );
  assert(
    operationsDiagnostic?.traffic_performance_section?.signal_interpretation,
    "Operations minimal diagnostic missing signal_interpretation"
  );
  assert(
    productsDiagnostic?.performance_section?.ranking_interpretation,
    "Products minimal diagnostic missing ranking_interpretation"
  );
  assert(
    operationsManagementSummary?.official_metrics?.visitor !== undefined &&
      operationsManagementSummary?.official_metrics?.imps !== undefined &&
      operationsManagementSummary?.official_metrics?.reply !== undefined,
    "Operations management summary missing official fields"
  );
  assert(
    productsManagementSummary?.aggregate_official_metrics?.click !== undefined &&
      productsManagementSummary?.aggregate_official_metrics?.impression !== undefined &&
      productsManagementSummary?.keyword_signal_summary !== undefined,
    "Products management summary missing aggregate fields"
  );
  assert(
    Array.isArray(operationsManagementSummary?.unavailable_dimensions) &&
      operationsManagementSummary.unavailable_dimensions.includes("traffic_source") &&
      operationsManagementSummary.unavailable_dimensions.includes("country_source") &&
      operationsManagementSummary.unavailable_dimensions.includes("quick_reply_rate"),
    "Operations management summary missing unavailable dimensions"
  );
  assert(
    Array.isArray(productsManagementSummary?.unavailable_dimensions) &&
      productsManagementSummary.unavailable_dimensions.includes("access_source") &&
      productsManagementSummary.unavailable_dimensions.includes("inquiry_source") &&
      productsManagementSummary.unavailable_dimensions.includes("country_source") &&
      productsManagementSummary.unavailable_dimensions.includes("period_over_period_change"),
    "Products management summary missing unavailable dimensions"
  );
  assert(
    typeof productsManagementSummary?.product_scope_limit === "number" &&
      typeof productsManagementSummary?.product_scope_truncated === "boolean" &&
      typeof productsManagementSummary?.product_ids_used_count === "number",
    "Products management summary missing product scope boundary fields"
  );

  summary.route_validation = {
    operations_management_summary: {
      status: "PASS_LIVE_HELPER_CONTRACT",
      official_fields: Object.keys(operationsManagementSummary.official_metrics ?? {}),
      derived_fields: Object.keys(operationsManagementSummary.derived_metrics ?? {}),
      unavailable_dimensions: operationsManagementSummary.unavailable_dimensions ?? []
    },
    products_management_summary: {
      status: "PASS_LIVE_HELPER_CONTRACT",
      official_fields: Object.keys(
        productsManagementSummary.items?.[0]?.official_metrics ?? {}
      ),
      derived_fields: Object.keys(productsManagementSummary.aggregate_derived_metrics ?? {}),
      unavailable_dimensions: productsManagementSummary.unavailable_dimensions ?? [],
      product_scope_limit: productsManagementSummary.product_scope_limit,
      product_scope_truncated: productsManagementSummary.product_scope_truncated,
      product_ids_used_count: productsManagementSummary.product_ids_used_count
    },
    operations_minimal_diagnostic: {
      status: "PASS_LIVE_HELPER_CONTRACT",
      section_present: Boolean(operationsDiagnostic?.traffic_performance_section),
      signal_interpretation_present: Boolean(
        operationsDiagnostic?.traffic_performance_section?.signal_interpretation
      ),
      recommendation_block_present: Boolean(
        operationsDiagnostic?.traffic_performance_section?.recommendation_block
      )
    },
    products_minimal_diagnostic: {
      status: "PASS_LIVE_HELPER_CONTRACT",
      section_present: Boolean(productsDiagnostic?.performance_section),
      ranking_interpretation_present: Boolean(
        productsDiagnostic?.performance_section?.ranking_interpretation
      ),
      recommendation_block_present: Boolean(
        productsDiagnostic?.performance_section?.recommendation_block
      )
    }
  };

  summary.confirmed_official_fields = {
    operations: Object.keys(operationsManagementSummary.official_metrics ?? {}),
    products: Object.keys(productsManagementSummary.items?.[0]?.official_metrics ?? {})
  };
  summary.derived_fields = {
    operations: Object.keys(operationsManagementSummary.derived_metrics ?? {}),
    products: Object.keys(productsManagementSummary.aggregate_derived_metrics ?? {})
  };
  summary.unavailable_dimensions = {
    operations: operationsManagementSummary.unavailable_dimensions ?? [],
    products: productsManagementSummary.unavailable_dimensions ?? []
  };
  summary.product_scope_boundary = {
    basis: productsManagementSummary.product_scope_basis,
    limit: productsManagementSummary.product_scope_limit,
    truncated: productsManagementSummary.product_scope_truncated,
    product_ids_used_count: productsManagementSummary.product_ids_used_count
  };
  summary.boundary_statement = {
    not_task_1_complete: true,
    not_task_2_complete: true,
    no_write_action_attempted: true,
    wika_only_thread: true,
    xd_untouched_in_this_round: true,
    not_full_business_cockpit: true
  };

  writeJson(OPERATIONS_MANAGEMENT_PATH, sanitizeNode(operationsManagementSummary));
  writeJson(PRODUCTS_MANAGEMENT_PATH, sanitizeNode(productsManagementSummary));
  writeJson(OPERATIONS_DIAGNOSTIC_PATH, sanitizeNode(operationsDiagnostic));
  writeJson(PRODUCTS_DIAGNOSTIC_PATH, sanitizeNode(productsDiagnostic));
  writeJson(SUMMARY_PATH, sanitizeNode(summary));

  console.log(JSON.stringify(summary, null, 2));
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
