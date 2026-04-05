# WIKA_经营数据候选接口验证

- evaluated_at: 2026-04-05T08:28:20.706Z
- route_line: Railway production -> /sync + access_token + sha256
- scope: readonly candidate validation only

## 候选方法分类

| 方法 | 范围 | 最终分类 | 最佳尝试 | 证据文件 |
| --- | --- | --- | --- | --- |
| alibaba.mydata.overview.date.get | store | AUTH_BLOCKED | empty_params | alibaba_mydata_overview_date_get.json |
| alibaba.mydata.overview.industry.get | store | AUTH_BLOCKED | fallback_recent_window | alibaba_mydata_overview_industry_get.json |
| alibaba.mydata.overview.indicator.basic.get | store | AUTH_BLOCKED | fallback_recent_window_fallback_all_industry | alibaba_mydata_overview_indicator_basic_get.json |
| alibaba.mydata.self.product.date.get | product | AUTH_BLOCKED | day | alibaba_mydata_self_product_date_get.json |
| alibaba.mydata.self.product.get | product | AUTH_BLOCKED | day | alibaba_mydata_self_product_get.json |
| alibaba.seller.order.list | order | REAL_DATA_RETURNED | fallback_minimal_windowless | alibaba_seller_order_list.json |
| alibaba.seller.order.get | order | PARAMETER_REJECTED | trade_1 | alibaba_seller_order_get.json |
| alibaba.seller.order.fund.get | order | PARAMETER_REJECTED | trade_1 | alibaba_seller_order_fund_get.json |

## 店铺级结论

- overview.date.get: AUTH_BLOCKED
- overview.industry.get: AUTH_BLOCKED
- overview.indicator.basic.get: AUTH_BLOCKED
- selected_date_range: 20***29 -> 20***04 (fallback_recent_window)
- selected_industry: `{"industry_id":111,"industry_desc":"All","main_category":true,"source":"fallback_all_industry"}`

## 产品级结论

- validated_product_ids: 16***98, 16***27, 16***45, 16***14, 16***14
- self.product.date.get: AUTH_BLOCKED
- self.product.get: AUTH_BLOCKED

## 订单级结论

- order.list: REAL_DATA_RETURNED
- order.get: PARAMETER_REJECTED
- order.fund.get: PARAMETER_REJECTED
- order.logistics.get: PARAMETER_REJECTED
- derivation: DERIVABLE_FROM_EXISTING_ORDER_APIS
- derivable: `{"正式汇总":false,"趋势":true,"国家结构":false,"产品贡献":false}`

## 真实证据摘要

