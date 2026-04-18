# WIKA 面向 6 项任务 API 缺口矩阵

## 2026-04-18 WIKA 现有权限打通收口 Delta

### Task 1
- 当前 store / product / order 读侧已打通到当前边界上限。
- 当前继续缺的不是消费层包装，而是 official missing dimensions：
  - store：`traffic_source` `country_source` `quick_reply_rate`
  - product：`access_source` `inquiry_source` `country_source` `period_over_period_change`
  - order：`country_structure`

### Task 2
- 当前 summary / diagnostic / comparison / cockpit / action-center / operator-console 已齐。
- 当前继续缺的不是诊断层，而是：
  - 来源归因
  - 国家归因
  - 页面行为数据
  - 广告 official mainline

### Task 3
- 当前最完整能力：
  - product-draft-workbench
  - product-draft-preview
  - schema / media / render / score 支撑的安全准备层
- 当前阻塞：
  - `NO_ROLLBACK_PATH`
  - `NO_TEST_SCOPE`
  - `PARAM_CONTRACT_UNSTABLE`

### Task 4
- 当前最完整能力：
  - reply-workbench
  - reply-preview
  - `/integrations/alibaba/wika/tools/reply-draft`
- 当前阻塞：
  - `DOC_INSUFFICIENT`
  - 缺 direct candidate

### Task 5
- 当前最完整能力：
  - order-workbench
  - order-preview
  - `/integrations/alibaba/wika/tools/order-draft`
- 当前阻塞：
  - `NO_ROLLBACK_PATH`
  - `NO_TEST_SCOPE`
  - 缺 stable readback

### Task 6
- 明确排除，不推进。

### 本轮补齐
- 本轮补齐的不是新 API，而是：
  - 广告导入 `CSV + JSON` 双模板
  - 页面人工盘点 `CSV + JSON` 双模板
  - 当前权限下的工作分配清单
  - 外部阻塞清单

### 当前结论
- 当前能在仓内继续补齐的部分已基本补齐。
- 剩余未补齐部分全部转入外部条件。

## 2026-04-14 Stage 30 XD Safe Scope Freeze Delta

### XD 当前统一状态
- route parity gap：`0`
- candidate unresolved：`0`
- 当前 safe-scope 内不再存在 access 空白状态

### Task 1 / Task 2
- XD 当前 safe-scope 已完成所有安全 read-only parity 与 candidate 收口。
- 继续缺的部分已经不是“仓内 route 未补”或“参数还没试完”，而是：
  - `customers/list` 的对象级 restriction
  - `products/schema/render/draft` 的真实 draft payload 缺失
  - 6 个 candidate 的 `TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED`

### Task 3 / Task 4 / Task 5
- `tools/reply-draft` 与 `tools/order-draft` 继续明确为 `WRITE_ADJACENT_SKIPPED`。
- 它们属于 safe-scope 外的写侧邻接边界，不在当前 access freeze 内继续推进。

### 当前边界
- 本轮不再新增 XD route family
- 本轮不再新增 XD candidate 尝试
- 之后只有拿到新的外部证据时，才值得重开冻结对象

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

## 2026-04-18 Stage 45 Input Productization Delta

### Task 1 / Task 2
- 本轮没有新增 official field。
- 本轮没有新增 Alibaba API 探索。
- 本轮新增的是两个外部输入口：
  - 广告导入模板与合同层
  - 页面人工盘点模板与合同层
- 当前增益：
  - ads 诊断与建议层不再停留在 sample-import.csv 演示
  - 页面优化建议层不再只有纯 derived 保守建议，可以叠加人工盘点输入

### 当前仍未解决
- 广告域：
  - 仍无稳定 official ads api
  - 仍依赖真实广告导出文件
- 页面域：
  - 仍无官方行为数据 / 热图 / 点击流
  - 仍依赖人工盘点
- 因此当前只新增输入口，不把这些能力误写成 fully automated capability

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

## stage29 更新（2026-04-14）
- keyword family 已不再属于参数契约缺口。
- 相关对象现已统一收口为 `TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED`。
- 6 项任务矩阵中，XD 当前 safe-scope 仅剩冻结边界，不再存在 candidate “待确认”空白项。
## 2026-04-15 Stage 41-44 Operations OS Delta

### Task 1
- 本轮没有新增 store / product / order official field。
- 当前新增的是运营数据版图与 ads import-ready 层，不是新的店铺 / 产品 / 订单 official 覆盖。
- Task 1 继续缺：
  - 店铺级：`traffic_source`、`country_source`、`quick_reply_rate`
  - 产品级：`access_source`、`inquiry_source`、`country_source`、`period_over_period_change`
  - 订单级：`country_structure`

### Task 2
- 本轮新增：
  - 广告导入摘要层
  - 广告 comparison / diagnostic / action-center 本地合同
  - 内容与页面优化建议层本地合同
- 这些新增都属于：
  - `import-driven` 或 `derived recommendation`
  - 不是新的 official API confirm
  - 不是已上线 production report route

### Task 3 / Task 4 / Task 5
- 本轮没有新增写侧边界证明。
- 任务 3/4/5 继续维持当前 workbench / preview / handoff pack 状态，不写成平台内闭环。

### 当前新增阻塞
- 若要把 ads layer 真正并入统一运营控制台在线层，当前还缺：
  - 真实广告导出样本
  - 稳定导入承接方式
  - 或稳定 official ads route
- 若要把内容优化建议显著做强，当前还缺：
  - 页面行为级真实数据
  - 更强的页面结构输入

### Task 6
- 明确排除，本轮不推进。
