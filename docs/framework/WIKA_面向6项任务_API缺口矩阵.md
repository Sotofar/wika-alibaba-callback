# WIKA 面向 6 项任务 API 缺口矩阵

更新时间：2026-04-10

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
| 图片银行素材可观测能力 | 1 | 已上线正式原始路由，已验证可列出真实素材 | `/integrations/alibaba/wika/data/media/list` | 否 |
| 图片银行分组可观测能力 | 1 | 已上线正式原始路由，已验证存在分组查询通道 | `/integrations/alibaba/wika/data/media/groups` | 否 |
| 图片银行分组管理能力 | 2 | `alibaba.icbu.photobank.group.operate` 已在 production 闭环下返回业务参数错误，说明已过授权层；但当前仍不能证明低风险管理/清理边界 | `alibaba.icbu.photobank.group.operate` | 否 |
| draft 渲染可观测能力 | 1 | 已上线正式原始路由，已验证存在专门 draft 渲染通道 | `/integrations/alibaba/wika/data/products/schema/render/draft` | 否 |
| 订单列表 | 1 | 已上线正式原始路由 | `/integrations/alibaba/wika/data/orders/list` | 否 |
| 订单详情 | 1 | 已上线正式原始路由；阶段 18 对账后确认当前 public list 返回的遮罩 `trade_id` 不能直接闭合 detail 契约 | `/integrations/alibaba/wika/data/orders/detail` | 否 |
| 订单资金数据 | 1 | 已上线正式原始路由；阶段 18 对账后确认当前 public list 返回的遮罩 `trade_id` 不能直接闭合 fund 契约 | `/integrations/alibaba/wika/data/orders/fund` | 否 |
| 订单物流数据 | 1 | 已上线正式原始路由；阶段 18 对账后确认当前 public list 返回的遮罩 `trade_id` 不能直接闭合 logistics 契约 | `/integrations/alibaba/wika/data/orders/logistics` | 否 |
| 订单起草类型权限 | 1 | 已上线正式原始路由；真实返回 `types=["TA"]` | `/integrations/alibaba/wika/data/orders/draft-types` | 否 |
| 店铺经营指标（UV/PV/曝光/点击/回复率） | 4 | 阶段 17 实测仍为 `InsufficientPermission`；阶段 18 已收口为对外权限清障包，可直接用于申请与复验 | `alibaba.mydata.overview.indicator.basic.get` | 否 |
| 店铺概览日期/行业维度 | 4 | 阶段 17 实测仍为 `InsufficientPermission`；阶段 18 已收口为对外权限清障包，可直接用于申请与复验 | `overview.date.get` / `overview.industry.get` | 否 |
| 产品表现原始数据（曝光/点击/访客/关键词） | 4 | 阶段 17 实测仍为 `InsufficientPermission`；阶段 18 已收口为对外权限清障包，可直接用于申请与复验 | `alibaba.mydata.self.product.get` / `self.product.date.get` | 否 |
| 最小经营诊断层原始聚合 | 1 | 已上线正式诊断路由；严格基于现有真实产品/订单读侧 | `/integrations/alibaba/wika/reports/operations/minimal-diagnostic` | 否 |

## B. 运营诊断

| 能力项 | 当前状态 | 当前依据 | 对应入口 | 是否已形成任务闭环能力 |
| --- | --- | --- | --- | --- |
| 产品结构诊断底座 | 1 | 已形成最小经营诊断层中的产品诊断部分 | `products/list + detail + groups + score` | 否 |
| 订单经营观察底座 | 1 | 已形成最小经营诊断层中的订单执行诊断部分；阶段 17 证明 `order.list` 可真实返回、趋势可部分派生；阶段 18 进一步固定 `detail / fund / logistics` 的 public chaining 契约仍未闭合 | `orders/list + detail + fund + logistics` | 否 |
| 最小经营诊断报告 | 1 | 已上线正式诊断路由；输出 available_signals / findings / recommendations / blockers | `/integrations/alibaba/wika/reports/operations/minimal-diagnostic` | 否 |
| 产品子诊断报告 | 1 | 已上线正式诊断路由；严格基于 products 真实读侧字段形成更细诊断 | `/integrations/alibaba/wika/reports/products/minimal-diagnostic` | 否 |
| 订单子诊断报告 | 1 | 已上线正式诊断路由；严格基于 orders 真实读侧字段形成更细诊断 | `/integrations/alibaba/wika/reports/orders/minimal-diagnostic` | 否 |
| 店铺曝光 / 点击 / CTR / 趋势 | 4 | 阶段 17 production 复核仍为权限阻塞 | `alibaba.mydata.overview.indicator.basic.get` | 否 |
| 产品曝光 / 点击 / CTR / 趋势 | 4 | 阶段 17 production 复核仍为权限阻塞 | `alibaba.mydata.self.product.get` | 否 |
| 来源结构 / 国家结构 / 热门关键词 | 4 | 阶段 17 production 复核仍缺公开可读字段；当前未见公开 source / country 覆盖 | `alibaba.mydata.*` | 否 |

