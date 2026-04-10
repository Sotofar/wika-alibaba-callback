import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const FRAMEWORK_DIR = path.join(ROOT_DIR, "docs", "framework");
const EVIDENCE_DIR = path.join(FRAMEWORK_DIR, "evidence");

const RAILWAY_TOKEN_PATH = path.join(os.tmpdir(), "railway-cli-token.txt");
const PROJECT_ID = "7cc408fd-c2a3-403c-9b4e-adaa72a9a712";
const ENVIRONMENT_ID = "4afccea8-ada6-42d5-9bd7-0f73cca404dc";
const SERVICE_ID = "d7abfb5c-25c6-478c-a51a-69d85151127a";
const GRAPHQL_URL = "https://backboard.railway.com/graphql/v2";
const SYNC_URL = "https://open-api.alibaba.com/sync";
const PRODUCTION_BASE_URL = "https://api.wikapacking.com";
const MAX_ATTEMPTS = 3;
const PRODUCT_BATCH_LIMIT = 5;

const METHOD_NAMES = Object.freeze({
  OVERVIEW_DATE: "alibaba.mydata.overview.date.get",
  OVERVIEW_INDUSTRY: "alibaba.mydata.overview.industry.get",
  OVERVIEW_BASIC: "alibaba.mydata.overview.indicator.basic.get",
  PRODUCT_DATE: "alibaba.mydata.self.product.date.get",
  PRODUCT_GET: "alibaba.mydata.self.product.get"
});

const CLASSIFICATIONS = Object.freeze({
  REAL_DATA_RETURNED: "REAL_DATA_RETURNED",
  STILL_AUTH_BLOCKED: "STILL_AUTH_BLOCKED",
  ILLEGAL_ACCESS_TOKEN: "ILLEGAL_ACCESS_TOKEN",
  MISSING_ACCESS_TOKEN: "MISSING_ACCESS_TOKEN",
  PARAMETER_REJECTED: "PARAMETER_REJECTED",
  ENVIRONMENT_BLOCKED: "ENVIRONMENT_BLOCKED",
  UPSTREAM_SAMPLE_MISSING: "UPSTREAM_SAMPLE_MISSING",
  AWAITING_WIKA_REAUTH: "AWAITING_WIKA_REAUTH",
  APPKEY_NOT_CONFIRMED: "APPKEY_NOT_CONFIRMED",
  UNKNOWN: "UNKNOWN"
});

const SUMMARY_JSON_PATH = path.join(
  EVIDENCE_DIR,
  "wika-mydata-post-grant-summary.json"
);
const METHOD_EVIDENCE_PATHS = Object.freeze({
  [METHOD_NAMES.OVERVIEW_DATE]: path.join(
    EVIDENCE_DIR,
    "alibaba_mydata_overview_date_get_post_grant.json"
  ),
  [METHOD_NAMES.OVERVIEW_INDUSTRY]: path.join(
    EVIDENCE_DIR,
    "alibaba_mydata_overview_industry_get_post_grant.json"
  ),
  [METHOD_NAMES.OVERVIEW_BASIC]: path.join(
    EVIDENCE_DIR,
    "alibaba_mydata_overview_indicator_basic_get_post_grant.json"
  ),
  [METHOD_NAMES.PRODUCT_DATE]: path.join(
    EVIDENCE_DIR,
    "alibaba_mydata_self_product_date_get_post_grant.json"
  ),
  [METHOD_NAMES.PRODUCT_GET]: path.join(
    EVIDENCE_DIR,
    "alibaba_mydata_self_product_get_post_grant.json"
  )
});

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
    return node.slice(0, 10).map((item) => sanitizeNode(item, parentKey));
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
      /(id|trade_id|product_id|account_id|member|phone|mobile|email|address)/i.test(
        key
      ) &&
      value !== undefined &&
      value !== null &&
      value !== "" &&
      (typeof value === "string" || typeof value === "number")
    ) {
      output[key] =
        typeof value === "number" && /product_id|id/.test(normalizedKey)
          ? value
          : maskValue(value);
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

function serializeValue(value) {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

async function fetchJson(url) {
  const started = Date.now();
  const response = await fetch(url);
  const text = await response.text();
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {}

  return {
    status: response.status,
    elapsed_ms: Date.now() - started,
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
  if (!refreshToken) {
    return {
      ok: false,
      classification: CLASSIFICATIONS.MISSING_ACCESS_TOKEN,
      error: "missing_refresh_token"
    };
  }

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
    const raw =
      `${payload?.code ?? ""} ${payload?.sub_code ?? ""} ${payload?.message ?? payload?.msg ?? ""}`.toLowerCase();
    return {
      ok: false,
      classification:
        raw.includes("token")
          ? CLASSIFICATIONS.ILLEGAL_ACCESS_TOKEN
          : CLASSIFICATIONS.AWAITING_WIKA_REAUTH,
      error: sanitizeNode(payload)
    };
  }

  return {
    ok: true,
    accessToken: payload.access_token,
    response: sanitizeNode({
      code: payload.code ?? null,
      expires_in: payload.expires_in ?? null,
      refresh_expires_in: payload.refresh_expires_in ?? null,
      request_id: payload.request_id ?? null
    })
  };
}

async function callSyncApi({
  apiName,
  appKey,
  appSecret,
  accessToken,
  businessParams
}) {
  const started = Date.now();
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
    body: JSON.stringify(params)
  });

  const text = await response.text();
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {}

  return {
    http_status: response.status,
    elapsed_ms: Date.now() - started,
    is_json: body !== null,
    body,
    text
  };
}

