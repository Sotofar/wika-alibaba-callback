# XD API coverage

更新时间：2026-04-13

## 当前覆盖面
- parity route 总数：27
- `RECONFIRMED_XD`：8
- `ROUTE_BOUND_AND_PASSED`：15
- `ROUTE_BOUND_NO_DATA`：1
- `TENANT_OR_PRODUCT_RESTRICTION`：1
- `WRITE_ADJACENT_SKIPPED`：2
- `DOC_MISMATCH`：0

## direct-method 覆盖
- 已稳定通过：
  - `alibaba.seller.order.get`
  - `alibaba.seller.order.fund.get`
  - `alibaba.seller.order.logistics.get`
  - `alibaba.mydata.overview.date.get`
  - `alibaba.mydata.self.product.date.get`
- 已进入可读层但当前无业务 payload：
  - `alibaba.mydata.overview.industry.get`
  - `alibaba.mydata.overview.indicator.basic.get`
  - `alibaba.mydata.self.product.get`

## stage27 已补齐且保持健康的 route
- `products/detail`
- `products/groups`
- `products/score`
- `orders/fund`
- `orders/logistics`

## stage28 连续推进结果

### Batch A
- `categories/tree` -> `ROUTE_BOUND_AND_PASSED`
- `categories/attributes` -> `ROUTE_BOUND_AND_PASSED`
- `products/schema` -> `ROUTE_BOUND_AND_PASSED`
- `products/schema/render` -> `ROUTE_BOUND_AND_PASSED`
  - 当前验证使用 `products/list` 返回的 numeric `id=1601740545697`
- `products/schema/render/draft` -> `ROUTE_BOUND_NO_DATA`
  - route 已绑定，但当前真实样本 draft schema 为空

### Batch B
- `media/list` -> `ROUTE_BOUND_AND_PASSED`
- `media/groups` -> `ROUTE_BOUND_AND_PASSED`

### Batch C
- `customers/list` -> `TENANT_OR_PRODUCT_RESTRICTION`
- `orders/draft-types` -> `ROUTE_BOUND_AND_PASSED`
- `reports/products/minimal-diagnostic` -> `ROUTE_BOUND_AND_PASSED`
- `reports/orders/minimal-diagnostic` -> `ROUTE_BOUND_AND_PASSED`
- `reports/operations/minimal-diagnostic` -> `ROUTE_BOUND_AND_PASSED`

### Batch D
- `tools/reply-draft` -> `WRITE_ADJACENT_SKIPPED`
- `tools/order-draft` -> `WRITE_ADJACENT_SKIPPED`

## 候选池 stage28
- `PASSED`
  - `alibaba.icbu.product.type.available.get`
- `PARAM_CONTRACT_MISSING`
  - `alibaba.mydata.self.keyword.effect.week.get`（当前阻塞：`properties`）
  - `alibaba.mydata.industry.keyword.get`（当前阻塞：`properties`）
- `TENANT_OR_PRODUCT_RESTRICTION`
  - `alibaba.seller.trade.decode`
  - `alibaba.mydata.self.keyword.date.get`
  - `alibaba.mydata.self.keyword.effect.month.get`
  - `alibaba.mydata.seller.opendata.getconkeyword`

## 当前剩余边界
- `customers/list` 仍停留在对象级权限/租户限制，不可扩大写成“XD 整体未开权”。
- `products/schema/render/draft` 还没有真实 draft payload，不能写成失败或完整可用。
- draft tools 仍属于 write-adjacent 范围，本轮继续排除。
- 候选池还剩 6 个未决对象，其中 2 个是参数契约缺口，4 个是对象级限制。
