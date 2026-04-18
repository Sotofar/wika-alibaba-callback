import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";

export const ROOT = process.cwd();
export const BASE_URL = "https://api.wikapacking.com";
export const SYNC_URL = "https://open-api.alibaba.com/sync";
export const GRAPHQL_URL = "https://backboard.railway.com/graphql/v2";
export const RAILWAY_TOKEN_PATH = path.join(os.tmpdir(), "railway-cli-token.txt");
export const PROJECT_ID = "7cc408fd-c2a3-403c-9b4e-adaa72a9a712";
export const ENVIRONMENT_ID = "4afccea8-ada6-42d5-9bd7-0f73cca404dc";
export const SERVICE_ID = "d7abfb5c-25c6-478c-a51a-69d85151127a";

export const STAGE30_EVIDENCE_PATH = path.join(
  ROOT,
  "docs",
  "framework",
  "evidence",
  "stage30-safe-scope-freeze.json"
);
export const STAGE31_EVIDENCE_PATH = path.join(
  ROOT,
  "docs",
  "framework",
  "evidence",
  "stage31-xd-productization.json"
);
export const WEEKLY_REPORT_EVIDENCE_PATH = path.join(
  ROOT,
  "docs",
  "framework",
  "evidence",
  "xd_weekly_operations_report_stage31.json"
);
export const WEEKLY_REPORT_PATH = path.join(
  ROOT,
  "Ali-WIKA",
  "projects",
  "xd",
  "access",
  "XD_WEEKLY_OPERATIONS_REPORT_STAGE31.md"
);
export const LEDGER_MD_PATH = path.join(
  ROOT,
  "Ali-WIKA",
  "projects",
  "xd",
  "access",
  "XD_PERMISSION_AND_CAPABILITY_LEDGER_STAGE31.md"
);
export const LEDGER_CSV_PATH = path.join(
  ROOT,
  "Ali-WIKA",
  "projects",
  "xd",
  "access",
  "xd_permission_capability_ledger_stage31.csv"
);
export const REPORTS_DIR = path.join(ROOT, "Ali-WIKA", "projects", "xd", "access", "reports");
export const MONITORING_RUNS_DIR = path.join(
  ROOT,
  "Ali-WIKA",
  "projects",
  "xd",
  "access",
  "monitoring",
  "runs"
);
export const API_MATRIX_PATH = path.join(ROOT, "Ali-WIKA", "projects", "xd", "access", "api_matrix.csv");
export const API_COVERAGE_PATH = path.join(ROOT, "Ali-WIKA", "projects", "xd", "access", "api_coverage.md");
export const PERMISSION_GAP_PATH = path.join(ROOT, "Ali-WIKA", "projects", "xd", "access", "permission_gap.md");

const META_KEYS = new Set([
  "request_id",
  "_trace_id_",
  "success",
  "success_code",
  "code",
  "msg",
  "message",
  "trace_id",
  "biz_success",
  "msg_code"
]);

export function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

export function writeText(filePath, text) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, text, "utf8");
}