function extractRootPayload(apiName, body = {}) {
  const rootKey = `${apiName.replace(/\./g, "_")}_response`;
  return {
    root_key: rootKey,
    payload: body?.[rootKey] ?? body ?? null
  };
}

function collectAllKeys(node, collector = new Set()) {
  if (Array.isArray(node)) {
    for (const item of node) {
      collectAllKeys(item, collector);
    }
    return collector;
  }

  if (!node || typeof node !== "object") {
    return collector;
  }

  for (const [key, value] of Object.entries(node)) {
    collector.add(key);
    collectAllKeys(value, collector);
  }

  return collector;
}

function collectObjects(node, predicate, collector = []) {
  if (Array.isArray(node)) {
    for (const item of node) {
      collectObjects(item, predicate, collector);
    }
    return collector;
  }

  if (!node || typeof node !== "object") {
    return collector;
  }

  if (predicate(node)) {
    collector.push(node);
  }

  for (const value of Object.values(node)) {
    collectObjects(value, predicate, collector);
  }

  return collector;
}

function collectValuesByKey(node, targetKey, collector = []) {
  if (Array.isArray(node)) {
    for (const item of node) {
      collectValuesByKey(item, targetKey, collector);
    }
    return collector;
  }

  if (!node || typeof node !== "object") {
    return collector;
  }

  for (const [key, value] of Object.entries(node)) {
    if (key === targetKey) {
      collector.push(value);
    }
    collectValuesByKey(value, targetKey, collector);
  }

  return collector;
}

function normalizeTopError(errorResponse = {}) {
  return {
    code: errorResponse.code ?? null,
    sub_code: errorResponse.sub_code ?? null,
    msg: errorResponse.msg ?? errorResponse.message ?? null,
    sub_msg: errorResponse.sub_msg ?? null
  };
}

function extractBusinessFailure(payload) {
  if (payload?.success === false || payload?.biz_success === false) {
    return {
      code: payload?.error_code ?? payload?.code ?? null,
      sub_code: payload?.sub_code ?? null,
      msg: payload?.message ?? payload?.error_message ?? "business failure",
      sub_msg: payload?.sub_msg ?? null
    };
  }

  if (payload?.result?.success === false) {
    return {
      code: payload?.result?.error_code ?? null,
      sub_code: payload?.result?.sub_code ?? null,
      msg:
        payload?.result?.error_message ??
        payload?.result?.message ??
        "business failure",
      sub_msg: payload?.result?.sub_msg ?? null
    };
  }

  return null;
}

function classifyError(error = {}) {
  const raw =
    `${error.code ?? ""} ${error.sub_code ?? ""} ${error.msg ?? ""} ${error.sub_msg ?? ""}`.toLowerCase();

  if (raw.includes("insufficientpermission") || raw.includes("permission")) {
    return CLASSIFICATIONS.STILL_AUTH_BLOCKED;
  }

  if (
    raw.includes("illegalaccesstoken") ||
    raw.includes("invalid access token") ||
    raw.includes("access token") ||
    raw.includes("session") ||
    raw.includes("token invalid")
  ) {
    return CLASSIFICATIONS.ILLEGAL_ACCESS_TOKEN;
  }

  if (raw.includes("missing access token")) {
    return CLASSIFICATIONS.MISSING_ACCESS_TOKEN;
  }

  if (
    raw.includes("missingparameter") ||
    raw.includes("invalid-parameter") ||
    raw.includes("parameter") ||
    raw.includes("illegal parameter") ||
    raw.includes("query params is null") ||
    raw.includes("invalidate request") ||
    raw.includes("invalid request")
  ) {
    return CLASSIFICATIONS.PARAMETER_REJECTED;
  }

  return CLASSIFICATIONS.ENVIRONMENT_BLOCKED;
}

function summarizeResponseShape(apiName, response) {
  if (!response.is_json) {
    return { text_excerpt: String(response.text || "").slice(0, 240) };
  }

  const { root_key, payload } = extractRootPayload(apiName, response.body);
  return sanitizeNode({
    root_key,
    payload_keys: [...collectAllKeys(payload ?? response.body)].sort().slice(0, 60),
    top_level_keys: Object.keys(response.body || {}).slice(0, 20)
  });
}

