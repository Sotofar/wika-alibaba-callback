# WIKA 下一批必须验证的 API 候选池

更新时间：2026-04-04

本文只保留围绕最终 6 项任务、且在当前主线里最值得继续推进的下一批候选。  
不再把已经明确权限阻塞的 `mydata / overview / self.product` 接口放回当前主线循环。

## 排序原则

1. 先补任务 3：产品写入前置能力与低风险草稿边界
2. 再补任务 5：订单草稿 / 交易创建入口
3. 最后再判断任务 4：询盘 / 消息 / 客户是否有可生产入口

## 第一梯队：任务 3（产品上新与详情编写）

| 优先级 | API / 能力 | 当前状态 | 当前结论 | 下一步 |
| --- | --- | --- | --- | --- |
| T3-P0 | `alibaba.icbu.photobank.upload` | 已验证但尚未形成正式路由 | 当前生产实测返回业务参数错误，说明已过授权层；但它属于真实写操作，尚未证明存在低风险测试/草稿边界 | 先定义安全调用边界，再决定是否进入最小原始路由 |
| T3-P0 | `alibaba.icbu.product.schema.get` | 官方存在，待生产验证 | 这是补齐 schema / 必填字段 / payload 结构的关键入口 | 进入下一轮真实生产验证 |
| T3-P0 | `alibaba.icbu.product.schema.render` | 官方存在，待生产验证 | 可用于读取 schema 字段与已有商品渲染结果，有助于草稿链路 | 进入下一轮真实生产验证 |
| T3-P0 | `alibaba.icbu.product.add.draft` | 官方存在，待生产验证 | 当前最像“安全草稿模式”的候选，不应跳过 | 进入下一轮真实生产验证 |
| T3-P1 | `alibaba.icbu.product.schema.add` | 已验证但尚未形成正式路由 | 当前生产实测返回业务参数错误，说明已过授权层；但还没有安全草稿边界 | 等 schema/get-render-draft 结论出来后，再决定是否进入低风险验证 |
| T3-P1 | `alibaba.icbu.product.add` | 已验证但尚未形成正式路由 | 当前生产实测返回业务参数错误，说明已过授权层；但属于高风险真实发布入口 | 不直接进入正式路由开发 |
| T3-P1 | `alibaba.icbu.product.schema.update` | 已验证但尚未形成正式路由 | 当前生产实测返回业务参数错误，说明已过授权层；但更新真实商品风险高 | 等 schema/render 与草稿边界明确后再推进 |
| T3-P1 | `alibaba.icbu.product.update` | 已验证但尚未形成正式路由 | 当前生产实测返回业务参数错误，说明已过授权层；但当前不允许真实线上修改 | 仅保留在候选池 |
| T3-P1 | `alibaba.icbu.product.update.field` | 已验证但尚未形成正式路由 | 当前生产实测返回业务参数错误，说明已过授权层；但真实字段更新风险高 | 仅保留在候选池 |

## 第二梯队：任务 5（订单草稿 / 交易创建）

| 优先级 | API / 能力 | 当前状态 | 当前结论 | 下一步 |
| --- | --- | --- | --- | --- |
| T5-P0 | `alibaba.trade.order.create` | 官方存在，待生产验证 | 当前最接近平台内订单草稿 / 交易创建主入口的正式候选 | 等任务 3 第一梯队收口后再验证 |
| T5-P1 | 外部结构化报价单 / 订单草稿文档 | 非 Alibaba API，但任务闭环需要 | 即使平台内创建不通，也可以形成替代方案；但不得误报为平台内订单已起草成功 | 作为替代方案保留 |

## 第三梯队：任务 4（询盘 / 消息 / 客户）

| 优先级 | API / 能力 | 当前状态 | 当前结论 | 下一步 |
| --- | --- | --- | --- | --- |
| T4-P0 | `alibaba.seller.customer.batch.get` / `customer.get` | 官方存在，但权限/能力阻塞 | 当前证据仍偏 `router/rest + session + 聚石塔内调用` | 不进入当前主线开发 |
| T4-P1 | `alibaba.seller.customer.note.query` / `note.get` | 官方存在，但权限/能力阻塞 | 同上 | 不进入当前主线开发 |
| T4-P2 | `alibaba.inquiry.cards.send` | 当前未识别到可用入口 | 只有零散发送线索，不能证明存在稳定“读 + 回”闭环 | 不进入当前主线开发 |

## 当前明确不再继续循环的对象

以下接口虽然与经营指标直接相关，但当前已经有明确收口结论，不再继续消耗本阶段主线资源：

- `alibaba.mydata.overview.indicator.basic.get`
- `alibaba.mydata.self.product.get`
- `alibaba.mydata.self.product.date.get`
- `alibaba.mydata.overview.date.get`
- `alibaba.mydata.overview.industry.get`

当前统一结论：

- `官方存在，但权限/能力阻塞`

## 当前主线一句话结论

下一阶段最值得继续推进的，不是再扫更多 API，而是沿着：

1. `schema.get / schema.render / add.draft`
2. `photobank.upload`
3. `trade.order.create`

这三组，先补齐“安全草稿边界 + 写前结构化能力”，再决定是否继续进入真实写路由开发。
