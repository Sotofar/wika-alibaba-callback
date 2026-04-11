# WIKA_项目基线

## 2026-04-11 Stage 28 Local Cockpit and Workbench Candidate

### Local candidate only
- stage28 currently stays at local candidate / local contract status.
- New candidate report route:
  - `/integrations/alibaba/wika/reports/business-cockpit`
- New candidate workbench routes:
  - `/integrations/alibaba/wika/workbench/product-draft-workbench`
  - `/integrations/alibaba/wika/workbench/reply-workbench`
  - `/integrations/alibaba/wika/workbench/order-workbench`
  - `/integrations/alibaba/wika/workbench/task-workbench`
- Validation status:
  - `node --check` passed for stage28 helper / route / script files.
  - `node WIKA/scripts/validate-wika-stage28-cockpit-and-workbench.js` passed.
  - Local contract evidence has been written to `WIKA/docs/framework/evidence/`.

### Stage28 boundary
- This round does not add new official fields.
- This round does not add new Alibaba API verification.
- This round does not attempt any write action.
- task 6 is explicitly excluded.
- stage28 is not deployed yet, so it must not be described as an online capability.

## 2026-04-11 Stage 26 Doc Anchoring Update

### stage25 远端锁定
- `c4e8848b89eeb71dad04899342c63b1ccf0436ed` 已 push 到 `origin/main`，stage25 第二轮缺口压缩结论已进入远端基线。

### stage24 最小线上基线再次确认
- `/health` -> `200`
- `/integrations/alibaba/auth/debug` -> `200 + JSON`
- `/integrations/alibaba/wika/reports/operations/management-summary` -> `200 + JSON`
- `/integrations/alibaba/wika/reports/products/management-summary` -> `200 + JSON`
- `/integrations/alibaba/wika/reports/orders/management-summary` -> `200 + JSON`

### stage26 官方文档定锚结论
- 本轮没有新增真实字段。
- 本轮没有扩 live routes。
- 当前 direct candidate：无。
- 已补到官方文档 URL、但仍不满足 runtime 前置条件的背景候选：
  - `alibaba.seller.trade.decode`
  - `alibaba.mydata.self.keyword.date.get`
  - `alibaba.mydata.self.keyword.effect.week.get`
  - `alibaba.mydata.self.keyword.effect.month.get`
- 当前收口：
  - 继续停在“官方文档定锚与验证前置包完成”
  - 不进入弱相关 runtime 验证

### 当前固定边界
- 店铺级仍缺：`traffic_source / country_source / quick_reply_rate`
- 产品级仍缺：`access_source / inquiry_source / country_source / period_over_period_change`
- 订单级仍缺：`country_structure`
- not task 1 complete
- not task 2 complete
- not full business cockpit

## 2026-04-11 Stage 24 Deploy Lock Update

### stage24 远端锁定
- `a2f1f8f9ced7afafc12d1accaf67dcc59e88ca25` 已 push 到 `origin/main`，当前远端 main 已锁定 stage24 的目录重整、编码修复、路径修复与资产治理结果。
- stage24 本轮没有新增业务功能、没有新增 Alibaba API 验证、没有任何写动作。

### stage24 最小 production 回归
- 基础健康：
  - `/health` -> `200`
  - `/integrations/alibaba/auth/debug` -> `200 + JSON`
- WIKA 核心 summary / diagnostic：
  - `/integrations/alibaba/wika/reports/operations/management-summary` -> `200 + JSON + PASS`
  - `/integrations/alibaba/wika/reports/products/management-summary` -> `200 + JSON + PASS`
  - `/integrations/alibaba/wika/reports/orders/management-summary` -> `200 + JSON + PASS`
  - `/integrations/alibaba/wika/reports/operations/minimal-diagnostic` -> `200 + JSON + PASS`
  - `/integrations/alibaba/wika/reports/products/minimal-diagnostic` -> `200 + JSON + PASS`
  - `/integrations/alibaba/wika/reports/orders/minimal-diagnostic` -> `200 + JSON + PASS`
