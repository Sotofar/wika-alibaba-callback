# WIKA_经营数据字段覆盖矩阵

## 2026-04-13 Stage 32 Operator Console Deploy Delta

### No new confirmed fields
- store official fields remain unchanged
- product official fields remain unchanged
- order derived layer remains unchanged

### Stage32 packaging delta
- `/integrations/alibaba/wika/reports/operator-console` only packages existing cockpit / action-center / task-workbench / preview readiness outputs.
- No field should be reclassified from unavailable to confirmed in this round.

## 2026-04-13 Stage 31 Operator Console Delta

### No new confirmed fields
- store official fields remain:
  - `visitor`
  - `imps`
  - `clk`
  - `clk_rate`
  - `fb`
  - `reply`
- product official fields remain:
  - `click`
  - `impression`
  - `visitor`
  - `fb`
  - `order`
  - `bookmark`
  - `compare`
  - `share`
  - `keyword_effects`
- order layer remains:
  - `formal_summary` -> derived
  - `product_contribution` -> derived
  - `trend_signal` -> derived
  - `country_structure` -> unavailable

### Stage31 packaging delta
- `operator-console` only repackages existing cockpit / action-center / task-workbench / preview readiness outputs.
- No field should be reclassified from unavailable to confirmed in this round.

## 2026-04-13 Stage 29 Action Center and Preview Delta

### No new confirmed fields
- store official fields remain:
  - `visitor`
  - `imps`
  - `clk`
  - `clk_rate`
  - `fb`
  - `reply`
- product official fields remain:
  - `click`
  - `impression`
  - `visitor`
  - `fb`
  - `order`
  - `bookmark`
  - `compare`
  - `share`
  - `keyword_effects`
- order layer remains:
  - `formal_summary` -> derived
  - `product_contribution` -> derived
  - `trend_signal` -> derived
  - `country_structure` -> unavailable

### Stage29 packaging delta
- `action-center` only repackages existing cockpit / diagnostic / comparison / workbench outputs.
- `product/reply/order preview` only expose input-aware preview layers on top of existing safe draft and external draft chains.
- No field should be reclassified from unavailable to confirmed in this round.

## 2026-04-11 Stage 28 Cockpit Delta

### No new confirmed fields
- store official fields remain:
  - `visitor`
  - `imps`
  - `clk`
  - `clk_rate`
  - `fb`
  - `reply`
- product official fields remain:
  - `click`
  - `impression`
  - `visitor`
  - `fb`
  - `order`
  - `bookmark`
  - `compare`
  - `share`
  - `keyword_effects`
- order layer remains:
  - `formal_summary` -> derived
  - `product_contribution` -> derived
  - `trend_signal` -> derived
  - `country_structure` -> unavailable

### Stage28 packaging delta
- `business-cockpit` only repackages existing official inputs, derived outputs, diagnostics, and unavailable dimensions.
- task3/4/5 workbench routes only package safe draft preparation and external draft workflows.
- No field should be reclassified from unavailable to confirmed in this round.

## 2026-04-11 Stage 26 Doc Anchoring Delta

### 本轮没有新增 confirmed 字段
- 店铺级没有新增 confirmed official field：
  - `traffic_source` 仍未成立
  - `country_source` 仍未成立
  - `quick_reply_rate` 仍未成立
- 产品级没有新增 confirmed official field：
  - `access_source` 仍未成立
  - `inquiry_source` 仍未成立
  - `country_source` 仍未成立
  - `period_over_period_change` 仍未成立
- 订单级没有新增 confirmed field：
  - `country_structure` 仍 unavailable

### 本轮结论
- 本轮只完成官方文档定锚与验证前置包，不扩 live routes
- 既有 `official / derived / unavailable` 三层边界保持不变

## 2026-04-11 Stage 23 Order Summary Deploy Delta

### 订单级新增 derived 字段暴露
- `formal_summary` -> derived field surfaced in deployed `/integrations/alibaba/wika/reports/orders/management-summary`
- `product_contribution` -> derived field surfaced in deployed `/integrations/alibaba/wika/reports/orders/management-summary`
- `trend_signal` -> derived field surfaced in deployed summary / minimal diagnostic, sample/window based only
- `country_structure` -> unavailable in deployed `orders/management-summary` and `orders/minimal-diagnostic`

### store / product 维度保持不变
- 本轮没有修改 store live routes
- 本轮没有修改 product live routes
- 本轮没有新增 store/product 真实字段

## 2026-04-10 Stage 21 Post-Deploy Delta