function evaluateOverviewDate(payload) {
  const ranges = collectObjects(
    payload,
    (item) =>
      item && typeof item === "object" && "start_date" in item && "end_date" in item
  ).map((item) => ({
    start_date: item.start_date ?? null,
    end_date: item.end_date ?? null
  }));

  return {
    confirmed_fields: ranges.length > 0 ? ["start_date", "end_date"] : [],
    data: { date_ranges: ranges.slice(0, 10) },
    should_count_as_real_data: ranges.length > 0
  };
}

function evaluateOverviewIndustry(payload) {
  const items = collectObjects(
    payload,
    (item) =>
      item &&
      typeof item === "object" &&
      ("industry_id" in item || "industry_desc" in item || "main_category" in item)
  ).map((item) => ({
    industry_id: item.industry_id ?? null,
    industry_desc: item.industry_desc ?? null,
    main_category: item.main_category ?? null
  }));

  const confirmed = new Set();
  for (const item of items) {
    if (item.industry_id !== null) {
      confirmed.add("industry_id");
    }
    if (item.industry_desc !== null) {
      confirmed.add("industry_desc");
    }
    if (item.main_category !== null) {
      confirmed.add("main_category");
    }
  }

  return {
    confirmed_fields: [...confirmed],
    data: { industries: items.slice(0, 10) },
    should_count_as_real_data: items.length > 0
  };
}

function evaluateOverviewIndicatorBasic(payload) {
  const targetFields = ["visitor", "imps", "clk", "clk_rate", "fb", "reply"];
  const confirmed = [];
  const extracted = {};

  for (const field of targetFields) {
    const values = collectValuesByKey(payload, field);
    if (values.length > 0) {
      confirmed.push(field);
      extracted[field] = sanitizeNode(values[0]);
    } else {
      extracted[field] = null;
    }
  }

  const payloadKeys = [...collectAllKeys(payload)].sort();
  const extraFields = {
    source_related: payloadKeys.filter((key) => /source|traffic/i.test(key)),
    country_related: payloadKeys.filter((key) => /country|nation/i.test(key)),
    quick_reply_related: payloadKeys.filter((key) => /quick|fast.*reply|reply_rate/i.test(key))
  };

  return {
    confirmed_fields: confirmed,
    data: {
      fields: extracted,
      extra_fields: extraFields
    },
    should_count_as_real_data: confirmed.length > 0
  };
}

function evaluateSelfProductDate(payload) {
  const ranges = collectObjects(
    payload,
    (item) =>
      item && typeof item === "object" && "start_date" in item && "end_date" in item
  ).map((item) => ({
    start_date: item.start_date ?? null,
    end_date: item.end_date ?? null
  }));

  return {
    confirmed_fields: ranges.length > 0 ? ["start_date", "end_date"] : [],
    data: { date_ranges: ranges.slice(0, 10) },
    should_count_as_real_data: ranges.length > 0
  };
}

function normalizeProductPerformanceRecords(payload) {
  return collectObjects(
    payload,
    (item) =>
      item &&
      typeof item === "object" &&
      ("click" in item ||
        "impression" in item ||
        "visitor" in item ||
        "fb" in item ||
        "order" in item ||
        "bookmark" in item ||
        "compare" in item ||
        "share" in item ||
        "keyword_effects" in item)
  ).map((item) => ({
    product_id: item.product_id ?? item.id ?? null,
    click: item.click ?? null,
    impression: item.impression ?? null,
    visitor: item.visitor ?? null,
    fb: item.fb ?? null,
    order: item.order ?? null,
    bookmark: item.bookmark ?? null,
    compare: item.compare ?? null,
    share: item.share ?? null,
    keyword_effects: item.keyword_effects ?? null
  }));
}

function evaluateSelfProduct(payload) {
  const records = normalizeProductPerformanceRecords(payload);
  const targetFields = [
    "click",
    "impression",
    "visitor",
    "fb",
    "order",
    "bookmark",
    "compare",
    "share",
    "keyword_effects"
  ];

  const confirmed = [];
  for (const field of targetFields) {
    if (records.some((item) => item[field] !== undefined && item[field] !== null)) {
      confirmed.push(field);
    }
  }

  const payloadKeys = [...collectAllKeys(payload)].sort();
  const extraFields = {
    source_related: payloadKeys.filter((key) => /source|traffic/i.test(key)),
    country_related: payloadKeys.filter((key) => /country|nation/i.test(key)),
    trend_related: payloadKeys.filter((key) => /change|trend|period|mom|yoy/i.test(key))
  };

  return {
    confirmed_fields: confirmed,
    data: {
      record_count: records.length,
      sample_records: sanitizeNode(records.slice(0, 5)),
      extra_fields: extraFields
    },
    should_count_as_real_data: records.length > 0 && confirmed.length > 0,
    should_count_as_upstream_missing: records.length === 0
  };
}

