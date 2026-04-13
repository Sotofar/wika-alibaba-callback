# WIKA 面向 6 项任务 API 缺口矩阵

## 2026-04-13 XD Stage 27 Route Binding Delta

### Task 1
- XD 已新增在线只读 route：
  - `products/detail`
  - `products/groups`
  - `products/score`
  - `orders/fund`
  - `orders/logistics`
- 这 5 条能力现在已经从“direct-method 等价可读”推进到“production route 可读”。

### Task 2
- 本轮没有新增 XD report / diagnostic 消费层。
- 剩余 `minimal-diagnostic` 与其他未绑定 route 继续保持 stage26 的 `DOC_MISMATCH` 状态。

### 本轮边界
- 本轮没有新增官方字段。
- 本轮没有重跑 XD 全量 parity replay。
- 剩余 14 条 `DOC_MISMATCH` route 仍待后续按最小批次处理。

## 2026-04-13 Stage 34/35 Write Boundary Delta

### Task 3
- 当前 direct write candidate 已收敛为：
  - `alibaba.icbu.photobank.upload`
  - `alibaba.icbu.product.add.draft`
  - `alibaba.icbu.product.schema.add.draft`
- 当前固定阻塞：
  - `NO_ROLLBACK_PATH`
  - `NO_TEST_SCOPE`
  - `PARAM_CONTRACT_UNSTABLE`（限 `schema.add.draft`）
- 结论：
  - 当前仍只有安全草稿准备层与外部 handoff 层
  - 当前不能进入真实写入试点

### Task 4
- 当前 direct write candidate：无
- 当前固定阻塞：
  - `DOC_INSUFFICIENT`
- 结论：
  - 当前仍只有 external reply draft / preview / handoff pack
  - 当前不能进入平台内回复写侧验证

### Task 5
- 当前 direct write candidate 已收敛为：
  - `alibaba.trade.order.create`
- 当前固定阻塞：
  - `NO_ROLLBACK_PATH`
  - `NO_TEST_SCOPE`
- 结论：
  - 当前仍只有 external order draft / preview / handoff pack
  - 当前不能进入真实创单试点

## 2026-04-13 Stage 33 Maximum Completion Delta

### Task 1
- 当前边界下最大完成度已达成。
- Remaining gap 已全部是 unavailable / blocked 维度，不再是消费层缺失。

### Task 2
- 当前边界下最大完成度已达成。
- Remaining gap 已全部是字段缺失与边界缺失，不再是诊断 / 控制台包装缺失。

### Task 3 / 4 / 5
- 当前边界下最大完成度已达成。
- Remaining gap 已进入平台内执行闭环与写侧低风险边界证明范围。

### Task 6
- 明确排除，本轮不推进。

## 2026-04-13 Stage 32 Operator Console Deploy Delta

### Task 1
- `operator-console` 已部署，可把当前 store / product / order cockpit 与 action-center 汇总为一层更高层消费视图。
- 这不新增 official field，也不关闭剩余字段缺口。

### Task 2
- `operator-console` 已部署，可把 diagnostics / comparisons / blockers / next-best actions 汇总成统一控制台层。
- Remaining unavailable dimensions stay unchanged.

### Task 3/4/5
- `operator-console` 已部署，可统一暴露 task3/4/5 当前 workbench summary 与 preview readiness。
- 这不等于平台内执行闭环。

### Task 6
- Explicitly excluded in stage31 / 32.

## 2026-04-13 Stage 31 Operator Console Delta

### Task 1
- `operator-console` can surface one higher-level summary for the current store / product / order cockpit and action center.
- This does not add new official inputs and does not close the remaining field gaps.

### Task 2
- `operator-console` can expose one more direct control-plane style summary for diagnostics, comparisons, blockers, and next-best actions.
- Remaining unavailable dimensions stay unchanged.

### Task 3
- `operator-console` can surface task3 safe-draft readiness and manual blockers in one higher-level console.
- This does not publish products.

### Task 4
- `operator-console` can surface task4 external reply-draft readiness in one higher-level console.
- This does not send platform replies.

### Task 5
- `operator-console` can surface task5 external order-draft readiness in one higher-level console.
- This does not create platform orders.

### Task 6
- Explicitly excluded in stage31.

