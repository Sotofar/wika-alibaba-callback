# WIKA 剩余经营维度现有字段穷尽审计（第二轮）

更新时间：2026-04-11

## 本轮范围

- 当前线程只处理 WIKA
- 本轮先复核 stage24 远端基线，再检查 current official mainline 是否已经覆盖剩余经营维度
- 只有在 current official mainline 明确没有覆盖时，才继续保留既有 doc-found only 候选
- 本轮没有新增写动作，没有推进 XD，没有扩 live routes

## stage24 线上基线回归

- `/health` -> PASS
- `/integrations/alibaba/auth/debug` -> PASS
- `/integrations/alibaba/wika/reports/operations/management-summary` -> PASS
- `/integrations/alibaba/wika/reports/products/management-summary` -> PASS
- `/integrations/alibaba/wika/reports/orders/management-summary` -> PASS

## 现有字段穷尽审计矩阵

| 维度 | 层级 | official raw 已出现 | helper 已拿到但未暴露 | live route 已暴露 | 现有 official route 是否可派生 | legacy page-request 已见 | 当前结论 | 关键证据 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `traffic_source` | store | 否 | 否 | 否 | 否 | 是 | `NOT_DERIVABLE_CURRENTLY` | official mainline: overview indicator extra_fields.source_related=[]；live routes: unavailable_dimensions 保持 traffic_source；legacy page_request: overview.traffic_sources 有 21 条 |
| `country_source` | store | 否 | 否 | 否 | 否 | 是 | `NOT_DERIVABLE_CURRENTLY` | official mainline: overview indicator extra_fields.country_related=[]；live routes: unavailable_dimensions 保持 country_source；legacy page_request: visitor_country_distribution=20, key_market_distribution=10 |
| `quick_reply_rate` | store | 否 | 否 | 否 | 否 | 是 | `NOT_DERIVABLE_CURRENTLY` | official mainline: overview indicator extra_fields.quick_reply_related=[]；live routes: unavailable_dimensions 保持 quick_reply_rate；legacy page_request: snapshot.reply_within_5min_rate_30d=0.472 |
| `access_source` | product | 否 | 否 | 否 | 否 | 否 | `NOT_DERIVABLE_CURRENTLY` | official mainline: self.product extra_fields.source_related=[]；live routes: unavailable_dimensions 保持 access_source |
| `inquiry_source` | product | 否 | 否 | 否 | 否 | 否 | `NOT_DERIVABLE_CURRENTLY` | official mainline: 当前 product raw evidence 未见 inquiry 同义字段；live routes: unavailable_dimensions 保持 inquiry_source |
| `country_source` | product | 否 | 否 | 否 | 否 | 否 | `NOT_DERIVABLE_CURRENTLY` | official mainline: self.product extra_fields.country_related=[]；live routes: unavailable_dimensions 保持 country_source |
| `period_over_period_change` | product | 否 | 否 | 否 | 否 | 否 | `NOT_DERIVABLE_CURRENTLY` | official mainline: self.product extra_fields.trend_related=[]；live routes: unavailable_dimensions 保持 period_over_period_change |
| `formal_summary` | order | 是 | 否 | 是 | 是 | 否 | `DERIVABLE_FROM_EXISTING_APIS` | orders/list 提供可复用 trade_id + create_date；orders/detail 暴露 amount / product_total_amount / shipment_fee / trade_status；orders/fund 暴露 service_fee 与 fund_pay_list |
| `country_structure` | order | 否 | 是 | 否 | 否 | 是 | `NOT_DERIVABLE_CURRENTLY` | official current route: orders/detail.available_field_keys 出现 shipping_address，但 public body 未返回 shipping_address.country / buyer.country；legacy page_request: buyerCountryDistribution=5, shippingCountryDistribution=5 |
| `product_contribution` | order | 是 | 否 | 是 | 是 | 否 | `DERIVABLE_FROM_EXISTING_APIS` | orders/detail 暴露 order_products[].product_id / quantity / unit_price；可在现有只读链上按 trade_id 聚合产品贡献 |

## legacy page-request 补充说明

