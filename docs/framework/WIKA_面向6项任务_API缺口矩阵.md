# WIKA 面向 6 项任务 API 缺口矩阵

更新时间：2026-04-04

当前阶段只面向 `WIKA` 主线，不恢复 `XD` 并行开发。以下矩阵只围绕最终 6 项任务做能力收口，不等于这些任务已经闭环完成。

## 状态定义

1. 已上线并可直接复用
2. 已验证但尚未形成正式路由
3. 官方存在，待生产验证
4. 官方存在，但权限/能力阻塞
5. 旧体系 / 高风险，不适合当前主线
6. 当前未识别到可用入口
7. 非 Alibaba API，但为任务闭环所必需的辅助能力

## A. 读取平台数据

| 能力项 | 当前状态 | 当前 WIKA 依据 | 对应入口/API | 是否与任务直接相关 | 是否已形成任务闭环 | 下一步 |
| --- | --- | --- | --- | --- | --- | --- |
| 产品列表主数据 | 1. 已上线并可直接复用 | 已有线上正式路由 | `/integrations/alibaba/wika/data/products/list` | 是 | 部分闭环，仅限原始读取 | 直接复用 |
| 产品详情主数据 | 1. 已上线并可直接复用 | 已有线上正式路由 | `/integrations/alibaba/wika/data/products/detail` -> `alibaba.icbu.product.get` | 是 | 部分闭环，仅限原始读取 | 直接复用 |
| 产品质量分 / PIS / 精品低质标识 | 1. 已上线并可直接复用 | 已有线上正式路由 | `/integrations/alibaba/wika/data/products/score` -> `alibaba.icbu.product.score.get` | 是 | 部分闭环，仅限原始读取 | 直接复用 |
| 产品分组 / 系列结构 | 1. 已上线并可直接复用 | 已有线上正式路由 | `/integrations/alibaba/wika/data/products/groups` -> `alibaba.icbu.product.group.get` | 是 | 部分闭环，仅限原始读取 | 直接复用 |
| 订单列表 | 1. 已上线并可直接复用 | 已有线上正式路由 | `/integrations/alibaba/wika/data/orders/list` -> `alibaba.seller.order.list` | 是 | 部分闭环，仅限原始读取 | 直接复用 |
| 订单详情 | 1. 已上线并可直接复用 | 已有线上正式路由 | `/integrations/alibaba/wika/data/orders/detail` -> `alibaba.seller.order.get` | 是 | 部分闭环，仅限原始读取 | 直接复用 |
| 订单资金明细 | 1. 已上线并可直接复用 | 已有线上正式路由 | `/integrations/alibaba/wika/data/orders/fund` -> `alibaba.seller.order.fund.get` | 是 | 部分闭环，仅限原始读取 | 直接复用 |
| 物流状态 / 发货单 | 1. 已上线并可直接复用 | 已有线上正式路由 | `/integrations/alibaba/wika/data/orders/logistics` -> `alibaba.seller.order.logistics.get` | 是 | 部分闭环，仅限原始读取 | 直接复用 |
| 店铺经营指标（UV/PV/点击/曝光/回复率） | 4. 官方存在，但权限/能力阻塞 | 已用当前生产闭环实测，返回 `InsufficientPermission` | `alibaba.mydata.overview.indicator.basic.get` | 是 | 否 | 保留阻塞证据，不进入路由开发 |
| 店铺国家 / 流量来源 / 热门词 | 4. 官方存在，但权限/能力阻塞 | 日期/行业辅助接口已用当前生产闭环实测，均返回 `InsufficientPermission` | `alibaba.mydata.overview.date.get` / `alibaba.mydata.overview.industry.get` | 是 | 否 | 保留阻塞证据，不进入路由开发 |
| 产品表现原始数据（曝光/点击/访客/关键词来源） | 4. 官方存在，但权限/能力阻塞 | 已用当前生产闭环实测，返回 `InsufficientPermission` | `alibaba.mydata.self.product.get` / `alibaba.mydata.self.product.date.get` | 是 | 否 | 保留阻塞证据，不进入路由开发 |

## B. 运营诊断

