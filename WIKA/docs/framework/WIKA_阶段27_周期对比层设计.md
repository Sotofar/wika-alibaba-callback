# WIKA_阶段27_周期对比层设计
更新时间：2026-04-11

## 本轮目标
- 只基于当前已经确认可用的 official mainline 与既有 derived 层，新增一层 `derived comparison layer`。
- 本轮不新增 Alibaba API 探索，不新增 doc-found runtime 验证，不推进任何写侧动作。
- 本轮 comparison 只做到本地 contract 与可上线候选，不直接写成已部署上线。

## comparison 对象

### 店铺级 comparison
- current inputs：
  - `visitor`
  - `imps`
  - `clk`
  - `clk_rate`
  - `fb`
  - `reply`
- current window：
  - 当前 live `operations management summary` 的 `date_range`
- previous comparable window：
  - 与 current window 同长度、紧邻其前的可比较窗口
- derived outputs：
  - `metric_deltas`
  - `delta_value`
  - `delta_rate`
  - `trend_direction`
  - `trend_direction_summary`

### 产品级 comparison
- current inputs：
  - `click`
  - `impression`
  - `visitor`
  - `fb`
  - `order`
  - `bookmark`
  - `compare`
  - `share`
- current window：
  - 当前 `statistics_type + stat_date`
- previous comparable window：
  - 同一 `statistics_type` 下的上一个可比较 `stat_date`
- sample boundary：
  - previous window 复用 current window 的 `product_ids_used`
  - 继续沿用当前 sample/cap 约束，不伪装成全店全量
- derived outputs：
  - `aggregate_metric_deltas`
  - `ranking_delta`
  - `top_risers_by_click_delta`
  - `top_decliners_by_click_delta`
  - `item_level_deltas`
  - `keyword_signal_delta`

### 订单级 comparison
- current inputs：
  - `formal_summary`
  - `product_contribution`
  - `trend_signal`
- current window：
  - 当前 orders derived summary 的 observed segment
- previous comparable window：
  - 同长度的前一段 observed segment
- derived outputs：
  - `observed_order_count_delta`
  - `average_daily_order_count_delta`
  - `current_segment`
  - `previous_segment`
  - `product_contribution_delta`（当前先保留 `available=false`）

## official inputs 与 derived outputs 边界
- comparison 层只读取 current official mainline 与既有 derived summary。
- comparison 层不新增任何 official field，不覆盖现有 official 字段命名。
- comparison 层新增的所有结果都必须显式标记为 derived。

## unavailable dimensions
- 店铺级仍 unavailable：
  - `traffic_source`
  - `country_source`
  - `quick_reply_rate`
- 产品级仍 unavailable：
  - `access_source`
  - `inquiry_source`
  - `country_source`
  - `period_over_period_change` 的 official field
- 订单级仍 unavailable：
  - `country_structure`

## comparison boundary
- comparison layer 是 derived comparison，不是官方新增字段。
- comparison layer 不等于补齐 official gap。
- comparison layer 不等于完整经营驾驶舱。
- comparison 输出必须带：
  - `comparison_basis`
  - `current_window`
  - `previous_window`
  - `unavailable_dimensions`
  - `boundary_statement`

## sample / cap / window limitations
- 店铺级 comparison 只在当前可用 `date_range` 上做窗口对比。
- 产品级 comparison 继续使用 sample-based `product_ids_used`，不是全店全量。
- 订单级 comparison 继续基于当前 observed trade/window，属于 conservative / partial comparison。

## 可上线前置条件
- comparison helper 本地 contract 通过。
- comparison route 本地 contract 通过。
- `official_inputs / derived_comparison / unavailable_dimensions / boundary_statement` 四层结构清楚。
- 不会被误读为官方新增字段或全量全历史统计。

## 本轮状态
- comparison 设计已完成。
- comparison helper 与 comparison route 已形成本地候选实现。
- 本轮尚未 push stage27，因此当前只属于可上线候选，不写成已部署上线。

## post-deploy 状态
- `stage27 wika comparison layer` 已 push 到 `origin/main`
- 已通过 production smoke：
  - `/integrations/alibaba/wika/reports/operations/comparison-summary`
  - `/integrations/alibaba/wika/reports/products/comparison-summary`
  - `/integrations/alibaba/wika/reports/orders/comparison-summary`
- 已确认 comparison route 在线仍保持：
  - `official_inputs`
  - `derived_comparison`
  - `unavailable_dimensions`
  - `boundary_statement`
- 当前结论：
  - stage27 已部署并 smoke 通过
  - comparison layer 仍只属于 derived comparison layer
  - 不新增 official fields
