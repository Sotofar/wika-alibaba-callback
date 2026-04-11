import fs from "node:fs";
import { exchangeAuthorizationCode } from "../src/alibaba/oauth.js";
import { signAlibabaRequest } from "../src/alibaba/sign.js";

const DEFAULT_ALIBABA_SELLER_APP_LOG_PATH = "D:\\AlibabaSupplierData\\app.log";

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function buildCookieHeader(cookies) {
  return Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

function loadCleanSellerCookiesFromAppLog(
  logPath = DEFAULT_ALIBABA_SELLER_APP_LOG_PATH
) {
  const cookieNames = [
    "ali_apache_tracktmp",
    "ali_apache_track",
    "xman_t",
    "xman_us_f",
    "intl_common_forever",
    "xman_us_t",
    "xman_f",
    "acs_usuc_t",
    "intl_locale",
    "xman_i",
    "cookie2",
    "sgcookie",
    "_tb_token_"
  ];

  const logText = fs.readFileSync(logPath, "utf8");
  const cookies = {};

  for (const name of cookieNames) {
    const matcher = new RegExp(`${name}=([^\\s;"\\\\]+)`, "g");
    const matches = [...logText.matchAll(matcher)];
    if (matches.length > 0) {
      cookies[name] = matches.at(-1)?.[1] ?? "";
    }
  }

  return cookies;
}

function extractHiddenInputValue(html, name) {
  const matcher = new RegExp(
    `name=['"]${name}['"][^>]*value=['"]([^'"]*)['"]`,
    "i"
  );
  return html.match(matcher)?.[1] ?? "";
}

function extractCodeFromLocation(location) {
  const url = new URL(location);
  return {
    code: url.searchParams.get("code") || "",
    state: url.searchParams.get("state") || ""
  };
}

async function parseResponse(response) {
  const rawText = await response.text();
  try {
    return {
      status: response.status,
      ok: response.ok,
      body: JSON.parse(rawText)
    };
  } catch {
    return {
      status: response.status,
      ok: response.ok,
      body: rawText
    };
  }
}

async function captureAuthorizationCode({
  appBaseUrl,
  userAgent,
  cookieHeader
}) {
  const startResponse = await fetch(
    `${appBaseUrl}/integrations/alibaba/auth/start`,
    {
      redirect: "manual"
    }
  );

  const authorizeUrl = startResponse.headers.get("location");
  if (!authorizeUrl) {
    throw new Error("Missing authorize redirect from /auth/start");
  }

  const authorizePageResponse = await fetch(authorizeUrl, {
    redirect: "manual",
    headers: {
      "User-Agent": userAgent,
      Cookie: cookieHeader,
      Referer: `${appBaseUrl}/`
    }
  });

  const authorizeHtml = await authorizePageResponse.text();
  const formBody = new URLSearchParams({
    action: extractHiddenInputValue(authorizeHtml, "action") || "/authorize_action",
    event_submit_do_auth:
      extractHiddenInputValue(authorizeHtml, "event_submit_do_auth") ||
      "event_submit_do_auth",
    agreement: extractHiddenInputValue(authorizeHtml, "agreement") || "on",
    response_type:
      extractHiddenInputValue(authorizeHtml, "response_type") || "code",
    redirect_uri: extractHiddenInputValue(authorizeHtml, "redirect_uri"),
    state: extractHiddenInputValue(authorizeHtml, "state"),
    redirect_auth:
      extractHiddenInputValue(authorizeHtml, "redirect_auth") || "true",
    force_auth: extractHiddenInputValue(authorizeHtml, "force_auth") || "true",
    client_id: extractHiddenInputValue(authorizeHtml, "client_id")
  });

  const authorizeSubmitResponse = await fetch(
    "https://open-api.alibaba.com/oauth/authorize",
    {
      method: "POST",
      redirect: "manual",
      headers: {
        "User-Agent": userAgent,
        Cookie: cookieHeader,
        Referer: authorizeUrl,
        Origin: "https://open-api.alibaba.com",
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: formBody
    }
  );

  const callbackLocation = authorizeSubmitResponse.headers.get("location");
  if (!callbackLocation) {
    const preview = (await authorizeSubmitResponse.text()).slice(0, 500);
    throw new Error(
      `Authorize submit did not return callback redirect. status=${authorizeSubmitResponse.status}, preview=${preview}`
    );
  }

  const { code, state } = extractCodeFromLocation(callbackLocation);
  if (!code) {
    throw new Error("Callback redirect did not include code");
  }

  return {
    authorize_url: authorizeUrl,
    callback_location: callbackLocation,
    code,
    state
  };
}

async function probeSyncProductList({
  appKey,
  appSecret,
  accessToken,
  endpointUrl = "https://open-api.alibaba.com/sync"
}) {
  const params = {
    method: "alibaba.icbu.product.list",
    app_key: appKey,
    access_token: accessToken,
    sign_method: "sha256",
    timestamp: String(Date.now()),
    current_page: "1",
    page_size: "5",
    language: "ENGLISH"
  };

  params.sign = signAlibabaRequest({
    apiName: "",
    params,
    appSecret
  });

  const response = await fetch(endpointUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
      Accept: "application/json"
    },
    body: JSON.stringify(params)
  });

  return {
    request_shape: {
      endpoint: endpointUrl,
      method_param: params.method,
      sign_method: params.sign_method,
      public_params: [
        "method",
        "app_key",
        "access_token",
        "sign_method",
        "timestamp",
        "sign"
      ],
      business_params: ["current_page", "page_size", "language"]
    },
    response: await parseResponse(response)
  };
}

