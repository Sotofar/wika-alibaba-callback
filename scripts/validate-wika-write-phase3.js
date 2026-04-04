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
const PRODUCTION_BASE_URL = "https://api.wikapacking.com";

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

async function fetchProductionJson(pathname) {
  const response = await fetch(`${PRODUCTION_BASE_URL}${pathname}`);
  const text = await response.text();
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("json")) {
    throw new Error(`Expected JSON from ${pathname}, got ${contentType}`);
  }

  return JSON.parse(text);
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
    lower.includes("illegal parameter")
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

  const body = response.body;
  const rootKeys = Object.keys(body || {});
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

  return {
    api_name: apiName,
    attempt_name: attempt.name,
    classification: "真实 JSON 样本数据",
    detail: {
      type: "json",
      status: response.status,
      root_keys: rootKeys
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
  const refreshToken = String(
    vars.ALIBABA_WIKA_BOOTSTRAP_REFRESH_TOKEN || ""
  ).trim();
  const refreshUrl = getRefreshUrl(vars);
  const partnerId = String(vars.ALIBABA_PARTNER_ID || "").trim() || null;
  const accessToken = await refreshAccessToken({
    appKey,
    appSecret,
    refreshToken,
    refreshUrl,
    partnerId
  });

  const productList = await fetchProductionJson(
    "/integrations/alibaba/wika/data/products/list?page_size=3"
  );
  const firstProduct = productList.items?.[0];
  const productDetail = await fetchProductionJson(
    `/integrations/alibaba/wika/data/products/detail?product_id=${firstProduct?.id ?? ""}`
  );

  const productId = Number(firstProduct?.id);
  const categoryId = Number(productDetail.product?.category_id);
  const language = "en_US";

  const candidates = [
    {
      apiName: "alibaba.icbu.product.schema.get",
      attempts: [
        {
          name: "cat_and_language",
          businessParams: {
            param_product_top_publish_request: {
              cat_id: categoryId,
              language
            }
          }
        },
        {
          name: "cat_only",
          businessParams: {
            param_product_top_publish_request: {
              cat_id: categoryId
            }
          }
        },
        {
          name: "empty_request",
          businessParams: {}
        }
      ]
    },
    {
      apiName: "alibaba.icbu.product.schema.render",
      attempts: [
        {
          name: "cat_lang_product",
          businessParams: {
            param_product_top_publish_request: {
              cat_id: categoryId,
              language,
              product_id: productId
            }
          }
        },
        {
          name: "product_only",
          businessParams: {
            param_product_top_publish_request: {
              product_id: productId
            }
          }
        },
        {
          name: "empty_request",
          businessParams: {}
        }
      ]
    },
    {
      apiName: "alibaba.icbu.product.add.draft",
      attempts: [
        {
          name: "empty_payload",
          businessParams: {}
        },
        {
          name: "minimal_required_shape",
          businessParams: {
            category_id: categoryId,
            language: "ENGLISH"
          }
        },
        {
          name: "category_language_subject",
          businessParams: {
            category_id: categoryId,
            language: "ENGLISH",
            subject: `Codex Draft Validation ${Date.now()}`
          }
        }
      ]
    }
  ];

  const results = [];

  for (const candidate of candidates) {
    const attemptResults = [];

    for (const attempt of candidate.attempts) {
      const response = await callSyncApi({
        apiName: candidate.apiName,
        appKey,
        appSecret,
        accessToken,
        businessParams: attempt.businessParams
      });

      const classified = classifyResponse(candidate.apiName, attempt, response);
      attemptResults.push({
        ...classified,
        request_params: attempt.businessParams
      });

      if (
        classified.classification === "真实 JSON 样本数据" ||
        classified.classification === "业务参数错误（说明已过授权层）"
      ) {
        break;
      }
    }

    results.push({
      api_name: candidate.apiName,
      sample_context: {
        product_id: Number.isFinite(productId) ? productId : null,
        category_id: Number.isFinite(categoryId) ? categoryId : null,
        language
      },
      attempts: attemptResults,
      final: pickBestResult(attemptResults)
    });
  }

  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