## 2026-04-13 Stage 29 Action Center and Preview Delta

### Task 1
- `action-center` can surface the current store / product / order diagnostic and comparison signals as one prioritized action view.
- This does not add new official inputs and does not close the remaining field gaps.

### Task 2
- `action-center` can expose a more directly consumable next-action layer on top of existing summaries, comparisons, and diagnostics.
- Remaining unavailable dimensions stay unchanged.

### Task 3
- `product-draft-preview` now exposes one deployed preview route for schema-aware / media-aware / manual blocker-aware input preview.
- This does not publish products and does not create draft objects on platform.

### Task 4
- `reply-preview` now exposes one deployed preview route for external reply-draft preview and handoff readiness.
- This does not send platform replies.

### Task 5
- `order-preview` now exposes one deployed preview route for external order-draft preview and handoff readiness.
- This does not create platform orders.

### Task 6
- Explicitly excluded in stage29 / 30.

## 2026-04-11 Stage 28 Cockpit and Workbench Delta

### Task 1
- `business-cockpit` can aggregate the current store / product / order read-side outputs into one consumer-facing report candidate.
- This does not add new official inputs and does not close the remaining field gaps.

### Task 2
- `business-cockpit` can aggregate management summary, comparison, and minimal diagnostic into one consumer-facing derived cockpit candidate.
- Remaining unavailable dimensions stay unchanged.

### Task 3
- `product-draft-workbench` now exposes one local candidate route for safe draft preparation, schema context, media context, and manual blockers.
- This does not publish products and does not create draft objects on platform.

### Task 4
- `reply-workbench` now exposes one local candidate route for external reply-draft workflow capability, blocker taxonomy, and handoff pack readiness.
- This does not send platform replies.

### Task 5
- `order-workbench` now exposes one local candidate route for external order-draft workflow capability, manual field system, and handoff pack readiness.
- This does not create platform orders.

### Task 6
- Explicitly excluded in stage28.

## 2026-04-11 Stage 26 Doc Anchoring Delta

### 任务 1：读取平台数据
- 当前继续保持“局部重开”
- 本轮没有新增 store / product / order 真实字段
- 当前继续缺：
  - `traffic_source / country_source / quick_reply_rate`
  - `access_source / inquiry_source / country_source / period_over_period_change`
  - `country_structure`

### 任务 2：经营诊断扩展
- 本轮没有新增可进入 `management-summary` / `minimal-diagnostic` 的真实字段
- 因此 store / product / order live routes 本轮不扩容

### 本轮边界
- 本轮主要完成官方文档定锚与验证前置包
- not task 1 complete
- not task 2 complete
- not full business cockpit

## 2026-04-11 Stage 23 Orders Derived Summary Delta

### 任务 2：经营诊断扩展
- 已新增订单 derived summary 层：
  - `/integrations/alibaba/wika/reports/orders/management-summary`
- 已扩展订单诊断层：
  - `/integrations/alibaba/wika/reports/orders/minimal-diagnostic`
- 当前已能保守消费的 derived 订单维度：
  - `formal_summary`
  - `product_contribution`
  - `trend_signal`（sample/window based）
- 当前仍未完成：
  - `country_structure`
  - 完整官方订单经营报表
  - 完整经营驾驶舱

### 任务 1：读取平台数据
- store/product 读取层本轮无新增字段
- 仍保持局部重开，不误写成 task 1 complete

## 2026-04-10 Stage 21 Deploy Lock Delta

### 任务 1：读取平台数据
- `management-summary` 层已部署并 smoke 通过：
  - `/integrations/alibaba/wika/reports/operations/management-summary`
  - `/integrations/alibaba/wika/reports/products/management-summary`
- 当前继续保持“局部重开”状态：
  - 店铺级 official fields 已可在线聚合与解释
  - 产品级 official fields 已可在线聚合与解释
- 仍未完成：
  - `traffic_source / country_source / quick_reply_rate`
  - `access_source / inquiry_source / country_source / period_over_period_change`

### 任务 2：经营诊断扩展
- `minimal-diagnostic` 扩展层已部署并 smoke 通过：
  - `/integrations/alibaba/wika/reports/operations/minimal-diagnostic`
  - `/integrations/alibaba/wika/reports/products/minimal-diagnostic`