### 已在线上通过 management summary / diagnostic smoke 的店铺级字段
- `visitor` -> confirmed official field
- `imps` -> confirmed official field
- `clk` -> confirmed official field
- `clk_rate` -> confirmed official field
- `fb` -> confirmed official field
- `reply` -> confirmed official field
- `UV` -> conservative business mapping candidate
- `exposure` -> conservative business mapping candidate
- `traffic_source` -> not found in current response
- `country_source` -> not found in current response
- `quick_reply_rate` -> not found in current response

### 已在线上通过 management summary / diagnostic smoke 的产品级字段
- `click` -> confirmed official field
- `impression` -> confirmed official field
- `visitor` -> confirmed official field
- `fb` -> confirmed official field
- `order` -> confirmed official field
- `bookmark` -> confirmed official field
- `compare` -> confirmed official field
- `share` -> confirmed official field
- `keyword_effects` -> confirmed official field
- `CTR` -> derived field
- `access_source` -> not found in current response
- `inquiry_source` -> not found in current response
- `country_source` -> not found in current response
- `period_over_period_change` -> not found in current response

### 已在线上确认的产品采样边界
- `product_scope_basis / product_scope_limit / product_scope_truncated / product_ids_used_count` -> sampling boundary surfaced on deployed route

## 2026-04-10 Stage 21 Matrix Delta

### 已进入 management summary 层的店铺级 official fields
- `visitor` -> confirmed official field
- `imps` -> confirmed official field
- `clk` -> confirmed official field
- `clk_rate` -> confirmed official field
- `fb` -> confirmed official field
- `reply` -> confirmed official field

### 已进入 management summary 层的产品级 official fields
- `click` -> confirmed official field
- `impression` -> confirmed official field
- `visitor` -> confirmed official field
- `fb` -> confirmed official field
- `order` -> confirmed official field
- `bookmark` -> confirmed official field
- `compare` -> confirmed official field
- `share` -> confirmed official field
- `keyword_effects` -> confirmed official field

### Stage 21 新增的边界表达
- `UV` -> conservative business mapping candidate
- `exposure` -> conservative business mapping candidate
- `CTR` -> derived field
- `traffic_source` -> not found in current response
- `country_source` -> not found in current response
- `quick_reply_rate` -> not found in current response
- `access_source` -> not found in current response
- `inquiry_source` -> not found in current response
- `period_over_period_change` -> not found in current response
- `product_scope_limit / product_scope_truncated / product_ids_used_count` -> sampling boundary surfaced

## 2026-04-10 Stage 20 Matrix Delta

### Store-level official fields
- `visitor` -> confirmed official field
- `imps` -> confirmed official field
- `clk` -> confirmed official field
- `clk_rate` -> confirmed official field
- `fb` -> confirmed official field
- `reply` -> confirmed official field

### Store-level unavailable dimensions
- `traffic_source` -> not found in current response
- `country_source` -> not found in current response
- `quick_reply_rate` -> not found in current response

### Conservative business mapping
- `UV ~= visitor` -> business mapping pending
- `imps` -> use exposure/imps wording; do not assert PV confirmed
- `reply` -> use reply-related metric / recent first-reply-rate wording; do not assert broad response-rate confirmed

### Product-level official fields
- `click` -> confirmed official field
- `impression` -> confirmed official field
- `visitor` -> confirmed official field
- `fb` -> confirmed official field
- `order` -> confirmed official field
- `bookmark` -> confirmed official field
- `compare` -> confirmed official field
- `share` -> confirmed official field
- `keyword_effects` -> confirmed official field

### Product-level derived / unavailable dimensions
- `CTR` -> derived field
- `access_source` -> not found in current response
- `inquiry_source` -> not found in current response
- `country_source` -> not found in current response
- `period_over_period_change` -> not found in current response

更新时间：2026-04-10

本矩阵已从旧的“以 `AUTH_BLOCKED` 为主”切换到阶段 19 的 post-grant 真实结果。