function buildSkippedMethod(apiName, classification, reason, extra = {}) {
  return {
    api_name: apiName,
    final_classification: classification,
    best_attempt: null,
    attempts: [],
    confirmed_fields: [],
    ...extra,
    skip_reason: reason
  };
}

function priorityOfClassification(classification) {
  const order = new Map([
    [CLASSIFICATIONS.REAL_DATA_RETURNED, 0],
    [CLASSIFICATIONS.STILL_AUTH_BLOCKED, 1],
    [CLASSIFICATIONS.PARAMETER_REJECTED, 2],
    [CLASSIFICATIONS.ILLEGAL_ACCESS_TOKEN, 3],
    [CLASSIFICATIONS.MISSING_ACCESS_TOKEN, 4],
    [CLASSIFICATIONS.UPSTREAM_SAMPLE_MISSING, 5],
    [CLASSIFICATIONS.AWAITING_WIKA_REAUTH, 6],
    [CLASSIFICATIONS.ENVIRONMENT_BLOCKED, 7],
    [CLASSIFICATIONS.APPKEY_NOT_CONFIRMED, 8],
    [CLASSIFICATIONS.UNKNOWN, 9]
  ]);

  return order.get(classification) ?? 99;
}

function buildMethodResult(apiName, attempts, extra = {}) {
  if (attempts.length === 0) {
    return buildSkippedMethod(
      apiName,
      CLASSIFICATIONS.UPSTREAM_SAMPLE_MISSING,
      "no_attempt_executed",
      extra
    );
  }

  const bestAttempt = [...attempts].sort(
    (left, right) =>
      priorityOfClassification(left.classification) -
      priorityOfClassification(right.classification)
  )[0];

  const confirmed = new Set();
  for (const attempt of attempts) {
    for (const field of attempt.confirmed_fields || []) {
      confirmed.add(field);
    }
  }

  return {
    api_name: apiName,
    final_classification: bestAttempt.classification,
    best_attempt: sanitizeNode(bestAttempt),
    attempts: sanitizeNode(attempts),
    confirmed_fields: [...confirmed],
    ...extra
  };
}

async function runMethodAttempts({
  apiName,
  attempts,
  credentials,
  evaluator,
  forceAllAttempts = false
}) {
  const results = [];

  for (const attempt of attempts.slice(0, MAX_ATTEMPTS)) {
    const response = await callSyncApi({
      apiName,
      appKey: credentials.appKey,
      appSecret: credentials.appSecret,
      accessToken: credentials.accessToken,
      businessParams: attempt.businessParams
    });

    let classification = CLASSIFICATIONS.UNKNOWN;
    let errorSummary = null;
    let confirmedFields = [];
    let extractedData = null;

    if (!response.is_json) {
      classification = CLASSIFICATIONS.ENVIRONMENT_BLOCKED;
    } else if (response.body?.error_response) {
      errorSummary = normalizeTopError(response.body.error_response);
      classification = classifyError(errorSummary);
    } else {
      const { payload } = extractRootPayload(apiName, response.body);
      const businessFailure = extractBusinessFailure(payload);
      if (businessFailure) {
        errorSummary = normalizeTopError(businessFailure);
        classification = classifyError(errorSummary);
      } else {
        const evaluated = evaluator(payload, attempt);
        confirmedFields = evaluated.confirmed_fields ?? [];
        extractedData = evaluated.data ?? null;

        if (evaluated.should_count_as_real_data) {
          classification = CLASSIFICATIONS.REAL_DATA_RETURNED;
        } else if (evaluated.should_count_as_upstream_missing) {
          classification = CLASSIFICATIONS.UPSTREAM_SAMPLE_MISSING;
        } else {
          classification = CLASSIFICATIONS.REAL_DATA_RETURNED;
        }
      }
    }

    results.push({
      attempt_name: attempt.name,
      classification,
      http_status: response.http_status,
      elapsed_ms: response.elapsed_ms,
      request_params: sanitizeNode(attempt.businessParams),
      error_summary: sanitizeNode(errorSummary),
      response_shape_summary: summarizeResponseShape(apiName, response),
      confirmed_fields: confirmedFields,
      extracted_data: sanitizeNode(extractedData)
    });

    if (
      !forceAllAttempts &&
      [
        CLASSIFICATIONS.REAL_DATA_RETURNED,
        CLASSIFICATIONS.STILL_AUTH_BLOCKED,
        CLASSIFICATIONS.ILLEGAL_ACCESS_TOKEN,
        CLASSIFICATIONS.MISSING_ACCESS_TOKEN,
        CLASSIFICATIONS.ENVIRONMENT_BLOCKED
      ].includes(classification)
    ) {
      break;
    }
  }

  return buildMethodResult(apiName, results);
}

