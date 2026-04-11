import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const PRODUCTION_BASE_URL = "https://api.wikapacking.com";
const SUMMARY_JSON_PATH = path.join(
  ROOT_DIR,
  "docs",
  "framework",
  "evidence",
  "stage22-wika-replay-summary.json"
);
const WIKA_REPLAY_MATRIX_PATH = path.join(
  ROOT_DIR,
  "projects",
  "wika",
  "access",
  "replay_matrix.csv"
);
const XD_API_MATRIX_PATH = path.join(
  ROOT_DIR,
  "projects",
  "xd",
  "access",
  "api_matrix.csv"
);

const RAILWAY_TOKEN_PATH = path.join(os.tmpdir(), "railway-cli-token.txt");
const PROJECT_ID = "7cc408fd-c2a3-403c-9b4e-adaa72a9a712";
const ENVIRONMENT_ID = "4afccea8-ada6-42d5-9bd7-0f73cca404dc";
const SERVICE_ID = "d7abfb5c-25c6-478c-a51a-69d85151127a";
const GRAPHQL_URL = "https://backboard.railway.com/graphql/v2";
const SYNC_URL = "https://open-api.alibaba.com/sync";

const WIKA_ALLOWED = new Set([
  "RECONFIRMED",
  "FLAKY",
  "REGRESSED",
  "BLOCKED_ENV",
  "AUTH_SCOPE_CHANGED",
  "DOC_MISMATCH",
  "PARAM_MISSING",
  "RATE_LIMITED",
  "NO_DATA",
  "DEPRECATED",
  "UNKNOWN"
]);

const XD_ALLOWED = new Set([
  "PASSED",
  "PERMISSION_DENIED",
  "PARAM_MISSING",
  "NO_DATA",
  "DOC_MISMATCH",
  "RATE_LIMITED",
  "DEPRECATED",
  "BLOCKED_ENV",
  "UNKNOWN"
]);

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeText(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
}

function writeJson(filePath, value) {
  writeText(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function csvEscape(value) {
  const raw =
    value === undefined || value === null
      ? ""
      : typeof value === "string"
        ? value
        : JSON.stringify(value);
  return `"${String(raw).replace(/"/g, '""')}"`;
}

function toCsv(headers, rows) {
  const lines = [headers.map((header) => csvEscape(header)).join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => csvEscape(row[header])).join(","));
  }
  return `${lines.join("\n")}\n`;
}

function nowIso() {
  return new Date().toISOString();
}

function maskValue(value, keepStart = 2, keepEnd = 2) {
  if (value === undefined || value === null) {
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
    return node.slice(0, 10).map((item) => sanitizeNode(item));
  }
  if (!node || typeof node !== "object") {
    return node;
  }
  const out = {};
  for (const [key, value] of Object.entries(node)) {
    if (/(token|secret|cookie|sign|authorization)/i.test(key)) {
      out[key] = "***";
      continue;
    }
    if (/(trade_id|e_trade_id)/i.test(key)) {
      out[key] = maskValue(value, 3, 3);
      continue;
    }
    out[key] = sanitizeNode(value);
  }
  return out;
}

function assertAllowed(status, allowed, context) {
  if (!allowed.has(status)) {
    throw new Error(`Unexpected classification "${status}" for ${context}`);
  }
}

async function fetchRoute({
  pathname,
  method = "GET",
  query = null,
  body = null,
  headers = {},
  redirect = "follow",
  timeoutMs = 20000
}) {
  const url = new URL(pathname, PRODUCTION_BASE_URL);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") {
        continue;
      }
      url.searchParams.set(key, String(value));
    }
  }
  const started = Date.now();
  try {
    const response = await fetch(url, {
      method,
      headers,
      body,
      redirect,
      signal: AbortSignal.timeout(timeoutMs)
    });
    const elapsedMs = Date.now() - started;
    const text = await response.text();
    const contentType = response.headers.get("content-type") || "";
    let jsonBody = null;
    if (contentType.includes("json")) {
      try {
        jsonBody = JSON.parse(text);
      } catch {
        jsonBody = null;
      }
    }
    return {
      ok: true,
      statusCode: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      contentType,
      text,
      jsonBody,
      elapsedMs
    };
  } catch (error) {
    const elapsedMs = Date.now() - started;
    return {
      ok: false,
      statusCode: null,
      headers: {},
      contentType: null,
      text: null,
      jsonBody: null,
      elapsedMs,
      error:
        error instanceof Error
          ? { name: error.name, message: error.message }
          : { name: "UnknownError", message: String(error) }
    };
  }
}

function summarizeRouteResponse(response) {
  if (!response.ok) {
    return `exception(${response.error?.name ?? "Error"}:${response.error?.message ?? "unknown"})`;
  }
  if (response.jsonBody && typeof response.jsonBody === "object") {
    const keys = Object.keys(response.jsonBody).slice(0, 12).join("|");
    const parts = [`json_keys=${keys || "-"}`];
    if (typeof response.jsonBody.ok === "boolean") {
      parts.push(`ok=${response.jsonBody.ok}`);
    }
    if (response.jsonBody.error_category) {
      parts.push(`error_category=${response.jsonBody.error_category}`);
    }
    if (response.jsonBody.workflow_profile) {
      parts.push(`workflow_profile=${response.jsonBody.workflow_profile}`);
    }
    if (response.jsonBody.response_meta?.msg_code) {
      parts.push(`msg_code=${response.jsonBody.response_meta.msg_code}`);
    }
    return parts.join("; ");
  }
  return `text=${String(response.text || "").slice(0, 120)}`;
}

function isJsonObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function buildBaseGateStatus(response, kind) {
  if (!response.ok) {
    return "BLOCKED_ENV";
  }
  if (kind === "health") {
    return response.statusCode === 200 && String(response.text || "").trim() === "ok"
      ? "PASS_BASE"
      : "BLOCKED_ENV";
  }
  if (kind === "auth_debug") {
    return response.statusCode === 200 &&
      isJsonObject(response.jsonBody) &&
      (
        "startup_init_status" in response.jsonBody ||
        "wika_startup_init_status" in response.jsonBody ||
        "xd_startup_init_status" in response.jsonBody
      )
      ? "PASS_BASE"
      : "BLOCKED_ENV";
  }
  if (kind === "list") {
    return response.statusCode === 200 && Array.isArray(response.jsonBody?.items)
      ? "PASS_BASE"
      : "BLOCKED_ENV";
  }
  return "BLOCKED_ENV";
}

function readRailwayToken() {
  if (!fs.existsSync(RAILWAY_TOKEN_PATH)) {
    throw new Error(`Missing Railway token file: ${RAILWAY_TOKEN_PATH}`);
  }
  return fs.readFileSync(RAILWAY_TOKEN_PATH, "utf8").trim();
}

async function queryRailwayVariables(token) {
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
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

function getRefreshUrl(vars, prefix) {
  return String(
    vars[`${prefix}_REFRESH_TOKEN_URL`] ||
      String(vars[`${prefix}_TOKEN_URL`] || "").replace(
        "/auth/token/create",
        "/auth/token/refresh"
      )
  ).trim();
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

function serializeValue(value) {
  if (value === undefined || value === null || value === "") {
    return "";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
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
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(20000)
  });
  const payload = await response.json();
  if (String(payload?.code ?? "0") !== "0") {
    throw new Error(JSON.stringify(payload));
  }
  return payload.access_token;
}

async function callSyncApi({
  apiName,
  appKey,
  appSecret,
  accessToken,
  businessParams
}) {
  const params = {
    method: apiName,
    app_key: appKey,
    access_token: accessToken,
    sign_method: "sha256",
    timestamp: String(Date.now())
  };
  for (const [key, value] of Object.entries(businessParams ?? {})) {
    const serialized = serializeValue(value);
    if (serialized !== "") {
      params[key] = serialized;
    }
  }
  params.sign = signSha256("", params, appSecret);
  const response = await fetch(SYNC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
      Accept: "application/json"
    },
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(20000)
  });
  const text = await response.text();
  const contentType = response.headers.get("content-type") || "";
  let body = null;
  if (contentType.includes("json")) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }
  return {
    statusCode: response.status,
    text,
    contentType,
    body
  };
}

