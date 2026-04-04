import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";

const RAILWAY_TOKEN_PATH = path.join(os.tmpdir(), "railway-cli-token.txt");
const PROJECT_ID = "7cc408fd-c2a3-403c-9b4e-adaa72a9a712";
const ENVIRONMENT_ID = "4afccea8-ada6-42d5-9bd7-0f73cca404dc";
const SERVICE_ID = "d7abfb5c-25c6-478c-a51a-69d85151127a";
const GRAPHQL_URL = "https://backboard.railway.com/graphql/v2";
const SYNC_URL = "https://open-api.alibaba.com/sync";

function readRailwayToken() {
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

function serializeValue(value) {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
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
  const body = isJson ? JSON.parse(text) : text;

  return {
    status: response.status,
    isJson,
    body,
    text
  };
}

function formatTopDateTime(date) {
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

function detectCategory(raw = "") {
  const lower = raw.toLowerCase();

  if (
    lower.includes("insufficientpermission") ||
    lower.includes("permission denied") ||
    lower.includes("permission")
  ) {
    return "权限错误";
  }

  if (
    lower.includes("missingparameter") ||
    lower.includes("invalid-parameter") ||
    lower.includes("some parameters set null or error") ||
    lower.includes("illegal parameter") ||
    lower.includes("query params is null") ||
    lower.includes("record does not exist")
  ) {
    return "业务参数错误（说明已过授权层）";
  }

  if (
    lower.includes("appkey") ||
    lower.includes("invalid app key") ||
    lower.includes("unsupported api") ||
    lower.includes("isv.appkey")
  ) {
    return "应用能力不匹配";
  }

  if (
    lower.includes("session") ||
    lower.includes("router/rest") ||
    lower.includes("聚石塔") ||
    lower.includes("jst")
  ) {
    return "旧体系 / 高风险";
  }

  return "当前未识别到可用入口";
}

function extractRootPayload(apiName, body = {}) {
  const rootKey = `${apiName.replace(/\./g, "_")}_response`;
  return {
    rootKey,
    payload: body?.[rootKey] ?? null
  };
}

function classifyResponse(apiName, attempt, response) {
  if (!response.isJson) {
    const text = String(response.text || "");
    const lower = text.toLowerCase();
    if (lower.includes("<html") || lower.includes("<!doctype")) {
      return {
        api_name: apiName,
        attempt_name: attempt.name,
        classification: "旧体系 / 高风险",
        detail: {
          type: "html",
          status: response.status
        }
      };
    }

    return {
      api_name: apiName,
      attempt_name: attempt.name,
      classification: "当前未识别到可用入口",
      detail: {
        type: "non_json",
        status: response.status
      }
    };
  }

  const body = response.body ?? {};
  const rootKeys = Object.keys(body);
  const error = body?.error_response ?? null;
  if (error) {
    const raw = [
      error?.code ?? "",
      error?.sub_code ?? "",
      error?.msg ?? "",
      error?.sub_msg ?? ""
    ]
      .filter(Boolean)
      .join(" | ");

    return {
      api_name: apiName,
      attempt_name: attempt.name,
      classification: detectCategory(raw),
      detail: {
        type: "top_error",
        status: response.status,
        error_response: error
      }
    };
  }

  const { rootKey, payload } = extractRootPayload(apiName, body);
  if (
    payload &&
    (payload.errorcode ||
      payload.errormsg ||
      payload.msg_code ||
      payload.message ||
      payload.success === false ||
      payload.biz_success === false)
  ) {
    const raw = [
      payload?.errorcode ?? "",
      payload?.errormsg ?? "",
      payload?.msg_code ?? "",
      payload?.message ?? "",
      payload?.success === false ? "success=false" : "",
      payload?.biz_success === false ? "biz_success=false" : ""
    ]
      .filter(Boolean)
      .join(" | ");

    return {
      api_name: apiName,
      attempt_name: attempt.name,
      classification: detectCategory(raw),
      detail: {
        type: "business_error",
        status: response.status,
        root_key: rootKey,
        payload_excerpt: payload
      }
    };
  }

  return {
    api_name: apiName,
    attempt_name: attempt.name,
    classification: "真实 JSON 样本数据",
    detail: {
      type: "json",
      status: response.status,
      root_keys: rootKeys,
      root_key: rootKey,
      payload_excerpt: payload
    }
  };
}

function pickBestResult(results) {
  const priority = new Map([
    ["真实 JSON 样本数据", 0],
    ["业务参数错误（说明已过授权层）", 1],
    ["权限错误", 2],
    ["应用能力不匹配", 3],
    ["旧体系 / 高风险", 4],
    ["当前未识别到可用入口", 5]
  ]);

  return [...results].sort(
    (left, right) =>
      (priority.get(left.classification) ?? 99) -
      (priority.get(right.classification) ?? 99)
  )[0];
}

function collectFirstMatch(value, matcher) {
  if (value === null || value === undefined) {
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const match = collectFirstMatch(item, matcher);
      if (match !== null && match !== undefined && match !== "") {
        return match;
      }
    }
    return null;
  }

  if (typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if (matcher(key, item)) {
        return item;
      }

      const nested = collectFirstMatch(item, matcher);
      if (nested !== null && nested !== undefined && nested !== "") {
        return nested;
      }
    }
  }

  return null;
}

