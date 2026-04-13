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
const EVIDENCE_PATH = path.join(
  ROOT,
  "docs",
  "framework",
  "evidence",
  "stage28-xd-continuous-closure.json"
);
const START_GAP_COUNT = 14;

const ROUTE_META_KEYS = new Set([
  "ok",
  "module",
  "account",
  "read_only",
  "verification_status",
  "evidence_level",
  "source",
  "request",
  "request_meta",
  "response_meta",
  "verified_fields",
  "warnings",
  "raw_root_key",
  "data_scope",
  "data_validation"
]);
const SYNC_META_KEYS = new Set([
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

const ROUTE_DEFINITIONS = [
  {
    batch: "A",
    family: "categories",
    name: "categories/tree",
    buildPath: () => "/integrations/alibaba/xd/data/categories/tree"
  },
  {
    batch: "A",
    family: "categories",
    name: "categories/attributes",
    buildPath: ({ catId }) =>
      `/integrations/alibaba/xd/data/categories/attributes?cat_id=${encodeURIComponent(catId ?? "")}`
  },
  {
    batch: "A",
    family: "products schema",
    name: "products/schema",
    buildPath: ({ catId }) =>
      `/integrations/alibaba/xd/data/products/schema?cat_id=${encodeURIComponent(catId ?? "")}`
  },
  {
    batch: "A",
    family: "products schema",
    name: "products/schema/render",
    buildPath: ({ catId, numericProductId }) =>
      `/integrations/alibaba/xd/data/products/schema/render?cat_id=${encodeURIComponent(catId ?? "")}&product_id=${encodeURIComponent(numericProductId ?? "")}`
  },
  {
    batch: "A",
    family: "products schema",
    name: "products/schema/render/draft",
    buildPath: ({ catId, numericProductId }) =>
      `/integrations/alibaba/xd/data/products/schema/render/draft?cat_id=${encodeURIComponent(catId ?? "")}&product_id=${encodeURIComponent(numericProductId ?? "")}`
  },
  {
    batch: "B",
    family: "media",
    name: "media/list",
    buildPath: () => "/integrations/alibaba/xd/data/media/list?page_size=1"
  },
  {
    batch: "B",
    family: "media",
    name: "media/groups",
    buildPath: () => "/integrations/alibaba/xd/data/media/groups"
  },
  {
    batch: "C",
    family: "customers",
    name: "customers/list",
    buildPath: ({ customerWindow }) =>
      `/integrations/alibaba/xd/data/customers/list?customer_id_begin=0&last_sync_end_time=${encodeURIComponent(customerWindow)}&page_size=1`
  },
  {
    batch: "C",
    family: "orders draft-types",
    name: "orders/draft-types",
    buildPath: () => "/integrations/alibaba/xd/data/orders/draft-types"
  },
  {
    batch: "C",
    family: "minimal-diagnostic",
    name: "reports/products/minimal-diagnostic",
    buildPath: () => "/integrations/alibaba/xd/reports/products/minimal-diagnostic"
  },
  {
    batch: "C",
    family: "minimal-diagnostic",
    name: "reports/orders/minimal-diagnostic",
    buildPath: () => "/integrations/alibaba/xd/reports/orders/minimal-diagnostic"
  },
  {
    batch: "C",
    family: "minimal-diagnostic",
    name: "reports/operations/minimal-diagnostic",
    buildPath: () => "/integrations/alibaba/xd/reports/operations/minimal-diagnostic"
  },
  {
    batch: "D",
    family: "draft tools",
    name: "tools/reply-draft",
    skipped: true,
    classification: "WRITE_ADJACENT_SKIPPED",
    skip_reason:
      "POST draft package route is write-adjacent and not a strict read-only query/diagnostic surface."
  },
  {
    batch: "D",
    family: "draft tools",
    name: "tools/order-draft",
    skipped: true,
    classification: "WRITE_ADJACENT_SKIPPED",
    skip_reason:
      "POST order draft package route is write-adjacent and not a strict read-only query/diagnostic surface."
  }
];

const CANDIDATES = [
  {
    method: "alibaba.seller.trade.decode",
    build: ({ tradeId, buyerEncryptorId }) => ({
      e_trade_id: tradeId,
      encryptor_id: buyerEncryptorId
    })
  },
  {
    method: "alibaba.icbu.product.type.available.get",
    build: ({ catId }) => ({
      type_request: {
        cat_id: catId,
        language: "en_US"
      }
    })
  },
  {
    method: "alibaba.mydata.self.keyword.effect.week.get",
    build: ({ statDate, dateRange }) => ({
      stat_date: statDate,
      date_range: dateRange
    })
  },
  {
    method: "alibaba.mydata.industry.keyword.get",
    build: ({ dateRange, industry, keyword }) => ({
      date_range: dateRange,
      industry,
      keywords: keyword ? [keyword] : []
    })
  },
  {
    method: "alibaba.mydata.self.keyword.date.get",
    build: () => ({
      statistics_type: "day"
    })
  },
  {
    method: "alibaba.mydata.self.keyword.effect.month.get",
    build: ({ statDate }) => ({
      stat_date: statDate
    })
  },
  {
    method: "alibaba.mydata.seller.opendata.getconkeyword",
    build: () => ({})
  }
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
  if (Array.isArray(node)) return node.map((item) => sanitize(item));
  if (!node || typeof node !== "object") return node;
  const out = {};
  for (const [key, value] of Object.entries(node)) {
    if (/(token|secret|sign|authorization|cookie|app_key|client_id|client_secret)/i.test(key)) {
      out[key] = "***";
    } else if (
      /(trade_id|e_trade_id|product_id|group_id|cat_id|encryptor_id|login|email|phone|mobile|address)/i.test(
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

function signSha256(apiName, params, appSecret) {
  const keys = Object.keys(params)
    .filter((key) => key !== "sign")
    .sort((left, right) => Buffer.from(left).compare(Buffer.from(right)));
  let payload = apiName;
  for (const key of keys) {
    const value = params[key];
    if (value === undefined || value === null || value === "") continue;
    payload += `${key}${value}`;
  }
  return crypto
    .createHmac("sha256", appSecret)
    .update(payload, "utf8")
    .digest("hex")
    .toUpperCase();
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
  if (payload?.errors?.length) throw new Error(JSON.stringify(payload.errors));
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
  return {
    status: response.status,
    elapsed_ms: Date.now() - started,
    is_json: isJson,
    body: isJson ? JSON.parse(text) : null,
    text: isJson ? null : text.slice(0, 240)
  };
}

function topError(body) {
  const err =
    body?.error_response ||
    (body?.code && String(body.code) !== "0" ? body : null);
  if (!err) return null;
  return {
    code: err.code ?? null,
    sub_code: err.sub_code ?? err.subCode ?? null,
    msg: err.msg ?? err.message ?? null,
    sub_msg: err.sub_msg ?? err.subMsg ?? null
  };
}

function extractPayload(apiName, body) {
  if (!body || typeof body !== "object") return null;
  const rootKey =
    Object.keys(body).find((key) => key.endsWith("_response")) ||
    `${apiName.replace(/\./g, "_")}_response`;
  return body[rootKey] ?? null;
}

function hasMeaningfulData(node, metaKeys) {
  if (Array.isArray(node)) return node.some((item) => hasMeaningfulData(item, metaKeys));
  if (!node || typeof node !== "object") {
    return node !== null && node !== undefined && node !== "";
  }
  for (const [key, value] of Object.entries(node)) {
    if (metaKeys.has(key)) continue;
    if (hasMeaningfulData(value, metaKeys)) return true;
  }
  return false;
}

function summarizeRouteBody(body) {
  if (!body || typeof body !== "object") return null;
  const businessKeys = Object.keys(body).filter((key) => !ROUTE_META_KEYS.has(key));
  const businessPayload = {};
  for (const key of businessKeys) {
    businessPayload[key] = body[key];
  }
  return {
    top_keys: Object.keys(body).slice(0, 20),
    business_keys: businessKeys.slice(0, 20),
    meaningful: hasMeaningfulData(businessPayload, new Set())
  };
}

function summarizeSyncBody(apiName, body) {
  if (!body || typeof body !== "object") return null;
  const payload = extractPayload(apiName, body);
  return {
    top_keys: Object.keys(body).slice(0, 20),
    payload_keys:
      payload && typeof payload === "object" ? Object.keys(payload).slice(0, 20) : null,
    meaningful: hasMeaningfulData(payload, SYNC_META_KEYS)
  };
}

function classifyRoute(definition, response) {
  if (definition.skipped) return definition.classification;
  if (response.status === 404) return "DOC_MISMATCH";
  const body = response.body;
  const top = topError(body);
  const raw = `${body?.error_category || ""} ${body?.error || ""} ${top?.code || ""} ${top?.sub_code || ""} ${top?.msg || ""} ${top?.sub_msg || ""}`.toLowerCase();
  if (raw.includes("permission") || raw.includes("insufficient")) {
    return "TENANT_OR_PRODUCT_RESTRICTION";
  }
  if (
    raw.includes("parameter") ||
    raw.includes("missing") ||
    Array.isArray(body?.missing_keys)
  ) {
    return "PARAM_CONTRACT_MISSING";
  }
  if (response.status === 200) {
    if (definition.name === "products/schema/render/draft") {
      const schemaLength = Number(body?.response_meta?.schema_xml_length ?? 0);
      if (!schemaLength || body?.response_meta?.biz_success === false) {
        return "ROUTE_BOUND_NO_DATA";
      }
    }
    return summarizeRouteBody(body)?.meaningful
      ? "ROUTE_BOUND_AND_PASSED"
      : "ROUTE_BOUND_NO_DATA";
  }
  return "UNKNOWN";
}

function classifyCandidate(definition, response) {
  const error = topError(response.body);
  if (error) {
    const raw =
      `${error.code || ""} ${error.sub_code || ""} ${error.msg || ""} ${error.sub_msg || ""}`.toLowerCase();
    if (raw.includes("permission") || raw.includes("insufficient")) {
      return "TENANT_OR_PRODUCT_RESTRICTION";
    }
    if (raw.includes("missingparameter") || raw.includes("missing parameter")) {
      return "PARAM_CONTRACT_MISSING";
    }
    if (raw.includes("invalid") || raw.includes("illegal")) {
      return "PARAM_CONTRACT_CONFIRMED";
    }
    if (raw.includes("scope") || raw.includes("not support") || raw.includes("not exist")) {
      return "DOC_SCOPE_MISMATCH";
    }
    return "UNKNOWN";
  }
  return summarizeSyncBody(definition.method, response.body)?.meaningful
    ? "PASSED"
    : "NO_DATA";
}

function isoDay(offsetDays = 0) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function pickFirstKeyword(productDetailBody) {
  const rawKeywordValue =
    productDetailBody?.product?.keywords?.string ??
    productDetailBody?.product?.keywords ??
    null;
  if (Array.isArray(rawKeywordValue)) {
    return rawKeywordValue.map((item) => String(item).trim()).find(Boolean) || null;
  }
  if (typeof rawKeywordValue !== "string") {
    return null;
  }
  return rawKeywordValue
    .split(/[;,]/)
    .map((item) => item.trim())
    .find(Boolean);
}

function extractBuyerEncryptorId(orderDetailBody) {
  if (Array.isArray(orderDetailBody)) {
    for (const item of orderDetailBody) {
      const hit = extractBuyerEncryptorId(item);
      if (hit) return hit;
    }
    return null;
  }

  if (!orderDetailBody || typeof orderDetailBody !== "object") {
    return null;
  }

  if (orderDetailBody.buyer) {
    return (
      orderDetailBody.buyer.immutable_eid ??
      orderDetailBody.buyer.e_account_id ??
      null
    );
  }

  for (const value of Object.values(orderDetailBody)) {
    const hit = extractBuyerEncryptorId(value);
    if (hit) return hit;
  }

  return null;
}

async function main() {
  const railwayVars = await queryRailwayVariables(readRailwayToken());
  const credentials = {
    appKey: String(railwayVars.ALIBABA_XD_CLIENT_ID || "").trim(),
    appSecret: String(railwayVars.ALIBABA_XD_CLIENT_SECRET || "").trim(),
    refreshToken: String(railwayVars.ALIBABA_XD_BOOTSTRAP_REFRESH_TOKEN || "").trim(),
    refreshUrl:
      getRefreshUrl(railwayVars, "ALIBABA_XD") || getRefreshUrl(railwayVars, "ALIBABA"),
    partnerId: String(
      railwayVars.ALIBABA_XD_PARTNER_ID || railwayVars.ALIBABA_PARTNER_ID || ""
    ).trim()
  };
  credentials.accessToken = await refreshAccessToken(credentials);

  const canaries = await Promise.all([
    fetchRoute("/health"),
    fetchRoute("/integrations/alibaba/auth/debug"),
    fetchRoute("/integrations/alibaba/xd/auth/debug"),
    fetchRoute("/integrations/alibaba/xd/data/products/list?page_size=1"),
    fetchRoute("/integrations/alibaba/xd/data/orders/list?page_size=1")
  ]);

  const baseHealthy =
    canaries[0].status === 200 &&
    canaries[1].status === 200 &&
    canaries[2].status === 200 &&
    canaries[3].status === 200 &&
    canaries[4].status === 200;
  if (!baseHealthy) {
    throw new Error("BLOCKED_ENV: base canary failed");
  }

  const sampleProduct =
    (canaries[3].body?.items || []).find((item) => item?.product_id || item?.id) || {};
  const sampleOrder =
    (canaries[4].body?.items || []).find((item) => item?.trade_id) || {};
  const productId = sampleProduct.product_id || null;
  const numericProductId = sampleProduct.id || null;
  const groupId = sampleProduct.group_id || null;
  const catId = sampleProduct.category_id || sampleProduct.cat_id || null;
  const tradeId = sampleOrder.trade_id || null;
  const customerWindow = `${isoDay(-7)} 00:00:00`;
  const dateRange = {
    start_date: isoDay(-30),
    end_date: isoDay(-1)
  };
  const industry = {
    industry_id: 111,
    industry_desc: "All",
    main_category: true
  };
  const statDate = isoDay(-1);

  if (!productId || !numericProductId || !catId || !tradeId) {
    throw new Error("BLOCKED_ENV: missing live XD product/order samples");
  }

  const productDetailRoute = await fetchRoute(
    `/integrations/alibaba/xd/data/products/detail?product_id=${encodeURIComponent(productId)}`
  );
  const orderDetailRoute = await fetchRoute(
    `/integrations/alibaba/xd/data/orders/detail?e_trade_id=${encodeURIComponent(tradeId)}`
  );
  const keyword = pickFirstKeyword(productDetailRoute.body);
  const buyerEncryptorId = extractBuyerEncryptorId(orderDetailRoute.body);

  const routeContext = {
    productId,
    numericProductId,
    groupId,
    catId,
    tradeId,
    customerWindow
  };
  const routeResults = [];
  for (const definition of ROUTE_DEFINITIONS) {
    if (definition.skipped) {
      routeResults.push({
        batch: definition.batch,
        family: definition.family,
        name: definition.name,
        path: `/integrations/alibaba/xd/${definition.name}`,
        status_code: null,
        elapsed_ms: null,
        final_classification: definition.classification,
        summary: null,
        error: null,
        top_error: null,
        skip_reason: definition.skip_reason
      });
      continue;
    }

    const pathName = definition.buildPath(routeContext);
    const response = await fetchRoute(pathName);
    routeResults.push({
      batch: definition.batch,
      family: definition.family,
      name: definition.name,
      path: pathName,
      status_code: response.status,
      elapsed_ms: response.elapsed_ms,
      final_classification: classifyRoute(definition, response),
      summary: summarizeRouteBody(response.body),
      error: topError(response.body),
      top_error: response.body?.top_error ?? null,
      raw_error_category: response.body?.error_category || null
    });
  }

  const candidateContext = {
    productId,
    numericProductId,
    groupId,
    catId,
    tradeId,
    dateRange,
    industry,
    statDate,
    keyword,
    buyerEncryptorId
  };
  const candidateResults = [];
  for (const definition of CANDIDATES) {
    const requestParams = definition.build(candidateContext);
    const response = await callSyncApi(credentials, definition.method, requestParams);
    candidateResults.push({
      method: definition.method,
      request_params: sanitize(requestParams),
      status_code: response.status,
      elapsed_ms: response.elapsed_ms,
      final_classification: classifyCandidate(definition, response),
      summary: summarizeSyncBody(definition.method, response.body),
      error: topError(response.body)
    });
  }

  const routeRegression = [];
  for (const item of routeResults.filter(
    (entry) => entry.final_classification === "ROUTE_BOUND_AND_PASSED"
  )) {
    const response = await fetchRoute(item.path);
    routeRegression.push({
      name: item.name,
      status_code: response.status,
      recheck_classification: classifyRoute(
        ROUTE_DEFINITIONS.find((definition) => definition.name === item.name),
        response
      )
    });
  }

  const stableRouteSanity = await fetchRoute(
    "/integrations/alibaba/xd/data/orders/list?page_size=1"
  );
  const stableDirectSanity = await callSyncApi(credentials, "alibaba.seller.order.get", {
    e_trade_id: tradeId
  });

  const biggestBlocker =
    candidateResults.find((item) => item.final_classification === "PARAM_CONTRACT_MISSING")
      ?.method ||
    routeResults.find(
      (item) => item.final_classification === "TENANT_OR_PRODUCT_RESTRICTION"
    )?.name ||
    null;

  const batchResults = {};
  for (const batchName of ["A", "B", "C", "D", "E"]) {
    batchResults[batchName] = {
      routes: routeResults
        .filter((item) => item.batch === batchName)
        .map((item) => ({
          name: item.name,
          family: item.family,
          final_classification: item.final_classification
        })),
      candidates:
        batchName === "E"
          ? candidateResults.map((item) => ({
              method: item.method,
              final_classification: item.final_classification
            }))
          : []
    };
  }

  const result = {
    evaluated_at: new Date().toISOString(),
    current_head: execSync("git rev-parse HEAD", { cwd: ROOT }).toString().trim(),
    base_url: BASE_URL,
    production_gate: {
      status: "PASS_BASE",
      canaries: canaries.map((item) => ({
        path: item.pathname,
        status_code: item.status,
        elapsed_ms: item.elapsed_ms
      }))
    },
    samples: sanitize({
      productId,
      numericProductId,
      groupId,
      catId,
      tradeId,
      keyword,
      buyerEncryptorId,
      dateRange,
      industry,
      statDate
    }),
    remaining_gap_start_count: START_GAP_COUNT,
    remaining_gap_end_count: routeResults.filter(
      (item) => item.final_classification === "DOC_MISMATCH"
    ).length,
    batch_results: batchResults,
    route_pass_count: routeResults.filter(
      (item) => item.final_classification === "ROUTE_BOUND_AND_PASSED"
    ).length,
    route_no_data_count: routeResults.filter(
      (item) => item.final_classification === "ROUTE_BOUND_NO_DATA"
    ).length,
    param_missing_count:
      routeResults.filter((item) => item.final_classification === "PARAM_CONTRACT_MISSING")
        .length +
      candidateResults.filter(
        (item) => item.final_classification === "PARAM_CONTRACT_MISSING"
      ).length,
    tenant_restriction_count:
      routeResults.filter(
        (item) => item.final_classification === "TENANT_OR_PRODUCT_RESTRICTION"
      ).length +
      candidateResults.filter(
        (item) => item.final_classification === "TENANT_OR_PRODUCT_RESTRICTION"
      ).length,
    write_adjacent_skipped_count: routeResults.filter(
      (item) => item.final_classification === "WRITE_ADJACENT_SKIPPED"
    ).length,
    blocked_env_count: 0,
    unknown_count:
      routeResults.filter((item) => item.final_classification === "UNKNOWN").length +
      candidateResults.filter((item) => item.final_classification === "UNKNOWN").length,
    candidate_pool_summary: candidateResults.map((item) => ({
      method: item.method,
      final_classification: item.final_classification,
      error: item.error
    })),
    biggest_blocker: biggestBlocker,
    routes: routeResults,
    candidate_pool: candidateResults,
    regression: {
      rechecked_passed_routes: routeRegression,
      stable_route: {
        path: stableRouteSanity.pathname,
        status_code: stableRouteSanity.status
      },
      stable_direct: {
        method: "alibaba.seller.order.get",
        final_classification: classifyCandidate(
          { method: "alibaba.seller.order.get" },
          stableDirectSanity
        ),
        status_code: stableDirectSanity.status
      }
    }
  };

  writeJson(EVIDENCE_PATH, sanitize(result));
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      { fatal: error instanceof Error ? error.message : String(error) },
      null,
      2
    )
  );
  process.exit(1);
});
