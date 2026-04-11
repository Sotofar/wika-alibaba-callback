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

function detectCategory(raw = "") {
  const lower = raw.toLowerCase();

  if (lower.includes("insufficientpermission") || lower.includes("permission")) {
    return "权限错误";
  }

  if (
    lower.includes("missingparameter") ||
    lower.includes("invalid-parameter") ||
    lower.includes("some parameters set null or error") ||
    lower.includes("illegal parameter") ||
    lower.includes("query params is null") ||
    lower.includes("unsupported operation")
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
  if (payload && (payload.errorcode || payload.errormsg || payload.msg_code || payload.message)) {
    const raw = [
      payload?.errorcode ?? "",
      payload?.errormsg ?? "",
      payload?.msg_code ?? "",
      payload?.message ?? ""
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

  const photobankGroupOperateAttempts = [
    {
      name: "missing_request_object",
      businessParams: {}
    },
    {
      name: "invalid_operation_only",
      businessParams: {
        photo_group_operation_request: {
          operation: "noop"
        }
      }
    },
    {
      name: "delete_without_group_id",
      businessParams: {
        photo_group_operation_request: {
          operation: "delete"
        }
      }
    }
  ];

  const attemptResults = [];
  for (const attempt of photobankGroupOperateAttempts) {
    const response = await callSyncApi({
      apiName: "alibaba.icbu.photobank.group.operate",
      appKey,
      appSecret,
      accessToken,
      businessParams: attempt.businessParams
    });

    const classified = classifyResponse(
      "alibaba.icbu.photobank.group.operate",
      attempt,
      response
    );
    attemptResults.push(classified);

    if (
      classified.classification === "真实 JSON 样本数据" ||
      classified.classification === "业务参数错误（说明已过授权层）"
    ) {
      break;
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        media_candidates: [
          {
            api_name: "alibaba.icbu.photobank.group.operate",
            actual_transport: "/sync + access_token + sha256",
            attempts: attemptResults,
            final: pickBestResult(attemptResults),
            explicit_doc_family: [
              "alibaba.icbu.photobank.list",
              "alibaba.icbu.photobank.upload",
              "alibaba.icbu.photobank.group.list",
              "alibaba.icbu.photobank.group.operate"
            ],
            stage6_boundary_conclusion:
              "当前仍无法证明可隔离 / 可清理 / 可回滚边界，因此不继续实写验证"
          }
        ],
        draft_family_evidence: {
          reused_verified_baseline: "alibaba.icbu.product.schema.render.draft",
          explicit_methods_seen_in_official_docs: [
            "alibaba.icbu.product.add.draft",
            "alibaba.icbu.product.schema.render.draft",
            "alibaba.icbu.product.schema.add.draft"
          ],
          explicit_query_delete_manage_methods_additional_to_render_draft: [],
          final: {
            classification: "当前未识别到可用入口",
            reason:
              "当前公开官方文档中，除已验证的 schema.render.draft 外，没有再识别到明确的 draft 查询 / 删除 / 管理接口。"
          }
        }
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
