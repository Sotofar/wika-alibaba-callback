# XD API Coverage

更新时间：2026-04-18

## 当前总状态

- 当前 XD access 线已进入 `safe-scope complete`。
- `remaining_route_gap_count = 0`
- `remaining_candidate_unresolved_count = 0`
- 当前矩阵口径下不存在“空白 / 待确认 / 下轮再看”的 XD access 条目。
- stage31 已把 safe-scope 转成现实可用产物：
  - `XD_PERMISSION_AND_CAPABILITY_LEDGER_STAGE31.md`
  - `XD_WEEKLY_OPERATIONS_REPORT_STAGE31.md`
  - `scripts/generate-xd-operations-report-stage31.js`
  - `scripts/check-xd-critical-routes-stage31.js`

## route 覆盖

- parity route 总数：27
- `RECONFIRMED_XD`：8
- `ROUTE_BOUND_AND_PASSED`：15
- `ROUTE_BOUND_NO_DATA`：1
- `TENANT_OR_PRODUCT_RESTRICTION`：1
- `WRITE_ADJACENT_SKIPPED`：2
- `DOC_MISMATCH`：0

## direct-method / candidate 覆盖

### `PASSED`
- `alibaba.seller.order.get`
- `alibaba.seller.order.fund.get`
- `alibaba.seller.order.logistics.get`
- `alibaba.mydata.overview.date.get`
- `alibaba.mydata.self.product.date.get`
- `alibaba.icbu.product.type.available.get`

### `NO_DATA`
- `alibaba.mydata.overview.industry.get`
- `alibaba.mydata.overview.indicator.basic.get`
- `alibaba.mydata.self.product.get`

### `TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED`
- `alibaba.mydata.self.keyword.effect.week.get`
- `alibaba.mydata.industry.keyword.get`
- `alibaba.seller.trade.decode`
- `alibaba.mydata.self.keyword.date.get`
- `alibaba.mydata.self.keyword.effect.month.get`
- `alibaba.mydata.seller.opendata.getconkeyword`

## 已完成对象

### stage27 已补齐且持续健康的 route
- `products/detail`
- `products/groups`
- `products/score`
- `orders/fund`
- `orders/logistics`

### stage28 已完成的 readonly family
- `categories/tree`
- `categories/attributes`
- `products/schema`
- `products/schema/render`
- `media/list`
- `media/groups`
- `orders/draft-types`
- `reports/products/minimal-diagnostic`
- `reports/orders/minimal-diagnostic`
- `reports/operations/minimal-diagnostic`

### stage29 已完成的 candidate closure
- keyword family 两项已经越过 `properties` 参数层，最终收口为对象级 restriction confirmed。
- `seller.trade.decode` 与其余 keyword 相关对象也已冻结为 restriction confirmed。

## 当前冻结边界

- `/integrations/alibaba/xd/data/customers/list`：`TENANT_OR_PRODUCT_RESTRICTION`
- `/integrations/alibaba/xd/data/products/schema/render/draft`：`ROUTE_BOUND_NO_DATA`
- `/integrations/alibaba/xd/tools/reply-draft`：`WRITE_ADJACENT_SKIPPED`
- `/integrations/alibaba/xd/tools/order-draft`：`WRITE_ADJACENT_SKIPPED`
- candidate pool 6 项：全部冻结为 `TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED`

## stage31 产品化状态

- 文件化周报资产已落盘，可直接生成 XD 周报草稿。
- 报告生成脚本支持：
  - `--mode=daily`
  - `--mode=weekly`
  - `--from-evidence`
  - `--dry-run`
- 关键 route 巡检脚本已落盘，可做当前 safe-scope 的日常保活与回归。
- `orders/summary|trend|report-consumers` 当前 production 未绑定；stage31 明确改为文件化报告资产 + minimal-diagnostic 辅助信号，不回头扩 route。

## 当前固定结论

- 在当前已拿到权限、当前 safe-scope、安全只读边界和仓内证据条件下，XD 现有权限已经尽量打通并完成收口。
- 当前 Codex 的价值应从 API 打通切换到：
  - 运营报告
  - 日报 / 周报自动化
  - 关键 route 巡检
  - 能力回归
  - restriction 对象重开 gate 判断
- 若没有新的外部租户/产品级 live 证据，不应继续做同构重试。

