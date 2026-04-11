# WIKA_mydata_正式只读路由与诊断扩展

更新时间：2026-04-10

## 本轮目标
- 只把已证实可用的 5 个 `mydata` 方法沉淀为正式只读共享层与报告路由
- 只扩展 WIKA 诊断层
- 不新增 Alibaba API 探索
- 不推进 XD
- 不做任何写动作

## 新增共享只读层

### `shared/data/modules/alibaba-mydata-overview.js`
- `getOverviewDateRange()`
- `getOverviewIndustries({ dateRange })`
- `getOverviewIndicatorBasic({ dateRange, industryId })`
- `fetchWikaOperationsTrafficSummary()`

### `shared/data/modules/alibaba-mydata-product-performance.js`
- `getSelfProductDateWindows({ statisticsType })`
- `getSelfProductPerformance({ statisticsType, statDate, productIds })`
- `fetchWikaProductPerformanceSummary()`

## 新增正式报告路由

### Operations
- route: `/integrations/alibaba/wika/reports/operations/traffic-summary`
- source methods:
  - `alibaba.mydata.overview.date.get`
  - `alibaba.mydata.overview.industry.get`
  - `alibaba.mydata.overview.indicator.basic.get`
- confirmed official fields:
  - `visitor`
  - `imps`
  - `clk`
  - `clk_rate`
  - `fb`
  - `reply`
- derived fields:
  - `uv_candidate_from_visitor`
  - `exposure_from_imps`
  - `ctr_candidate_from_clk_rate`
  - `reply_related_metric_from_reply`
- unavailable dimensions:
  - `traffic_source`
  - `country_source`
  - `quick_reply_rate`

### Products
- route: `/integrations/alibaba/wika/reports/products/performance-summary`
- source methods:
  - `alibaba.mydata.self.product.date.get`
  - `alibaba.mydata.self.product.get`
- confirmed official fields:
  - `click`
  - `impression`
  - `visitor`
  - `fb`
  - `order`
  - `bookmark`
  - `compare`
  - `share`
  - `keyword_effects`
- derived fields:
  - `ctr_from_click_over_impression`
- unavailable dimensions:
  - `access_source`
  - `inquiry_source`
  - `country_source`
  - `period_over_period_change`

## 已扩展的诊断路由
- `/integrations/alibaba/wika/reports/operations/minimal-diagnostic`
  - 新增 `traffic_performance_section`
  - 仅使用 confirmed official fields + derived fields + unavailable dimensions
- `/integrations/alibaba/wika/reports/products/minimal-diagnostic`
  - 新增 `performance_section`
  - 仅使用 confirmed official fields + derived fields + unavailable dimensions

## 固定口径规则
- Keep official field names:
  - `visitor / imps / clk / clk_rate / fb / reply`
  - `click / impression / visitor / fb / order / bookmark / compare / share / keyword_effects`
- Conservative mapping only:
  - `UV ~= visitor (business-mapping pending)`
  - use exposure/imps wording, do not assert PV confirmed
  - use reply-related metric / recent first-reply-rate wording, do not assert broad response-rate confirmed
- Derived fields must stay explicit:
  - `CTR` is derived, not an official direct field
- Unavailable dimensions must stay explicit:
  - do not silently infer source / country / quick reply / period-over-period dimensions

## 验证结论
- `operations_traffic_summary` -> `PASS_LIVE_HELPER_CONTRACT`
- `products_performance_summary` -> `PASS_LIVE_HELPER_CONTRACT`
- `operations_minimal_diagnostic` -> `PASS_LIVE_HELPER_CONTRACT`
- `products_minimal_diagnostic` -> `PASS_LIVE_HELPER_CONTRACT`

说明：
- 当前 round 在 push 前只验证 live helper contract
- 新增 HTTP routes 的 production HTTP smoke 需要等待部署后再做

## 边界
- not task 1 complete
- not task 2 complete
- no write action attempted
- WIKA-only thread
- XD untouched in this round
- not full business cockpit
