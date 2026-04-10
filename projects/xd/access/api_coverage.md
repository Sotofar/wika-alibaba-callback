# XD API 覆盖摘要

更新时间：2026-04-10

## 当前执行范围
- 只围绕 WIKA 历史未决 8 项做 XD 标准权限确认。
- 本轮没有高权限补测。
- 本轮没有扫描未知接口。

## 本轮执行结果
- 总计确认：8 项
- `PASSED`：3
- `PERMISSION_DENIED`：4
- `PARAM_MISSING`：1
- `NO_DATA`：0
- `DOC_MISMATCH`：0
- `RATE_LIMITED`：0
- `DEPRECATED`：0
- `BLOCKED_ENV`：0
- `UNKNOWN`：0

## 明细摘要
- `PASSED`
  - `alibaba.seller.order.get`
  - `alibaba.seller.order.fund.get`
  - `alibaba.seller.order.logistics.get`
- `PERMISSION_DENIED`
  - `alibaba.mydata.overview.date.get`
  - `alibaba.mydata.overview.industry.get`
  - `alibaba.mydata.self.product.date.get`
  - `alibaba.mydata.self.product.get`
- `PARAM_MISSING`
  - `alibaba.mydata.overview.indicator.basic.get`

## 边界说明
- 这轮只是 XD 标准权限确认，不代表任务 1 / 2 已完成。
- 这轮不是平台内闭环。
- 这轮没有任何写动作。
