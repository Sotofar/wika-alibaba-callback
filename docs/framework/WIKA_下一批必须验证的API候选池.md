# WIKA 下一批必须验证的 API 候选池

更新时间：2026-04-09

本文只保留围绕最终 6 项任务、且在当前主线里最值得继续推进的下一批候选。已经明确权限阻塞或边界未证明的接口，不再回到当前主线里循环验证。

## 排序原则

1. 任务 2 的总诊断层与 products/orders 子诊断都已经成立，不再为诊断层去追新 API
2. 先补任务 6：在真实 provider 已预接线的前提下，补一次低风险真实外发验证
3. 再补任务 3：只继续验证“可隔离、可清理、可回滚”的剩余写侧证据
4. 再补任务 4：只继续验证官方明确存在的 customers / inquiries / messages 读侧入口
5. 任务 5 当前已完成正式入口边界摸底；在出现新的官方低风险候选前，不再继续深挖 `order.create`
6. 任务 4 / 5 当前已经形成“模板化的外部草稿工作流 SOP 层”，后续若继续，应优先增强输入模板版本、人工补单 SOP、handoff checklist 和 blocker taxonomy，而不是回到平台内写动作
7. 阶段 17 已再次完成经营数据候选接口只读验证；阶段 18 已进一步把 `mydata / overview / self.product` 收口成权限清障包，当前不建议重开这条循环
8. 阶段 18 已进一步确认 `order.detail / fund / logistics` 的 public chaining 契约未闭合；在拿到可复用未遮罩订单 identifier 之前，不建议重开这条链的 runtime 验证
9. 阶段 19 已完整归类 `ICBU－商品 (cid=20966)` 左侧栏 47 页官方文档；新增“文档已确认存在，但尚未生产验证”的方法，只允许进入 doc-found 候选池，不能误报为主线已重开

## 当前已成立，不再进入候选池主线的能力

- `/integrations/alibaba/wika/reports/operations/minimal-diagnostic`
  - 当前已经形成最小经营诊断层
  - 后续若继续任务 2，应优先扩报告口径，而不是再回头验证新指标 API
- `/integrations/alibaba/wika/reports/products/minimal-diagnostic`
  - 当前已经形成产品子诊断层
  - 后续若继续任务 2，应优先增强产品样本策略与解释层
- `/integrations/alibaba/wika/reports/orders/minimal-diagnostic`
  - 当前已经形成订单子诊断层
  - 后续若继续任务 2，应优先增强订单执行信号的解释层
- `/integrations/alibaba/wika/tools/reply-draft`
  - 当前已经形成外部回复草稿工具
  - 当前输入模板、workflow_profile、follow-up questions、handoff_fields、handoff checklist、manual completion SOP 与 blocker taxonomy 都已补齐
  - 后续若继续任务 4，应优先增强人机协同体验，而不是回到平台内回复发送
- `/integrations/alibaba/wika/tools/order-draft`
  - 当前已经形成外部订单草稿工具
  - 当前 required_manual_fields、required_manual_field_details、follow-up questions、handoff_fields、handoff checklist 与人工补单模板都已补齐
  - 后续若继续任务 5，应优先增强外部订单包字段完整度与人工补齐 SOP，而不是回到平台内创单验证

## 第一梯队：任务 6（正式通知闭环）

| 优先级 | API / 能力 | 当前状态 | 当前结论 | 下一步 |
| --- | --- | --- | --- | --- |
| T6-P0 | `WIKA_NOTIFY_WEBHOOK_URL` + `WIKA_NOTIFY_WEBHOOK_BEARER_TOKEN` | 非 Alibaba API，但当前最值得优先接通 | phase13 已确认当前 shell 与 production 都无真实 webhook 配置；当前只差一次“配置到位且目标可控”的最小真实外发验证 | 仅在拿到正式 webhook 地址与鉴权信息、且目标明确可控后，做一次最小真实通知测试 |
| T6-P1 | `WIKA_NOTIFY_RESEND_API_KEY` + `WIKA_NOTIFY_EMAIL_FROM/TO` | 非 Alibaba API，但可复用轻量 HTTP 依赖 | 当前代码已支持 Resend HTTP API 和 dry-run，无需引入新依赖；phase13 已确认当前 shell 与 production 都无真实邮箱配置 | 仅在拿到正式邮箱配置且目标明确可控后，做一次最小真实通知测试 |

## 第二梯队：任务 3（产品上新与详情编写）

