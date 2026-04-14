# XD permission gap stage29

更新时间：2026-04-14

## 当前统一口径
- 不再使用 `AWAITING_EXTERNAL_PERMISSION_ACTION` 作为 XD 当前默认停止标签。
- 用户已确认 XD 相关权限已申请到，本仓当前只依据真实调用结果分类。
- 单个对象返回 `InsufficientPermission`，只写成对象级 restriction，不扩大成“XD 整体未开权”。

## 当前仍表现为对象级 restriction 的 route / method

### production route
- `/integrations/alibaba/xd/data/customers/list`
  - 分类：`TENANT_OR_PRODUCT_RESTRICTION`
  - 说明：route 已绑定，production live 仍返回 `InsufficientPermission`

### candidate pool
- `alibaba.mydata.self.keyword.effect.week.get` -> `TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED`
- `alibaba.mydata.industry.keyword.get` -> `TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED`
- `alibaba.seller.trade.decode` -> `TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED`
- `alibaba.mydata.self.keyword.date.get` -> `TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED`
- `alibaba.mydata.self.keyword.effect.month.get` -> `TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED`
- `alibaba.mydata.seller.opendata.getconkeyword` -> `TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED`

## 已从参数缺口转移出去的对象
- `alibaba.mydata.self.keyword.effect.week.get`
  - 官方文档对齐 `properties` 后，两次 live 调用均返回 `InsufficientPermission`
- `alibaba.mydata.industry.keyword.get`
  - 官方文档对齐 `properties` 后，两次 live 调用均返回 `InsufficientPermission`

结论：
- keyword family 的 `properties` 已不再是当前参数缺口。
- 当前真正阻塞是外部租户/产品级可读证据，而不是仓内参数契约。

## 当前真实冻结边界
- route 侧
  - `customers/list` 的对象级 restriction
  - `products/schema/render/draft` 的真实 draft payload 缺失
  - draft tools 的 write-adjacent 边界
- candidate 侧
  - 6 个对象均已冻结为 `TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED`

## 当前最大阻塞
- 不是环境，不是 base auth，也不是“是否已申请权限”
- 当前最大阻塞是：缺少新的外部租户/产品级 live 证据