function normalizeProductionProductItems(payload) {
  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  return collectObjects(
    payload,
    (item) =>
      item &&
      typeof item === "object" &&
      ("id" in item || "product_id" in item) &&
      ("subject" in item || "group_name" in item)
  );
}

async function collectProductionSamples() {
  const productsPayload = await fetchJson(
    `${PRODUCTION_BASE_URL}/integrations/alibaba/wika/data/products/list?page_size=20`
  );

  const productItems = normalizeProductionProductItems(productsPayload.body || {});
  const numericProductIds = [
    ...new Set(
      productItems
        .map((item) => item?.id ?? item?.product_id ?? null)
        .filter((value) => /^\d+$/.test(String(value ?? "")))
        .map((value) => String(value))
    )
  ].slice(0, PRODUCT_BATCH_LIMIT);

  return {
    products_route_summary: sanitizeNode({
      http_status: productsPayload.status,
      item_count: productItems.length,
      sample_items: productItems.slice(0, 5)
    }),
    numeric_product_ids: numericProductIds
  };
}

function pickFirstDateRange(methodResult) {
  const attempt = methodResult.attempts.find(
    (item) =>
      item.classification === CLASSIFICATIONS.REAL_DATA_RETURNED &&
      Array.isArray(item.extracted_data?.date_ranges) &&
      item.extracted_data.date_ranges.length > 0
  );

  return (
    attempt?.extracted_data?.date_ranges?.find(
      (item) => item.start_date && item.end_date
    ) ?? null
  );
}

function pickFirstIndustry(methodResult) {
  const attempt = methodResult.attempts.find(
    (item) =>
      item.classification === CLASSIFICATIONS.REAL_DATA_RETURNED &&
      Array.isArray(item.extracted_data?.industries) &&
      item.extracted_data.industries.length > 0
  );

  return (
    attempt?.extracted_data?.industries?.find(
      (item) =>
        item.industry_id !== null ||
        item.industry_desc !== null ||
        item.main_category !== null
    ) ?? null
  );
}

function pickStatDateMap(methodResult) {
  const map = {};
  for (const attempt of methodResult.attempts) {
    const range = attempt?.extracted_data?.date_ranges?.find(
      (item) => item.start_date || item.end_date
    );
    if (range) {
      map[attempt.attempt_name] = range.end_date || range.start_date;
    }
  }
  return map;
}

function buildFieldCoverageMatrixDelta(results) {
  const overviewBasicFields =
    results[METHOD_NAMES.OVERVIEW_BASIC]?.confirmed_fields ?? [];
  const overviewBasicExtra =
    results[METHOD_NAMES.OVERVIEW_BASIC]?.best_attempt?.extracted_data?.extra_fields ??
    {};
  const selfProductFields =
    results[METHOD_NAMES.PRODUCT_GET]?.confirmed_fields ?? [];
  const selfProductExtra =
    results[METHOD_NAMES.PRODUCT_GET]?.best_attempt?.extracted_data?.extra_fields ??
    {};

  const hasField = (fields, key) => fields.includes(key);
  const statusForMethod = (methodName, fieldName, confirmedFields) => {
    const methodResult = results[methodName];
    if (!methodResult) {
      return "not yet evidenced";
    }
    if (hasField(confirmedFields, fieldName)) {
      return "confirmed but blocked no longer";
    }
    if (methodResult.final_classification === CLASSIFICATIONS.STILL_AUTH_BLOCKED) {
      return "still auth blocked";
    }
    if (methodResult.final_classification === CLASSIFICATIONS.PARAMETER_REJECTED) {
      return "parameter rejected";
    }
    if (methodResult.final_classification === CLASSIFICATIONS.ENVIRONMENT_BLOCKED) {
      return "environment blocked";
    }
    if (methodResult.final_classification === CLASSIFICATIONS.REAL_DATA_RETURNED) {
      return "not found in current response";
    }
    return "not yet evidenced";
  };

  return {
    store: {
      UV: statusForMethod(METHOD_NAMES.OVERVIEW_BASIC, "visitor", overviewBasicFields),
      PV: statusForMethod(METHOD_NAMES.OVERVIEW_BASIC, "imps", overviewBasicFields),
      "流量来源":
        (overviewBasicExtra.source_related || []).length > 0
          ? "confirmed field"
          : statusForMethod(METHOD_NAMES.OVERVIEW_BASIC, "__source__", []),
      "国家来源":
        (overviewBasicExtra.country_related || []).length > 0
          ? "confirmed field"
          : statusForMethod(METHOD_NAMES.OVERVIEW_BASIC, "__country__", []),
      "询盘表现": statusForMethod(METHOD_NAMES.OVERVIEW_BASIC, "fb", overviewBasicFields),
      "响应率": statusForMethod(METHOD_NAMES.OVERVIEW_BASIC, "reply", overviewBasicFields),
      "快速回复率":
        (overviewBasicExtra.quick_reply_related || []).length > 0
          ? "confirmed field"
          : statusForMethod(METHOD_NAMES.OVERVIEW_BASIC, "__quick_reply__", [])
    },
    product: {
      "曝光": statusForMethod(METHOD_NAMES.PRODUCT_GET, "impression", selfProductFields),
      "点击": statusForMethod(METHOD_NAMES.PRODUCT_GET, "click", selfProductFields),
      CTR:
        hasField(selfProductFields, "click") && hasField(selfProductFields, "impression")
          ? "derived field"
          : statusForMethod(METHOD_NAMES.PRODUCT_GET, "__ctr__", []),
      "访问来源":
        (selfProductExtra.source_related || []).length > 0
          ? "confirmed field"
          : statusForMethod(METHOD_NAMES.PRODUCT_GET, "__source__", []),
      "关键词来源": statusForMethod(
        METHOD_NAMES.PRODUCT_GET,
        "keyword_effects",
        selfProductFields
      ),
      "询盘来源": statusForMethod(METHOD_NAMES.PRODUCT_GET, "__inquiry_source__", []),
      "国家来源":
        (selfProductExtra.country_related || []).length > 0
          ? "confirmed field"
          : statusForMethod(METHOD_NAMES.PRODUCT_GET, "__country__", []),
      "近周期变化":
        (selfProductExtra.trend_related || []).length > 0
          ? "confirmed field"
          : statusForMethod(METHOD_NAMES.PRODUCT_GET, "__trend__", [])
    }
  };
}

