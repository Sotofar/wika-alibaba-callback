# XD API coverage

更新时间：2026-04-13

## 当前覆盖面
- parity route 总数：27
- `RECONFIRMED_XD`: 8
- `ROUTE_BOUND_AND_PASSED`: 5
- `DOC_MISMATCH`: 14

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

## 本轮已完成的 route 绑定
- products:
  - detail
  - groups
  - score
- orders:
  - fund
  - logistics

## 当前仍未落地的 parity gap
- categories:
  - tree
  - attributes
- products:
  - schema
  - schema/render
  - schema/render/draft
- media:
  - list
  - groups
- customers:
  - list
- orders:
  - draft-types
- reports:
  - products/minimal-diagnostic
  - orders/minimal-diagnostic
  - operations/minimal-diagnostic
- tools:
  - reply-draft
  - order-draft

## 约束
- `NO_DATA` 不是 `PASSED`。
- stage27 只把 5 条已被 direct-method 证明可读的 route 补成 production route。
- 剩余 14 条 `DOC_MISMATCH` 本轮未扩。
