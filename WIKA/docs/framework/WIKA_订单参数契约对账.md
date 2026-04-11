# WIKA_璁㈠崟鍙傛暟濂戠害瀵硅处

鏇存柊鏃堕棿锛?026-04-05

鏈枃浠跺彧鏀跺彛涓や欢浜嬶細
- 褰撳墠 `orders/list` 涓轰粈涔堣兘缁欏嚭鐪熷疄鏁版嵁
- 涓轰粈涔堥樁娈?17 閲?`order.get / fund.get / logistics.get` 鍦?public list trade_id 閾句笂缁熶竴钀藉埌鍙傛暟鎷掔粷

## 褰撳墠鎬昏

- 鏈疆娌℃湁鏂板浠讳綍 Alibaba API 楠岃瘉锛屽彧鍥寸粫闃舵 17 宸查獙璇佹柟娉曞仛澶嶆牳涓庡璐︺€?- 褰撳墠鍙互纭锛歚/orders/list` 鏄綋鍓嶅敮涓€绋冲畾鎴愮珛鐨勫彧璇昏鍗曞叆鍙ｃ€?- 褰撳墠涔熷彲浠ョ‘璁わ細闃舵 17 鎵€浣跨敤鐨?`items[].trade_id` 鏄伄缃╁€硷紝涓嶈兘鐩存帴褰撲綔 `e_trade_id` 澶嶇敤鍒?detail / fund / logistics銆?- 褰撳墠浠嶄笉鑳界‘璁ょ幇鏈?public 鍙閾捐矾涓瓨鍦ㄥ彲澶嶇敤鐨勬湭閬僵璁㈠崟 identifier銆?
## 鍙傛暟濂戠害鐭╅樀

| route name | downstream Alibaba method | expected params | identifier shape | identifier source | stage-17 validation input | mismatch finding | current conclusion | next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| /integrations/alibaba/wika/data/orders/list | alibaba.seller.order.list | role, start_page, page_size, status, sales_man_login_id | N/A; list returns masked trade_id in current tenant | response_meta + items[].trade_id | param_trade_ecology_order_list_query.role/start_page/page_size; recent_window also tried create_date_start/create_date_end | SCRIPT_PARAM_NAME_MISMATCH | READ_ONLY_ROUTE_CONFIRMED_WORKING | Keep list as confirmed working readonly route; if date-window contract is needed later, reopen only with explicit official parameter evidence. |
| /integrations/alibaba/wika/data/orders/detail | alibaba.seller.order.get | e_trade_id | Unmasked reusable e_trade_id expected; current public list only exposes masked trade_id | External query param only; no internal remapping in current route | e_trade_id sourced from stage-17 order.list items[].trade_id (masked values like 21***54) | SCRIPT_ID_SOURCE_MISMATCH | MASKED_TRADE_ID_NOT_REUSABLE | Do not hard-fix route. Reopen only after proving a reusable unmasked order identifier source inside current readonly chain or after official contract clarification. |
| /integrations/alibaba/wika/data/orders/fund | alibaba.seller.order.fund.get | e_trade_id, data_select | Unmasked reusable e_trade_id expected; current public list only exposes masked trade_id | External query param only; no internal remapping in current route | e_trade_id sourced from stage-17 order.list items[].trade_id + data_select=fund_serviceFee,fund_fundPay,fund_refund | SCRIPT_ID_SOURCE_MISMATCH | MASKED_TRADE_ID_NOT_REUSABLE | Hold current route as contract-unresolved for public chaining. Reopen only after a reusable order identifier source is evidenced. |
| /integrations/alibaba/wika/data/orders/logistics | alibaba.seller.order.logistics.get | e_trade_id, data_select | Unmasked reusable e_trade_id expected; current public list only exposes masked trade_id | External query param only; no internal remapping in current route | e_trade_id sourced from stage-17 order.list items[].trade_id + data_select=logistic_order | SCRIPT_ID_SOURCE_MISMATCH | MASKED_TRADE_ID_NOT_REUSABLE | Hold current route as contract-unresolved for public chaining. Reopen only after a reusable order identifier source is evidenced. |

## 閫愯矾鐢卞璐︾粨璁?
### /integrations/alibaba/wika/data/orders/list
- downstream method: `alibaba.seller.order.list`
- expected params: `role`銆乣start_page`銆乣page_size`銆乣status`銆乣sales_man_login_id`
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
- expected params: `e_trade_id`銆乣data_select`
- identifier shape: Unmasked reusable e_trade_id expected; current public list only exposes masked trade_id
- identifier source: External query param only; no internal remapping in current route
- stage-17 mismatch finding: `SCRIPT_ID_SOURCE_MISMATCH`
- current conclusion: `MASKED_TRADE_ID_NOT_REUSABLE`
- next action: Hold current route as contract-unresolved for public chaining. Reopen only after a reusable order identifier source is evidenced.
- source line hints: route app.js:3102, method shared/data/modules/alibaba-official-extensions.js:310, identifier shared/data/modules/alibaba-official-extensions.js:374
- stage-17 observed error: `{"code":"15","type":"ISP","sub_code":"isv.402","sub_msg":"tradeId is invalid","msg":"Remote service error","request_id":"0b51f6a417753776986487822","_trace_id_":"212cf75117753776986457527e0f29"}`

