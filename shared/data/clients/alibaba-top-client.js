import crypto from "node:crypto";

export const DEFAULT_ALIBABA_TOP_API_URL = "https://eco.taobao.com/router/rest";
const DEFAULT_SIGN_METHOD = "hmac";
const DEFAULT_FORMAT = "json";
const DEFAULT_VERSION = "2.0";
const DEFAULT_TIMEZONE = "Asia/Shanghai";

export class AlibabaTopApiError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "AlibabaTopApiError";
    this.details = details;
  }
}

function compareAscii(left, right) {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");
  const length = Math.min(leftBuffer.length, rightBuffer.length);

  for (let index = 0; index < length; index += 1) {
    if (leftBuffer[index] !== rightBuffer[index]) {
      return leftBuffer[index] - rightBuffer[index];
    }
  }

  return leftBuffer.length - rightBuffer.length;
}

function formatTopTimestamp(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: DEFAULT_TIMEZONE,
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

function serializeTopValue(value) {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

export function signAlibabaTopRequest({
  params,
  secret,
  signMethod = DEFAULT_SIGN_METHOD,
  body = ""
}) {
  const keys = Object.keys(params)
    .filter((key) => {
      const value = params[key];
      return value !== undefined && value !== null && value !== "";
    })
    .sort(compareAscii);

  let payload = "";
  if (signMethod === "md5") {
    payload += secret;
  }

  for (const key of keys) {
    payload += `${key}${params[key]}`;
  }

  if (body) {
    payload += body;
  }

  if (signMethod === "hmac") {
    return crypto
      .createHmac("md5", secret)
      .update(payload, "utf8")
      .digest("hex")
      .toUpperCase();
  }

  if (signMethod === "md5") {
    return crypto
      .createHash("md5")
      .update(`${payload}${secret}`, "utf8")
      .digest("hex")
      .toUpperCase();
  }

  throw new AlibabaTopApiError("Unsupported TOP sign method", {
    signMethod
  });
}

function buildTopRequestParams({
  apiName,
  appKey,
  session,
  partnerId,
  businessParams,
  signMethod,
  format,
  version,
  simplify
}) {
  const requestParams = {
    method: apiName,
    app_key: appKey,
    sign_method: signMethod,
    timestamp: formatTopTimestamp(),
    format,
    v: version,
    session
  };

  if (partnerId) {
    requestParams.partner_id = partnerId;
  }

  if (simplify) {
    requestParams.simplify = "true";
  }

  for (const [key, value] of Object.entries(businessParams)) {
    const serializedValue = serializeTopValue(value);
    if (serializedValue !== "") {
      requestParams[key] = serializedValue;
    }
  }

  return requestParams;
}

function buildFormBody(params) {
  const body = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    body.append(key, String(value));
  }

  return body;
}

function getResponseRootKey(apiName) {
  return `${apiName.replace(/\./g, "_")}_response`;
}

async function parseResponse(response) {
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

export async function callAlibabaTopApi({
  apiName,
  appKey,
  appSecret,
  session,
  partnerId,
  businessParams = {},
  endpointUrl = DEFAULT_ALIBABA_TOP_API_URL,
  signMethod = DEFAULT_SIGN_METHOD,
  format = DEFAULT_FORMAT,
  version = DEFAULT_VERSION,
  simplify = false,
  timeoutMs = 15_000
}) {
  if (!apiName || !appKey || !appSecret || !session) {
    throw new AlibabaTopApiError("Missing required TOP API configuration", {
      apiName: Boolean(apiName),
      appKey: Boolean(appKey),
      appSecret: Boolean(appSecret),
      session: Boolean(session)
    });
  }

  const requestParams = buildTopRequestParams({
    apiName,
    appKey,
    session,
    partnerId,
    businessParams,
    signMethod,
    format,
    version,
    simplify
  });

  requestParams.sign = signAlibabaTopRequest({
    params: requestParams,
    secret: appSecret,
    signMethod
  });

  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      Accept: "application/json"
    },
    body: buildFormBody(requestParams)
  };

  if (globalThis.AbortSignal?.timeout) {
    requestOptions.signal = AbortSignal.timeout(timeoutMs);
  }

  const response = await fetch(endpointUrl, requestOptions);
  const parsed = await parseResponse(response);

  if (!response.ok) {
    throw new AlibabaTopApiError("TOP API request failed", {
      apiName,
      endpointUrl,
      status: response.status,
      rawText: parsed.rawText
    });
  }

  if (!parsed.json || typeof parsed.json !== "object") {
    throw new AlibabaTopApiError("TOP API returned non-JSON data", {
      apiName,
      endpointUrl,
      rawText: parsed.rawText
    });
  }

  if (parsed.json.error_response) {
    throw new AlibabaTopApiError("TOP API returned error_response", {
      apiName,
      endpointUrl,
      errorResponse: parsed.json.error_response
    });
  }

  const rootKey = getResponseRootKey(apiName);
  const payload = parsed.json[rootKey] ?? parsed.json;

  return {
    apiName,
    endpointUrl,
    rootKey,
    payload,
    raw: parsed.json
  };
}
