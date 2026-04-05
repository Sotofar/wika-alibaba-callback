import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const RAILWAY_TOKEN_PATH = path.join(os.tmpdir(), "railway-cli-token.txt");
const PROJECT_ID = "7cc408fd-c2a3-403c-9b4e-adaa72a9a712";
const ENVIRONMENT_ID = "4afccea8-ada6-42d5-9bd7-0f73cca404dc";
const SERVICE_ID = "d7abfb5c-25c6-478c-a51a-69d85151127a";
const GRAPHQL_URL = "https://backboard.railway.com/graphql/v2";
const SYNC_URL = "https://open-api.alibaba.com/sync";
const PRODUCTION_BASE_URL = "https://api.wikapacking.com";
const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FRAMEWORK_DIR = path.join(ROOT_DIR, "docs", "framework");
const EVIDENCE_DIR = path.join(FRAMEWORK_DIR, "evidence");
const SUMMARY_DOC_PATH = path.join(FRAMEWORK_DIR, "WIKA_经营数据候选接口验证.md");
const MATRIX_DOC_PATH = path.join(FRAMEWORK_DIR, "WIKA_经营数据字段覆盖矩阵.md");
const SUMMARY_JSON_PATH = path.join(
  EVIDENCE_DIR,
  "wika-metrics-candidates-summary.json"
);
const MAX_ATTEMPTS = 3;
const TARGET_PRODUCT_BATCH_SIZE = 5;
const TARGET_ORDER_SAMPLE_SIZE = 3;

const CLASSIFICATIONS = Object.freeze({
  DOC_FOUND: "DOC_FOUND",
  ROUTE_NOT_BOUND: "ROUTE_NOT_BOUND",
  AUTH_BLOCKED: "AUTH_BLOCKED",
  CAPABILITY_BLOCKED: "CAPABILITY_BLOCKED",
  PARAMETER_REJECTED: "PARAMETER_REJECTED",
  PARAMETER_ACCEPTED_NO_REAL_DATA: "PARAMETER_ACCEPTED_NO_REAL_DATA",
  REAL_DATA_RETURNED: "REAL_DATA_RETURNED",
  DERIVABLE_FROM_EXISTING_ORDER_APIS: "DERIVABLE_FROM_EXISTING_ORDER_APIS"
});

const FIELD_STATUSES = Object.freeze({
  CONFIRMED: "confirmed field",
  DERIVED: "derived field",
  NOT_FOUND: "not found in current response",
  BLOCKED: "auth/capability blocked",
  NEEDS_FURTHER_ENTRY: "needs further official entry"
});

const CANDIDATE_APIS = Object.freeze([
  { api_name: "alibaba.mydata.overview.date.get", scope: "store" },
  { api_name: "alibaba.mydata.overview.industry.get", scope: "store" },
  { api_name: "alibaba.mydata.overview.indicator.basic.get", scope: "store" },
  { api_name: "alibaba.mydata.self.product.date.get", scope: "product" },
  { api_name: "alibaba.mydata.self.product.get", scope: "product" },
  { api_name: "alibaba.seller.order.list", scope: "order" },
  { api_name: "alibaba.seller.order.get", scope: "order" },
  { api_name: "alibaba.seller.order.fund.get", scope: "order" },
  { api_name: "alibaba.seller.order.logistics.get", scope: "order_optional" }
]);

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeText(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, value, "utf8");
}

function readRailwayToken() {
  if (!fs.existsSync(RAILWAY_TOKEN_PATH)) {
    throw new Error(`Missing Railway token file: ${RAILWAY_TOKEN_PATH}`);
  }

  return fs.readFileSync(RAILWAY_TOKEN_PATH, "utf8").trim();
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
      JSON.stringify({
        code: payload?.code ?? null,
        sub_code: payload?.sub_code ?? null,
        msg: payload?.message ?? payload?.msg ?? "refresh failed"
      })
    );
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
    body: JSON.stringify(params)
  });

  const text = await response.text();
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("json");
  const body = isJson ? JSON.parse(text) : null;

  return {
    status: response.status,
    isJson,
    body,
    text
  };
}

async function fetchProductionJson(pathname) {
  const response = await fetch(`${PRODUCTION_BASE_URL}${pathname}`);
  const text = await response.text();
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("json")) {
    throw new Error(`Expected JSON from ${pathname}, got ${contentType}`);
  }

  return JSON.parse(text);
}

function extractRootPayload(apiName, body = {}) {
  const rootKey = `${apiName.replace(/\./g, "_")}_response`;
  return {
    rootKey,
    payload: body?.[rootKey] ?? body ?? null
  };
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

function firstNonNull(values = []) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return null;
}

function uniqueStrings(values = []) {
  return [
    ...new Set(
      values
        .filter((value) => value !== undefined && value !== null && value !== "")
        .map((value) => String(value))
    )
  ];
}

function parseNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value === "object" && value !== null && "amount" in value) {
    return parseNumber(value.amount);
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function shiftDays(date, delta) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + delta);
  return next;
}

function maskText(value) {
  if (value === undefined || value === null) {
    return value;
  }

  const text = String(value);
  if (text.length <= 6) {
    return "***";
  }

  return `${text.slice(0, 2)}***${text.slice(-2)}`;
}

function sanitizeNode(node) {
  if (Array.isArray(node)) {
    return node.slice(0, 8).map((item) => sanitizeNode(item));
  }

  if (!node || typeof node !== "object") {
    if (typeof node === "string") {
      if (/@/.test(node)) {
        return maskText(node);
      }
      if (/^\+?\d[\d\s-]{5,}$/.test(node)) {
        return maskText(node);
      }
    }
    return node;
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(node)) {
    if (
      /(token|secret|sign|email|phone|mobile|tel|address|detail_address)/i.test(
        key
      )
    ) {
      sanitized[key] =
        key.toLowerCase().includes("token") ||
        key.toLowerCase().includes("secret")
          ? "***"
          : sanitizeNode(maskText(value));
      continue;
    }

    if (
      /(buyer|full_name|contact|company_name|receiver|consignee)/i.test(key) &&
      typeof value === "string"
    ) {
      sanitized[key] = maskText(value);
      continue;
    }

    sanitized[key] = sanitizeNode(value);
  }

  return sanitized;
}

