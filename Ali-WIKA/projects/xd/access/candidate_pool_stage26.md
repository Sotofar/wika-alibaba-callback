# XD candidate pool stage26

更新时间：2026-04-13

## 结论
- WIKA 候选池中当前可复用到 XD 的 7 个 read-only 候选，本轮都做了单次最小调用并归类。
- 本轮不做参数枚举；仓内缺稳定契约时，只做一次最保守 family-aligned 调用。

## 分类结果

| method | 新结论 | 证据 |
| --- | --- | --- |
| `alibaba.seller.trade.decode` | `PARAM_CONTRACT_MISSING` | 返回 `MissingParameter: encryptor_id` |
| `alibaba.icbu.product.type.available.get` | `PARAM_CONTRACT_MISSING` | 返回 `MissingParameter: type_request` |
| `alibaba.mydata.self.keyword.date.get` | `TENANT_OR_PRODUCT_RESTRICTION` | 进入权限层，返回 `InsufficientPermission` |
| `alibaba.mydata.self.keyword.effect.week.get` | `PARAM_CONTRACT_MISSING` | 返回 `MissingParameter: date_range` |
| `alibaba.mydata.self.keyword.effect.month.get` | `TENANT_OR_PRODUCT_RESTRICTION` | 进入权限层，返回 `InsufficientPermission` |
| `alibaba.mydata.industry.keyword.get` | `PARAM_CONTRACT_MISSING` | 返回 `MissingParameter: keywords` |
| `alibaba.mydata.seller.opendata.getconkeyword` | `TENANT_OR_PRODUCT_RESTRICTION` | 进入权限层，返回 `InsufficientPermission` |

## 解读
- `PARAM_CONTRACT_MISSING` 说明对象存在且已到参数校验层，但仓内仍缺可安全复用的稳定参数模板。
- `TENANT_OR_PRODUCT_RESTRICTION` 说明当前不是“整体 auth/runtime 崩坏”，而是对象级权限或租户侧限制。
- 本轮没有新增 `PASSED` 候选，因此不把候选池对象接入 XD runtime。
