# WIKA_澶栭儴鑽夌宸ヤ綔娴佽鏄?
鏇存柊鏃堕棿锛?026-04-05

## 涓€鍙ヨ瘽瀹氫綅
杩欎竴灞傝兘鍔涘彧璐熻矗鐢熸垚鈥滃閮ㄥ彲鐢ㄧ殑宸ヤ綔鑽夌涓庝汉宸ヤ氦鎺ュ寘鈥濓紝涓嶈Е鍙戝钩鍙板唴鍥炲鍙戦€侊紝涔熶笉瑙﹀彂骞冲彴鍐呰鍗曞垱寤恒€?
## 褰撳墠杈圭晫
褰撳墠鍙厑璁稿鐢細

- 宸蹭笂绾跨殑 WIKA 鐪熷疄璇讳晶鑳藉姏
- 鏈€灏忕粡钀ヨ瘖鏂眰
- 浜у搧鑽夌 helper
- 璁㈠崟鑽夌 helper
- notifier / alerts / fallback
- 鍐欎晶鎶ゆ爮涓庝汉宸ユ帴绠¤鍒?
褰撳墠鏄庣‘涓嶅仛锛?
- 鏂?Alibaba API 楠岃瘉
- 骞冲彴鍐呭洖澶嶅彂閫?- 骞冲彴鍐呰鍗曞垱寤?- 鐪熷疄鍟嗗搧鍙戝竷
- 鐪熷疄绾夸笂鍟嗗搧淇敼
- 鐪熷疄閫氱煡澶栧彂

## 褰撳墠宸ュ叿鍏ュ彛
- `POST /integrations/alibaba/wika/tools/reply-draft`
- `POST /integrations/alibaba/wika/tools/order-draft`

杩欎袱涓叆鍙ｉ兘鍙敓鎴愯崏绋匡紝涓嶄骇鐢熷閮ㄥ壇浣滅敤銆?
## 绋冲畾杈撳嚭缁撴瀯

### reply-draft 褰撳墠绋冲畾杈撳嚭
- `workflow_profile`
- `template_version`
- `input_summary`
- `available_context`
- `missing_context`
- `hard_blockers`
- `soft_blockers`
- `assumptions`
- `follow_up_questions`
- `follow_up_question_details`
- `reply_draft`
- `mockup_request`
- `minimum_reply_package`
- `draft_usable_externally`
- `handoff_checklist`
- `handoff_fields`
- `manual_completion_sop`
- `alert_payload`
- `workflow_meta`

### order-draft 褰撳墠绋冲畾杈撳嚭
- `workflow_profile`
- `template_version`
- `input_summary`
- `available_context`
- `missing_context`
- `hard_blockers`
- `soft_blockers`
- `assumptions`
- `required_manual_fields`
- `required_manual_field_details`
- `order_draft_package`
- `follow_up_questions`
- `follow_up_question_details`
- `handoff_checklist`
- `handoff_fields`
- `manual_completion_sop`
- `draft_usable_externally`
- `alert_payload`
- `workflow_meta`

## blocker taxonomy
浠ｇ爜涓庢枃妗ｅ綋鍓嶇粺涓€浣跨敤锛?
- `shared/data/modules/alibaba-external-workflow-taxonomy.js`

taxonomy 缁熶竴瀹氫箟浜嗭細

- `blocker_code`
- `blocker_level`
- `blocker_definition`
- `blocker_reason`
- `blocker_next_action`
- `draft_can_still_be_produced`
- `handoff_mandatory`

褰撳墠甯歌 reply blocker锛?
- `missing_inquiry_text`
- `missing_final_quote`
- `missing_lead_time`
- `missing_destination_country`
- `missing_product_context`
- `missing_quantity`
- `missing_customer_profile`
- `missing_mockup_assets`

褰撳墠甯歌 order blocker锛?
- `missing_buyer_company`
- `missing_buyer_contact`
- `missing_buyer_email`
- `missing_line_items`
- `missing_line_item_quantity`
- `missing_line_item_unit_price`
- `missing_total_amount`
- `missing_advance_amount`
- `missing_trade_term`
- `missing_shipment_method`
- `missing_destination_country`
- `missing_lead_time`

