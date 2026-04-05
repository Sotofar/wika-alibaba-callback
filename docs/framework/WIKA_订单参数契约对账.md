# WIKA_订单参数契约对账

更新时间：2026-04-05

本文件只收口两件事：
- 当前 `orders/list` 为什么能给出真实数据
- 为什么阶段 17 里 `order.get / fund.get / logistics.get` 在 public list trade_id 链上统一落到参数拒绝

## 当前总论

- 本轮没有新增任何 Alibaba API 验证，只围绕阶段 17 已验证方法做复核与对账。
- 当前可以确认：`/orders/list` 是当前唯一稳定成立的只读订单入口。
- 当前也可以确认：阶段 17 所使用的 `items[].trade_id` 是遮罩值，不能直接当作 `e_trade_id` 复用到 detail / fund / logistics。
- 当前仍不能确认现有 public 只读链路中存在可复用的未遮罩订单 identifier。

## 参数契约矩阵

| route name | downstream Alibaba method | expected params | identifier shape | identifier source | stage-17 validation input | mismatch finding | current conclusion | next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| /integrations/alibaba/wika/data/orders/list | alibaba.seller.order.list | role, start_page, page_size, status, sales_man_login_id | N/A; list returns masked trade_id in current tenant | response_meta + items[].trade_id | param_trade_ecology_order_list_query.role/start_page/page_size; recent_window also tried create_date_start/create_date_end | SCRIPT_PARAM_NAME_MISMATCH | READ_ONLY_ROUTE_CONFIRMED_WORKING | Keep list as confirmed working readonly route; if date-window contract is needed later, reopen only with explicit official parameter evidence. |
| /integrations/alibaba/wika/data/orders/detail | alibaba.seller.order.get | e_trade_id | Unmasked reusable e_trade_id expected; current public list only exposes masked trade_id | External query param only; no internal remapping in current route | e_trade_id sourced from stage-17 order.list items[].trade_id (masked values like 21***54) | SCRIPT_ID_SOURCE_MISMATCH | MASKED_TRADE_ID_NOT_REUSABLE | Do not hard-fix route. Reopen only after proving a reusable unmasked order identifier source inside current readonly chain or after official contract clarification. |
| /integrations/alibaba/wika/data/orders/fund | alibaba.seller.order.fund.get | e_trade_id, data_select | Unmasked reusable e_trade_id expected; current public list only exposes masked trade_id | External query param only; no internal remapping in current route | e_trade_id sourced from stage-17 order.list items[].trade_id + data_select=fund_serviceFee,fund_fundPay,fund_refund | SCRIPT_ID_SOURCE_MISMATCH | MASKED_TRADE_ID_NOT_REUSABLE | Hold current route as contract-unresolved for public chaining. Reopen only after a reusable order identifier source is evidenced. |
| /integrations/alibaba/wika/data/orders/logistics | alibaba.seller.order.logistics.get | e_trade_id, data_select | Unmasked reusable e_trade_id expected; current public list only exposes masked trade_id | External query param only; no internal remapping in current route | e_trade_id sourced from stage-17 order.list items[].trade_id + data_select=logistic_order | SCRIPT_ID_SOURCE_MISMATCH | MASKED_TRADE_ID_NOT_REUSABLE | Hold current route as contract-unresolved for public chaining. Reopen only after a reusable order identifier source is evidenced. |

## 逐路由对账结论

### /integrations/alibaba/wika/data/orders/list
- downstream method: `alibaba.seller.order.list`
- expected params: `role`、`start_page`、`page_size`、`status`、`sales_man_login_id`
- identifier shape: N/A; list returns masked trade_id in current tenant
- identifier source: response_meta + items[].trade_id
- stage-17 mismatch finding: `SCRIPT_PARAM_NAME_MISMATCH`
- current conclusion: `READ_ONLY_ROUTE_CONFIRMED_WORKING`
- next action: Keep list as confirmed working readonly route; if date-window contract is needed later, reopen only with explicit official parameter evidence.
- source line hints: route app.js:3094, method shared/data/modules/alibaba-official-orders.js:169, identifier shared/data/modules/alibaba-official-orders.js:90

