# WIKA Stage28 Unified Business Cockpit

## Status
- stage28 currently reaches local contract only.
- It is not deployed in this round.
- It must not be described as an online cockpit yet.

## Candidate route
- `/integrations/alibaba/wika/reports/business-cockpit`

## Aggregated sections
- `store_overview`
- `product_overview`
- `order_overview`
- `store_comparison`
- `product_comparison`
- `order_comparison`
- `store_diagnostic`
- `product_diagnostic`
- `order_diagnostic`
- `cross_section_gaps`
- `task_coverage_summary`
- `boundary_statement`

## Official inputs
- store:
  - `visitor`
  - `imps`
  - `clk`
  - `clk_rate`
  - `fb`
  - `reply`
- product:
  - `click`
  - `impression`
  - `visitor`
  - `fb`
  - `order`
  - `bookmark`
  - `compare`
  - `share`
  - `keyword_effects`
- order consumer layer:
  - existing order summary route outputs only

## Derived outputs
- all comparison outputs remain derived
- order `formal_summary` remains derived
- order `product_contribution` remains derived
- order `trend_signal` remains derived

## Unavailable dimensions
- store:
  - `traffic_source`
  - `country_source`
  - `quick_reply_rate`
- product:
  - `access_source`
  - `inquiry_source`
  - `country_source`
  - `period_over_period_change`
- order:
  - `country_structure`

## Task coverage summary
- `task1_partial_status`
- `task2_partial_status`
- `task3_partial_status`
- `task4_partial_status`
- `task5_partial_status`
- `task6_excluded`

## Boundary
- current official mainline plus derived layers only
- not task 1 complete
- not task 2 complete
- not task 3 complete
- not task 4 complete
- not task 5 complete
- task 6 excluded
- no write action attempted
- not full business cockpit

## 2026-04-11 Stage 28 Deploy Lock

### deployed route
- `/integrations/alibaba/wika/reports/business-cockpit`

### production status
- deployed to `origin/main`
- production smoke: `200 + JSON + PASS`
- acceptance mode: paced production smoke + single retry on `ApiCallLimit`

### fixed scope
- unified cockpit/workbench consumption layer only
- task coverage summary stays partial for task1~5
- task6 stays excluded
- no unavailable dimension is re-labeled as covered

## 2026-04-13 Stage 29/30 Action Center Addendum

### deployed route
- `/integrations/alibaba/wika/reports/action-center`

### what it adds
- 在既有 `business-cockpit` 之上，再向上补一层行动优先级消费视图
- 统一暴露：
  - `business_cockpit_summary`
  - `diagnostic_signal_summary`
  - `comparison_signal_summary`
  - `task3_summary`
  - `task4_summary`
  - `task5_summary`
  - `prioritized_actions`
  - `shared_blockers`
  - `boundary_statement`

### fixed boundary
- action-center 只是消费层，不是平台内执行层
- 只复用现有 cockpit / diagnostic / comparison / workbench 输出
- 不新增 official fields
- not full business cockpit
