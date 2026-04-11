# WIKA_正式通知闭环说明

更新时间：2026-04-04

## 文档定位

本文件用于说明 WIKA 在“正式通知”方向上的最小闭环边界、provider 状态落点、dry-run 验证方式与当前限制。

当前结论必须严格限定：

- 当前可以生成通知 payload、落盘记录和 dry-run 结果
- 当前不默认代表真实通知已经对外送达
- 当前不代表平台内闭环已经成立

## provider 状态目录

当前通知相关落点包括：

- `data/alerts/outbox`
- `data/alerts/delivered`
- `data/alerts/failed`
- `data/alerts/dry-run`

含义分别是：

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

## dry-run 验证结果

验证脚本：

- `WIKA/scripts/validate-wika-notification-phase12.js`

当前 dry-run 至少覆盖以下场景：

1. `provider=none`
   - 成功落到 `outbox` fallback
2. `provider=webhook` 且配置不完整
   - 返回 `provider_configuration_error`
   - 同时继续落到 `outbox` fallback
3. `provider=webhook` 且配置完整，但 `dry_run=true`
   - 输出 dry-run 结果
   - 不做真实外发
   - 记录写入 `dry-run`
4. `provider=resend` 且配置完整，但 `dry_run=true`
   - 输出 dry-run 结果
   - 不做真实外发
   - 记录写入 `dry-run`

## 当前正式通知边界

当前项目允许：

- provider 前置检查
- payload 构造
- dry-run 预演
- 失败回落
- 结构化落盘

当前项目不应误报：

- “通知已真实送达”
- “通知闭环已经稳定上线”
- “平台内操作已经闭环完成”

## 当前风险与收口原则

1. provider 配置不完整时，只能停在 fallback 或 dry-run。
2. dry-run 成功不等于真实送达成功。
3. provider 真正送达前，所有输出都必须带边界说明。
4. 当前阶段没有因为通知链路而开放任何写侧能力。
