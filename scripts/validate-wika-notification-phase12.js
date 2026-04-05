import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  buildWikaNoEntryAlert,
  buildWikaPermissionBlockedAlert,
  buildWikaWriteBoundaryAlert
} from "../shared/data/modules/wika-alerts.js";
import {
  buildWikaNotificationPreview,
  getWikaNotifierConfig,
  getWikaNotifierRuntime,
  notifyWikaAlert
} from "../shared/data/modules/wika-notifier.js";

const STAGE_NAME = "阶段 12：任务 6 的真实 provider 预接线与 dry-run 验证";

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function runScenario(name, alert, env) {
  const cwd = process.cwd();
  const config = getWikaNotifierConfig(env, cwd);
  const runtime = getWikaNotifierRuntime(env, cwd);
  const delivery = await notifyWikaAlert(alert, {
    env,
    cwd
  });
  const record = await readJson(delivery.record_path);
  const failedRecord = delivery.failed_record_path
    ? await readJson(delivery.failed_record_path)
    : null;

  return {
    name,
    config: {
      provider: config.provider,
      dry_run: config.dry_run,
      alerts_root: config.alerts_root
    },
    runtime,
    delivery: {
      provider: delivery.provider,
      dry_run: delivery.dry_run,
      fallback_used: delivery.fallback_used,
      provider_error_code: delivery.provider_error_code ?? null,
      record_path: delivery.record_path,
      failed_record_path: delivery.failed_record_path ?? null
    },
    record: {
      delivery_mode: record.delivery_mode,
      provider_error_code: record.provider_error_code ?? null,
      provider_error: record.provider_error ?? null,
      provider_state: record.provider_state ?? null,
      preview_subject: record.preview?.subject ?? null
    },
    failed_record: failedRecord
      ? {
          delivery_mode: failedRecord.delivery_mode,
          provider_error_code: failedRecord.provider_error_code ?? null
        }
      : null
  };
}

async function main() {
  const alertsRoot = await fs.mkdtemp(path.join(os.tmpdir(), "wika-notifier-phase12-"));
  const permissionAlert = buildWikaPermissionBlockedAlert({
    stageName: STAGE_NAME,
    relatedApis: ["alibaba.mydata.overview.indicator.basic.get"],
    relatedModules: ["task_1_and_task_2"],
    evidence: [
      "production 实测返回 InsufficientPermission",
      "当前 mydata 路线已收口为权限/能力阻塞"
    ],
    userNeeds: ["如需继续，需平台或应用侧补齐权限"],
    suggestedNextSteps: ["维持当前主线停止，不再循环 mydata 权限验证"],
    inputSummary: {
      blocker_scope: "task_1_and_task_2"
    }
  });
  const noEntryAlert = buildWikaNoEntryAlert({
    stageName: STAGE_NAME,
    relatedApis: ["inquiries", "messages"],
    relatedModules: ["task_4_read_only"],
    evidence: [
      "当前官方文档未识别到明确的 inquiry/message list/detail 读侧方法名",
      "send / reply / write / create 家族已明确排除"
    ],
    userNeeds: ["如后续出现官方明确 list/detail 方法名，再继续验证"],
    suggestedNextSteps: ["当前只保留文档收口，不新增读侧路由"],
    inputSummary: {
      blocker_scope: "task_4"
    }
  });
  const writeBoundaryAlert = buildWikaWriteBoundaryAlert({
    stageName: STAGE_NAME,
    relatedApis: ["alibaba.icbu.product.add.draft"],
    relatedModules: ["task_3_write_boundary"],
    evidence: [
      "add.draft 已过授权层",
      "当前仍无法证明其为非发布、可清理、可回滚的安全草稿模式"
    ],
    userNeeds: ["继续前需拿到官方明确的可审计/可删除/可回滚证据"],
    suggestedNextSteps: ["继续停在 schema-aware 草稿生成层"],
    inputSummary: {
      blocker_scope: "task_3"
    }
  });

  const noneEnv = {
    ...process.env,
    WIKA_NOTIFY_PROVIDER: "none",
    WIKA_NOTIFY_ALERTS_ROOT: path.join(alertsRoot, "provider-none")
  };
  const incompleteWebhookEnv = {
    ...process.env,
    WIKA_NOTIFY_PROVIDER: "webhook",
    WIKA_NOTIFY_ALERTS_ROOT: path.join(alertsRoot, "provider-webhook-incomplete")
  };
  const webhookDryRunEnv = {
    ...process.env,
    WIKA_NOTIFY_PROVIDER: "webhook",
    WIKA_NOTIFY_DRY_RUN: "true",
    WIKA_NOTIFY_WEBHOOK_URL: "https://example.invalid/wika-alerts",
    WIKA_NOTIFY_WEBHOOK_BEARER_TOKEN: "redacted-test-token",
    WIKA_NOTIFY_WEBHOOK_TIMEOUT_MS: "3500",
    WIKA_NOTIFY_ALERTS_ROOT: path.join(alertsRoot, "provider-webhook-dry-run")
  };
  const resendDryRunEnv = {
    ...process.env,
    WIKA_NOTIFY_PROVIDER: "resend",
    WIKA_NOTIFY_DRY_RUN: "true",
    WIKA_NOTIFY_RESEND_API_KEY: "re_test_123456",
    WIKA_NOTIFY_EMAIL_FROM: "alerts@example.invalid",
    WIKA_NOTIFY_EMAIL_TO: "owner@example.invalid",
    WIKA_NOTIFY_RESEND_TIMEOUT_MS: "4000",
    WIKA_NOTIFY_ALERTS_ROOT: path.join(alertsRoot, "provider-resend-dry-run")
  };

  const scenarios = [
    await runScenario("provider_none", permissionAlert, noneEnv),
    await runScenario("provider_webhook_incomplete", noEntryAlert, incompleteWebhookEnv),
    await runScenario("provider_webhook_dry_run", writeBoundaryAlert, webhookDryRunEnv),
    await runScenario("provider_resend_dry_run", permissionAlert, resendDryRunEnv)
  ];

  console.log(
    JSON.stringify(
      {
        ok: true,
        stage_name: STAGE_NAME,
        preview_examples: {
          permission_blocked: buildWikaNotificationPreview(permissionAlert),
          no_entry: buildWikaNotificationPreview(noEntryAlert)
        },
        scenarios
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
