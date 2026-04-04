import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { DEFAULT_ALIBABA_TOP_API_URL } from "./shared/data/clients/alibaba-top-client.js";
import {
  fetchAlibabaOfficialOrderDetail,
  fetchAlibabaOfficialOrderList
} from "./shared/data/modules/alibaba-official-orders.js";
import {
  fetchAlibabaOfficialOrderFund,
  fetchAlibabaOfficialOrderLogistics,
  fetchAlibabaOfficialProductScore
} from "./shared/data/modules/alibaba-official-extensions.js";
import {
  buildProductManagementSummary,
  buildProductRecommendations,
  fetchWikaProductList
} from "./projects/wika/data/products/module.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envFilePath = path.join(__dirname, ".env");
const app = express();

const STATE_TTL_MS = 10 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 60 * 1000;
const MIN_REFRESH_DELAY_MS = 5 * 1000;
const REFRESH_RETRY_DELAY_MS = 5 * 60 * 1000;
const DEFAULT_REFRESH_BUFFER_SECONDS = 10 * 60;
const MAX_TIMER_DELAY_MS = 2_147_000_000;
const RESCHEDULE_CHUNK_MS = 24 * 60 * 60 * 1000;
const DEFAULT_WIKA_TOKEN_STORAGE_PATH = path.join(
  __dirname,
  "data",
  "alibaba",
  "runtime",
  "wika-token.json"
);
const DEFAULT_XD_TOKEN_STORAGE_PATH = path.join(
  __dirname,
  "data",
  "alibaba",
  "runtime",
  "xd-token.json"
);
const DEFAULT_ALIBABA_SYNC_API_URL = "https://open-api.alibaba.com/sync";

const stateStore = new Map();
function createTokenRuntimeState() {
  return {
    tokenRecord: null,
    refreshTimer: null,
    refreshInFlight: false,
    loadedFrom: null,
    startupInitAttemptedAt: null,
    startupInitStatus: "not_started",
    startupInitError: null,
    nextRefreshAt: null,
    lastRefreshAt: null,
    lastRefreshReason: null,
    lastRefreshError: null
  };
}

const wikaTokenRuntime = createTokenRuntimeState();
const xdTokenRuntime = createTokenRuntimeState();

const ACCOUNT_CONFIGS = {
  wika: {
    key: "wika",
    label: "Wika",
    debugPrefix: "wika",
    clientIdEnv: "ALIBABA_CLIENT_ID",
    clientSecretEnv: "ALIBABA_CLIENT_SECRET",
    redirectUriEnv: "ALIBABA_REDIRECT_URI",
    authUrlEnv: "ALIBABA_AUTH_URL",
    tokenUrlEnv: "ALIBABA_TOKEN_URL",
    refreshTokenUrlEnv: "ALIBABA_REFRESH_TOKEN_URL",
    partnerIdEnv: "ALIBABA_PARTNER_ID",
    bootstrapRefreshTokenEnv: "ALIBABA_WIKA_BOOTSTRAP_REFRESH_TOKEN",
    tokenStoragePathEnv: "ALIBABA_WIKA_TOKEN_STORAGE_PATH",
    autoRefreshEnabledEnv: "ALIBABA_WIKA_AUTO_REFRESH_ENABLED",
    refreshBufferSecondsEnv: "ALIBABA_WIKA_REFRESH_BUFFER_SECONDS",
    defaultTokenStoragePath: DEFAULT_WIKA_TOKEN_STORAGE_PATH,
    authStartPath: "/integrations/alibaba/auth/start",
    callbackPath: "/integrations/alibaba/callback",
    debugPath: "/integrations/alibaba/auth/debug"
  },
  xd: {
    key: "xd",
    label: "XD",
    debugPrefix: "xd",
    clientIdEnv: "ALIBABA_XD_CLIENT_ID",
    clientSecretEnv: "ALIBABA_XD_CLIENT_SECRET",
    redirectUriEnv: "ALIBABA_XD_REDIRECT_URI",
    authUrlEnv: "ALIBABA_XD_AUTH_URL",
    tokenUrlEnv: "ALIBABA_XD_TOKEN_URL",
    refreshTokenUrlEnv: "ALIBABA_XD_REFRESH_TOKEN_URL",
    partnerIdEnv: "ALIBABA_XD_PARTNER_ID",
    bootstrapRefreshTokenEnv: "ALIBABA_XD_BOOTSTRAP_REFRESH_TOKEN",
    tokenStoragePathEnv: "ALIBABA_XD_TOKEN_STORAGE_PATH",
    autoRefreshEnabledEnv: "ALIBABA_XD_AUTO_REFRESH_ENABLED",
    refreshBufferSecondsEnv: "ALIBABA_XD_REFRESH_BUFFER_SECONDS",
    defaultTokenStoragePath: DEFAULT_XD_TOKEN_STORAGE_PATH,
    authStartPath: "/integrations/alibaba/xd/auth/start",
    callbackPath: "/integrations/alibaba/xd/auth/callback",
    debugPath: "/integrations/alibaba/xd/auth/debug"
  }
};

const ACCOUNT_RUNTIMES = {
  wika: wikaTokenRuntime,
  xd: xdTokenRuntime
};

function getAccountConfig(accountKey) {
  const config = ACCOUNT_CONFIGS[accountKey];
  if (!config) {
    throw new Error(`Unsupported Alibaba account: ${accountKey}`);
  }

  return config;
}

function getAccountRuntime(accountKey) {
  const runtime = ACCOUNT_RUNTIMES[accountKey];
  if (!runtime) {
    throw new Error(`Missing runtime for Alibaba account: ${accountKey}`);
  }

  return runtime;
}

let envLoaded = false;

class ConfigurationError extends Error {
  constructor(message, missingKeys = []) {
    super(message);
    this.name = "ConfigurationError";
    this.missingKeys = missingKeys;
  }
}

class AlibabaApiError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "AlibabaApiError";
    this.details = details;
  }
}

function loadEnvFile() {
  if (envLoaded || !fs.existsSync(envFilePath)) {
    envLoaded = true;
    return;
  }

  const lines = fs.readFileSync(envFilePath, "utf8").split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const delimiterIndex = line.indexOf("=");
    if (delimiterIndex === -1) {
      continue;
    }

    const key = line.slice(0, delimiterIndex).trim();
    let value = line.slice(delimiterIndex + 1).trim();

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }

  envLoaded = true;
}

function getEnv(name) {
  loadEnvFile();
  return process.env[name]?.trim() ?? "";
}

function getPort() {
  const rawPort = getEnv("PORT");
  if (!rawPort) {
    return 3000;
  }

  const parsed = Number(rawPort);
  return Number.isFinite(parsed) ? parsed : 3000;
}

function getBooleanEnv(name, defaultValue = false) {
  const rawValue = getEnv(name).toLowerCase();

  if (!rawValue) {
    return defaultValue;
  }

  if (["1", "true", "yes", "on"].includes(rawValue)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(rawValue)) {
    return false;
  }

  return defaultValue;
}

function getPositiveIntegerEnv(name, defaultValue) {
  const rawValue = getEnv(name);
  if (!rawValue) {
    return defaultValue;
  }

  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return defaultValue;
  }

  return parsed;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const replacements = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    };

    return replacements[character] ?? character;
  });
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

function maskValue(value, visible = 4) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const stringValue = String(value);
  if (stringValue.length <= 2) {
    return "***";
  }

  if (stringValue.length <= visible * 2) {
    return `${stringValue.slice(0, 1)}***${stringValue.slice(-1)}`;
  }

  return `${stringValue.slice(0, visible)}...${stringValue.slice(-visible)}`;
}

function sanitizeForLog(value, key = "") {
  const normalizedKey = String(key).toLowerCase();

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForLog(item, key));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [
        entryKey,
        sanitizeForLog(entryValue, entryKey)
      ])
    );
  }

  if (
    [
      "expires_in",
      "refresh_expires_in",
      "access_token_expires_at",
      "refresh_token_expires_at",
      "request_id"
    ].includes(normalizedKey)
  ) {
    return value;
  }

  if (normalizedKey === "code" && String(value) === "0") {
    return value;
  }

  if (
    /(client_secret|access_token|refresh_token|sign|state|code)/i.test(
      normalizedKey
    ) &&
    value !== undefined &&
    value !== null &&
    value !== ""
  ) {
    return maskValue(value);
  }

  return value;
}

