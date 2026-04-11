import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { buildOrdersManagementSummary } from "../shared/data/modules/wika-order-management-summary.js";
import { fetchWikaOrderMinimalDiagnostic } from "../shared/data/modules/wika-minimal-diagnostic.js";

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
  "wika-order-management-summary-layer-summary.json"
);
const MANAGEMENT_ROUTE_PATH = path.join(
  EVIDENCE_DIR,
  "wika_orders_management_summary.json"
);
const ORDERS_DIAGNOSTIC_PATH = path.join(
  EVIDENCE_DIR,
  "wika_orders_minimal_diagnostic_extended.json"
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

    if (/(token|secret|authorization|cookie|app_key|client_id)/i.test(key) || /(^|\.)sign$/i.test(normalizedKey)) {
      output[key] = "***";
      continue;
    }

    if (
      (/^(trade_id|member|phone|mobile|email|address|buyer|receiver)$/i.test(key) ||
        /(^|\.)(trade_id|member|phone|mobile|email|address|buyer|receiver)$/i.test(normalizedKey)) &&
      value !== undefined &&
      value !== null &&
      value !== "" &&
      (typeof value === "string" || typeof value === "number")
    ) {
      output[key] = maskValue(value);
      continue;
    }

    if (normalizedKey.includes("product_image")) {
      output[key] = "***";
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
    .sort((left, right) => Buffer.from(left, "utf8").compare(Buffer.from(right, "utf8")));

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

async function main() {
  const railwayToken = readRailwayToken();
  const vars = await queryRailwayVariables(railwayToken);
  const accessToken = await refreshAccessToken({
    appKey: String(vars.ALIBABA_CLIENT_ID || "").trim(),
    appSecret: String(vars.ALIBABA_CLIENT_SECRET || "").trim(),
    refreshToken: String(vars.ALIBABA_WIKA_BOOTSTRAP_REFRESH_TOKEN || "").trim(),
    refreshUrl: getRefreshUrl(vars),
    partnerId: String(vars.ALIBABA_PARTNER_ID || "").trim() || undefined
  });

  const clientConfig = buildClientConfig(vars, accessToken);
  const baseline = {
    health: await fetchJson(`${PRODUCTION_BASE_URL}/health`),
    auth_debug: await fetchJson(`${PRODUCTION_BASE_URL}/integrations/alibaba/auth/debug`),
    operations_management_summary: await fetchJson(
      `${PRODUCTION_BASE_URL}/integrations/alibaba/wika/reports/operations/management-summary`
    ),
    products_management_summary: await fetchJson(
      `${PRODUCTION_BASE_URL}/integrations/alibaba/wika/reports/products/management-summary`
    ),
    orders_list: await fetchJson(
      `${PRODUCTION_BASE_URL}/integrations/alibaba/wika/data/orders/list?page_size=3`
    )
  };

  assert(baseline.health.status === 200, "Baseline /health did not return 200");
  assert(baseline.auth_debug.status === 200 && baseline.auth_debug.is_json, "Baseline auth/debug did not return 200 JSON");
  assert(
    baseline.operations_management_summary.status === 200 && baseline.operations_management_summary.is_json,
    "Baseline operations management summary did not return 200 JSON"
  );
  assert(
    baseline.products_management_summary.status === 200 && baseline.products_management_summary.is_json,
    "Baseline products management summary did not return 200 JSON"
  );
  assert(
    baseline.orders_list.status === 200 && baseline.orders_list.is_json,
    "Baseline orders/list did not return 200 JSON"
  );

  const query = {
    order_page_size: 5,
    order_sample_limit: 3,
    page_limit: 3
  };

  const managementSummary = await buildOrdersManagementSummary(clientConfig, query);
  const diagnostic = await fetchWikaOrderMinimalDiagnostic(clientConfig, query);
  const routePreview = {
    ok: true,
    module: "orders",
    account: "wika",
    read_only: true,
    ...managementSummary
  };

  assert(routePreview.report_name === "orders_management_summary", "orders management summary report_name mismatch");
  assert(routePreview.formal_summary && routePreview.formal_summary.derived === true, "formal_summary missing or not marked derived");
  assert(routePreview.product_contribution && routePreview.product_contribution.derived === true, "product_contribution missing or not marked derived");
  assert(Array.isArray(routePreview.unavailable_dimensions), "unavailable_dimensions missing on orders management summary");
  assert(routePreview.unavailable_dimensions.includes("country_structure"), "country_structure not surfaced in unavailable_dimensions");
  assert(routePreview.boundary_statement?.derived_from_existing_order_apis_only === true, "orders management summary boundary_statement missing derived flag");
  assert(Array.isArray(routePreview.source_routes) && routePreview.source_routes.length >= 3, "orders management summary source_routes missing");

  assert(diagnostic.formal_summary_section?.status === "derived", "orders minimal diagnostic formal_summary_section missing");
  assert(diagnostic.product_contribution_section?.status === "derived", "orders minimal diagnostic product_contribution_section missing");
  assert(diagnostic.unavailable_dimensions_echo?.includes("country_structure"), "orders minimal diagnostic unavailable_dimensions_echo missing country_structure");
  assert(diagnostic.boundary_statement?.country_structure_unavailable_currently === true, "orders minimal diagnostic boundary_statement missing country structure guard");
  assert(diagnostic.recommendation_block, "orders minimal diagnostic recommendation_block missing");
  assert(diagnostic.confidence_hints, "orders minimal diagnostic confidence_hints missing");

  const summary = {
    stage: "stage23_order_management_summary",
    generated_at: new Date().toISOString(),
    baseline: {
      health: {
        status: baseline.health.status,
        elapsed_ms: baseline.health.elapsed_ms
      },
      auth_debug: {
        status: baseline.auth_debug.status,
        elapsed_ms: baseline.auth_debug.elapsed_ms,
        body: pickWikaAuthDebugFields(baseline.auth_debug.body)
      },
      operations_management_summary: {
        status: baseline.operations_management_summary.status,
        elapsed_ms: baseline.operations_management_summary.elapsed_ms
      },
      products_management_summary: {
        status: baseline.products_management_summary.status,
        elapsed_ms: baseline.products_management_summary.elapsed_ms
      },
      orders_list: {
        status: baseline.orders_list.status,
        elapsed_ms: baseline.orders_list.elapsed_ms
      }
    },
    validations: {
      orders_management_summary: {
        classification: "PASS_LOCAL_CONTRACT",
        observed_trade_count: routePreview.formal_summary?.observed_trade_count ?? null,
        total_order_count: routePreview.formal_summary?.total_order_count ?? null,
        top_products_by_order_count:
          routePreview.product_contribution?.top_products_by_order_count?.length ?? 0,
        unavailable_dimensions: routePreview.unavailable_dimensions,
        boundary_statement: routePreview.boundary_statement
      },
      orders_minimal_diagnostic: {
        classification: "PASS_LOCAL_CONTRACT",
        formal_summary_section_status: diagnostic.formal_summary_section?.status ?? null,
        product_contribution_section_status:
          diagnostic.product_contribution_section?.status ?? null,
        trend_signal_section_status: diagnostic.trend_signal_section?.status ?? null,
        unavailable_dimensions_echo: diagnostic.unavailable_dimensions_echo ?? [],
        boundary_statement: diagnostic.boundary_statement ?? null
      }
    },
    boundary_statement: {
      not_task_1_complete: true,
      not_task_2_complete: true,
      no_write_action_attempted: true,
      wika_only_thread: true,
      xd_untouched_in_this_round: true,
      not_full_business_cockpit: true
    }
  };

  writeJson(SUMMARY_PATH, sanitizeNode(summary));
  writeJson(MANAGEMENT_ROUTE_PATH, sanitizeNode(routePreview));
  writeJson(ORDERS_DIAGNOSTIC_PATH, sanitizeNode(diagnostic));

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});