- 当前诊断消费层已经在线具备：
  - `signal_interpretation / recommendation_block / unavailable_dimensions_echo / confidence_hints`
  - `ranking_interpretation / keyword_signal_takeaways / recommendation_block / unavailable_dimensions_echo / confidence_hints`
- 仍未完成：
  - 当前仍不是完整经营驾驶舱
  - 订单级正式汇总、国家结构、产品贡献仍未补齐

更新时间：2026-04-10

本文只记录当前最关键的能力状态，不把权限加包后的真实取数误写成任务完成。

## 2026-04-10 Stage 21 Delta

### 任务 1：读取平台数据
- 已新增可消费的 management summary 层：
  - `/integrations/alibaba/wika/reports/operations/management-summary`
  - `/integrations/alibaba/wika/reports/products/management-summary`
- 当前前进到“局部持续重开”状态：
  - 店铺级 official fields 已可读、可聚合、可解释
  - 产品级 official fields 已可读、可聚合、可解释
- 仍未完成：
  - `traffic_source / country_source / quick_reply_rate`
  - `access_source / inquiry_source / country_source / period_over_period_change`

### 任务 2：经营诊断扩展
- 已新增诊断消费层解释：
  - operations minimal diagnostic 新增 `signal_interpretation / recommendation_block / unavailable_dimensions_echo / confidence_hints`
  - products minimal diagnostic 新增 `ranking_interpretation / keyword_signal_takeaways / recommendation_block / unavailable_dimensions_echo / confidence_hints`
- 仍未完成：
  - 当前仍不是完整经营驾驶舱
  - 订单级正式汇总、国家结构、产品贡献仍未补齐

## 任务 1：店铺经营指标入口

| 能力项 | 当前状态 | 当前结论 |
| --- | --- | --- |
| `alibaba.mydata.overview.date.get` | WIKA post-grant 复测 `REAL_DATA_RETURNED` | 店铺级日期窗口已可真实读取 |
| `alibaba.mydata.overview.industry.get` | WIKA post-grant 复测 `REAL_DATA_RETURNED` | 行业参数已可真实读取 |
| `alibaba.mydata.overview.indicator.basic.get` | WIKA post-grant 复测 `REAL_DATA_RETURNED` | 店铺级 `visitor / imps / clk / clk_rate / fb / reply` 已可真实读取 |
| 店铺级缺口 | 仍存在 | 当前未见 `流量来源 / 国家来源 / 快速回复率` 真实字段 |

## 任务 2：经营聚合层

| 能力项 | 当前状态 | 当前结论 |
| --- | --- | --- |
| WIKA route 底座 | 已上线且稳定 | 只代表 route 层稳定，不代表经营分析已完整 |
| minimal-diagnostic / products / orders 子诊断 | 已上线 | 当前仍只基于现有真实只读字段 |
| `alibaba.mydata.self.product.date.get` | WIKA post-grant 复测 `REAL_DATA_RETURNED` | `day / week / month` 窗口已可真实读取 |
| `alibaba.mydata.self.product.get` | WIKA post-grant 复测 `REAL_DATA_RETURNED` | 产品级 `click / impression / visitor / fb / order / bookmark / compare / share / keyword_effects` 已可真实读取 |
| 产品级缺口 | 仍存在 | 当前未见 `访问来源 / 询盘来源 / 国家来源 / 近周期变化` 真实字段 |

## 任务 3：产品上新与详情编写

| 能力项 | 当前状态 | 当前结论 |
| --- | --- | --- |
| schema / render / media / draft render | 已上线 | 只代表只读与可观测能力成立 |
| `photobank.upload` / `add.draft` | 边界未证明 | 仍不能进入真实写入验证 |
| `product.type.available.get` | 官方文档已确认存在，未验证 | 仅保留为 doc-found 候选 |

## 任务 4：询盘与客户沟通

| 能力项 | 当前状态 | 当前结论 |
| --- | --- | --- |
| `customers/list` route | 已上线 | 当前应视为权限探针 route |
| customers direct methods | 仍缺真实 id 或权限 | 还不是稳定客户读侧 |
| inquiries / messages | 仍缺明确读侧入口 | 当前未重开 |

