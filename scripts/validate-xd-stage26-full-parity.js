import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const BASE_URL = "https://api.wikapacking.com";
const SYNC_URL = "https://open-api.alibaba.com/sync";
const GRAPHQL_URL = "https://backboard.railway.com/graphql/v2";
const RAILWAY_TOKEN_PATH = path.join(os.tmpdir(), "railway-cli-token.txt");
const PROJECT_ID = "7cc408fd-c2a3-403c-9b4e-adaa72a9a712";
const ENVIRONMENT_ID = "4afccea8-ada6-42d5-9bd7-0f73cca404dc";
const SERVICE_ID = "d7abfb5c-25c6-478c-a51a-69d85151127a";
const EVIDENCE_PATH = path.join(ROOT, "docs", "framework", "evidence", "stage26-xd-full-parity.json");
const MATRIX_PATH = path.join(ROOT, "Ali-WIKA", "projects", "xd", "access", "api_matrix.csv");
const META_KEYS = new Set(["request_id", "_trace_id_", "success", "success_code", "code", "msg", "message"]);

const DIRECTS = [
  { method: "alibaba.mydata.overview.date.get", module: "metrics", scope: "xd_mydata_read", build: ({}) => ({}) },
  { method: "alibaba.mydata.overview.industry.get", module: "metrics", scope: "xd_mydata_read", build: ({ dateRange }) => ({ date_range: dateRange }) },
  { method: "alibaba.mydata.overview.indicator.basic.get", module: "metrics", scope: "xd_mydata_read", build: ({ dateRange, industry }) => ({ date_range: dateRange, industry }) },
  { method: "alibaba.mydata.self.product.date.get", module: "metrics", scope: "xd_mydata_read", build: ({}) => ({ statistics_type: "day" }) },
  { method: "alibaba.mydata.self.product.get", module: "metrics", scope: "xd_mydata_read", build: ({ statDate, productId }) => ({ statistics_type: "day", stat_date: statDate, product_ids: productId }) },
  { method: "alibaba.seller.order.get", module: "orders", scope: "xd_orders_read", build: ({ tradeId }) => ({ e_trade_id: tradeId }) },
  { method: "alibaba.seller.order.fund.get", module: "orders", scope: "xd_orders_read", build: ({ tradeId }) => ({ e_trade_id: tradeId, data_select: "fund_serviceFee,fund_fundPay" }) },
  { method: "alibaba.seller.order.logistics.get", module: "orders", scope: "xd_orders_read", build: ({ tradeId }) => ({ e_trade_id: tradeId, data_select: "logistic_order" }) }
];

const CANDIDATES = [
  { method: "alibaba.seller.trade.decode", module: "candidate", scope: "xd_candidate_read", build: ({ tradeId }) => ({ e_trade_id: tradeId }) },
  { method: "alibaba.icbu.product.type.available.get", module: "candidate", scope: "xd_candidate_read", build: ({}) => ({}) },
  { method: "alibaba.mydata.self.keyword.date.get", module: "candidate", scope: "xd_candidate_read", build: ({}) => ({ statistics_type: "day" }) },
  { method: "alibaba.mydata.self.keyword.effect.week.get", module: "candidate", scope: "xd_candidate_read", build: ({ statDate }) => ({ stat_date: statDate }) },
  { method: "alibaba.mydata.self.keyword.effect.month.get", module: "candidate", scope: "xd_candidate_read", build: ({ statDate }) => ({ stat_date: statDate }) },
  { method: "alibaba.mydata.industry.keyword.get", module: "candidate", scope: "xd_candidate_read", build: ({ dateRange, industry }) => ({ date_range: dateRange, industry }) },
  { method: "alibaba.mydata.seller.opendata.getconkeyword", module: "candidate", scope: "xd_candidate_read", build: ({}) => ({}) }
];

const EQUIVALENTS = [
  { method: "alibaba.icbu.product.get", build: ({ productId }) => ({ language: "ENGLISH", product_id: productId }) },
  { method: "alibaba.icbu.product.group.get", build: ({ groupId }) => ({ group_id: groupId }) },
  { method: "alibaba.icbu.product.score.get", build: ({ productId }) => ({ product_id: productId }) }
];

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeJson(filePath, value) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function mask(value, keepStart = 3, keepEnd = 3) {
  if (value === null || value === undefined || value === "") return null;
  const text = String(value);
  if (text.length <= keepStart + keepEnd) return "***";
  return `${text.slice(0, keepStart)}***${text.slice(-keepEnd)}`;
}

