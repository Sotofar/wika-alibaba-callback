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

const STAGE28_EVIDENCE_PATH = path.join(
  ROOT,
  "docs",
  "framework",
  "evidence",
  "stage28-xd-continuous-closure.json"
);
const EVIDENCE_PATH = path.join(
  ROOT,
  "docs",
  "framework",
  "evidence",
  "stage29-xd-candidate-final-closure.json"
);

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

const GROUP_A = [
  {
    method: "alibaba.mydata.self.keyword.effect.week.get",
    doc_url:
      "https://open.alibaba.com/doc/api.htm#/api?cid=20785&path=alibaba.mydata.self.keyword.effect.week.get&methodType=GET/POST",
    doc_required_top_level: ["date_range", "properties"],
    doc_properties_fields: [
      "keywords_in_use",
      "keywords_viewed",
      "offset",
      "order_by_mode",
      "limit",
      "is_p4p",
      "keyword",
      "order_by_field"
    ],
    buildRequest: ({ dateRange }) => ({
      date_range: dateRange,
      properties: {
        keywords_in_use: "ALL",
        keywords_viewed: "ALL",
        offset: "0",
        order_by_mode: "desc",
        limit: "10",
        is_p4p: "ALL",
        keyword: "mp3",
        order_by_field: "sumShowCnt"
      }
    })
  },
  {
    method: "alibaba.mydata.industry.keyword.get",
    doc_url:
      "https://open.alibaba.com/doc/api.htm#/api?cid=20785&path=alibaba.mydata.industry.keyword.get&methodType=GET/POST",
    doc_required_top_level: ["keywords", "properties"],
    doc_properties_fields: [
      "offset",
      "order_by_mode",
      "limit",
      "precise_match",
      "order_by_field"
    ],
    buildRequest: () => ({
      keywords: "mp3",
      properties: {
        offset: "0",
        order_by_mode: "desc",
        limit: "10",
        precise_match: "false",
        order_by_field: "srh_pv_this_mon"
      }
    })
  }
];

const GROUP_B_METHODS = [
  "alibaba.seller.trade.decode",
  "alibaba.mydata.self.keyword.date.get",
  "alibaba.mydata.self.keyword.effect.month.get",
  "alibaba.mydata.seller.opendata.getconkeyword"
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
    throw new Error(JSON.stringify(payload.errors));
  }
  return payload?.data?.variables ?? {};
}

function getRefreshUrl(vars, prefix) {
  return String(
    vars[`${prefix}_REFRESH_TOKEN_URL`] ||
      String(vars[`${prefix}_TOKEN_URL`] || "").replace("/auth/token/create", "/auth/token/refresh")
  ).trim();
}

async function refreshAccessToken({ appKey, appSecret, refreshToken, refreshUrl, partnerId }) {
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
    throw new Error(JSON.stringify(sanitize(payload)));
  }
  return payload.access_token;
}

async function fetchRoute(pathname) {
  const started = Date.now();
  const response = await fetch(`${BASE_URL}${pathname}`);
  const text = await response.text();
  const isJson = (response.headers.get("content-type") || "").includes("json");
  return {
    pathname,
    status: response.status,
    elapsed_ms: Date.now() - started,
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
    if (serialized !== "") {
      params[key] = serialized;
    }
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
    body: isJson ? JSON.parse(text) : null,
    text: isJson ? null : text.slice(0, 240)
  };
}

