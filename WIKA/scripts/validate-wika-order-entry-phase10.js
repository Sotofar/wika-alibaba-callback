import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

import {
  fetchAlibabaOfficialOrderDraftTypes,
  probeAlibabaOfficialOrderCreate
} from "../../shared/data/modules/alibaba-official-order-entry.js";
import { buildWikaExternalOrderDraft } from "../../shared/data/modules/alibaba-order-drafts.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");
const RAILWAY_TOKEN_PATH = path.join(os.tmpdir(), "railway-cli-token.txt");
const PROJECT_ID = "7cc408fd-c2a3-403c-9b4e-adaa72a9a712";
const ENVIRONMENT_ID = "4afccea8-ada6-42d5-9bd7-0f73cca404dc";
const SERVICE_ID = "d7abfb5c-25c6-478c-a51a-69d85151127a";
const GRAPHQL_URL = "https://backboard.railway.com/graphql/v2";
const OUTPUT_PATH = path.join(
  PROJECT_ROOT,
  "docs",
  "framework",
  "WIKA_订单草稿样例.json"
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

function classifyError(error) {
  const topError = error?.details?.errorResponse ?? error?.errorResponse ?? null;
  const topCode = String(topError?.code ?? "").toLowerCase();
  const subCode = String(topError?.sub_code ?? "").toLowerCase();
  const msg = String(topError?.msg ?? "").toLowerCase();
  const errorMessage = String(error?.message ?? "").toLowerCase();

  if (
    subCode.includes("permission") ||
    msg.includes("insufficientpermission") ||
    msg.includes("permission")
  ) {
    return "权限错误";
  }

  if (
    topCode.includes("missingparameter") ||
    subCode.includes("missing") ||
    msg.includes("missingparameter") ||
    msg.includes("isv.invalid-parameter") ||
    errorMessage.includes("missing")
  ) {
    return "业务参数错误（说明已过授权层）";
  }

  if (
    subCode.includes("appkey") ||
    msg.includes("invalid app key") ||
    msg.includes("gateway")
  ) {
    return "应用能力不匹配";
  }

  if (topError) {
    return "旧体系 / 高风险";
  }

  return "当前未识别到可用入口";
}

async function evaluateCandidate(label, runner) {
  try {
    const result = await runner();
    return {
      api_name: label,
      classification: "真实 JSON 样本数据",
      ok: true,
      summary: result
    };
  } catch (error) {
    return {
      api_name: label,
      classification: classifyError(error),
      ok: false,
      top_error: error?.details?.errorResponse ?? error?.errorResponse ?? null,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

async function fetchProductionJson(pathname) {
  const response = await fetch(`https://api.wikapacking.com${pathname}`);
  return response.json();
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

  const client = {
    account: "wika",
    appKey,
    appSecret,
    accessToken,
    endpointUrl: "https://open-api.alibaba.com/sync"
  };

  const [draftTypesResult, productsList] = await Promise.all([
    evaluateCandidate("alibaba.seller.trade.query.drafttype", async () =>
      fetchAlibabaOfficialOrderDraftTypes(client)
    ),
    fetchProductionJson("/integrations/alibaba/wika/data/products/list?page_size=2")
  ]);

  const orderCreateAttempts = [];
  for (const paramOrderCreate of [{}, { product_list: [] }]) {
    // 仅用明显不完整 payload 做边界验证，避免触发真实创单。
    const attempt = await evaluateCandidate("alibaba.trade.order.create", async () =>
      probeAlibabaOfficialOrderCreate(client, {
        param_order_create: paramOrderCreate
      })
    );

    orderCreateAttempts.push({
      request_keys: Object.keys(paramOrderCreate).sort(),
      classification: attempt.classification,
      top_error: attempt.top_error ?? null
    });
  }

  const firstItem = Array.isArray(productsList?.items) ? productsList.items[0] : null;
  const draft = buildWikaExternalOrderDraft({
    buyer_member_seq: null,
    company_name: "TBD_BY_HUMAN_CONFIRMATION",
    contact_name: "TBD_BY_HUMAN_CONFIRMATION",
    email: "buyer@example.com",
    country_code: "US",
    country_name: "United States",
    line_items: [
      {
        product_id: firstItem?.id ?? null,
        product_name: firstItem?.subject ?? "TBD_PRODUCT_NAME",
        sku_id: null,
        sku_description: "TBD SKU / spec by human",
        quantity: "1000",
        unit: "Pieces",
        unit_price: null,
        currency: "USD",
        image_url: firstItem?.product_image ?? null
      }
    ],
    payment_terms: {
      currency: "USD",
      total_amount: null,
      advance_amount: null,
      payment_terms_text: "30% deposit, balance before shipment (TBD by human)"
    },
    shipment_plan: {
      trade_term: "FOB",
      shipment_method: "sea",
      lead_time_text: "TBD by human confirmation",
      destination_country: "United States",
      destination_port: "TBD",
      logistics_notes: "Requires final logistics and address confirmation"
    },
    notes: [
      "Generated for order-entry boundary validation only",
      "Do not use for real platform submit"
    ]
  });

  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(draft, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        draft_types: {
          classification: draftTypesResult.classification,
          returned_types: draftTypesResult.summary?.types ?? null
        },
        order_create_attempts: orderCreateAttempts,
        output_path: OUTPUT_PATH
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