export function writeJson(filePath, value) {
  writeText(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

export function exists(filePath) {
  return fs.existsSync(filePath);
}

export function mask(value, keepStart = 3, keepEnd = 3) {
  if (value === null || value === undefined || value === "") return null;
  const text = String(value);
  if (text.length <= keepStart + keepEnd) return "***";
  return `${text.slice(0, keepStart)}***${text.slice(-keepEnd)}`;
}

export function sanitize(node) {
  if (Array.isArray(node)) return node.slice(0, 10).map((item) => sanitize(item));
  if (!node || typeof node !== "object") return node;
  const out = {};
  for (const [key, value] of Object.entries(node)) {
    if (/(token|secret|sign|authorization|cookie|app_key|client_id|client_secret)/i.test(key)) {
      out[key] = "***";
    } else if (
      /(trade_id|e_trade_id|product_id|group_id|cat_id|encryptor_id|login|email|phone|mobile|address|immutable_eid|account_id)/i.test(
        key
      )
    ) {
      out[key] = typeof value === "object" ? sanitize(value) : mask(value);
    } else {
      out[key] = sanitize(value);
    }
  }
  return out;
}

export function parseArgs(argv = process.argv.slice(2)) {
  const parsed = {};
  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const body = arg.slice(2);
    if (!body.includes("=")) {
      parsed[body] = true;
      continue;
    }
    const splitAt = body.indexOf("=");
    const key = body.slice(0, splitAt);
    const value = body.slice(splitAt + 1);
    parsed[key] = value;
  }
  return parsed;
}

export function getCurrentHead() {
  return execSync("git rev-parse HEAD", { cwd: ROOT, encoding: "utf8" }).trim();
}

export async function fetchRoute(pathname, options = {}) {
  const timeoutMs = Number(options.timeoutMs || 20000);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    const response = await fetch(`${BASE_URL}${pathname}`, {
      method: options.method || "GET",
      headers: options.headers || {},
      body: options.body,
      signal: controller.signal
    });
    const text = await response.text();
    const isJson = (response.headers.get("content-type") || "").includes("json");
    return {
      pathname,
      status: response.status,
      elapsed_ms: Date.now() - started,
      ok: response.ok,
      is_json: isJson,
      body: isJson ? sanitize(JSON.parse(text)) : null,
      raw_body: isJson ? JSON.parse(text) : null,
      text: isJson ? null : text.slice(0, 320),
      error: null
    };
  } catch (error) {
    return {
      pathname,
      status: null,
      elapsed_ms: Date.now() - started,
      ok: false,
      is_json: false,
      body: null,
      raw_body: null,
      text: null,
      error: error?.name === "AbortError" ? "timeout" : String(error?.message || error)
    };
  } finally {
    clearTimeout(timer);
  }
}

export function signSha256(apiName, params, appSecret) {
  const keys = Object.keys(params)
    .filter((key) => key !== "sign")
    .sort((left, right) => Buffer.from(left).compare(Buffer.from(right)));
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

export function readRailwayToken() {
  return fs.readFileSync(RAILWAY_TOKEN_PATH, "utf8").trim();
}

export async function queryRailwayVariables(token) {
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
  if (payload?.errors?.length) {
    throw new Error(JSON.stringify(sanitize(payload.errors)));
  }
  return payload?.data?.variables ?? {};
}

export function getRefreshUrl(vars, prefix) {
  return String(
    vars[`${prefix}_REFRESH_TOKEN_URL`] ||
      String(vars[`${prefix}_TOKEN_URL`] || "").replace("/auth/token/create", "/auth/token/refresh")
  ).trim();
}

export async function refreshAccessToken({ appKey, appSecret, refreshToken, refreshUrl, partnerId }) {
  const params = {
    app_key: appKey,
    sign_method: "sha256",
    timestamp: String(Date.now()),
    refresh_token: refreshToken
  };
  if (partnerId) params.partner_id = partnerId;
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
    throw new Error(JSON.stringify(sanitize(payload)));
  }
  return payload.access_token;
}

export async function getXdCredentials() {
  const railwayVars = await queryRailwayVariables(readRailwayToken());
  const credentials = {
    appKey: String(railwayVars.ALIBABA_XD_CLIENT_ID || "").trim(),
    appSecret: String(railwayVars.ALIBABA_XD_CLIENT_SECRET || "").trim(),
    refreshToken: String(railwayVars.ALIBABA_XD_BOOTSTRAP_REFRESH_TOKEN || "").trim(),
    refreshUrl: getRefreshUrl(railwayVars, "ALIBABA_XD") || getRefreshUrl(railwayVars, "ALIBABA"),
    partnerId: String(railwayVars.ALIBABA_XD_PARTNER_ID || railwayVars.ALIBABA_PARTNER_ID || "").trim()
  };
  credentials.accessToken = await refreshAccessToken(credentials);
  return credentials;
}