function formatShanghaiDateTime(date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

function extractFirstArrayItem(value) {
  return Array.isArray(value) ? (value[0] ?? null) : null;
}

function evaluateJsonRoute(response, requiredKeys, contractName) {
  if (!response.ok) {
    return {
      classification: "BLOCKED_ENV",
      rootCause: `${contractName}_not_reachable`,
      nextAction: "stop_replay"
    };
  }
  if (
    response.statusCode === 200 &&
    isJsonObject(response.jsonBody) &&
    (
      response.jsonBody.ok === true ||
      requiredKeys.some((key) => key in response.jsonBody)
    )
  ) {
    return {
      classification: "RECONFIRMED",
      rootCause: null,
      nextAction: "none"
    };
  }
  if (response.statusCode === 429) {
    return {
      classification: "RATE_LIMITED",
      rootCause: `${contractName}_rate_limited`,
      nextAction: "round2_backoff"
    };
  }
  if (
    response.statusCode >= 500 &&
    response.jsonBody?.error_category === "parameter_error"
  ) {
    return {
      classification: "PARAM_MISSING",
      rootCause: `${contractName}_parameter_error`,
      nextAction: "round2_param_adjustment"
    };
  }
  if (
    response.statusCode >= 500 &&
    response.jsonBody?.error_category === "permission_error"
  ) {
    return {
      classification: "AUTH_SCOPE_CHANGED",
      rootCause: `${contractName}_permission_error`,
      nextAction: "verify_scope_change"
    };
  }
  return {
    classification: "UNKNOWN",
    rootCause: `${contractName}_unexpected_shape`,
    nextAction: "inspect_route_contract"
  };
}

function collectWikaSamples(productsBody, ordersBody) {
  const productItem = extractFirstArrayItem(productsBody?.items);
  const orderItem = extractFirstArrayItem(ordersBody?.items);
  return {
    product_string_id: productItem?.product_id ?? null,
    product_numeric_id: productItem?.id ?? null,
    group_id: productItem?.group_id ?? null,
    category_id:
      productItem?.category_id ?? productItem?.categoryId ?? productItem?.cat_id ?? null,
    trade_id: orderItem?.trade_id ?? null
  };
}

function buildWikaRouteDefinitions(samples) {
  const now = new Date();
  const startTime = formatShanghaiDateTime(new Date(now.getTime() - 7 * 86400000));
  const endTime = formatShanghaiDateTime(now);
  return [
    { route: "/health", module: "runtime", endpoint: "/health", method: "GET", expected_scope: "service_health", known_required_params: "", pagination_rule: "n/a", date_window_rule: "n/a", prior_status: "validated_route", source_of_truth: "app.js + stage21 PASS_BASE", buildRequest: () => ({ pathname: "/health" }), sampleParams: () => ({}), evaluate: (r) => !r.ok ? { classification: "BLOCKED_ENV", rootCause: "health_not_reachable", nextAction: "stop_replay" } : r.statusCode === 200 && String(r.text || "").trim() === "ok" ? { classification: "RECONFIRMED", rootCause: null, nextAction: "none" } : { classification: "REGRESSED", rootCause: "health_contract_changed", nextAction: "inspect_health" } },
    { route: "/integrations/alibaba/auth/debug", module: "runtime", endpoint: "/integrations/alibaba/auth/debug", method: "GET", expected_scope: "wika_oauth_runtime", known_required_params: "", pagination_rule: "n/a", date_window_rule: "n/a", prior_status: "validated_route", source_of_truth: "app.js + stage21 PASS_BASE", buildRequest: () => ({ pathname: "/integrations/alibaba/auth/debug" }), sampleParams: () => ({}), evaluate: (r) => !r.ok ? { classification: "BLOCKED_ENV", rootCause: "auth_debug_not_reachable", nextAction: "stop_replay" } : r.statusCode === 200 && isJsonObject(r.jsonBody) && ("startup_init_status" in r.jsonBody || "wika_startup_init_status" in r.jsonBody) ? { classification: "RECONFIRMED", rootCause: null, nextAction: "none" } : { classification: "REGRESSED", rootCause: "auth_debug_contract_changed", nextAction: "inspect_auth_debug" } },
    { route: "/integrations/alibaba/auth/start", module: "runtime", endpoint: "/integrations/alibaba/auth/start", method: "GET", expected_scope: "wika_oauth_entry", known_required_params: "", pagination_rule: "n/a", date_window_rule: "n/a", prior_status: "validated_route", source_of_truth: "validated-flow.md + app.js", buildRequest: () => ({ pathname: "/integrations/alibaba/auth/start", redirect: "manual" }), sampleParams: () => ({}), evaluate: (r) => !r.ok ? { classification: "BLOCKED_ENV", rootCause: "auth_start_not_reachable", nextAction: "stop_replay" } : r.statusCode >= 300 && r.statusCode < 400 && (/open\.alibaba\.com/i.test(r.headers?.location || "") || /redirecting to https:\/\/open-api\.alibaba\.com/i.test(String(r.text || "").toLowerCase())) ? { classification: "RECONFIRMED", rootCause: null, nextAction: "none" } : { classification: "REGRESSED", rootCause: "oauth_redirect_missing", nextAction: "inspect_auth_start" } },
    { route: "/integrations/alibaba/callback", module: "runtime", endpoint: "/integrations/alibaba/callback", method: "GET", expected_scope: "wika_oauth_callback", known_required_params: "code,state", pagination_rule: "n/a", date_window_rule: "n/a", prior_status: "validated_route", source_of_truth: "validated-flow.md + app.js", buildRequest: () => ({ pathname: "/integrations/alibaba/callback" }), sampleParams: () => ({}), evaluate: (r) => !r.ok ? { classification: "BLOCKED_ENV", rootCause: "callback_not_reachable", nextAction: "stop_replay" } : r.statusCode === 400 && /missing code/i.test(String(r.text || "")) ? { classification: "RECONFIRMED", rootCause: null, nextAction: "none" } : { classification: "DOC_MISMATCH", rootCause: "callback_missing_code_contract_changed", nextAction: "inspect_callback" } },
    { route: "/integrations/alibaba/wika/data/products/list", module: "products", endpoint: "/integrations/alibaba/wika/data/products/list", method: "GET", expected_scope: "wika_products_read", known_required_params: "", pagination_rule: "page_size optional", date_window_rule: "n/a", prior_status: "validated_route", source_of_truth: "已上线能力复用清单 + app.js", buildRequest: () => ({ pathname: "/integrations/alibaba/wika/data/products/list", query: { page_size: 2 } }), sampleParams: () => ({ page_size: 2 }), evaluate: (r) => evaluateJsonRoute(r, ["items"], "products_list") },
    { route: "/integrations/alibaba/wika/data/products/score", module: "products", endpoint: "/integrations/alibaba/wika/data/products/score", method: "GET", expected_scope: "wika_products_read", known_required_params: "product_id", pagination_rule: "n/a", date_window_rule: "n/a", prior_status: "validated_route", source_of_truth: "已上线能力复用清单 + app.js", buildRequest: () => ({ pathname: "/integrations/alibaba/wika/data/products/score", query: { product_id: samples.product_string_id } }), sampleParams: () => ({ product_id: "sample_product_string_id" }), evaluate: (r) => evaluateJsonRoute(r, ["product_id"], "products_score") },
    { route: "/integrations/alibaba/wika/data/products/detail", module: "products", endpoint: "/integrations/alibaba/wika/data/products/detail", method: "GET", expected_scope: "wika_products_read", known_required_params: "product_id", pagination_rule: "n/a", date_window_rule: "n/a", prior_status: "validated_route", source_of_truth: "已上线能力复用清单 + app.js", buildRequest: () => ({ pathname: "/integrations/alibaba/wika/data/products/detail", query: { product_id: samples.product_string_id } }), sampleParams: () => ({ product_id: "sample_product_string_id" }), evaluate: (r) => evaluateJsonRoute(r, ["product_id"], "products_detail") },
    { route: "/integrations/alibaba/wika/data/products/groups", module: "products", endpoint: "/integrations/alibaba/wika/data/products/groups", method: "GET", expected_scope: "wika_products_read", known_required_params: "group_id", pagination_rule: "n/a", date_window_rule: "n/a", prior_status: "validated_route", source_of_truth: "已上线能力复用清单 + app.js", buildRequest: () => ({ pathname: "/integrations/alibaba/wika/data/products/groups", query: { group_id: samples.group_id } }), sampleParams: () => ({ group_id: "sample_group_id" }), evaluate: (r) => evaluateJsonRoute(r, ["group"], "products_groups") },
    { route: "/integrations/alibaba/wika/data/categories/tree", module: "categories", endpoint: "/integrations/alibaba/wika/data/categories/tree", method: "GET", expected_scope: "wika_categories_read", known_required_params: "", pagination_rule: "n/a", date_window_rule: "n/a", prior_status: "validated_route", source_of_truth: "已上线能力复用清单 + app.js", buildRequest: () => ({ pathname: "/integrations/alibaba/wika/data/categories/tree", query: { cat_id: 0 } }), sampleParams: () => ({ cat_id: 0 }), evaluate: (r) => evaluateJsonRoute(r, ["categories"], "categories_tree") },
    { route: "/integrations/alibaba/wika/data/categories/attributes", module: "categories", endpoint: "/integrations/alibaba/wika/data/categories/attributes", method: "GET", expected_scope: "wika_categories_read", known_required_params: "cat_id", pagination_rule: "n/a", date_window_rule: "n/a", prior_status: "validated_route", source_of_truth: "已上线能力复用清单 + app.js", buildRequest: () => ({ pathname: "/integrations/alibaba/wika/data/categories/attributes", query: { cat_id: samples.category_id } }), sampleParams: () => ({ cat_id: "sample_category_id" }), evaluate: (r) => evaluateJsonRoute(r, ["attributes", "seller_defined_attributes"], "categories_attributes") },
    { route: "/integrations/alibaba/wika/data/products/schema", module: "products", endpoint: "/integrations/alibaba/wika/data/products/schema", method: "GET", expected_scope: "wika_products_read", known_required_params: "cat_id", pagination_rule: "n/a", date_window_rule: "n/a", prior_status: "validated_route", source_of_truth: "已上线能力复用清单 + app.js", buildRequest: () => ({ pathname: "/integrations/alibaba/wika/data/products/schema", query: { cat_id: samples.category_id } }), sampleParams: () => ({ cat_id: "sample_category_id" }), evaluate: (r) => evaluateJsonRoute(r, ["schema_xml", "schema_xml_length", "schema_field_count"], "products_schema") },
    { route: "/integrations/alibaba/wika/data/products/schema/render", module: "products", endpoint: "/integrations/alibaba/wika/data/products/schema/render", method: "GET", expected_scope: "wika_products_read", known_required_params: "cat_id,product_id", pagination_rule: "n/a", date_window_rule: "n/a", prior_status: "validated_route", source_of_truth: "已上线能力复用清单 + app.js", buildRequest: () => ({ pathname: "/integrations/alibaba/wika/data/products/schema/render", query: { cat_id: samples.category_id, product_id: samples.product_numeric_id } }), sampleParams: () => ({ cat_id: "sample_category_id", product_id: "sample_product_numeric_id" }), evaluate: (r) => evaluateJsonRoute(r, ["response_meta", "verified_fields"], "products_schema_render") },
    { route: "/integrations/alibaba/wika/data/products/schema/render/draft", module: "products", endpoint: "/integrations/alibaba/wika/data/products/schema/render/draft", method: "GET", expected_scope: "wika_products_read", known_required_params: "cat_id,product_id", pagination_rule: "n/a", date_window_rule: "n/a", prior_status: "validated_route", source_of_truth: "已上线能力复用清单 + app.js", buildRequest: () => ({ pathname: "/integrations/alibaba/wika/data/products/schema/render/draft", query: { cat_id: samples.category_id, product_id: samples.product_numeric_id } }), sampleParams: () => ({ cat_id: "sample_category_id", product_id: "sample_product_numeric_id" }), evaluate: (r) => evaluateJsonRoute(r, ["response_meta", "verified_fields", "warnings"], "products_schema_render_draft") },
    { route: "/integrations/alibaba/wika/data/media/list", module: "media", endpoint: "/integrations/alibaba/wika/data/media/list", method: "GET", expected_scope: "wika_media_read", known_required_params: "", pagination_rule: "page_size optional", date_window_rule: "n/a", prior_status: "validated_route", source_of_truth: "已上线能力复用清单 + app.js", buildRequest: () => ({ pathname: "/integrations/alibaba/wika/data/media/list", query: { page_size: 1 } }), sampleParams: () => ({ page_size: 1 }), evaluate: (r) => evaluateJsonRoute(r, ["items", "page_info", "response_meta"], "media_list") },
    { route: "/integrations/alibaba/wika/data/media/groups", module: "media", endpoint: "/integrations/alibaba/wika/data/media/groups", method: "GET", expected_scope: "wika_media_read", known_required_params: "", pagination_rule: "n/a", date_window_rule: "n/a", prior_status: "validated_route", source_of_truth: "已上线能力复用清单 + app.js", buildRequest: () => ({ pathname: "/integrations/alibaba/wika/data/media/groups" }), sampleParams: () => ({}), evaluate: (r) => evaluateJsonRoute(r, ["items", "response_meta"], "media_groups") },
    { route: "/integrations/alibaba/wika/data/customers/list", module: "customers", endpoint: "/integrations/alibaba/wika/data/customers/list", method: "GET", expected_scope: "wika_customer_probe_read", known_required_params: "customer_id_begin,last_sync_end_time", pagination_rule: "page_size optional", date_window_rule: "7d sync probe", prior_status: "validated_probe_route", source_of_truth: "已上线能力复用清单 + app.js", buildRequest: (round) => round === 1 ? ({ pathname: "/integrations/alibaba/wika/data/customers/list", query: { customer_id_begin: 0, page_size: 1 } }) : ({ pathname: "/integrations/alibaba/wika/data/customers/list", query: { customer_id_begin: 0, page_size: 1, start_time: startTime, end_time: endTime, last_sync_end_time: endTime } }), sampleParams: (round) => round === 1 ? ({ customer_id_begin: 0, page_size: 1 }) : ({ customer_id_begin: 0, page_size: 1, start_time: "sample_sync_window_start", end_time: "sample_sync_window_end", last_sync_end_time: "sample_sync_window_end" }), evaluate: (r, round) => !r.ok ? { classification: "BLOCKED_ENV", rootCause: "customers_list_not_reachable", nextAction: "stop_replay" } : round === 1 && r.statusCode === 502 && r.jsonBody?.error_category === "parameter_error" ? { classification: "PARAM_MISSING", rootCause: "last_sync_end_time_required", nextAction: "round2_add_sync_window" } : r.statusCode === 502 && r.jsonBody?.error_category === "permission_error" ? { classification: "RECONFIRMED", rootCause: "customer_scope_not_granted_probe_route_working", nextAction: "keep_as_probe_route" } : r.statusCode === 200 && r.jsonBody?.ok === true ? { classification: "RECONFIRMED", rootCause: null, nextAction: "none" } : { classification: "UNKNOWN", rootCause: "customers_list_unexpected_shape", nextAction: "inspect_route_contract" } },
    { route: "/integrations/alibaba/wika/data/orders/list", module: "orders", endpoint: "/integrations/alibaba/wika/data/orders/list", method: "GET", expected_scope: "wika_orders_read", known_required_params: "", pagination_rule: "page_size optional", date_window_rule: "n/a", prior_status: "validated_route", source_of_truth: "已上线能力复用清单 + app.js", buildRequest: () => ({ pathname: "/integrations/alibaba/wika/data/orders/list", query: { page_size: 2 } }), sampleParams: () => ({ page_size: 2 }), evaluate: (r) => evaluateJsonRoute(r, ["items"], "orders_list") },
    { route: "/integrations/alibaba/wika/data/orders/detail", module: "orders", endpoint: "/integrations/alibaba/wika/data/orders/detail", method: "GET", expected_scope: "wika_orders_read", known_required_params: "e_trade_id", pagination_rule: "n/a", date_window_rule: "n/a", prior_status: "route_exists_contract_sensitive", source_of_truth: "订单参数契约对账 + app.js", buildRequest: () => ({ pathname: "/integrations/alibaba/wika/data/orders/detail", query: { e_trade_id: samples.trade_id } }), sampleParams: () => ({ e_trade_id: "sample_trade_id" }), evaluate: (r) => evaluateJsonRoute(r, ["trade_id", "trade_status", "total_amount"], "orders_detail") },
    { route: "/integrations/alibaba/wika/data/orders/fund", module: "orders", endpoint: "/integrations/alibaba/wika/data/orders/fund", method: "GET", expected_scope: "wika_orders_read", known_required_params: "e_trade_id,data_select", pagination_rule: "n/a", date_window_rule: "n/a", prior_status: "route_exists_contract_sensitive", source_of_truth: "订单参数契约对账 + app.js", buildRequest: () => ({ pathname: "/integrations/alibaba/wika/data/orders/fund", query: { e_trade_id: samples.trade_id, data_select: "fund_serviceFee,fund_fundPay" } }), sampleParams: () => ({ e_trade_id: "sample_trade_id", data_select: "fund_serviceFee,fund_fundPay" }), evaluate: (r) => evaluateJsonRoute(r, ["service_fee", "fund_pay_list", "trade_id"], "orders_fund") },
    { route: "/integrations/alibaba/wika/data/orders/logistics", module: "orders", endpoint: "/integrations/alibaba/wika/data/orders/logistics", method: "GET", expected_scope: "wika_orders_read", known_required_params: "e_trade_id,data_select", pagination_rule: "n/a", date_window_rule: "n/a", prior_status: "route_exists_contract_sensitive", source_of_truth: "订单参数契约对账 + app.js", buildRequest: () => ({ pathname: "/integrations/alibaba/wika/data/orders/logistics", query: { e_trade_id: samples.trade_id, data_select: "logistic_order" } }), sampleParams: () => ({ e_trade_id: "sample_trade_id", data_select: "logistic_order" }), evaluate: (r) => evaluateJsonRoute(r, ["trade_id", "logistic_order_list", "logistics"], "orders_logistics") },
    { route: "/integrations/alibaba/wika/data/orders/draft-types", module: "orders", endpoint: "/integrations/alibaba/wika/data/orders/draft-types", method: "GET", expected_scope: "wika_orders_read", known_required_params: "", pagination_rule: "n/a", date_window_rule: "n/a", prior_status: "validated_probe_route", source_of_truth: "已上线能力复用清单 + app.js", buildRequest: () => ({ pathname: "/integrations/alibaba/wika/data/orders/draft-types" }), sampleParams: () => ({}), evaluate: (r) => evaluateJsonRoute(r, ["draft_types", "types", "items"], "orders_draft_types") },
    { route: "/integrations/alibaba/wika/reports/products/management-summary", module: "reports", endpoint: "/integrations/alibaba/wika/reports/products/management-summary", method: "GET", expected_scope: "wika_reports_read", known_required_params: "", pagination_rule: "page_size optional", date_window_rule: "n/a", prior_status: "validated_report_route", source_of_truth: "已上线能力复用清单 + app.js", buildRequest: () => ({ pathname: "/integrations/alibaba/wika/reports/products/management-summary", query: { page_size: 5 } }), sampleParams: () => ({ page_size: 5 }), evaluate: (r) => evaluateJsonRoute(r, ["summary", "product_count", "avg_score", "quality_distribution"], "products_management_summary") },
    { route: "/integrations/alibaba/wika/reports/products/minimal-diagnostic", module: "reports", endpoint: "/integrations/alibaba/wika/reports/products/minimal-diagnostic", method: "GET", expected_scope: "wika_reports_read", known_required_params: "", pagination_rule: "sample-limited", date_window_rule: "n/a", prior_status: "validated_report_route", source_of_truth: "已上线能力复用清单 + app.js", buildRequest: () => ({ pathname: "/integrations/alibaba/wika/reports/products/minimal-diagnostic", query: { product_page_size: 5, product_score_limit: 3, product_detail_limit: 3 } }), sampleParams: () => ({ product_page_size: 5, product_score_limit: 3, product_detail_limit: 3 }), evaluate: (r) => evaluateJsonRoute(r, ["score_summary", "recommendations", "missing_data_blockers"], "products_minimal_diagnostic") },
    { route: "/integrations/alibaba/wika/reports/orders/minimal-diagnostic", module: "reports", endpoint: "/integrations/alibaba/wika/reports/orders/minimal-diagnostic", method: "GET", expected_scope: "wika_reports_read", known_required_params: "", pagination_rule: "sample-limited", date_window_rule: "n/a", prior_status: "validated_report_route", source_of_truth: "已上线能力复用清单 + app.js", buildRequest: () => ({ pathname: "/integrations/alibaba/wika/reports/orders/minimal-diagnostic", query: { order_page_size: 5, order_sample_limit: 3 } }), sampleParams: () => ({ order_page_size: 5, order_sample_limit: 3 }), evaluate: (r) => evaluateJsonRoute(r, ["logistics_summary", "fund_signal_summary", "operational_risks"], "orders_minimal_diagnostic") },
    { route: "/integrations/alibaba/wika/reports/operations/minimal-diagnostic", module: "reports", endpoint: "/integrations/alibaba/wika/reports/operations/minimal-diagnostic", method: "GET", expected_scope: "wika_reports_read", known_required_params: "", pagination_rule: "sample-limited", date_window_rule: "n/a", prior_status: "validated_report_route", source_of_truth: "已上线能力复用清单 + app.js", buildRequest: () => ({ pathname: "/integrations/alibaba/wika/reports/operations/minimal-diagnostic", query: { product_page_size: 5, product_score_limit: 3, product_detail_limit: 3, order_page_size: 5, order_sample_limit: 3 } }), sampleParams: () => ({ product_page_size: 5, product_score_limit: 3, product_detail_limit: 3, order_page_size: 5, order_sample_limit: 3 }), evaluate: (r) => evaluateJsonRoute(r, ["product_diagnostic", "order_diagnostic", "missing_data_blockers"], "operations_minimal_diagnostic") },
    { route: "/integrations/alibaba/wika/tools/reply-draft", module: "tools", endpoint: "/integrations/alibaba/wika/tools/reply-draft", method: "POST", expected_scope: "wika_external_draft_only", known_required_params: "inquiry_text", pagination_rule: "n/a", date_window_rule: "n/a", prior_status: "validated_tool_route", source_of_truth: "已上线能力复用清单 + app.js", buildRequest: () => ({ pathname: "/integrations/alibaba/wika/tools/reply-draft", method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ inquiry_text: "TEST / DO-NOT-USE / stage22", product_ids: [samples.product_string_id], quantity: 100, destination_country: "US" }) }), sampleParams: () => ({ inquiry_text: "TEST / DO-NOT-USE / stage22", product_ids: ["sample_product_string_id"], quantity: 100, destination_country: "US" }), evaluate: (r) => evaluateJsonRoute(r, ["workflow_profile", "template_version", "hard_blockers", "reply_draft"], "tools_reply_draft") },
    { route: "/integrations/alibaba/wika/tools/order-draft", module: "tools", endpoint: "/integrations/alibaba/wika/tools/order-draft", method: "POST", expected_scope: "wika_external_draft_only", known_required_params: "line_items", pagination_rule: "n/a", date_window_rule: "n/a", prior_status: "validated_tool_route", source_of_truth: "已上线能力复用清单 + app.js", buildRequest: () => ({ pathname: "/integrations/alibaba/wika/tools/order-draft", method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ buyer_summary: { company_name: "TEST BUYER / DO-NOT-USE" }, line_items: [{ product_id: samples.product_string_id, quantity: 100 }], destination: "US" }) }), sampleParams: () => ({ buyer_summary: { company_name: "TEST BUYER / DO-NOT-USE" }, line_items: [{ product_id: "sample_product_string_id", quantity: 100 }], destination: "US" }), evaluate: (r) => evaluateJsonRoute(r, ["workflow_profile", "template_version", "required_manual_fields", "order_draft_package"], "tools_order_draft") }
  ];
}