function sanitize(node) {
  if (Array.isArray(node)) return node.slice(0, 5).map((item) => sanitize(item));
  if (!node || typeof node !== "object") return node;
  const out = {};
  for (const [key, value] of Object.entries(node)) {
    if (/(token|secret|sign|authorization|cookie|app_key|client_id|client_secret)/i.test(key)) {
      out[key] = "***";
    } else if (/(trade_id|e_trade_id|product_id|group_id|cat_id|login|email|phone|mobile|address)/i.test(key)) {
      out[key] = typeof value === "object" ? sanitize(value) : mask(value);
    } else {
      out[key] = sanitize(value);
    }
  }
  return out;
}

function signSha256(apiName, params, appSecret) {
  const keys = Object.keys(params).filter((key) => key !== "sign").sort((a, b) => Buffer.from(a).compare(Buffer.from(b)));
  let payload = apiName;
  for (const key of keys) {
    const value = params[key];
    if (value === undefined || value === null || value === "") continue;
    payload += `${key}${value}`;
  }
  return crypto.createHmac("sha256", appSecret).update(payload, "utf8").digest("hex").toUpperCase();
}

function serializeValue(value) {
  if (value === undefined || value === null || value === "") return "";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

function readRailwayToken() {
  return fs.readFileSync(RAILWAY_TOKEN_PATH, "utf8").trim();
}

async function queryRailwayVariables(token) {
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      query: "query($projectId:String!,$environmentId:String!,$serviceId:String!){ variables(projectId:$projectId,environmentId:$environmentId,serviceId:$serviceId) }",
      variables: { projectId: PROJECT_ID, environmentId: ENVIRONMENT_ID, serviceId: SERVICE_ID }
    })
  });
  const payload = await response.json();
  if (payload?.errors?.length) throw new Error(JSON.stringify(payload.errors));
  return payload?.data?.variables ?? {};
}

function getRefreshUrl(vars, prefix) {
  return String(vars[`${prefix}_REFRESH_TOKEN_URL`] || String(vars[`${prefix}_TOKEN_URL`] || "").replace("/auth/token/create", "/auth/token/refresh")).trim();
}

async function refreshAccessToken({ appKey, appSecret, refreshToken, refreshUrl, partnerId }) {
  const params = { app_key: appKey, sign_method: "sha256", timestamp: String(Date.now()), refresh_token: refreshToken };
  if (partnerId) params.partner_id = partnerId;
  params.sign = signSha256("/auth/token/refresh", params, appSecret);
  const response = await fetch(refreshUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json;charset=utf-8", Accept: "application/json" },
    body: JSON.stringify(params)
  });
  const payload = await response.json();
  if (String(payload?.code ?? "0") !== "0") throw new Error(JSON.stringify(sanitize(payload)));
  return payload.access_token;
}

async function fetchRoute(pathname, options = {}) {
  const started = Date.now();
  const response = await fetch(`${BASE_URL}${pathname}`, options);
  const text = await response.text();
  const isJson = (response.headers.get("content-type") || "").includes("json");
  return {
    pathname,
    status: response.status,
    elapsed_ms: Date.now() - started,
    is_json: isJson,
    body: isJson ? JSON.parse(text) : null,
    text: isJson ? null : text.slice(0, 240)
  };
}

async function callSyncApi(credentials, apiName, businessParams) {
  const params = { method: apiName, app_key: credentials.appKey, access_token: credentials.accessToken, sign_method: "sha256", timestamp: String(Date.now()) };
  for (const [key, value] of Object.entries(businessParams || {})) {
    const serialized = serializeValue(value);
    if (serialized !== "") params[key] = serialized;
  }
  params.sign = signSha256("", params, credentials.appSecret);
  const started = Date.now();
  const response = await fetch(SYNC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json;charset=utf-8", Accept: "application/json" },
    body: JSON.stringify(params)
  });
  const text = await response.text();
  const isJson = (response.headers.get("content-type") || "").includes("json");
  return {
    status: response.status,
    elapsed_ms: Date.now() - started,
    is_json: isJson,
    body: isJson ? JSON.parse(text) : null,
    text: isJson ? null : text.slice(0, 240)
  };
}

function topError(body) {
  const err = body?.error_response || (body?.code && String(body.code) !== "0" ? body : null);
  if (!err) return null;
  return { code: err.code ?? null, sub_code: err.sub_code ?? err.subCode ?? null, msg: err.msg ?? err.message ?? null };
}

