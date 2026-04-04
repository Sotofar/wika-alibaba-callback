# WIKA 已上线能力复用清单

更新时间：2026-04-04

本文只登记当前已经上线、已经过线上验收、可以直接复用的 `WIKA` 能力。它们是当前主线的稳定资产，不需要重复做适配性验证。

## 1. 底层稳定资产

| 能力 | 当前状态 | 说明 |
| --- | --- | --- |
| Railway production 认证闭环 | 已上线并可直接复用 | 已验证 OAuth callback、runtime token 落盘、bootstrap refresh token 写回、冷启动 `refresh:startup_bootstrap` |
| 官方 `/sync + access_token + sha256` 调用层 | 已上线并可直接复用 | 当前所有已验证官方原始路由都复用这条链路 |
| 最小错误分型 | 已上线并可直接复用 | 当前统一可区分 `parameter_error / permission_error / gateway_error / platform_api_error` |
| 写侧安全护栏 | 已落盘并可直接复用 | 已有阻塞分类、人工接管触发规则、结构化告警样例，不等于已具备真实写回权限 |

## 2. 已上线的正式原始只读路由

| 路由 | 官方接口 | 当前作用 | 线上状态 |
| --- | --- | --- | --- |
| `/integrations/alibaba/wika/data/products/list` | `alibaba.icbu.product.list` | 产品主数据列表 | 已上线并已线上验证 |
| `/integrations/alibaba/wika/data/products/detail` | `alibaba.icbu.product.get` | 产品详情主数据 | 已上线并已线上验证 |
| `/integrations/alibaba/wika/data/products/score` | `alibaba.icbu.product.score.get` | 产品质量分 / PIS / 问题映射 | 已上线并已线上验证 |
| `/integrations/alibaba/wika/data/products/groups` | `alibaba.icbu.product.group.get` | 产品分组 / 系列结构 | 已上线并已线上验证 |
| `/integrations/alibaba/wika/data/categories/tree` | `alibaba.icbu.category.get.new` | 商品发布类目树读取 | 已上线并已线上验证 |
| `/integrations/alibaba/wika/data/categories/attributes` | `alibaba.icbu.category.attr.get` + `alibaba.icbu.category.attribute.get` | 类目属性定义与属性值读取 | 已上线并已线上验证 |
| `/integrations/alibaba/wika/data/orders/list` | `alibaba.seller.order.list` | 最小订单列表 | 已上线并已线上验证 |
| `/integrations/alibaba/wika/data/orders/detail` | `alibaba.seller.order.get` | 最小订单详情 | 已上线并已线上验证 |
| `/integrations/alibaba/wika/data/orders/fund` | `alibaba.seller.order.fund.get` | 支付 / 到账 / 退款 / 服务费原始数据 | 已上线并已线上验证 |
| `/integrations/alibaba/wika/data/orders/logistics` | `alibaba.seller.order.logistics.get` | 物流状态 / 发货单原始数据 | 已上线并已线上验证 |

## 3. 已上线的派生只读路由

| 路由 | 当前作用 | 说明 |
| --- | --- | --- |
| `/integrations/alibaba/wika/reports/products/management-summary` | 产品管理摘要 | 只属于最小派生摘要，不等于完整经营层 summary |

## 4. 已可复用但不等于平台写回能力的辅助能力

| 能力 | 当前状态 | 说明 |
| --- | --- | --- |
| 产品草稿生成 helper | 已实现可复用 | 可输出标题、卖点、描述、关键词和结构化 payload 草稿，但不发布真实商品 |
| 人工接管告警样例 | 已实现可复用 | 结构化待处理/告警产物已落盘，可作为后续通知能力的基础 |

## 5. 当前明确不能误报的边界

1. 已有原始只读路由，不等于经营层模块已完成。
2. 已有产品详情、分组、质量分，不等于产品上新闭环已打通。
3. 已有订单明细、资金、物流原始数据，不等于订单经营驾驶舱已完成。
4. 已有产品草稿生成 helper，不等于平台商品已创建或已发布。
5. 已有写侧安全护栏，不等于真实写操作已经允许自动执行。
