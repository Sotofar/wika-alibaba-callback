import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

function ensureString(value) {
  return String(value ?? "").trim();
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

function getNotifierProvider(env = process.env) {
  const forced = ensureString(env.WIKA_NOTIFY_PROVIDER).toLowerCase();

  if (forced === "webhook") {
    return "webhook";
  }

  if (forced === "resend") {
    return "resend";
  }

  if (forced === "outbox") {
    return "outbox";
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

  return "outbox";
}

export function getWikaNotifierConfig(env = process.env, cwd = process.cwd()) {
  const provider = getNotifierProvider(env);
  const alertsRoot =
    ensureString(env.WIKA_NOTIFY_ALERTS_ROOT) ||
    path.resolve(cwd, "data", "alerts");

  return {
    provider,
    alerts_root: alertsRoot,
    outbox_dir: path.join(alertsRoot, "outbox"),
    delivered_dir: path.join(alertsRoot, "delivered"),
    failed_dir: path.join(alertsRoot, "failed"),
    resend_api_key: ensureString(env.WIKA_NOTIFY_RESEND_API_KEY || env.RESEND_API_KEY),
    email_from: ensureString(env.WIKA_NOTIFY_EMAIL_FROM),
    email_to: ensureString(env.WIKA_NOTIFY_EMAIL_TO),
    webhook_url: ensureString(env.WIKA_NOTIFY_WEBHOOK_URL),
    webhook_bearer_token: ensureString(env.WIKA_NOTIFY_WEBHOOK_BEARER_TOKEN)
  };
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

async function sendViaWebhook(alert, config) {
  const headers = {
    "Content-Type": "application/json"
  };

  if (config.webhook_bearer_token) {
    headers.Authorization = `Bearer ${config.webhook_bearer_token}`;
  }

  const response = await fetch(config.webhook_url, {
    method: "POST",
    headers,
    body: JSON.stringify(alert)
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Webhook delivery failed (${response.status}): ${text || "empty body"}`);
  }

  return {
    provider: "webhook",
    status: response.status,
    response_text: text
  };
}

async function sendViaResend(alert, config) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.resend_api_key}`
    },
    body: JSON.stringify({
      from: config.email_from,
      to: [config.email_to],
      subject: buildSubject(alert),
      text: buildTextBody(alert)
    })
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Resend delivery failed (${response.status}): ${text || "empty body"}`);
  }

  return {
    provider: "resend",
    status: response.status,
    response_text: text
  };
}

export async function notifyWikaAlert(alert, options = {}) {
  const env = options.env ?? process.env;
  const cwd = options.cwd ?? process.cwd();
  const config = getWikaNotifierConfig(env, cwd);
  const provider = config.provider;
  const notificationId = crypto.randomUUID();
  const basePayload = {
    notification_id: notificationId,
    delivered_at: new Date().toISOString(),
    provider,
    alert
  };

  if (provider === "webhook") {
    try {
      const delivery = await sendViaWebhook(alert, config);
      const recordPath = await writeAlertRecord(config.delivered_dir, {
        ...basePayload,
        delivery_mode: "provider",
        delivery
      });

      return {
        ok: true,
        provider,
        fallback_used: false,
        record_path: recordPath
      };
    } catch (error) {
      const recordPath = await writeAlertRecord(config.outbox_dir, {
        ...basePayload,
        delivery_mode: "fallback_outbox",
        provider_error: error instanceof Error ? error.message : String(error)
      });

      return {
        ok: true,
        provider,
        fallback_used: true,
        record_path: recordPath
      };
    }
  }

  if (provider === "resend") {
    try {
      const delivery = await sendViaResend(alert, config);
      const recordPath = await writeAlertRecord(config.delivered_dir, {
        ...basePayload,
        delivery_mode: "provider",
        delivery
      });

      return {
        ok: true,
        provider,
        fallback_used: false,
        record_path: recordPath
      };
    } catch (error) {
      const recordPath = await writeAlertRecord(config.outbox_dir, {
        ...basePayload,
        delivery_mode: "fallback_outbox",
        provider_error: error instanceof Error ? error.message : String(error)
      });

      return {
        ok: true,
        provider,
        fallback_used: true,
        record_path: recordPath
      };
    }
  }

  const recordPath = await writeAlertRecord(config.outbox_dir, {
    ...basePayload,
    delivery_mode: "fallback_outbox",
    provider_error: "No formal notification provider configured."
  });

  return {
    ok: true,
    provider: "outbox",
    fallback_used: true,
    record_path: recordPath
  };
}

export function buildWikaNotificationPreview(alert) {
  return {
    subject: buildSubject(alert),
    text: buildTextBody(alert)
  };
}