- 可选 tools smoke：
  - `/integrations/alibaba/wika/tools/reply-draft` -> `200 + JSON + PASS`
  - `/integrations/alibaba/wika/tools/order-draft` -> `200 + JSON + PASS`

### stage24 唯一运行时修正
- stage24 首次 push 后出现统一 `502`
- 根因已收口为目录迁移后 `WIKA/projects/wika/data/**` 指向 root `shared/` 的相对 import 少了一层
- 已做最小只读安全修正：
  - `WIKA/projects/wika/data/products/module.js`
  - `WIKA/projects/wika/data/orders/module.js`
  - `WIKA/projects/wika/data/overview/module.js`
  - `WIKA/projects/wika/data/reports/management-summary.js`
- 修正后 production route 已恢复，不涉及业务语义变化

### 当前固定边界
- WIKA 业务工作、文档、脚本、证据、规划材料继续只进入 `WIKA/`
- XD 业务工作、文档、脚本、证据、规划材料继续只进入 `XD/`
- truly shared / common 内容继续保留在根目录或 `shared/` / `src/` / `common/`
- not task 1 complete
- not task 2 complete
- not full business cockpit

## 2026-04-11 Stage 23 Deploy Lock Update

### stage22 远端锁定
- `19f55e9e99a5fa5b9383c8375c86c16b7fb14b05` 已 push 到 `origin/main`，当前远端 main 已锁定 stage22 缺口压缩结论。
- 当前远端结论继续成立：
  - store/product 剩余维度本轮没有新增真实字段
  - order `formal_summary / product_contribution` 已确定可由现有 order 只读链保守派生
  - `country_structure` 仍 unavailable

### stage23 订单经营摘要层
- 新增只读 helper：
  - `shared/data/modules/wika-order-management-summary.js`
- 新增只读 route：
  - `/integrations/alibaba/wika/reports/orders/management-summary`
- 扩展 route：
  - `/integrations/alibaba/wika/reports/orders/minimal-diagnostic`
- 验证结果：
  - `orders_management_summary -> PASS_LOCAL_CONTRACT`
  - `orders_minimal_diagnostic -> PASS_LOCAL_CONTRACT`
  - `/integrations/alibaba/wika/reports/operations/management-summary` -> `200 + JSON + PASS`
  - `/integrations/alibaba/wika/reports/products/management-summary` -> `200 + JSON + PASS`
  - `/integrations/alibaba/wika/reports/orders/management-summary` -> `200 + JSON + PASS`
  - `/integrations/alibaba/wika/reports/operations/minimal-diagnostic` -> `200 + JSON + PASS`
  - `/integrations/alibaba/wika/reports/products/minimal-diagnostic` -> `200 + JSON + PASS`
  - `/integrations/alibaba/wika/reports/orders/minimal-diagnostic` -> `200 + JSON + PASS`

### 当前已确认的 derived order dimensions
- `formal_summary`：已在本地 orders management summary 中稳定产出
- `product_contribution`：已在本地 orders management summary 中稳定产出
- `trend_signal`：已在本地 summary / minimal diagnostic 中以 sample/window based 方式产出
- `country_structure`：继续保持 unavailable，不脑补

### 当前固定边界
- stage23 已 push 并完成 production smoke
- 本轮没有修改 store/product live routes
- `/integrations/alibaba/wika/reports/orders/management-summary` 是 derived / conservative / partial 的，不是官方完整订单经营报表
- not task 1 complete
- not task 2 complete
- not full business cockpit

## 2026-04-10 Stage 21 Deploy Lock Update

### 已部署并 smoke 通过的经营管理摘要层
- 已部署并通过 production HTTP smoke：
  - `/integrations/alibaba/wika/reports/operations/management-summary`
  - `/integrations/alibaba/wika/reports/products/management-summary`
  - `/integrations/alibaba/wika/reports/operations/minimal-diagnostic`
  - `/integrations/alibaba/wika/reports/products/minimal-diagnostic`