function logInfo(message, payload) {
  if (payload === undefined) {
    console.log(message);
    return;
  }

  console.log(message, sanitizeForLog(payload));
}

function logError(message, payload) {
  if (payload === undefined) {
    console.error(message);
    return;
  }

  console.error(message, sanitizeForLog(payload));
}

function renderHtmlPage({ title, heading, paragraphs = [], details = [], action }) {
  const detailItems = details
    .map(
      ({ label, value }) =>
        `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</li>`
    )
    .join("");

  const paragraphItems = paragraphs
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");

  const actionMarkup = action
    ? `<p><a href="${escapeHtml(action.href)}">${escapeHtml(action.label)}</a></p>`
    : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        margin: 0;
        padding: 32px 16px;
        background: #f5f7fb;
        color: #1f2937;
      }
      main {
        max-width: 760px;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
      }
      h1 {
        margin-top: 0;
        font-size: 28px;
      }
      ul {
        padding-left: 20px;
      }
      li {
        margin: 8px 0;
      }
      a {
        color: #0f62fe;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>${escapeHtml(heading)}</h1>
      ${paragraphItems}
      ${detailItems ? `<ul>${detailItems}</ul>` : ""}
      ${actionMarkup}
    </main>
  </body>
</html>`;
}

function getAppBaseUrl(req) {
  return getEnv("APP_BASE_URL") || `${req.protocol}://${req.get("host")}`;
}

function createConfigurationError(requiredKeys, contextLabel) {
  const missingKeys = requiredKeys.filter((key) => !getEnv(key));
  if (missingKeys.length === 0) {
    return null;
  }

  return new ConfigurationError(
    `${contextLabel} is missing environment variables: ${missingKeys.join(", ")}`,
    missingKeys
  );
}

function resolveProjectPath(inputPath) {
  if (path.isAbsolute(inputPath)) {
    return inputPath;
  }

  return path.join(__dirname, inputPath);
}

function getAccountEnv(accountKey, fieldName) {
  return getEnv(getAccountConfig(accountKey)[fieldName]);
}

function getAccountTokenStoragePath(accountKey) {
  const config = getAccountConfig(accountKey);
  const configuredPath = getEnv(config.tokenStoragePathEnv);

  if (!configuredPath) {
    return config.defaultTokenStoragePath;
  }

  return resolveProjectPath(configuredPath);
}

function isAccountAutoRefreshEnabled(accountKey) {
  const config = getAccountConfig(accountKey);
  return getBooleanEnv(config.autoRefreshEnabledEnv, true);
}

function getAccountRefreshBufferSeconds(accountKey) {
  const config = getAccountConfig(accountKey);
  return getPositiveIntegerEnv(
    config.refreshBufferSecondsEnv,
    DEFAULT_REFRESH_BUFFER_SECONDS
  );
}

function getAccountAuthUrl(accountKey) {
  return (
    getAccountEnv(accountKey, "authUrlEnv") ||
    getEnv("ALIBABA_AUTH_URL")
  );
}

function getAccountTokenUrl(accountKey) {
  return (
    getAccountEnv(accountKey, "tokenUrlEnv") ||
    getEnv("ALIBABA_TOKEN_URL")
  );
}

function getAccountRefreshTokenUrl(accountKey) {
  const explicitValue =
    getAccountEnv(accountKey, "refreshTokenUrlEnv") ||
    getEnv("ALIBABA_REFRESH_TOKEN_URL");
  if (explicitValue) {
    return explicitValue;
  }

  const tokenUrl = getAccountTokenUrl(accountKey);
  if (!tokenUrl) {
    return "";
  }

  if (tokenUrl.includes("/auth/token/create")) {
    return tokenUrl.replace("/auth/token/create", "/auth/token/refresh");
  }

  return "";
}

function getAccountPartnerId(accountKey) {
  return (
    getAccountEnv(accountKey, "partnerIdEnv") ||
    getEnv("ALIBABA_PARTNER_ID")
  );
}

function getAccountBootstrapRefreshToken(accountKey) {
  return getAccountEnv(accountKey, "bootstrapRefreshTokenEnv");
}

function getWikaTokenStoragePath() {
  return getAccountTokenStoragePath("wika");
}

function isWikaAutoRefreshEnabled() {
  return isAccountAutoRefreshEnabled("wika");
}

