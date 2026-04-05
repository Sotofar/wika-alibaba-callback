# WIKA_经营数据候选接口验证

- evaluated_at: 2026-04-05T10:32:52.556Z
- route_line: Railway production -> /sync + access_token + sha256
- scope: candidate validation + clearance packaging only

## 阶段 17 原始分类结果

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
| alibaba.seller.order.logistics.get | order | PARAMETER_REJECTED | trade_1 | - |

## 阶段 18 收口结论

### `mydata` 权限清障
- `alibaba.mydata.overview.date.get` -> `AUTH_BLOCKED`，当前清障包状态 `ACCESS_REOPEN_READY`
- `alibaba.mydata.overview.industry.get` -> `AUTH_BLOCKED`，当前清障包状态 `ACCESS_REOPEN_READY`
- `alibaba.mydata.overview.indicator.basic.get` -> `AUTH_BLOCKED`，当前清障包状态 `ACCESS_REOPEN_READY`
- `alibaba.mydata.self.product.date.get` -> `AUTH_BLOCKED`，当前清障包状态 `ACCESS_REOPEN_READY`
- `alibaba.mydata.self.product.get` -> `AUTH_BLOCKED`，当前清障包状态 `ACCESS_REOPEN_READY`

### 订单参数契约
- `/integrations/alibaba/wika/data/orders/list` -> mismatch=`SCRIPT_PARAM_NAME_MISMATCH` / conclusion=`READ_ONLY_ROUTE_CONFIRMED_WORKING`
- `/integrations/alibaba/wika/data/orders/detail` -> mismatch=`SCRIPT_ID_SOURCE_MISMATCH` / conclusion=`MASKED_TRADE_ID_NOT_REUSABLE`
- `/integrations/alibaba/wika/data/orders/fund` -> mismatch=`SCRIPT_ID_SOURCE_MISMATCH` / conclusion=`MASKED_TRADE_ID_NOT_REUSABLE`
- `/integrations/alibaba/wika/data/orders/logistics` -> mismatch=`SCRIPT_ID_SOURCE_MISMATCH` / conclusion=`MASKED_TRADE_ID_NOT_REUSABLE`

## 边界说明

- 本轮没有新增任何 Alibaba API 验证。
- 本轮没有推进平台内回复、平台内创单、真实通知外发。
- 本轮只是在收口 `mydata` 权限清障与订单参数契约对账。
- 当前边界仍然不是 task 1 complete，不是 task 2 complete，不是平台内闭环。
