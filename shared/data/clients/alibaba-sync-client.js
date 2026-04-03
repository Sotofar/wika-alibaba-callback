import {
  AlibabaTopApiError,
  DEFAULT_ALIBABA_TOP_API_URL
} from "./alibaba-top-client.js";
import { signAlibabaRequest } from "../../../src/alibaba/sign.js";

export const DEFAULT_ALIBABA_SYNC_API_URL = "https://open-api.alibaba.com/sync";

function serializeSyncValue(value) {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

async function parseSyncResponse(response) {
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

export function resolveAlibabaSyncEndpoint(endpointUrl) {
  if (!endpointUrl || endpointUrl === DEFAULT_ALIBABA_TOP_API_URL) {
    return DEFAULT_ALIBABA_SYNC_API_URL;
  }

  return endpointUrl;
}

export function extractAlibabaSyncRootKey(apiName) {
  return `${apiName.replace(/\./g, "_")}_response`;
}

export async function callAlibabaSyncApi({
  apiName,
  appKey,
  appSecret,
  accessToken,
  endpointUrl = DEFAULT_ALIBABA_SYNC_API_URL,
  businessParams = {},
  timeoutMs = 15_000
}) {
  const requestParams = {
    method: apiName,
    app_key: appKey,
    access_token: accessToken,
    sign_method: "sha256",
    timestamp: String(Date.now())
  };

  for (const [key, value] of Object.entries(businessParams)) {
    const serializedValue = serializeSyncValue(value);
    if (serializedValue !== "") {
      requestParams[key] = serializedValue;
    }
  }

  requestParams.sign = signAlibabaRequest({
    apiName: "",
    params: requestParams,
    appSecret
  });

  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
      Accept: "application/json"
    },
    body: JSON.stringify(requestParams)
  };

  if (globalThis.AbortSignal?.timeout) {
    requestOptions.signal = AbortSignal.timeout(timeoutMs);
  }

  const response = await fetch(endpointUrl, requestOptions);
  const parsed = await parseSyncResponse(response);

  if (!response.ok) {
    throw new AlibabaTopApiError("Alibaba sync API request failed", {
      apiName,
      endpointUrl,
      status: response.status,
      rawText: parsed.rawText
    });
  }

  if (!parsed.json || typeof parsed.json !== "object") {
    throw new AlibabaTopApiError("Alibaba sync API returned non-JSON data", {
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

  const rootKey = extractAlibabaSyncRootKey(apiName);

  return {
    rootKey,
    payload: parsed.json[rootKey] ?? parsed.json,
    raw: parsed.json
  };
}