function getWikaRefreshBufferSeconds() {
  return getAccountRefreshBufferSeconds("wika");
}

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function ensureDirectoryForFile(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function parseIsoDate(value) {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

function toIsoDateFromSeconds(baseTimestamp, seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }

  return new Date(baseTimestamp + seconds * 1000).toISOString();
}

function getAccessTokenExpiresAt(tokenPayload) {
  const direct = parseIsoDate(tokenPayload?.access_token_expires_at);
  if (direct) {
    return direct;
  }

  const savedAt = parseIsoDate(tokenPayload?.obtained_at);
  const expiresIn = Number(tokenPayload?.expires_in);
  if (savedAt && Number.isFinite(expiresIn) && expiresIn > 0) {
    return savedAt + expiresIn * 1000;
  }

  const expireTime = parseIsoDate(tokenPayload?.expire_time);
  return expireTime;
}

function buildMaskedTokenSummary(tokenPayload) {
  return {
    access_token: maskValue(tokenPayload?.access_token),
    refresh_token: maskValue(tokenPayload?.refresh_token),
    expires_in: tokenPayload?.expires_in ?? null,
    refresh_expires_in: tokenPayload?.refresh_expires_in ?? null,
    access_token_expires_at: tokenPayload?.access_token_expires_at ?? null,
    refresh_token_expires_at: tokenPayload?.refresh_token_expires_at ?? null,
    account: tokenPayload?.account ?? null,
    account_id: tokenPayload?.account_id ?? null,
    account_platform: tokenPayload?.account_platform ?? null,
    request_id: tokenPayload?.request_id ?? null
  };
}

function buildAccountDebugSummary(accountKey) {
  const config = getAccountConfig(accountKey);
  const runtime = getAccountRuntime(accountKey);
  const storagePath = getAccountTokenStoragePath(accountKey);
  const prefix = config.debugPrefix;

  return {
    [`${prefix}_client_id_present`]: Boolean(
      getAccountEnv(accountKey, "clientIdEnv")
    ),
    [`${prefix}_client_secret_present`]: Boolean(
      getAccountEnv(accountKey, "clientSecretEnv")
    ),
    [`${prefix}_redirect_uri`]:
      getAccountEnv(accountKey, "redirectUriEnv") || null,
    [`${prefix}_auth_url`]: getAccountAuthUrl(accountKey) || null,
    [`${prefix}_token_url`]: getAccountTokenUrl(accountKey) || null,
    [`${prefix}_refresh_token_url`]:
      getAccountRefreshTokenUrl(accountKey) || null,
    [`${prefix}_partner_id_present`]: Boolean(getAccountPartnerId(accountKey)),
    [`${prefix}_auto_refresh_enabled`]: isAccountAutoRefreshEnabled(accountKey),
    [`${prefix}_refresh_buffer_seconds`]:
      getAccountRefreshBufferSeconds(accountKey),
    [`${prefix}_bootstrap_refresh_token_present`]: Boolean(
      getAccountBootstrapRefreshToken(accountKey)
    ),
    [`${prefix}_token_storage_path`]: storagePath,
    [`${prefix}_token_file_exists`]: fileExists(storagePath),
    [`${prefix}_token_loaded`]: Boolean(runtime.tokenRecord),
    [`${prefix}_runtime_loaded_from`]: runtime.loadedFrom,
    [`${prefix}_startup_init_attempted_at`]: runtime.startupInitAttemptedAt,
    [`${prefix}_startup_init_status`]: runtime.startupInitStatus,
    [`${prefix}_startup_init_error`]: runtime.startupInitError,
    [`${prefix}_has_refresh_token`]: Boolean(
      runtime.tokenRecord?.token_payload?.refresh_token
    ),
    [`${prefix}_next_refresh_at`]: runtime.nextRefreshAt,
    [`${prefix}_last_refresh_at`]: runtime.lastRefreshAt,
    [`${prefix}_last_refresh_reason`]: runtime.lastRefreshReason,
    [`${prefix}_last_refresh_error`]: runtime.lastRefreshError
  };
}

function buildConfigSummary() {
  return {
    app_base_url: getEnv("APP_BASE_URL") || null,
    session_secret_present: Boolean(getEnv("SESSION_SECRET")),
    state_ttl_seconds: STATE_TTL_MS / 1000,
    active_state_count: stateStore.size,
    ...buildAccountDebugSummary("wika"),
    ...buildAccountDebugSummary("xd")
  };
}

function cleanupExpiredStates() {
  const now = Date.now();

  for (const [state, entry] of stateStore.entries()) {
    if (entry.expiresAt <= now) {
      stateStore.delete(state);
    }
  }
}

function rememberState(state, accountKey = "wika") {
  cleanupExpiredStates();
  stateStore.set(state, {
    createdAt: Date.now(),
    expiresAt: Date.now() + STATE_TTL_MS,
    accountKey
  });
}

function consumeState(state, accountKey = "wika") {
  cleanupExpiredStates();

  if (!state) {
    return {
      ok: false,
      reason: "missing"
    };
  }

  const entry = stateStore.get(state);
  if (!entry) {
    return {
      ok: false,
      reason: "invalid"
    };
  }

  if ((entry.accountKey || "wika") !== accountKey) {
    stateStore.delete(state);
    return {
      ok: false,
      reason: "scope_mismatch"
    };
  }

  if (entry.expiresAt <= Date.now()) {
    stateStore.delete(state);
    return {
      ok: false,
      reason: "expired"
    };
  }

  stateStore.delete(state);
  return {
    ok: true
  };
}

function generateState() {
  const randomSeed = crypto.randomBytes(32).toString("hex");
  const sessionSecret = getEnv("SESSION_SECRET");

  if (!sessionSecret) {
    return randomSeed;
  }

  return crypto
    .createHmac("sha256", sessionSecret)
    .update(`${randomSeed}:${Date.now()}`, "utf8")
    .digest("hex");
}

function signAlibabaRequest({ apiName, params, clientSecret }) {
  const sortedKeys = Object.keys(params)
    .filter((key) => key !== "sign")
    .sort(compareAscii);

  let payload = apiName;

  for (const key of sortedKeys) {
    const value = params[key];
    if (value === undefined || value === null || value === "") {
      continue;
    }

    payload += `${key}${value}`;
  }

  return crypto
    .createHmac("sha256", clientSecret)
    .update(payload, "utf8")
    .digest("hex")
    .toUpperCase();
}

function buildAlibabaAuthorizationUrl(state, accountKey = "wika") {
  const config = getAccountConfig(accountKey);
  const requiredKeys = [
    config.clientIdEnv,
    config.redirectUriEnv
  ];
  const authUrl = getAccountAuthUrl(accountKey);
  if (!authUrl) {
    requiredKeys.push(config.authUrlEnv);
  }
  const configurationError = createConfigurationError(
    requiredKeys,
    `${config.label} Alibaba auth start`
  );

  if (configurationError) {
    throw configurationError;
  }

  const search = new URLSearchParams({
    response_type: "code",
    force_auth: "true",
    redirect_uri: getAccountEnv(accountKey, "redirectUriEnv"),
    client_id: getAccountEnv(accountKey, "clientIdEnv"),
    state
  });

  return `${authUrl}?${search.toString()}`;
}

async function parseAlibabaResponse(response) {
  const rawBody = await response.text();

  try {
    return {
      status: response.status,
      ok: response.ok,
      body: JSON.parse(rawBody),
      rawBody
    };
  } catch {
    return {
      status: response.status,
      ok: response.ok,
      body: rawBody,
      rawBody
    };
  }
}

async function callAlibabaGopApi({
  apiName,
  businessParams,
  endpointUrl,
  operationName,
  clientIdEnv = "ALIBABA_CLIENT_ID",
  clientSecretEnv = "ALIBABA_CLIENT_SECRET",
  partnerIdEnv = "ALIBABA_PARTNER_ID"
}) {
  const configurationError = createConfigurationError(
    [clientIdEnv, clientSecretEnv],
    operationName
  );

  if (configurationError) {
    throw configurationError;
  }

  if (!endpointUrl) {
    throw new ConfigurationError(
      `${operationName} is missing environment variables: ${
        apiName === "/auth/token/refresh"
          ? "ALIBABA_REFRESH_TOKEN_URL or derivable ALIBABA_TOKEN_URL"
          : "ALIBABA_TOKEN_URL"
      }`
    );
  }

  const requestParams = {
    app_key: getEnv(clientIdEnv),
    sign_method: "sha256",
    timestamp: String(Date.now()),
    ...businessParams
  };

  const partnerId = getEnv(partnerIdEnv);
  if (partnerId) {
    requestParams.partner_id = partnerId;
  }

    requestParams.sign = signAlibabaRequest({
      apiName,
      params: requestParams,
      clientSecret: getEnv(clientSecretEnv)
    });

  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
      Accept: "application/json",
      "Accept-Encoding": "gzip"
    },
    body: JSON.stringify(requestParams)
  };

  if (globalThis.AbortSignal?.timeout) {
    requestOptions.signal = AbortSignal.timeout(15_000);
  }

  const response = await fetch(endpointUrl, requestOptions);
  const result = await parseAlibabaResponse(response);

  if (!result.ok) {
    throw new AlibabaApiError(`${operationName} request failed`, {
      status: result.status,
      requestParams,
      responseBody: result.body
    });
  }

  if (typeof result.body !== "object" || result.body === null) {
    throw new AlibabaApiError(`${operationName} returned non-JSON data`, {
      status: result.status,
      requestParams,
      responseBody: result.body
    });
  }

  if (String(result.body.code ?? "0") !== "0") {
    throw new AlibabaApiError(`${operationName} returned a business error`, {
      status: result.status,
      requestParams,
      responseBody: result.body
    });
  }

  return result.body;
}

async function exchangeAuthorizationCode(code, accountKey = "wika") {
  const config = getAccountConfig(accountKey);
  return callAlibabaGopApi({
    apiName: "/auth/token/create",
    businessParams: { code },
    endpointUrl: getAccountTokenUrl(accountKey),
    operationName: `${config.label} Alibaba token exchange`,
    clientIdEnv: config.clientIdEnv,
    clientSecretEnv: config.clientSecretEnv,
    partnerIdEnv: config.partnerIdEnv
  });
}

async function refreshAuthorizationToken(refreshToken, accountKey = "wika") {
  const config = getAccountConfig(accountKey);
  return callAlibabaGopApi({
    apiName: "/auth/token/refresh",
    businessParams: { refresh_token: refreshToken },
    endpointUrl: getAccountRefreshTokenUrl(accountKey),
    operationName: `${config.label} Alibaba token refresh`,
    clientIdEnv: config.clientIdEnv,
    clientSecretEnv: config.clientSecretEnv,
    partnerIdEnv: config.partnerIdEnv
  });
}

function normalizeTokenPayload(nextPayload, previousPayload = {}) {
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const expiresIn = Number(nextPayload?.expires_in);
  const refreshExpiresIn = Number(nextPayload?.refresh_expires_in);

  return {
    ...previousPayload,
    ...nextPayload,
    refresh_token: nextPayload?.refresh_token || previousPayload?.refresh_token || null,
    access_token: nextPayload?.access_token || previousPayload?.access_token || null,
    obtained_at: nowIso,
    access_token_expires_at:
      toIsoDateFromSeconds(now, expiresIn) ??
      previousPayload?.access_token_expires_at ??
      null,
    refresh_token_expires_at:
      toIsoDateFromSeconds(now, refreshExpiresIn) ??
      previousPayload?.refresh_token_expires_at ??
      null
  };
}

function readPersistedTokenRecord(accountKey) {
  const storagePath = getAccountTokenStoragePath(accountKey);
  if (!fileExists(storagePath)) {
    return null;
  }

  const content = fs.readFileSync(storagePath, "utf8");
  const record = JSON.parse(content);

  if (!record || typeof record !== "object" || !record.token_payload) {
    throw new Error(
      `Persisted ${getAccountConfig(accountKey).label} token file is invalid.`
    );
  }

  return record;
}

function writePersistedTokenRecord(accountKey, record) {
  const storagePath = getAccountTokenStoragePath(accountKey);
  ensureDirectoryForFile(storagePath);
  fs.writeFileSync(storagePath, JSON.stringify(record, null, 2), "utf8");
  return storagePath;
}