### 已在线上确认的 management summary 边界
- 店铺级 management summary 线上已确认暴露：
  - `visitor`
  - `imps`
  - `clk`
  - `clk_rate`
  - `fb`
  - `reply`
- 产品级 management summary 线上已确认暴露：
  - `click`
  - `impression`
  - `visitor`
  - `fb`
  - `order`
  - `bookmark`
  - `compare`
  - `share`
  - `keyword_effects`
- 线上继续显式暴露 unavailable dimensions：
  - store: `traffic_source / country_source / quick_reply_rate`
  - product: `access_source / inquiry_source / country_source / period_over_period_change`

### 已在线上确认的 sample-based 边界
- `products management summary` 当前仍是 sample-based 聚合，不是默认全量全店统计
- 当前线上样本边界：
  - `product_scope_basis=sample_from_products_list`
  - `product_scope_limit=5`
  - `product_scope_truncated=true`
  - `product_ids_used_count=5`

### 当前固定边界
- 本轮没有新增 Alibaba API 探索
- 本轮没有推进 XD
- 本轮没有任何写动作
- 本轮只是 task 1 / task 2 的局部实现继续推进
- not task 1 complete
- not task 2 complete
- not full business cockpit

## 2026-04-10 Stage 21 Baseline Update

### 新增经营管理摘要层
- 新增 WIKA 经营管理摘要共享 helper：
  - `shared/data/modules/wika-mydata-management-summary.js`
  - `shared/data/modules/wika-mydata-product-ranking.js`

### 新增或更新的正式报告路由
- 新增：
  - `/integrations/alibaba/wika/reports/operations/management-summary`
- 扩展：
  - `/integrations/alibaba/wika/reports/products/management-summary`
  - `/integrations/alibaba/wika/reports/operations/minimal-diagnostic`
  - `/integrations/alibaba/wika/reports/products/minimal-diagnostic`

### 当前已确认的管理摘要层边界
- 店铺级 management summary 仍只覆盖：
  - `visitor`
  - `imps`
  - `clk`
  - `clk_rate`
  - `fb`
  - `reply`
- 产品级 management summary 仍只覆盖：
  - `click`
  - `impression`
  - `visitor`
  - `fb`
  - `order`
  - `bookmark`
  - `compare`
  - `share`
  - `keyword_effects`
- 当前仍显式列出 unavailable dimensions：
  - store: `traffic_source / country_source / quick_reply_rate`
  - product: `access_source / inquiry_source / country_source / period_over_period_change`
- 当前产品经营摘要默认是带 cap 的样本聚合，不伪装成全店全量统计

### 当前固定边界
- 本轮没有新增 Alibaba API 探索
- 本轮没有推进 XD
- 本轮没有任何写动作
- 本轮只是 task 1 / task 2 的局部实现继续推进
- not task 1 complete
- not task 2 complete
- not full business cockpit

## 2026-04-10 Stage 20 Baseline Update

### 新增只读层
- 已把 5 个已证实可用的 mydata 方法沉淀为 WIKA 共享只读 helper：
  - `alibaba.mydata.overview.date.get`
  - `alibaba.mydata.overview.industry.get`
  - `alibaba.mydata.overview.indicator.basic.get`
  - `alibaba.mydata.self.product.date.get`
  - `alibaba.mydata.self.product.get`

### 新增正式报告路由
- `/integrations/alibaba/wika/reports/operations/traffic-summary`
- `/integrations/alibaba/wika/reports/products/performance-summary`

### 已扩展的正式诊断路由
- `/integrations/alibaba/wika/reports/operations/minimal-diagnostic`
- `/integrations/alibaba/wika/reports/products/minimal-diagnostic`

### 当前已确认 official fields
- Store-level official fields:
  - `visitor`
  - `imps`
  - `clk`
  - `clk_rate`
  - `fb`
  - `reply`
- Product-level official fields:
  - `click`
  - `impression`
  - `visitor`
  - `fb`
  - `order`
  - `bookmark`
  - `compare`
  - `share`
  - `keyword_effects`