| 维度 | 目标字段 | 当前标注 | 证据来源 |
| --- | --- | --- | --- |
| 店铺级（官方字段） | visitor | confirmed but blocked no longer | `overview.indicator.basic.get -> visitor` |
| 店铺级（官方字段） | imps | confirmed but blocked no longer | `overview.indicator.basic.get -> imps` |
| 店铺级（官方字段） | clk | confirmed but blocked no longer | `overview.indicator.basic.get -> clk` |
| 店铺级（官方字段） | clk_rate | confirmed but blocked no longer | `overview.indicator.basic.get -> clk_rate` |
| 店铺级（官方字段） | fb | confirmed but blocked no longer | `overview.indicator.basic.get -> fb` |
| 店铺级（官方字段） | reply | confirmed but blocked no longer | `overview.indicator.basic.get -> reply` |
| 店铺级（业务映射） | UV ~= visitor | business mapping pending | 官方返回 `visitor`，但当前不直接断言业务 UV 已完全等价 |
| 店铺级（业务映射） | PV | not yet evidenced | 当前只确认 `imps/exposure`，不直接断言 PV |
| 店铺级（业务映射） | broad response-rate | not yet evidenced | 当前只确认 `reply` 相关指标，建议使用 `reply-related metric / recent first-reply-rate` 表述 |
| 店铺级 | 流量来源 | not found in current response | `overview.indicator.basic.get extra_fields.source_related=[]` |
| 店铺级 | 国家来源 | not found in current response | `overview.indicator.basic.get extra_fields.country_related=[]` |
| 店铺级 | 快速回复率 | not found in current response | `overview.indicator.basic.get extra_fields.quick_reply_related=[]` |
| 产品级 | 曝光 | confirmed but blocked no longer | `self.product.get -> impression` |
| 产品级 | 点击 | confirmed but blocked no longer | `self.product.get -> click` |
| 产品级 | CTR | derived field | `click + impression` 可派生 |
| 产品级 | 访客 | confirmed but blocked no longer | `self.product.get -> visitor` |
| 产品级 | 询盘 | confirmed but blocked no longer | `self.product.get -> fb` |
| 产品级 | 订单 | confirmed but blocked no longer | `self.product.get -> order` |
| 产品级 | bookmark | confirmed but blocked no longer | `self.product.get -> bookmark` |
| 产品级 | compare | confirmed but blocked no longer | `self.product.get -> compare` |
| 产品级 | share | confirmed but blocked no longer | `self.product.get -> share` |
| 产品级 | 关键词来源 | confirmed but blocked no longer | `self.product.get -> keyword_effects` |
| 产品级 | 访问来源 | not found in current response | `self.product.get extra_fields.source_related=[]` |
| 产品级 | 询盘来源 | not found in current response | 当前响应未见公开字段覆盖 |
| 产品级 | 国家来源 | not found in current response | `self.product.get extra_fields.country_related=[]` |
| 产品级 | 近周期变化 | not found in current response | `self.product.get extra_fields.trend_related=[]` |
| 订单级 | 正式汇总 | not yet evidenced | 本轮未涉及订单经营汇总补齐 |
| 订单级 | 趋势 | derived field | 仍仅基于 `order.list.create_date` |
| 订单级 | 国家结构 | not yet evidenced | 本轮未新增订单国家结构证据 |
| 订单级 | 产品贡献 | not yet evidenced | 本轮未新增订单产品贡献证据 |

## 真实窗口补充

### 店铺级 overview 可用窗口
- `2026-03-29 -> 2026-04-04`
- `2026-03-22 -> 2026-03-28`
- `2026-03-15 -> 2026-03-21`
- `2026-03-08 -> 2026-03-14`

### 产品级 self.product 可用窗口
- `day`: `2026-03-10 -> 2026-04-08`
- `week`: `2026-03-08 -> 2026-04-04`
- `month`: `2026-03-01 -> 2026-03-31`

## 边界说明
- 本轮没有新增任何 Alibaba API 验证范围
- 本轮没有推进任何写侧动作
- 真实字段已返回，不等于 task 1 complete
- 真实字段已返回，不等于 task 2 complete
- 当前线程只处理 WIKA
- 当前轮次没有更新或推进任何 XD 结果


## 2026-04-11 Stage 22 Gap Compression Delta

### 店铺级剩余维度保持不变
- `traffic_source` -> not found in current response
- `country_source` -> not found in current response
- `quick_reply_rate` -> not found in current response

### 产品级剩余维度保持不变
- `access_source` -> not found in current response
- `inquiry_source` -> not found in current response
- `country_source` -> not found in current response
- `period_over_period_change` -> not found in current response

### 订单级缺口压缩增量
- `formal_summary` -> derived field from existing order APIs
- `country_structure` -> not derivable currently
- `product_contribution` -> derived field from existing order APIs

### 订单级派生边界
- `formal_summary` 当前只证明现有 `orders/list + orders/detail + orders/fund` 可做保守聚合
- `product_contribution` 当前只证明现有 `orders/detail.order_products` 可做样本级贡献聚合
- `country_structure` 当前仍缺 route-level country 实值，不得误写成已确认