## workflow profile

### reply profile
- `reply_minimal_handoff`
  - 閫傜敤锛氬彧鏈夋渶灏忚鐩樹笂涓嬫枃锛屽繀椤诲厛浜哄伐琛ヤ俊鎭?- `reply_quote_confirmation_needed`
  - 閫傜敤锛氬凡鏈変骇鍝佷笌瀹㈡埛涓婁笅鏂囷紝浣嗘姤浠?/ 浜ゆ湡浠嶉渶浜哄伐纭
- `reply_mockup_customization`
  - 閫傜敤锛氭秹鍙?logo銆佹晥鏋滃浘銆佸畾鍒惰鏄庯紝闇€瑕佺礌鏉愬拰闇€姹傝ˉ榻?
### order profile
- `order_minimal_handoff`
  - 閫傜敤锛氬彧鏈夋渶灏忚椤圭洰鎴栦拱瀹朵俊鎭紝蹇呴』鍏堜汉宸ヨˉ鍗?- `order_quote_confirmation_needed`
  - 閫傜敤锛氬凡鏈夎鍗曢鏋讹紝浣嗕环鏍?/ 鎬讳环 / 浜ゆ湡浠嶉渶浜哄伐纭
- `order_commercial_review`
  - 閫傜敤锛氫富瑕佸晢鍔″瓧娈靛熀鏈叿澶囷紝鍙繘鍏ヤ汉宸ュ鏍?
## 鏁版嵁澶嶇敤鏉ユ簮
褰撳墠鍙鐢ㄥ凡涓婄嚎 WIKA 鐪熷疄璇讳晶锛?
- `products/detail`
- `products/score`
- `products/groups`
- `products/minimal-diagnostic`
- `orders/fund`
- `orders/logistics`
- `orders/minimal-diagnostic`
- `products/schema/render`

## 褰撳墠鑷姩鐢熸垚鑳藉姏

### reply-draft 鍙嚜鍔ㄧ敓鎴?- 鍩虹鍥炲缁撴瀯锛?  - `subject`
  - `opening`
  - `body`
  - `closing`
- 浜у搧鏀拺淇℃伅
- 浠锋牸 / 浜ゆ湡 blocker
- `mockup_request`
- `follow_up_questions`
- `handoff_fields`
- `alert_payload`

### order-draft 鍙嚜鍔ㄧ敓鎴?- 璁㈠崟鑽夌鍖呴鏋?- 涔板鎽樿
- line items 鑽夌
- 浠樻 / 鐗╂祦鍗犱綅瀛楁
- `required_manual_fields`
- `required_manual_field_details`
- `handoff_fields`
- `alert_payload`

## 褰撳墠涓嶈兘鑷姩瀹屾垚鐨勫唴瀹?- 骞冲彴鍐呭彂閫佸洖澶?- 骞冲彴鍐呭垱寤鸿鍗?- 鑷姩鎵胯鏈€缁堟垚浜や环鏍?- 鑷姩鎵胯鏈€缁堜氦鏈?- 鑷姩鐢熸垚鐪熷疄鏁堟灉鍥?- 鑷姩鍙戦€佺湡瀹為€氱煡

## 浜哄伐鎺ユ墜涓庤ˉ鍗?褰撳墠浜哄伐鎺ユ墜缁熶竴閰嶅锛?
- `WIKA/docs/framework/WIKA_澶栭儴鍥炲杈撳叆妯℃澘.md`
- `WIKA/docs/framework/WIKA_澶栭儴璁㈠崟杈撳叆妯℃澘.md`
- `WIKA/docs/framework/WIKA_浜哄伐琛ュ崟妯℃澘.md`

浜哄伐鎺ユ墜鐨勬牳蹇冧緷鎹細

- 鍏堢湅 `hard_blockers`
- 鍐嶇湅 `soft_blockers`
- 鍐嶇湅 `follow_up_question_details`
- 鍐嶇湅 `handoff_checklist`
- 鏈€鍚庢寜 `manual_completion_sop` 琛ラ綈瀛楁