## 任务 5：订单草稿 / 交易创建

| 能力项 | 当前状态 | 当前结论 |
| --- | --- | --- |
| WIKA `orders/detail / fund / logistics` routes | 已上线 | route 层稳定可复现 |
| 订单参数契约 | 仍有限制 | `public list masked trade_id` 仍不支持完整 public chaining |
| 平台内 create 边界 | 未证明 | 仍不能误写成平台内创单已成立 |

## 任务 6：正式通知闭环

| 能力项 | 当前状态 | 当前结论 |
| --- | --- | --- |
| notifier fallback / dry-run | 已成立 | 仍未有真实 provider 送达证据 |
| 真实 provider 外发 | 未配置 | 仍未完成 |

## 当前总论
- 阶段 19 的增量是：WIKA `mydata` 5 个核心方法已从旧的 `AUTH_BLOCKED` 前进到 `REAL_DATA_RETURNED`
- 当前可以建议局部重开任务 1 / 任务 2 的读数部分
- 当前仍不是 task 1 complete，不是 task 2 complete，也不是平台内闭环
## 2026-04-10 Stage 20 Delta

### Task 1: 读取平台数据
- 已前进到局部重开条件：
  - `overview.date.get` -> real data confirmed
  - `overview.industry.get` -> real data confirmed
  - `overview.indicator.basic.get` -> official store-level metrics confirmed
  - `self.product.get` -> official product-level metrics confirmed
- 仍未完成：
  - store-level `traffic_source / country_source / quick_reply_rate`
  - product-level `access_source / inquiry_source / country_source / period_over_period_change`

### Task 2: 经营诊断扩展
- 已前进到局部重开条件：
  - store-level traffic/performance section can now use real official mydata fields
  - product performance section can now use real official mydata fields
- 仍未完成：
  - not full business cockpit
  - no order-level formal summary / country structure / product contribution

### 本轮边界
- 本轮没有新增 Alibaba API 探索
- 本轮没有任何写动作
- 本轮只处理 WIKA


## 2026-04-11 Stage 22 Gap Compression Delta

### 任务 1：读取平台数据
- 当前保持“局部重开”状态，不新增 store/product live route 扩容
- 店铺级 / 产品级仍未补齐：
  - `traffic_source / country_source / quick_reply_rate`
  - `access_source / inquiry_source / country_source / period_over_period_change`

### 任务 2：经营诊断扩展
- 本轮没有新增 store/product 真实字段，因此 `management-summary` 与 `minimal-diagnostic` 保持不扩容
- 订单级缺口出现收口增量：
  - `formal_summary` -> 已可由现有 `orders/list + orders/detail + orders/fund` 保守派生
  - `product_contribution` -> 已可由现有 `orders/detail.order_products` 保守派生
  - `country_structure` -> 仍未成立

### 任务 5：订单草稿 / 交易创建
- 当前 WIKA route-level 证据表明：
  - `orders/list` 已能返回可复用 `trade_id`
  - `orders/detail / fund / logistics` 已可在 current public route 层正常读取
- 但这不等于平台内创单已成立，也不等于完整订单经营驾驶舱已成立

### 当前边界
- not task 1 complete
- not task 2 complete
- not full business cockpit

## 2026-04-11 Stage 25 Gap Compression Round 2 Delta

### 任务 1：读取平台数据
- 当前继续保持“局部重开”
- 本轮没有新增 store/product 真实字段
- 仍未补齐：
  - `traffic_source / country_source / quick_reply_rate`
  - `access_source / inquiry_source / country_source / period_over_period_change`

### 任务 2：经营诊断扩展
- 本轮没有新增可接入 `management-summary` / `minimal-diagnostic` 的真实字段
- store/product/order live routes 本轮不扩容
- 订单级仍保持：
  - `formal_summary` -> 已成立的 derived 层
  - `product_contribution` -> 已成立的 derived 层
  - `trend_signal` -> 已成立的 derived 层
  - `country_structure` -> 仍 unavailable

### 当前边界
- legacy page-request 证据存在，不等于 current official mainline 已成立
- not task 1 complete
- not task 2 complete
- not full business cockpit

## 2026-04-11 Stage 27 Comparison Layer Delta

