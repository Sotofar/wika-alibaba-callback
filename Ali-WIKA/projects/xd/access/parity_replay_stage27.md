# XD parity replay stage27

更新时间：2026-04-13

## 结论
- stage26 已判定为 `PASSED_WITH_EQUIVALENT_DATA` 的 5 条 XD route 已完成 production 绑定。
- 本轮只补 route 注册，不扩业务范围，不重跑 stage26 全量 parity replay。
- production base 继续 `PASS_BASE`，新 route 首次通过后又做了一轮最小回归，结果稳定。

## 本轮补齐的 5 条 route
- `/integrations/alibaba/xd/data/products/detail`
  - 参数契约：`product_id`
  - 结果：`ROUTE_BOUND_AND_PASSED`
- `/integrations/alibaba/xd/data/products/groups`
  - 参数契约：`group_id`
  - 结果：`ROUTE_BOUND_AND_PASSED`
- `/integrations/alibaba/xd/data/products/score`
  - 参数契约：`product_id`
  - 结果：`ROUTE_BOUND_AND_PASSED`
- `/integrations/alibaba/xd/data/orders/fund`
  - 参数契约：`e_trade_id,data_select`
  - 结果：`ROUTE_BOUND_AND_PASSED`
- `/integrations/alibaba/xd/data/orders/logistics`
  - 参数契约：`e_trade_id,data_select`
  - 结果：`ROUTE_BOUND_AND_PASSED`

## 最小验证
- base canary：
  - `/health` -> `200`
  - `/integrations/alibaba/xd/auth/debug` -> `200`
  - `/integrations/alibaba/xd/data/products/list?page_size=1` -> `200`
  - `/integrations/alibaba/xd/data/orders/list?page_size=1` -> `200`
- live sample 来源：
  - `products/list` 首条样本提供 `product_id + group_id`
  - `orders/list` 首条样本提供 `trade_id`
- 5 条新 route 首次验证全部 `200 + JSON`
- 5 条新 route 回归复跑全部继续 `200 + JSON`
- sanity control：
  - `/integrations/alibaba/xd/data/orders/list?page_size=1` -> `200`

## 当前矩阵状态
- `RECONFIRMED_XD`: 8
- `ROUTE_BOUND_AND_PASSED`: 5
- `DOC_MISMATCH`: 14

## 边界
- 本轮没有扩到 categories / media / customers / draft-types / minimal-diagnostic / tools。
- 本轮没有重开候选池泛化探索。
- 本轮没有把单 route 的成功误写成“XD parity 全部完成”。
- 剩余 parity gap 仍是 stage26 已记录的 14 条 `DOC_MISMATCH` route。