### 当前已确认 derived / unavailable 边界
- derived:
  - `UV ~= visitor (business-mapping pending)`
  - `exposure_from_imps`
  - `ctr_candidate_from_clk_rate`
  - `reply_related_metric_from_reply`
  - `ctr_from_click_over_impression`
- unavailable:
  - store: `traffic_source / country_source / quick_reply_rate`
  - product: `access_source / inquiry_source / country_source / period_over_period_change`

### 固定边界
- 本轮没有新增 Alibaba API 探索
- 本轮没有任何写动作
- 本轮只处理 WIKA
- not task 1 complete
- not task 2 complete
- not full business cockpit

## 一句话总基线
只推进 WIKA；当前主线已经形成“稳定的只读 route 底座 + 最小经营诊断层 + 外部草稿工作流 SOP + 通知 fallback”，并且阶段 19 已确认 WIKA `mydata` 权限加包后，5 个核心经营数据方法都能在 production 下返回真实字段；但这仍不等于 task 1 complete，不等于 task 2 complete，也不等于平台内闭环。

## 当前已完成阶段
- 产品 / 订单 / 物流 / 类目 / schema / media 的正式只读路由已上线
- products / orders / operations minimal-diagnostic 已上线
- 外部 reply/order 草稿工作流、handoff、review、regression 已成立
- 通知 fallback 与 provider dry-run 已成立
- 阶段 17 已完成经营数据候选接口验证
- 阶段 18 已完成 `mydata` 权限清障与订单参数契约对账
- 阶段 19 已完成 WIKA 数据管家权限开通后复测

## 阶段 19 关键结论
- production base 继续 `PASS_BASE`
- 当前 WIKA seller 授权态可用：
  - `wika_token_loaded=true`
  - `wika_token_file_exists=true`
  - `wika_has_refresh_token=true`
  - `wika_startup_init_status=refresh:startup_bootstrap`
- `wika_appkey_confirmed=false`
- `assumption_wika_appkey=true`
- 5 个 `mydata` 方法全部 `REAL_DATA_RETURNED`：
  - `alibaba.mydata.overview.date.get`
  - `alibaba.mydata.overview.industry.get`
  - `alibaba.mydata.overview.indicator.basic.get`
  - `alibaba.mydata.self.product.date.get`
  - `alibaba.mydata.self.product.get`

## 当前已确认的真实经营字段
### 店铺级
- `visitor`
- `imps`
- `clk`
- `clk_rate`
- `fb`
- `reply`

### 产品级
- `click`
- `impression`
- `visitor`
- `fb`
- `order`
- `bookmark`
- `compare`
- `share`
- `keyword_effects`

### 已确认的真实参数窗口
- `overview.date.get` 已返回真实可用 `date_range`
- `overview.industry.get` 已返回真实 `industry_id / industry_desc / main_category`
- `self.product.date.get` 已返回：
  - `day` 窗口：`2026-03-10` -> `2026-04-08`
  - `week` 窗口：`2026-03-08` -> `2026-04-04`
  - `month` 窗口：`2026-03-01` -> `2026-03-31`

## 当前仍未在真实响应中看到的字段
### 店铺级
- 流量来源
- 国家来源
- 快速回复率

### 产品级
- 访问来源
- 询盘来源
- 国家来源
- 近周期变化

### 订单级
- 正式汇总
- 国家结构
- 产品贡献

## 当前还缺的核心能力
### 任务 1
- 需要把已确认的 `mydata` 店铺级 / 产品级字段接入正式读取路由或报告层
- 仍未补齐流量来源、国家来源、快速回复率等字段

### 任务 2
- 需要把 `overview.indicator.basic` / `self.product.get` 的真实字段并入经营诊断扩展层
- 仍未形成完整经营驾驶舱

### 任务 3
- `photobank.upload` / `add.draft` 的低风险边界证明
- media 清理 / draft 管理的公开入口

### 任务 4
- customers 真正可读
- inquiries / messages 读侧入口
- 平台内回复能力

