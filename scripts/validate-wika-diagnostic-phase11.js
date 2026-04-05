import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";

import {
  fetchWikaOrderMinimalDiagnostic,
  fetchWikaProductMinimalDiagnostic
} from "../shared/data/modules/wika-minimal-diagnostic.js";

const RAILWAY_TOKEN_PATH = path.join(os.tmpdir(), "railway-cli-token.txt");
const PROJECT_ID = "7cc408fd-c2a3-403c-9b4e-adaa72a9a712";
const ENVIRONMENT_ID = "4afccea8-ada6-42d5-9bd7-0f73cca404dc";
const SERVICE_ID = "d7abfb5c-25c6-478c-a51a-69d85151127a";
const GRAPHQL_URL = "https://backboard.railway.com/graphql/v2";
const PRODUCT_SAMPLE_OUTPUT_PATH = path.join(
  process.cwd(),
  "docs",
  "framework",
  "WIKA_产品子诊断样例.json"
);
const ORDER_SAMPLE_OUTPUT_PATH = path.join(
  process.cwd(),
  "docs",
  "framework",
  "WIKA_订单子诊断样例.json"
);

function readRailwayToken() {
  return fs.readFileSync(RAILWAY_TOKEN_PATH, "utf8").trim();
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
  if (payload?.errors?.length) {
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

  const clientConfig = {
    account: "wika",
    appKey,
    appSecret,
    accessToken,
    endpointUrl: "https://open-api.alibaba.com/sync"
  };

  const productResult = await fetchWikaProductMinimalDiagnostic(clientConfig, {
    product_page_size: 12,
    product_score_limit: 8,
    product_detail_limit: 8
  });
  const orderResult = await fetchWikaOrderMinimalDiagnostic(clientConfig, {
    order_page_size: 8,
    order_sample_limit: 5
  });

  fs.writeFileSync(
    PRODUCT_SAMPLE_OUTPUT_PATH,
    `${JSON.stringify(productResult, null, 2)}\n`,
    "utf8"
  );
  fs.writeFileSync(
    ORDER_SAMPLE_OUTPUT_PATH,
    `${JSON.stringify(orderResult, null, 2)}\n`,
    "utf8"
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        product_sample_output_path: PRODUCT_SAMPLE_OUTPUT_PATH,
        order_sample_output_path: ORDER_SAMPLE_OUTPUT_PATH,
        product_sample_size: productResult.sample_size,
        order_sample_size: orderResult.sample_size,
        generated_at: productResult.generated_at
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