function determineReopenAdvice(results) {
  const hasOverviewDate =
    results[METHOD_NAMES.OVERVIEW_DATE]?.final_classification ===
    CLASSIFICATIONS.REAL_DATA_RETURNED;
  const hasOverviewIndustry =
    results[METHOD_NAMES.OVERVIEW_INDUSTRY]?.final_classification ===
    CLASSIFICATIONS.REAL_DATA_RETURNED;
  const hasOverviewMetrics =
    results[METHOD_NAMES.OVERVIEW_BASIC]?.final_classification ===
      CLASSIFICATIONS.REAL_DATA_RETURNED &&
    (results[METHOD_NAMES.OVERVIEW_BASIC]?.confirmed_fields?.length ?? 0) > 0;
  const hasProductMetrics =
    results[METHOD_NAMES.PRODUCT_GET]?.final_classification ===
      CLASSIFICATIONS.REAL_DATA_RETURNED &&
    (results[METHOD_NAMES.PRODUCT_GET]?.confirmed_fields?.length ?? 0) > 0;

  return {
    task1_partially_reopen:
      hasOverviewDate && hasOverviewIndustry && (hasOverviewMetrics || hasProductMetrics),
    task2_partially_reopen: hasOverviewMetrics || hasProductMetrics
  };
}

async function runOverviewDate(credentials) {
  return runMethodAttempts({
    apiName: METHOD_NAMES.OVERVIEW_DATE,
    attempts: [{ name: "empty_params", businessParams: {} }],
    credentials,
    evaluator: evaluateOverviewDate
  });
}

async function runOverviewIndustry(credentials, dateRange) {
  if (!dateRange) {
    return buildSkippedMethod(
      METHOD_NAMES.OVERVIEW_INDUSTRY,
      CLASSIFICATIONS.UPSTREAM_SAMPLE_MISSING,
      "overview.date.get did not yield a real date range"
    );
  }

  return runMethodAttempts({
    apiName: METHOD_NAMES.OVERVIEW_INDUSTRY,
    attempts: [
      {
        name: "real_date_range",
        businessParams: {
          date_range: {
            start_date: dateRange.start_date,
            end_date: dateRange.end_date
          }
        }
      }
    ],
    credentials,
    evaluator: evaluateOverviewIndustry
  });
}

async function runOverviewBasic(credentials, dateRange, industry) {
  if (!dateRange || !industry) {
    return buildSkippedMethod(
      METHOD_NAMES.OVERVIEW_BASIC,
      CLASSIFICATIONS.UPSTREAM_SAMPLE_MISSING,
      "overview.date.get or overview.industry.get did not yield real upstream parameters"
    );
  }

  return runMethodAttempts({
    apiName: METHOD_NAMES.OVERVIEW_BASIC,
    attempts: [
      {
        name: "date_range_with_real_industry",
        businessParams: {
          date_range: {
            start_date: dateRange.start_date,
            end_date: dateRange.end_date
          },
          industry: {
            industry_id: industry.industry_id,
            industry_desc: industry.industry_desc,
            main_category: industry.main_category
          }
        }
      }
    ],
    credentials,
    evaluator: evaluateOverviewIndicatorBasic
  });
}