| 能力项 | 当前状态 | 当前 WIKA 依据 | 对应入口/API | 是否与任务直接相关 | 是否已形成任务闭环 | 下一步 |
| --- | --- | --- | --- | --- | --- | --- |
| 产品结构 / 系列 / 质量诊断 | 2. 已验证但尚未形成正式路由 | 原始数据已上线，但还没有最小经营聚合 | `products/list + detail + groups + score` | 是 | 否 | 进入最小经营聚合候选池 |
| 订单经营观察（订单状态、资金、物流） | 2. 已验证但尚未形成正式路由 | 原始数据已上线，但还没有最小经营聚合 | `orders/list + detail + fund + logistics` | 是 | 否 | 进入最小经营聚合候选池 |
| 店铺曝光 / 点击 / CTR / 趋势 | 4. 官方存在，但权限/能力阻塞 | 已在当前生产闭环下实测，返回 `InsufficientPermission` | `alibaba.mydata.overview.indicator.basic.get` | 是 | 否 | 停留在阻塞态 |
| 产品曝光 / 点击 / CTR / 趋势 | 4. 官方存在，但权限/能力阻塞 | 已在当前生产闭环下实测，返回 `InsufficientPermission` | `alibaba.mydata.self.product.get` | 是 | 否 | 停留在阻塞态 |
| 来源结构 | 4. 官方存在，但权限/能力阻塞 | `overview` 与 `self.product` 相关入口均已实测权限阻塞 | `alibaba.mydata.overview.*` / `alibaba.mydata.self.product.*` | 是 | 否 | 停留在阻塞态 |
| 国家结构 | 5. 旧体系 / 高风险，不适合当前主线 | 历史页面态曾可读，但不属于当前生产主线 | 本地页面态旧实现 / 数据管家候选 | 是 | 否 | 不纳入当前主线开发 |
| 热门产品 / 关键词 | 4. 官方存在，但权限/能力阻塞 | `self.product.get` 已在当前生产闭环下实测权限阻塞 | `alibaba.mydata.self.product.get` | 是 | 否 | 停留在阻塞态 |

## C. 产品上新与详情编写

| 能力项 | 当前状态 | 当前 WIKA 依据 | 对应入口/API | 是否与任务直接相关 | 是否已形成任务闭环 | 下一步 |
| --- | --- | --- | --- | --- | --- | --- |
| 产品创建 | 3. 官方存在，待生产验证 | 已识别到官方候选，但未做生产验证 | `alibaba.icbu.product.add` / `alibaba.icbu.product.schema.add` | 是 | 否 | 列入后续验证池 |
| 产品更新 | 3. 官方存在，待生产验证 | 已识别到官方候选，但未做生产验证 | `alibaba.icbu.product.update` / `alibaba.icbu.product.schema.update` / `alibaba.icbu.product.update.field` | 是 | 否 | 列入后续验证池 |
| 发布 / 上下架 | 6. 当前未识别到可用入口 | 尚未收口到可复用主线接口 | 待识别 | 是 | 否 | 暂不开发 |
| 图片 / 媒体上传 | 3. 官方存在，待生产验证 | 已识别到官方候选 | `alibaba.icbu.photobank.upload` | 是 | 否 | 列入后续验证池 |
| 类目 / 属性读取 | 3. 官方存在，待生产验证 | 已识别到官方候选 | `alibaba.icbu.category.get.new`、`alibaba.icbu.category.attr.get`、`alibaba.icbu.category.attribute.get` | 是 | 否 | 列入后续验证池 |
| 结构化产品 payload 草稿 | 7. 非 Alibaba API，但为任务闭环所必需的辅助能力 | 可基于已读产品字段与类目/属性模板生成 | 内部辅助能力 | 是 | 否 | 先等官方写入入口验证 |
| 标题 / 卖点 / 描述 / 关键词生成 | 7. 非 Alibaba API，但为任务闭环所必需的辅助能力 | 可由应用层生成，但不等于已创建平台产品 | 文案生成工作流 | 是 | 否 | 仅作辅助，不能误报为已上新 |

## D. 询盘与客户沟通