async function runWikaAttempt(definition, round) {
  const response = await fetchRoute(definition.buildRequest(round));
  const evaluation = definition.evaluate(response, round);
  assertAllowed(evaluation.classification, WIKA_ALLOWED, definition.route);
  return {
    route: definition.route,
    round,
    request_param_summary: sanitizeNode(definition.sampleParams(round)),
    status_code: response.statusCode,
    error_code:
      response.jsonBody?.top_error?.sub_code ||
      response.jsonBody?.top_error?.code ||
      response.jsonBody?.response_meta?.msg_code ||
      response.jsonBody?.error_category ||
      response.error?.name ||
      null,
    response_shape_summary: summarizeRouteResponse(response),
    elapsed_ms: response.elapsedMs,
    retry_count: 0,
    final_classification: evaluation.classification,
    root_cause_hypothesis: evaluation.rootCause,
    next_action: evaluation.nextAction
  };
}

async function runWikaReplay() {
  const gateResponses = {
    health: await fetchRoute({ pathname: "/health" }),
    authDebug: await fetchRoute({ pathname: "/integrations/alibaba/auth/debug" }),
    wikaProducts: await fetchRoute({
      pathname: "/integrations/alibaba/wika/data/products/list",
      query: { page_size: 1 }
    }),
    wikaOrders: await fetchRoute({
      pathname: "/integrations/alibaba/wika/data/orders/list",
      query: { page_size: 1 }
    })
  };

  const baseSmoke = [
    {
      route: "/health",
      route_type: "runtime",
      current_status: buildBaseGateStatus(gateResponses.health, "health"),
      evidence: summarizeRouteResponse(gateResponses.health)
    },
    {
      route: "/integrations/alibaba/auth/debug",
      route_type: "runtime",
      current_status: buildBaseGateStatus(gateResponses.authDebug, "auth_debug"),
      evidence: summarizeRouteResponse(gateResponses.authDebug)
    },
    {
      route: "/integrations/alibaba/wika/data/products/list?page_size=1",
      route_type: "business",
      current_status: buildBaseGateStatus(gateResponses.wikaProducts, "list"),
      evidence: summarizeRouteResponse(gateResponses.wikaProducts)
    },
    {
      route: "/integrations/alibaba/wika/data/orders/list?page_size=1",
      route_type: "business",
      current_status: buildBaseGateStatus(gateResponses.wikaOrders, "list"),
      evidence: summarizeRouteResponse(gateResponses.wikaOrders)
    }
  ];

  const passBase = baseSmoke.every((item) => item.current_status === "PASS_BASE");
  const provenance = {
    deployment_provenance: "not_proven_but_service_healthy",
    note:
      "No low-cost deployment fingerprint was available, but health/auth-debug/representative WIKA routes all responded at interface level."
  };

  if (!passBase) {
    return {
      baseSmoke,
      passBase,
      provenance,
      samples: null,
      finalRows: [],
      round1: [],
      round2: [],
      round3: []
    };
  }

  const seedProducts = await fetchRoute({
    pathname: "/integrations/alibaba/wika/data/products/list",
    query: { page_size: 2 }
  });
  const seedOrders = await fetchRoute({
    pathname: "/integrations/alibaba/wika/data/orders/list",
    query: { page_size: 2 }
  });
  const samples = collectWikaSamples(seedProducts.jsonBody, seedOrders.jsonBody);
  const definitions = buildWikaRouteDefinitions(samples);

  const round1 = [];
  for (const definition of definitions) {
    round1.push(await runWikaAttempt(definition, 1));
  }

  const round2 = [];
  for (const item of round1) {
    if (!["PARAM_MISSING", "RATE_LIMITED", "UNKNOWN", "FLAKY"].includes(item.final_classification)) {
      continue;
    }
    const definition = definitions.find((entry) => entry.route === item.route);
    if (definition) {
      round2.push(await runWikaAttempt(definition, 2));
    }
  }

  const round3 = [];
  for (const item of round2) {
    if (!["RECONFIRMED", "FLAKY"].includes(item.final_classification)) {
      continue;
    }
    const definition = definitions.find((entry) => entry.route === item.route);
    if (definition) {
      round3.push(await runWikaAttempt(definition, 3));
    }
  }

  const finalRows = definitions.map((definition) => {
    const r1 = round1.find((item) => item.route === definition.route) || null;
    const r2 = round2.find((item) => item.route === definition.route) || null;
    const r3 = round3.find((item) => item.route === definition.route) || null;
    const finalResult = r3 || r2 || r1;
    return {
      platform: "WIKA",
      phase: "stage22",
      module: definition.module,
      endpoint: definition.endpoint,
      method: definition.method,
      auth_profile: "standard",
      expected_scope: definition.expected_scope,
      known_required_params: definition.known_required_params,
      pagination_rule: definition.pagination_rule,
      date_window_rule: definition.date_window_rule,
      prior_status: definition.prior_status,
      source_of_truth: definition.source_of_truth,
      execution_mode: "production_replay",
      round1_status_code: r1?.status_code ?? null,
      round1_error_code: r1?.error_code ?? null,
      round1_response_shape_summary: r1?.response_shape_summary ?? null,
      round1_elapsed_ms: r1?.elapsed_ms ?? null,
      round1_final_classification: r1?.final_classification ?? null,
      round2_status_code: r2?.status_code ?? null,
      round2_error_code: r2?.error_code ?? null,
      round2_response_shape_summary: r2?.response_shape_summary ?? null,
      round2_elapsed_ms: r2?.elapsed_ms ?? null,
      round2_final_classification: r2?.final_classification ?? null,
      round3_status_code: r3?.status_code ?? null,
      round3_error_code: r3?.error_code ?? null,
      round3_response_shape_summary: r3?.response_shape_summary ?? null,
      round3_elapsed_ms: r3?.elapsed_ms ?? null,
      round3_final_classification: r3?.final_classification ?? null,
      final_classification: finalResult?.final_classification ?? "UNKNOWN",
      root_cause_hypothesis: finalResult?.root_cause_hypothesis ?? null,
      next_action: finalResult?.next_action ?? "none"
    };
  });

  return { baseSmoke, passBase, provenance, samples: sanitizeNode(samples), round1, round2, round3, finalRows };
}

