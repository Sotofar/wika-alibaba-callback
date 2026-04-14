# XD permission gap stage30 safe freeze

更新时间：2026-04-14

## 当前统一口径
- 不再使用 `AWAITING_EXTERNAL_PERMISSION_ACTION` 作为 XD 默认停止标签。
- 不再把 `TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED` 回写成“权限未申请”。
- 当前所有 XD gap 结论只依据真实调用、当前矩阵与 stage29 证据统一表达。

## 当前仍表现为对象级 restriction 的对象

### production route
- `/integrations/alibaba/xd/data/customers/list`
  - 分类：`TENANT_OR_PRODUCT_RESTRICTION`
  - 说明：route 已绑定，当前 live 仍稳定落在对象级限制层

### candidate pool
- `alibaba.mydata.self.keyword.effect.week.get` -> `TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED`
- `alibaba.mydata.industry.keyword.get` -> `TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED`
- `alibaba.seller.trade.decode` -> `TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED`
- `alibaba.mydata.self.keyword.date.get` -> `TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED`
- `alibaba.mydata.self.keyword.effect.month.get` -> `TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED`
- `alibaba.mydata.seller.opendata.getconkeyword` -> `TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED`

## 已经退出参数缺口队列的对象
- `alibaba.mydata.self.keyword.effect.week.get`
  - `properties` 已按官方文档补齐，两次 live 调用都进入 `InsufficientPermission`
- `alibaba.mydata.industry.keyword.get`
  - `properties` 已按官方文档补齐，两次 live 调用都进入 `InsufficientPermission`

结论：
- keyword family 的 `properties` 已不再属于当前仓内参数缺口。
- 当前真正阻塞是外部租户/产品级可读证据，而不是仓内参数契约。

## 当前冻结边界
- route 侧
  - `customers/list` 的对象级 restriction
  - `products/schema/render/draft` 的真实 draft payload 缺失
  - draft tools 的 write-adjacent 边界
- candidate 侧
  - 6 个对象均已冻结为 `TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED`

## 当前 safe-scope 下不再视为未决的问题
- route parity gap：`0`
- candidate 未决：`0`
- 当前矩阵不存在“待确认 / 下轮再看 / 空白状态”的 XD access 条目

## 当前最大外部阻塞
- 不是环境问题
- 不是 base auth 问题
- 不是“是否申请权限”的叙事问题
- 当前唯一值得记录的阻塞是：
  - 缺少新的外部租户/产品级 live 证据
  - 缺少能改变当前 restriction 归因的官方或对象级新证据

## 当前唯一合法重开方向
- 新的外部租户/产品级 live 证据
- 新的官方文档 / 控制台 / payload 证据
- 新的真实对象样本，可直接覆盖当前冻结对象