function normalizePayloadContainer(payload) {
  if (!payload || typeof payload !== "object") {
    return payload;
  }

  if (Array.isArray(payload.data_list?.customer_open_dto)) {
    return payload.data_list.customer_open_dto[0];
  }

  if (payload.data_list?.customer_open_dto) {
    return payload.data_list.customer_open_dto;
  }

  if (Array.isArray(payload.data_list?.note_co)) {
    return payload.data_list.note_co[0];
  }

  if (payload.data_list?.note_co) {
    return payload.data_list.note_co;
  }

  return payload;
}

function extractCustomerId(payload) {
  return collectFirstMatch(normalizePayloadContainer(payload), (key, value) => {
    return (
      /customer_id/i.test(key) &&
      (typeof value === "string" || typeof value === "number")
    );
  });
}

function extractBuyerMemberSeq(payload) {
  return collectFirstMatch(normalizePayloadContainer(payload), (key, value) => {
    if (!(typeof value === "string" || typeof value === "number")) {
      return false;
    }

    return /buyer_member_seq|reference_id/i.test(key);
  });
}

function extractNoteId(payload) {
  return collectFirstMatch(normalizePayloadContainer(payload), (key, value) => {
    return /note_id/i.test(key) && (typeof value === "string" || typeof value === "number");
  });
}