## C. 产品上新与详情编写

| 能力项 | 当前状态 | 当前依据 | 对应入口 | 是否已形成任务闭环能力 |
| --- | --- | --- | --- | --- |
| 类目树读取 | 1 | 已上线正式原始路由 | `/integrations/alibaba/wika/data/categories/tree` | 否 |
| 类目属性读取 | 1 | 已上线正式原始路由 | `/integrations/alibaba/wika/data/categories/attributes` | 否 |
| schema 读取 | 1 | 已上线正式原始路由 | `/integrations/alibaba/wika/data/products/schema` | 否 |
| schema render 读取 | 1 | 已上线正式原始路由 | `/integrations/alibaba/wika/data/products/schema/render` | 否 |
| schema-aware payload 草稿生成 | 7 | 已实现 helper 与样例产物 | `shared/data/modules/alibaba-product-drafts.js` | 否 |
| 标题 / 卖点 / 描述 / 关键词生成 | 7 | 已集成到草稿 helper | `buildWikaProductDraft()` | 否 |
| 图片 / 媒体上传 | 5 | 已过授权层，但当前缺少可隔离、可清理、可回滚证据 | `alibaba.icbu.photobank.upload` | 否 |
| 图片银行分组管理 / 清理证据 | 2 | `photobank.group.operate` 已过授权层，但成功路径属于真实分组写操作；当前仍不证明可回滚 | `alibaba.icbu.photobank.group.operate` | 否 |
| 发品权限 precheck | 3 | 阶段 19 已在 `ICBU－商品` 官方文档里确认方法存在，可能成为更低风险发品权限探针，但尚未做 production 验证 | `alibaba.icbu.product.type.available.get` | 否 |
| draft 渲染可观测能力 | 1 | 已上线正式原始路由；已证明存在 draft 独立渲染通道 | `/integrations/alibaba/wika/data/products/schema/render/draft` | 否 |
| 草稿上游明文 ID 入口 | 3 | 阶段 19 已在 `ICBU－商品` 官方文档里确认 `schema.add.draft` 明确返回“商品草稿明文id”，但当前仍未做生产验证，且它属于写侧草稿入口 | `alibaba.icbu.product.schema.add.draft` | 否 |
| 商品 ID 明文 / 密文契约辅助 | 3 | 阶段 19 已在 `ICBU－商品` 官方文档里确认 `product.id.encrypt / decrypt` 存在，可用于未来商品侧 ID 契约对账 | `alibaba.icbu.product.id.encrypt` / `alibaba.icbu.product.id.decrypt` | 否 |
| draft 查询 / 删除 / 管理接口 | 6 | 阶段 19 完整阅读 `ICBU－商品` 左侧栏 47 页后，仍未识别到明确公开入口 | 待识别 | 否 |
| 图片 / 素材删除 / 清理接口 | 6 | 阶段 19 完整阅读 `ICBU－商品` 左侧栏 47 页后，仍未识别到明确公开入口 | 待识别 | 否 |
| 安全 draft 创建 | 5 | 已过授权层，但当前缺少非发布、可清理、可回滚证据 | `alibaba.icbu.product.add.draft` | 否 |
| 产品创建（正式 add） | 5 | 已过授权层，但属于真实发布高风险入口 | `alibaba.icbu.product.add` | 否 |
| 产品创建（schema add） | 5 | 已过授权层，但属于真实发布高风险入口 | `alibaba.icbu.product.schema.add` | 否 |
| 产品更新（正式 update） | 5 | 已过授权层，但属于真实线上修改高风险入口 | `alibaba.icbu.product.update` | 否 |
| 产品更新（schema update） | 5 | 已过授权层，但属于真实线上修改高风险入口 | `alibaba.icbu.product.schema.update` | 否 |
| 产品字段级更新 | 5 | 已过授权层，但属于真实线上修改高风险入口 | `alibaba.icbu.product.update.field` | 否 |
| 低风险写侧边界判断 | 7 | 已沉淀边界文档与阻塞规则 | `docs/framework/WIKA_低风险写侧边界验证.md` | 否 |
| 可观测 / 可回滚证据判断 | 7 | 已沉淀可观测与回滚前置证据文档 | `docs/framework/WIKA_可观测可回滚证据验证.md` | 否 |