| 优先级 | API / 能力 | 当前状态 | 当前结论 | 下一步 |
| --- | --- | --- | --- | --- |
| T3-P0 | `alibaba.icbu.photobank.group.operate` | 已验证但不进入路由化 | 已在 production 闭环下返回业务参数错误，说明已过授权层；但成功路径属于真实分组写操作，当前仍不能证明可隔离 / 可清理 / 可回滚边界 | 暂不继续实写验证；仅保留为 media 管理证据 |
| T3-P0 | draft 查询 / 读取 / 删除 / 管理同家族接口 | 当前未识别到可用入口 | 当前公开官方文档中，除已验证的 `schema.render.draft` 外，没有再识别到明确的新接口 | 不再围绕 draft 管理接口循环，除非官方出现新的明确方法名 |
| T3-P1 | `alibaba.icbu.photobank.upload` | 已验证但不进入路由化 | 已过授权层；media 可观测能力已成立，但当前仍无法证明低风险写入边界 | 暂不继续真实上传 |
| T3-P1 | `alibaba.icbu.product.add.draft` | 已验证但不进入路由化 | 已过授权层；draft 可区分证据已成立，但当前仍无法证明安全草稿边界 | 暂不继续真实 draft create |

## 文档已确认存在，但尚未进入验证主线

以下对象来自阶段 19 的 `ICBU－商品` 全类目文档归类结果。它们当前只能写成 `official doc found only`，不能写成已打通或已适合立即重开主线。

| 优先级 | API / 能力 | 当前状态 | 当前结论 | 下一步 |
| --- | --- | --- | --- | --- |
| T3-DOC0 | `alibaba.icbu.product.type.available.get` | 官方文档已确认存在，未验证 | 可能成为任务 3 的更低风险发品权限 precheck 候选 | 只有在明确重开任务 3、且仍坚持低风险 precheck 优先时，才进入 production 验证 |
| T3-DOC1 | `alibaba.icbu.product.schema.add.draft` | 官方文档已确认存在，未验证 | 文档上明确返回“商品草稿明文id”，可能是 `schema.render.draft` 的上游候选；但它本身仍是写侧草稿创建入口 | 只有在重开写侧边界验证时才考虑，不得误写成安全 draft 已成立 |
| T3-DOC2 | `alibaba.icbu.product.id.encrypt / decrypt` | 官方文档已确认存在，未验证 | 说明商品侧存在 ID 契约层，可用于未来商品 ID 契约对账 | 只有在重开 product ID 契约问题时才考虑 |
| T3-DOC3 | `alibaba.icbu.category.id.mapping / category.predict / property.predict` | 官方文档已确认存在，未验证 | 只对类目映射、属性补全、外部草稿准备层增强有帮助，不直接解决当前主线阻塞 | 保留为低优先级文档候选 |

## 阶段 19 已固定的关键负结论

- 当前没有在 `ICBU－商品` 类目里读到明确的 draft query / delete / manage 接口
- 当前没有在 `ICBU－商品` 类目里读到明确的 media delete / cleanup 接口
- 这批商品类目文档不能直接解决 `mydata` 的 `AUTH_BLOCKED`
- 这批商品类目文档不能直接解决订单 detail / fund / logistics 的参数契约问题

## 第三梯队：任务 4（询盘 / 消息 / 客户）

| 优先级 | API / 能力 | 当前状态 | 当前结论 | 下一步 |
| --- | --- | --- | --- | --- |
| T4-P0 | `alibaba.seller.customer.batch.get` | 已验证并已最小路由化 | 已真实走到 `/sync + access_token + sha256`；缺参时为业务参数错误，使用真实窗口参数后为权限错误；已新增 `customers/list` 只读权限探针路由 | 只有在权限放开后，才继续争取真实 JSON 样本 |
| T4-P1 | `alibaba.seller.customer.get` | 已验证但不进入路由化 | 已真实走到 `/sync + access_token + sha256`；当前缺少 `buyer_member_seq`，只有业务参数错误证据 | 仅在拿到真实 `buyer_member_seq` 时继续验证 |
| T4-P1 | `alibaba.seller.customer.note.get` | 已验证但不进入路由化 | 已真实走到 `/sync + access_token + sha256`；当前缺少 `page_num / page_size / customer_id` | 仅在拿到真实 `customer_id` 时继续验证 |
| T4-P1 | `alibaba.seller.customer.note.query` | 已验证但不进入路由化 | 已真实走到 `/sync + access_token + sha256`；当前缺少 `note_id` | 仅在拿到真实 `note_id` 时继续验证 |
| T4-P2 | inquiry / message 读侧方法 | 当前未识别到可用入口 | 当前官方文档里只明确看到了 `alibaba.inquiry.cards.send` 与 `translate.*` 一类接口，没有明确的 list/detail 读侧方法名 | 只有在官方文档出现明确方法名时，才重新进入验证 |

