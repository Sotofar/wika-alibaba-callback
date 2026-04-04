import fs from "node:fs";
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
  notifyWikaAlert
} from "../shared/data/modules/wika-notifier.js";

const GRAPHQL_URL = "https://backboard.railway.com/graphql/v2";
const PROJECT_ID = "7cc408fd-c2a3-403c-9b4e-adaa72a9a712";
const ENVIRONMENT_ID = "4afccea8-ada6-42d5-9bd7-0f73cca404dc";
const SERVICE_ID = "d7abfb5c-25c6-478c-a51a-69d85151127a";
const RAILWAY_TOKEN_PATH = path.join(os.tmpdir(), "railway-cli-token.txt");
const STAGE_NAME = "阶段 8：任务 6 的正式通知闭环";

function readRailwayToken() {
  if (!fs.existsSync(RAILWAY_TOKEN_PATH)) {
    return null;
  }

  return fs.readFileSync(RAILWAY_TOKEN_PATH, "utf8").trim() || null;
}

async function queryRailwayVariables(railwayToken) {
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${railwayToken}`
    },
    body: JSON.stringify({
      query:
        "query($projectId:String!,$environmentId:String!,$serviceId:String!){ variables(projectId:$projectId,environmentId:$environmentId,serviceId:$serviceId) }",
      variables: {
        projectId: PROJECT_ID,
        environmentId: ENVIRONMENT_ID,
        serviceId: SERVICE_ID
      }
    })
  });

  const payload = await response.json();
  if (payload?.errors?.length) {
    throw new Error(JSON.stringify(payload.errors));
  }

  return payload?.data?.variables ?? {};
}

async function loadProductionNotificationVariableNames() {
  const railwayToken = readRailwayToken();
  if (!railwayToken) {
    return {
      available: false,
      reason: "railway_temp_token_missing",
      matched_variable_names: []
    };
  }

  try {
    const variables = await queryRailwayVariables(railwayToken);
    const matched = Object.keys(variables).filter((key) =>
      /MAIL|SMTP|WEBHOOK|RESEND|SENDGRID|MAILGUN|SLACK|TELEGRAM|WECHAT|FEISHU|LARK|NOTIFY|ALERT/i.test(
        key
      )
    );

    return {
      available: true,
      reason: null,
      matched_variable_names: matched.sort()
    };
  } catch (error) {
    return {
      available: false,
      reason: error instanceof Error ? error.message : String(error),
      matched_variable_names: []
    };
  }
}

async function main() {
  const productionEnvAudit = await loadProductionNotificationVariableNames();

  const permissionBlockedAlert = buildWikaPermissionBlockedAlert({
    stageName: STAGE_NAME,
    relatedApis: ["alibaba.mydata.overview.indicator.basic.get"],
    relatedModules: ["store_metrics"],
    evidence: [
      "production 实测返回 InsufficientPermission",
      "当前 mydata / overview 路线已收口为权限 / 能力阻塞"
    ],
    userNeeds: ["如需继续，需平台或应用侧补齐权限"],
    suggestedNextSteps: [
      "维持当前主线停止，不再循环 mydata 权限验证",
      "若业务必须用到该指标，需人工确认是否申请权限"
    ],
    inputSummary: {
      api_family: "mydata_overview",
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
    suggestedNextSteps: [
      "当前只保留文档收口，不新增读侧路由",
      "若业务继续要求该能力，需人工提供新的官方方法证据"
    ],
    inputSummary: {
      missing_entry_scope: "task_4",
      excluded_write_actions: true
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
    userNeeds: ["继续前需拿到官方明确的可审计 / 可删除 / 可回滚证据"],
    suggestedNextSteps: [
      "继续停在 schema-aware 草稿生成层",
      "不要进入真实 draft 创建验证"
    ],
    inputSummary: {
      api_family: "product_draft",
      risk_scope: "task_3"
    }
  });

  const alerts = [permissionBlockedAlert, noEntryAlert, writeBoundaryAlert];
  const notifierConfig = getWikaNotifierConfig(process.env, process.cwd());
  const deliveries = [];

  for (const alert of alerts.slice(0, 2)) {
    const delivery = await notifyWikaAlert(alert, {
      env: process.env,
      cwd: process.cwd()
    });

    deliveries.push({
      category: alert.blocker_category.code,
      provider: delivery.provider,
      fallback_used: delivery.fallback_used,
      record_path: delivery.record_path
    });
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        stage_name: STAGE_NAME,
        notifier_config: {
          provider: notifierConfig.provider,
          alerts_root: notifierConfig.alerts_root,
          email_from: notifierConfig.email_from ? "[configured]" : null,
          email_to: notifierConfig.email_to ? "[configured]" : null,
          webhook_url: notifierConfig.webhook_url ? "[configured]" : null
        },
        production_env_audit: productionEnvAudit,
        preview_subjects: alerts.map((alert) => buildWikaNotificationPreview(alert).subject),
        deliveries,
        additional_sample_only_alert: writeBoundaryAlert
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