function summarizeProbeResult(result) {
  const body = result.response.body;
  const errorResponse = body?.error_response ?? body?.errorResponse ?? null;
  const productResponse = body?.alibaba_icbu_product_list_response ?? null;
  const productItems = Array.isArray(
    productResponse?.products?.alibaba_product_brief_response
  )
    ? productResponse.products.alibaba_product_brief_response
    : [];

  return {
    request_shape: result.request_shape,
    response_status: result.response.status,
    success: Boolean(productResponse),
    error_response: errorResponse
      ? {
          code: errorResponse.code ?? null,
          sub_code: errorResponse.sub_code ?? null,
          msg: errorResponse.msg ?? null,
          sub_msg: errorResponse.sub_msg ?? null
        }
      : null,
    product_summary: productResponse
      ? {
          current_page: productResponse.current_page ?? null,
          page_size: productResponse.page_size ?? null,
          total_item: productResponse.total_item ?? null,
          returned_count: productItems.length,
          first_product_keys:
            productItems.length > 0 && typeof productItems[0] === "object"
              ? Object.keys(productItems[0]).sort()
              : [],
          first_product_identity:
            productItems.length > 0
              ? {
                  product_id:
                    productItems[0].product_id ?? productItems[0].id ?? null,
                  subject_present: Boolean(productItems[0].subject)
                }
              : null
        }
      : null
  };
}

async function main() {
  const appKey = requireEnv("ALIBABA_CLIENT_ID");
  const appSecret = requireEnv("ALIBABA_CLIENT_SECRET");
  const appBaseUrl = requireEnv("APP_BASE_URL");
  const tokenApiBaseUrl = process.env.ALIBABA_API_BASE_URL?.trim()
    ? process.env.ALIBABA_API_BASE_URL.trim()
    : "https://open-api.alibaba.com/rest";
  const userAgent =
    process.env.ALIBABA_SELLER_USER_AGENT?.trim() ||
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36 AlibabaSupplier/11.40.90E alisupplierpc";

  const cookieHeader = buildCookieHeader(loadCleanSellerCookiesFromAppLog());

  const authorization = await captureAuthorizationCode({
    appBaseUrl,
    userAgent,
    cookieHeader
  });

  const tokenResponse = await exchangeAuthorizationCode(authorization.code, {
    appKey,
    appSecret,
    apiBaseUrl: tokenApiBaseUrl
  });

  const accessToken = tokenResponse.access_token;
  if (!accessToken) {
    throw new Error("Token exchange did not return access_token");
  }

  const probe = await probeSyncProductList({
    appKey,
    appSecret,
    accessToken
  });

  console.log(
    JSON.stringify({
      authorization: {
        authorize_url: authorization.authorize_url,
        captured_code: true,
        captured_state: Boolean(authorization.state)
      },
      token_exchange: {
        success: true,
        access_token_present: true
      },
      probe: summarizeProbeResult(probe)
    })
  );
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    })
  );
  process.exit(1);
});