export async function callSyncApi(credentials, apiName, businessParams) {
  const params = {
    method: apiName,
    app_key: credentials.appKey,
    access_token: credentials.accessToken,
    sign_method: "sha256",
    timestamp: String(Date.now())
  };
  for (const [key, value] of Object.entries(businessParams || {})) {
    const serialized = serializeValue(value);
    if (serialized !== "") params[key] = serialized;
  }
  params.sign = signSha256("", params, credentials.appSecret);
  const started = Date.now();
  try {
    const response = await fetch(SYNC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=utf-8",
        Accept: "application/json"
      },
      body: JSON.stringify(params)
    });
    const text = await response.text();
    const isJson = (response.headers.get("content-type") || "").includes("json");
    const rawBody = isJson ? JSON.parse(text) : null;
    return {
      api_name: apiName,
      status: response.status,
      elapsed_ms: Date.now() - started,
      ok: response.ok,
      is_json: isJson,
      body: isJson ? sanitize(rawBody) : null,
      raw_body: rawBody,
      text: isJson ? null : text.slice(0, 320),
      error: null
    };
  } catch (error) {
    return {
      api_name: apiName,
      status: null,
      elapsed_ms: Date.now() - started,
      ok: false,
      is_json: false,
      body: null,
      raw_body: null,
      text: null,
      error: String(error?.message || error)
    };
  }
}

export function topError(body) {
  const error = body?.error_response || (body?.code && String(body.code) !== "0" ? body : null);
  if (!error) return null;
  return {
    code: error.code ?? null,
    sub_code: error.sub_code ?? error.subCode ?? null,
    msg: error.msg ?? error.message ?? null
  };
}

export function extractSyncPayload(apiName, body) {
  if (!body || typeof body !== "object") return null;
  const responseKey = Object.keys(body).find((key) => key.endsWith("_response"));
  if (responseKey) return body[responseKey];
  const fallbackKey = `${apiName.replace(/\./g, "_")}_response`;
  return body[fallbackKey] ?? null;
}

export function hasMeaningfulData(node) {
  if (Array.isArray(node)) return node.some((item) => hasMeaningfulData(item));
  if (!node || typeof node !== "object") return node !== null && node !== undefined && node !== "";
  for (const [key, value] of Object.entries(node)) {
    if (META_KEYS.has(key)) continue;
    if (hasMeaningfulData(value)) return true;
  }
  return false;
}

export function summarizeSyncBody(apiName, body) {
  if (!body || typeof body !== "object") return null;
  const payload = extractSyncPayload(apiName, body);
  return {
    top_keys: Object.keys(body).slice(0, 20),
    payload_keys: payload && typeof payload === "object" ? Object.keys(payload).slice(0, 20) : null,
    meaningful: hasMeaningfulData(payload)
  };
}

export function pickFirstArrayValue(node, candidateKeys) {
  if (!node || typeof node !== "object") return [];
  for (const key of candidateKeys) {
    if (Array.isArray(node[key])) return node[key];
  }
  return [];
}

export function pickTradeId(listBody) {
  const items = listBody?.items || [];
  return items.find((item) => item?.trade_id)?.trade_id ?? null;
}

export function pickProductSample(listBody) {
  const items = listBody?.items || [];
  const item =
    items.find((entry) => entry?.group_id && (entry?.id || entry?.product_id)) ||
    items.find((entry) => entry?.id || entry?.product_id) ||
    null;
  return {
    productId: item?.id ?? item?.product_id ?? null,
    groupId: item?.group_id ?? null,
    categoryId: item?.category_id ?? null
  };
}

export function formatIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function getTimeZoneParts(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short"
  });
  const parts = formatter.formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    weekday: values.weekday
  };
}

export function getLastCompleteNaturalWeek(timeZone = "Asia/Shanghai", now = new Date()) {
  const local = getTimeZoneParts(now, timeZone);
  const weekdayMap = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  const weekday = weekdayMap[local.weekday] ?? 1;
  const anchor = new Date(Date.UTC(local.year, local.month - 1, local.day, 12));
  const currentWeekStart = new Date(anchor);
  currentWeekStart.setUTCDate(anchor.getUTCDate() - (weekday - 1));
  const lastWeekStart = new Date(currentWeekStart);
  lastWeekStart.setUTCDate(currentWeekStart.getUTCDate() - 7);
  const lastWeekEnd = new Date(currentWeekStart);
  lastWeekEnd.setUTCDate(currentWeekStart.getUTCDate() - 1);
  return {
    timeZone,
    reference_date: `${local.year}-${String(local.month).padStart(2, "0")}-${String(local.day).padStart(2, "0")}`,
    week_start: formatIsoDate(lastWeekStart),
    week_end: formatIsoDate(lastWeekEnd)
  };
}

