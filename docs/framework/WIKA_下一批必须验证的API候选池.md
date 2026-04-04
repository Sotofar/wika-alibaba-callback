# WIKA 下一批必须验证的 API 候选池

更新时间：2026-04-05

本文只保留围绕最终 6 项任务、且在当前主线里最值得继续推进的下一批候选。已经明确权限阻塞或边界未证明的接口，不再回到当前主线里循环验证。

## 排序原则

1. 先补任务 3：只继续验证“可隔离、可清理、可回滚”的剩余写侧证据
2. 再补任务 5：订单草稿 / 交易创建入口
3. 最后再看任务 4：询盘 / 消息 / 客户是否存在稳定生产入口

## 第一梯队：任务 3（产品上新与详情编写）

| 优先级 | API / 能力 | 当前状态 | 当前结论 | 下一步 |
| --- | --- | --- | --- | --- |
| T3-P0 | `alibaba.icbu.photobank.group.operate` | 已验证但不进入路由化 | 已在 production 闭环下返回业务参数错误，说明已过授权层；但成功路径属于真实分组写操作，当前仍不能证明可隔离 / 可清理 / 可回滚边界 | 暂不继续实写验证；仅保留为 media 管理证据 |
| T3-P0 | draft 查询 / 读取 / 删除 / 管理同家族接口 | 当前未识别到可用入口 | 当前公开官方文档中，除已验证的 `schema.render.draft` 外，没有再识别到明确的新接口 | 不再围绕 draft 管理接口循环，除非官方出现新的明确方法名 |
| T3-P1 | `alibaba.icbu.photobank.upload` | 已验证但不进入路由化 | 已过授权层；media 可观测能力已成立，但当前仍无法证明低风险写入边界 | 暂不继续真实上传 |
| T3-P1 | `alibaba.icbu.product.add.draft` | 已验证但不进入路由化 | 已过授权层；draft 可区分证据已成立，但当前仍无法证明安全草稿边界 | 暂不继续真实 draft create |
| T3-P2 | `alibaba.icbu.product.schema.add` | 已验证但尚未形成正式路由 | 已过授权层，但当前不允许真实发布 | 仅保留候选，不进入实现 |
| T3-P2 | `alibaba.icbu.product.add` | 已验证但尚未形成正式路由 | 已过授权层，但属于真实发布高风险入口 | 不进入实现 |
| T3-P2 | `alibaba.icbu.product.schema.update` | 已验证但尚未形成正式路由 | 已过授权层，但当前不允许真实线上修改 | 不进入实现 |
| T3-P2 | `alibaba.icbu.product.update` | 已验证但尚未形成正式路由 | 已过授权层，但当前不允许真实线上修改 | 不进入实现 |
| T3-P2 | `alibaba.icbu.product.update.field` | 已验证但尚未形成正式路由 | 已过授权层，但当前不允许真实线上修改 | 不进入实现 |

### 任务 3 当前已从候选池转为正式可复用的支持路由
- `/integrations/alibaba/wika/data/categories/tree`
- `/integrations/alibaba/wika/data/categories/attributes`
- `/integrations/alibaba/wika/data/products/schema`
- `/integrations/alibaba/wika/data/products/schema/render`
- `/integrations/alibaba/wika/data/products/schema/render/draft`
- `/integrations/alibaba/wika/data/media/list`
- `/integrations/alibaba/wika/data/media/groups`

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

当前任务 3 的剩余工作已经进一步收口为：`photobank.group.operate` 只补到了“管理接口可到授权层之后”，而 draft 管理接口当前没有新增官方入口；在新的清理 / 回滚证据出现前，`photobank.upload` 和 `product.add.draft` 都不应进入最小真实写入验证。
