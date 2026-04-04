# WIKA_正式通知闭环说明

更新时间：2026-04-05

## 一句话结论

`WIKA` 当前已经形成**最小正式通知闭环**：

- 触发阻塞
- 生成结构化告警
- 尝试分发
- 若无 provider，则可审计落盘到 outbox

当前 production 尚未配置真实邮件或 webhook provider，因此默认走：

- `data/alerts/outbox`

这代表：

- **最小正式通知闭环已成立**
- 但**真实外发通知还没有接通**

## 闭环结构

### 1. 触发层

本轮对接的阻塞类型包括：

1. 权限阻塞
2. 无官方明确入口
3. 写侧边界不足
4. 写操作需要人工确认
5. 参数 / 样本 id 缺失

这些阻塞都可以生成统一结构的告警对象。

### 2. 结构化告警层

统一告警对象由：

- `shared/data/modules/wika-alerts.js`

负责生成。

告警对象至少包含：

- `stage_name`
- `blocker_category`
- `triggered_at`
- `related_apis`
- `related_modules`
- `current_evidence`
- `cannot_continue_reason`
- `user_needs`
- `suggested_next_steps`
- `allow_human_handoff`
- `human_handoff`

### 3. 通知动作层

通知动作由：

- `shared/data/modules/wika-notifier.js`

负责执行。

当前支持 3 种模式：

1. `webhook`
2. `resend`
3. `outbox`

优先级：

1. 若 `WIKA_NOTIFY_PROVIDER=webhook`，并配置 `WIKA_NOTIFY_WEBHOOK_URL`，则走 webhook
2. 若 `WIKA_NOTIFY_PROVIDER=resend`，并配置：
   - `WIKA_NOTIFY_RESEND_API_KEY`
   - `WIKA_NOTIFY_EMAIL_FROM`
   - `WIKA_NOTIFY_EMAIL_TO`
   则走 resend
3. 若都没有，则默认走 `outbox`

### 4. fallback 层

无论 provider 不可用还是未配置，都不会吞掉告警。

系统会把结构化结果写入：

- `data/alerts/outbox`

如果后续真实 provider 接通并发送成功，则会写入：

- `data/alerts/delivered`

## 本轮验证结果

本轮使用脚本：

- `scripts/validate-wika-notification-phase8.js`

模拟了至少 2 个真实阻塞场景：

1. 权限阻塞
   - `alibaba.mydata.overview.indicator.basic.get`
2. 无官方明确入口
   - `inquiries / messages`

并额外生成了一个“写侧边界不足”样例：

- `alibaba.icbu.product.add.draft`

本轮真实结果：

- provider 检测结果：`outbox`
- production 变量名中没有通知 provider 痕迹
- 两个真实阻塞场景都成功生成结构化告警
- 两个告警都成功落盘到 outbox

## 当前样例路径

运行脚本后，当前可审计 outbox 产物位于：

- `data/alerts/outbox/*.json`

结构化样例文档位于：

- `docs/framework/WIKA_正式通知样例.json`

## 这轮能证明什么

当前已经能证明：

1. 阻塞可以被标准化分类
2. 阻塞可以被转成统一告警对象
3. 告警对象可以被通知模块处理
4. 在没有 provider 的情况下，告警不会消失，而是会被可审计落盘

## 这轮还不能证明什么

当前还不能证明：

1. 真实邮件已经发出
2. 真实 webhook 已经送达外部系统
3. 用户已经在外部渠道收到通知

因此当前准确状态应描述为：

- **最小正式通知闭环已成立**
- **当前默认走 outbox fallback**
- **真实外发通知仍待 provider 配置**

## 当前推荐配置方式

如果后续要把 fallback 升级成真实外发，优先顺序建议为：

1. 配置一个低风险 webhook
2. 或配置 Resend 邮件

不建议当前为了通知能力引入：

- 重 SMTP 依赖
- 复杂消息总线
- 额外数据库

## 当前一句话收口

当前项目已经不再停留在“只有 json 样例”的状态，而是具备：

**触发 -> 生成 -> 分发或可审计落盘**

的正式通知闭环；只是当前默认分发路径是 `outbox fallback`，不是外部邮件或 webhook。