function persistAccountToken(accountKey, nextPayload, source) {
  const runtime = getAccountRuntime(accountKey);
  const previousPayload = runtime.tokenRecord?.token_payload ?? {};
  const tokenPayload = normalizeTokenPayload(nextPayload, previousPayload);
  const record = {
    store_key: accountKey,
    saved_at: new Date().toISOString(),
    last_source: source,
    token_payload: tokenPayload
  };

  const storagePath = writePersistedTokenRecord(accountKey, record);
  runtime.tokenRecord = record;
  runtime.loadedFrom = source;

  return {
    record,
    storagePath,
    summary: buildMaskedTokenSummary(tokenPayload)
  };
}

function persistWikaToken(nextPayload, source) {
  return persistAccountToken("wika", nextPayload, source);
}

function loadBootstrapTokenRecord(accountKey) {
  const refreshToken = getAccountBootstrapRefreshToken(accountKey);
  if (!refreshToken) {
    return null;
  }

  return {
    store_key: accountKey,
    saved_at: new Date().toISOString(),
    last_source: `bootstrap_env:${accountKey}`,
    token_payload: {
      refresh_token: refreshToken,
      obtained_at: new Date().toISOString()
    }
  };
}

function clearAccountRefreshTimer(accountKey) {
  const runtime = getAccountRuntime(accountKey);
  if (runtime.refreshTimer) {
    clearTimeout(runtime.refreshTimer);
    runtime.refreshTimer = null;
  }

  runtime.nextRefreshAt = null;
}

function clearWikaRefreshTimer() {
  clearAccountRefreshTimer("wika");
}

function scheduleAccountRefreshRetry(accountKey, reason) {
  const config = getAccountConfig(accountKey);
  const runtime = getAccountRuntime(accountKey);

  if (!isAccountAutoRefreshEnabled(accountKey)) {
    return;
  }

  clearAccountRefreshTimer(accountKey);
  const nextRunAt = new Date(Date.now() + REFRESH_RETRY_DELAY_MS).toISOString();
  runtime.nextRefreshAt = nextRunAt;
  runtime.refreshTimer = setTimeout(() => {
    refreshAccountToken(accountKey, reason).catch(() => {});
  }, REFRESH_RETRY_DELAY_MS);
  runtime.refreshTimer.unref?.();

  logInfo(`${config.label} token refresh retry scheduled`, {
    reason,
    nextRunAt
  });
}

function scheduleWikaRefreshRetry(reason) {
  scheduleAccountRefreshRetry("wika", reason);
}

function scheduleAccountAutoRefresh(accountKey, reason = "scheduled") {
  const runtime = getAccountRuntime(accountKey);

  clearAccountRefreshTimer(accountKey);

  if (!isAccountAutoRefreshEnabled(accountKey)) {
    return;
  }

  const refreshToken = runtime.tokenRecord?.token_payload?.refresh_token;
  if (!refreshToken) {
    return;
  }

  const accessTokenExpiresAt = getAccessTokenExpiresAt(
    runtime.tokenRecord.token_payload
  );
  const refreshBufferMs = getAccountRefreshBufferSeconds(accountKey) * 1000;
  let delayMs = MIN_REFRESH_DELAY_MS;

  if (accessTokenExpiresAt) {
    delayMs = Math.max(
      MIN_REFRESH_DELAY_MS,
      accessTokenExpiresAt - Date.now() - refreshBufferMs
    );
  }

  const finalTargetAt = Date.now() + delayMs;
  runtime.nextRefreshAt = new Date(finalTargetAt).toISOString();

  const timerDelayMs = Math.min(delayMs, MAX_TIMER_DELAY_MS, RESCHEDULE_CHUNK_MS);
  runtime.refreshTimer = setTimeout(() => {
    if (Date.now() + MIN_REFRESH_DELAY_MS < finalTargetAt) {
      scheduleAccountAutoRefresh(accountKey, reason);
      return;
    }

    refreshAccountToken(accountKey, reason).catch(() => {});
  }, timerDelayMs);
  runtime.refreshTimer.unref?.();
}

function scheduleWikaAutoRefresh(reason = "scheduled") {
  scheduleAccountAutoRefresh("wika", reason);
}

async function refreshAccountToken(accountKey, reason = "scheduled") {
  const config = getAccountConfig(accountKey);
  const runtime = getAccountRuntime(accountKey);

  if (runtime.refreshInFlight) {
    return;
  }

  const refreshToken = runtime.tokenRecord?.token_payload?.refresh_token;
  if (!refreshToken) {
    logInfo(`${config.label} token refresh skipped`, {
      reason,
      hasTokenRecord: Boolean(runtime.tokenRecord)
    });
    return;
  }

  runtime.refreshInFlight = true;
  runtime.lastRefreshReason = reason;

  try {
    const refreshedPayload = await refreshAuthorizationToken(refreshToken, accountKey);
    const persisted = persistAccountToken(
      accountKey,
      refreshedPayload,
      `refresh:${reason}`
    );

    runtime.lastRefreshAt = new Date().toISOString();
    runtime.lastRefreshError = null;

    logInfo(`${config.label} token refresh completed`, {
      reason,
      storagePath: persisted.storagePath,
      token: persisted.summary
    });

    scheduleAccountAutoRefresh(accountKey, "scheduled");
  } catch (error) {
    runtime.lastRefreshError =
      error instanceof Error ? error.message : String(error);

    logError(`${config.label} token refresh failed`, {
      reason,
      error: error instanceof Error ? error.message : String(error),
      details: error instanceof AlibabaApiError ? error.details : undefined
    });

    scheduleAccountRefreshRetry(accountKey, "retry_after_failure");
    throw error;
  } finally {
    runtime.refreshInFlight = false;
  }
}

async function refreshWikaToken(reason = "scheduled") {
  return refreshAccountToken("wika", reason);
}

async function initializeAccountTokenRuntime(accountKey) {
  const config = getAccountConfig(accountKey);
  const runtime = getAccountRuntime(accountKey);

  clearAccountRefreshTimer(accountKey);
  runtime.tokenRecord = null;
  runtime.loadedFrom = null;
  runtime.startupInitAttemptedAt = new Date().toISOString();
  runtime.startupInitStatus = "running";
  runtime.startupInitError = null;
  runtime.lastRefreshError = null;

  try {
    const persistedRecord = readPersistedTokenRecord(accountKey);
    if (persistedRecord) {
      runtime.tokenRecord = persistedRecord;
      runtime.loadedFrom = "file";
      runtime.startupInitStatus = "file";

      logInfo(`Loaded persisted ${config.label} token record`, {
        storagePath: getAccountTokenStoragePath(accountKey),
        token: buildMaskedTokenSummary(persistedRecord.token_payload)
      });

      scheduleAccountAutoRefresh(accountKey, "startup");
      return;
    }

    const bootstrapRecord = loadBootstrapTokenRecord(accountKey);
    if (bootstrapRecord) {
      runtime.tokenRecord = bootstrapRecord;
      runtime.loadedFrom = "bootstrap_env";
      runtime.startupInitStatus = "bootstrap_env";

      logInfo(
        `Initialized ${config.label} token runtime from bootstrap refresh token`,
        {
          storagePath: getAccountTokenStoragePath(accountKey)
        }
      );

      try {
        await refreshAccountToken(accountKey, "startup_bootstrap");
        runtime.startupInitStatus = runtime.loadedFrom ?? "refresh:startup_bootstrap";
      } catch (error) {
        clearAccountRefreshTimer(accountKey);
        runtime.tokenRecord = null;
        runtime.loadedFrom = null;
        runtime.nextRefreshAt = null;
        runtime.startupInitStatus = "failed";
        runtime.startupInitError =
          error instanceof Error ? error.message : String(error);

        logError(`${config.label} bootstrap refresh initialization failed`, {
          error:
            error instanceof Error ? error.message : String(error),
          storagePath: getAccountTokenStoragePath(accountKey)
        });
      }

      if (runtime.startupInitStatus !== "failed") {
        logInfo(`${config.label} bootstrap refresh initialization completed`, {
          storagePath: getAccountTokenStoragePath(accountKey),
          loadedFrom: runtime.loadedFrom,
          nextRefreshAt: runtime.nextRefreshAt
        });
      }

      if (runtime.startupInitStatus === "failed") {
        return;
      }

      if (!runtime.tokenRecord) {
        runtime.startupInitStatus = "no_runtime";
        return;
      }

      if (!fileExists(getAccountTokenStoragePath(accountKey))) {
        clearAccountRefreshTimer(accountKey);
        logError(`${config.label} bootstrap refresh did not persist a token file`, {
          storagePath: getAccountTokenStoragePath(accountKey)
        });
        runtime.startupInitStatus = "failed";
        runtime.startupInitError = "Bootstrap refresh succeeded but token file was not persisted.";
        runtime.tokenRecord = null;
        runtime.loadedFrom = null;
        runtime.nextRefreshAt = null;
        runtime.lastRefreshError = runtime.startupInitError;
        return;
      }

      return;
    }

    logInfo(`No persisted ${config.label} token record found`, {
      storagePath: getAccountTokenStoragePath(accountKey),
      bootstrapRefreshTokenPresent: Boolean(getAccountBootstrapRefreshToken(accountKey))
    });
    runtime.startupInitStatus = "no_runtime";
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    runtime.lastRefreshError = errorMessage;
    runtime.startupInitStatus = "failed";
    runtime.startupInitError = errorMessage;

    logError(`Failed to initialize ${config.label} token runtime`, {
      error: errorMessage,
      storagePath: getAccountTokenStoragePath(accountKey)
    });
  }
}