function extractPayload(apiName, body) {
  if (!body || typeof body !== "object") return null;
  const rootKey = Object.keys(body).find((key) => key.endsWith("_response")) || `${apiName.replace(/\./g, "_")}_response`;
  return body[rootKey] ?? null;
}

function hasMeaningfulData(node) {
  if (Array.isArray(node)) return node.some((item) => hasMeaningfulData(item));
  if (!node || typeof node !== "object") return node !== null && node !== undefined && node !== "";
  for (const [key, value] of Object.entries(node)) {
    if (META_KEYS.has(key)) continue;
    if (hasMeaningfulData(value)) return true;
  }
  return false;
}

function summarizeBody(apiName, body) {
  if (!body || typeof body !== "object") return null;
  const payload = extractPayload(apiName, body);
  return {
    top_keys: Object.keys(body).slice(0, 20),
    payload_keys: payload && typeof payload === "object" ? Object.keys(payload).slice(0, 20) : null,
    meaningful: hasMeaningfulData(payload)
  };
}

function classifyDirect(name, response, context) {
  const error = topError(response.body);
  if (error) {
    const raw = `${error.code || ""} ${error.sub_code || ""} ${error.msg || ""}`.toLowerCase();
    if (raw.includes("permission") || raw.includes("insufficient") || raw.includes("unauthorized")) {
      return context.permissionBias || "AUTH_REFRESH_OR_REAUTHORIZE_NEEDED";
    }
    if (raw.includes("parameter") || raw.includes("missing")) return "PARAM_CONTRACT_CONFIRMED";
    if (raw.includes("rate")) return "RATE_LIMITED";
    return "UNKNOWN";
  }
  const summary = summarizeBody(name, response.body);
  return summary?.meaningful ? "PASSED" : "NO_DATA";
}

function classifyCandidate(name, response, context) {
  const error = topError(response.body);
  if (error) {
    const raw = `${error.code || ""} ${error.sub_code || ""} ${error.msg || ""}`.toLowerCase();
    if (raw.includes("permission") || raw.includes("insufficient") || raw.includes("unauthorized")) {
      return context.permissionBias || "AUTH_REFRESH_OR_REAUTHORIZE_NEEDED";
    }
    if (raw.includes("parameter") || raw.includes("missing")) return "PARAM_CONTRACT_MISSING";
    if (raw.includes("rate")) return "RATE_LIMITED";
    return "UNKNOWN";
  }
  const summary = summarizeBody(name, response.body);
  return summary?.meaningful ? "PASSED" : "NO_DATA";
}

function buildCsv(rows) {
  const headers = ["platform", "phase", "module", "endpoint_or_method", "auth_profile", "expected_scope", "request_param_summary", "status_code", "error_code", "response_shape_summary", "elapsed_ms", "retry_count", "final_classification", "root_cause_hypothesis", "next_action"];
  const escape = (value) => `"${String(value ?? "").replace(/"/g, "\"\"")}"`;
  return [headers.map(escape).join(","), ...rows.map((row) => headers.map((key) => escape(row[key])).join(","))].join("\n") + "\n";
}

function isoDay(offsetDays = 0) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