### alibaba.mydata.overview.date.get
- final_category: AUTH_BLOCKED
- best_attempt: empty_params
- error: `{"type":"ISV","code":"InsufficientPermission","msg":"App does not have permission to access this api","request_id":"0b51f6a417753776968087800","_trace_id_":"212cf75117753776968057472e0f29"}`
### alibaba.mydata.overview.industry.get
- final_category: AUTH_BLOCKED
- best_attempt: fallback_recent_window
- error: `{"type":"ISV","code":"InsufficientPermission","msg":"App does not have permission to access this api","request_id":"212c8daf17753776968913349","_trace_id_":"212cf75117753776968887474e0f29"}`
### alibaba.mydata.overview.indicator.basic.get
- final_category: AUTH_BLOCKED
- best_attempt: fallback_recent_window_fallback_all_industry
- error: `{"type":"ISV","code":"InsufficientPermission","msg":"App does not have permission to access this api","request_id":"210829b717753776969824588","_trace_id_":"212cf75117753776969797478e0f29"}`
### alibaba.mydata.self.product.date.get
- final_category: AUTH_BLOCKED
- best_attempt: day
- error: `{"type":"ISV","code":"InsufficientPermission","msg":"App does not have permission to access this api","request_id":"212c6fc617753776970605365","_trace_id_":"212cf75117753776970577482e0f29"}`
### alibaba.mydata.self.product.get
- final_category: AUTH_BLOCKED
- best_attempt: day
- error: `{"type":"ISV","code":"InsufficientPermission","msg":"App does not have permission to access this api","request_id":"0b51f69917753776972045335","_trace_id_":"212cf75117753776972017489e0f29"}`
### alibaba.seller.order.list
- final_category: REAL_DATA_RETURNED
- best_attempt: fallback_minimal_windowless
- extracted: `{"total_count":120,"returned_item_count":10,"items":[{"trade_id":"21***54","create_date":{"timestamp":1775004580000,"format_date":"Mar. 31, 2026, 17:49:40 PDT."},"modify_date":{"timestamp":1775004787000,"format_date":"Mar. 31, 2026, 17:53:07 PDT."},"trade_status":null},{"trade_id":"29***76","create_date":{"timestamp":1775004052000,"format_date":"Mar. 31, 2026, 17:40:52 PDT."},"modify_date":{"timestamp":1775030525000,"format_date":"Apr. 1, 2026, 01:02:05 PDT."},"trade_status":null},{"trade_id":"29***56","create_date":{"timestamp":1774850246000,"format_date":"Mar. 29, 2026, 22:57:26 PDT."},"modify_date":{"timestamp":1775009466000,"format_date":"Mar. 31, 2026, 19:11:06 PDT."},"trade_status":null},{"trade_id":"29***16","create_date":{"timestamp":1774836159000,"format_date":"Mar. 29, 2026, 19:02:39 PDT."},"modify_date":{"timestamp":1774838053000,"format_date":"Mar. 29, 2026, 19:34:13 PDT."},"trade_status":null},{"trade_id":"21***16","create_date":{"timestamp":1774319792000,"format_date":"Mar. 23, 2026, 19:36:32 PDT."},"modify_date":{"timestamp":1774319832000,"format_date":"Mar. 23, 2026, 19:37:12 PDT."},"trade_status":null},{"trade_id":"29***58","create_date":{"timestamp":1774228174000,"format_date":"Mar. 22, 2026, 18:09:34 PDT."},"modify_date":{"timestamp":1774228807000,"format_date":"Mar. 22, 2026, 18:20:07 PDT."},"trade_status":null},{"trade_id":"25***56","create_date":{"timestamp":1773966603000,"format_date":"Mar. 19, 2026, 17:30:03 PDT."},"modify_date":{"timestamp":1774222486000,"format_date":"Mar. 22, 2026, 16:34:46 PDT."},"trade_status":null},{"trade_id":"29***49","create_date":{"timestamp":1773840784000,"format_date":"Mar. 18, 2026, 06:33:04 PDT."},"modify_date":{"timestamp":1773986290000,"format_date":"Mar. 19, 2026, 22:58:10 PDT."},"trade_status":null}]}`
### alibaba.seller.order.get
- final_category: PARAMETER_REJECTED
- best_attempt: trade_1
- error: `{"code":"15","type":"ISP","sub_code":"isv.402","sub_msg":"invalidate request","msg":"Remote service error","request_id":"213f5a2117753776977567425","_trace_id_":"212cf75117753776977537511e0f29"}`
### alibaba.seller.order.fund.get
- final_category: PARAMETER_REJECTED
- best_attempt: trade_1
- error: `{"code":"15","type":"ISP","sub_code":"isv.402","sub_msg":"tradeId is invalid","msg":"Remote service error","request_id":"0b51f6a417753776986487822","_trace_id_":"212cf75117753776986457527e0f29"}`

## 边界说明

- 本轮只做候选接口验证，不等于任务 1/2 已打通。
- 本轮没有新增任何平台内写动作，也没有把过授权层误写成已形成正式路由。
- 订单级经营汇总若成立，当前只写成“由现有官方交易读侧派生”，不写成新报表 API 已打通。
