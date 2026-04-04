# WIKA 下一批必须验证的 API 候选池

更新时间：2026-04-04

本文只保留围绕最终 6 项任务、且在当前主线里最值得继续推进的下一批候选。已经明确权限阻塞或边界未证明的接口，不再回到当前主线里循环验证。

## 排序原则

1. 先补任务 3：在低风险边界内继续推进写侧草稿模式
2. 再补任务 5：订单草稿 / 交易创建入口
3. 最后再看任务 4：询盘 / 消息 / 客户是否存在稳定生产入口

## 第一梯队：任务 3（产品上新与详情编写）

| 优先级 | API / 能力 | 当前状态 | 当前结论 | 下一步 |
| --- | --- | --- | --- | --- |
| T3-P0 | `alibaba.icbu.photobank.upload` | 已验证但不进入路由化 | 已过授权层，但当前无法证明低风险边界，因此不继续实写验证 | 暂不继续真实上传；仅在未来拿到明确清理/隔离证据时再重开 |
| T3-P0 | `alibaba.icbu.product.add.draft` | 已验证但不进入路由化 | 已过授权层，但当前无法证明安全草稿边界，因此不继续实写验证 | 暂不继续真实 draft create；仅在未来拿到明确非发布/可清理证据时再重开 |
| T3-P1 | `alibaba.icbu.product.schema.add` | 已验证但尚未形成正式路由 | 已过授权层，但当前不允许真实发布 | 仅保留候选，不进入实现 |
| T3-P1 | `alibaba.icbu.product.add` | 已验证但尚未形成正式路由 | 已过授权层，但属于真实发布高风险入口 | 不进入实现 |
| T3-P1 | `alibaba.icbu.product.schema.update` | 已验证但尚未形成正式路由 | 已过授权层，但当前不允许真实线上修改 | 不进入实现 |
| T3-P1 | `alibaba.icbu.product.update` | 已验证但尚未形成正式路由 | 已过授权层，但当前不允许真实线上修改 | 不进入实现 |
| T3-P1 | `alibaba.icbu.product.update.field` | 已验证但尚未形成正式路由 | 已过授权层，但当前不允许真实线上修改 | 不进入实现 |

### 任务 3 当前已从候选池转为正式可复用的支持路由
- `/integrations/alibaba/wika/data/categories/tree`
- `/integrations/alibaba/wika/data/categories/attributes`
- `/integrations/alibaba/wika/data/products/schema`
- `/integrations/alibaba/wika/data/products/schema/render`

## 第二梯队：任务 5（订单草稿 / 交易创建）

| 优先级 | API / 能力 | 当前状态 | 当前结论 | 下一步 |
| --- | --- | --- | --- | --- |
| T5-P0 | `alibaba.trade.order.create` | 官方存在，待生产验证 | 当前最接近平台内订单草稿 / 交易创建的正式候选 | 等任务 3 收口后再生产验证 |
| T5-P1 | 外部结构化报价单 / 订单草稿文档 | 非 Alibaba API，但任务闭环需要 | 可做替代方案，但不得误报为平台内订单已创建 | 仅作为后备替代方案保留 |

## 第三梯队：任务 4（询盘 / 消息 / 客户）

| 优先级 | API / 能力 | 当前状态 | 当前结论 | 下一步 |
| --- | --- | --- | --- | --- |
| T4-P0 | `alibaba.seller.customer.batch.get` / `customer.get` | 官方存在，但权限/能力阻塞 | 当前证据仍偏 `router/rest + session + 聚石塔内调用` | 不进入当前主线开发 |
| T4-P1 | `alibaba.seller.customer.note.query` / `note.get` | 官方存在，但权限/能力阻塞 | 同上 | 不进入当前主线开发 |
| T4-P2 | `alibaba.inquiry.cards.send` | 当前未识别到稳定入口 | 只有零散发送线索，不能证明存在稳定“读 + 回”闭环 | 不进入当前主线开发 |

## 当前明确不再继续循环的对象

以下接口虽然与经营指标直接相关，但当前已经有明确收口结论，不再继续消耗主线资源：
- `alibaba.mydata.overview.indicator.basic.get`
- `alibaba.mydata.self.product.get`
- `alibaba.mydata.self.product.date.get`
- `alibaba.mydata.overview.date.get`
- `alibaba.mydata.overview.industry.get`

统一结论：`官方存在，但权限/能力阻塞`

## 当前一句话结论

下一阶段最值得继续推进的，不是继续扫更多 API，而是只在已经确认的安全边界内继续推进任务 3 的草稿准备链路，同时把真正的平台内闭环验证留给 `trade.order.create` 这一类更接近目标任务的候选。