async function initializeWikaTokenRuntime() {
  await initializeAccountTokenRuntime("wika");
}

async function initializeXdTokenRuntime() {
  await initializeAccountTokenRuntime("xd");
}

function buildStartupWarnings() {
  const missingKeys = [
    "ALIBABA_CLIENT_ID",
    "ALIBABA_CLIENT_SECRET",
    "ALIBABA_REDIRECT_URI",
    "ALIBABA_AUTH_URL",
    "ALIBABA_TOKEN_URL",
    "APP_BASE_URL"
  ].filter((key) => !getEnv(key));

  return missingKeys;
}

function getAlibabaTopApiUrl() {
  return getEnv("ALIBABA_TOP_API_URL") || DEFAULT_ALIBABA_TOP_API_URL;
}

function getActiveAccountAccessToken(accountKey) {
  return (
    getAccountRuntime(accountKey).tokenRecord?.token_payload?.access_token ?? ""
  );
}

function getActiveWikaAccessToken() {
  return getActiveAccountAccessToken("wika");
}

async function getAlibabaReadOnlyClientConfig(accountKey = "wika") {
  const config = getAccountConfig(accountKey);
  const label = config.label;
  const missingKeys = [];

  const appKey = getAccountEnv(accountKey, "clientIdEnv");
  if (!appKey) {
    missingKeys.push(config.clientIdEnv);
  }

  const appSecret = getAccountEnv(accountKey, "clientSecretEnv");
  if (!appSecret) {
    missingKeys.push(config.clientSecretEnv);
  }

  let accessToken = getActiveAccountAccessToken(accountKey);
  const runtime = getAccountRuntime(accountKey);
  if (!accessToken && runtime.tokenRecord?.token_payload?.refresh_token) {
    logInfo(`${label} read-only request is refreshing access token on demand`, {
      reason: "read_only_data_access"
    });

    await refreshAccountToken(accountKey, "read_only_data_access");
    accessToken = getActiveAccountAccessToken(accountKey);
  }

  if (!accessToken) {
    missingKeys.push(`${accountKey.toUpperCase()}_ACCESS_TOKEN_RUNTIME`);
  }

  if (missingKeys.length > 0) {
    throw new ConfigurationError(
      `${label} read-only data access is missing runtime prerequisites: ${missingKeys.join(", ")}`,
      missingKeys
    );
  }

  return {
    appKey,
    appSecret,
    accessToken,
    partnerId: getAccountPartnerId(accountKey) || undefined,
    endpointUrl: getAlibabaTopApiUrl()
  };
}

async function getWikaReadOnlyClientConfig() {
  return getAlibabaReadOnlyClientConfig("wika");
}

function extractTopErrorResponse(error) {
  const topError = error?.details?.errorResponse;
  if (!topError || typeof topError !== "object") {
    return undefined;
  }

  return {
    code: topError.code ?? null,
    sub_code: topError.sub_code ?? null,
    msg: topError.msg ?? null,
    sub_msg: topError.sub_msg ?? null
  };
}

function buildReadOnlyErrorResponse(error) {
  const topError = extractTopErrorResponse(error);
  const missingKeys =
    error instanceof ConfigurationError
      ? error.missingKeys
      : Array.isArray(error?.missingKeys)
        ? error.missingKeys
        : undefined;

  return {
    ok: false,
    error: error instanceof Error ? error.message : String(error),
    missing_keys: missingKeys,
    error_category: classifyReadOnlyError(error, topError, missingKeys),
    top_error: topError
  };
}

function classifyReadOnlyError(error, topError, missingKeys = undefined) {
  if (Array.isArray(missingKeys) && missingKeys.length > 0) {
    const requestParameterKeys = new Set([
      "e_trade_id",
      "product_id",
      "group_id",
      "data_select"
    ]);

    if (missingKeys.some((key) => requestParameterKeys.has(String(key)))) {
      return "parameter_error";
    }

    return "authentication_error";
  }

  const subCode = String(topError?.sub_code ?? "").toLowerCase();
  const msg = String(topError?.msg ?? "").toLowerCase();
  const errorMessage = String(error instanceof Error ? error.message : error ?? "").toLowerCase();

  if (
    subCode.includes("permission") ||
    msg.includes("insufficientpermission") ||
    msg.includes("permission")
  ) {
    return "permission_error";
  }

  if (
    subCode.includes("missing") ||
    msg.includes("missingparameter") ||
    errorMessage.includes("requires e_trade_id")
  ) {
    return "parameter_error";
  }

  if (
    subCode.includes("appkey") ||
    msg.includes("invalid app key") ||
    msg.includes("gateway")
  ) {
    return "gateway_error";
  }

  if (topError) {
    return "platform_api_error";
  }

  return "unknown_error";
}

function createAccountOrderListHandler(accountKey) {
  return async (req, res) => {
    const config = getAccountConfig(accountKey);

    try {
      const result = await fetchAlibabaOfficialOrderList(
        {
          account: accountKey,
          ...(await getAlibabaReadOnlyClientConfig(accountKey))
        },
        req.query
      );

      logInfo(`${config.label} order list read completed`, {
        totalCount: result.response_meta.total_count,
        returnedItemCount: result.items.length,
        startPage: result.response_meta.start_page,
        pageSize: result.response_meta.page_size
      });

      res.status(200).json({
        ok: true,
        ...result
      });
    } catch (error) {
      logError(`${config.label} order list read failed`, {
        error: error instanceof Error ? error.message : String(error),
        details:
          error instanceof AlibabaApiError || error?.details
            ? error.details
            : undefined,
        top_error: extractTopErrorResponse(error),
        query: req.query
      });

      const hasMissingKeys =
        error instanceof ConfigurationError ||
        Array.isArray(error?.missingKeys);

      res
        .status(hasMissingKeys ? 400 : 502)
        .json(buildReadOnlyErrorResponse(error));
    }
  };
}

function createAccountOrderDetailHandler(accountKey) {
  return async (req, res) => {
    const config = getAccountConfig(accountKey);

    try {
      const result = await fetchAlibabaOfficialOrderDetail(
        {
          account: accountKey,
          ...(await getAlibabaReadOnlyClientConfig(accountKey))
        },
        req.query
      );

      logInfo(`${config.label} order detail read completed`, {
        tradeId: result.response_meta.e_trade_id,
        productCount: result.item.product_count
      });

      res.status(200).json({
        ok: true,
        ...result
      });
    } catch (error) {
      logError(`${config.label} order detail read failed`, {
        error: error instanceof Error ? error.message : String(error),
        details:
          error instanceof AlibabaApiError || error?.details
            ? error.details
            : undefined,
        top_error: extractTopErrorResponse(error),
        query: req.query
      });

      const hasMissingKeys =
        error instanceof ConfigurationError ||
        Array.isArray(error?.missingKeys);

      res
        .status(hasMissingKeys ? 400 : 502)
        .json(buildReadOnlyErrorResponse(error));
    }
  };
}

