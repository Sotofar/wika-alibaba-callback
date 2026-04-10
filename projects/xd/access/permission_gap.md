# XD 权限缺口说明

更新时间：2026-04-10

本文只记录“标准权限下已经拿到接口级 `PERMISSION_DENIED` 证据”的对象。

## 当前确认的权限缺口

### alibaba.mydata.overview.date.get
- 当前结论：`PERMISSION_DENIED`
- 证据：XD 标准权限下返回 `InsufficientPermission`
- 建议：如后续业务确需店铺级日期窗口能力，再申请对应 mydata 权限；本轮不做高权限补测
- 风险：当前不能把它误写成“接口不存在”或“任务 1 已完成”

### alibaba.mydata.overview.industry.get
- 当前结论：`PERMISSION_DENIED`
- 证据：XD 标准权限下返回 `InsufficientPermission`
- 建议：如后续业务确需行业维度经营数据，再申请对应 mydata 权限；本轮不做高权限补测
- 风险：当前不能把它误写成“接口不存在”或“任务 1 已完成”

### alibaba.mydata.self.product.date.get
- 当前结论：`PERMISSION_DENIED`
- 证据：XD 标准权限下返回 `InsufficientPermission`
- 建议：如后续业务确需产品级日期窗口能力，再申请对应 mydata 权限；本轮不做高权限补测
- 风险：当前不能把它误写成“接口不存在”或“任务 2 已完成”

### alibaba.mydata.self.product.get
- 当前结论：`PERMISSION_DENIED`
- 证据：XD 标准权限下返回 `InsufficientPermission`
- 建议：如后续业务确需产品级表现数据，再申请对应 mydata 权限；本轮不做高权限补测
- 风险：当前不能把它误写成“接口不存在”或“任务 2 已完成”

## 明确不属于权限缺口的对象
- `alibaba.mydata.overview.indicator.basic.get`
  - 当前是 `PARAM_MISSING`
  - 本轮不能写成 `PERMISSION_DENIED`
- `alibaba.seller.order.get`
- `alibaba.seller.order.fund.get`
- `alibaba.seller.order.logistics.get`
  - 这三项当前是 `PASSED`
  - 不属于权限缺口