### /integrations/alibaba/wika/data/orders/detail
- downstream method: `alibaba.seller.order.get`
- expected params: `e_trade_id`
- identifier shape: Unmasked reusable e_trade_id expected; current public list only exposes masked trade_id
- identifier source: External query param only; no internal remapping in current route
- stage-17 mismatch finding: `SCRIPT_ID_SOURCE_MISMATCH`
- current conclusion: `MASKED_TRADE_ID_NOT_REUSABLE`
- next action: Do not hard-fix route. Reopen only after proving a reusable unmasked order identifier source inside current readonly chain or after official contract clarification.
- source line hints: route app.js:3098, method shared/data/modules/alibaba-official-orders.js:261, identifier shared/data/modules/alibaba-official-orders.js:-
- stage-17 observed error: `{"code":"15","type":"ISP","sub_code":"isv.402","sub_msg":"invalidate request","msg":"Remote service error","request_id":"213f5a2117753776977567425","_trace_id_":"212cf75117753776977537511e0f29"}`

### /integrations/alibaba/wika/data/orders/fund
- downstream method: `alibaba.seller.order.fund.get`
- expected params: `e_trade_id`、`data_select`
- identifier shape: Unmasked reusable e_trade_id expected; current public list only exposes masked trade_id
- identifier source: External query param only; no internal remapping in current route
- stage-17 mismatch finding: `SCRIPT_ID_SOURCE_MISMATCH`
- current conclusion: `MASKED_TRADE_ID_NOT_REUSABLE`
- next action: Hold current route as contract-unresolved for public chaining. Reopen only after a reusable order identifier source is evidenced.
- source line hints: route app.js:3102, method shared/data/modules/alibaba-official-extensions.js:310, identifier shared/data/modules/alibaba-official-extensions.js:374
- stage-17 observed error: `{"code":"15","type":"ISP","sub_code":"isv.402","sub_msg":"tradeId is invalid","msg":"Remote service error","request_id":"0b51f6a417753776986487822","_trace_id_":"212cf75117753776986457527e0f29"}`

### /integrations/alibaba/wika/data/orders/logistics
- downstream method: `alibaba.seller.order.logistics.get`
- expected params: `e_trade_id`、`data_select`
- identifier shape: Unmasked reusable e_trade_id expected; current public list only exposes masked trade_id
- identifier source: External query param only; no internal remapping in current route
- stage-17 mismatch finding: `SCRIPT_ID_SOURCE_MISMATCH`
- current conclusion: `MASKED_TRADE_ID_NOT_REUSABLE`
- next action: Hold current route as contract-unresolved for public chaining. Reopen only after a reusable order identifier source is evidenced.
- source line hints: route app.js:3106, method shared/data/modules/alibaba-official-extensions.js:384, identifier shared/data/modules/alibaba-official-extensions.js:-
- stage-17 observed error: `{"code":"15","type":"ISP","sub_code":"402","sub_msg":"tradeId is invalid","msg":"Remote service error","request_id":"212c6fc617753776995595410","_trace_id_":"212cf75117753776995567546e0f29"}`

## 现有正式只读路由为什么曾被标为“已上线能力”

- 当前可确认的是：这些 route 已经注册、可接受 query、并沿 production `/sync` 主线调用官方 method。
- 但 stage 18 对账后需要补一层边界：route existence 不等于当前 public 上游 identifier 契约已闭合。
- 因此本轮之后，对 `/orders/detail`、`/orders/fund`、`/orders/logistics` 的更准确口径应是：
  当前 route 已存在，但在仅依赖 `order.list` 返回的遮罩 `trade_id` 时，public chaining 仍未闭合。

## 最小订单趋势派生证明

- signal_type: `partial_derived_signal`
- derived_from: `alibaba.seller.order.list.create_date`
- statement: 当前仅证明订单创建量趋势可由现有官方交易 list 接口部分派生，不能扩写成完整订单经营汇总。
- sample_size: 8
- evidence file: `docs/framework/evidence/wika-order-trend-partial-derived-sample.json`
- trend sample: `[{"date_label":"2026-03-31","order_count":2},{"date_label":"2026-03-29","order_count":2},{"date_label":"2026-03-23","order_count":1},{"date_label":"2026-03-22","order_count":1},{"date_label":"2026-03-19","order_count":1},{"date_label":"2026-03-18","order_count":1}]`

## 边界说明

- 当前不是 task 1 complete，也不是 task 2 complete。
- 当前没有新增任何平台内写动作。
- 当前不是平台内闭环，只是在收口参数契约歧义。