### /integrations/alibaba/wika/data/orders/logistics
- downstream method: `alibaba.seller.order.logistics.get`
- expected params: `e_trade_id`銆乣data_select`
- identifier shape: Unmasked reusable e_trade_id expected; current public list only exposes masked trade_id
- identifier source: External query param only; no internal remapping in current route
- stage-17 mismatch finding: `SCRIPT_ID_SOURCE_MISMATCH`
- current conclusion: `MASKED_TRADE_ID_NOT_REUSABLE`
- next action: Hold current route as contract-unresolved for public chaining. Reopen only after a reusable order identifier source is evidenced.
- source line hints: route app.js:3106, method shared/data/modules/alibaba-official-extensions.js:384, identifier shared/data/modules/alibaba-official-extensions.js:-
- stage-17 observed error: `{"code":"15","type":"ISP","sub_code":"402","sub_msg":"tradeId is invalid","msg":"Remote service error","request_id":"212c6fc617753776995595410","_trace_id_":"212cf75117753776995567546e0f29"}`

## 鐜版湁姝ｅ紡鍙璺敱涓轰粈涔堟浘琚爣涓衡€滃凡涓婄嚎鑳藉姏鈥?
- 褰撳墠鍙‘璁ょ殑鏄細杩欎簺 route 宸茬粡娉ㄥ唽銆佸彲鎺ュ彈 query銆佸苟娌?production `/sync` 涓荤嚎璋冪敤瀹樻柟 method銆?- 浣?stage 18 瀵硅处鍚庨渶瑕佽ˉ涓€灞傝竟鐣岋細route existence 涓嶇瓑浜庡綋鍓?public 涓婃父 identifier 濂戠害宸查棴鍚堛€?- 鍥犳鏈疆涔嬪悗锛屽 `/orders/detail`銆乣/orders/fund`銆乣/orders/logistics` 鐨勬洿鍑嗙‘鍙ｅ緞搴旀槸锛?  褰撳墠 route 宸插瓨鍦紝浣嗗湪浠呬緷璧?`order.list` 杩斿洖鐨勯伄缃?`trade_id` 鏃讹紝public chaining 浠嶆湭闂悎銆?
## 鏈€灏忚鍗曡秼鍔挎淳鐢熻瘉鏄?
- signal_type: `partial_derived_signal`
- derived_from: `alibaba.seller.order.list.create_date`
- statement: 褰撳墠浠呰瘉鏄庤鍗曞垱寤洪噺瓒嬪娍鍙敱鐜版湁瀹樻柟浜ゆ槗 list 鎺ュ彛閮ㄥ垎娲剧敓锛屼笉鑳芥墿鍐欐垚瀹屾暣璁㈠崟缁忚惀姹囨€汇€?- sample_size: 8
- evidence file: `WIKA/docs/framework/evidence/wika-order-trend-partial-derived-sample.json`
- trend sample: `[{"date_label":"2026-03-31","order_count":2},{"date_label":"2026-03-29","order_count":2},{"date_label":"2026-03-23","order_count":1},{"date_label":"2026-03-22","order_count":1},{"date_label":"2026-03-19","order_count":1},{"date_label":"2026-03-18","order_count":1}]`

## 杈圭晫璇存槑

- 褰撳墠涓嶆槸 task 1 complete锛屼篃涓嶆槸 task 2 complete銆?- 褰撳墠娌℃湁鏂板浠讳綍骞冲彴鍐呭啓鍔ㄤ綔銆?- 褰撳墠涓嶆槸骞冲彴鍐呴棴鐜紝鍙槸鍦ㄦ敹鍙ｅ弬鏁板绾︽涔夈€?
