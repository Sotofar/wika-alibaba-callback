# WIKA_mydata_经营管理摘要层

## 2026-04-11 Stage 23 Cross-Layer Note

### store / product 管理摘要层保持不变
- 本轮没有修改 `operations/management-summary`
- 本轮没有修改 `products/management-summary`
- 本轮没有新增 store/product 真实字段

### 订单层已单独外提
- stage23 新增订单 derived summary 层，详见：
  - `WIKA/docs/framework/WIKA_订单经营派生契约.md`
  - `WIKA/docs/framework/WIKA_订单经营摘要层.md`
- 当前订单层结论：
  - `formal_summary / product_contribution / trend_signal` 已在本地 contract 层成立
  - `country_structure` 仍 unavailable

## 2026-04-10 Stage 21 Post-Deploy Status

### production HTTP smoke
- `operations_management_summary` -> `200 + JSON`
- `products_management_summary` -> `200 + JSON`
- `operations_minimal_diagnostic` stage21 extension -> `200 + JSON`
- `products_minimal_diagnostic` stage21 extension -> `200 + JSON`

### 已在线确认的经营管理摘要层
- `/integrations/alibaba/wika/reports/operations/management-summary`
  - official fields、derived fields、unavailable dimensions、boundary statement 已在线生效
- `/integrations/alibaba/wika/reports/products/management-summary`
  - aggregate_official_metrics、ranking_sections、keyword_signal_summary、sample boundary 已在线生效
- `/integrations/alibaba/wika/reports/operations/minimal-diagnostic`
  - `signal_interpretation / recommendation_block / unavailable_dimensions_echo / confidence_hints` 已在线生效
- `/integrations/alibaba/wika/reports/products/minimal-diagnostic`
  - `ranking_interpretation / keyword_signal_takeaways / recommendation_block / unavailable_dimensions_echo / confidence_hints` 已在线生效

### 当前固定边界
- `products management summary` 当前仍是 sample-based，不是默认全量全店
- 当前仍缺：
  - store: `traffic_source / country_source / quick_reply_rate`
  - product: `access_source / inquiry_source / country_source / period_over_period_change`
  - order: 正式汇总 / 国家结构 / 产品贡献
- not task 1 complete
- not task 2 complete
- not full business cockpit

更新时间：2026-04-10

## 本轮目标
- 不新增 Alibaba API 探索
- 只在已经证实可用的 5 个 `mydata` 方法之上，建立面向业务消费的经营管理摘要层
- 不推进 XD
- 不做任何写动作

## 新增共享层

### `shared/data/modules/wika-mydata-management-summary.js`
- `buildOperationsManagementSummary({ dateRange?, industryId? })`
- `buildProductsManagementSummary({ statisticsType?, statDate?, productLimit?, productIds? })`

### `shared/data/modules/wika-mydata-product-ranking.js`
- 负责产品样本聚合、排名截面、关键词信号摘要和 derived CTR 计算

## 新增或扩展的正式路由

### 店铺经营管理摘要
- route: `/integrations/alibaba/wika/reports/operations/management-summary`
- source methods:
  - `alibaba.mydata.overview.date.get`
  - `alibaba.mydata.overview.industry.get`
  - `alibaba.mydata.overview.indicator.basic.get`
- 输出重点：
  - `report_scope`
  - `source_methods`
  - `date_range`
  - `industry`
  - `official_metrics`
  - `derived_metrics`
  - `interpretation`
  - `unavailable_dimensions`
  - `recommendations`
  - `boundary_statement`

### 产品经营管理摘要
- route: `/integrations/alibaba/wika/reports/products/management-summary`
- source methods:
  - `alibaba.mydata.self.product.date.get`
  - `alibaba.mydata.self.product.get`
  - `/integrations/alibaba/wika/data/products/list`（仅作为受控样本 `product_ids` 辅助来源）
- 输出重点：
  - `statistics_type`
  - `stat_date`
  - `product_scope_basis`
  - `product_scope_limit`
  - `product_scope_truncated`
  - `product_ids_used`
  - `product_ids_used_count`
  - `aggregate_official_metrics`
  - `aggregate_derived_metrics`
  - `ranking_sections`
  - `keyword_signal_summary`
  - `unavailable_dimensions`
  - `boundary_statement`

## 口径治理

### official fields 保留原名
- 店铺级：
  - `visitor`
  - `imps`
  - `clk`
  - `clk_rate`
  - `fb`
  - `reply`
- 产品级：
  - `click`
  - `impression`
  - `visitor`
  - `fb`
  - `order`
  - `bookmark`
  - `compare`
  - `share`
  - `keyword_effects`

### conservative mapping only
- `UV ~= visitor（business-mapping pending）`
- 使用 `exposure / imps` 表述，不直接写 `PV confirmed`
- `reply` 只按 `reply-related metric / recent first-reply-rate` 语境使用，不扩写成广义 `response rate confirmed`

### derived fields
- `ctr_candidate_from_clk_rate`
- `ctr_from_click_over_impression`

### unavailable dimensions
- 店铺级：
  - `traffic_source`
  - `country_source`
  - `quick_reply_rate`