## D. 询盘与客户沟通

| 能力项 | 当前状态 | 当前依据 | 对应入口 | 是否已形成任务闭环能力 |
| --- | --- | --- | --- | --- |
| 询盘列表 / 详情 | 6 | 当前官方文档里未识别到明确 list/detail 读侧方法名；已明确排除 `alibaba.inquiry.cards.send` 这类写侧接口 | 待识别 | 否 |
| 消息列表 / 详情 | 6 | 当前官方文档里未识别到明确 list/detail 读侧方法名；现有 `translate.*` 更偏配置/翻译设置，不等于消息读侧 | 待识别 | 否 |
| 客户列表（权限探针型原始路由） | 4 | `alibaba.seller.customer.batch.get` 已真实走到 `/sync + access_token + sha256`；缺参时为业务参数错误，但使用真实窗口参数后为 `InsufficientPermission`；已新增最小只读路由用于参数/权限分型 | `/integrations/alibaba/wika/data/customers/list` | 否 |
| 客户详情 / 客户画像 | 4 | `alibaba.seller.customer.get` 已真实走到 `/sync + access_token + sha256`，当前缺少 `buyer_member_seq`，还没有真实 JSON 样本 | `alibaba.seller.customer.get` | 否 |
| 客户小记列表 | 4 | `alibaba.seller.customer.note.get` 已真实走到 `/sync + access_token + sha256`，当前缺少 `page_num / page_size / customer_id` | `alibaba.seller.customer.note.get` | 否 |
| 客户小记明细 | 4 | `alibaba.seller.customer.note.query` 已真实走到 `/sync + access_token + sha256`，当前缺少 `note_id` | `alibaba.seller.customer.note.query` | 否 |
| 外部回复草稿工作流 | 7 | 已形成只生成草稿的外部工作流层；当前已补齐输入模板、workflow_profile、template_version、blocker taxonomy、follow-up questions、handoff checklist、manual completion SOP 与人工补单模板，不触发平台内发送 | `/integrations/alibaba/wika/tools/reply-draft` | 否 |
| 平台内回复动作 | 6 | 当前没有稳定可用入口 | 待识别 | 否 |
| 价格生成 | 7 | 当前只支持基于真实上下文生成报价 blocker 和人工补充建议，不等于真实报价已生成 | `/integrations/alibaba/wika/tools/reply-draft` | 否 |
| 产品细节调用 | 1 | 已有 detail/groups/score 等原始路由可复用 | 既有原始路由 | 否 |
| 交期生成 | 7 | 当前只支持交期 blocker、已有 lead time context 的外部草稿承接，不等于真实交期已确认 | `/integrations/alibaba/wika/tools/reply-draft` | 否 |
| 效果图生成 / 处理 | 7 | 当前只支持 mockup_request / visual_requirements / asset_requirements 需求包，不等于图片已生成 | `/integrations/alibaba/wika/tools/reply-draft` | 否 |

## E. 订单草稿

