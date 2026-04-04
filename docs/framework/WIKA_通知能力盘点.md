# WIKA_通知能力盘点

更新时间：2026-04-05

## 盘点范围

本轮只盘点 `WIKA` 当前仓库、`.env.example`、本地环境痕迹，以及 Railway production 变量名里是否已经存在可复用的正式通知链路。

## 盘点结果

### 1. 仓库依赖与代码

- `package.json` 当前只有：
  - `express`
- 仓库里没有现成的：
  - SMTP 发送模块
  - `nodemailer`
  - `sendgrid`
  - `mailgun`
  - `resend`
  - Slack / Telegram / 飞书 / 企业微信 / webhook 通知模块
- 当前仓库里与通知最接近的已有资产是：
  - `shared/data/modules/alibaba-write-guardrails.js`
  - `docs/framework/WIKA_人工接管规则.md`
  - `docs/framework/WIKA_人工接管告警样例.json`

结论：

- 当前仓库**没有现成可复用的正式通知链路**
- 但已经有可复用的阻塞分类、人工接管规则和结构化告警对象基础

### 2. 配置与环境变量约定

#### 现有 `.env.example`

盘点前：

- 没有任何通知 provider 配置约定

本轮新增了最小通知配置约定：

- `WIKA_NOTIFY_PROVIDER`
- `WIKA_NOTIFY_WEBHOOK_URL`
- `WIKA_NOTIFY_WEBHOOK_BEARER_TOKEN`
- `WIKA_NOTIFY_RESEND_API_KEY`
- `WIKA_NOTIFY_EMAIL_FROM`
- `WIKA_NOTIFY_EMAIL_TO`

这些变量都是**可选项**。

如果都未配置，系统默认走：

- `./data/alerts/outbox`

作为可审计 fallback。

### 3. Railway production 变量名盘点

本轮通过已有 Railway GraphQL token 只读取了**变量名**，没有输出任何敏感值。

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

- 当前 production 变量名匹配结果为空

这说明当前 production 环境里**没有现成的通知 provider 配置痕迹**。

## 盘点结论

当前结论必须收口为：

**当前无正式通知依赖，需先落地 provider-agnostic 通知模块 + fallback。**

## 为什么选这个结论

1. 仓库里没有现成 mail/webhook 依赖
2. `.env.example` 之前没有通知配置约定
3. Railway production 变量名里没有通知 provider 痕迹
4. 当前项目已经有足够的阻塞分类与结构化告警基础，适合先补一个轻量、可扩展、可退化的通知层

## 本轮落地策略

本轮因此采用：

- provider-agnostic notifier
- 可选 provider：
  - `webhook`
  - `resend`
- 默认 fallback：
  - `data/alerts/outbox`

## 当前不做的事

- 不新引入沉重依赖
- 不强行接 SMTP
- 不因为没有正式 provider 就让告警消失
- 不把 outbox fallback 误写成“真实邮件已发出”