async function runSelfProductDate(credentials) {
  return runMethodAttempts({
    apiName: METHOD_NAMES.PRODUCT_DATE,
    attempts: ["day", "week", "month"].map((statisticsType) => ({
      name: statisticsType,
      businessParams: { statistics_type: statisticsType }
    })),
    credentials,
    evaluator: evaluateSelfProductDate,
    forceAllAttempts: true
  });
}

async function runSelfProduct(credentials, productIds, statDateMap) {
  if (!Array.isArray(productIds) || productIds.length === 0) {
    return buildSkippedMethod(
      METHOD_NAMES.PRODUCT_GET,
      CLASSIFICATIONS.UPSTREAM_SAMPLE_MISSING,
      "products/list did not yield real numeric product ids"
    );
  }

  const attempts = [];
  for (const statisticsType of ["day", "week", "month"]) {
    const statDate = statDateMap[statisticsType];
    if (!statDate) {
      continue;
    }

    attempts.push({
      name: statisticsType,
      businessParams: {
        statistics_type: statisticsType,
        stat_date: statDate,
        product_ids: productIds.slice(0, PRODUCT_BATCH_LIMIT)
      }
    });
  }

  if (attempts.length === 0) {
    return buildSkippedMethod(
      METHOD_NAMES.PRODUCT_GET,
      CLASSIFICATIONS.UPSTREAM_SAMPLE_MISSING,
      "self.product.date.get did not yield a real stat_date"
    );
  }

  return runMethodAttempts({
    apiName: METHOD_NAMES.PRODUCT_GET,
    attempts,
    credentials,
    evaluator: evaluateSelfProduct
  });
}