function classifyXdError(rawText) {
  const raw = String(rawText || "").toLowerCase();
  if (raw.includes("insufficientpermission") || raw.includes("permission")) {
    return "PERMISSION_DENIED";
  }
  if (raw.includes("missingparameter") || raw.includes("invalid-parameter") || raw.includes("parameter") || raw.includes("tradeid is invalid") || raw.includes("query params is null") || raw.includes("record does not exist")) {
    return "PARAM_MISSING";
  }
  if (raw.includes("deprecated")) {
    return "DEPRECATED";
  }
  if (raw.includes("429")) {
    return "RATE_LIMITED";
  }
  return "UNKNOWN";
}

function buildXdResultRow(apiName, module, expectedScope, requestParamSummary, response, classification) {
  assertAllowed(classification, XD_ALLOWED, apiName);
  return {
    platform: "XD",
    phase: "stage22",
    module,
    endpoint_or_method: apiName,
    auth_profile: "standard",
    expected_scope: expectedScope,
    request_param_summary: sanitizeNode(requestParamSummary),
    status_code: response.statusCode,
    error_code: response.body?.error_response?.sub_code || response.body?.error_response?.code || null,
    response_shape_summary: sanitizeNode({
      content_type: response.contentType,
      top_keys: response.body && typeof response.body === "object" ? Object.keys(response.body).slice(0, 12) : [],
      error_response: sanitizeNode(response.body?.error_response || null)
    }),
    elapsed_ms: null,
    retry_count: 0,
    final_classification: classification,
    root_cause_hypothesis:
      classification === "PERMISSION_DENIED"
        ? "standard_scope_denied_at_interface_level"
        : classification === "PARAM_MISSING"
          ? "documented_parameters_still_insufficient_or_invalid"
          : classification === "PASSED"
            ? null
            : "needs_follow_up",
    next_action:
      classification === "PASSED"
        ? "keep_standard_validation_record"
        : classification === "PERMISSION_DENIED"
          ? "record_permission_gap"
          : classification === "PARAM_MISSING"
            ? "inspect_documented_param_contract"
            : "keep_in_unresolved_queue"
  };
}