## 2026-04-11 Stage 25 Gap Compression Round 2 Delta

### 店铺级剩余维度
- `traffic_source` -> current official mainline not found in current response
- `country_source` -> current official mainline not found in current response
- `quick_reply_rate` -> current official mainline not found in current response

补充说明：
- 仓内 legacy page-request 报告里能看到上述 3 个维度
- 但这些字段不属于当前 Railway production + official `/sync` 主线
- 因此本轮仍不能从 unavailable 改成 confirmed

### 产品级剩余维度
- `access_source` -> current official mainline not found in current response
- `inquiry_source` -> current official mainline not found in current response
- `country_source` -> current official mainline not found in current response
- `period_over_period_change` -> current official mainline not found in current response

### 订单级剩余维度
- `country_structure` -> not derivable currently

补充说明：
- current public `orders/detail` 只在 `available_field_keys` 中提示 `shipping_address`
- public body 仍未暴露 `shipping_address.country` 或 `buyer.country` 实值
- 因此 `country_structure` 继续保持 unavailable

## 2026-04-11 Stage 27 Comparison Layer Delta

### 店铺级 comparison derived outputs
- `visitor_delta` -> derived comparison output
- `imps_delta` -> derived comparison output
- `clk_delta` -> derived comparison output
- `clk_rate_delta` -> derived comparison output
- `fb_delta` -> derived comparison output
- `reply_delta` -> derived comparison output
- `trend_direction_summary` -> derived comparison output

### 产品级 comparison derived outputs
- `click_delta` -> derived comparison output
- `impression_delta` -> derived comparison output
- `visitor_delta` -> derived comparison output
- `fb_delta` -> derived comparison output
- `order_delta` -> derived comparison output
- `bookmark_delta` -> derived comparison output
- `compare_delta` -> derived comparison output
- `share_delta` -> derived comparison output
- `ranking_delta` -> derived comparison output
- `top_risers / top_decliners` -> derived comparison output

### 订单级 comparison derived outputs
- `observed_order_count_delta` -> derived comparison output
- `average_daily_order_count_delta` -> derived comparison output
- `current_segment / previous_segment` -> derived comparison output
- `product_contribution_delta` -> current local contract keeps `available=false`

### 本轮没有新增 official 字段
- store official fields 仍只确认：
  - `visitor / imps / clk / clk_rate / fb / reply`
- product official fields 仍只确认：
  - `click / impression / visitor / fb / order / bookmark / compare / share / keyword_effects`
- order official/public gap 仍未补齐：
  - `country_structure` 继续 unavailable

### 边界说明
- `period_over_period_change` 本轮只形成自建 derived comparison，不等于官方字段已确认
- comparison 输出不能回写覆盖 official fields

## 2026-04-11 Stage 27 Post-Deploy Delta

### 已部署的 comparison derived outputs
- 店铺级：
  - `visitor_delta`
  - `imps_delta`
  - `clk_delta`
  - `clk_rate_delta`
  - `fb_delta`
  - `reply_delta`
  - `trend_direction_summary`
- 产品级：
  - `click_delta`
  - `impression_delta`
  - `visitor_delta`
  - `fb_delta`
  - `order_delta`
  - `bookmark_delta`
  - `compare_delta`
  - `share_delta`
  - `ranking_delta`
  - `top_risers / top_decliners`
- 订单级：
  - `observed_order_count_delta`
  - `average_daily_order_count_delta`
  - `current_segment / previous_segment`

### 本轮没有新增 confirmed official fields
- comparison 部署成功，不等于新增 official 字段成立
- `period_over_period_change` 仍不能从 unavailable 改写为 confirmed official field
- `country_structure` 仍 unavailable

## 2026-04-11 Stage 28 Deploy Delta

### 本轮矩阵变化
- 本轮新增的是 cockpit/workbench consumption layer，不是新的 official field coverage
- store/product/order 当前 confirmed official / derived coverage 不变
- `business-cockpit` 只是把既有 `overview + comparison + diagnostic` 聚合到同一消费层
- `task3/4/5 workbench` 只是把既有 safe draft / external draft workflow 聚合为工作台消费层

### 本轮仍未改写的 unavailable 维度
- 店铺级：`traffic_source / country_source / quick_reply_rate`
- 产品级：`access_source / inquiry_source / country_source / period_over_period_change`
- 订单级：`country_structure`