function createAccountProductScoreHandler(accountKey) {
  return async (req, res) => {
    const config = getAccountConfig(accountKey);

    try {
      const result = await fetchAlibabaOfficialProductScore(
        {
          account: accountKey,
          ...(await getAlibabaReadOnlyClientConfig(accountKey))
        },
        req.query
      );

      logInfo(`${config.label} product score read completed`, {
        productId: result.request_meta.product_id,
        resultFieldCount: result.response_meta.result_field_keys.length
      });

      res.status(200).json({
        ok: true,
        ...result
      });
    } catch (error) {
      logError(`${config.label} product score read failed`, {
        error: error instanceof Error ? error.message : String(error),
        details:
          error instanceof AlibabaApiError || error?.details
            ? error.details
            : undefined,
        top_error: extractTopErrorResponse(error),
        query: req.query
      });

      const hasMissingKeys =
        error instanceof ConfigurationError ||
        Array.isArray(error?.missingKeys);

      res
        .status(hasMissingKeys ? 400 : 502)
        .json(buildReadOnlyErrorResponse(error));
    }
  };
}

function createAccountOrderFundHandler(accountKey) {
  return async (req, res) => {
    const config = getAccountConfig(accountKey);

    try {
      const result = await fetchAlibabaOfficialOrderFund(
        {
          account: accountKey,
          ...(await getAlibabaReadOnlyClientConfig(accountKey))
        },
        req.query
      );

      logInfo(`${config.label} order fund read completed`, {
        tradeId: result.request_meta.e_trade_id,
        valueFieldCount: result.response_meta.value_field_keys.length
      });

      res.status(200).json({
        ok: true,
        ...result
      });
    } catch (error) {
      logError(`${config.label} order fund read failed`, {
        error: error instanceof Error ? error.message : String(error),
        details:
          error instanceof AlibabaApiError || error?.details
            ? error.details
            : undefined,
        top_error: extractTopErrorResponse(error),
        query: req.query
      });

      const hasMissingKeys =
        error instanceof ConfigurationError ||
        Array.isArray(error?.missingKeys);

      res
        .status(hasMissingKeys ? 400 : 502)
        .json(buildReadOnlyErrorResponse(error));
    }
  };
}

function createAccountOrderLogisticsHandler(accountKey) {
  return async (req, res) => {
    const config = getAccountConfig(accountKey);

    try {
      const result = await fetchAlibabaOfficialOrderLogistics(
        {
          account: accountKey,
          ...(await getAlibabaReadOnlyClientConfig(accountKey))
        },
        req.query
      );

      logInfo(`${config.label} order logistics read completed`, {
        tradeId: result.request_meta.e_trade_id,
        valueFieldCount: result.response_meta.value_field_keys.length
      });

      res.status(200).json({
        ok: true,
        ...result
      });
    } catch (error) {
      logError(`${config.label} order logistics read failed`, {
        error: error instanceof Error ? error.message : String(error),
        details:
          error instanceof AlibabaApiError || error?.details
            ? error.details
            : undefined,
        top_error: extractTopErrorResponse(error),
        query: req.query
      });

      const hasMissingKeys =
        error instanceof ConfigurationError ||
        Array.isArray(error?.missingKeys);

      res
        .status(hasMissingKeys ? 400 : 502)
        .json(buildReadOnlyErrorResponse(error));
    }
  };
}

const XD_ORDER_LIST_VERIFIED_FIELDS = Object.freeze([
  "response_meta.total_count",
  "response_meta.returned_item_count",
  "response_meta.start_page",
  "response_meta.page_size",
  "items.trade_id",
  "items.create_date.timestamp",
  "items.create_date.format_date",
  "items.modify_date.timestamp",
  "items.modify_date.format_date"
]);

const XD_ORDER_DETAIL_VERIFIED_FIELDS = Object.freeze([
  "item.trade_id",
  "item.create_date.timestamp",
  "item.create_date.format_date",
  "item.modify_date.timestamp",
  "item.modify_date.format_date",
  "item.trade_status",
  "item.fulfillment_channel",
  "item.shipment_method",
  "item.shipment_date",
  "item.buyer.full_name",
  "item.buyer.immutable_eid",
  "item.buyer.e_account_id",
  "item.export_service_type",
  "item.amount.amount",
  "item.amount.currency",
  "item.shipment_fee.amount",
  "item.product_total_amount.amount",
  "item.order_products"
]);

function toPositiveInteger(value, fallbackValue, maxValue = Number.POSITIVE_INFINITY) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallbackValue;
  }

  return Math.min(parsed, maxValue);
}

function toNonNegativeInteger(value, fallbackValue) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallbackValue;
  }

  return parsed;
}

function normalizeSyncDateValue(value) {
  if (!value || typeof value !== "object") {
    return {
      timestamp: null,
      format_date: null
    };
  }

  const timestamp = Number(value.timestamp);

  return {
    timestamp: Number.isFinite(timestamp) ? timestamp : null,
    format_date: value.format_date ?? null
  };
}

function normalizeSyncMoneyValue(value) {
  if (!value || typeof value !== "object") {
    return {
      amount: null,
      currency: null
    };
  }

  return {
    amount: value.amount ?? null,
    currency: value.currency ?? null
  };
}