async function runXdValidation(shouldRun) {
  if (!shouldRun) {
    return { gateSatisfied: false, notRunReason: "WIKA gate not satisfied", results: [] };
  }

  const railwayToken = readRailwayToken();
  const vars = await queryRailwayVariables(railwayToken);
  const accessToken = await refreshAccessToken({
    appKey: String(vars.ALIBABA_XD_CLIENT_ID || "").trim(),
    appSecret: String(vars.ALIBABA_XD_CLIENT_SECRET || "").trim(),
    refreshToken: String(vars.ALIBABA_XD_BOOTSTRAP_REFRESH_TOKEN || "").trim(),
    refreshUrl: getRefreshUrl(vars, "ALIBABA_XD") || getRefreshUrl(vars, "ALIBABA"),
    partnerId: String(vars.ALIBABA_XD_PARTNER_ID || vars.ALIBABA_PARTNER_ID || "").trim()
  });
  const credentials = {
    appKey: String(vars.ALIBABA_XD_CLIENT_ID || "").trim(),
    appSecret: String(vars.ALIBABA_XD_CLIENT_SECRET || "").trim(),
    accessToken
  };

  const xdProducts = await fetchRoute({ pathname: "/integrations/alibaba/xd/data/products/list", query: { page_size: 5 } });
  const xdOrders = await fetchRoute({ pathname: "/integrations/alibaba/xd/data/orders/list", query: { page_size: 5 } });
  const sampleIds = {
    product_id_numeric: extractFirstArrayItem(xdProducts.jsonBody?.items)?.id ?? null,
    trade_id: extractFirstArrayItem(xdOrders.jsonBody?.items)?.trade_id ?? null
  };
  const now = new Date();
  const dateRange = {
    start_date: new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10),
    end_date: new Date(now.getTime() - 86400000).toISOString().slice(0, 10)
  };

  const apiCalls = [
    ["alibaba.mydata.overview.date.get", "metrics", {}, "xd_mydata_read"],
    ["alibaba.mydata.overview.industry.get", "metrics", { date_range: dateRange }, "xd_mydata_read"],
    ["alibaba.mydata.overview.indicator.basic.get", "metrics", { date_range: dateRange }, "xd_mydata_read"],
    ["alibaba.mydata.self.product.date.get", "metrics", { statistics_type: "day" }, "xd_mydata_read"],
    ["alibaba.mydata.self.product.get", "metrics", { statistics_type: "day", stat_date: dateRange.end_date, ...(sampleIds.product_id_numeric ? { product_ids: sampleIds.product_id_numeric } : {}) }, "xd_mydata_read"],
    ["alibaba.seller.order.get", "orders", sampleIds.trade_id ? { e_trade_id: sampleIds.trade_id } : {}, "xd_orders_read"],
    ["alibaba.seller.order.fund.get", "orders", sampleIds.trade_id ? { e_trade_id: sampleIds.trade_id, data_select: "fund_serviceFee,fund_fundPay" } : {}, "xd_orders_read"],
    ["alibaba.seller.order.logistics.get", "orders", sampleIds.trade_id ? { e_trade_id: sampleIds.trade_id, data_select: "logistic_order" } : {}, "xd_orders_read"]
  ];

  const results = [];
  for (const [apiName, module, params, expectedScope] of apiCalls) {
    const response = await callSyncApi({
      apiName,
      appKey: credentials.appKey,
      appSecret: credentials.appSecret,
      accessToken: credentials.accessToken,
      businessParams: params
    });
    let classification = "UNKNOWN";
    if (!response.body || typeof response.body !== "object") {
      classification = response.statusCode === 429 ? "RATE_LIMITED" : "UNKNOWN";
    } else if (response.body.error_response) {
      classification = classifyXdError([
        response.body.error_response.code,
        response.body.error_response.sub_code,
        response.body.error_response.msg,
        response.body.error_response.sub_msg
      ].filter(Boolean).join(" | "));
    } else {
      classification = "PASSED";
    }
    results.push(buildXdResultRow(apiName, module, expectedScope, params, response, classification));
  }

  return { gateSatisfied: true, notRunReason: null, sampleIds: sanitizeNode(sampleIds), results };
}

