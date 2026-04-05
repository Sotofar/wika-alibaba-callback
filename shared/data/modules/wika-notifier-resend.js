const DEFAULT_RESEND_TIMEOUT_MS = 5000;

function ensureString(value) {
  return String(value ?? "").trim();
}

function parseTimeout(value, fallback) {
  const parsed = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
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

export function getWikaResendProviderState(config = {}) {
  const configErrors = [];

  if (!ensureString(config.resend_api_key)) {
    configErrors.push("WIKA_NOTIFY_RESEND_API_KEY missing");
  }

  if (!ensureString(config.email_from)) {
    configErrors.push("WIKA_NOTIFY_EMAIL_FROM missing");
  }

  if (!ensureString(config.email_to)) {
    configErrors.push("WIKA_NOTIFY_EMAIL_TO missing");
  }

  return {
    provider: "resend",
    configured: configErrors.length === 0,
    config_errors: configErrors,
    timeout_ms: parseTimeout(config.resend_timeout_ms, DEFAULT_RESEND_TIMEOUT_MS)
  };
}

export function buildWikaResendRequest(preview, config = {}) {
  const state = getWikaResendProviderState(config);

  return {
    provider: "resend",
    url: "https://api.resend.com/emails",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ensureString(config.resend_api_key)}`
    },
    body: {
      from: ensureString(config.email_from),
      to: [ensureString(config.email_to)],
      subject: ensureString(preview?.subject),
      text: ensureString(preview?.text)
    },
    state,
    preview: {
      provider: "resend",
      method: "POST",
      target: "https://api.resend.com/emails",
      timeout_ms: state.timeout_ms,
      header_names: ["Authorization", "Content-Type"],
      email_from: ensureString(config.email_from) ? "[configured]" : null,
      email_to: ensureString(config.email_to) ? "[configured]" : null,
      subject: ensureString(preview?.subject) || null
    }
  };
}

export async function dispatchWikaResend(request, options = {}) {
  const dryRun = Boolean(options.dryRun);

  if (dryRun) {
    return {
      provider: "resend",
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
    throw new Error(`Resend delivery failed (${response.status}): ${text || "empty body"}`);
  }

  return {
    provider: "resend",
    dry_run: false,
    status: response.status,
    response_text: text
  };
}