function buildCustomerAttempts() {
  const endTime = formatTopDateTime(new Date());
  const startTime = formatTopDateTime(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

  return {
    "alibaba.seller.customer.batch.get": [
      {
        name: "missing_all",
        businessParams: {}
      },
      {
        name: "minimal_sync_window",
        businessParams: {
          customer_id_begin: "0",
          last_sync_end_time: endTime,
          page_size: 1,
          start_time: startTime,
          end_time: endTime
        }
      },
      {
        name: "minimal_page_without_window",
        businessParams: {
          customer_id_begin: "0",
          page_size: 1
        }
      }
    ],
    "alibaba.seller.customer.get": [
      {
        name: "missing_customer_id",
        businessParams: {}
      }
    ],
    "alibaba.seller.customer.note.query": [
      {
        name: "missing_all",
        businessParams: {}
      }
    ],
    "alibaba.seller.customer.note.get": [
      {
        name: "missing_customer_id_and_paging",
        businessParams: {}
      },
      {
        name: "paging_without_customer_id",
        businessParams: {
          page_num: 1,
          page_size: 10
        }
      }
    ]
  };
}

function summarizePayload(payload) {
  if (!payload || typeof payload !== "object") {
    return {
      keys: [],
      data_list_type: null
    };
  }

  return {
    keys: Object.keys(payload).sort(),
    data_list_type: payload.data_list
      ? Array.isArray(payload.data_list)
        ? "array"
        : typeof payload.data_list
      : null
  };
}

async function main() {
  const railwayToken = readRailwayToken();
  const vars = await queryRailwayVariables(railwayToken);

  const appKey = String(vars.ALIBABA_CLIENT_ID || "").trim();
  const appSecret = String(vars.ALIBABA_CLIENT_SECRET || "").trim();
  const refreshToken = String(vars.ALIBABA_WIKA_BOOTSTRAP_REFRESH_TOKEN || "").trim();
  const refreshUrl = getRefreshUrl(vars);
  const partnerId = String(vars.ALIBABA_PARTNER_ID || "").trim() || null;
  const accessToken = await refreshAccessToken({
    appKey,
    appSecret,
    refreshToken,
    refreshUrl,
    partnerId
  });

  const apiAttempts = buildCustomerAttempts();
  const apiOrder = [
    "alibaba.seller.customer.batch.get",
    "alibaba.seller.customer.get",
    "alibaba.seller.customer.note.query",
    "alibaba.seller.customer.note.get"
  ];

  let extractedCustomerId = null;
  let extractedBuyerMemberSeq = null;
  let extractedNoteId = null;
  const results = [];

  for (const apiName of apiOrder) {
    const attempts = apiAttempts[apiName].map((attempt) => ({
      ...attempt,
      businessParams: { ...(attempt.businessParams ?? {}) }
    }));

    if (apiName === "alibaba.seller.customer.get" && extractedBuyerMemberSeq) {
      attempts.unshift({
        name: "buyer_member_seq_from_batch_json",
        businessParams: {
          buyer_member_seq: String(extractedBuyerMemberSeq)
        }
      });
    }

    if (apiName === "alibaba.seller.customer.note.query" && extractedCustomerId) {
      attempts.unshift({
        name: "customer_id_from_batch_json",
        businessParams: {
          customer_id: String(extractedCustomerId),
          page_num: 1,
          page_size: 10
        }
      });
    }

    if (apiName === "alibaba.seller.customer.note.get" && extractedCustomerId) {
      attempts.unshift({
        name: "customer_id_from_batch_json",
        businessParams: {
          customer_id: String(extractedCustomerId),
          page_num: 1,
          page_size: 10
        }
      });
    }

    const attemptResults = [];
    for (const attempt of attempts.slice(0, 3)) {
      const response = await callSyncApi({
        apiName,
        appKey,
        appSecret,
        accessToken,
        businessParams: attempt.businessParams
      });

      const classified = classifyResponse(apiName, attempt, response);
      attemptResults.push(classified);

      if (classified.classification === "真实 JSON 样本数据") {
        const payload = classified.detail?.payload_excerpt ?? null;
        if (!extractedCustomerId) {
          extractedCustomerId = extractCustomerId(payload);
        }
        if (!extractedBuyerMemberSeq) {
          extractedBuyerMemberSeq = extractBuyerMemberSeq(payload);
        }
        if (!extractedNoteId) {
          extractedNoteId = extractNoteId(payload);
        }
        break;
      }

      if (
        classified.classification === "权限错误" ||
        classified.classification === "应用能力不匹配" ||
        classified.classification === "旧体系 / 高风险"
      ) {
        break;
      }
    }

    const finalResult = pickBestResult(attemptResults);
    const payload = finalResult.detail?.payload_excerpt ?? null;
    if (!extractedCustomerId) {
      extractedCustomerId = extractCustomerId(payload);
    }
    if (!extractedBuyerMemberSeq) {
      extractedBuyerMemberSeq = extractBuyerMemberSeq(payload);
    }
    if (!extractedNoteId) {
      extractedNoteId = extractNoteId(payload);
    }

    results.push({
      api_name: apiName,
      actual_transport: "/sync + access_token + sha256",
      extracted_context: {
        customer_id: extractedCustomerId ? String(extractedCustomerId) : null,
        buyer_member_seq: extractedBuyerMemberSeq
          ? String(extractedBuyerMemberSeq)
          : null,
        note_id: extractedNoteId ? String(extractedNoteId) : null
      },
      attempts: attemptResults,
      final: {
        ...finalResult,
        payload_summary: summarizePayload(finalResult.detail?.payload_excerpt)
      }
    });
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        account: "wika",
        customers_family: results
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