| 能力项 | 当前状态 | 当前 WIKA 依据 | 对应入口/API | 是否与任务直接相关 | 是否已形成任务闭环 | 下一步 |
| --- | --- | --- | --- | --- | --- | --- |
| 询盘列表 / 详情 | 6. 当前未识别到可用入口 | 当前没有生产无状态官方入口 | 未识别到稳定入口 | 是 | 否 | 暂停开发 |
| 消息列表 / 详情 | 6. 当前未识别到可用入口 | 当前没有生产无状态官方入口 | 未识别到稳定入口 | 是 | 否 | 暂停开发 |
| 客户列表 / 客户详情 / 客户画像 | 4. 官方存在，但权限/能力阻塞 | 已识别到官方文档，但当前偏 `router/rest + session + 聚石塔内调用` | `alibaba.seller.customer.batch.get` 等 | 是 | 否 | 保留阻塞证据，不开发 |
| 平台内回复动作 | 6. 当前未识别到可用入口 | 存在零散线索，但未证明形成稳定回复入口 | `alibaba.inquiry.cards.send` 线索不足 | 是 | 否 | 暂停开发 |
| 价格生成 | 7. 非 Alibaba API，但为任务闭环所必需的辅助能力 | 可基于产品与订单上下文生成报价建议 | 内部定价辅助能力 | 是 | 否 | 后续与询盘读写一起设计 |
| 产品细节调用 | 1. 已上线并可直接复用 | 已有产品详情、分组、质量分原始路由 | `products/detail + groups + score` | 是 | 否，仍缺平台写回 | 直接复用为沟通上下文 |
| 交期生成 | 7. 非 Alibaba API，但为任务闭环所必需的辅助能力 | 可结合产品/物流/经验规则生成 | 内部交期辅助能力 | 是 | 否 | 后续与询盘方案一起设计 |
| 效果图生成 / 处理 | 7. 非 Alibaba API，但为任务闭环所必需的辅助能力 | 需要图像工作流，不属于平台主 API | 图像生成/编辑能力 | 是 | 否 | 后续作为辅助能力补齐 |

## E. 订单草稿

| 能力项 | 当前状态 | 当前 WIKA 依据 | 对应入口/API | 是否与任务直接相关 | 是否已形成任务闭环 | 下一步 |
| --- | --- | --- | --- | --- | --- | --- |
| 平台内报价 / 订单草稿 / 交易创建 | 3. 官方存在，待生产验证 | 已识别到官方交易创建候选，但未做生产验证 | `alibaba.trade.order.create` | 是 | 否 | 列入后续验证池 |
| 外部结构化报价单 / 订单草稿文档 | 7. 非 Alibaba API，但为任务闭环所必需的辅助能力 | 即使平台内交易创建失败，也可形成外部草稿方案 | 文档/表单辅助方案 | 是 | 否 | 只能标注为替代方案 |

## F. 异常通知

| 能力项 | 当前状态 | 当前 WIKA 依据 | 对应入口/API | 是否与任务直接相关 | 是否已形成任务闭环 | 下一步 |
| --- | --- | --- | --- | --- | --- | --- |
| 邮件发送 | 7. 非 Alibaba API，但为任务闭环所必需的辅助能力 | 当前可依赖外部邮件能力，不属于 Alibaba 主 API | Gmail / SMTP / 外部通知能力 | 是 | 否 | 后续按异常分型接入 |
| 阻塞分类 | 7. 非 Alibaba API，但为任务闭环所必需的辅助能力 | 当前已有最小错误分型，可扩展为业务阻塞分类 | 应用内错误分类层 | 是 | 否 | 在新能力开发时同步扩展 |
| 人工接管触发条件 | 7. 非 Alibaba API，但为任务闭环所必需的辅助能力 | 当前只能靠规则设计，不属于平台接口 | 应用内规则 / 邮件通知 | 是 | 否 | 后续与通知能力一起定义 |

## 当前收口结论

- `WIKA` 已经具备一组可复用的官方原始读数据底座，但还没有形成完整经营聚合、产品写入闭环、询盘客户闭环和订单草稿闭环。
- 数据管家当前最相关的 5 个经营指标 API 已全部在当前生产闭环下实测，但结果统一为 `InsufficientPermission`，因此当前只能归入“官方存在，但权限/能力阻塞”。
- 当前最值得继续推进的不是再扩“所有 API”，而是围绕：
  1. 最小经营聚合
  2. 产品写入入口验证
  3. 订单草稿 / 交易创建入口验证
  4. 询盘 / 客户入口阻塞判断
  逐项推进。
