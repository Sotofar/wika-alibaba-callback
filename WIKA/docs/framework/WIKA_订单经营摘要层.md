# WIKA_订单经营摘要层

## 2026-04-11 Stage 28 Cockpit Consumption Note

### Order layer reuse in cockpit
- stage28 `business-cockpit` consumes:
  - `/integrations/alibaba/wika/reports/orders/management-summary`
  - `/integrations/alibaba/wika/reports/orders/comparison-summary`
  - `/integrations/alibaba/wika/reports/orders/minimal-diagnostic`
- reused order outputs remain:
  - `formal_summary` -> derived
  - `product_contribution` -> derived
  - `trend_signal` -> derived
  - `country_structure` -> unavailable

### Stage28 boundary
- `business-cockpit` does not add new order official fields.
- `business-cockpit` does not turn `country_structure` into covered capability.
- stage28 is local contract only and is not yet deployed.

更新时间：2026-04-11

## 本轮目标
- 把 stage22 已确认可保守派生的订单维度沉淀为正式只读摘要层。
- 只处理 WIKA，只复用现有 order 只读 route，不新增 Alibaba API 探索。

## 新增或更新对象
- 新增 helper：
  - `shared/data/modules/wika-order-management-summary.js`
- 新增 route：
  - `/integrations/alibaba/wika/reports/orders/management-summary`
- 扩展 route：
  - `/integrations/alibaba/wika/reports/orders/minimal-diagnostic`

## 当前输出边界
### orders management summary
- `report_name`
- `generated_at`
- `report_scope`
- `source_routes`
- `source_limitations`
- `formal_summary`
- `product_contribution`
- `trend_signal`
- `unavailable_dimensions`
- `recommendations`
- `boundary_statement`

### 订单最小诊断新增 section
- `formal_summary_section`
- `product_contribution_section`
- `trend_signal_section`
- `unavailable_dimensions_echo`
- `recommendation_block`
- `confidence_hints`

## 本地 contract 验证结果
- `/integrations/alibaba/wika/reports/orders/management-summary` -> `PASS_LOCAL_CONTRACT`
- `/integrations/alibaba/wika/reports/orders/minimal-diagnostic` -> `PASS_LOCAL_CONTRACT`
- 当前验证样本：
  - `observed_trade_count=3`
  - `total_order_count=120`
  - `top_products_by_order_count=5`

## production deployment smoke 结果
- `/integrations/alibaba/wika/reports/orders/management-summary` -> `200 + JSON + PASS`
- `/integrations/alibaba/wika/reports/orders/minimal-diagnostic` -> `200 + JSON + PASS`
- 联动复核通过：
  - `/integrations/alibaba/wika/reports/operations/management-summary`
  - `/integrations/alibaba/wika/reports/products/management-summary`
  - `/integrations/alibaba/wika/reports/operations/minimal-diagnostic`
  - `/integrations/alibaba/wika/reports/products/minimal-diagnostic`

## 当前固定边界
- 当前 orders management summary 是 derived / conservative / partial 的。
- 当前 trend 只按 sample/window based 暴露。
- 当前 `country_structure` 仍 unavailable。
- 当前 stage23 已 push 并完成 deployment smoke。
- not task 1 complete
- not task 2 complete
- no write action attempted
- WIKA-only thread
- XD untouched in this round
- not full business cockpit

## 2026-04-11 Stage 25 Gap Compression Round 2 Delta

### 本轮订单级结论
- `formal_summary`：继续保持 `DERIVABLE_FROM_EXISTING_APIS`
- `product_contribution`：继续保持 `DERIVABLE_FROM_EXISTING_APIS`
- `trend_signal`：继续保持现有 derived 结论
- `country_structure`：继续保持 unavailable

### 为什么 `country_structure` 仍不能成立
- current public `orders/detail` 只在 `available_field_keys` 中提示 `shipping_address`
- public body 仍未直接暴露 `shipping_address.country` 或 `buyer.country` 实值
- 仓内 legacy page-request 报告虽然见过国家分布，但不属于当前 official `/sync` 主线
- 因此本轮不扩 `orders/management-summary` 与 `orders/minimal-diagnostic`

## 2026-04-11 Stage 27 Orders Comparison Candidate

### 本轮新增 comparison 能力
- 新增本地 comparison helper：
  - `WIKA/projects/wika/data/reports/orders-comparison.js`
- 新增本地 comparison route 候选：
  - `/integrations/alibaba/wika/reports/orders/comparison-summary`

### comparison 输入基础
- 只复用当前既有订单 derived 层：
  - `formal_summary`
  - `product_contribution`
  - `trend_signal`
- 当前 comparison basis：
  - current observed segment vs previous observed segment
  - 来源仍是当前 order summary 已可稳定使用的 window/sample

### comparison 输出
- `observed_order_count_delta`
- `average_daily_order_count_delta`
- `current_segment`
- `previous_segment`
- `comparison_boundary`

### 本轮仍保守保留的边界
- `product_contribution_delta` 当前仅保留 `available=false`
- `country_structure` 继续 unavailable
- comparison 是 derived / conservative / partial，不是完整官方订单经营报表
- 本轮只达到本地 contract，不写成已部署上线

## 2026-04-11 Stage 27 Orders Comparison Deploy Delta

### 已部署 route
- `/integrations/alibaba/wika/reports/orders/comparison-summary` -> `200 + JSON + PASS`

### 已部署 comparison 边界
- `official_inputs / derived_comparison / unavailable_dimensions / boundary_statement` 均已在线返回
- `country_structure` 继续在 `unavailable_dimensions` 中显式保留
- `product_contribution_delta` 当前仍保留 `available=false`
- 当前 route 继续只属于 derived / conservative / partial comparison
