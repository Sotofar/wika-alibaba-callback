# XD candidate pool stage28 continuous

更新时间：2026-04-13

## 范围
- 只重判 stage26 候选池的 7 个对象
- 不扩到未知新接口
- 不做暴力参数枚举

## 新鲜结论

| method | stage26 | stage28 | 说明 |
| --- | --- | --- | --- |
| `alibaba.seller.trade.decode` | `PARAM_CONTRACT_MISSING` (`encryptor_id`) | `TENANT_OR_PRODUCT_RESTRICTION` | 已从 XD 真实订单详情抽到 `encryptor_id`，调用后进入权限层并返回 `InsufficientPermission` |
| `alibaba.icbu.product.type.available.get` | `PARAM_CONTRACT_MISSING` (`type_request`) | `PASSED` | 按官方参数结构补 `type_request={cat_id,language}` 后返回真实 payload |
| `alibaba.mydata.self.keyword.effect.week.get` | `PARAM_CONTRACT_MISSING` (`date_range`) | `PARAM_CONTRACT_MISSING` | 补上 `date_range` 后，新的阻塞改为 `properties` |
| `alibaba.mydata.industry.keyword.get` | `PARAM_CONTRACT_MISSING` (`keywords`) | `PARAM_CONTRACT_MISSING` | 补上 `keywords/date_range/industry` 后，新的阻塞改为 `properties` |
| `alibaba.mydata.self.keyword.date.get` | `TENANT_OR_PRODUCT_RESTRICTION` | `TENANT_OR_PRODUCT_RESTRICTION` | 仍返回 `InsufficientPermission` |
| `alibaba.mydata.self.keyword.effect.month.get` | `TENANT_OR_PRODUCT_RESTRICTION` | `TENANT_OR_PRODUCT_RESTRICTION` | 仍返回 `InsufficientPermission` |
| `alibaba.mydata.seller.opendata.getconkeyword` | `TENANT_OR_PRODUCT_RESTRICTION` | `TENANT_OR_PRODUCT_RESTRICTION` | 仍返回 `InsufficientPermission` |

## 参数契约进展
- 已确认可安全落盘：
  - `alibaba.icbu.product.type.available.get`
    - `type_request.cat_id`
    - `type_request.language`
- 已确认还缺下一层参数：
  - `alibaba.mydata.self.keyword.effect.week.get` -> `properties`
  - `alibaba.mydata.industry.keyword.get` -> `properties`

## 当前不应做的事
- 不把 `TENANT_OR_PRODUCT_RESTRICTION` 扩大写成“XD 整体未开权”
- 不因为 `type.available.get` 已通过，就顺手扩到发品写侧
- 不在还缺 `properties` 契约时，把 keyword family 接进 runtime

## 下一步最短路径
- 若继续推进候选池，优先补仓内 `properties` 参数契约证据：
  - `alibaba.mydata.self.keyword.effect.week.get`
  - `alibaba.mydata.industry.keyword.get`
- 其余 4 个 `TENANT_OR_PRODUCT_RESTRICTION` 先保持对象级限制结论，不回退到旧权限叙事
