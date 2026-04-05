# WIKA 已上线能力复用清单

更新时间：2026-04-05

本文只登记当前已经上线、已经过线上验收、可直接复用的 `WIKA` 能力，以及已沉淀但不能误报为平台写回闭环的辅助能力。

## 1. 底层稳定资产

| 能力 | 当前状态 | 说明 |
| --- | --- | --- |
| Railway production 认证闭环 | 已上线并可直接复用 | 已验证 OAuth callback、runtime token 落盘、bootstrap refresh token 写回、冷启动 `refresh:startup_bootstrap` |
| 官方 `/sync + access_token + sha256` 调用层 | 已上线并可直接复用 | 当前所有已验证官方原始路由都走这条链路 |
| 最小错误分型 | 已上线并可直接复用 | 当前统一可区分 `parameter_error / permission_error / gateway_error / platform_api_error` |
| 写侧安全护栏 | 已沉淀并可直接复用 | 已有阻塞分类、人工接管规则、结构化告警样例、低风险边界判断对象 |
| 正式通知闭环（provider-agnostic + fallback） | 已上线并可直接复用 | 已有 provider-agnostic notifier；在无 provider、配置不完整或调用失败时，都会把告警安全退回 `data/alerts/outbox`，不会静默丢失 |
| 真实 provider 预接线与 dry-run | 已沉淀并可直接复用 | `webhook` / `resend` 适配层已落地，已完成 `none / 配置不完整 / dry-run` 三类验证；phase13 又确认当前 shell 与 production 都无真实 provider 配置，因此不能误写成真实通知已送达 |

## 2. 已上线的正式原始只读路由

| 路由 | 官方接口 | 当前作用 | 线上状态 |
| --- | --- | --- | --- |
| `/integrations/alibaba/wika/data/products/list` | `alibaba.icbu.product.list` | 产品主数据列表 | 已上线并已线上验证 |
| `/integrations/alibaba/wika/data/products/detail` | `alibaba.icbu.product.get` | 产品详情主数据 | 已上线并已线上验证 |
| `/integrations/alibaba/wika/data/products/score` | `alibaba.icbu.product.score.get` | 产品质量分 / PIS / 问题映射 | 已上线并已线上验证 |
| `/integrations/alibaba/wika/data/products/groups` | `alibaba.icbu.product.group.get` | 产品分组 / 系列结构 | 已上线并已线上验证 |
| `/integrations/alibaba/wika/data/products/schema` | `alibaba.icbu.product.schema.get` | 产品 schema 原始读取 | 已上线并已线上验证 |
| `/integrations/alibaba/wika/data/products/schema/render` | `alibaba.icbu.product.schema.render` | 产品 schema render 原始读取 | 已上线并已线上验证 |
| `/integrations/alibaba/wika/data/products/schema/render/draft` | `alibaba.icbu.product.schema.render.draft` | draft 渲染可观测能力 | 已上线并已线上验证 |
| `/integrations/alibaba/wika/data/categories/tree` | `alibaba.icbu.category.get.new` | 商品发布类目树读取 | 已上线并已线上验证 |
| `/integrations/alibaba/wika/data/categories/attributes` | `alibaba.icbu.category.attr.get` + `alibaba.icbu.category.attribute.get` | 类目属性定义与属性值读取 | 已上线并已线上验证 |
| `/integrations/alibaba/wika/data/media/list` | `alibaba.icbu.photobank.list` | 图片银行素材列表 / 可观测能力 | 已上线并已线上验证 |
| `/integrations/alibaba/wika/data/media/groups` | `alibaba.icbu.photobank.group.list` | 图片银行分组可观测能力 | 已上线并已线上验证 |
| `/integrations/alibaba/wika/data/orders/list` | `alibaba.seller.order.list` | 最小订单列表 | 已上线并已线上验证 |
| `/integrations/alibaba/wika/data/orders/detail` | `alibaba.seller.order.get` | 最小订单详情 | 已上线并已线上验证 |
| `/integrations/alibaba/wika/data/orders/fund` | `alibaba.seller.order.fund.get` | 支付 / 到账 / 退款 / 服务费原始数据 | 已上线并已线上验证 |
| `/integrations/alibaba/wika/data/orders/logistics` | `alibaba.seller.order.logistics.get` | 物流状态 / 发货单原始数据 | 已上线并已线上验证 |
| `/integrations/alibaba/wika/data/orders/draft-types` | `alibaba.seller.trade.query.drafttype` | 订单起草类型权限探针 | 已上线并已线上验证 |

## 3. 已上线的派生只读路由

| 路由 | 当前作用 | 说明 |
| --- | --- | --- |
| `/integrations/alibaba/wika/reports/products/management-summary` | 产品管理摘要 | 仅属于最小派生摘要，不等于完整经营层 summary |
| `/integrations/alibaba/wika/reports/operations/minimal-diagnostic` | 最小经营诊断层 | 严格基于现有真实产品/订单读侧，只覆盖产品质量/结构与订单执行信号，不等于完整经营驾驶舱 |
| `/integrations/alibaba/wika/reports/products/minimal-diagnostic` | 产品子诊断 | 严格基于 products 真实读侧字段拆出的子报告，只覆盖质量/内容/结构信号 |
| `/integrations/alibaba/wika/reports/orders/minimal-diagnostic` | 订单子诊断 | 严格基于 orders 真实读侧字段拆出的子报告，只覆盖执行/物流/资金可见信号 |
| `/integrations/alibaba/wika/tools/reply-draft` | 外部回复草稿工具 | 只生成外部 reply draft、blocker 分层、follow-up questions、mockup requirement pack、handoff_fields 和 alert payload，不发送平台内回复 |
| `/integrations/alibaba/wika/tools/order-draft` | 外部订单草稿工具 | 只生成外部 order draft package、required_manual_fields、blocker 分层、follow-up questions、handoff_fields 与 alert payload，不创建平台订单 |

