# XD Permission Gap Stage31

更新时间：2026-04-18

## 当前统一口径

- 不再使用 `AWAITING_EXTERNAL_PERMISSION_ACTION` 作为 XD 默认停止标签。
- 不再把 `TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED` 回写成“权限未申请”。
- 所有 XD gap 结论只依据真实调用、当前矩阵、stage29/stage30 冻结证据和 stage31 产品化输出统一表达。

## 当前仍表现为对象级 restriction 的对象

### production route
- `/integrations/alibaba/xd/data/customers/list`
  - 分类：`TENANT_OR_PRODUCT_RESTRICTION`
  - 说明：route 已绑定，live 结果稳定落在对象级限制层。

### candidate pool
- `alibaba.mydata.self.keyword.effect.week.get` -> `TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED`
- `alibaba.mydata.industry.keyword.get` -> `TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED`
- `alibaba.seller.trade.decode` -> `TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED`
- `alibaba.mydata.self.keyword.date.get` -> `TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED`
- `alibaba.mydata.self.keyword.effect.month.get` -> `TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED`
- `alibaba.mydata.seller.opendata.getconkeyword` -> `TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED`

## 已退出参数缺口队列的对象

- `alibaba.mydata.self.keyword.effect.week.get`
  - `properties` 已按官方文档与 stage29 证据补齐，最终进入 restriction 层。
- `alibaba.mydata.industry.keyword.get`
  - `properties` 已按官方文档与 stage29 证据补齐，最终进入 restriction 层。

结论：

- keyword family 当前不再属于仓内参数契约缺口。
- 当前真正的阻塞是外部租户/产品级 live 证据，而不是仓内参数未知。

## 当前冻结边界

- route 侧：
  - `customers/list` 的对象级 restriction
  - `products/schema/render/draft` 的无 payload 状态
  - draft tools 的 write-adjacent 边界
- candidate 侧：
  - 6 个对象全部冻结为 `TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED`

## 当前 safe-scope 下已不再视为未决的问题

- route parity gap：`0`
- candidate 未决：`0`
- 当前矩阵不存在“待确认 / 下轮再看 / 空白状态”的 XD access 条目

## stage31 新增维护结论

- 当前已不再缺“如何用这些能力做现实工作”的产物。
- stage31 已把 restriction confirmed 与 reopen gate 口径写入：
  - `XD_PERMISSION_AND_CAPABILITY_LEDGER_STAGE31.md`
  - `XD_WEEKLY_OPERATIONS_REPORT_STAGE31.md`
  - `scripts/generate-xd-operations-report-stage31.js`
  - `scripts/check-xd-critical-routes-stage31.js`
- 因此当前不应继续做“为了确认权限是否真开了”式的重复调用。

## 当前最大外部阻塞

- 不是环境问题
- 不是 base auth 问题
- 不是“是否申请权限”的叙事问题
- 当前唯一值得记录的阻塞是：
  - 缺少新的外部租户/产品级 live 证据
  - 缺少能改变当前 restriction 归因的官方 / 控制台 / 真实 payload 新证据

## 当前唯一合法重开方向

- 新的外部租户/产品级 live 证据
- 新的官方文档 / 控制台 / payload 证据
- 新的真实对象样本，可直接覆盖当前冻结对象