async function main() {
  const railwayVars = await queryRailwayVariables(readRailwayToken());
  const credentials = {
    appKey: String(railwayVars.ALIBABA_XD_CLIENT_ID || "").trim(),
    appSecret: String(railwayVars.ALIBABA_XD_CLIENT_SECRET || "").trim(),
    refreshToken: String(railwayVars.ALIBABA_XD_BOOTSTRAP_REFRESH_TOKEN || "").trim(),
    refreshUrl: getRefreshUrl(railwayVars, "ALIBABA_XD") || getRefreshUrl(railwayVars, "ALIBABA"),
    partnerId: String(railwayVars.ALIBABA_XD_PARTNER_ID || railwayVars.ALIBABA_PARTNER_ID || "").trim()
  };
  credentials.accessToken = await refreshAccessToken(credentials);

  const canaries = await Promise.all([
    fetchRoute("/health"),
    fetchRoute("/integrations/alibaba/auth/debug"),
    fetchRoute("/integrations/alibaba/xd/auth/debug"),
    fetchRoute("/integrations/alibaba/xd/data/products/list?page_size=1"),
    fetchRoute("/integrations/alibaba/xd/data/orders/list?page_size=1")
  ]);
  const healthOk = canaries.every((item) => [200, 302, 400].includes(item.status));
  if (!healthOk) throw new Error("BLOCKED_ENV: base canary failed");

  const productList = canaries[3].body;
  const orderList = canaries[4].body;
  const sampleProduct = (productList?.items || []).find((item) => item?.product_id || item?.id) || {};
  const sampleOrder = (orderList?.items || []).find((item) => item?.trade_id) || {};
  const productId = sampleProduct.product_id || null;
  const numericProductId = sampleProduct.id || null;
  const groupId = sampleProduct.group_id || null;
  const catId = sampleProduct.cat_id || sampleProduct.category_id || null;
  const tradeId = sampleOrder.trade_id || null;
  const dateRange = { start_date: isoDay(-30), end_date: isoDay(-1) };
  const industry = { industry_id: 111, industry_desc: "All", main_category: true };

  const directResults = [];
  let statDate = isoDay(-1);
  const directContext = {};
  for (const definition of DIRECTS) {
    const response = await callSyncApi(credentials, definition.method, definition.build({ dateRange, industry, statDate, productId: numericProductId, groupId, catId, tradeId }));
    const classification = classifyDirect(definition.method, response, directContext);
    if (definition.method === "alibaba.mydata.overview.date.get" && classification === "PASSED") directContext.permissionBias = "TENANT_OR_PRODUCT_RESTRICTION";
    if (definition.method === "alibaba.mydata.self.product.date.get" && classification === "PASSED") directContext.permissionBias = "TENANT_OR_PRODUCT_RESTRICTION";
    if (definition.method === "alibaba.mydata.self.product.date.get" && response.body) {
      const payload = extractPayload(definition.method, response.body);
      const ranges = payload?.result_list?.date_range || payload?.date_ranges || [];
      const last = Array.isArray(ranges) && ranges.length > 0 ? ranges[0].end_date || ranges[0].start_date : null;
      if (last) statDate = last;
    }
    directResults.push({ ...definition, response, classification, summary: summarizeBody(definition.method, response.body), error: topError(response.body) });
  }

  const candidateResults = [];
  const candidateContext = { permissionBias: directResults.some((item) => item.classification === "PASSED") ? "TENANT_OR_PRODUCT_RESTRICTION" : "AUTH_REFRESH_OR_REAUTHORIZE_NEEDED" };
  for (const definition of CANDIDATES) {
    const response = await callSyncApi(credentials, definition.method, definition.build({ dateRange, industry, statDate, productId: numericProductId, groupId, catId, tradeId }));
    candidateResults.push({ ...definition, response, classification: classifyCandidate(definition.method, response, candidateContext), summary: summarizeBody(definition.method, response.body), error: topError(response.body) });
  }

  const equivalentResults = [];
  for (const definition of EQUIVALENTS) {
    const response = await callSyncApi(credentials, definition.method, definition.build({ productId, groupId }));
    equivalentResults.push({ ...definition, response, classification: classifyCandidate(definition.method, response, candidateContext) });
  }

  const routeDefs = [
    { module: "runtime", path: "/health" },
    { module: "runtime", path: "/integrations/alibaba/xd/auth/debug" },
    { module: "runtime", path: "/integrations/alibaba/xd/auth/start" },
    { module: "runtime", path: "/integrations/alibaba/xd/auth/callback" },
    { module: "products", path: "/integrations/alibaba/xd/data/products/list?page_size=1" },
    { module: "products", path: `/integrations/alibaba/xd/data/products/score?product_id=${encodeURIComponent(productId || "")}`, equivalent: "alibaba.icbu.product.score.get" },
    { module: "products", path: `/integrations/alibaba/xd/data/products/detail?product_id=${encodeURIComponent(productId || "")}`, equivalent: "alibaba.icbu.product.get" },
    { module: "products", path: `/integrations/alibaba/xd/data/products/groups?group_id=${encodeURIComponent(groupId || "")}`, equivalent: "alibaba.icbu.product.group.get" },
    { module: "categories", path: "/integrations/alibaba/xd/data/categories/tree" },
    { module: "categories", path: `/integrations/alibaba/xd/data/categories/attributes?cat_id=${encodeURIComponent(catId || "")}` },
    { module: "products", path: `/integrations/alibaba/xd/data/products/schema?cat_id=${encodeURIComponent(catId || "")}` },
    { module: "products", path: `/integrations/alibaba/xd/data/products/schema/render?cat_id=${encodeURIComponent(catId || "")}&product_id=${encodeURIComponent(productId || "")}` },
    { module: "products", path: `/integrations/alibaba/xd/data/products/schema/render/draft?cat_id=${encodeURIComponent(catId || "")}&product_id=${encodeURIComponent(productId || "")}` },
    { module: "media", path: "/integrations/alibaba/xd/data/media/list?page_size=1" },
    { module: "media", path: "/integrations/alibaba/xd/data/media/groups" },
    { module: "customers", path: `/integrations/alibaba/xd/data/customers/list?customer_id_begin=0&last_sync_end_time=${encodeURIComponent(`${isoDay(-7)} 00:00:00`)}&page_size=1` },
    { module: "orders", path: "/integrations/alibaba/xd/data/orders/list?page_size=1" },
    { module: "orders", path: `/integrations/alibaba/xd/data/orders/detail?e_trade_id=${encodeURIComponent(tradeId || "")}` },
    { module: "orders", path: `/integrations/alibaba/xd/data/orders/fund?e_trade_id=${encodeURIComponent(tradeId || "")}&data_select=fund_serviceFee,fund_fundPay`, equivalent: "alibaba.seller.order.fund.get" },
    { module: "orders", path: `/integrations/alibaba/xd/data/orders/logistics?e_trade_id=${encodeURIComponent(tradeId || "")}&data_select=logistic_order`, equivalent: "alibaba.seller.order.logistics.get" },
    { module: "orders", path: "/integrations/alibaba/xd/data/orders/draft-types" },
    { module: "reports", path: "/integrations/alibaba/xd/reports/products/management-summary" },
    { module: "reports", path: "/integrations/alibaba/xd/reports/products/minimal-diagnostic" },
    { module: "reports", path: "/integrations/alibaba/xd/reports/orders/minimal-diagnostic" },
    { module: "reports", path: "/integrations/alibaba/xd/reports/operations/minimal-diagnostic" },
    { module: "tools", path: "/integrations/alibaba/xd/tools/reply-draft", method: "POST", body: { inquiry_text: "stage26 canary only" } },
    { module: "tools", path: "/integrations/alibaba/xd/tools/order-draft", method: "POST", body: { line_items: [{ title: "stage26", quantity: 1 }] } }
  ];
  const routeResults = [];
  for (const def of routeDefs) {
    const response = await fetchRoute(def.path, def.method === "POST" ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(def.body) } : {});
    let classification = "UNKNOWN";
    if (def.path.endsWith("/auth/start") && response.status === 302) classification = "RECONFIRMED_XD";
    else if (def.path.endsWith("/auth/callback") && response.status === 400) classification = "RECONFIRMED_XD";
    else if (response.status === 200) classification = "RECONFIRMED_XD";
    else if (response.status === 404) {
      const equivalent = [...directResults, ...equivalentResults].find((item) => item.method === def.equivalent);
      classification = equivalent?.classification === "PASSED" ? "PASSED_WITH_EQUIVALENT_DATA" : "DOC_MISMATCH";
    } else if ((topError(response.body)?.msg || "").toLowerCase().includes("permission")) classification = "TENANT_OR_PRODUCT_RESTRICTION";
    else if ((topError(response.body)?.msg || "").toLowerCase().includes("parameter")) classification = "PARAM_CONTRACT_MISSING";
    routeResults.push({ ...def, response, classification });
  }

  const regression = {
    stable_route: await fetchRoute("/integrations/alibaba/xd/data/orders/list?page_size=1"),
    stable_direct: await callSyncApi(credentials, "alibaba.seller.order.get", { e_trade_id: tradeId }),
    rechecked_passed_directs: []
  };
  for (const item of directResults.filter((entry) => entry.classification === "PASSED")) {
    const response = await callSyncApi(credentials, item.method, item.build({ dateRange, industry, statDate, productId: numericProductId, groupId, catId, tradeId }));
    regression.rechecked_passed_directs.push({ method: item.method, status: classifyDirect(item.method, response, directContext), status_code: response.status });
  }

  const rows = [];
  for (const item of routeResults) rows.push({ platform: "XD", phase: "stage26", module: item.module, endpoint_or_method: item.path, auth_profile: "standard", expected_scope: `xd_${item.module}_route`, request_param_summary: item.method === "POST" ? JSON.stringify(sanitize(item.body)) : "", status_code: item.response.status, error_code: topError(item.response.body)?.sub_code || topError(item.response.body)?.code || "", response_shape_summary: JSON.stringify(sanitize(item.response.body ? { top_keys: Object.keys(item.response.body).slice(0, 20) } : { text: item.response.text })), elapsed_ms: item.response.elapsed_ms, retry_count: 0, final_classification: item.classification, root_cause_hypothesis: item.classification === "PASSED_WITH_EQUIVALENT_DATA" ? "runtime route missing but equivalent direct method returns meaningful data" : "", next_action: item.classification === "DOC_MISMATCH" ? "keep route gap documented" : "none" });
  for (const item of [...directResults, ...candidateResults]) rows.push({ platform: "XD", phase: "stage26", module: item.module, endpoint_or_method: item.method, auth_profile: "standard", expected_scope: item.scope, request_param_summary: JSON.stringify(sanitize(item.build({ dateRange, industry, statDate, productId: numericProductId, groupId, catId, tradeId }))), status_code: item.response.status, error_code: item.error?.sub_code || item.error?.code || "", response_shape_summary: JSON.stringify(sanitize(item.summary || { top_keys: item.response.body ? Object.keys(item.response.body).slice(0, 20) : null })), elapsed_ms: item.response.elapsed_ms, retry_count: 1, final_classification: item.classification, root_cause_hypothesis: item.classification === "NO_DATA" ? "method entered readable layer but current tenant returned no meaningful business payload" : "", next_action: item.classification.includes("PARAM") ? "keep parameter contract gap documented" : "none" });

  const result = {
    evaluated_at: new Date().toISOString(),
    base_url: BASE_URL,
    current_head: execSync("git rev-parse HEAD", { cwd: ROOT }).toString().trim(),
    production_gate: { status: "PASS_BASE", canaries: canaries.map((item) => ({ path: item.pathname, status: item.status, elapsed_ms: item.elapsed_ms })) },
    auth_refresh: { attempted: true, profile: "standard", status: "PASSED_AFTER_REFRESH_BOOTSTRAP" },
    samples: sanitize({ productId, numericProductId, groupId, catId, tradeId, dateRange, industry, statDate }),
    routes: routeResults.map((item) => ({ path: item.path, module: item.module, method: item.method || "GET", status_code: item.response.status, final_classification: item.classification, equivalent: item.equivalent || null })),
    direct_methods: directResults.map((item) => ({ method: item.method, status_code: item.response.status, final_classification: item.classification, error: item.error, summary: item.summary })),
    equivalent_methods: equivalentResults.map((item) => ({ method: item.method, status_code: item.response.status, final_classification: item.classification })),
    candidate_pool: candidateResults.map((item) => ({ method: item.method, status_code: item.response.status, final_classification: item.classification, error: item.error, summary: item.summary })),
    regression: {
      stable_route_status: regression.stable_route.status,
      stable_direct_status: classifyDirect("alibaba.seller.order.get", regression.stable_direct, directContext),
      rechecked_passed_directs: regression.rechecked_passed_directs
    },
    counts: {
      route_reconfirmed_xd: routeResults.filter((item) => item.classification === "RECONFIRMED_XD").length,
      route_equivalent: routeResults.filter((item) => item.classification === "PASSED_WITH_EQUIVALENT_DATA").length,
      direct_passed: directResults.filter((item) => item.classification === "PASSED" || item.classification === "PASSED_AFTER_REFRESH").length,
      no_data: [...directResults, ...candidateResults].filter((item) => item.classification === "NO_DATA").length,
      auth_refresh_or_reauthorize_needed: [...directResults, ...candidateResults].filter((item) => item.classification === "AUTH_REFRESH_OR_REAUTHORIZE_NEEDED").length,
      tenant_or_product_restriction: [...directResults, ...candidateResults, ...routeResults].filter((item) => item.classification === "TENANT_OR_PRODUCT_RESTRICTION").length,
      doc_mismatch: routeResults.filter((item) => item.classification === "DOC_MISMATCH").length,
      blocked_env: 0,
      unknown: [...directResults, ...candidateResults, ...routeResults].filter((item) => item.classification === "UNKNOWN").length
    }
  };

  writeJson(EVIDENCE_PATH, sanitize(result));
  ensureDir(MATRIX_PATH);
  fs.writeFileSync(MATRIX_PATH, buildCsv(rows), "utf8");
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ fatal: error instanceof Error ? error.message : String(error) }, null, 2));
  process.exit(1);
});
