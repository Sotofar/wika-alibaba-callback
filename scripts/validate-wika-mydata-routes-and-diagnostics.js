import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { fetchWikaOperationsTrafficSummary } from "../shared/data/modules/alibaba-mydata-overview.js";
import { fetchWikaProductPerformanceSummary } from "../shared/data/modules/alibaba-mydata-product-performance.js";
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
  "wika-mydata-routes-and-diagnostics-summary.json"
);
const OPERATIONS_SUMMARY_PATH = path.join(
  EVIDENCE_DIR,
  "wika_operations_traffic_summary.json"
);
const PRODUCTS_SUMMARY_PATH = path.join(
  EVIDENCE_DIR,
  "wika_products_performance_summary.json"
);
const OPERATIONS_DIAGNOSTIC_PATH = path.join(
  EVIDENCE_DIR,
  "wika_operations_minimal_diagnostic_extended.json"
);
const PRODUCTS_DIAGNOSTIC_PATH = path.join(
  EVIDENCE_DIR,
  "wika_products_minimal_diagnostic_extended.json"
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
  } catch {}

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

function extractOperationsOfficialFields(result) {
  return Object.keys(result?.official_metrics ?? {});
}

function extractProductsOfficialFields(result) {
  const firstItem = Array.isArray(result?.items) ? result.items[0] : null;
  return Object.keys(firstItem?.official_metrics ?? {});
}

async function run() {
  const summary = {
    stage: "stage20_wika_mydata_routes_and_diagnostics",
    generated_at: new Date().toISOString(),
    production_http_smoke: {
      new_routes_deployed_pre_push: false,
      reason:
        "Current round validates live helper contracts before push. Production HTTP smoke for newly added routes is deferred until deployment."
    }
  };

  const health = await fetchJson(`${PRODUCTION_BASE_URL}/health`);
  const authDebug = await fetchJson(
    `${PRODUCTION_BASE_URL}/integrations/alibaba/auth/debug`
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
      body: authDebug.body
    }
  });

  assert(health.status === 200, "Base sentinel failed: /health");
  assert(authDebug.status === 200 && authDebug.body, "Base sentinel failed: auth debug");

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

  const operationsSummary = await fetchWikaOperationsTrafficSummary(clientConfig, {});
  const productsSummary = await fetchWikaProductPerformanceSummary(clientConfig, {});
  const operationsDiagnostic = await fetchWikaMinimalDiagnostic(clientConfig, {});
  const productsDiagnostic = await fetchWikaProductMinimalDiagnostic(clientConfig, {});

  assert(operationsSummary?.report_name === "traffic_summary", "Invalid operations summary");
  assert(productsSummary?.report_name === "performance_summary", "Invalid product performance summary");
  assert(
    operationsDiagnostic?.traffic_performance_section,
    "Operations minimal diagnostic missing traffic_performance_section"
  );
  assert(
    productsDiagnostic?.performance_section,
    "Products minimal diagnostic missing performance_section"
  );
  assert(
    extractOperationsOfficialFields(operationsSummary).includes("visitor") &&
      extractOperationsOfficialFields(operationsSummary).includes("imps") &&
      extractOperationsOfficialFields(operationsSummary).includes("reply"),
    "Operations summary missing official fields"
  );
  assert(
    extractProductsOfficialFields(productsSummary).includes("click") &&
      extractProductsOfficialFields(productsSummary).includes("impression") &&
      extractProductsOfficialFields(productsSummary).includes("keyword_effects"),
    "Products summary missing official fields"
  );
  assert(
    Array.isArray(operationsSummary?.unavailable_dimensions) &&
      operationsSummary.unavailable_dimensions.includes("traffic_source") &&
      operationsSummary.unavailable_dimensions.includes("country_source") &&
      operationsSummary.unavailable_dimensions.includes("quick_reply_rate"),
    "Operations summary missing unavailable dimensions"
  );
  assert(
    Array.isArray(productsSummary?.unavailable_dimensions) &&
      productsSummary.unavailable_dimensions.includes("access_source") &&
      productsSummary.unavailable_dimensions.includes("inquiry_source") &&
      productsSummary.unavailable_dimensions.includes("country_source") &&
      productsSummary.unavailable_dimensions.includes("period_over_period_change"),
    "Products summary missing unavailable dimensions"
  );

  summary.route_validation = {
    operations_traffic_summary: {
      status: "PASS_LIVE_HELPER_CONTRACT",
      official_fields: extractOperationsOfficialFields(operationsSummary),
      derived_fields: Object.keys(operationsSummary?.derived_metrics ?? {}),
      unavailable_dimensions: operationsSummary.unavailable_dimensions ?? []
    },
    products_performance_summary: {
      status: "PASS_LIVE_HELPER_CONTRACT",
      official_fields: extractProductsOfficialFields(productsSummary),
      derived_fields: Object.keys(
        productsSummary?.items?.[0]?.derived_metrics ?? {}
      ),
      unavailable_dimensions: productsSummary.unavailable_dimensions ?? []
    },
    operations_minimal_diagnostic: {
      status: "PASS_LIVE_HELPER_CONTRACT",
      section_present: Boolean(operationsDiagnostic?.traffic_performance_section),
      boundary_statement:
        operationsDiagnostic?.traffic_performance_section?.boundary_statement ?? null
    },
    products_minimal_diagnostic: {
      status: "PASS_LIVE_HELPER_CONTRACT",
      section_present: Boolean(productsDiagnostic?.performance_section),
      boundary_statement:
        productsDiagnostic?.performance_section?.boundary_statement ?? null
    }
  };

  summary.confirmed_official_fields = {
    operations: extractOperationsOfficialFields(operationsSummary),
    products: extractProductsOfficialFields(productsSummary)
  };
  summary.derived_fields = {
    operations: Object.keys(operationsSummary?.derived_metrics ?? {}),
    products: Object.keys(productsSummary?.items?.[0]?.derived_metrics ?? {})
  };
  summary.unavailable_dimensions = {
    operations: operationsSummary.unavailable_dimensions ?? [],
    products: productsSummary.unavailable_dimensions ?? []
  };
  summary.boundary_statement = {
    not_task_1_complete: true,
    not_task_2_complete: true,
    no_write_action_attempted: true,
    wika_only_thread: true,
    xd_untouched_in_this_round: true,
    not_full_business_cockpit: true
  };

  writeJson(OPERATIONS_SUMMARY_PATH, sanitizeNode(operationsSummary));
  writeJson(PRODUCTS_SUMMARY_PATH, sanitizeNode(productsSummary));
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
