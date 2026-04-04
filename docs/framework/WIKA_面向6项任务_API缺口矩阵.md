# WIKA 面向 6 项任务 API 缺口矩阵

更新时间：2026-04-04

本文只面向 `WIKA` 主线，按最终 6 项任务记录当前能力状态。状态口径固定为：
1. 已上线并可直接复用
2. 已验证但尚未形成正式路由
3. 官方存在，待生产验证
4. 官方存在，但权限/能力阻塞
5. 旧体系 / 高风险，不适合当前主线
6. 当前未识别到可用入口
7. 非 Alibaba API，但为任务闭环所必需的辅助能力

## A. 读取平台数据

| 能力项 | 当前状态 | 当前依据 | 对应入口 | 是否已形成任务闭环能力 |
| --- | --- | --- | --- | --- |
| 产品列表主数据 | 1 | 已上线正式原始路由 | `/integrations/alibaba/wika/data/products/list` | 否 |
| 产品详情主数据 | 1 | 已上线正式原始路由 | `/integrations/alibaba/wika/data/products/detail` | 否 |
| 产品质量分 / PIS 线索 | 1 | 已上线正式原始路由 | `/integrations/alibaba/wika/data/products/score` | 否 |
| 产品分组 / 系列结构 | 1 | 已上线正式原始路由 | `/integrations/alibaba/wika/data/products/groups` | 否 |
| 商品发布类目树 | 1 | 已上线正式原始路由 | `/integrations/alibaba/wika/data/categories/tree` | 否 |
| 类目属性定义与属性值 | 1 | 已上线正式原始路由 | `/integrations/alibaba/wika/data/categories/attributes` | 否 |
| 产品 schema | 1 | 已上线正式原始路由 | `/integrations/alibaba/wika/data/products/schema` | 否 |
| 产品 schema render | 1 | 已上线正式原始路由 | `/integrations/alibaba/wika/data/products/schema/render` | 否 |
| 订单列表 | 1 | 已上线正式原始路由 | `/integrations/alibaba/wika/data/orders/list` | 否 |
| 订单详情 | 1 | 已上线正式原始路由 | `/integrations/alibaba/wika/data/orders/detail` | 否 |
| 订单资金数据 | 1 | 已上线正式原始路由 | `/integrations/alibaba/wika/data/orders/fund` | 否 |
| 订单物流数据 | 1 | 已上线正式原始路由 | `/integrations/alibaba/wika/data/orders/logistics` | 否 |
| 店铺经营指标（UV/PV/曝光/点击/回复率） | 4 | 当前 production 实测统一 `InsufficientPermission` | `alibaba.mydata.overview.indicator.basic.get` | 否 |
| 店铺概览日期/行业维度 | 4 | 当前 production 实测统一 `InsufficientPermission` | `overview.date.get` / `overview.industry.get` | 否 |
| 产品表现原始数据（曝光/点击/访客/关键词） | 4 | 当前 production 实测统一 `InsufficientPermission` | `alibaba.mydata.self.product.get` / `self.product.date.get` | 否 |

## B. 运营诊断

| 能力项 | 当前状态 | 当前依据 | 对应入口 | 是否已形成任务闭环能力 |
| --- | --- | --- | --- | --- |
| 产品结构诊断底座 | 2 | 原始数据已齐，但未形成最小经营聚合 | `products/list + detail + groups + score` | 否 |
| 订单经营观察底座 | 2 | 原始数据已齐，但未形成最小经营聚合 | `orders/list + detail + fund + logistics` | 否 |
| 店铺曝光 / 点击 / CTR / 趋势 | 4 | 数据管家权限阻塞 | `alibaba.mydata.overview.indicator.basic.get` | 否 |
| 产品曝光 / 点击 / CTR / 趋势 | 4 | 数据管家权限阻塞 | `alibaba.mydata.self.product.get` | 否 |
| 来源结构 / 国家结构 / 热门关键词 | 4 | 数据管家权限阻塞 | `alibaba.mydata.*` | 否 |

## C. 产品上新与详情编写

