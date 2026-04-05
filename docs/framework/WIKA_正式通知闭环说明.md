# WIKA_正式通知闭环说明

更新时间：2026-04-05

## 一句话结论

`WIKA` 当前已经形成：

- provider-agnostic notifier
- webhook / Resend 预接线
- outbox fallback
- dry-run 审计路径

因此当前准确状态应描述为：

- **真实 provider 已接好到代码结构层**
- **真实通知送达仍未被证明**

## 当前责任边界

### 1. alert 标准化

由：

- `shared/data/modules/wika-alerts.js`

负责。

统一输出：

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

### 2. provider 选择与 fallback

由：

- `shared/data/modules/wika-notifier.js`

负责。

当前支持：

- `none`
- `webhook`
- `resend`

配置来源：

- `WIKA_NOTIFY_PROVIDER`
- 以及对应 provider 的环境变量

当前行为：

1. `provider=none`
   - 直接走 `outbox fallback`
2. `provider` 已选择但配置不完整
   - 记录 `provider_configuration_error`
   - 仍然走 `outbox fallback`
3. `provider` 已配置且 `dry_run=true`
   - 不真实外发
   - 写入 `data/alerts/dry-run`
4. `provider` 已配置且真实发送失败
   - 失败记录写入 `data/alerts/failed`
   - 同时退回 `data/alerts/outbox`

### 3. provider 适配层

当前 provider 适配层已经拆开：

- `shared/data/modules/wika-notifier-webhook.js`
- `shared/data/modules/wika-notifier-resend.js`

职责是：

- provider 配置校验
- provider 请求预览
- provider dry-run 输出
- provider 真实发送

## 当前目录结构

通知相关审计路径：

- `data/alerts/outbox`
- `data/alerts/delivered`
- `data/alerts/failed`
- `data/alerts/dry-run`

它们的含义分别是：

- `outbox`
  - 没有 provider
  - provider 配置不完整
  - provider 发送失败后的 fallback
- `delivered`
  - 真实 provider 调用成功
- `failed`
  - 真实 provider 调用失败
- `dry-run`
  - 只做预接线与 payload 预览，不做真实外发

## 本轮 dry-run 验证结果

验证脚本：

- `scripts/validate-wika-notification-phase12.js`

本轮至少覆盖了 3 类场景：

1. `provider=none`
   - 成功走到 `outbox fallback`
2. `provider=webhook` 但配置不完整
   - 明确返回 `provider_configuration_error`
   - 同时仍然落到 `outbox fallback`
3. `provider=webhook` 且配置完整，但 `dry_run=true`
   - 成功输出 dry-run 结果
   - 未真实外发
   - 记录写入 `dry-run`

本轮还额外验证了：

4. `provider=resend` 且配置完整，但 `dry_run=true`
   - 成功输出 dry-run 结果
   - 未真实外发
   - 记录写入 `dry-run`

## 这轮能证明什么

当前已经能证明：

1. notifier 结构已经支持真实 provider
2. provider 选择可以配置驱动
3. provider 配置错误可以被明确分类
4. payload 组装可以在 dry-run 下被审计
5. provider 不可用时 fallback 不会丢失告警
6. provider 失败路径具备可审计记录

## 这轮还不能证明什么

当前还不能证明：

1. 真实 webhook 已经送达外部系统
2. 真实 Resend 邮件已经送达用户邮箱
3. 真实 provider 在 production 环境中已经完成配置

因此当前不允许写成：

- “真实通知已送达”
- “邮件已成功发出”
- “webhook 已成功推送到外部系统”

## 当前最小正式通知闭环定义

当前可成立的最小闭环是：

- 触发
- 生成结构化 alert
- provider 选择
- 分发或可审计落盘

所以当前准确结论是：

- **最小正式通知闭环已成立**
- **真实 provider 外发仍待 production 配置与真实送达验证**

## 当前推荐下一步

如果后续继续任务 6，唯一推荐动作是：

- 在 Railway production 配置一个用户可控的真实 provider
  - 优先 `webhook`
  - 其次 `Resend`

然后只做一次最小、显式标注 `TEST / DO-NOT-USE` 的真实送达验证。
