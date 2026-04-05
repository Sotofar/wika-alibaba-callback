import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

import {
  buildWikaWebhookRequest,
  dispatchWikaWebhook,
  getWikaWebhookProviderState
} from "./wika-notifier-webhook.js";
import {
  buildWikaResendRequest,
  dispatchWikaResend,
  getWikaResendProviderState
} from "./wika-notifier-resend.js";

function ensureString(value) {
  return String(value ?? "").trim();
}

function parseBoolean(value) {
  const normalized = ensureString(value).toLowerCase();
  return ["1", "true", "yes", "on"].includes(normalized);
}

function parseProvider(value) {
  const normalized = ensureString(value).toLowerCase();

  if (["webhook", "resend", "none", "outbox"].includes(normalized)) {
    return normalized === "outbox" ? "none" : normalized;
  }

  return "";
}

function slugify(value) {
  return ensureString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function getIsoStamp(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "-");
}

function getProviderFromEnv(env = process.env) {
  const forced = parseProvider(env.WIKA_NOTIFY_PROVIDER);

  if (forced) {
    return forced;
  }

  if (ensureString(env.WIKA_NOTIFY_WEBHOOK_URL)) {
    return "webhook";
  }

  if (
    ensureString(env.WIKA_NOTIFY_RESEND_API_KEY || env.RESEND_API_KEY) &&
    ensureString(env.WIKA_NOTIFY_EMAIL_FROM) &&
    ensureString(env.WIKA_NOTIFY_EMAIL_TO)
  ) {
    return "resend";
  }

  return "none";
}

function buildSubject(alert) {
  const stage = ensureString(alert.stage_name) || "WIKA";
  const category = ensureString(alert.blocker_category?.label || alert.blocker_category?.code);
  return `[WIKA告警] ${stage} / ${category}`;
}

function buildTextBody(alert) {
  const lines = [
    `阶段名称: ${ensureString(alert.stage_name) || "未提供"}`,
    `阻塞分类: ${ensureString(alert.blocker_category?.label || alert.blocker_category?.code) || "未提供"}`,
    `触发时间: ${ensureString(alert.triggered_at) || "未提供"}`,
    `相关 API / 模块: ${[...(alert.related_apis || []), ...(alert.related_modules || [])].join(", ") || "未提供"}`,
    `当前真实证据: ${(alert.current_evidence || []).join("；") || "未提供"}`,
    `为什么系统不能继续自动推进: ${ensureString(alert.cannot_continue_reason) || "未提供"}`,
    `需要用户补什么: ${(alert.user_needs || []).join("；") || "暂无"}`,
    `建议下一步: ${(alert.suggested_next_steps || []).join("；") || "暂无"}`,
    `是否允许人工接管: ${alert.allow_human_handoff ? "是" : "否"}`
  ];

  return lines.join("\n");
}