async function main() {
  ensureDir(EVIDENCE_DIR);

  const sentinel = {
    health: await fetchJson(`${PRODUCTION_BASE_URL}/health`),
    auth_debug: await fetchJson(
      `${PRODUCTION_BASE_URL}/integrations/alibaba/auth/debug`
    ),
    products_list: await fetchJson(
      `${PRODUCTION_BASE_URL}/integrations/alibaba/wika/data/products/list?page_size=1`
    )
  };

  const baseSentinelPass =
    sentinel.health.status === 200 &&
    sentinel.auth_debug.status === 200 &&
    sentinel.products_list.status === 200;

  const authBody = sentinel.auth_debug.body || {};
  const authState = {
    wika_client_id_present: authBody.wika_client_id_present ?? null,
    wika_client_secret_present: authBody.wika_client_secret_present ?? null,
    wika_token_loaded: authBody.wika_token_loaded ?? null,
    wika_token_file_exists: authBody.wika_token_file_exists ?? null,
    wika_has_refresh_token: authBody.wika_has_refresh_token ?? null,
    wika_runtime_loaded_from: authBody.wika_runtime_loaded_from ?? null,
    wika_startup_init_status: authBody.wika_startup_init_status ?? null,
    wika_startup_init_error: authBody.wika_startup_init_error ?? null,
    wika_last_refresh_at: authBody.wika_last_refresh_at ?? null,
    wika_last_refresh_reason: authBody.wika_last_refresh_reason ?? null,
    wika_last_refresh_error: authBody.wika_last_refresh_error ?? null
  };

  const appkeyConfirmation = {
    wika_appkey_confirmed: false,
    assumption_wika_appkey: true,
    note:
      "当前只能确认本轮走的是 WIKA production auth profile，无法在仓内或 debug 输出中把权限截图里的 appkey 文本与运行时 appkey 做一一比对。"
  };

  const summary = {
    evaluated_at: new Date().toISOString(),
    thread_scope: "WIKA-only",
    wika_appkey: appkeyConfirmation,
    base_sentinel: sanitizeNode({
      health: {
        status: sentinel.health.status,
        elapsed_ms: sentinel.health.elapsed_ms
      },
      auth_debug: {
        status: sentinel.auth_debug.status,
        elapsed_ms: sentinel.auth_debug.elapsed_ms
      },
      products_list: {
        status: sentinel.products_list.status,
        elapsed_ms: sentinel.products_list.elapsed_ms
      },
      final_status: baseSentinelPass ? "PASS_BASE" : "ENVIRONMENT_BLOCKED"
    }),
    auth_state: authState,
    refresh_state: null,
    production_samples: null,
    method_results: {},
    confirmed_real_fields: {
      store_level: [],
      product_level: []
    },
    field_coverage_matrix_delta: {},
    reopen_advice: {
      task1_partially_reopen: false,
      task2_partially_reopen: false
    }
  };

  if (!baseSentinelPass) {
    const blockedMethods = Object.values(METHOD_NAMES).map((apiName) =>
      buildSkippedMethod(apiName, CLASSIFICATIONS.ENVIRONMENT_BLOCKED, "base sentinel failed")
    );
    for (const methodResult of blockedMethods) {
      summary.method_results[methodResult.api_name] = sanitizeNode(methodResult);
      writeJson(METHOD_EVIDENCE_PATHS[methodResult.api_name], sanitizeNode(methodResult));
    }
    summary.field_coverage_matrix_delta = buildFieldCoverageMatrixDelta(summary.method_results);
    writeJson(SUMMARY_JSON_PATH, summary);
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  if (!authBody.wika_token_loaded || !authBody.wika_has_refresh_token) {
    const blockedMethods = Object.values(METHOD_NAMES).map((apiName) =>
      buildSkippedMethod(
        apiName,
        CLASSIFICATIONS.AWAITING_WIKA_REAUTH,
        "wika auth debug indicates token runtime is not ready"
      )
    );
    for (const methodResult of blockedMethods) {
      summary.method_results[methodResult.api_name] = sanitizeNode(methodResult);
      writeJson(METHOD_EVIDENCE_PATHS[methodResult.api_name], sanitizeNode(methodResult));
    }
    summary.field_coverage_matrix_delta = buildFieldCoverageMatrixDelta(summary.method_results);
    writeJson(SUMMARY_JSON_PATH, summary);
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  const railwayToken = readRailwayToken();
  const vars = await queryRailwayVariables(railwayToken);
  const refreshResult = await refreshAccessToken({
    appKey: String(vars.ALIBABA_CLIENT_ID || "").trim(),
    appSecret: String(vars.ALIBABA_CLIENT_SECRET || "").trim(),
    refreshToken: String(vars.ALIBABA_WIKA_BOOTSTRAP_REFRESH_TOKEN || "").trim(),
    refreshUrl: getRefreshUrl(vars),
    partnerId: String(vars.ALIBABA_PARTNER_ID || "").trim()
  });

  summary.refresh_state = sanitizeNode(refreshResult);

  if (!refreshResult.ok) {
    const classification =
      refreshResult.classification === CLASSIFICATIONS.ILLEGAL_ACCESS_TOKEN
        ? CLASSIFICATIONS.AWAITING_WIKA_REAUTH
        : refreshResult.classification;
    const blockedMethods = Object.values(METHOD_NAMES).map((apiName) =>
      buildSkippedMethod(
        apiName,
        classification,
        "refreshAccessToken failed before mydata retest",
        { refresh_error: sanitizeNode(refreshResult.error) }
      )
    );
    for (const methodResult of blockedMethods) {
      summary.method_results[methodResult.api_name] = sanitizeNode(methodResult);
      writeJson(METHOD_EVIDENCE_PATHS[methodResult.api_name], sanitizeNode(methodResult));
    }
    summary.field_coverage_matrix_delta = buildFieldCoverageMatrixDelta(summary.method_results);
    writeJson(SUMMARY_JSON_PATH, summary);
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  const credentials = {
    appKey: String(vars.ALIBABA_CLIENT_ID || "").trim(),
    appSecret: String(vars.ALIBABA_CLIENT_SECRET || "").trim(),
    accessToken: refreshResult.accessToken
  };

  const productionSamples = await collectProductionSamples();
  summary.production_samples = sanitizeNode(productionSamples);

  const overviewDate = await runOverviewDate(credentials);
  const overviewDateRange = pickFirstDateRange(overviewDate);
  const overviewIndustry = await runOverviewIndustry(credentials, overviewDateRange);
  const industry = pickFirstIndustry(overviewIndustry);
  const overviewBasic = await runOverviewBasic(credentials, overviewDateRange, industry);
  const selfProductDate = await runSelfProductDate(credentials);
  const statDateMap = pickStatDateMap(selfProductDate);
  const selfProduct = await runSelfProduct(
    credentials,
    productionSamples.numeric_product_ids,
    statDateMap
  );

  const methodResults = [
    overviewDate,
    overviewIndustry,
    overviewBasic,
    selfProductDate,
    selfProduct
  ];

  for (const methodResult of methodResults) {
    const sanitized = sanitizeNode(methodResult);
    summary.method_results[methodResult.api_name] = sanitized;
    writeJson(METHOD_EVIDENCE_PATHS[methodResult.api_name], sanitized);
  }

  summary.confirmed_real_fields.store_level =
    summary.method_results[METHOD_NAMES.OVERVIEW_BASIC]?.confirmed_fields ?? [];
  summary.confirmed_real_fields.product_level =
    summary.method_results[METHOD_NAMES.PRODUCT_GET]?.confirmed_fields ?? [];
  summary.field_coverage_matrix_delta = buildFieldCoverageMatrixDelta(summary.method_results);
  summary.reopen_advice = determineReopenAdvice(summary.method_results);

  writeJson(SUMMARY_JSON_PATH, sanitizeNode(summary));
  console.log(JSON.stringify(sanitizeNode(summary), null, 2));
}

main().catch((error) => {
  const fatal = {
    ok: false,
    fatal: error instanceof Error ? error.message : String(error)
  };
  writeJson(SUMMARY_JSON_PATH, fatal);
  console.error(JSON.stringify(fatal, null, 2));
  process.exit(1);
});
