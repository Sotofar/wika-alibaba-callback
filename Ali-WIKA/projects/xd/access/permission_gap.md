# XD permission gap stage26

更新时间：2026-04-13

## 本轮统一口径
- 不再使用 `AWAITING_EXTERNAL_PERMISSION_ACTION` 作为 XD 本轮总停止标签。
- 用户已明确确认“XD 权限已申请到”，因此本轮先执行安全 refresh/bootstrap，再依据真实调用结果归类。

## 当前仍表现为对象级限制的 API
- `alibaba.mydata.self.keyword.date.get`
- `alibaba.mydata.self.keyword.effect.month.get`
- `alibaba.mydata.seller.opendata.getconkeyword`

这些对象当前分类为 `TENANT_OR_PRODUCT_RESTRICTION`，原因是：
- base route 正常
- XD auth/debug 正常
- orders direct-method 正常
- 其他 mydata 至少已有部分方法可进入可读层

因此，当前不能把它们扩大写成“XD 整体仍未开权”。

## 已从旧权限缺口叙事中移出的对象
- `alibaba.mydata.overview.date.get` -> `PASSED`
- `alibaba.mydata.overview.industry.get` -> `NO_DATA`
- `alibaba.mydata.self.product.date.get` -> `PASSED`
- `alibaba.mydata.self.product.get` -> `NO_DATA`
- `alibaba.mydata.overview.indicator.basic.get` -> `NO_DATA`

## 当前最大真实缺口
- XD production route parity 仍有 14 条 `DOC_MISMATCH`
- 候选池仍有参数契约缺口
- 部分 mydata 候选仍有对象级权限/租户限制