async function ensureDirectory(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function writeAlertRecord(targetDir, payload) {
  await ensureDirectory(targetDir);

  const recordId = crypto.randomUUID();
  const stageSlug = slugify(payload.alert?.stage_name || payload.stage_name || "wika-alert");
  const fileName = `${getIsoStamp(new Date())}__${stageSlug}__${recordId}.json`;
  const filePath = path.join(targetDir, fileName);

  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return filePath;
}

function buildProviderState(config) {
  if (config.provider === "webhook") {
    return getWikaWebhookProviderState(config);
  }

  if (config.provider === "resend") {
    return getWikaResendProviderState(config);
  }

  return {
    provider: "none",
    configured: false,
    config_errors: ["No formal notification provider configured."]
  };
}

function buildProviderRequest(alert, config, preview) {
  if (config.provider === "webhook") {
    return buildWikaWebhookRequest(alert, config);
  }

  if (config.provider === "resend") {
    return buildWikaResendRequest(preview, config);
  }

  return null;
}

async function dispatchProvider(request, config, options = {}) {
  if (config.provider === "webhook") {
    return dispatchWikaWebhook(request, options);
  }

  if (config.provider === "resend") {
    return dispatchWikaResend(request, options);
  }

  throw new Error(`Unsupported provider: ${config.provider}`);
}

export function getWikaNotifierConfig(env = process.env, cwd = process.cwd()) {
  const provider = getProviderFromEnv(env);
  const alertsRoot =
    ensureString(env.WIKA_NOTIFY_ALERTS_ROOT) ||
    path.resolve(cwd, "data", "alerts");

  return {
    provider,
    alerts_root: alertsRoot,
    outbox_dir: path.join(alertsRoot, "outbox"),
    delivered_dir: path.join(alertsRoot, "delivered"),
    failed_dir: path.join(alertsRoot, "failed"),
    dry_run_dir: path.join(alertsRoot, "dry-run"),
    dry_run: parseBoolean(env.WIKA_NOTIFY_DRY_RUN),
    resend_api_key: ensureString(env.WIKA_NOTIFY_RESEND_API_KEY || env.RESEND_API_KEY),
    resend_timeout_ms: ensureString(env.WIKA_NOTIFY_RESEND_TIMEOUT_MS),
    email_from: ensureString(env.WIKA_NOTIFY_EMAIL_FROM),
    email_to: ensureString(env.WIKA_NOTIFY_EMAIL_TO),
    webhook_url: ensureString(env.WIKA_NOTIFY_WEBHOOK_URL),
    webhook_bearer_token: ensureString(env.WIKA_NOTIFY_WEBHOOK_BEARER_TOKEN),
    webhook_timeout_ms: ensureString(env.WIKA_NOTIFY_WEBHOOK_TIMEOUT_MS)
  };
}

export function buildWikaNotificationPreview(alert) {
  return {
    subject: buildSubject(alert),
    text: buildTextBody(alert)
  };
}

export function getWikaNotifierRuntime(env = process.env, cwd = process.cwd()) {
  const config = getWikaNotifierConfig(env, cwd);
  const providerState = buildProviderState(config);

  return {
    config: {
      provider: config.provider,
      alerts_root: config.alerts_root,
      dry_run: config.dry_run
    },
    provider_state: providerState
  };
}

export async function notifyWikaAlert(alert, options = {}) {
  const env = options.env ?? process.env;
  const cwd = options.cwd ?? process.cwd();
  const config = getWikaNotifierConfig(env, cwd);
  const providerState = buildProviderState(config);
  const preview = buildWikaNotificationPreview(alert);
  const dryRun = typeof options.dryRun === "boolean" ? options.dryRun : config.dry_run;
  const notificationId = crypto.randomUUID();
  const basePayload = {
    notification_id: notificationId,
    processed_at: new Date().toISOString(),
    provider: config.provider,
    dry_run: dryRun,
    provider_state: providerState,
    preview,
    alert
  };

  if (config.provider === "none") {
    const recordPath = await writeAlertRecord(config.outbox_dir, {
      ...basePayload,
      delivery_mode: "fallback_outbox",
      provider_error_code: "provider_not_configured",
      provider_error: "No formal notification provider configured."
    });

    return {
      ok: true,
      provider: "none",
      dry_run: dryRun,
      fallback_used: true,
      record_path: recordPath,
      provider_error_code: "provider_not_configured"
    };
  }

  if (!providerState.configured) {
    const recordPath = await writeAlertRecord(config.outbox_dir, {
      ...basePayload,
      delivery_mode: "fallback_outbox",
      provider_error_code: "provider_configuration_error",
      provider_error: providerState.config_errors.join("; ")
    });

    return {
      ok: true,
      provider: config.provider,
      dry_run: dryRun,
      fallback_used: true,
      record_path: recordPath,
      provider_error_code: "provider_configuration_error"
    };
  }

  const request = buildProviderRequest(alert, config, preview);

  try {
    const delivery = await dispatchProvider(request, config, { dryRun });
    const targetDir = dryRun ? config.dry_run_dir : config.delivered_dir;
    const deliveryMode = dryRun ? "dry_run_preview" : "provider";
    const recordPath = await writeAlertRecord(targetDir, {
      ...basePayload,
      delivery_mode: deliveryMode,
      delivery
    });

    return {
      ok: true,
      provider: config.provider,
      dry_run: dryRun,
      fallback_used: false,
      record_path: recordPath
    };
  } catch (error) {
    const providerError = error instanceof Error ? error.message : String(error);
    const failedRecordPath = await writeAlertRecord(config.failed_dir, {
      ...basePayload,
      delivery_mode: "provider_failed",
      provider_error_code: "provider_delivery_error",
      provider_error: providerError
    });
    const recordPath = await writeAlertRecord(config.outbox_dir, {
      ...basePayload,
      delivery_mode: "fallback_outbox",
      provider_error_code: "provider_delivery_error",
      provider_error: providerError
    });

    return {
      ok: true,
      provider: config.provider,
      dry_run: dryRun,
      fallback_used: true,
      record_path: recordPath,
      failed_record_path: failedRecordPath,
      provider_error_code: "provider_delivery_error"
    };
  }
}
