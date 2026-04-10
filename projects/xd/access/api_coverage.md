# XD API 覆盖摘要

更新时间：2026-04-10

## 当前执行范围

- 只围绕 WIKA 未决队列做 XD 标准权限逐项确认
- 本轮没有做高权限盲扫
- 当前环境变量 `XD_ELEVATED_ALLOWED` = not_set

## 本轮真实执行

- XD precheck 次数：4
- XD 未决队列映射项：8
- 当前统一状态：BLOCKED_ENV

## 证据

- xd_auth_debug_round1: status=n/a classification=BLOCKED_ENV summary=exception(The operation was aborted due to timeout)
- xd_products_list_round1: status=n/a classification=BLOCKED_ENV summary=exception(The operation was aborted due to timeout)
- xd_auth_debug_round2: status=n/a classification=BLOCKED_ENV summary=exception(The operation was aborted due to timeout)
- xd_orders_list_round3: status=n/a classification=BLOCKED_ENV summary=exception(The operation was aborted due to timeout)

## 结论

- 本轮没有新增 XD 通过接口
- 本轮没有进入高权限补测
- 当前应先恢复 Railway production，再按未决队列重放 XD 标准权限验证
