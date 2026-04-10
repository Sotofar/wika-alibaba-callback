# WIKA_mydata_经营管理摘要层

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