### 任务 5
- 平台内订单草稿 / 交易创建的安全边界证明

### 任务 6
- 真实 provider 外发通知，而不只是 dry-run / fallback

## 当前唯一推荐下一步
如果继续，只建议做一件事：
- 局部重开任务 1 / 任务 2 的“只读取数与诊断扩展”部分，把已确认的 `mydata` 真实字段并入 WIKA 正式报告层

## 当前真实数据结论
- WIKA 已能在 production 下真实读取公司级经营字段：
  - `visitor / imps / clk / clk_rate / fb / reply`
- WIKA 已能在 production 下真实读取产品级效果字段：
  - `click / impression / visitor / fb / order / bookmark / compare / share / keyword_effects`
- WIKA 已能在 production 下真实读取 `overview` 与 `self.product` 的日期窗口 / 行业参数

## 当前待验证判断
- 把这些真实字段接入正式 route / report 后，任务 1 的读取侧是否足够稳定
- 把这些真实字段接入经营诊断后，任务 2 是否能形成更高质量的只读经营分析

## 固定边界
- 当前不是 task 1 complete
- 当前不是 task 2 complete
- 当前没有任何写侧动作
- 当前线程只处理 WIKA
- 当前轮次没有更新或推进任何 XD 结果


## 2026-04-11 Stage 22 Gap Compression Update

### stage21 在线基线复核
- 以下线上基线本轮再次确认通过：
  - `/health`
  - `/integrations/alibaba/auth/debug`
  - `/integrations/alibaba/wika/reports/operations/management-summary`
  - `/integrations/alibaba/wika/reports/products/management-summary`

### 本轮没有新增店铺级 / 产品级真实字段
- 店铺级剩余维度仍未在现有 raw response 中出现：
  - `traffic_source`
  - `country_source`
  - `quick_reply_rate`
- 产品级剩余维度仍未在现有 raw response 中出现：
  - `access_source`
  - `inquiry_source`
  - `country_source`
  - `period_over_period_change`
- 因此本轮不扩 `operations / products management-summary` live routes

### 订单级缺口压缩增量
- `formal_summary`：
  - 已可由现有 `orders/list + orders/detail + orders/fund` 只读链保守派生
- `product_contribution`：
  - 已可由现有 `orders/detail.order_products` 只读链保守派生
- `country_structure`：
  - 仍未成立
  - 当前只看到 `orders/detail.available_field_keys` 中出现 `shipping_address`
  - 但 current public route 没有暴露 `shipping_address.country` 或 `buyer.country` 实值

### 当前固定边界
- 本轮没有新增 Alibaba API 探索
- 本轮没有任何写动作
- 本轮只做 WIKA
- not task 1 complete
- not task 2 complete
- not full business cockpit

## 2026-04-11 Stage 25 Gap Compression Round 2 Update

### stage24 线上基线回归
- 以下 route 本轮再次确认通过：
  - `/health`
  - `/integrations/alibaba/auth/debug`
  - `/integrations/alibaba/wika/reports/operations/management-summary`
  - `/integrations/alibaba/wika/reports/products/management-summary`
  - `/integrations/alibaba/wika/reports/orders/management-summary`

### 本轮没有新增真实字段
- 店铺级剩余维度仍未在 current official mainline 中出现：
  - `traffic_source`
  - `country_source`
  - `quick_reply_rate`
- 产品级剩余维度仍未在 current official mainline 中出现：
  - `access_source`
  - `inquiry_source`
  - `country_source`
  - `period_over_period_change`
- 订单级剩余维度仍未成立：
  - `country_structure`

### legacy page-request 证据边界
- 仓内 legacy seller page 报告里仍能看到：
  - `traffic_source`
  - `country_source`
  - `quick_reply_rate`
  - `country_structure`
- 但这些字段不属于当前 Railway production + official `/sync + access_token + sha256` 主线。
- 因此本轮不能把它们接入 live routes，也不能写成当前官方主线已确认。