### 任务 3 当前已从候选池转为正式可复用的支持路由
- `/integrations/alibaba/wika/data/categories/tree`
- `/integrations/alibaba/wika/data/categories/attributes`
- `/integrations/alibaba/wika/data/products/schema`
- `/integrations/alibaba/wika/data/products/schema/render`
- `/integrations/alibaba/wika/data/products/schema/render/draft`
- `/integrations/alibaba/wika/data/media/list`
- `/integrations/alibaba/wika/data/media/groups`

## 第四梯队：任务 5（订单草稿 / 交易创建）

| 优先级 | API / 能力 | 当前状态 | 当前结论 | 下一步 |
| --- | --- | --- | --- | --- |
| T5-P0 | `alibaba.seller.trade.query.drafttype` | 已验证并已最小路由化 | 已真实走到 `/sync + access_token + sha256`，并返回 `types=["TA"]`；当前可作为订单起草权限探针使用 | 若后续出现明确 draft / cancel / status / query 读侧方法，再沿同主线继续验证 |
| T5-P1 | `alibaba.trade.order.create` | 已验证但不进入路由化 | 当前已真实走到业务参数层；空对象与 `product_list=[]` 两轮都返回 MissingParameter，说明已过授权层；但当前仍无法证明非成交、可回滚、无副作用边界 | 不再继续深挖，除非官方出现明确低风险同家族候选 |
| T5-P1 | 外部结构化报价单 / 订单草稿文档 | 非 Alibaba API，但任务闭环需要 | 当前已经有外部订单草稿 helper 与样例；这是任务 5 的可靠中间层，但不得误报为平台内订单已创建 | 如继续任务 5，优先增强外部订单草稿的字段完整度与人工补齐说明 |

## 当前明确不再继续循环的对象

以下接口虽然与经营指标直接相关，但当前已经有明确收口结论，不再继续消耗主线资源：
- `alibaba.mydata.overview.indicator.basic.get`
- `alibaba.mydata.self.product.get`
- `alibaba.mydata.self.product.date.get`
- `alibaba.mydata.overview.date.get`
- `alibaba.mydata.overview.industry.get`

统一结论：`官方存在，但权限/能力阻塞`

以下结论同样已在阶段 17 完成，不再重复消耗主线资源：
- `alibaba.seller.order.list` -> `REAL_DATA_RETURNED`
- `alibaba.seller.order.get` -> `PARAMETER_REJECTED`
- `alibaba.seller.order.fund.get` -> `PARAMETER_REJECTED`
- `alibaba.seller.order.logistics.get` -> `PARAMETER_REJECTED`

补充说明：
- 当前 `order.list` 已证明可直接取到真实订单样本与创建时间窗口
- 当前订单级经营汇总只证明到“趋势可由现有交易 API 派生”
- `正式汇总 / 国家结构 / 产品贡献` 还不能写成已由现有交易 API 稳定派生

## 当前一句话结论

当前最优先的下一批验证对象仍然是“真实 provider 外发验证”与“写侧可回滚证据”；而任务 4 / 5 当前已经有可直接使用、并且更适合人机协同的外部草稿工作流 SOP 层，不应再把它们误写成平台内自动执行闭环。任务 1 / 2 当前不建议因为阶段 17/18 的收口结果就正式重开 `mydata` 主线；若必须继续任务 2，应优先写成“订单趋势由现有交易 API 部分派生”，而不是追新报表入口，也不要把 `detail / fund / logistics` 的参数契约未闭合误写成已打通。

补充说明：
- 本轮没有做任何新的 Alibaba API 验证。
- 阶段 18 没有推进平台内自动回复、平台内订单创建、真实通知外发。
- 阶段 18 只是在收口 `mydata` 权限清障和订单参数契约对账。
- 阶段 19 只是在收口 `ICBU－商品` 官方文档阅读结果与候选池，不代表任何新方法已经在 `WIKA` 当前租户下验证通过。