function classifyErrorPayload(errorResponse = {}) {
  const raw = `${errorResponse?.code ?? ""} ${errorResponse?.sub_code ?? ""} ${errorResponse?.msg ?? ""} ${errorResponse?.sub_msg ?? ""}`.toLowerCase();

  if (
    raw.includes("insufficientpermission") ||
    raw.includes("permission") ||
    raw.includes("unauthorized")
  ) {
    return CLASSIFICATIONS.AUTH_BLOCKED;
  }

  if (
    raw.includes("missingparameter") ||
    raw.includes("invalid-parameter") ||
    raw.includes("parameter") ||
    raw.includes("illegal parameter") ||
    raw.includes("invalidate request") ||
    raw.includes("invalid request") ||
    raw.includes("invalidaterequest") ||
    raw.includes("tradeid is invalid") ||
    raw.includes("query params is null") ||
    raw.includes("record does not exist")
  ) {
    return CLASSIFICATIONS.PARAMETER_REJECTED;
  }

  return CLASSIFICATIONS.CAPABILITY_BLOCKED;
}

function classifyAttempt(apiName, response) {
  if (!response.isJson) {
    return {
      api_name: apiName,
      classification: CLASSIFICATIONS.CAPABILITY_BLOCKED,
      reason: "non_json_response",
      response_excerpt: String(response.text || "").slice(0, 320)
    };
  }

  if (response.body?.error_response) {
    return {
      api_name: apiName,
      classification: classifyErrorPayload(response.body.error_response),
      reason: "top_error_response",
      error_response: sanitizeNode(response.body.error_response)
    };
  }

  const { payload, rootKey } = extractRootPayload(apiName, response.body);
  const businessFailure =
    (payload?.success === false && {
      msg: payload?.error_message ?? payload?.message ?? "business failure"
    }) ||
    (payload?.biz_success === false && {
      msg: payload?.message ?? "business failure"
    }) ||
    (payload?.result?.success === false && {
      msg:
        payload?.result?.error_message ??
        payload?.result?.message ??
        "business failure"
    });

  if (businessFailure) {
    const errorResponse = {
      code: payload?.error_code ?? payload?.result?.error_code ?? null,
      sub_code: payload?.sub_code ?? payload?.result?.sub_code ?? null,
      msg: businessFailure.msg,
      sub_msg: payload?.sub_msg ?? payload?.result?.sub_msg ?? null
    };

    return {
      api_name: apiName,
      classification: classifyErrorPayload(errorResponse),
      reason: "business_failure",
      root_key: rootKey,
      error_response: sanitizeNode(errorResponse)
    };
  }

  return {
    api_name: apiName,
    classification: CLASSIFICATIONS.PARAMETER_ACCEPTED_NO_REAL_DATA,
    reason: "json_without_explicit_error",
    root_key: rootKey
  };
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
    final_category:
      ranges.length > 0
        ? CLASSIFICATIONS.REAL_DATA_RETURNED
        : CLASSIFICATIONS.PARAMETER_ACCEPTED_NO_REAL_DATA,
    extracted: { date_ranges: ranges.slice(0, 10) }
  };
}

