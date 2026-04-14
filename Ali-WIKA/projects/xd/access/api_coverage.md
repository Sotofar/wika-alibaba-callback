# XD API coverage

更新时间：2026-04-14

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

## stage27 已补齐且持续健康的 route
- `products/detail`
- `products/groups`
- `products/score`
- `orders/fund`
- `orders/logistics`

## stage28 route 收口结果
- Batch A
  - `categories/tree` -> `ROUTE_BOUND_AND_PASSED`
  - `categories/attributes` -> `ROUTE_BOUND_AND_PASSED`
  - `products/schema` -> `ROUTE_BOUND_AND_PASSED`
  - `products/schema/render` -> `ROUTE_BOUND_AND_PASSED`
  - `products/schema/render/draft` -> `ROUTE_BOUND_NO_DATA`
- Batch B
  - `media/list` -> `ROUTE_BOUND_AND_PASSED`
  - `media/groups` -> `ROUTE_BOUND_AND_PASSED`
- Batch C
  - `customers/list` -> `TENANT_OR_PRODUCT_RESTRICTION`
  - `orders/draft-types` -> `ROUTE_BOUND_AND_PASSED`
  - `reports/products/minimal-diagnostic` -> `ROUTE_BOUND_AND_PASSED`
  - `reports/orders/minimal-diagnostic` -> `ROUTE_BOUND_AND_PASSED`
  - `reports/operations/minimal-diagnostic` -> `ROUTE_BOUND_AND_PASSED`
- Batch D
  - `tools/reply-draft` -> `WRITE_ADJACENT_SKIPPED`
  - `tools/order-draft` -> `WRITE_ADJACENT_SKIPPED`

## stage29 final closure
- 候选池 6 个对象已全部收口为最终新鲜结论。
- `alibaba.mydata.self.keyword.effect.week.get` 与 `alibaba.mydata.industry.keyword.get` 已从 `PARAM_CONTRACT_MISSING` 推进到 `TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED`。
- 当前 XD safe-scope 已完成：route parity 为 0，candidate pool 未决为 0。

### 当前冻结边界
- `/integrations/alibaba/xd/data/customers/list`：对象级 restriction
- `/integrations/alibaba/xd/data/products/schema/render/draft`：当前无真实 draft payload
- `/integrations/alibaba/xd/tools/reply-draft`
- `/integrations/alibaba/xd/tools/order-draft`
- candidate pool 6 项：全部已冻结为 `TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED`

### 只有拿到新外部证据才值得重开
- 新的租户/产品级可读权限证据
- 新的 live 样本，能证明 keyword family 或 trade decode 已进入可读窗口