| 能力项 | 当前状态 | 当前依据 | 对应入口 | 是否已形成任务闭环能力 |
| --- | --- | --- | --- | --- |
| 订单起草类型权限探针 | 1 | 已上线正式原始路由；真实返回 `types=["TA"]` | `/integrations/alibaba/wika/data/orders/draft-types` | 否 |
| 平台内订单草稿 / 交易创建 | 5 | `alibaba.trade.order.create` 已完成真实生产分类；两轮不完整 payload 都只到业务参数错误，当前仍无法证明非成交、可回滚、无副作用边界 | `alibaba.trade.order.create` | 否 |
| 外部结构化报价单 / 订单草稿文档 | 7 | 已实现外部订单草稿 helper、样例与工具路由；当前已补齐 workflow_profile、template_version、blocker taxonomy、required_manual_fields、required_manual_field_details、follow_up_questions、handoff checklist、manual completion SOP 与人工补单模板，但明确不等于平台内订单已创建 | `/integrations/alibaba/wika/tools/order-draft` | 否 |

## F. 异常通知

| 能力项 | 当前状态 | 当前依据 | 对应入口 | 是否已形成任务闭环能力 |
| --- | --- | --- | --- | --- |
| 阻塞分类 | 7 | 已实现 helper | `shared/data/modules/alibaba-write-guardrails.js` | 否 |
| 人工接管规则 | 7 | 已有规则文档 | `docs/framework/WIKA_人工接管规则.md` | 否 |
| 结构化待处理 / 告警产物 | 7 | 已有样例产物 | `docs/framework/WIKA_人工接管告警样例.json` | 否 |
| 正式通知闭环（provider-agnostic + fallback） | 7 | 已实现 notifier；当前可完成“触发 -> 生成 -> 可审计落盘” | `shared/data/modules/wika-alerts.js` + `shared/data/modules/wika-notifier.js` | 是（最小闭环） |
| 真实 provider 预接线与 dry-run | 7 | 已实现 `webhook` 与 `resend` 适配层，并完成 `none / 配置不完整 / dry-run` 三类验证；phase13 又确认了当前 shell 与 production 都无 provider 配置 | `shared/data/modules/wika-notifier-webhook.js` + `shared/data/modules/wika-notifier-resend.js` | 否 |
| 邮件 / webhook 真实外发 | 7 | phase13 已确认当前缺配置且缺可控目标；因此只允许停在 dry-run / fallback，不进入真实外发 | 待后续配置 `WIKA_NOTIFY_*` | 否 |

## 当前收口结论

1. 当前最稳的已上线能力，集中在产品主数据、产品结构、订单原始数据、类目/属性/schema 读取，以及最小经营诊断和 products/orders 子诊断。
2. `mydata / overview / self.product` 这条经营指标路线在阶段 17 的 production 只读验证里再次统一停在 `AUTH_BLOCKED`，不再作为当前主线循环。
3. 订单级经营汇总当前只证明到“可由现有官方交易读侧部分派生”：
   - `趋势` 可由 `order.list.create_date` 派生
   - `正式汇总 / 国家结构 / 产品贡献` 当前未证明成立
4. 写侧方向已经推进到 schema-aware 草稿准备层，并新增了 media 可观测与 draft 可区分证据；但 `photobank.upload` 与 `product.add.draft` 的低风险边界都还未被证明。
5. 当前已经形成“外部回复草稿 + 外部订单草稿”这一层可直接使用的中间层，并且已经补齐模板化输入、workflow profile、blocker taxonomy、handoff checklist 和人工接手字段；但它们都不等于平台内回复或平台内创单。
6. 当前最缺的仍然是：经营指标入口、最小经营聚合、询盘/消息读侧、可真正读出的 customers 数据、平台内安全写入边界，以及通知闭环的真实 provider 配置与真实外发送达证据。
7. 阶段 18 没有新增任何 Alibaba API 验证；本轮只是在收口 `mydata` 权限清障和订单参数契约对账。
8. 阶段 19 没有新增任何 Alibaba API 验证；本轮只是在收口 `ICBU－商品` 官方文档阅读结果与候选池。
9. 阶段 20 没有新增任何 Alibaba API 验证；本轮只是在收口 WIKA access 多轮稳定化复跑、未决队列导出与 XD 标准权限预检。当前最关键的新结论不是接口回归，而是 Railway production 基础路由连续超时/不可达，导致 WIKA/XD access replay 统一 `BLOCKED_ENV`。
10. 当前边界依旧不是 task 1 complete，不是 task 2 complete，也不是平台内闭环。