## 4. 已上线的权限探针型只读路由

| 路由 | 当前作用 | 说明 |
| --- | --- | --- |
| `/integrations/alibaba/wika/data/customers/list` | customers list 读侧参数/权限探针 | 已真实接到 `alibaba.seller.customer.batch.get`；当前用于验证 `/sync + access_token + sha256` 闭环、缺参分型与权限分型，不等于客户列表已稳定可读 |

## 5. 已沉淀、可复用，但不等于平台写回闭环的辅助能力

| 能力 | 当前状态 | 说明 |
| --- | --- | --- |
| schema-aware 产品草稿 helper | 已实现可复用 | 可输出标题、卖点、描述、关键词、schema 字段映射和结构化 payload 草稿，但不发布真实商品 |
| 产品安全草稿链路说明 | 已落盘可复用 | 已明确 schema / render / 类目 / 属性如何进入草稿链路，以及人工补齐字段清单 |
| 产品草稿链路样例 | 已落盘可复用 | 已基于真实 WIKA 读侧数据生成更完整的 schema-aware 样例产物 |
| 低风险写侧边界规则 | 已落盘可复用 | 已明确 `photobank.upload` 与 `product.add.draft` 当前都不能继续实写验证 |
| 可观测 / 可回滚证据规则 | 已落盘可复用 | 已明确 media 可观测能力、draft 可区分能力以及“尚未具备最小真实写入前置条件” |
| 外部订单草稿 helper | 已实现可复用 | 可输出买家、产品、价格、交期、物流、付款等结构化草稿，但不等于平台订单已创建 |
| 外部回复草稿 helper | 已实现可复用 | 可输出 reply subject/opening/body/closing、price blocker、lead time blocker、follow-up questions、mockup requirement pack 和 escalation recommendation，但不等于平台内已回复 |
| 外部草稿工作流模板 | 已实现可复用 | 已沉淀回复输入模板、订单输入模板和人工补单模板，适合直接进入人工接手流程 |
| 订单入口候选清单 | 已落盘可复用 | 已明确 `order.create` 与 `drafttype` 的边界、参数层级与收口方式 |
| media 管理侧证据 | 已沉淀可复用 | `photobank.group.operate` 已在 production 闭环下过授权层，但当前仍不能证明低风险管理/清理边界 |
| draft 管理侧证据 | 已沉淀可复用 | 当前公开官方文档中，除 `schema.render.draft` 外未识别到新增 draft 查询 / 删除 / 管理接口 |
| 人工接管告警样例 | 已落盘可复用 | 可作为后续通知能力的结构化输入 |
| 正式通知样例与能力说明 | 已落盘可复用 | 已有通知能力盘点、正式通知闭环说明、正式通知样例，可直接指导后续接通 webhook / Resend，并清楚区分 dry-run 与真实送达 |

## 6. 当前明确不能误报的边界

1. 已有原始只读路由或最小诊断层，不等于经营层模块已完成。
2. 已有产品详情、分组、质量分、schema、schema render，不等于产品上新闭环已完成。
3. 已有订单明细、资金、物流原始数据，不等于订单经营驾驶舱已完成。
4. 已有 schema-aware 草稿 helper，不等于平台商品已创建或已发布。
5. `product.add.draft` 过了授权层，不等于已证明存在安全草稿模式。
6. `photobank.upload` 过了授权层，不等于已证明存在低风险可用上传模式。
7. `media/list` 与 `media/groups` 已上线，不等于已证明素材可清理、可回滚。
8. `schema/render/draft` 已上线，不等于已证明 `add.draft` 可安全执行。
9. 已有写侧安全护栏，不等于允许自动执行真实写操作。
10. `photobank.group.operate` 已过授权层，不等于已证明素材可清理、可回滚。
11. 当前没有新增 draft 管理接口，不等于 draft 已经可删除、可审计、可回滚。
12. `customers/list` 已上线，不等于客户列表已经在当前权限下可稳定读取。
13. `customers` 家族过了授权层，不等于 inquiry / message / customer 读写闭环已打通。
14. 当前默认可走 outbox fallback，且代码已支持 webhook / resend dry-run；但 phase13 已明确确认当前没有真实 provider 配置，这仍不等于真实邮件或 webhook 已经送达用户。
15. `orders/draft-types` 已上线，不等于平台订单草稿已可安全创建。
16. `alibaba.trade.order.create` 已过参数层，不等于存在安全创单边界。
17. 外部订单草稿 helper 已落地，不等于平台内订单已起草成功。
18. `products/orders` 子诊断已上线，不等于完整经营驾驶舱已完成。
19. `/tools/reply-draft` 已上线，不等于平台内回复已发送。
20. `/tools/order-draft` 已上线，不等于平台内订单已创建。
21. 模板与 blocker 分层已补齐，不等于平台内能力已打通。

## 当前一句话结论

WIKA 当前已经有一套稳定可复用的读侧原始路由底座，以及更扎实的 schema-aware 产品草稿、外部回复草稿、外部订单草稿与人工补单模板工作流；但写侧仍停留在“草稿准备 + 风险边界判断”，还没有进入真实平台写入闭环。