### 本轮处理结果
- 本轮没有新增候选方法 runtime 验证
- 本轮没有扩 live routes
- 本轮只更新审计文档、候选池、矩阵与 evidence

## 2026-04-11 Stage 27 Derived Comparison Layer Delta

### stage26 收口结果
- `stage26 doc anchoring and validation preflight` 已 push 到 `origin/main`
- 最小线上基线确认结果：
  - `/health` -> `200`
  - `/integrations/alibaba/auth/debug` -> `200`
  - `/integrations/alibaba/wika/reports/operations/management-summary` -> `200`
  - `/integrations/alibaba/wika/reports/products/management-summary` -> `200`
  - `/integrations/alibaba/wika/reports/orders/management-summary` -> `200`

### Stage 27 当前新增能力
- 新增本地 derived comparison 候选层：
  - `/integrations/alibaba/wika/reports/operations/comparison-summary`
  - `/integrations/alibaba/wika/reports/products/comparison-summary`
  - `/integrations/alibaba/wika/reports/orders/comparison-summary`
- comparison 只使用当前已确认 official / derived 主线输入：
  - store: `visitor / imps / clk / clk_rate / fb / reply`
  - product: `click / impression / visitor / fb / order / bookmark / compare / share`
  - order: `formal_summary / product_contribution / trend_signal`
- comparison 只输出 derived 周期对比结果，不新增 official fields

### Stage 27 当前状态
- comparison helper 本地 contract 已通过
- comparison route 本地 contract 已通过
- 已新增 stage27 设计文档、验证脚本与脱敏 evidence
- 本轮尚未 push stage27，因此不能写成已部署上线

### 本轮仍未补齐的维度
- 店铺级仍 unavailable：
  - `traffic_source`
  - `country_source`
  - `quick_reply_rate`
- 产品级仍 unavailable：
  - `access_source`
  - `inquiry_source`
  - `country_source`
  - `period_over_period_change`
- 订单级仍 unavailable：
  - `country_structure`

### 当前边界
- comparison layer 是 derived comparison，不是官方新增字段
- comparison layer 不等于补齐 official gap
- not task 1 complete
- not task 2 complete
- not full business cockpit

## 2026-04-11 Stage 27 Deploy Lock Update

### stage27 远端锁定
- `8b3c5dde936d956b5cafff8f57daf2aebae69386` 已 push 到 `origin/main`
- stage27 当前已作为远端正式基线的一部分锁定

### stage27 production smoke
- 基础健康：
  - `/health` -> `200`
  - `/integrations/alibaba/auth/debug` -> `200 + JSON`
- 既有基线 route：
  - `/integrations/alibaba/wika/reports/operations/management-summary` -> `200 + JSON`
  - `/integrations/alibaba/wika/reports/products/management-summary` -> `200 + JSON`
  - `/integrations/alibaba/wika/reports/orders/management-summary` -> `200 + JSON`
  - `/integrations/alibaba/wika/reports/operations/minimal-diagnostic` -> `200 + JSON`
  - `/integrations/alibaba/wika/reports/products/minimal-diagnostic` -> `200 + JSON`
  - `/integrations/alibaba/wika/reports/orders/minimal-diagnostic` -> `200 + JSON`
- comparison routes：
  - `/integrations/alibaba/wika/reports/operations/comparison-summary` -> `200 + JSON`
  - `/integrations/alibaba/wika/reports/products/comparison-summary` -> `200 + JSON`
  - `/integrations/alibaba/wika/reports/orders/comparison-summary` -> `200 + JSON`

### stage27 已上线能力定位
- comparison layer 已部署，但只属于 derived comparison layer
- comparison layer 只复用当前 official mainline 与既有 derived 层
- comparison layer 不新增 official field，不回写覆盖现有字段命名

### 当前固定边界
- 店铺级仍缺：`traffic_source / country_source / quick_reply_rate`
- 产品级仍缺：`access_source / inquiry_source / country_source / period_over_period_change`
- 订单级仍缺：`country_structure`
- not task 1 complete
- not task 2 complete
- not full business cockpit