| 能力项 | 当前状态 | 当前依据 | 对应入口 | 是否已形成任务闭环能力 |
| --- | --- | --- | --- | --- |
| 类目树读取 | 1 | 已上线正式原始路由 | `/integrations/alibaba/wika/data/categories/tree` | 否 |
| 类目属性读取 | 1 | 已上线正式原始路由 | `/integrations/alibaba/wika/data/categories/attributes` | 否 |
| schema 读取 | 1 | 已上线正式原始路由 | `/integrations/alibaba/wika/data/products/schema` | 否 |
| schema render 读取 | 1 | 已上线正式原始路由 | `/integrations/alibaba/wika/data/products/schema/render` | 否 |
| schema-aware payload 草稿生成 | 7 | 已实现 helper 与样例产物 | `shared/data/modules/alibaba-product-drafts.js` | 否 |
| 标题 / 卖点 / 描述 / 关键词生成 | 7 | 已集成到草稿 helper | `buildWikaProductDraft()` | 否 |
| 图片 / 媒体上传 | 2 | 已过授权层，但低风险边界未被证明 | `alibaba.icbu.photobank.upload` | 否 |
| 安全 draft 创建 | 2 | 已过授权层，但低风险边界未被证明 | `alibaba.icbu.product.add.draft` | 否 |
| 产品创建（正式 add） | 2 | 已过授权层，但不允许真实发布 | `alibaba.icbu.product.add` | 否 |
| 产品创建（schema add） | 2 | 已过授权层，但不允许真实发布 | `alibaba.icbu.product.schema.add` | 否 |
| 产品更新（正式 update） | 2 | 已过授权层，但不允许真实线上修改 | `alibaba.icbu.product.update` | 否 |
| 产品更新（schema update） | 2 | 已过授权层，但不允许真实线上修改 | `alibaba.icbu.product.schema.update` | 否 |
| 产品字段级更新 | 2 | 已过授权层，但不允许真实线上修改 | `alibaba.icbu.product.update.field` | 否 |
| 低风险写侧边界判断 | 7 | 已沉淀边界文档与阻塞规则 | `docs/framework/WIKA_低风险写侧边界验证.md` | 否 |

## D. 询盘与客户沟通

| 能力项 | 当前状态 | 当前依据 | 对应入口 | 是否已形成任务闭环能力 |
| --- | --- | --- | --- | --- |
| 询盘列表 / 详情 | 6 | 当前未识别到稳定生产入口 | 待识别 | 否 |
| 消息列表 / 详情 | 6 | 当前未识别到稳定生产入口 | 待识别 | 否 |
| 客户列表 / 客户详情 / 客户画像 | 4 | 官方存在，但当前证据仍偏 `router/rest + session + 聚石塔内调用` | `alibaba.seller.customer.*` | 否 |
| 平台内回复动作 | 6 | 当前没有稳定可用入口 | 待识别 | 否 |
| 价格生成 | 7 | 可设计为应用内辅助能力 | 待后续设计 | 否 |
| 产品细节调用 | 1 | 已有 detail/groups/score 等原始路由可复用 | 既有原始路由 | 否 |
| 交期生成 | 7 | 可设计为应用内辅助能力 | 待后续设计 | 否 |
| 效果图生成 / 处理 | 7 | 非 Alibaba API，但任务闭环需要 | 待后续接图像工作流 | 否 |

## E. 订单草稿

| 能力项 | 当前状态 | 当前依据 | 对应入口 | 是否已形成任务闭环能力 |
| --- | --- | --- | --- | --- |
| 平台内订单草稿 / 交易创建 | 3 | 已识别候选，但尚未生产验证 | `alibaba.trade.order.create` | 否 |
| 外部结构化报价单 / 订单草稿文档 | 7 | 可做替代方案，但不能误报为平台内创建成功 | 待后续设计 | 否 |

## F. 异常通知

| 能力项 | 当前状态 | 当前依据 | 对应入口 | 是否已形成任务闭环能力 |
| --- | --- | --- | --- | --- |
| 阻塞分类 | 7 | 已实现 helper | `shared/data/modules/alibaba-write-guardrails.js` | 否 |
| 人工接管规则 | 7 | 已有规则文档 | `docs/framework/WIKA_人工接管规则.md` | 否 |
| 结构化待处理 / 告警产物 | 7 | 已有样例产物 | `docs/framework/WIKA_人工接管告警样例.json` | 否 |
| 邮件发送 | 7 | 非 Alibaba API，但闭环需要 | 待后续选择 Gmail/SMTP 能力 | 否 |

## 当前收口结论

1. 当前最稳的已上线能力，集中在产品主数据、产品结构、订单原始数据、类目/属性/schema 读取。
2. mydata / overview / self.product 这条经营指标路线当前统一停在“权限/能力阻塞”，不再作为当前主线循环。
3. 写侧方向已经推进到 schema-aware 草稿准备层，但 photobank.upload 与 product.add.draft 的低风险边界都还未被证明。
4. 当前最缺的仍然是：经营指标入口、最小经营聚合、询盘/客户、订单草稿与异常通知闭环。
