# WIKA 已上线能力复用清单

更新时间：2026-04-04

本文只登记当前已经上线并已线上验证、可以直接复用的 `WIKA` 能力。它们是当前阶段的稳定资产，不需要重复做适配性验证。

## 1. 统一底层能力

| 能力 | 当前状态 | 说明 | 直接服务的任务 |
| --- | --- | --- | --- |
| 生产认证闭环 | 已上线并可直接复用 | 已验证 Railway production、OAuth callback、runtime token 落盘、bootstrap refresh token 写回、冷启动 `refresh:startup_bootstrap` | 所有需要平台 API 的任务 |
| 统一官方 `/sync` 调用层 | 已上线并可直接复用 | 已验证 `https://open-api.alibaba.com/sync + access_token + sha256` | 任务 1、任务 3、任务 5 的官方 API 主线 |
| 最小错误分型 | 已上线并可直接复用 | 已区分 `parameter_error / permission_error / gateway_error / platform_api_error` 等最小类别 | 所有读写任务 |

## 2. 已上线原始读数据路由

| 路由 | 对应官方接口 | 当前可读核心字段 | 主要用途 | 对应最终任务 |
| --- | --- | --- | --- | --- |
| `/integrations/alibaba/wika/data/products/list` | `alibaba.icbu.product.list` | `product_id`、`subject`、`status`、`group_name`、`gmt_modified` | 产品主数据总览 | 任务 1、任务 2 |
| `/integrations/alibaba/wika/data/products/detail` | `alibaba.icbu.product.get` | `product_id`、`subject`、`category_id`、`description`、`keywords`、`pc_detail_url`、`gmt_create`、`gmt_modified` | 产品详情读取、详情质量观察 | 任务 1、任务 2、任务 4 |
| `/integrations/alibaba/wika/data/products/score` | `alibaba.icbu.product.score.get` | `boutique_tag`、`final_score`、`problem_map` | 产品质量分 / PIS 观察 | 任务 1、任务 2 |
| `/integrations/alibaba/wika/data/products/groups` | `alibaba.icbu.product.group.get` | `group_id`、`group_name`、`parent_id`、`children_group`、`children_id_list` | 系列 / 分组结构读取 | 任务 1、任务 2 |
| `/integrations/alibaba/wika/data/orders/list` | `alibaba.seller.order.list` | `trade_id`、`create_date`、`modify_date` | 最小订单列表读取 | 任务 1、任务 2 |
| `/integrations/alibaba/wika/data/orders/detail` | `alibaba.seller.order.get` | `trade_status`、`buyer`、`amount`、`shipment_fee`、`order_products` | 最小订单详情读取 | 任务 1、任务 2、任务 5 |
| `/integrations/alibaba/wika/data/orders/fund` | `alibaba.seller.order.fund.get` | `fund_pay_list`、`service_fee` | 支付 / 到账 / 退款 / 服务费口径 | 任务 1、任务 2、任务 5 |
| `/integrations/alibaba/wika/data/orders/logistics` | `alibaba.seller.order.logistics.get` | `logistic_status`、`shipping_order_list` | 物流状态 / 发货单读取 | 任务 1、任务 2 |

## 3. 已上线派生路由

| 路由 | 当前状态 | 说明 | 使用边界 |
| --- | --- | --- | --- |
| `/integrations/alibaba/wika/reports/products/management-summary` | 已上线并可直接复用 | 基于产品主数据形成的最小产品管理摘要 | 只能视为派生摘要，不等于完整经营聚合 |

## 4. 当前最值得直接复用的组合

### 任务 1：读取平台数据
- 产品数据：`products/list + detail + score + groups`
- 订单数据：`orders/list + detail + fund`
- 物流数据：`orders/logistics`

### 任务 2：最小经营诊断入口
- 产品结构 / 系列 / PIS：`products/list + detail + score + groups`
- 订单经营观察：`orders/list + detail + fund + logistics`

### 任务 4：询盘与客户沟通的辅助上下文
- 产品细节与卖点调用：`products/detail + score + groups`
- 价格与交期建议的输入底座：`products/detail + orders/fund + orders/logistics`

## 5. 明确不应误报的边界

- 已有原始路由上线，不等于经营层模块已经完成。
- 已有产品详情读取，不等于产品上新闭环已经打通。
- 已有订单明细读取，不等于订单草稿/交易创建已经打通。
- 已有产品/订单原始数据，不等于店铺级曝光、点击、来源、国家结构已经打通。
- 已有产品与订单原始数据，也不等于平台内询盘回复能力已经打通。

## 6. 本轮新增的“不可直接复用”结论

以下接口虽然与经营数据高度相关，但在当前 `WIKA` 生产认证闭环下已实测返回 `InsufficientPermission`，因此不能加入“已上线可复用能力”：

- `alibaba.mydata.overview.indicator.basic.get`
- `alibaba.mydata.self.product.get`
- `alibaba.mydata.self.product.date.get`
- `alibaba.mydata.overview.date.get`
- `alibaba.mydata.overview.industry.get`

它们当前只能归类为：
- `官方存在，但权限/能力阻塞`