function evaluateOverviewIndustry(payload) {
  const industries = collectObjects(
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

  return {
    final_category:
      industries.length > 0
        ? CLASSIFICATIONS.REAL_DATA_RETURNED
        : CLASSIFICATIONS.PARAMETER_ACCEPTED_NO_REAL_DATA,
    extracted: { industries: industries.slice(0, 10) }
  };
}

function extractTargetFields(payload, fieldNames) {
  const extracted = {};
  for (const fieldName of fieldNames) {
    extracted[fieldName] = firstNonNull(collectValuesByKey(payload, fieldName));
  }
  return extracted;
}

function evaluateIndicatorBasic(payload) {
  const fields = extractTargetFields(payload, [
    "visitor",
    "imps",
    "clk",
    "clk_rate",
    "fb",
    "reply"
  ]);

  return {
    final_category: Object.values(fields).some((value) => value !== null)
      ? CLASSIFICATIONS.REAL_DATA_RETURNED
      : CLASSIFICATIONS.PARAMETER_ACCEPTED_NO_REAL_DATA,
    extracted: { fields }
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
    final_category:
      ranges.length > 0
        ? CLASSIFICATIONS.REAL_DATA_RETURNED
        : CLASSIFICATIONS.PARAMETER_ACCEPTED_NO_REAL_DATA,
    extracted: { date_ranges: ranges.slice(0, 10) }
  };
}

function normalizeProductRecords(payload) {
  const records = collectObjects(
    payload,
    (item) =>
      item &&
      typeof item === "object" &&
      ("impression" in item ||
        "click" in item ||
        "visitor" in item ||
        "fb" in item ||
        "order" in item ||
        "bookmark" in item ||
        "compare" in item ||
        "share" in item ||
        "keyword_effects" in item)
  );

  return records.map((item) => ({
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
  const records = normalizeProductRecords(payload);
  const hasAny = records.some((item) =>
    [
      "click",
      "impression",
      "visitor",
      "fb",
      "order",
      "bookmark",
      "compare",
      "share",
      "keyword_effects"
    ].some((key) => item[key] !== null && item[key] !== undefined)
  );

  return {
    final_category: hasAny
      ? CLASSIFICATIONS.REAL_DATA_RETURNED
      : CLASSIFICATIONS.PARAMETER_ACCEPTED_NO_REAL_DATA,
    extracted: {
      record_count: records.length,
      sample_records: records.slice(0, 5)
    }
  };
}

function extractTradeEcologyOrders(payload) {
  const rawItems = payload?.result?.value?.order_list?.trade_ecology_order;
  if (Array.isArray(rawItems)) {
    return rawItems;
  }
  if (rawItems && typeof rawItems === "object") {
    return [rawItems];
  }
  return [];
}

function normalizeDateValue(value) {
  if (!value || typeof value !== "object") {
    return { timestamp: null, format_date: null };
  }

  return {
    timestamp: value.timestamp ?? null,
    format_date: value.format_date ?? null
  };
}

function normalizeMoneyValue(value) {
  if (!value || typeof value !== "object") {
    return { amount: null, currency: null };
  }

  return {
    amount: value.amount ?? null,
    currency: value.currency ?? null
  };
}

function evaluateOrderList(payload) {
  const items = extractTradeEcologyOrders(payload).map((item) => ({
    trade_id: item.trade_id ?? null,
    create_date: normalizeDateValue(item.create_date),
    modify_date: normalizeDateValue(item.modify_date),
    trade_status: item.trade_status ?? null
  }));

  return {
    final_category:
      items.length > 0
        ? CLASSIFICATIONS.REAL_DATA_RETURNED
        : CLASSIFICATIONS.PARAMETER_ACCEPTED_NO_REAL_DATA,
    extracted: {
      total_count: payload?.result?.value?.total_count ?? null,
      returned_item_count: items.length,
      items: items.slice(0, 10)
    }
  };
}

function extractOrderDetailItem(payload) {
  return payload?.result?.value ?? payload?.value ?? payload?.result ?? payload;
}

function normalizeOrderProducts(item = {}) {
  const raw =
    item.order_products?.trade_ecology_order_product ?? item.order_products ?? [];
  if (Array.isArray(raw)) {
    return raw;
  }
  if (raw && typeof raw === "object") {
    return [raw];
  }
  return [];
}

function evaluateOrderDetail(payload) {
  const item = extractOrderDetailItem(payload);
  const orderProducts = normalizeOrderProducts(item).map((product) => ({
    product_id: product.product_id ?? null,
    quantity: product.quantity ?? null,
    unit_price: normalizeMoneyValue(product.unit_price),
    name: product.name ?? null
  }));

  const detail = {
    trade_id: item?.trade_id ?? null,
    create_date: normalizeDateValue(item?.create_date),
    modify_date: normalizeDateValue(item?.modify_date),
    trade_status: item?.trade_status ?? null,
    total_amount: normalizeMoneyValue(
      item?.total_amount ?? item?.order_amount ?? item?.pay_amount
    ),
    buyer_country: item?.buyer?.country ?? null,
    shipping_country:
      item?.shipping_address?.country ??
      item?.shipping_address?.country_name ??
      item?.receiver_address?.country ??
      null,
    order_products: orderProducts.slice(0, 20)
  };

  const hasAny =
    detail.trade_id ||
    detail.trade_status ||
    detail.total_amount.amount ||
    detail.order_products.length > 0;

  return {
    final_category: hasAny
      ? CLASSIFICATIONS.REAL_DATA_RETURNED
      : CLASSIFICATIONS.PARAMETER_ACCEPTED_NO_REAL_DATA,
    extracted: detail
  };
}

function evaluateOrderFund(payload) {
  const value = payload?.result?.value ?? payload?.value ?? null;
  const result = {
    service_fee: value?.service_fee ?? null,
    fund_pay_list: value?.fund_pay_list ?? null,
    refund_list: value?.refund_list ?? null
  };

  const hasAny =
    result.service_fee !== null ||
    (Array.isArray(result.fund_pay_list) && result.fund_pay_list.length > 0) ||
    (Array.isArray(result.refund_list) && result.refund_list.length > 0);

  return {
    final_category: hasAny
      ? CLASSIFICATIONS.REAL_DATA_RETURNED
      : CLASSIFICATIONS.PARAMETER_ACCEPTED_NO_REAL_DATA,
    extracted: result
  };
}

function evaluateOrderLogistics(payload) {
  const value = payload?.result?.value ?? payload?.value ?? null;
  const result = {
    logistic_status: value?.logistic_status ?? null,
    shipping_order_list: value?.shipping_order_list ?? null
  };

  const hasAny =
    result.logistic_status !== null ||
    (Array.isArray(result.shipping_order_list) &&
      result.shipping_order_list.length > 0);

  return {
    final_category: hasAny
      ? CLASSIFICATIONS.REAL_DATA_RETURNED
      : CLASSIFICATIONS.PARAMETER_ACCEPTED_NO_REAL_DATA,
    extracted: result
  };
}

function priorityOfClassification(classification) {
  const priority = new Map([
    [CLASSIFICATIONS.REAL_DATA_RETURNED, 0],
    [CLASSIFICATIONS.PARAMETER_ACCEPTED_NO_REAL_DATA, 1],
    [CLASSIFICATIONS.AUTH_BLOCKED, 2],
    [CLASSIFICATIONS.PARAMETER_REJECTED, 3],
    [CLASSIFICATIONS.CAPABILITY_BLOCKED, 4],
    [CLASSIFICATIONS.ROUTE_NOT_BOUND, 5],
    [CLASSIFICATIONS.DOC_FOUND, 6]
  ]);

  return priority.get(classification) ?? 99;
}

function buildAttemptSummary(attemptResult) {
  return {
    attempt_name: attemptResult.attempt_name,
    classification: attemptResult.classification,
    http_status: attemptResult.http_status,
    request_params: attemptResult.request_params,
    root_key: attemptResult.root_key,
    payload_keys: attemptResult.payload_keys,
    extracted: attemptResult.extracted,
    error_response: attemptResult.error_response,
    response_excerpt: attemptResult.response_excerpt
  };
}

function buildMethodResult(apiName, attempts = []) {
  if (attempts.length === 0) {
    return {
      api_name: apiName,
      doc_status: CLASSIFICATIONS.DOC_FOUND,
      final_category: CLASSIFICATIONS.ROUTE_NOT_BOUND,
      attempts: [],
      best_attempt: null,
      real_extracted: []
    };
  }

  const bestAttempt = [...attempts].sort(
    (left, right) =>
      priorityOfClassification(left.classification) -
      priorityOfClassification(right.classification)
  )[0];

  return {
    api_name: apiName,
    doc_status: CLASSIFICATIONS.DOC_FOUND,
    final_category: bestAttempt.classification,
    best_attempt: buildAttemptSummary(bestAttempt),
    attempts: attempts.map((item) => buildAttemptSummary(item)),
    real_extracted: attempts
      .filter((item) => item.classification === CLASSIFICATIONS.REAL_DATA_RETURNED)
      .map((item) => item.extracted)
      .filter(Boolean)
  };
}

function buildResponseExcerpt(response, apiName) {
  if (!response.isJson) {
    return String(response.text || "").slice(0, 320);
  }

  const { rootKey, payload } = extractRootPayload(apiName, response.body);
  return sanitizeNode({
    root_key: rootKey,
    payload:
      payload && typeof payload === "object"
        ? payload
        : response.body && typeof response.body === "object"
          ? response.body
          : null
  });
}

async function runMethodAttempts({
  apiName,
  attempts,
  credentials,
  evaluator,
  forceAllAttempts = false
}) {
  const attemptResults = [];

  for (const attempt of attempts.slice(0, MAX_ATTEMPTS)) {
    const response = await callSyncApi({
      apiName,
      appKey: credentials.appKey,
      appSecret: credentials.appSecret,
      accessToken: credentials.accessToken,
      businessParams: attempt.businessParams
    });

    const classificationResult = classifyAttempt(apiName, response);
    const { payload, rootKey } = extractRootPayload(apiName, response.body);
    const payloadKeys = response.isJson
      ? [...collectAllKeys(payload ?? response.body)].sort()
      : [];

    let classification = classificationResult.classification;
    let extracted = null;

    if (
      classificationResult.classification ===
        CLASSIFICATIONS.PARAMETER_ACCEPTED_NO_REAL_DATA &&
      typeof evaluator === "function"
    ) {
      const evaluated = evaluator(payload, attempt);
      classification = evaluated.final_category;
      extracted = evaluated.extracted;
    }

    const attemptResult = {
      attempt_name: attempt.name,
      classification,
      http_status: response.status,
      request_params: sanitizeNode(attempt.businessParams),
      root_key: rootKey,
      payload_keys: payloadKeys,
      extracted: sanitizeNode(extracted),
      error_response: classificationResult.error_response ?? null,
      response_excerpt: buildResponseExcerpt(response, apiName)
    };

    attemptResults.push(attemptResult);

    if (forceAllAttempts) {
      continue;
    }

    if (
      classification === CLASSIFICATIONS.REAL_DATA_RETURNED ||
      classification === CLASSIFICATIONS.PARAMETER_ACCEPTED_NO_REAL_DATA ||
      classification === CLASSIFICATIONS.AUTH_BLOCKED ||
      classification === CLASSIFICATIONS.CAPABILITY_BLOCKED
    ) {
      break;
    }
  }

  return buildMethodResult(apiName, attemptResults);
}

function normalizeProductionProductItems(payload) {
  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.products)) {
    return payload.products;
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

function normalizeProductionOrderItems(payload) {
  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  return collectObjects(
    payload,
    (item) =>
      item &&
      typeof item === "object" &&
      "trade_id" in item &&
      ("create_date" in item || "modify_date" in item || "trade_status" in item)
  );
}

async function collectProductionSamples() {
  const [productsPayload, ordersPayload] = await Promise.all([
    fetchProductionJson("/integrations/alibaba/wika/data/products/list?page_size=30"),
    fetchProductionJson("/integrations/alibaba/wika/data/orders/list?page_size=10")
  ]);

  const productItems = normalizeProductionProductItems(productsPayload);
  const orderItems = normalizeProductionOrderItems(ordersPayload);

  return {
    products_route_summary: sanitizeNode({
      item_count: productItems.length,
      sample_items: productItems.slice(0, 5)
    }),
    orders_route_summary: sanitizeNode({
      item_count: orderItems.length,
      sample_items: orderItems.slice(0, 5)
    }),
    numeric_product_ids: uniqueStrings(
      productItems
        .map((item) => item?.id ?? item?.product_id ?? null)
        .filter((value) => /^\d+$/.test(String(value ?? "")))
    ),
    trade_ids: uniqueStrings(
      orderItems.map((item) => item?.trade_id).filter(Boolean)
    )
  };
}

function pickOverviewDateRange(overviewDateResult) {
  const realRange =
    overviewDateResult.real_extracted?.[0]?.date_ranges?.find(
      (item) => item.start_date && item.end_date
    ) ?? null;

  if (realRange) {
    return {
      ...realRange,
      source: "overview.date.get"
    };
  }

  const today = new Date();
  return {
    start_date: toIsoDate(shiftDays(today, -7)),
    end_date: toIsoDate(shiftDays(today, -1)),
    source: "fallback_recent_window"
  };
}

function pickIndustryValue(overviewIndustryResult) {
  const realIndustry =
    overviewIndustryResult.real_extracted?.[0]?.industries?.find(
      (item) =>
        item.industry_id !== null ||
        item.industry_desc !== null ||
        item.main_category !== null
    ) ?? null;

  if (realIndustry) {
    return {
      industry_id: realIndustry.industry_id,
      industry_desc: realIndustry.industry_desc,
      main_category: realIndustry.main_category,
      source: "overview.industry.get"
    };
  }

  return {
    industry_id: 111,
    industry_desc: "All",
    main_category: true,
    source: "fallback_all_industry"
  };
}

function pickStatDateMap(productDateResult) {
  const dateMap = {};

  for (const attempt of productDateResult.attempts) {
    const validRange = attempt?.extracted?.date_ranges?.find(
      (item) => item.start_date || item.end_date
    );
    if (validRange) {
      dateMap[attempt.attempt_name] = validRange.end_date || validRange.start_date;
    }
  }

  const fallbackDate = toIsoDate(shiftDays(new Date(), -1));
  for (const statisticsType of ["day", "week", "month"]) {
    if (!dateMap[statisticsType]) {
      dateMap[statisticsType] = fallbackDate;
    }
  }

  return dateMap;
}

async function validateStoreLevel(credentials) {
  const overviewDate = await runMethodAttempts({
    apiName: "alibaba.mydata.overview.date.get",
    attempts: [
      {
        name: "empty_params",
        businessParams: {}
      }
    ],
    credentials,
    evaluator: evaluateOverviewDate
  });

  const selectedDateRange = pickOverviewDateRange(overviewDate);
  const overviewIndustry = await runMethodAttempts({
    apiName: "alibaba.mydata.overview.industry.get",
    attempts: [
      {
        name:
          selectedDateRange.source === "overview.date.get"
            ? "real_date_range"
            : "fallback_recent_window",
        businessParams: {
          date_range: {
            start_date: selectedDateRange.start_date,
            end_date: selectedDateRange.end_date
          }
        }
      }
    ],
    credentials,
    evaluator: evaluateOverviewIndustry
  });

  const selectedIndustry = pickIndustryValue(overviewIndustry);
  const indicatorBasic = await runMethodAttempts({
    apiName: "alibaba.mydata.overview.indicator.basic.get",
    attempts: [
      {
        name: `${selectedDateRange.source}_${selectedIndustry.source}`,
        businessParams: {
          date_range: {
            start_date: selectedDateRange.start_date,
            end_date: selectedDateRange.end_date
          },
          industry: {
            industry_id: selectedIndustry.industry_id,
            industry_desc: selectedIndustry.industry_desc,
            main_category: selectedIndustry.main_category
          }
        }
      }
    ],
    credentials,
    evaluator: evaluateIndicatorBasic
  });

  return {
    selected_date_range: selectedDateRange,
    selected_industry: selectedIndustry,
    methods: {
      "alibaba.mydata.overview.date.get": overviewDate,
      "alibaba.mydata.overview.industry.get": overviewIndustry,
      "alibaba.mydata.overview.indicator.basic.get": indicatorBasic
    }
  };
}

async function validateProductLevel(credentials, productionSamples) {
  const productIds = productionSamples.numeric_product_ids.slice(
    0,
    TARGET_PRODUCT_BATCH_SIZE
  );

  const selfProductDate = await runMethodAttempts({
    apiName: "alibaba.mydata.self.product.date.get",
    attempts: ["day", "week", "month"].map((statisticsType) => ({
      name: statisticsType,
      businessParams: {
        statistics_type: statisticsType
      }
    })),
    credentials,
    evaluator: evaluateSelfProductDate,
    forceAllAttempts: true
  });

  const statDateMap = pickStatDateMap(selfProductDate);
  const chosenProductId = productIds[0] ?? null;
  const selfProduct =
    chosenProductId === null
      ? buildMethodResult("alibaba.mydata.self.product.get", [])
      : await runMethodAttempts({
          apiName: "alibaba.mydata.self.product.get",
          attempts: ["day", "week", "month"].map((statisticsType) => ({
            name: statisticsType,
            businessParams: {
              statistics_type: statisticsType,
              stat_date: statDateMap[statisticsType],
              product_ids: chosenProductId
            }
          })),
          credentials,
          evaluator: evaluateSelfProduct,
          forceAllAttempts: true
        });

  return {
    validated_product_ids: productIds,
    methods: {
      "alibaba.mydata.self.product.date.get": selfProductDate,
      "alibaba.mydata.self.product.get": selfProduct
    }
  };
}

async function validateOrderLevel(credentials, productionSamples) {
  const now = new Date();
  const recentWindow = {
    start_date: toIsoDate(shiftDays(now, -30)),
    end_date: toIsoDate(shiftDays(now, -1))
  };

  const orderList = await runMethodAttempts({
    apiName: "alibaba.seller.order.list",
    attempts: [
      {
        name: "recent_window",
        businessParams: {
          param_trade_ecology_order_list_query: {
            role: "seller",
            start_page: 0,
            page_size: 10,
            create_date_start: recentWindow.start_date,
            create_date_end: recentWindow.end_date
          }
        }
      },
      {
        name: "fallback_minimal_windowless",
        businessParams: {
          param_trade_ecology_order_list_query: {
            role: "seller",
            start_page: 0,
            page_size: 10
          }
        }
      }
    ],
    credentials,
    evaluator: evaluateOrderList
  });

  const tradeIdsFromCandidate = uniqueStrings(
    (orderList.real_extracted?.[0]?.items ?? [])
      .map((item) => item.trade_id)
      .filter(Boolean)
  );
  const selectedTradeIds = (
    tradeIdsFromCandidate.length > 0
      ? tradeIdsFromCandidate
      : productionSamples.trade_ids
  ).slice(0, TARGET_ORDER_SAMPLE_SIZE);

  const orderGet =
    selectedTradeIds.length === 0
      ? buildMethodResult("alibaba.seller.order.get", [])
      : await runMethodAttempts({
          apiName: "alibaba.seller.order.get",
          attempts: selectedTradeIds.map((tradeId, index) => ({
            name: `trade_${index + 1}`,
            businessParams: {
              e_trade_id: tradeId
            }
          })),
          credentials,
          evaluator: evaluateOrderDetail,
          forceAllAttempts: true
        });

  const orderFund =
    selectedTradeIds.length === 0
      ? buildMethodResult("alibaba.seller.order.fund.get", [])
      : await runMethodAttempts({
          apiName: "alibaba.seller.order.fund.get",
          attempts: selectedTradeIds.map((tradeId, index) => ({
            name: `trade_${index + 1}`,
            businessParams: {
              e_trade_id: tradeId,
              data_select: "fund_serviceFee,fund_fundPay,fund_refund"
            }
          })),
          credentials,
          evaluator: evaluateOrderFund,
          forceAllAttempts: true
        });

  const orderLogistics =
    selectedTradeIds.length === 0
      ? buildMethodResult("alibaba.seller.order.logistics.get", [])
      : await runMethodAttempts({
          apiName: "alibaba.seller.order.logistics.get",
          attempts: selectedTradeIds.slice(0, 2).map((tradeId, index) => ({
            name: `trade_${index + 1}`,
            businessParams: {
              e_trade_id: tradeId,
              data_select: "logistic_order"
            }
          })),
          credentials,
          evaluator: evaluateOrderLogistics,
          forceAllAttempts: true
        });

  return {
    recent_window: recentWindow,
    selected_trade_ids: selectedTradeIds,
    methods: {
      "alibaba.seller.order.list": orderList,
      "alibaba.seller.order.get": orderGet,
      "alibaba.seller.order.fund.get": orderFund,
      "alibaba.seller.order.logistics.get": orderLogistics
    }
  };
}

function deriveOrderMetrics(orderLevel) {
  const listItems =
    orderLevel.methods["alibaba.seller.order.list"].real_extracted?.[0]?.items ?? [];
  const detailItems =
    orderLevel.methods["alibaba.seller.order.get"].real_extracted ?? [];
  const fundItems =
    orderLevel.methods["alibaba.seller.order.fund.get"].real_extracted ?? [];

  const orderCount = detailItems.length || listItems.length;
  const totalAmount = detailItems.reduce((sum, item) => {
    return sum + (parseNumber(item?.total_amount?.amount) ?? 0);
  }, 0);

  const trendMap = new Map();
  for (const item of detailItems.length > 0 ? detailItems : listItems) {
    const day = String(item?.create_date?.format_date || "").slice(0, 10);
    if (!day) {
      continue;
    }

    const current = trendMap.get(day) || { order_count: 0, amount: 0 };
    current.order_count += 1;
    current.amount += parseNumber(item?.total_amount?.amount) ?? 0;
    trendMap.set(day, current);
  }

  const countryMap = new Map();
  for (const item of detailItems) {
    const country = item?.buyer_country || item?.shipping_country;
    if (!country) {
      continue;
    }
    countryMap.set(country, (countryMap.get(country) || 0) + 1);
  }

  const productMap = new Map();
  for (const item of detailItems) {
    for (const product of item.order_products || []) {
      const productId = product?.product_id;
      if (!productId) {
        continue;
      }

      const current = productMap.get(productId) || {
        product_id: productId,
        quantity: 0,
        estimated_amount: 0
      };
      current.quantity += parseNumber(product?.quantity) ?? 0;
      current.estimated_amount +=
        (parseNumber(product?.quantity) ?? 0) *
        (parseNumber(product?.unit_price?.amount) ?? 0);
      productMap.set(productId, current);
    }
  }

  return {
    final_category:
      orderCount > 0 || trendMap.size > 0 || productMap.size > 0
        ? CLASSIFICATIONS.DERIVABLE_FROM_EXISTING_ORDER_APIS
        : CLASSIFICATIONS.CAPABILITY_BLOCKED,
    derivable: {
      正式汇总: orderCount > 0 && totalAmount > 0,
      趋势: trendMap.size > 0,
      国家结构: countryMap.size > 0,
      产品贡献: productMap.size > 0
    },
    summary: {
      order_count: orderCount,
      total_amount_sum: totalAmount || null
    },
    trend_sample: [...trendMap.entries()]
      .sort((left, right) => left[0].localeCompare(right[0]))
      .slice(0, 10)
      .map(([date, value]) => ({ date, ...value })),
    country_structure_sample: [...countryMap.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 10)
      .map(([country, count]) => ({ country, order_count: count })),
    product_contribution_sample: [...productMap.values()]
      .sort((left, right) => right.quantity - left.quantity)
      .slice(0, 10),
    fund_signal_sample: fundItems.slice(0, 10).map((item) => ({
      service_fee: item?.service_fee ?? null,
      fund_pay_count: Array.isArray(item?.fund_pay_list)
        ? item.fund_pay_list.length
        : 0,
      refund_count: Array.isArray(item?.refund_list) ? item.refund_list.length : 0
    }))
  };
}

function findInterestingKeys(keys = [], pattern) {
  return keys.filter((key) => pattern.test(key)).sort();
}

function inferBlockedStatus(methodResults = []) {
  return methodResults.some((result) =>
    [CLASSIFICATIONS.AUTH_BLOCKED, CLASSIFICATIONS.CAPABILITY_BLOCKED].includes(
      result.final_category
    )
  );
}

function hasValue(value) {
  return value !== undefined && value !== null && value !== "";
}

function buildFieldCoverageMatrix({ storeLevel, productLevel, orderLevel, orderDerivation }) {
  const storeIndicator =
    storeLevel.methods["alibaba.mydata.overview.indicator.basic.get"].best_attempt
      ?.extracted?.fields ?? {};
  const storePayloadKeys =
    storeLevel.methods["alibaba.mydata.overview.indicator.basic.get"].best_attempt
      ?.payload_keys ?? [];
  const productExtracted =
    productLevel.methods["alibaba.mydata.self.product.get"].best_attempt?.extracted ??
    {};
  const productRecord = productExtracted.sample_records?.[0] ?? {};
  const productPayloadKeys =
    productLevel.methods["alibaba.mydata.self.product.get"].best_attempt?.payload_keys ??
    [];
  const orderDetailSamples =
    orderLevel.methods["alibaba.seller.order.get"].real_extracted ?? [];

  const storeBlocked = inferBlockedStatus(Object.values(storeLevel.methods));
  const productBlocked = inferBlockedStatus(Object.values(productLevel.methods));
  const hasCountryInOrders = orderDetailSamples.some(
    (item) => item?.buyer_country || item?.shipping_country
  );
  const trendSource =
    orderLevel.methods["alibaba.seller.order.get"].real_extracted.length > 0
      ? "derived from order.get.create_date"
      : "derived from order.list.create_date";

  return [
    {
      dimension: "店铺级",
      field: "UV",
      status:
        hasValue(storeIndicator.visitor)
          ? FIELD_STATUSES.CONFIRMED
          : storeBlocked
            ? FIELD_STATUSES.BLOCKED
            : FIELD_STATUSES.NOT_FOUND,
      source:
        hasValue(storeIndicator.visitor)
          ? "alibaba.mydata.overview.indicator.basic.get: visitor"
          : null,
      note: "当前只把 visitor 视为 UV，不把 imps 视为 PV。"
    },
    {
      dimension: "店铺级",
      field: "PV",
      status: storeBlocked ? FIELD_STATUSES.BLOCKED : FIELD_STATUSES.NOT_FOUND,
      source: null,
      note: "当前响应里可见 imps，但未确认其等同 PV。"
    },
    {
      dimension: "店铺级",
      field: "流量来源",
      status:
        findInterestingKeys(storePayloadKeys, /source|traffic/i).length > 0
          ? FIELD_STATUSES.CONFIRMED
          : storeBlocked
            ? FIELD_STATUSES.BLOCKED
            : FIELD_STATUSES.NEEDS_FURTHER_ENTRY,
      source:
        findInterestingKeys(storePayloadKeys, /source|traffic/i).length > 0
          ? "alibaba.mydata.overview.indicator.basic.get"
          : null,
      note: "当前未见公开 source/traffic 字段时不脑补。"
    },
    {
      dimension: "店铺级",
      field: "国家来源",
      status:
        findInterestingKeys(storePayloadKeys, /country|nation/i).length > 0
          ? FIELD_STATUSES.CONFIRMED
          : storeBlocked
            ? FIELD_STATUSES.BLOCKED
            : FIELD_STATUSES.NEEDS_FURTHER_ENTRY,
      source:
        findInterestingKeys(storePayloadKeys, /country|nation/i).length > 0
          ? "alibaba.mydata.overview.indicator.basic.get"
          : null,
      note: "当前未把任意 country 字段脑补为访客国家来源。"
    },
    {
      dimension: "店铺级",
      field: "询盘表现",
      status:
        hasValue(storeIndicator.fb)
          ? FIELD_STATUSES.CONFIRMED
          : storeBlocked
            ? FIELD_STATUSES.BLOCKED
            : FIELD_STATUSES.NOT_FOUND,
      source:
        hasValue(storeIndicator.fb)
          ? "alibaba.mydata.overview.indicator.basic.get: fb"
          : null,
      note: "当前只确认 fb 可用，不外推为完整询盘漏斗。"
    },
    {
      dimension: "店铺级",
      field: "响应率",
      status: storeBlocked
        ? FIELD_STATUSES.BLOCKED
        : FIELD_STATUSES.NEEDS_FURTHER_ENTRY,
      source: null,
      note: "当前 reply 更像回复相关计数，不等同公开响应率字段。"
    },
    {
      dimension: "店铺级",
      field: "快速回复率",
      status: storeBlocked
        ? FIELD_STATUSES.BLOCKED
        : FIELD_STATUSES.NEEDS_FURTHER_ENTRY,
      source: null,
      note: "当前真实返回未见 quick reply 相关公开字段。"
    },
    {
      dimension: "产品级",
      field: "曝光",
      status:
        hasValue(productRecord.impression)
          ? FIELD_STATUSES.CONFIRMED
          : productBlocked
            ? FIELD_STATUSES.BLOCKED
            : FIELD_STATUSES.NOT_FOUND,
      source:
        hasValue(productRecord.impression)
          ? "alibaba.mydata.self.product.get: impression"
          : null,
      note: null
    },
    {
      dimension: "产品级",
      field: "点击",
      status:
        hasValue(productRecord.click)
          ? FIELD_STATUSES.CONFIRMED
          : productBlocked
            ? FIELD_STATUSES.BLOCKED
            : FIELD_STATUSES.NOT_FOUND,
      source:
        hasValue(productRecord.click)
          ? "alibaba.mydata.self.product.get: click"
          : null,
      note: null
    },
    {
      dimension: "产品级",
      field: "CTR",
      status:
        hasValue(productRecord.click) && hasValue(productRecord.impression)
          ? FIELD_STATUSES.DERIVED
          : productBlocked
            ? FIELD_STATUSES.BLOCKED
            : FIELD_STATUSES.NEEDS_FURTHER_ENTRY,
      source:
        hasValue(productRecord.click) && hasValue(productRecord.impression)
          ? "derived from click / impression"
          : null,
      note: "当前未见公开 CTR 字段时，只做派生，不冒充官方字段。"
    },
    {
      dimension: "产品级",
      field: "访问来源",
      status:
        findInterestingKeys(productPayloadKeys, /source|traffic/i).length > 0
          ? FIELD_STATUSES.CONFIRMED
          : productBlocked
            ? FIELD_STATUSES.BLOCKED
            : FIELD_STATUSES.NEEDS_FURTHER_ENTRY,
      source:
        findInterestingKeys(productPayloadKeys, /source|traffic/i).length > 0
          ? "alibaba.mydata.self.product.get"
          : null,
      note: null
    },
    {
      dimension: "产品级",
      field: "关键词来源",
      status:
        hasValue(productRecord.keyword_effects)
          ? FIELD_STATUSES.CONFIRMED
          : productBlocked
            ? FIELD_STATUSES.BLOCKED
            : FIELD_STATUSES.NOT_FOUND,
      source:
        hasValue(productRecord.keyword_effects)
          ? "alibaba.mydata.self.product.get: keyword_effects"
          : null,
      note: null
    },
    {
      dimension: "产品级",
      field: "询盘来源",
      status: productBlocked
        ? FIELD_STATUSES.BLOCKED
        : FIELD_STATUSES.NEEDS_FURTHER_ENTRY,
      source: null,
      note: "当前真实返回未见 inquiry source 公开字段。"
    },
    {
      dimension: "产品级",
      field: "国家来源",
      status:
        findInterestingKeys(productPayloadKeys, /country|nation/i).length > 0
          ? FIELD_STATUSES.CONFIRMED
          : productBlocked
            ? FIELD_STATUSES.BLOCKED
            : FIELD_STATUSES.NEEDS_FURTHER_ENTRY,
      source:
        findInterestingKeys(productPayloadKeys, /country|nation/i).length > 0
          ? "alibaba.mydata.self.product.get"
          : null,
      note: null
    },
    {
      dimension: "产品级",
      field: "近周期变化",
      status:
        findInterestingKeys(productPayloadKeys, /change|trend|period|mom|yoy/i)
          .length > 0
          ? FIELD_STATUSES.CONFIRMED
          : productBlocked
            ? FIELD_STATUSES.BLOCKED
            : FIELD_STATUSES.NEEDS_FURTHER_ENTRY,
      source:
        findInterestingKeys(productPayloadKeys, /change|trend|period|mom|yoy/i)
          .length > 0
          ? "alibaba.mydata.self.product.get"
          : null,
      note: "当前未见公开环比/同比字段时不脑补。"
    },
    {
      dimension: "订单级",
      field: "正式汇总",
      status: orderDerivation.derivable["正式汇总"]
        ? FIELD_STATUSES.DERIVED
        : FIELD_STATUSES.NOT_FOUND,
      source: orderDerivation.derivable["正式汇总"]
        ? "derived from order.list + order.get + order.fund.get"
        : null,
      note: null
    },
    {
      dimension: "订单级",
      field: "趋势",
      status: orderDerivation.derivable["趋势"]
        ? FIELD_STATUSES.DERIVED
        : FIELD_STATUSES.NOT_FOUND,
      source: orderDerivation.derivable["趋势"] ? trendSource : null,
      note: null
    },
    {
      dimension: "订单级",
      field: "国家结构",
      status: hasCountryInOrders
        ? FIELD_STATUSES.DERIVED
        : FIELD_STATUSES.NOT_FOUND,
      source: hasCountryInOrders
        ? "derived from order.get buyer.country / shipping country"
        : null,
      note: hasCountryInOrders
        ? null
        : "当前样本未稳定返回 buyer.country 或 shipping country。"
    },
    {
      dimension: "订单级",
      field: "产品贡献",
      status: orderDerivation.derivable["产品贡献"]
        ? FIELD_STATUSES.DERIVED
        : FIELD_STATUSES.NOT_FOUND,
      source: orderDerivation.derivable["产品贡献"]
        ? "derived from order.get.order_products"
        : null,
      note: null
    }
  ];
}

function saveMethodEvidence(methodResult) {
  const filename = `${methodResult.api_name.replace(/\./g, "_")}.json`;
  const filePath = path.join(EVIDENCE_DIR, filename);
  writeJson(filePath, sanitizeNode(methodResult));
  return filePath;
}

function buildValidationMarkdown(summary) {
  const lines = [
    "# WIKA_经营数据候选接口验证",
    "",
    `- evaluated_at: ${summary.evaluated_at}`,
    `- route_line: Railway production -> /sync + access_token + sha256`,
    `- scope: readonly candidate validation only`,
    "",
    "## 候选方法分类",
    "",
    "| 方法 | 范围 | 最终分类 | 最佳尝试 | 证据文件 |",
    "| --- | --- | --- | --- | --- |"
  ];

  for (const method of summary.method_results) {
    lines.push(
      `| ${method.api_name} | ${method.scope} | ${method.final_category} | ${method.best_attempt?.attempt_name ?? "-"} | ${method.evidence_file_name ?? "-"} |`
    );
  }

  lines.push("", "## 店铺级结论", "");
  lines.push(
    `- overview.date.get: ${summary.store_level.methods["alibaba.mydata.overview.date.get"].final_category}`
  );
  lines.push(
    `- overview.industry.get: ${summary.store_level.methods["alibaba.mydata.overview.industry.get"].final_category}`
  );
  lines.push(
    `- overview.indicator.basic.get: ${summary.store_level.methods["alibaba.mydata.overview.indicator.basic.get"].final_category}`
  );
  lines.push(
    `- selected_date_range: ${summary.store_level.selected_date_range.start_date} -> ${summary.store_level.selected_date_range.end_date} (${summary.store_level.selected_date_range.source})`
  );
  lines.push(
    `- selected_industry: \`${JSON.stringify(summary.store_level.selected_industry)}\``
  );

  lines.push("", "## 产品级结论", "");
  lines.push(
    `- validated_product_ids: ${summary.product_level.validated_product_ids.join(", ")}`
  );
  lines.push(
    `- self.product.date.get: ${summary.product_level.methods["alibaba.mydata.self.product.date.get"].final_category}`
  );
  lines.push(
    `- self.product.get: ${summary.product_level.methods["alibaba.mydata.self.product.get"].final_category}`
  );

  lines.push("", "## 订单级结论", "");
  lines.push(
    `- order.list: ${summary.order_level.methods["alibaba.seller.order.list"].final_category}`
  );
  lines.push(
    `- order.get: ${summary.order_level.methods["alibaba.seller.order.get"].final_category}`
  );
  lines.push(
    `- order.fund.get: ${summary.order_level.methods["alibaba.seller.order.fund.get"].final_category}`
  );
  lines.push(
    `- order.logistics.get: ${summary.order_level.methods["alibaba.seller.order.logistics.get"].final_category}`
  );
  lines.push(`- derivation: ${summary.order_derivation.final_category}`);
  lines.push(
    `- derivable: \`${JSON.stringify(summary.order_derivation.derivable)}\``
  );

  lines.push("", "## 真实证据摘要", "");
  for (const method of summary.method_results) {
    lines.push(`### ${method.api_name}`);
    lines.push(`- final_category: ${method.final_category}`);
    lines.push(`- best_attempt: ${method.best_attempt?.attempt_name ?? "-"}`);
    if (method.best_attempt?.extracted) {
      lines.push(
        `- extracted: \`${JSON.stringify(method.best_attempt.extracted)}\``
      );
    }
    if (method.best_attempt?.error_response) {
      lines.push(
        `- error: \`${JSON.stringify(method.best_attempt.error_response)}\``
      );
    }
  }

  lines.push("", "## 边界说明", "");
  lines.push("- 本轮只做候选接口验证，不等于任务 1/2 已打通。");
  lines.push("- 本轮没有新增任何平台内写动作，也没有把过授权层误写成已形成正式路由。");
  lines.push(
    "- 订单级经营汇总若成立，当前只写成“由现有官方交易读侧派生”，不写成新报表 API 已打通。"
  );

  return `${lines.join("\n")}\n`;
}

function buildMatrixMarkdown(matrixRows) {
  const lines = [
    "# WIKA_经营数据字段覆盖矩阵",
    "",
    "| 维度 | 目标字段 | 状态 | 来源 | 说明 |",
    "| --- | --- | --- | --- | --- |"
  ];

  for (const row of matrixRows) {
    lines.push(
      `| ${row.dimension} | ${row.field} | ${row.status} | ${row.source ?? "-"} | ${row.note ?? "-"} |`
    );
  }

  return `${lines.join("\n")}\n`;
}

async function main() {
  ensureDir(EVIDENCE_DIR);

  const railwayToken = readRailwayToken();
  const vars = await queryRailwayVariables(railwayToken);
  const credentials = {
    appKey: String(vars.ALIBABA_CLIENT_ID || "").trim(),
    appSecret: String(vars.ALIBABA_CLIENT_SECRET || "").trim(),
    refreshToken: String(vars.ALIBABA_WIKA_BOOTSTRAP_REFRESH_TOKEN || "").trim(),
    refreshUrl: getRefreshUrl(vars),
    partnerId: String(vars.ALIBABA_PARTNER_ID || "").trim()
  };

  const accessToken = await refreshAccessToken(credentials);
  const productionSamples = await collectProductionSamples();
  const runtimeCredentials = {
    ...credentials,
    accessToken
  };

  const storeLevel = await validateStoreLevel(runtimeCredentials);
  const productLevel = await validateProductLevel(
    runtimeCredentials,
    productionSamples
  );
  const orderLevel = await validateOrderLevel(runtimeCredentials, productionSamples);
  const orderDerivation = deriveOrderMetrics(orderLevel);

  const methodResults = [
    ...Object.values(storeLevel.methods),
    ...Object.values(productLevel.methods),
    ...Object.values(orderLevel.methods)
  ].map((methodResult) => {
    const scope =
      CANDIDATE_APIS.find((item) => item.api_name === methodResult.api_name)?.scope ??
      "unknown";
    const evidenceFilePath = saveMethodEvidence(methodResult);
    return {
      ...methodResult,
      scope,
      evidence_file: evidenceFilePath,
      evidence_file_name: path.basename(evidenceFilePath)
    };
  });

  const fieldMatrix = buildFieldCoverageMatrix({
    storeLevel,
    productLevel,
    orderLevel,
    orderDerivation
  });

  const summary = {
    evaluated_at: new Date().toISOString(),
    route_line: "Railway production -> /sync + access_token + sha256",
    production_samples: sanitizeNode(productionSamples),
    store_level: sanitizeNode(storeLevel),
    product_level: sanitizeNode(productLevel),
    order_level: sanitizeNode(orderLevel),
    order_derivation: sanitizeNode(orderDerivation),
    method_results: sanitizeNode(methodResults),
    field_matrix: sanitizeNode(fieldMatrix)
  };

  writeJson(SUMMARY_JSON_PATH, summary);
  writeText(SUMMARY_DOC_PATH, buildValidationMarkdown(summary));
  writeText(MATRIX_DOC_PATH, buildMatrixMarkdown(fieldMatrix));

  console.log(
    JSON.stringify(
      {
        ok: true,
        evaluated_at: summary.evaluated_at,
        summary_json: path.relative(ROOT_DIR, SUMMARY_JSON_PATH),
        summary_doc: path.relative(ROOT_DIR, SUMMARY_DOC_PATH),
        matrix_doc: path.relative(ROOT_DIR, MATRIX_DOC_PATH),
        method_categories: methodResults.map((item) => ({
          api_name: item.api_name,
          final_category: item.final_category
        })),
        order_derivation: orderDerivation.final_category
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        fatal: error instanceof Error ? error.message : String(error)
      },
      null,
      2
    )
  );
  process.exit(1);
});
