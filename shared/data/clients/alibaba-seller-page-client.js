import fs from "node:fs";

export const DEFAULT_ALIBABA_SELLER_APP_LOG_PATH =
  "D:\\AlibabaSupplierData\\app.log";

export const DEFAULT_ALIBABA_SELLER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36 AlibabaSupplier/11.40.90E alisupplierpc";

const DEFAULT_COOKIE_NAMES = [
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

export class AlibabaSellerPageClientError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "AlibabaSellerPageClientError";
    this.details = details;
  }
}

function escapeForRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractLatestCookieValue(logText, cookieName) {
  const pattern = new RegExp(
    `${escapeForRegExp(cookieName)}=([^\\s;"\\\\]+)`,
    "g"
  );
  const matches = [...logText.matchAll(pattern)];
  if (matches.length === 0) {
    return null;
  }

  return matches.at(-1)?.[1] ?? null;
}

export function loadAlibabaSellerCookiesFromAppLog({
  logPath = DEFAULT_ALIBABA_SELLER_APP_LOG_PATH,
  cookieNames = DEFAULT_COOKIE_NAMES
} = {}) {
  if (!fs.existsSync(logPath)) {
    throw new AlibabaSellerPageClientError(
      "AliWorkbench app log file was not found",
      {
        logPath
      }
    );
  }

  const logText = fs.readFileSync(logPath).toString("utf8");
  const cookies = {};

  for (const cookieName of cookieNames) {
    const cookieValue = extractLatestCookieValue(logText, cookieName);
    if (cookieValue) {
      cookies[cookieName] = cookieValue;
    }
  }

  if (Object.keys(cookies).length === 0) {
    throw new AlibabaSellerPageClientError(
      "No reusable seller cookies were found in the app log",
      {
        logPath
      }
    );
  }

  return {
    cookies,
    cookieCount: Object.keys(cookies).length,
    logPath
  };
}

function buildCookieHeader(cookies) {
  return Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

async function parseJsonResponse(response) {
  const rawText = await response.text();

  try {
    return {
      rawText,
      json: JSON.parse(rawText)
    };
  } catch {
    return {
      rawText,
      json: null
    };
  }
}

export async function fetchAlibabaSellerPageJson(
  url,
  {
    logPath = DEFAULT_ALIBABA_SELLER_APP_LOG_PATH,
    referer = "https://data.alibaba.com/",
    userAgent = DEFAULT_ALIBABA_SELLER_USER_AGENT,
    method = "GET",
    headers = {},
    body
  } = {}
) {
  const cookieContext = loadAlibabaSellerCookiesFromAppLog({
    logPath
  });

  const response = await fetch(url, {
    method,
    headers: {
      Accept: "application/json, text/plain, */*",
      Referer: referer,
      "User-Agent": userAgent,
      Cookie: buildCookieHeader(cookieContext.cookies),
      ...headers
    },
    body
  });

  const parsed = await parseJsonResponse(response);

  if (!response.ok) {
    throw new AlibabaSellerPageClientError("Seller page JSON request failed", {
      url,
      status: response.status,
      contentType: response.headers.get("content-type"),
      responsePreview: parsed.rawText.slice(0, 500)
    });
  }

  if (!parsed.json || typeof parsed.json !== "object") {
    throw new AlibabaSellerPageClientError(
      "Seller page request returned non-JSON data",
      {
        url,
        status: response.status,
        contentType: response.headers.get("content-type"),
        responsePreview: parsed.rawText.slice(0, 500)
      }
    );
  }

  return {
    url,
    status: response.status,
    contentType: response.headers.get("content-type"),
    cookieSource: {
      logPath: cookieContext.logPath,
      cookieCount: cookieContext.cookieCount
    },
    json: parsed.json
  };
}
