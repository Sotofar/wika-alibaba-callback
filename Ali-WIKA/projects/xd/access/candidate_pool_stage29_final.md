# XD candidate pool stage29 final closure

更新时间：2026-04-14

## 总结
- 本轮处理对象：6
- 本轮已全部收口：6
- 当前 safe-scope 内剩余 candidate 未决：0

## 本轮最终结论

| method | stage28 状态 | stage29 结论 | 说明 |
| --- | --- | --- | --- |
| `alibaba.mydata.self.keyword.effect.week.get` | `PARAM_CONTRACT_MISSING` (`properties`) | `TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED` | 官方文档对齐 `properties` 后，两次 live 调用都进入 `InsufficientPermission` |
| `alibaba.mydata.industry.keyword.get` | `PARAM_CONTRACT_MISSING` (`properties`) | `TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED` | 官方文档对齐 `properties` 后，两次 live 调用都进入 `InsufficientPermission` |
| `alibaba.seller.trade.decode` | `TENANT_OR_PRODUCT_RESTRICTION` | `TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED` | stage28 已用真实 `encryptor_id` 进入限制层；stage29 无新反证，直接冻结 |
| `alibaba.mydata.self.keyword.date.get` | `TENANT_OR_PRODUCT_RESTRICTION` | `TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED` | stage29 未出现新的参数反证，沿 stage28 live 证据冻结 |
| `alibaba.mydata.self.keyword.effect.month.get` | `TENANT_OR_PRODUCT_RESTRICTION` | `TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED` | stage29 未出现新的参数反证，沿 stage28 live 证据冻结 |
| `alibaba.mydata.seller.opendata.getconkeyword` | `TENANT_OR_PRODUCT_RESTRICTION` | `TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED` | stage29 未出现新的参数反证，沿 stage28 live 证据冻结 |

## Group A：keyword `properties` closure
- `alibaba.mydata.self.keyword.effect.week.get`
  - 文档明确要求：`date_range` + `properties`
  - 文档示例 `properties` 字段已落盘到 [keyword_properties_contract_stage29.md](D:/Code/阿里国际站/Ali-WIKA/projects/xd/access/keyword_properties_contract_stage29.md)
  - 本轮两次 live 调用结果一致：`InsufficientPermission`
- `alibaba.mydata.industry.keyword.get`
  - 文档明确要求：`keywords` + `properties`
  - 文档示例 `properties` 字段已落盘到 [keyword_properties_contract_stage29.md](D:/Code/阿里国际站/Ali-WIKA/projects/xd/access/keyword_properties_contract_stage29.md)
  - 本轮两次 live 调用结果一致：`InsufficientPermission`

结论：
- 这两条方法已经不再属于 `PARAM_CONTRACT_MISSING`。
- 当前真正阻塞是对象级 restriction，不是 `properties` 未知。

## Group B：restriction freeze
- `alibaba.seller.trade.decode`
  - stage28 已补真实 `encryptor_id` 后进入 `InsufficientPermission`
  - stage29 没有出现会推翻该归因的新证据
- `alibaba.mydata.self.keyword.date.get`
  - stage28 已稳定落在 restriction 层
  - stage29 的 keyword `properties` 新证据不会改变其归因
- `alibaba.mydata.self.keyword.effect.month.get`
  - stage28 已稳定落在 restriction 层
  - stage29 无新证据要求重试
- `alibaba.mydata.seller.opendata.getconkeyword`
  - stage28 已稳定落在 restriction 层
  - stage29 无新证据要求重试

## 为什么当前应冻结
- production base 继续 `PASS_BASE`
- 代表性 XD route 继续健康
- 稳定 control direct-method `alibaba.seller.order.get` 继续 `PASSED`
- Group A 已证明 keyword family 的两个主缺口不再是参数未知
- 因此继续空转重试不会新增仓内证据，只会重复 restriction 结果

## 后续只有在什么条件下才值得重开
- 拿到新的外部租户/产品级授权证据
- 或拿到新的真实 live 样本，能证明当前租户对上述对象存在可读窗口
- 在没有上述新证据前，不再重复同构调用
