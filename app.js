import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { DEFAULT_ALIBABA_TOP_API_URL } from "./shared/data/clients/alibaba-top-client.js";
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

const stateStore = new Map();
const wikaTokenRuntime = {
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
  if (!inputPath) {
    return DEFAULT_WIKA_TOKEN_STORAGE_PATH;
  }

  if (path.isAbsolute(inputPath)) {
    return inputPath;
  }

  return path.join(__dirname, inputPath);
}

function getWikaTokenStoragePath() {
  return resolveProjectPath(getEnv("ALIBABA_WIKA_TOKEN_STORAGE_PATH"));
}

function isWikaAutoRefreshEnabled() {
  return getBooleanEnv("ALIBABA_WIKA_AUTO_REFRESH_ENABLED", true);
}

function getWikaRefreshBufferSeconds() {
  return getPositiveIntegerEnv(
    "ALIBABA_WIKA_REFRESH_BUFFER_SECONDS",
    DEFAULT_REFRESH_BUFFER_SECONDS
  );
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

function buildConfigSummary() {
  const storagePath = getWikaTokenStoragePath();
  const bootstrapRefreshTokenPresent = Boolean(
    getEnv("ALIBABA_WIKA_BOOTSTRAP_REFRESH_TOKEN")
  );

  return {
    client_id_present: Boolean(getEnv("ALIBABA_CLIENT_ID")),
    client_secret_present: Boolean(getEnv("ALIBABA_CLIENT_SECRET")),
    redirect_uri: getEnv("ALIBABA_REDIRECT_URI") || null,
    auth_url: getEnv("ALIBABA_AUTH_URL") || null,
    token_url: getEnv("ALIBABA_TOKEN_URL") || null,
    refresh_token_url: getAlibabaRefreshTokenUrl() || null,
    app_base_url: getEnv("APP_BASE_URL") || null,
    session_secret_present: Boolean(getEnv("SESSION_SECRET")),
    partner_id_present: Boolean(getEnv("ALIBABA_PARTNER_ID")),
    state_ttl_seconds: STATE_TTL_MS / 1000,
    active_state_count: stateStore.size,
    wika_auto_refresh_enabled: isWikaAutoRefreshEnabled(),
    wika_refresh_buffer_seconds: getWikaRefreshBufferSeconds(),
    wika_bootstrap_refresh_token_present: bootstrapRefreshTokenPresent,
    wika_token_storage_path: storagePath,
    wika_token_file_exists: fileExists(storagePath),
    wika_token_loaded: Boolean(wikaTokenRuntime.tokenRecord),
    wika_runtime_loaded_from: wikaTokenRuntime.loadedFrom,
    wika_startup_init_attempted_at: wikaTokenRuntime.startupInitAttemptedAt,
    wika_startup_init_status: wikaTokenRuntime.startupInitStatus,
    wika_startup_init_error: wikaTokenRuntime.startupInitError,
    wika_has_refresh_token: Boolean(
      wikaTokenRuntime.tokenRecord?.token_payload?.refresh_token
    ),
    wika_next_refresh_at: wikaTokenRuntime.nextRefreshAt,
    wika_last_refresh_at: wikaTokenRuntime.lastRefreshAt,
    wika_last_refresh_reason: wikaTokenRuntime.lastRefreshReason,
    wika_last_refresh_error: wikaTokenRuntime.lastRefreshError
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

function rememberState(state) {
  cleanupExpiredStates();
  stateStore.set(state, {
    createdAt: Date.now(),
    expiresAt: Date.now() + STATE_TTL_MS
  });
}

function consumeState(state) {
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

function buildAlibabaAuthorizationUrl(state) {
  const configurationError = createConfigurationError(
    ["ALIBABA_CLIENT_ID", "ALIBABA_REDIRECT_URI", "ALIBABA_AUTH_URL"],
    "Alibaba auth start"
  );

  if (configurationError) {
    throw configurationError;
  }

  const search = new URLSearchParams({
    response_type: "code",
    force_auth: "true",
    redirect_uri: getEnv("ALIBABA_REDIRECT_URI"),
    client_id: getEnv("ALIBABA_CLIENT_ID"),
    state
  });

  return `${getEnv("ALIBABA_AUTH_URL")}?${search.toString()}`;
}

function getAlibabaRefreshTokenUrl() {
  const explicitValue = getEnv("ALIBABA_REFRESH_TOKEN_URL");
  if (explicitValue) {
    return explicitValue;
  }

  const tokenUrl = getEnv("ALIBABA_TOKEN_URL");
  if (!tokenUrl) {
    return "";
  }

  if (tokenUrl.includes("/auth/token/create")) {
    return tokenUrl.replace("/auth/token/create", "/auth/token/refresh");
  }

  return "";
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

async function callAlibabaGopApi({ apiName, businessParams, endpointUrl, operationName }) {
  const configurationError = createConfigurationError(
    ["ALIBABA_CLIENT_ID", "ALIBABA_CLIENT_SECRET"],
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
    app_key: getEnv("ALIBABA_CLIENT_ID"),
    sign_method: "sha256",
    timestamp: String(Date.now()),
    ...businessParams
  };

  const partnerId = getEnv("ALIBABA_PARTNER_ID");
  if (partnerId) {
    requestParams.partner_id = partnerId;
  }

  requestParams.sign = signAlibabaRequest({
    apiName,
    params: requestParams,
    clientSecret: getEnv("ALIBABA_CLIENT_SECRET")
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

async function exchangeAuthorizationCode(code) {
  return callAlibabaGopApi({
    apiName: "/auth/token/create",
    businessParams: { code },
    endpointUrl: getEnv("ALIBABA_TOKEN_URL"),
    operationName: "Alibaba token exchange"
  });
}

async function refreshAuthorizationToken(refreshToken) {
  return callAlibabaGopApi({
    apiName: "/auth/token/refresh",
    businessParams: { refresh_token: refreshToken },
    endpointUrl: getAlibabaRefreshTokenUrl(),
    operationName: "Alibaba token refresh"
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

function readPersistedWikaTokenRecord() {
  const storagePath = getWikaTokenStoragePath();
  if (!fileExists(storagePath)) {
    return null;
  }

  const content = fs.readFileSync(storagePath, "utf8");
  const record = JSON.parse(content);

  if (!record || typeof record !== "object" || !record.token_payload) {
    throw new Error("Persisted Wika token file is invalid.");
  }

  return record;
}

function writePersistedWikaTokenRecord(record) {
  const storagePath = getWikaTokenStoragePath();
  ensureDirectoryForFile(storagePath);
  fs.writeFileSync(storagePath, JSON.stringify(record, null, 2), "utf8");
  return storagePath;
}

function persistWikaToken(nextPayload, source) {
  const previousPayload = wikaTokenRuntime.tokenRecord?.token_payload ?? {};
  const tokenPayload = normalizeTokenPayload(nextPayload, previousPayload);
  const record = {
    store_key: "wika",
    saved_at: new Date().toISOString(),
    last_source: source,
    token_payload: tokenPayload
  };

  const storagePath = writePersistedWikaTokenRecord(record);
  wikaTokenRuntime.tokenRecord = record;
  wikaTokenRuntime.loadedFrom = source;

  return {
    record,
    storagePath,
    summary: buildMaskedTokenSummary(tokenPayload)
  };
}

function loadBootstrapWikaTokenRecord() {
  const refreshToken = getEnv("ALIBABA_WIKA_BOOTSTRAP_REFRESH_TOKEN");
  if (!refreshToken) {
    return null;
  }

  return {
    store_key: "wika",
    saved_at: new Date().toISOString(),
    last_source: "bootstrap_env",
    token_payload: {
      refresh_token: refreshToken,
      obtained_at: new Date().toISOString()
    }
  };
}

function clearWikaRefreshTimer() {
  if (wikaTokenRuntime.refreshTimer) {
    clearTimeout(wikaTokenRuntime.refreshTimer);
    wikaTokenRuntime.refreshTimer = null;
  }

  wikaTokenRuntime.nextRefreshAt = null;
}

function scheduleWikaRefreshRetry(reason) {
  if (!isWikaAutoRefreshEnabled()) {
    return;
  }

  clearWikaRefreshTimer();
  const nextRunAt = new Date(Date.now() + REFRESH_RETRY_DELAY_MS).toISOString();
  wikaTokenRuntime.nextRefreshAt = nextRunAt;
  wikaTokenRuntime.refreshTimer = setTimeout(() => {
    refreshWikaToken(reason).catch(() => {});
  }, REFRESH_RETRY_DELAY_MS);
  wikaTokenRuntime.refreshTimer.unref?.();
}

function scheduleWikaAutoRefresh(reason = "scheduled") {
  clearWikaRefreshTimer();

  if (!isWikaAutoRefreshEnabled()) {
    return;
  }

  const refreshToken = wikaTokenRuntime.tokenRecord?.token_payload?.refresh_token;
  if (!refreshToken) {
    return;
  }

  const accessTokenExpiresAt = getAccessTokenExpiresAt(
    wikaTokenRuntime.tokenRecord.token_payload
  );
  const refreshBufferMs = getWikaRefreshBufferSeconds() * 1000;
  let delayMs = MIN_REFRESH_DELAY_MS;

  if (accessTokenExpiresAt) {
    delayMs = Math.max(
      MIN_REFRESH_DELAY_MS,
      accessTokenExpiresAt - Date.now() - refreshBufferMs
    );
  }

  const finalTargetAt = Date.now() + delayMs;
  wikaTokenRuntime.nextRefreshAt = new Date(finalTargetAt).toISOString();

  const timerDelayMs = Math.min(delayMs, MAX_TIMER_DELAY_MS, RESCHEDULE_CHUNK_MS);
  wikaTokenRuntime.refreshTimer = setTimeout(() => {
    if (Date.now() + MIN_REFRESH_DELAY_MS < finalTargetAt) {
      scheduleWikaAutoRefresh(reason);
      return;
    }

    refreshWikaToken(reason).catch(() => {});
  }, timerDelayMs);
  wikaTokenRuntime.refreshTimer.unref?.();
}

async function refreshWikaToken(reason = "scheduled") {
  if (wikaTokenRuntime.refreshInFlight) {
    return;
  }

  const refreshToken = wikaTokenRuntime.tokenRecord?.token_payload?.refresh_token;
  if (!refreshToken) {
    logInfo("Wika token refresh skipped", {
      reason,
      hasTokenRecord: Boolean(wikaTokenRuntime.tokenRecord)
    });
    return;
  }

  wikaTokenRuntime.refreshInFlight = true;
  wikaTokenRuntime.lastRefreshReason = reason;

  try {
    const refreshedPayload = await refreshAuthorizationToken(refreshToken);
    const persisted = persistWikaToken(refreshedPayload, `refresh:${reason}`);

    wikaTokenRuntime.lastRefreshAt = new Date().toISOString();
    wikaTokenRuntime.lastRefreshError = null;

    logInfo("Wika token refresh completed", {
      reason,
      storagePath: persisted.storagePath,
      token: persisted.summary
    });

    scheduleWikaAutoRefresh("scheduled");
  } catch (error) {
    wikaTokenRuntime.lastRefreshError =
      error instanceof Error ? error.message : String(error);

    logError("Wika token refresh failed", {
      reason,
      error: error instanceof Error ? error.message : String(error),
      details: error instanceof AlibabaApiError ? error.details : undefined
    });

    scheduleWikaRefreshRetry("retry_after_failure");
    throw error;
  } finally {
    wikaTokenRuntime.refreshInFlight = false;
  }
}

function initializeWikaTokenRuntime() {
  clearWikaRefreshTimer();
  wikaTokenRuntime.tokenRecord = null;
  wikaTokenRuntime.loadedFrom = null;
  wikaTokenRuntime.startupInitAttemptedAt = new Date().toISOString();
  wikaTokenRuntime.startupInitStatus = "running";
  wikaTokenRuntime.startupInitError = null;
  wikaTokenRuntime.lastRefreshError = null;

  try {
    const persistedRecord = readPersistedWikaTokenRecord();
    if (persistedRecord) {
      wikaTokenRuntime.tokenRecord = persistedRecord;
      wikaTokenRuntime.loadedFrom = "file";
      wikaTokenRuntime.startupInitStatus = "file";

      logInfo("Loaded persisted Wika token record", {
        storagePath: getWikaTokenStoragePath(),
        token: buildMaskedTokenSummary(persistedRecord.token_payload)
      });

      scheduleWikaAutoRefresh("startup");
      return;
    }

    const bootstrapRecord = loadBootstrapWikaTokenRecord();
    if (bootstrapRecord) {
      writePersistedWikaTokenRecord(bootstrapRecord);
      wikaTokenRuntime.tokenRecord = bootstrapRecord;
      wikaTokenRuntime.loadedFrom = "bootstrap_env";
      wikaTokenRuntime.startupInitStatus = "bootstrap_env";

      logInfo("Initialized Wika token record from bootstrap refresh token", {
        storagePath: getWikaTokenStoragePath()
      });

      scheduleWikaAutoRefresh("startup_bootstrap");
      return;
    }

    logInfo("No persisted Wika token record found", {
      storagePath: getWikaTokenStoragePath(),
      bootstrapRefreshTokenPresent: Boolean(
        getEnv("ALIBABA_WIKA_BOOTSTRAP_REFRESH_TOKEN")
      )
    });
    wikaTokenRuntime.startupInitStatus = "no_runtime";
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    wikaTokenRuntime.lastRefreshError =
      errorMessage;
    wikaTokenRuntime.startupInitStatus = "failed";
    wikaTokenRuntime.startupInitError = errorMessage;

    logError("Failed to initialize Wika token runtime", {
      error: errorMessage,
      storagePath: getWikaTokenStoragePath()
    });
  }
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

function getActiveWikaAccessToken() {
  return wikaTokenRuntime.tokenRecord?.token_payload?.access_token ?? "";
}

async function getWikaReadOnlyClientConfig() {
  const missingKeys = [];

  const appKey = getEnv("ALIBABA_CLIENT_ID");
  if (!appKey) {
    missingKeys.push("ALIBABA_CLIENT_ID");
  }

  const appSecret = getEnv("ALIBABA_CLIENT_SECRET");
  if (!appSecret) {
    missingKeys.push("ALIBABA_CLIENT_SECRET");
  }

  let accessToken = getActiveWikaAccessToken();
  if (!accessToken && wikaTokenRuntime.tokenRecord?.token_payload?.refresh_token) {
    logInfo("Wika read-only request is refreshing access token on demand", {
      reason: "read_only_data_access"
    });

    await refreshWikaToken("read_only_data_access");
    accessToken = getActiveWikaAccessToken();
  }

  if (!accessToken) {
    missingKeys.push("WIKA_ACCESS_TOKEN_RUNTIME");
  }

  if (missingKeys.length > 0) {
    throw new ConfigurationError(
      `Wika read-only data access is missing runtime prerequisites: ${missingKeys.join(", ")}`,
      missingKeys
    );
  }

  return {
    appKey,
    appSecret,
    accessToken,
    partnerId: getEnv("ALIBABA_PARTNER_ID") || undefined,
    endpointUrl: getAlibabaTopApiUrl()
  };
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

  return {
    ok: false,
    error: error instanceof Error ? error.message : String(error),
    missing_keys: error instanceof ConfigurationError ? error.missingKeys : undefined,
    top_error: topError
  };
}

app.get("/health", (_req, res) => {
  res.status(200).send("ok");
});

app.get("/integrations/alibaba/auth/debug", (_req, res) => {
  res.status(200).json(buildConfigSummary());
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

app.get("/integrations/alibaba/auth/start", (req, res) => {
  try {
    const state = generateState();
    rememberState(state);

    const authorizationUrl = buildAlibabaAuthorizationUrl(state);

    logInfo("Alibaba auth flow started", {
      state,
      redirectUri: getEnv("ALIBABA_REDIRECT_URI"),
      authUrl: getEnv("ALIBABA_AUTH_URL")
    });

    res.redirect(302, authorizationUrl);
  } catch (error) {
    const debugUrl = `${getAppBaseUrl(req)}/integrations/alibaba/auth/debug`;

    logError("Alibaba auth start failed", {
      error: error instanceof Error ? error.message : String(error),
      missingKeys: error instanceof ConfigurationError ? error.missingKeys : null
    });

    res
      .status(500)
      .type("html")
      .send(
        renderHtmlPage({
          title: "Alibaba Auth Start Error",
          heading: "Alibaba authorization could not start",
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
            label: "Open OAuth debug summary"
          }
        })
      );
  }
});

app.get("/integrations/alibaba/callback", async (req, res) => {
  const { code, state } = req.query;

  if (!code) {
    res.status(400).send("Missing code");
    return;
  }

  logInfo("Alibaba callback received", {
    code,
    state: state || null,
    query: req.query
  });

  const consumedState = consumeState(state);
  if (!consumedState.ok) {
    res
      .status(400)
      .type("html")
      .send(
        renderHtmlPage({
          title: "Alibaba Callback Error",
          heading: "Alibaba authorization failed",
          paragraphs: ["Invalid or expired state."],
          details: [
            {
              label: "State status",
              value: consumedState.reason
            }
          ],
          action: {
            href: `${getAppBaseUrl(req)}/integrations/alibaba/auth/start`,
            label: "Start authorization again"
          }
        })
      );
    return;
  }

  try {
    const tokenResponse = await exchangeAuthorizationCode(String(code));
    const persisted = persistWikaToken(tokenResponse, "oauth_callback");

    wikaTokenRuntime.lastRefreshAt = new Date().toISOString();
    wikaTokenRuntime.lastRefreshReason = "oauth_callback";
    wikaTokenRuntime.lastRefreshError = null;

    logInfo("Alibaba token exchange completed", {
      storagePath: persisted.storagePath,
      token: persisted.summary
    });

    scheduleWikaAutoRefresh("scheduled");

    res
      .status(200)
      .type("html")
      .send(
        renderHtmlPage({
          title: "Alibaba Authorization Success",
          heading: "Alibaba authorization received",
          paragraphs: [
            "The callback request reached the service successfully.",
            "Wika tokens were persisted and auto refresh has been scheduled."
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
              value: wikaTokenRuntime.nextRefreshAt ?? "not scheduled"
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

    logError("Alibaba callback processing failed", {
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
          title: "Alibaba Callback Error",
          heading: "Alibaba authorization failed",
          paragraphs: [error instanceof Error ? error.message : String(error)],
          details: detailRows,
          action: {
            href: `${getAppBaseUrl(req)}/integrations/alibaba/auth/debug`,
            label: "Open OAuth debug summary"
          }
        })
      );
  }
});

setInterval(cleanupExpiredStates, CLEANUP_INTERVAL_MS).unref?.();

const port = getPort();
const startupWarnings = buildStartupWarnings();

initializeWikaTokenRuntime();

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

  if (!getEnv("SESSION_SECRET")) {
    console.warn(
      "SESSION_SECRET is empty. State generation still works, but a dedicated secret is recommended."
    );
  }
});
