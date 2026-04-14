# XD reopen gate stage30

更新时间：2026-04-14

## 当前唯一允许的重开对象
- `/integrations/alibaba/xd/data/customers/list`
- `/integrations/alibaba/xd/data/products/schema/render/draft`
- `/integrations/alibaba/xd/tools/reply-draft`
- `/integrations/alibaba/xd/tools/order-draft`
- `alibaba.mydata.self.keyword.effect.week.get`
- `alibaba.mydata.industry.keyword.get`
- `alibaba.seller.trade.decode`
- `alibaba.mydata.self.keyword.date.get`
- `alibaba.mydata.self.keyword.effect.month.get`
- `alibaba.mydata.seller.opendata.getconkeyword`

## 合法重开 gate

### Gate 1：新的外部租户/产品级 live 证据
- 出现新的真实租户、产品、订单或关键词对象样本。
- 该样本能直接覆盖当前被冻结对象。
- 且该样本不是旧请求的重复调用结果。

### Gate 2：新的官方文档 / 控制台 / payload 证据
- 官方文档新增了能改变当前 restriction 归因的参数或对象条件。
- 控制台或授权后台出现了可审计的新 scope / 新能力开关。
- 真实 payload 显示对象已从 restriction 层进入可读层。

### Gate 3：新的可验证对象样本
- `customers/list` 需要新的可读客户窗口或同步样本。
- `products/schema/render/draft` 需要新的真实 draft payload 样本。
- keyword family / `trade.decode` 需要新的租户或产品级对象证据，而不是继续沿用旧样本。

### Gate 4：新的只读 route / direct-method 证据
- 只有当新的 route 或 direct-method 已证明业务前提变化，才允许恢复对象级验证。
- 恢复顺序应先做最小 direct-method 或单 route 验证，再决定是否需要扩展到 runtime 消费层。

## 以下都不是重开理由
- 单纯“再试一次”
- 没有新证据的重复调用
- 继续猜测 keyword `properties`
- 把 `TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED` 重新写回“权限未申请”
- 重跑 stage26 / stage27 / stage28 / stage29 的同构回归

## 重开顺序
1. 先确认 production base 仍是 `PASS_BASE`。
2. 再确认是否真的拿到了新的外部证据。
3. 只对对应对象做一次文档对齐的最小调用。
4. 若新结果改变分类，再更新矩阵、文档和 evidence。
5. 只有在对象已进入稳定可读层时，才允许讨论新的 route/runtime 绑定。

## 当前唯一合法下一步
- 等待外部新证据出现。
- 在没有新证据前，不再对当前冻结对象做仓内同构重试。