- 以下字段只代表仓内历史 seller page / page-request 报告里见过，不代表当前 official `/sync` 主线已成立：
  - `traffic_source` -> 已见 21 条 traffic source 记录
  - `country_source` -> 已见 visitor_country_distribution=20、key_market_distribution=10
  - `quick_reply_rate` -> 已见 reply_within_5min_rate_30d=0.472
  - `country_structure` -> 已见 buyer/shipping country 分布（buyer=5, shipping=5)
- 因当前线程仍严格限定在 Railway production + official `/sync + access_token + sha256`，这些 legacy page-request 证据本轮不能接入 live routes。

## 本轮结论

- 店铺级剩余维度 `traffic_source / country_source / quick_reply_rate`：当前 official mydata raw evidence 与 live routes 都未出现同义字段，继续保持 unavailable。
- 产品级剩余维度 `access_source / inquiry_source / country_source / period_over_period_change`：当前 official mydata raw evidence 与 live routes 都未出现同义字段，继续保持 unavailable。
- 订单级：
  - `formal_summary`：当前已可由现有 `orders/list + orders/detail + orders/fund` 保守派生。
  - `product_contribution`：当前已可由现有 `orders/detail.order_products` 保守派生。
  - `country_structure`：当前 public route 未暴露 country 实值，虽然 `available_field_keys` 提示存在 `shipping_address`，但仍不能写成已成立。

## 订单级最小派生证明

- sampled_trade_count: 3
- sampled_trade_ids_count: 3
- sampled_total_amount_sum: 2445.2
- sampled_product_total_amount_sum: 1857.5
- sampled_shipment_fee_sum: 587.7
- sampled_service_fee_sum: 73.36
- 说明：这只是既有 derived 结论的再次复核，不等于订单经营驾驶舱已成立。

## 候选方法复核

- 本轮新增候选方法：无
- 原因：现有链路审计后没有出现必须立即新增 runtime 验证的官方入口，同时仓内既有 doc-found only 候选仍缺 doc URL 与稳定参数契约。

| method | 目标方向 | 当前分类 | 本轮是否 runtime 验证 | 备注 |
| --- | --- | --- | --- | --- |
| `alibaba.seller.trade.decode` | country_structure / order_identifier_contract | `DOC_FOUND_NOT_TESTED` | 否 | 仓内仅保留 doc-found 记录；本轮没有足够 doc URL 与参数契约落盘，不进入 runtime 验证。 |
| `alibaba.mydata.self.keyword.date.get` | access_source / keyword_window | `DOC_FOUND_NOT_TESTED` | 否 | 仓内只有 method 名记录，当前没有稳定参数契约，不能把它当成剩余产品维度的当前官方入口。 |
| `alibaba.mydata.self.keyword.effect.week.get` | keyword_effects / period_over_period_change | `DOC_FOUND_NOT_TESTED` | 否 | 仓内已有 doc-found 记录，但没有可复核的 doc URL 与安全参数契约，本轮不测。 |
| `alibaba.mydata.self.keyword.effect.month.get` | keyword_effects / period_over_period_change | `DOC_FOUND_NOT_TESTED` | 否 | 仓内已有 doc-found 记录，但没有可复核的 doc URL 与安全参数契约，本轮不测。 |
| `alibaba.mydata.industry.keyword.get` | industry_keyword_signal | `DOC_FOUND_NOT_TESTED` | 否 | 当前更像关键词补充方向，不是本轮 store/product/order 剩余维度的直接 route-level 证据入口。 |
| `alibaba.mydata.seller.opendata.getconkeyword` | seller_keyword_signal | `DOC_FOUND_NOT_TESTED` | 否 | 当前更像关键词侧补充，不是本轮剩余 source/country/change 缺口的直接 current official mainline 入口。 |

## 当前 live route 处理

- 本轮没有扩 live routes。
- 当前仍应保持：
  - store 侧 `traffic_source / country_source / quick_reply_rate` unavailable
  - product 侧 `access_source / inquiry_source / country_source / period_over_period_change` unavailable
  - order 侧 `country_structure` unavailable

## 当前边界

- not task 1 complete
- not task 2 complete
- no write action attempted
- WIKA-only thread
- XD untouched in this round
- not full business cockpit

