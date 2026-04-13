# XD API coverage

更新时间：2026-04-13

## 当前覆盖面
- parity route 总数：27
- `RECONFIRMED_XD`: 8
- `PASSED_WITH_EQUIVALENT_DATA`: 5
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

## 当前仍未落地为 XD route 的高价值能力
- products:
  - detail / groups / score
- orders:
  - fund / logistics
- categories / media / customers / minimal-diagnostic / draft-tools:
  - 当前 production 上不存在 XD route

## 约束
- `NO_DATA` 不是 `PASSED`。
- `PASSED_WITH_EQUIVALENT_DATA` 不是 route online。
