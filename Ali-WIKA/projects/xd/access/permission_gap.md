# XD permission gap stage28

更新时间：2026-04-13

## 当前统一口径
- 不再使用 `AWAITING_EXTERNAL_PERMISSION_ACTION` 作为 XD 本轮默认停止标签。
- 用户已确认 XD 相关权限已申请到；本轮直接按可读生产路线推进，并依据真实调用结果分类。
- 单个对象返回 `InsufficientPermission`，只写成对象级限制，不扩大成“XD 整体未开权”。

## 当前仍表现为对象级限制的 route / method

### production route
- `/integrations/alibaba/xd/data/customers/list`
  - 分类：`TENANT_OR_PRODUCT_RESTRICTION`
  - 说明：route 已绑定，production live 返回 `InsufficientPermission`

### candidate pool
- `alibaba.seller.trade.decode`
- `alibaba.mydata.self.keyword.date.get`
- `alibaba.mydata.self.keyword.effect.month.get`
- `alibaba.mydata.seller.opendata.getconkeyword`

这些对象当前统一分类为 `TENANT_OR_PRODUCT_RESTRICTION`，原因是：
- base canary 正常
- `/integrations/alibaba/xd/auth/debug` 正常
- orders route / direct-method 正常
- 其他 route parity 与 candidate 已有通过项

因此，当前不能把它们写成“XD base/auth 未打通”。

## 已从旧权限叙事中移出的对象
- `alibaba.mydata.overview.date.get` -> `PASSED`
- `alibaba.mydata.overview.industry.get` -> `NO_DATA`
- `alibaba.mydata.self.product.date.get` -> `PASSED`
- `alibaba.mydata.self.product.get` -> `NO_DATA`
- `alibaba.mydata.overview.indicator.basic.get` -> `NO_DATA`
- `alibaba.icbu.product.type.available.get` -> `PASSED`

## 当前真实缺口
- route 侧已不再存在 `DOC_MISMATCH`。
- route 侧剩余未决：
  - `customers/list` 的对象级限制
  - `products/schema/render/draft` 的真实 draft payload 缺失
  - `draft tools` 的 write-adjacent 安全边界
- candidate 侧剩余未决：
  - `PARAM_CONTRACT_MISSING`
    - `alibaba.mydata.self.keyword.effect.week.get`（缺 `properties`）
    - `alibaba.mydata.industry.keyword.get`（缺 `properties`）
  - `TENANT_OR_PRODUCT_RESTRICTION`
    - `alibaba.seller.trade.decode`
    - `alibaba.mydata.self.keyword.date.get`
    - `alibaba.mydata.self.keyword.effect.month.get`
    - `alibaba.mydata.seller.opendata.getconkeyword`

## 当前最大阻塞
- 不是环境，不是 base auth，也不是“是否申请权限”。
- 当前最大阻塞是：
  - keyword family 缺 `properties` 最小契约
  - 个别对象仍有 tenant/product restriction
  - draft tools 仍不满足严格只读边界
