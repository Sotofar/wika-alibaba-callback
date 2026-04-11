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

function classifyResponse(response) {
  if (!response.isJson) {
    return {
      category: "旧体系 / 高风险",
      detail: "非 JSON 返回"
    };
  }

  if (response.body?.error_response) {
    const topError = response.body.error_response;
    const code = String(topError?.sub_code ?? topError?.code ?? "").toLowerCase();
    const msg = String(topError?.msg ?? topError?.message ?? "").toLowerCase();
    const raw = `${code} ${msg}`;

    if (raw.includes("missing") || raw.includes("invalid-parameter") || raw.includes("parameter")) {
      return {
        category: "业务参数错误",
        detail: {
          code: topError?.code ?? null,
          sub_code: topError?.sub_code ?? null,
          msg: topError?.msg ?? null,
          sub_msg: topError?.sub_msg ?? null
        }
      };
    }

    if (raw.includes("permission") || raw.includes("unauthorized") || raw.includes("insufficient")) {
      return {
        category: "权限错误",
        detail: {
          code: topError?.code ?? null,
          sub_code: topError?.sub_code ?? null,
          msg: topError?.msg ?? null,
          sub_msg: topError?.sub_msg ?? null
        }
      };
    }

    if (raw.includes("appkey") || raw.includes("app key") || raw.includes("isv.appkey")) {
      return {
        category: "应用能力不匹配",
        detail: {
          code: topError?.code ?? null,
          sub_code: topError?.sub_code ?? null,
          msg: topError?.msg ?? null,
          sub_msg: topError?.sub_msg ?? null
        }
      };
    }

    if (raw.includes("session") || raw.includes("router/rest") || raw.includes("聚石塔") || raw.includes("jst")) {
      return {
        category: "旧体系 / 高风险",
        detail: {
          code: topError?.code ?? null,
          sub_code: topError?.sub_code ?? null,
          msg: topError?.msg ?? null,
          sub_msg: topError?.sub_msg ?? null
        }
      };
    }

    return {
      category: "旧体系 / 高风险",
      detail: {
        code: topError?.code ?? null,
        sub_code: topError?.sub_code ?? null,
        msg: topError?.msg ?? null,
        sub_msg: topError?.sub_msg ?? null
      }
    };
  }

  const rootKey =
    response.body && typeof response.body === "object"
      ? Object.keys(response.body).find((key) => key.endsWith("_response"))
      : null;

  if (!rootKey) {
    return {
      category: "旧体系 / 高风险",
      detail: "JSON 返回中未识别到官方 response root key"
    };
  }

  const payload = response.body[rootKey];
  const sampleValue =
    payload && typeof payload === "object"
      ? Object.values(payload).find(
          (value) =>
            value &&
            (typeof value === "object" || Array.isArray(value))
        ) ?? payload
      : payload;

  return {
    category: "真实 JSON 样本数据",
    detail: {
      raw_root_key: rootKey,
      body_root_keys:
        payload && typeof payload === "object" ? Object.keys(payload).sort() : [],
      sample_field_keys:
        sampleValue && typeof sampleValue === "object"
          ? Object.keys(sampleValue).slice(0, 20).sort()
          : []
    }
  };
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

async function main() {
  const railwayToken = readRailwayToken();
  const vars = await queryRailwayVariables(railwayToken);
  const products = await fetchProductionJson(
    "/integrations/alibaba/wika/data/products/list?page_size=5"
  );

  const sampleProductId =
    products.items?.find((item) => item?.product_id)?.product_id ?? null;
  const sampleNumericProductId =
    products.items?.find((item) => item?.id)?.id ?? null;

  const appKey = String(vars.ALIBABA_CLIENT_ID || "").trim();
  const appSecret = String(vars.ALIBABA_CLIENT_SECRET || "").trim();
  const refreshToken = String(
    vars.ALIBABA_WIKA_BOOTSTRAP_REFRESH_TOKEN || ""
  ).trim();
  const refreshUrl = getRefreshUrl(vars);
  const partnerId = String(vars.ALIBABA_PARTNER_ID || "").trim();

  const accessToken = await refreshAccessToken({
    appKey,
    appSecret,
    refreshToken,
    refreshUrl,
    partnerId
  });

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const firstBatch = [
    {
      apiName: "alibaba.mydata.overview.indicator.basic.get",
      businessParams: {
        date_range: {
          start_date: formatDate(sevenDaysAgo),
          end_date: formatDate(yesterday)
        },
        industry: {
          industry_id: 111,
          industry_desc: "All",
          main_category: true
        }
      }
    },
    {
      apiName: "alibaba.mydata.self.product.get",
      businessParams: {
        statistics_type: "day",
        stat_date: formatDate(yesterday),
        product_ids: String(sampleNumericProductId ?? sampleProductId ?? "")
      }
    }
  ];

  const secondBatch = [
    {
      apiName: "alibaba.mydata.self.product.date.get",
      businessParams: {
        statistics_type: "day"
      }
    },
    {
      apiName: "alibaba.mydata.overview.date.get",
      businessParams: {}
    },
    {
      apiName: "alibaba.mydata.overview.industry.get",
      businessParams: {
        date_range: {
          start_date: formatDate(sevenDaysAgo),
          end_date: formatDate(yesterday)
        }
      }
    }
  ];

  const results = {};

  for (const definition of firstBatch) {
    const response = await callSyncApi({
      apiName: definition.apiName,
      appKey,
      appSecret,
      accessToken,
      businessParams: definition.businessParams
    });
    results[definition.apiName] = {
      used_sync_access_token_sha256: true,
      request_params: definition.businessParams,
      ...classifyResponse(response)
    };
  }

  const firstBatchPassed = Object.values(results).some(
    (item) =>
      item.category === "真实 JSON 样本数据" ||
      item.category === "业务参数错误"
  );

  if (!firstBatchPassed) {
    for (const definition of secondBatch) {
      const response = await callSyncApi({
        apiName: definition.apiName,
        appKey,
        appSecret,
        accessToken,
        businessParams: definition.businessParams
      });
      results[definition.apiName] = {
        used_sync_access_token_sha256: true,
        request_params: definition.businessParams,
        ...classifyResponse(response)
      };
    }
  }

  console.log(
    JSON.stringify(
      {
        evaluated_at: new Date().toISOString(),
        sample_product_id: sampleProductId,
        sample_numeric_product_id: sampleNumericProductId,
        validated_first_batch: firstBatch.map((item) => item.apiName),
        validated_second_batch: firstBatchPassed
          ? []
          : secondBatch.map((item) => item.apiName),
        results
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
        fatal: error instanceof Error ? error.message : String(error)
      },
      null,
      2
    )
  );
  process.exit(1);
});