async function main() {
  const generatedAt = nowIso();
  const wika = await runWikaReplay();
  const xdGateSatisfied =
    wika.passBase &&
    wika.round1.length === 27 &&
    wika.finalRows.filter((item) => item.final_classification !== "BLOCKED_ENV").length >= 24;
  const xd = await runXdValidation(xdGateSatisfied);

  writeJson(SUMMARY_JSON_PATH, {
    generated_at: generatedAt,
    base_pass: wika.passBase,
    deployment_provenance: wika.provenance.deployment_provenance,
    wika: sanitizeNode({
      base_smoke: wika.baseSmoke,
      samples: wika.samples,
      round1: wika.round1,
      round2: wika.round2,
      round3: wika.round3,
      final_rows: wika.finalRows
    }),
    xd: sanitizeNode(xd)
  });
  writeText(
    WIKA_REPLAY_MATRIX_PATH,
    toCsv(
      [
        "platform","phase","module","endpoint","method","auth_profile","expected_scope","known_required_params","pagination_rule","date_window_rule","prior_status","source_of_truth","execution_mode","round1_status_code","round1_error_code","round1_response_shape_summary","round1_elapsed_ms","round1_final_classification","round2_status_code","round2_error_code","round2_response_shape_summary","round2_elapsed_ms","round2_final_classification","round3_status_code","round3_error_code","round3_response_shape_summary","round3_elapsed_ms","round3_final_classification","final_classification","root_cause_hypothesis","next_action"
      ],
      wika.finalRows
    )
  );
  writeText(
    XD_API_MATRIX_PATH,
    toCsv(
      [
        "platform","phase","module","endpoint_or_method","auth_profile","expected_scope","request_param_summary","status_code","error_code","response_shape_summary","elapsed_ms","retry_count","final_classification","root_cause_hypothesis","next_action"
      ],
      xd.results
    )
  );

  console.log(JSON.stringify({
    ok: true,
    generated_at: generatedAt,
    base_pass: wika.passBase,
    deployment_provenance: wika.provenance.deployment_provenance,
    wika_counts: wika.finalRows.reduce((acc, item) => { acc[item.final_classification] = (acc[item.final_classification] || 0) + 1; return acc; }, {}),
    xd_gate_satisfied: xd.gateSatisfied,
    xd_counts: xd.results.reduce((acc, item) => { acc[item.final_classification] = (acc[item.final_classification] || 0) + 1; return acc; }, {}),
    summary_json: path.relative(ROOT_DIR, SUMMARY_JSON_PATH)
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    fatal: error instanceof Error ? error.message : String(error)
  }, null, 2));
  process.exit(1);
});
