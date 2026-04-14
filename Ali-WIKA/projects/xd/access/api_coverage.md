# XD API coverage

更新时间：2026-04-14

## 当前总状态
- 当前 XD access 线已进入 `safe-scope complete`。
- route parity gap：`0`
- candidate pool 未决：`0`
- 当前矩阵口径下不存在“空白 / 待确认 / 下轮再看”条目。

## route 覆盖
- parity route 总数：27
- `RECONFIRMED_XD`：8
- `ROUTE_BOUND_AND_PASSED`：15
- `ROUTE_BOUND_NO_DATA`：1
- `TENANT_OR_PRODUCT_RESTRICTION`：1
- `WRITE_ADJACENT_SKIPPED`：2
- `DOC_MISMATCH`：0

## direct-method / candidate 覆盖
- `PASSED`
  - `alibaba.seller.order.get`
  - `alibaba.seller.order.fund.get`
  - `alibaba.seller.order.logistics.get`
  - `alibaba.mydata.overview.date.get`
  - `alibaba.mydata.self.product.date.get`
  - `alibaba.icbu.product.type.available.get`
- `NO_DATA`
  - `alibaba.mydata.overview.industry.get`
  - `alibaba.mydata.overview.indicator.basic.get`
  - `alibaba.mydata.self.product.get`
- `TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED`
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
- keyword family 两项已经越过 `properties` 参数层，最终收口为对象级 restriction。
- 其余 4 项 candidate 也已冻结为对象级 restriction confirmed。

## 当前冻结边界
- `/integrations/alibaba/xd/data/customers/list`：`TENANT_OR_PRODUCT_RESTRICTION`
- `/integrations/alibaba/xd/data/products/schema/render/draft`：`ROUTE_BOUND_NO_DATA`
- `/integrations/alibaba/xd/tools/reply-draft`：`WRITE_ADJACENT_SKIPPED`
- `/integrations/alibaba/xd/tools/order-draft`：`WRITE_ADJACENT_SKIPPED`
- candidate pool 6 项：全部已冻结为 `TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED`

## stage30 final freeze
- 当前 safe-scope 已正式封板。
- 当前不再存在仓内可继续推进的 route parity 或 candidate closure 任务。
- 后续若要重开，只接受新的外部租户/产品级 live 证据、官方文档变更或新的真实对象样本。