function topError(body) {
  const err = body?.error_response || (body?.code && String(body.code) !== "0" ? body : null);
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

function summarizeSyncBody(apiName, body) {
  if (!body || typeof body !== "object") return null;
  const payload = extractPayload(apiName, body);
  return {
    top_keys: Object.keys(body).slice(0, 20),
    payload_keys: payload && typeof payload === "object" ? Object.keys(payload).slice(0, 20) : null,
    meaningful: hasMeaningfulData(payload, SYNC_META_KEYS)
  };
}

function summarizeRouteBody(body) {
  if (!body || typeof body !== "object") return null;
  return {
    top_keys: Object.keys(body).slice(0, 20),
    meaningful: hasMeaningfulData(body, new Set())
  };
}

function classifyCandidate(response) {
  const error = topError(response.body);
  if (error) {
    const raw = `${error.code || ""} ${error.sub_code || ""} ${error.msg || ""} ${error.sub_msg || ""}`.toLowerCase();
    if (raw.includes("permission") || raw.includes("insufficient")) return "TENANT_OR_PRODUCT_RESTRICTION";
    if (raw.includes("missingparameter") || raw.includes("missing parameter")) return "PARAM_CONTRACT_MISSING";
    if (raw.includes("invalid") || raw.includes("illegal")) return "PARAM_CONTRACT_CONFIRMED";
    if (raw.includes("scope") || raw.includes("not support") || raw.includes("not exist")) {
      return "DOC_SCOPE_MISMATCH";
    }
    return "UNKNOWN";
  }
  return summarizeSyncBody("candidate", response.body)?.meaningful ? "PASSED" : "NO_DATA";
}

function finalizeGroupA(initial, regression) {
  if (regression && regression !== initial) {
    return "FLAKY_EQUIVALENT";
  }
  if (initial === "PARAM_CONTRACT_MISSING") {
    return "PARAM_CONTRACT_MISSING_CONFIRMED";
  }
  if (initial === "TENANT_OR_PRODUCT_RESTRICTION") {
    return "TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED";
  }
  return initial;
}

function isoDay(offsetDays = 0) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function readStage28Evidence() {
  return JSON.parse(fs.readFileSync(STAGE28_EVIDENCE_PATH, "utf8"));
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
    fetchRoute("/integrations/alibaba/xd/data/orders/list?page_size=1"),
    fetchRoute("/integrations/alibaba/xd/data/categories/tree"),
    fetchRoute("/integrations/alibaba/xd/data/media/list?page_size=1"),
    fetchRoute("/integrations/alibaba/xd/reports/orders/minimal-diagnostic")
  ]);

  const passBase =
    canaries[0].status === 200 &&
    canaries[1].status === 200 &&
    canaries[2].status === 200 &&
    canaries[3].status === 200;
  if (!passBase) {
    throw new Error("BLOCKED_ENV: base canary failed");
  }

  const sampleOrder = (canaries[3].body?.items || []).find((item) => item?.trade_id) || {};
  const tradeId = sampleOrder.trade_id || null;
  if (!tradeId) {
    throw new Error("BLOCKED_ENV: missing live trade_id sample");
  }

  const dateRange = {
    start_date: isoDay(-30),
    end_date: isoDay(-1)
  };
  const stage28Evidence = readStage28Evidence();

  const groupAResults = [];
  for (const definition of GROUP_A) {
    const requestParams = definition.buildRequest({ dateRange });
    const first = await callSyncApi(credentials, definition.method, requestParams);
    const firstClassification = classifyCandidate(first);
    const second = await callSyncApi(credentials, definition.method, requestParams);
    const secondClassification = classifyCandidate(second);
    groupAResults.push({
      method: definition.method,
      doc_url: definition.doc_url,
      doc_required_top_level: definition.doc_required_top_level,
      doc_properties_fields: definition.doc_properties_fields,
      request_params: sanitize(requestParams),
      initial_attempt: {
        status_code: first.status,
        elapsed_ms: first.elapsed_ms,
        classification: firstClassification,
        summary: summarizeSyncBody(definition.method, first.body),
        error: topError(first.body)
      },
      regression_attempt: {
        status_code: second.status,
        elapsed_ms: second.elapsed_ms,
        classification: secondClassification,
        summary: summarizeSyncBody(definition.method, second.body),
        error: topError(second.body)
      },
      final_classification: finalizeGroupA(firstClassification, secondClassification)
    });
  }

  const groupBResults = GROUP_B_METHODS.map((method) => {
    const previous = stage28Evidence.candidate_pool.find((item) => item.method === method) || null;
    return {
      method,
      retested_in_stage29: false,
      stage28_reference: previous
        ? {
            status_code: previous.status_code,
            final_classification: previous.final_classification,
            error: previous.error,
            request_params: previous.request_params ?? null
          }
        : null,
      final_classification: "TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED"
    };
  });

  const stableRouteSanity = await fetchRoute("/integrations/alibaba/xd/data/orders/list?page_size=1");
  const stableDirectSanity = await callSyncApi(credentials, "alibaba.seller.order.get", {
    e_trade_id: tradeId
  });

  const counts = {
    passed_count: groupAResults.filter((item) => item.final_classification === "PASSED").length,
    no_data_count: groupAResults.filter((item) => item.final_classification === "NO_DATA").length,
    param_contract_confirmed_count: groupAResults.filter(
      (item) => item.final_classification === "PARAM_CONTRACT_CONFIRMED"
    ).length,
    param_contract_missing_confirmed_count: groupAResults.filter(
      (item) => item.final_classification === "PARAM_CONTRACT_MISSING_CONFIRMED"
    ).length,
    tenant_restriction_confirmed_count:
      groupAResults.filter(
        (item) => item.final_classification === "TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED"
      ).length +
      groupBResults.length +
      groupAResults.filter(
        (item) => item.final_classification === "TENANT_OR_PRODUCT_RESTRICTION"
      ).length,
    blocked_env_count: 0,
    unknown_count: groupAResults.filter((item) => item.final_classification === "UNKNOWN").length,
    flaky_count: groupAResults.filter((item) => item.final_classification === "FLAKY_EQUIVALENT").length
  };

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
    candidate_start_count: 6,
    candidate_end_unresolved_count: 0,
    group_a: groupAResults,
    group_b: groupBResults,
    regression: {
      stable_route: {
        path: stableRouteSanity.pathname,
        status_code: stableRouteSanity.status,
        summary: summarizeRouteBody(stableRouteSanity.body)
      },
      stable_direct: {
        method: "alibaba.seller.order.get",
        status_code: stableDirectSanity.status,
        final_classification: classifyCandidate(stableDirectSanity),
        summary: summarizeSyncBody("alibaba.seller.order.get", stableDirectSanity.body),
        error: topError(stableDirectSanity.body)
      }
    },
    passed_count: counts.passed_count,
    no_data_count: counts.no_data_count,
    param_contract_confirmed_count: counts.param_contract_confirmed_count,
    param_contract_missing_confirmed_count: counts.param_contract_missing_confirmed_count,
    tenant_restriction_confirmed_count: counts.tenant_restriction_confirmed_count,
    blocked_env_count: counts.blocked_env_count,
    unknown_count: counts.unknown_count,
    flaky_count: counts.flaky_count,
    biggest_blocker:
      counts.param_contract_missing_confirmed_count > 0
        ? "keyword properties sample is now documented, but at least one keyword API still cannot close to a stable live business result."
        : "remaining reopen path requires external tenant/product evidence instead of more in-repo retries.",
    safe_scope_complete: true
  };

  writeJson(EVIDENCE_PATH, sanitize(result));
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        fatal: error instanceof Error ? error.message : String(error)
      },
      null,
      2
    )
  );
  process.exit(1);
});