export function timestampToDateString(timestamp, timeZone = "Asia/Shanghai") {
  if (!timestamp) return null;
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return formatter.format(new Date(Number(timestamp)));
}

export function isDateWithinRange(dateString, start, end) {
  if (!dateString) return false;
  return dateString >= start && dateString <= end;
}

export function buildSection(title, lines) {
  return [`## ${title}`, ...lines, ""].join("\n");
}

export function toMarkdownList(lines) {
  return lines.map((line) => `- ${line}`);
}

export function safeString(value) {
  if (value === null || value === undefined || value === "") return "not_available";
  return String(value);
}

export function summarizeRouteBody(body) {
  if (!body || typeof body !== "object") return { top_keys: [], meaningful: false };
  const preferred =
    body.item ||
    body.value ||
    body.product ||
    body.product_group ||
    body.category ||
    (Array.isArray(body.items) ? body.items[0] : null) ||
    null;
  return {
    top_keys: Object.keys(body).slice(0, 20),
    nested_keys: preferred && typeof preferred === "object" ? Object.keys(preferred).slice(0, 20) : [],
    meaningful: hasMeaningfulData(preferred || body.items || body)
  };
}

export function classifyDirectMethod(response, apiName) {
  if (response.error) return "UNKNOWN";
  const error = topError(response.raw_body);
  if (error) return "UNKNOWN";
  const summary = summarizeSyncBody(apiName, response.raw_body);
  return summary?.meaningful ? "PASS" : "PASS_NO_DATA";
}

export function scanForSensitiveValues(text) {
  const patterns = [
    /(?:access|refresh)_token["'=:\s]+[A-Za-z0-9\-_.]{12,}/i,
    /client_secret["'=:\s]+[A-Za-z0-9\-_.]{12,}/i,
    /cookie["'=:\s]+[A-Za-z0-9\-_.]{12,}/i,
    /authorization["'=:\s]+bearer\s+[A-Za-z0-9\-_.]{12,}/i
  ];
  return patterns.some((pattern) => pattern.test(text));
}

export function escapeCsv(value) {
  return `"${String(value ?? "").replace(/"/g, "\"\"")}"`;
}

export function buildCsv(headers, rows) {
  return [
    headers.map((header) => escapeCsv(header)).join(","),
    ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(","))
  ].join("\n") + "\n";
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (char === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell.length || row.length) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows.filter((item) => item.length && item.some((cellValue) => cellValue !== ""));
}

export function loadApiMatrixRows() {
  const csv = readText(API_MATRIX_PATH);
  const rows = parseCsv(csv);
  const headers = rows[0] || [];
  return rows.slice(1).map((row) => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = row[index] ?? "";
    });
    return record;
  });
}

export function findBlankOrWaitingMatrixRows(rows) {
  return rows.filter((row) => {
    const status = String(row.final_classification || row.status || "").trim().toLowerCase();
    return !status || status.includes("待确认") || status.includes("下轮再看") || status.includes("awaiting");
  });
}

export async function collectStableSamples(timeoutMs = 20000) {
  const orders = await fetchRoute("/integrations/alibaba/xd/data/orders/list?page_size=10", { timeoutMs });
  const products = await fetchRoute("/integrations/alibaba/xd/data/products/list?page_size=10", { timeoutMs });
  const tradeId = pickTradeId(orders.raw_body);
  const productSample = pickProductSample(products.raw_body);
  return {
    orders,
    products,
    tradeId,
    productId: productSample.productId,
    groupId: productSample.groupId,
    categoryId: productSample.categoryId
  };
}
