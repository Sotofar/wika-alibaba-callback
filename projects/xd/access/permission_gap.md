# XD 权限缺口说明

更新时间：2026-04-10

## 当前结论

- 本轮没有形成新的 XD 标准权限失败证据，因为 XD 标准权限验证在进入业务接口前就被统一 `BLOCKED_ENV` 阻塞。
- 因此当前不能把任何对象升级写成“XD 权限不足已确认”。

## 保留的潜在权限敏感对象（来自 WIKA 历史证据）

### alibaba.mydata.overview.date.get
- 来自 WIKA 结论：`AUTH_BLOCKED`
- 当前是否建议申请额外权限：仅在 XD 标准权限验证真实落到 PERMISSION_DENIED 后再决定。
- 风险说明：在 production 基础健康未恢复前，不进行权限归因。

### alibaba.mydata.overview.industry.get
- 来自 WIKA 结论：`AUTH_BLOCKED`
- 当前是否建议申请额外权限：仅在 XD 标准权限验证真实落到 PERMISSION_DENIED 后再决定。
- 风险说明：在 production 基础健康未恢复前，不进行权限归因。

### alibaba.mydata.overview.indicator.basic.get
- 来自 WIKA 结论：`AUTH_BLOCKED`
- 当前是否建议申请额外权限：仅在 XD 标准权限验证真实落到 PERMISSION_DENIED 后再决定。
- 风险说明：在 production 基础健康未恢复前，不进行权限归因。

### alibaba.mydata.self.product.date.get
- 来自 WIKA 结论：`AUTH_BLOCKED`
- 当前是否建议申请额外权限：仅在 XD 标准权限验证真实落到 PERMISSION_DENIED 后再决定。
- 风险说明：在 production 基础健康未恢复前，不进行权限归因。

### alibaba.mydata.self.product.get
- 来自 WIKA 结论：`AUTH_BLOCKED`
- 当前是否建议申请额外权限：仅在 XD 标准权限验证真实落到 PERMISSION_DENIED 后再决定。
- 风险说明：在 production 基础健康未恢复前，不进行权限归因。

