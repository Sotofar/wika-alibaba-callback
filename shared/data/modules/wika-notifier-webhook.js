const DEFAULT_WEBHOOK_TIMEOUT_MS = 5000;

function ensureString(value) {
  return String(value ?? "").trim();
}

function parseTimeout(value, fallback) {
  const parsed = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getHeaderNames(headers = {}) {
  return Object.keys(headers).sort();
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

export function getWikaWebhookProviderState(config = {}) {
  const configErrors = [];

  if (!ensureString(config.webhook_url)) {
    configErrors.push("WIKA_NOTIFY_WEBHOOK_URL missing");
  }

  return {
    provider: "webhook",
    configured: configErrors.length === 0,
    config_errors: configErrors,
    timeout_ms: parseTimeout(config.webhook_timeout_ms, DEFAULT_WEBHOOK_TIMEOUT_MS),
    auth_mode: ensureString(config.webhook_bearer_token) ? "bearer" : "none"
  };
}

export function buildWikaWebhookRequest(alert, config = {}) {
  const state = getWikaWebhookProviderState(config);
  const headers = {
    "Content-Type": "application/json"
  };

  if (ensureString(config.webhook_bearer_token)) {
    headers.Authorization = `Bearer ${ensureString(config.webhook_bearer_token)}`;
  }

  return {
    provider: "webhook",
    url: ensureString(config.webhook_url),
    method: "POST",
    headers,
    body: alert,
    state,
    preview: {
      provider: "webhook",
      method: "POST",
      target: state.configured ? "[configured]" : null,
      timeout_ms: state.timeout_ms,
      auth_mode: state.auth_mode,
      header_names: getHeaderNames(headers),
      body_kind: ensureString(alert?.kind) || "unknown",
      body_keys: Object.keys(alert ?? {}).sort()
    }
  };
}

export async function dispatchWikaWebhook(request, options = {}) {
  const dryRun = Boolean(options.dryRun);

  if (dryRun) {
    return {
      provider: "webhook",
      dry_run: true,
      request_preview: request.preview
    };
  }

  const response = await fetchWithTimeout(
    request.url,
    {
      method: request.method,
      headers: request.headers,
      body: JSON.stringify(request.body)
    },
    request.state.timeout_ms
  );
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Webhook delivery failed (${response.status}): ${text || "empty body"}`);
  }

  return {
    provider: "webhook",
    dry_run: false,
    status: response.status,
    response_text: text
  };
}
