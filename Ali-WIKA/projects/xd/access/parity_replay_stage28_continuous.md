# XD parity replay stage28 continuous

更新时间：2026-04-13

## 范围
- 不重跑 stage26 全量 parity replay
- 不重跑 stage27 已完成的 5 条 route 绑定
- 只收口剩余 14 条 read-only parity gap family，并在同轮里处理 draft tools 的安全跳过

## Batch A：categories + products schema

| route | 结果 | 说明 |
| --- | --- | --- |
| `/integrations/alibaba/xd/data/categories/tree` | `ROUTE_BOUND_AND_PASSED` | production live 200，返回 category tree |
| `/integrations/alibaba/xd/data/categories/attributes?cat_id=36127040` | `ROUTE_BOUND_AND_PASSED` | production live 200，返回 attributes |
| `/integrations/alibaba/xd/data/products/schema?cat_id=36127040` | `ROUTE_BOUND_AND_PASSED` | production live 200，返回 schema XML |
| `/integrations/alibaba/xd/data/products/schema/render?cat_id=36127040&product_id=1601740545697` | `ROUTE_BOUND_AND_PASSED` | 当前需使用 `products/list` 的 numeric `id` 作为 `product_id` |
| `/integrations/alibaba/xd/data/products/schema/render/draft?cat_id=36127040&product_id=1601740545697` | `ROUTE_BOUND_NO_DATA` | route 已绑定，当前真实样本 draft schema 为空 |

## Batch B：media

| route | 结果 | 说明 |
| --- | --- | --- |
| `/integrations/alibaba/xd/data/media/list?page_size=1` | `ROUTE_BOUND_AND_PASSED` | production live 200，返回 photobank item |
| `/integrations/alibaba/xd/data/media/groups` | `ROUTE_BOUND_AND_PASSED` | production live 200，返回 18 个分组 |

## Batch C：customers + orders draft-types + minimal-diagnostic

| route | 结果 | 说明 |
| --- | --- | --- |
| `/integrations/alibaba/xd/data/customers/list?customer_id_begin=0&last_sync_end_time=2026-04-06%2000%3A00%3A00&page_size=1` | `TENANT_OR_PRODUCT_RESTRICTION` | route 已绑定，但 live 返回 `InsufficientPermission` |
| `/integrations/alibaba/xd/data/orders/draft-types` | `ROUTE_BOUND_AND_PASSED` | production live 200，返回 draft type 列表 |
| `/integrations/alibaba/xd/reports/products/minimal-diagnostic` | `ROUTE_BOUND_AND_PASSED` | production live 200，已改成 XD account/source route 映射 |
| `/integrations/alibaba/xd/reports/orders/minimal-diagnostic` | `ROUTE_BOUND_AND_PASSED` | production live 200 |
| `/integrations/alibaba/xd/reports/operations/minimal-diagnostic` | `ROUTE_BOUND_AND_PASSED` | production live 200 |

## Batch D：draft tools

| route | 结果 | 原因 |
| --- | --- | --- |
| `/integrations/alibaba/xd/tools/reply-draft` | `WRITE_ADJACENT_SKIPPED` | POST draft package，属于 write-adjacent，不是严格只读查询 |
| `/integrations/alibaba/xd/tools/order-draft` | `WRITE_ADJACENT_SKIPPED` | POST draft package，属于 write-adjacent，不是严格只读查询 |

## 回归
- 所有本轮 `ROUTE_BOUND_AND_PASSED` 对象已最小复跑一次，二次结果保持一致。
- stable sanity route：
  - `/integrations/alibaba/xd/data/orders/list?page_size=1` -> `200`
- stable sanity direct-method：
  - `alibaba.seller.order.get` -> `PASSED`

## 本轮结论
- 剩余 14 条 parity gap 已全部落到新鲜结论。
- `DOC_MISMATCH` 已清零。
- route 侧剩余未决不是“未绑定”，而是：
  - `customers/list` 的对象级限制
  - `products/schema/render/draft` 当前无业务 payload
  - `draft tools` 的 write-adjacent 安全边界