function serializeSyncRequestValue(value) {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

async function parseAlibabaSyncResponse(response) {
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

function resolveOfficialSyncEndpoint(endpointUrl) {
  if (!endpointUrl || endpointUrl === DEFAULT_ALIBABA_TOP_API_URL) {
    return DEFAULT_ALIBABA_SYNC_API_URL;
  }

  return endpointUrl;
}

async function callAlibabaSyncReadOnlyApi({
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
    const serializedValue = serializeSyncRequestValue(value);
    if (serializedValue !== "") {
      requestParams[key] = serializedValue;
    }
  }

  requestParams.sign = signAlibabaRequest({
    apiName: "",
    params: requestParams,
    clientSecret: appSecret
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
  const parsed = await parseAlibabaSyncResponse(response);

  if (!response.ok) {
    throw new AlibabaApiError("Alibaba sync API request failed", {
      apiName,
      endpointUrl,
      status: response.status,
      rawText: parsed.rawText
    });
  }

  if (!parsed.json || typeof parsed.json !== "object") {
    throw new AlibabaApiError("Alibaba sync API returned non-JSON data", {
      apiName,
      endpointUrl,
      rawText: parsed.rawText
    });
  }

  if (parsed.json.error_response) {
    throw new AlibabaApiError("TOP API returned error_response", {
      apiName,
      endpointUrl,
      errorResponse: parsed.json.error_response
    });
  }

  const rootKey = `${apiName.replace(/\./g, "_")}_response`;

  return {
    rootKey,
    payload: parsed.json[rootKey] ?? parsed.json,
    raw: parsed.json
  };
}

function buildXdOfficialOrderListQuery(query = {}) {
  return {
    param_trade_ecology_order_list_query: {
      role: String(query.role || "seller"),
      start_page: toNonNegativeInteger(query.start_page, 0),
      page_size: toPositiveInteger(query.page_size, 20, 50),
      status: query.status ? String(query.status).trim() : undefined,
      sales_man_login_id: query.sales_man_login_id
        ? String(query.sales_man_login_id).trim()
        : undefined
    }
  };
}

function normalizeXdOfficialOrderListItem(item = {}) {
  return {
    trade_id: item.trade_id ?? null,
    create_date: normalizeSyncDateValue(item.create_date),
    modify_date: normalizeSyncDateValue(item.modify_date)
  };
}

function normalizeXdOfficialOrderDetail(item = {}, requestedTradeId = null) {
  const rawProducts = item.order_products?.trade_ecology_order_product;
  const orderProducts = Array.isArray(rawProducts)
    ? rawProducts
    : rawProducts
      ? [rawProducts]
      : [];

  return {
    trade_id: item.trade_id ?? requestedTradeId ?? null,
    create_date: normalizeSyncDateValue(item.create_date),
    modify_date: normalizeSyncDateValue(item.modify_date),
    trade_status: item.trade_status ?? null,
    fulfillment_channel: item.fulfillment_channel ?? null,
    shipment_method: item.shipment_method ?? null,
    shipment_date: normalizeSyncDateValue(item.shipment_date),
    export_service_type: item.export_service_type ?? null,
    buyer: {
      full_name: item.buyer?.full_name ?? null,
      immutable_eid: item.buyer?.immutable_eid ?? null,
      e_account_id: item.buyer?.e_account_id ?? null
    },
    amount: normalizeSyncMoneyValue(
      item.total_amount ??
        item.order_amount ??
        item.pay_amount ??
        item.inspection_service_amount
    ),
    product_total_amount: normalizeSyncMoneyValue(item.product_total_amount),
    shipment_fee: normalizeSyncMoneyValue(item.shipment_fee),
    advance_amount: normalizeSyncMoneyValue(item.advance_amount),
    discount_amount: normalizeSyncMoneyValue(item.discount_amount),
    product_count: orderProducts.length,
    order_products: orderProducts.slice(0, 20).map((product) => ({
      product_id: product.product_id ?? null,
      name: product.name ?? null,
      quantity: product.quantity ?? null,
      unit: product.unit ?? null,
      unit_price: normalizeSyncMoneyValue(product.unit_price),
      product_image: product.product_image ?? null
    })),
    available_field_keys:
      item && typeof item === "object" ? Object.keys(item).sort() : []
  };
}

async function fetchXdOfficialOrderList(
  {
    appKey,
    appSecret,
    accessToken,
    endpointUrl = DEFAULT_ALIBABA_TOP_API_URL
  },
  query = {}
) {
  const businessParams = buildXdOfficialOrderListQuery(query);
  const effectiveEndpointUrl = resolveOfficialSyncEndpoint(endpointUrl);
  const response = await callAlibabaSyncReadOnlyApi({
    apiName: "alibaba.seller.order.list",
    appKey,
    appSecret,
    accessToken,
    endpointUrl: effectiveEndpointUrl,
    businessParams
  });

  const payload = response.payload ?? {};
  const result = payload.result ?? {};
  if (result.success === false) {
    throw new AlibabaApiError("Alibaba order list returned business failure", {
      apiName: "alibaba.seller.order.list",
      endpointUrl: effectiveEndpointUrl,
      errorResponse: {
        code: result.error_code ?? null,
        sub_code: null,
        msg: result.error_message ?? "Alibaba order list business failure",
        sub_msg: null
      },
      payload
    });
  }

  const value = result.value ?? {};
  const rawItems = value.order_list?.trade_ecology_order;
  const normalizedItems = (Array.isArray(rawItems)
    ? rawItems
    : rawItems
      ? [rawItems]
      : []
  ).map(normalizeXdOfficialOrderListItem);

  return {
    module: "orders",
    account: "xd",
    read_only: true,
    source: {
      type: "official_api",
      api_name: "alibaba.seller.order.list",
      endpoint_url: effectiveEndpointUrl,
      auth_parameter: "access_token",
      sign_method: "sha256"
    },
    verification_status: "待线上验收",
    evidence_level: "L1",
    verified_fields: XD_ORDER_LIST_VERIFIED_FIELDS,
    response_meta: {
      total_count: value.total_count ?? null,
      returned_item_count: normalizedItems.length,
      start_page: businessParams.param_trade_ecology_order_list_query.start_page,
      page_size: businessParams.param_trade_ecology_order_list_query.page_size,
      request_id: payload.request_id ?? null,
      trace_id: payload._trace_id_ ?? null,
      success: result.success ?? null
    },
    items: normalizedItems
  };
}

async function fetchXdOfficialOrderDetail(
  {
    appKey,
    appSecret,
    accessToken,
    endpointUrl = DEFAULT_ALIBABA_TOP_API_URL
  },
  query = {}
) {
  const tradeId = String(query.e_trade_id ?? "").trim();
  if (!tradeId) {
    throw new ConfigurationError("XD orders detail requires e_trade_id", [
      "e_trade_id"
    ]);
  }

  const effectiveEndpointUrl = resolveOfficialSyncEndpoint(endpointUrl);
  const response = await callAlibabaSyncReadOnlyApi({
    apiName: "alibaba.seller.order.get",
    appKey,
    appSecret,
    accessToken,
    endpointUrl: effectiveEndpointUrl,
    businessParams: {
      e_trade_id: tradeId
    }
  });

  const payload = response.payload ?? {};
  const detailValue = payload.value ?? {};

  return {
    module: "orders",
    account: "xd",
    read_only: true,
    source: {
      type: "official_api",
      api_name: "alibaba.seller.order.get",
      endpoint_url: effectiveEndpointUrl,
      auth_parameter: "access_token",
      sign_method: "sha256"
    },
    verification_status: "待线上验收",
    evidence_level: "L1",
    verified_fields: XD_ORDER_DETAIL_VERIFIED_FIELDS,
    response_meta: {
      request_id: payload.request_id ?? null,
      trace_id: payload._trace_id_ ?? null,
      e_trade_id: tradeId
    },
    item: normalizeXdOfficialOrderDetail(detailValue, tradeId)
  };
}

function createAlibabaAuthStartHandler(accountKey) {
  return (req, res) => {
    const config = getAccountConfig(accountKey);

    try {
      const state = generateState();
      rememberState(state, accountKey);

      const authorizationUrl = buildAlibabaAuthorizationUrl(state, accountKey);

      logInfo(`${config.label} Alibaba auth flow started`, {
        state,
        redirectUri: getAccountEnv(accountKey, "redirectUriEnv"),
        authUrl: getAccountAuthUrl(accountKey)
      });

      res.redirect(302, authorizationUrl);
    } catch (error) {
      const debugUrl = `${getAppBaseUrl(req)}${config.debugPath}`;

      logError(`${config.label} Alibaba auth start failed`, {
        error: error instanceof Error ? error.message : String(error),
        missingKeys:
          error instanceof ConfigurationError ? error.missingKeys : null
      });

      res
        .status(500)
        .type("html")
        .send(
          renderHtmlPage({
            title: `${config.label} Auth Start Error`,
            heading: `${config.label} authorization could not start`,
            paragraphs: [error instanceof Error ? error.message : String(error)],
            details:
              error instanceof ConfigurationError
                ? [
                    {
                      label: "Missing variables",
                      value: error.missingKeys.join(", ")
                    }
                  ]
                : [],
            action: {
              href: debugUrl,
              label: `Open ${config.label} OAuth debug summary`
            }
          })
        );
    }
  };
}

function createAlibabaCallbackHandler(accountKey) {
  return async (req, res) => {
    const config = getAccountConfig(accountKey);
    const runtime = getAccountRuntime(accountKey);
    const { code, state } = req.query;

    if (!code) {
      res.status(400).send("Missing code");
      return;
    }

    logInfo(`${config.label} Alibaba callback received`, {
      code,
      state: state || null,
      query: req.query
    });

    const consumedState = consumeState(state, accountKey);
    if (!consumedState.ok) {
      res
        .status(400)
        .type("html")
        .send(
          renderHtmlPage({
            title: `${config.label} Callback Error`,
            heading: `${config.label} authorization failed`,
            paragraphs: ["Invalid or expired state."],
            details: [
              {
                label: "State status",
                value: consumedState.reason
              }
            ],
            action: {
              href: `${getAppBaseUrl(req)}${config.authStartPath}`,
              label: `Start ${config.label} authorization again`
            }
          })
        );
      return;
    }

    try {
      const tokenResponse = await exchangeAuthorizationCode(String(code), accountKey);
      const persisted = persistAccountToken(accountKey, tokenResponse, "oauth_callback");

      runtime.lastRefreshAt = new Date().toISOString();
      runtime.lastRefreshReason = "oauth_callback";
      runtime.lastRefreshError = null;

      logInfo(`${config.label} Alibaba token exchange completed`, {
        storagePath: persisted.storagePath,
        token: persisted.summary
      });

      scheduleAccountAutoRefresh(accountKey, "scheduled");

      res
        .status(200)
        .type("html")
        .send(
          renderHtmlPage({
            title: `${config.label} Authorization Success`,
            heading: `${config.label} authorization received`,
            paragraphs: [
              "The callback request reached the service successfully.",
              `${config.label} tokens were persisted and auto refresh has been scheduled.`
            ],
            details: [
              {
                label: "Access token received",
                value: tokenResponse.access_token ? "yes" : "no"
              },
              {
                label: "Access token",
                value: maskValue(tokenResponse.access_token) ?? "not available"
              },
              {
                label: "Refresh token present",
                value: tokenResponse.refresh_token ? "yes" : "no"
              },
              {
                label: "Refresh token",
                value: maskValue(tokenResponse.refresh_token) ?? "not available"
              },
              {
                label: "Storage path",
                value: persisted.storagePath
              },
              {
                label: "Next auto refresh",
                value: runtime.nextRefreshAt ?? "not scheduled"
              },
              {
                label: "expires_in",
                value: String(tokenResponse.expires_in ?? "not available")
              },
              {
                label: "refresh_expires_in",
                value: String(tokenResponse.refresh_expires_in ?? "not available")
              },
              {
                label: "request_id",
                value: String(tokenResponse.request_id ?? "not available")
              }
            ]
          })
        );
    } catch (error) {
      const errorDetails =
        error instanceof AlibabaApiError ? error.details : undefined;

      logError(`${config.label} Alibaba callback processing failed`, {
        error: error instanceof Error ? error.message : String(error),
        details: errorDetails,
        callbackQuery: req.query
      });

      const detailRows = [];
      if (error instanceof ConfigurationError && error.missingKeys.length > 0) {
        detailRows.push({
          label: "Missing variables",
          value: error.missingKeys.join(", ")
        });
      }

      if (errorDetails?.responseBody?.request_id) {
        detailRows.push({
          label: "request_id",
          value: String(errorDetails.responseBody.request_id)
        });
      }

      if (errorDetails?.status) {
        detailRows.push({
          label: "HTTP status",
          value: String(errorDetails.status)
        });
      }

      res
        .status(error instanceof ConfigurationError ? 500 : 502)
        .type("html")
        .send(
          renderHtmlPage({
            title: `${config.label} Callback Error`,
            heading: `${config.label} authorization failed`,
            paragraphs: [error instanceof Error ? error.message : String(error)],
            details: detailRows,
            action: {
              href: `${getAppBaseUrl(req)}${config.debugPath}`,
              label: `Open ${config.label} OAuth debug summary`
            }
          })
        );
    }
  };
}

app.get("/health", (_req, res) => {
  res.status(200).send("ok");
});

app.get("/integrations/alibaba/auth/debug", (_req, res) => {
  res.status(200).json(buildConfigSummary());
});

app.get("/integrations/alibaba/xd/auth/debug", (_req, res) => {
  res.status(200).json({
    account: "xd",
    ...buildAccountDebugSummary("xd")
  });
});

app.get("/integrations/alibaba/wika/data/products/list", async (req, res) => {
  try {
    const result = await fetchWikaProductList(
      await getWikaReadOnlyClientConfig(),
      req.query
    );

    logInfo("Wika product list read completed", {
      totalItem: result.response_meta.total_item,
      returnedItemCount: result.items.length,
      currentPage: result.response_meta.current_page,
      pageSize: result.response_meta.page_size
    });

    res.status(200).json({
      ok: true,
      ...result
    });
  } catch (error) {
    logError("Wika product list read failed", {
      error: error instanceof Error ? error.message : String(error),
      details:
        error instanceof AlibabaApiError || error?.details
          ? error.details
          : undefined,
      top_error: extractTopErrorResponse(error),
      query: req.query
    });

    res
      .status(error instanceof ConfigurationError ? 500 : 502)
      .json(buildReadOnlyErrorResponse(error));
  }
});

app.get(
  "/integrations/alibaba/wika/data/products/score",
  createAccountProductScoreHandler("wika")
);

app.get("/integrations/alibaba/xd/data/products/list", async (req, res) => {
  try {
    const rawResult = await fetchWikaProductList(
      await getAlibabaReadOnlyClientConfig("xd"),
      req.query
    );
    const result = {
      ...rawResult,
      account: "xd"
    };

    logInfo("XD product list read completed", {
      totalItem: result.response_meta.total_item,
      returnedItemCount: result.items.length,
      currentPage: result.response_meta.current_page,
      pageSize: result.response_meta.page_size
    });

    res.status(200).json({
      ok: true,
      ...result
    });
  } catch (error) {
    logError("XD product list read failed", {
      error: error instanceof Error ? error.message : String(error),
      details:
        error instanceof AlibabaApiError || error?.details
          ? error.details
          : undefined,
      top_error: extractTopErrorResponse(error),
      query: req.query
    });

    res
      .status(error instanceof ConfigurationError ? 500 : 502)
      .json(buildReadOnlyErrorResponse(error));
  }
});

app.get(
  "/integrations/alibaba/wika/data/orders/list",
  createAccountOrderListHandler("wika")
);
app.get(
  "/integrations/alibaba/wika/data/orders/detail",
  createAccountOrderDetailHandler("wika")
);
app.get(
  "/integrations/alibaba/wika/data/orders/fund",
  createAccountOrderFundHandler("wika")
);
app.get(
  "/integrations/alibaba/wika/data/orders/logistics",
  createAccountOrderLogisticsHandler("wika")
);
app.get(
  "/integrations/alibaba/xd/data/orders/list",
  createAccountOrderListHandler("xd")
);
app.get(
  "/integrations/alibaba/xd/data/orders/detail",
  createAccountOrderDetailHandler("xd")
);

app.get(
  "/integrations/alibaba/wika/reports/products/management-summary",
  async (req, res) => {
    try {
      const result = await fetchWikaProductList(
        await getWikaReadOnlyClientConfig(),
        {
          ...req.query,
          page_size: req.query.page_size ?? 30
        }
      );
      const summary = buildProductManagementSummary(result);
      const recommendations = buildProductRecommendations(result);

      res.status(200).json({
        ok: true,
        module: "products",
        account: "wika",
        read_only: true,
        source: result.source,
        data_validation: {
          verification_status: result.verification_status,
          evidence_level: result.evidence_level,
          verified_fields: result.verified_fields
        },
        summary,
        recommendations
      });
    } catch (error) {
      logError("Wika product management summary failed", {
        error: error instanceof Error ? error.message : String(error),
        details:
          error instanceof AlibabaApiError || error?.details
            ? error.details
            : undefined,
        top_error: extractTopErrorResponse(error),
        query: req.query
      });

      res
        .status(error instanceof ConfigurationError ? 500 : 502)
        .json(buildReadOnlyErrorResponse(error));
    }
  }
);

app.get(
  "/integrations/alibaba/xd/reports/products/management-summary",
  async (req, res) => {
    try {
      const rawResult = await fetchWikaProductList(
        await getAlibabaReadOnlyClientConfig("xd"),
        {
          ...req.query,
          page_size: req.query.page_size ?? 30
        }
      );
      const result = {
        ...rawResult,
        account: "xd"
      };
      const summary = {
        ...buildProductManagementSummary(result),
        account: "xd"
      };
      const recommendations = buildProductRecommendations(result);

      res.status(200).json({
        ok: true,
        module: "products",
        account: "xd",
        read_only: true,
        source: result.source,
        data_validation: {
          verification_status: result.verification_status,
          evidence_level: result.evidence_level,
          verified_fields: result.verified_fields
        },
        summary,
        recommendations
      });
    } catch (error) {
      logError("XD product management summary failed", {
        error: error instanceof Error ? error.message : String(error),
        details:
          error instanceof AlibabaApiError || error?.details
            ? error.details
            : undefined,
        top_error: extractTopErrorResponse(error),
        query: req.query
      });

      res
        .status(error instanceof ConfigurationError ? 500 : 502)
        .json(buildReadOnlyErrorResponse(error));
    }
  }
);

app.get("/integrations/alibaba/auth/start", createAlibabaAuthStartHandler("wika"));
app.get("/integrations/alibaba/callback", createAlibabaCallbackHandler("wika"));
app.get("/integrations/alibaba/xd/auth/start", createAlibabaAuthStartHandler("xd"));
app.get("/integrations/alibaba/xd/auth/callback", createAlibabaCallbackHandler("xd"));

setInterval(cleanupExpiredStates, CLEANUP_INTERVAL_MS).unref?.();

const port = getPort();
const startupWarnings = buildStartupWarnings();

await initializeWikaTokenRuntime();
await initializeXdTokenRuntime();

app.listen(port, () => {
  console.log(`Alibaba callback service listening on port ${port}`);

  if (startupWarnings.length > 0) {
    console.warn(
      `Alibaba OAuth related variables are missing: ${startupWarnings.join(", ")}`
    );
  }

  if (!isWikaAutoRefreshEnabled()) {
    console.warn("Wika auto refresh is disabled by ALIBABA_WIKA_AUTO_REFRESH_ENABLED.");
  }

  if (!isAccountAutoRefreshEnabled("xd")) {
    console.warn("XD auto refresh is disabled by ALIBABA_XD_AUTO_REFRESH_ENABLED.");
  }

  if (!getEnv("SESSION_SECRET")) {
    console.warn(
      "SESSION_SECRET is empty. State generation still works, but a dedicated secret is recommended."
    );
  }
});
