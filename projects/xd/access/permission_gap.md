# XD 权限缺口说明

更新时间：2026-04-10

本文只记录“标准权限下已经拿到接口级权限错误证据”的对象。

## 当前确认的权限缺口

### alibaba.mydata.overview.date.get
- 当前结论：`PERMISSION_GAP_CONFIRMED`
- 证据：XD 标准权限下稳定返回 `InsufficientPermission`
- 当前最强结论：标准权限接口层已确认权限缺口，但本轮未做 elevated confirm
- 建议：如业务确需店铺级日期窗口能力，再申请对应 mydata 权限；若后续明确允许，再做单次 elevated confirm

### alibaba.mydata.overview.industry.get
- 当前结论：`PERMISSION_GAP_CONFIRMED`
- 证据：XD 标准权限下稳定返回 `InsufficientPermission`
- 当前最强结论：标准权限接口层已确认权限缺口，但本轮未做 elevated confirm
- 建议：如业务确需行业维度经营数据，再申请对应 mydata 权限；若后续明确允许，再做单次 elevated confirm

### alibaba.mydata.self.product.date.get
- 当前结论：`PERMISSION_GAP_CONFIRMED`
- 证据：XD 标准权限下稳定返回 `InsufficientPermission`
- 当前最强结论：标准权限接口层已确认权限缺口，但本轮未做 elevated confirm
- 建议：如业务确需产品级日期窗口能力，再申请对应 mydata 权限；若后续明确允许，再做单次 elevated confirm

### alibaba.mydata.self.product.get
- 当前结论：`PERMISSION_GAP_CONFIRMED`
- 证据：XD 标准权限下稳定返回 `InsufficientPermission`
- 当前最强结论：标准权限接口层已确认权限缺口，但本轮未做 elevated confirm
- 建议：如业务确需产品级表现数据，再申请对应 mydata 权限；若后续明确允许，再做单次 elevated confirm

### alibaba.mydata.overview.indicator.basic.get
- 当前结论：`PERMISSION_DENIED`
- 证据：
  - `date_range` alone -> `MissingParameter(industry)`
  - `date_range + industry` -> `InsufficientPermission`
- 当前最强结论：参数契约已补齐到权限层，当前更像权限缺口，而不是继续缺参数
- 建议：如业务确需店铺级 visitor / imps / click / fb / reply 指标，再申请对应 mydata 权限

## 明确不属于权限缺口的对象
- `alibaba.seller.order.get`
- `alibaba.seller.order.fund.get`
- `alibaba.seller.order.logistics.get`
  - 这三项当前已在 XD 标准权限下 `PASSED`
  - 不属于权限缺口

## 本轮未做的事
- 未执行 elevated confirm
- 原因：`XD_ELEVATED_ALLOWED` 未设置为 `1`
- 当前不能把“未做 elevated”误写成“权限已解决”

## stage24 早停补充
- 当前未检测到新的外部权限变化证据。
- 因此 stage24 不再重复 stage23 的 5 个 direct-method 调用。
- 当前最强结论仍然是：
  - 4 个 mydata 方法：`PERMISSION_GAP_CONFIRMED`
  - `indicator.basic`：固定参数契约下已进入权限错误层
- 下一步不是继续试代码，而是先发生外部权限动作。