- 产品级：
  - `access_source`
  - `inquiry_source`
  - `country_source`
  - `period_over_period_change`

## 采样边界
- `self.product.get` 仍受单批 `product_ids` 上限约束
- 当前产品经营摘要默认是受控样本聚合，不伪装成全店全量统计
- 业务使用时必须同时查看：
  - `product_scope_basis`
  - `product_scope_limit`
  - `product_scope_truncated`
  - `product_ids_used_count`

## 诊断消费层扩展
- `/integrations/alibaba/wika/reports/operations/minimal-diagnostic`
  - 新增 `signal_interpretation`
  - 新增 `recommendation_block`
  - 新增 `unavailable_dimensions_echo`
  - 新增 `confidence_hints`
- `/integrations/alibaba/wika/reports/products/minimal-diagnostic`
  - 新增 `ranking_interpretation`
  - 新增 `keyword_signal_takeaways`
  - 新增 `recommendation_block`
  - 新增 `unavailable_dimensions_echo`
  - 新增 `confidence_hints`

## 验证结论
- `operations_management_summary` -> `PASS_LIVE_HELPER_CONTRACT`
- `products_management_summary` -> `PASS_LIVE_HELPER_CONTRACT`
- `operations_minimal_diagnostic` stage21 extension -> `PASS_LIVE_HELPER_CONTRACT`
- `products_minimal_diagnostic` stage21 extension -> `PASS_LIVE_HELPER_CONTRACT`

说明：
- 当前轮次尚未 push，因此新增或扩展后的 route 尚未做 production HTTP smoke
- 当前只验证 live helper contract 与结构化 evidence

## 边界
- 本轮没有新增 Alibaba API 探索
- 本轮没有推进 XD
- 本轮没有任何写动作
- 本轮只是 task 1 / task 2 的局部实现继续推进
- 当前仍然不是完整经营驾驶舱


## 2026-04-11 Stage 22 Gap Compression Status

### 本轮没有扩 live routes
- `operations_management_summary` 保持 stage21 已部署结构，不新增字段
- `products_management_summary` 保持 stage21 已部署结构，不新增字段
- 原因：
  - 本轮没有新增 store/product 真实字段
  - 只完成了现有字段穷尽审计与订单级缺口压缩

### stage22 之后的固定边界
- store-level 仍缺：
  - `traffic_source`
  - `country_source`
  - `quick_reply_rate`
- product-level 仍缺：
  - `access_source`
  - `inquiry_source`
  - `country_source`
  - `period_over_period_change`
- order-level 新增收口：
  - `formal_summary` -> 可由现有只读订单链保守派生
  - `product_contribution` -> 可由现有只读订单链保守派生
  - `country_structure` -> 当前仍未暴露 route-level country 实值
- 因此当前 management summary 层继续保持：
  - store/product only
  - no new live route fields in this round
  - not full business cockpit

## 2026-04-11 Stage 25 Gap Compression Round 2 Delta

### 本轮没有扩容 mydata live routes
- `operations/management-summary` 保持当前 official 字段：
  - `visitor / imps / clk / clk_rate / fb / reply`
- `products/management-summary` 保持当前 official 字段：
  - `click / impression / visitor / fb / order / bookmark / compare / share / keyword_effects`
- `operations/products minimal-diagnostic` 保持现有解释层，不新增剩余维度字段

### 剩余维度当前结论
- `traffic_source / country_source / quick_reply_rate`：
  - 仓内 legacy page-request 报告里见过
  - 但 current official mainline 未出现
  - 本轮不接入 live routes
- `access_source / inquiry_source / country_source / period_over_period_change`：
  - current official mainline 未出现
  - 本轮不接入 live routes

## 2026-04-11 Stage 27 Comparison Candidate Delta

### 店铺级 comparison candidate
- 新增本地 comparison helper：
  - `WIKA/projects/wika/data/reports/operations-comparison.js`
- 新增本地 comparison route 候选：
  - `/integrations/alibaba/wika/reports/operations/comparison-summary`
- 只复用当前 official inputs：
  - `visitor / imps / clk / clk_rate / fb / reply`
- 新增 derived outputs：
  - `metric_deltas`
  - `trend_direction_summary`
  - `current_window vs previous_window`

### 产品级 comparison candidate
- 新增本地 comparison helper：
  - `WIKA/projects/wika/data/reports/products-comparison.js`
- 新增本地 comparison route 候选：
  - `/integrations/alibaba/wika/reports/products/comparison-summary`
- 只复用当前 official inputs：
  - `click / impression / visitor / fb / order / bookmark / compare / share`
- 新增 derived outputs：
  - `aggregate_metric_deltas`
  - `ranking_delta`
  - `top_risers / top_decliners`
  - `item_level_deltas`

### 当前边界
- comparison layer 是自建 derived comparison，不新增 official 字段
- `period_over_period_change` 若在 comparison 中出现，只能写成 derived comparison output
- `traffic_source / country_source / quick_reply_rate / access_source / inquiry_source / country_source` 继续 unavailable
- 本轮 comparison 只达到本地 contract，不写成已部署上线