## 鏍蜂緥涓庨獙璇?褰撳墠鏍蜂緥宸茬粡鍥哄畾涓?6 缁勶細

### reply
- `complete_context_sample`
- `mockup_customization_sample`
- `minimal_handoff_sample`

### order
- `commercial_review_sample`
- `pricing_gap_sample`
- `minimal_handoff_sample`

涓婚獙璇佽剼鏈細

- `WIKA/scripts/validate-wika-external-draft-workflows.js`

鍏煎鍒悕鑴氭湰锛?
- `WIKA/scripts/validate-wika-workflow-phase14.js`

楠岃瘉鑴氭湰浼氳緭鍑猴細

- `workflow_profile`
- `template_version`
- `hard_blockers_count`
- `soft_blockers_count`
- `handoff_required`
- `draft_usable_externally`

## 褰撳墠缁撹
褰撳墠宸茬粡褰㈡垚鈥滃閮ㄨ崏绋垮伐浣滄祦灞?+ blocker taxonomy + 浜哄伐琛ュ崟 SOP + 鍙鐜版牱渚嬧€濈殑绋冲畾涓棿灞傘€?
浣嗚繖浠嶇劧鍙唬琛細

- 澶栭儴鍥炲鑽夌鍙敤
- 澶栭儴璁㈠崟鑽夌鍙敤
- 浜哄伐鎺ユ墜鏇撮『鐣?
骞朵笉浠ｈ〃锛?
- 骞冲彴鍐呭凡鍥炲
- 骞冲彴鍐呭凡鍒涘崟
- 鐪熷疄閫氱煡宸查€佽揪

## 闃舵16琛ュ厖锛氳川閲忚瘎浼板眰涓庝氦鎺ュ寘

### 缁熶竴璐ㄩ噺璇勪及灞?褰撳墠鏂板鍏变韩 review 缁撴瀯锛岀敤浜庡 reply / order 鑽夌杈撳嚭鍋氫竴鑷存€у鏌ャ€傛牳蹇冪淮搴︼細
- `structure_completeness`
- `blocker_consistency`
- `minimum_package_readiness`
- `handoff_clarity`
- `manual_completion_readiness`
- `externally_usable_boundary`
- `source_traceability`

缁熶竴 review 杈撳嚭鑷冲皯鍖呭惈锛?- `review_profile`
- `review_version`
- `readiness_level`
- `passed_checks`
- `failed_checks`
- `review_findings`
- `recommended_next_action`
- `handoff_mandatory`
- `draft_usable_externally`

### handoff pack 瀵煎嚭
褰撳墠宸叉敮鎸佷袱绫讳氦鎺ュ寘瀵煎嚭锛?- reply handoff pack
- order handoff pack

瀵煎嚭鏍煎紡锛?- JSON
- Markdown

### 鍥炲綊闂搁棬
褰撳墠涓诲洖褰掕剼鏈細
- `WIKA/scripts/validate-wika-external-draft-regression.js`

鍏煎鍏ュ彛锛?- `WIKA/scripts/validate-wika-external-draft-workflows.js`
- `WIKA/scripts/validate-wika-workflow-phase14.js`

褰撳墠鏍蜂緥宸叉墿鍏呭埌 8 缁勶細
- reply 4 缁?- order 4 缁?
姣忕粍鏍蜂緥閮藉甫鍙け璐ユ柇瑷€锛屼笉鍐嶄互鈥滃彧鐢熸垚 JSON鈥濅綔涓洪€氳繃鏍囧噯銆?
### 褰撳墠杈圭晫鍐嶆澹版槑
鏈疆娌℃湁鍋氫换浣曟柊鐨?Alibaba API 楠岃瘉銆?鏈疆娌℃湁鎺ㄨ繘骞冲彴鍐呰嚜鍔ㄥ洖澶嶃€佸钩鍙板唴璁㈠崟鍒涘缓銆佺湡瀹為€氱煡澶栧彂銆?褰撳墠澧炲己鐨勬槸浠诲姟 4/5 鐨勫閮ㄨ崏绋垮伐浣滄祦璐ㄩ噺灞傦紝涓嶆槸骞冲彴鍐呴棴鐜€?

