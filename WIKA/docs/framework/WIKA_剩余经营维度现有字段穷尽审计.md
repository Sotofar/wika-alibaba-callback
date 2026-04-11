# WIKA_剩余经营维度现有字段穷尽审计

更新时间：2026-04-11

## 本轮范围

- 当前线程只处理 WIKA
- 本轮先复核 stage21 在线基线，再检查现有响应、现有 helper、现有 route 是否已经包含剩余经营维度
- 只有在现有响应确实没有覆盖时，才允许把对象继续留在候选池
- 本轮没有新增写动作，没有推进 XD，没有扩 live routes

## stage21 在线基线复核

- `/health` -> PASS
- `/integrations/alibaba/auth/debug` -> PASS
- `/integrations/alibaba/wika/reports/operations/management-summary` -> PASS
- `/integrations/alibaba/wika/reports/products/management-summary` -> PASS

## 现有字段穷尽审计矩阵

| 维度 | 层级 | raw response 已出现 | helper 已拿到但未暴露 | live route 已暴露 | 现有路由是否可派生 | 当前结论 | 关键证据 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `traffic_source` | store | 否 | 否 | 否 | 否 | `NOT_DERIVABLE_CURRENTLY` | alibaba_mydata_overview_indicator_basic_get_post_grant.json extra_fields.source_related=[]；operations_management_summary.unavailable_dimensions 包含 traffic_source；operations_minimal_diagnostic.unavailable_dimensions_echo 继续标记 traffic_source |
| `country_source` | store | 否 | 否 | 否 | 否 | `NOT_DERIVABLE_CURRENTLY` | alibaba_mydata_overview_indicator_basic_get_post_grant.json extra_fields.country_related=[]；operations_management_summary.unavailable_dimensions 包含 country_source；operations_minimal_diagnostic.unavailable_dimensions_echo 继续标记 country_source |
| `quick_reply_rate` | store | 否 | 否 | 否 | 否 | `NOT_DERIVABLE_CURRENTLY` | alibaba_mydata_overview_indicator_basic_get_post_grant.json extra_fields.quick_reply_related=[]；operations_management_summary.unavailable_dimensions 包含 quick_reply_rate；operations_minimal_diagnostic.unavailable_dimensions_echo 继续标记 quick_reply_rate |
| `access_source` | product | 否 | 否 | 否 | 否 | `NOT_DERIVABLE_CURRENTLY` | alibaba_mydata_self_product_get_post_grant.json extra_fields.source_related=[]；products_management_summary.unavailable_dimensions 包含 access_source；products_minimal_diagnostic.unavailable_dimensions_echo 继续标记 access_source |
| `inquiry_source` | product | 否 | 否 | 否 | 否 | `NOT_DERIVABLE_CURRENTLY` | 当前 mydata product raw evidence 未出现 inquiry 同义字段；products_management_summary.unavailable_dimensions 包含 inquiry_source；products_minimal_diagnostic.unavailable_dimensions_echo 继续标记 inquiry_source |
| `country_source` | product | 否 | 否 | 否 | 否 | `NOT_DERIVABLE_CURRENTLY` | alibaba_mydata_self_product_get_post_grant.json extra_fields.country_related=[]；products_management_summary.unavailable_dimensions 包含 country_source；products_minimal_diagnostic.unavailable_dimensions_echo 继续标记 country_source |
| `period_over_period_change` | product | 否 | 否 | 否 | 否 | `NOT_DERIVABLE_CURRENTLY` | alibaba_mydata_self_product_get_post_grant.json extra_fields.trend_related=[]；products_management_summary.unavailable_dimensions 包含 period_over_period_change；products_minimal_diagnostic.unavailable_dimensions_echo 继续标记 period_over_period_change |
| `formal_summary` | order | 是 | 否 | 是 | 是 | `DERIVABLE_FROM_EXISTING_APIS` | orders/list 提供可复用 trade_id + create_date；orders/detail 暴露 amount / product_total_amount / shipment_fee / trade_status；orders/fund 暴露 service_fee 与 fund_pay_list |
| `country_structure` | order | 否 | 是 | 否 | 否 | `NOT_DERIVABLE_CURRENTLY` | orders/detail.available_field_keys 出现 shipping_address；当前 public route 未暴露 shipping_address.country 或 buyer.country 实值；因此现阶段不能把国家结构写成已可派生 |
| `product_contribution` | order | 是 | 否 | 是 | 是 | `DERIVABLE_FROM_EXISTING_APIS` | orders/detail 暴露 order_products[].product_id / quantity / unit_price；可在现有只读链上按 trade_id 聚合产品贡献 |