### 任务 1：读取平台数据
- 本轮没有新增 official route source
- store/product/order comparison 只复用现有 official mainline 与既有 derived layer
- 因此本轮不新增“已补齐 official 缺口”的结论

### 任务 2：经营诊断扩展
- 新增一层本地 comparison candidate：
  - store: current vs previous comparable date range
  - product: current stat window vs previous comparable stat window
  - order: current observed segment vs previous observed segment
- 这层能力目前属于 derived comparison candidate，不是已部署官方报表

### 当前缺口状态
- 店铺级仍缺：
  - `traffic_source`
  - `country_source`
  - `quick_reply_rate`
- 产品级仍缺：
  - `access_source`
  - `inquiry_source`
  - `country_source`
  - `period_over_period_change` 的 official field 入口
- 订单级仍缺：
  - `country_structure`

### 当前边界
- comparison layer 可以增强 task 2 的本地候选能力，但不代表 task 2 complete
- comparison layer 不改变 official gap 现状
- not task 1 complete
- not task 2 complete
- not full business cockpit

## 2026-04-11 Stage 27 Deploy Lock Delta

### 任务 1：读取平台数据
- stage27 comparison routes 已部署，但不新增 official data entrance
- 当前仍只是在既有 official inputs 之上增加 comparison derived outputs
- 因此 task 1 继续保持“局部重开”，不写成完成

### 任务 2：经营诊断扩展
- stage27 新增已部署 comparison route：
  - `/integrations/alibaba/wika/reports/operations/comparison-summary`
  - `/integrations/alibaba/wika/reports/products/comparison-summary`
  - `/integrations/alibaba/wika/reports/orders/comparison-summary`
- 它们当前可以增强“近周期变化 / 对比变化”的 derived 消费能力
- 但这仍不等于补齐 official gap，也不等于完整经营驾驶舱

## 2026-04-11 Stage 28 Deploy Delta

### 任务 1 / 任务 2
- `business-cockpit` 已部署，可统一消费 store/product/order 的 management summary、comparison、minimal diagnostic
- 这提高了任务 1 / 2 的消费完整度，但不补 official gap
- 因此 task 1 / task 2 继续保持“局部重开”，不写成 complete

### 任务 3 / 任务 4 / 任务 5
- 已部署 workbench routes：
  - `/integrations/alibaba/wika/workbench/product-draft-workbench`
  - `/integrations/alibaba/wika/workbench/reply-workbench`
  - `/integrations/alibaba/wika/workbench/order-workbench`
  - `/integrations/alibaba/wika/workbench/task-workbench`
- 它们当前只属于 safe draft / external draft / handoff pack 的消费层
- 因此 task 3 / task 4 / task 5 继续保持“局部重开”，不写成 complete

### 任务 6
- 本轮继续排除 task 6
- 未推进 provider、真实送达、真实通知外发能力

## 2026-04-13 Stage26 XD delta

### 任务 1：读取平台数据
- XD 已确认可直接读取：
  - orders: `get / fund / logistics`
  - mydata: `overview.date.get`、`self.product.date.get`
- XD 已进入可读层但当前无业务 payload：
  - `overview.industry.get`
  - `overview.indicator.basic.get`
  - `self.product.get`

### 任务 2：经营诊断扩展
- XD 当前没有新增 live diagnostic route。
- `products/detail / groups / score` 与 `orders/fund / logistics` 已被 direct-method 证明可读，但仍停留在 route parity gap。

### 当前不是任务完成的原因
- 14 条 XD parity route 仍是 `DOC_MISMATCH`
- 候选池仍有参数契约缺口与对象级限制
## 2026-04-13 Stage28 XD 缺口矩阵 delta

### task 1 / task 2 直接相关新增可用项
- categories:
  - `tree`
  - `attributes`
- products schema:
  - `schema`
  - `schema/render`
- media:
  - `list`
  - `groups`
- orders:
  - `draft-types`
- diagnostics:
  - `products/minimal-diagnostic`
  - `orders/minimal-diagnostic`
  - `operations/minimal-diagnostic`

### 当前仍未闭合的 XD 缺口
- `customers/list`：对象级限制
- `products/schema/render/draft`：当前无 draft payload
- keyword family：仍缺 `properties`
- draft tools：继续排除出安全只读范围
