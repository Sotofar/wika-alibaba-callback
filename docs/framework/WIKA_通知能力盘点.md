# WIKA_通知能力盘点

更新时间：2026-04-05

## 盘点范围

本轮只盘点 `WIKA` 当前仓库、`.env.example`、通知模块代码以及 Railway production 变量名里是否已有可复用的正式通知链路。

## 盘点结果

### 1. 仓库依赖与代码

- `package.json` 当前仍只有：
  - `express`
- 仓库里仍然没有现成的重型通知依赖：
  - `nodemailer`
  - `sendgrid`
  - `mailgun`
  - Slack / Telegram / 飞书 / 企业微信 SDK
- 当前已经落地的轻量通知资产包括：
  - `shared/data/modules/wika-alerts.js`
  - `shared/data/modules/wika-notifier.js`
  - `shared/data/modules/wika-notifier-webhook.js`
  - `shared/data/modules/wika-notifier-resend.js`

结论：

- 当前仓库**没有现成可复用的正式通知 provider 配置**
- 但当前仓库**已经具备可复用的轻量通知适配层**

### 2. 配置与环境变量约定

当前 `.env.example` 已明确通知相关配置约定：

- `WIKA_NOTIFY_PROVIDER=none|webhook|resend`
- `WIKA_NOTIFY_DRY_RUN`
- `WIKA_NOTIFY_ALERTS_ROOT`
- `WIKA_NOTIFY_WEBHOOK_URL`
- `WIKA_NOTIFY_WEBHOOK_BEARER_TOKEN`
- `WIKA_NOTIFY_WEBHOOK_TIMEOUT_MS`
- `WIKA_NOTIFY_RESEND_API_KEY`
- `WIKA_NOTIFY_RESEND_TIMEOUT_MS`
- `WIKA_NOTIFY_EMAIL_FROM`
- `WIKA_NOTIFY_EMAIL_TO`

这些变量都仍是**可选项**。

若 provider 未配置、配置不完整或调用失败，系统会退回：

- `data/alerts/outbox`

若 provider 进入 dry-run，则会写入：

- `data/alerts/dry-run`

若 provider 真正调用失败，则还会保留：

- `data/alerts/failed`

### 3. Railway production 变量名盘点

本轮继续只读取 **变量名**，不输出任何敏感值。

按以下关键词筛查：

- `MAIL`
- `SMTP`
- `WEBHOOK`
- `RESEND`
- `SENDGRID`
- `MAILGUN`
- `SLACK`
- `TELEGRAM`
- `WECHAT`
- `FEISHU`
- `LARK`
- `NOTIFY`
- `ALERT`

结果：

- 当前 production 变量名匹配结果仍为空

这说明当前 production 环境里：

- **还没有现成的正式通知 provider 配置痕迹**

## 阶段 13 收口

本轮继续检查了两层真实配置来源：

1. 当前 shell 环境中的 `WIKA_NOTIFY_*`
2. Railway production 中的 `WIKA_NOTIFY_*`

结果都是：

- 没有配置
- 没有可用的真实 destination

## 盘点结论

当前结论必须收口为：

**没有真实 provider 配置，也没有可证明可控的真实测试目标；当前只能保留“轻量预接线 + dry-run + fallback”。**

## 为什么选这个结论

1. production 环境里仍没有现成 provider 配置
2. 仓库仍没有重型通知依赖
3. 当前已经有：
   - provider-agnostic notifier
   - webhook adapter
   - resend adapter
   - outbox / failed / dry-run 审计落盘
4. 因此当前最合理状态不是“尚无通知基础”，而是：
   - **真实 provider 还没配**
   - **但预接线已经做好**

## 当前可复用通知链路

当前 notifier 责任边界已经清晰：

1. `wika-alerts.js`
   - 负责 alert 标准化
2. `wika-notifier.js`
   - 负责 provider 选择
   - 负责配置检查
   - 负责 fallback 落盘
3. `wika-notifier-webhook.js`
   - 负责 webhook 请求预览与发送
4. `wika-notifier-resend.js`
   - 负责 Resend 请求预览与发送

## 当前仍不做的事

- 不把 provider 代码已接好写成“真实通知已送达”
- 不因为有 dry-run 就伪造外发成功
- 不引入 SMTP 或其他沉重依赖
- 不因为 provider 暂未配置就让告警消失