## 本轮结论

- 店铺级剩余维度 `traffic_source / country_source / quick_reply_rate`：当前 mydata raw evidence 与 live routes 都未出现同义字段，继续保持 unavailable。
- 产品级剩余维度 `access_source / inquiry_source / country_source / period_over_period_change`：当前 mydata raw evidence 与 live routes 都未出现同义字段，继续保持 unavailable。
- 订单级：
  - `formal_summary`：当前已可由现有 `orders/list + orders/detail + orders/fund` 保守派生。
  - `product_contribution`：当前已可由现有 `orders/detail.order_products` 保守派生。
  - `country_structure`：当前 route 输出未暴露 country 实值，虽然 `available_field_keys` 提示存在 `shipping_address`，但仍不能写成已成立。

## 订单级最小派生证明

- sampled_trade_count: 5
- sampled_trade_ids_count: 3
- sampled_total_amount_sum: 2445.2
- sampled_product_total_amount_sum: 1857.5
- sampled_shipment_fee_sum: 587.7
- sampled_service_fee_sum: 73.36
- 说明：这只是“现有只读 API 可保守派生”的证明，不等于订单经营驾驶舱已成立。

## 既有 doc-found 候选复核

| method | 目标方向 | 当前分类 | 本轮是否 runtime 验证 | 备注 |
| --- | --- | --- | --- | --- |
| `alibaba.seller.trade.decode` | order_country_structure / order_identifier_contract | `DOC_FOUND_NOT_TESTED` | 否 | 仓内仅保留 doc-found 记录；当前 WIKA orders/list 已返回可复用 trade_id，本轮无需为剩余维度重开该方法。 |
| `alibaba.mydata.self.keyword.date.get` | product_keyword_window | `DOC_FOUND_NOT_TESTED` | 否 | 当前只在仓内保留 doc-found 记录，尚未形成可直接覆盖 access_source / inquiry_source / country_source / period_over_period_change 的参数契约。 |
| `alibaba.mydata.self.keyword.effect.week.get` | product_keyword_trend | `DOC_FOUND_NOT_TESTED` | 否 | 仓内已有 method 名记录，但当前没有落盘 doc URL 与稳定参数契约，本轮不做 runtime 验证。 |
| `alibaba.mydata.self.keyword.effect.month.get` | product_keyword_trend | `DOC_FOUND_NOT_TESTED` | 否 | 仓内已有 method 名记录，但当前没有落盘 doc URL 与稳定参数契约，本轮不做 runtime 验证。 |
| `alibaba.mydata.industry.keyword.get` | industry_keyword_signal | `DOC_FOUND_NOT_TESTED` | 否 | 当前更像关键词/行业词补充方向，不是本轮剩余 store/product 缺口的直接证据入口。 |
| `alibaba.mydata.seller.opendata.getconkeyword` | seller_keyword_signal | `DOC_FOUND_NOT_TESTED` | 否 | 当前更像关键词补充方向，尚未形成覆盖剩余 source/country/change 维度的直接读取契约。 |

## 当前边界

- not task 1 complete
- not task 2 complete
- no write action attempted
- WIKA-only thread
- XD untouched in this round
- not full business cockpit

