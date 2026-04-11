# WIKA_姝ｅ紡閫氱煡闂幆璇存槑

鏇存柊鏃堕棿锛?026-04-05

## 涓€鍙ヨ瘽缁撹

`WIKA` 褰撳墠宸茬粡褰㈡垚锛?
- provider-agnostic notifier
- webhook / Resend 棰勬帴绾?- outbox fallback
- dry-run 瀹¤璺緞

鍥犳褰撳墠鍑嗙‘鐘舵€佸簲鎻忚堪涓猴細

- **鐪熷疄 provider 宸叉帴濂藉埌浠ｇ爜缁撴瀯灞?*
- **鐪熷疄閫氱煡閫佽揪浠嶆湭琚瘉鏄?*
- **闃舵 13 宸茬‘璁ゅ綋鍓?production 涓病鏈夊彲鐢?provider 閰嶇疆锛屽洜姝ゆ湭鍋氱湡瀹炲鍙?*

## 褰撳墠璐ｄ换杈圭晫

### 1. alert 鏍囧噯鍖?
鐢憋細

- `shared/data/modules/wika-alerts.js`

璐熻矗銆?
缁熶竴杈撳嚭锛?
- `stage_name`
- `blocker_category`
- `triggered_at`
- `related_apis`
- `related_modules`
- `current_evidence`
- `cannot_continue_reason`
- `user_needs`
- `suggested_next_steps`
- `allow_human_handoff`
- `human_handoff`

### 2. provider 閫夋嫨涓?fallback

鐢憋細

- `shared/data/modules/wika-notifier.js`

璐熻矗銆?
褰撳墠鏀寔锛?
- `none`
- `webhook`
- `resend`

閰嶇疆鏉ユ簮锛?
- `WIKA_NOTIFY_PROVIDER`
- 浠ュ強瀵瑰簲 provider 鐨勭幆澧冨彉閲?
褰撳墠琛屼负锛?
1. `provider=none`
   - 鐩存帴璧?`outbox fallback`
2. `provider` 宸查€夋嫨浣嗛厤缃笉瀹屾暣
   - 璁板綍 `provider_configuration_error`
   - 浠嶇劧璧?`outbox fallback`
3. `provider` 宸查厤缃笖 `dry_run=true`
   - 涓嶇湡瀹炲鍙?   - 鍐欏叆 `data/alerts/dry-run`
4. `provider` 宸查厤缃笖鐪熷疄鍙戦€佸け璐?   - 澶辫触璁板綍鍐欏叆 `data/alerts/failed`
   - 鍚屾椂閫€鍥?`data/alerts/outbox`

### 3. provider 閫傞厤灞?
褰撳墠 provider 閫傞厤灞傚凡缁忔媶寮€锛?
- `shared/data/modules/wika-notifier-webhook.js`
- `shared/data/modules/wika-notifier-resend.js`

鑱岃矗鏄細

- provider 閰嶇疆鏍￠獙
- provider 璇锋眰棰勮
- provider dry-run 杈撳嚭
- provider 鐪熷疄鍙戦€?
## 褰撳墠鐩綍缁撴瀯

閫氱煡鐩稿叧瀹¤璺緞锛?
- `data/alerts/outbox`
- `data/alerts/delivered`
- `data/alerts/failed`
- `data/alerts/dry-run`

瀹冧滑鐨勫惈涔夊垎鍒槸锛?
- `outbox`
  - 娌℃湁 provider
  - provider 閰嶇疆涓嶅畬鏁?  - provider 鍙戦€佸け璐ュ悗鐨?fallback
- `delivered`
  - 鐪熷疄 provider 璋冪敤鎴愬姛
- `failed`
  - 鐪熷疄 provider 璋冪敤澶辫触
- `dry-run`
  - 鍙仛棰勬帴绾夸笌 payload 棰勮锛屼笉鍋氱湡瀹炲鍙?
## 鏈疆 dry-run 楠岃瘉缁撴灉

楠岃瘉鑴氭湰锛?
- `WIKA/scripts/validate-wika-notification-phase12.js`

鏈疆鑷冲皯瑕嗙洊浜?3 绫诲満鏅細

1. `provider=none`
   - 鎴愬姛璧板埌 `outbox fallback`
2. `provider=webhook` 浣嗛厤缃笉瀹屾暣
   - 鏄庣‘杩斿洖 `provider_configuration_error`
   - 鍚屾椂浠嶇劧钀藉埌 `outbox fallback`
3. `provider=webhook` 涓旈厤缃畬鏁达紝浣?`dry_run=true`
   - 鎴愬姛杈撳嚭 dry-run 缁撴灉
   - 鏈湡瀹炲鍙?   - 璁板綍鍐欏叆 `dry-run`

鏈疆杩橀澶栭獙璇佷簡锛?
4. `provider=resend` 涓旈厤缃畬鏁达紝浣?`dry_run=true`
   - 鎴愬姛杈撳嚭 dry-run 缁撴灉
   - 鏈湡瀹炲鍙?   - 璁板綍鍐欏叆 `dry-run`

## 闃舵 13锛氱湡瀹?provider 鏈€灏忕湡瀹炲鍙戦獙璇佺粨鏋?
鏈疆鍙仛浜嗏€滄槸鍚﹀叿澶囩湡瀹炲鍙戝墠缃潯浠垛€濈殑妫€鏌ワ紝娌℃湁缁х画淇敼 notifier 缁撴瀯銆?
妫€鏌ヨ寖鍥村寘鎷細

- 褰撳墠 shell 鐜涓殑 `WIKA_NOTIFY_*`
- Railway production 涓殑 `WIKA_NOTIFY_*`

缁撴灉鏄細

1. 褰撳墠 shell 鐜閲屾病鏈変换浣?`WIKA_NOTIFY_*` 鐪熷疄閰嶇疆
2. Railway production 涓篃娌℃湁浠讳綍 `WIKA_NOTIFY_*` 鍙橀噺
3. 鍥犳褰撳墠鏃㈡病鏈夊畬鏁?provider 閰嶇疆锛屼篃娌℃湁鍙瘉鏄庘€滅洰鏍囨槑鏄惧彲鎺р€濈殑鐪熷疄 destination

鎵€浠ユ湰杞粨璁哄繀椤绘敹鍙ｄ负锛?
- **褰撳墠缂洪厤缃?*
- **褰撳墠缂哄彲鎺х洰鏍?*
- **鍥犳鏈樁娈靛仠姝紝涓嶈繘琛岀湡瀹炲鍙?*

## 杩欒疆鑳借瘉鏄庝粈涔?
褰撳墠宸茬粡鑳借瘉鏄庯細

1. notifier 缁撴瀯宸茬粡鏀寔鐪熷疄 provider
2. provider 閫夋嫨鍙互閰嶇疆椹卞姩
3. provider 閰嶇疆閿欒鍙互琚槑纭垎绫?4. payload 缁勮鍙互鍦?dry-run 涓嬭瀹¤
5. provider 涓嶅彲鐢ㄦ椂 fallback 涓嶄細涓㈠け鍛婅
6. provider 澶辫触璺緞鍏峰鍙璁¤褰?
## 杩欒疆杩樹笉鑳借瘉鏄庝粈涔?
褰撳墠杩樹笉鑳借瘉鏄庯細

1. 鐪熷疄 webhook 宸茬粡閫佽揪澶栭儴绯荤粺
2. 鐪熷疄 Resend 閭欢宸茬粡閫佽揪鐢ㄦ埛閭
3. 鐪熷疄 provider 鍦?production 鐜涓凡缁忓畬鎴愰厤缃?4. 褰撳墠宸插瓨鍦ㄥ彲鎺с€佷綆椋庨櫓銆佺敤浜庢祴璇曠殑鐪熷疄 destination

鍥犳褰撳墠涓嶅厑璁稿啓鎴愶細

- 鈥滅湡瀹為€氱煡宸查€佽揪鈥?- 鈥滈偖浠跺凡鎴愬姛鍙戝嚭鈥?- 鈥渨ebhook 宸叉垚鍔熸帹閫佸埌澶栭儴绯荤粺鈥?
## 褰撳墠鏈€灏忔寮忛€氱煡闂幆瀹氫箟

褰撳墠鍙垚绔嬬殑鏈€灏忛棴鐜槸锛?
- 瑙﹀彂
- 鐢熸垚缁撴瀯鍖?alert
- provider 閫夋嫨
- 鍒嗗彂鎴栧彲瀹¤钀界洏

鎵€浠ュ綋鍓嶅噯纭粨璁烘槸锛?
- **鏈€灏忔寮忛€氱煡闂幆宸叉垚绔?*
- **鐪熷疄 provider 澶栧彂浠嶅緟 production 閰嶇疆涓庣湡瀹為€佽揪楠岃瘉**

## 褰撳墠鎺ㄨ崘涓嬩竴姝?
濡傛灉鍚庣画缁х画浠诲姟 6锛屽敮涓€鎺ㄨ崘鍔ㄤ綔鏄細

- 鍦?Railway production 閰嶇疆涓€涓敤鎴峰彲鎺х殑鐪熷疄 provider
  - 浼樺厛 `webhook`
  - 鍏舵 `Resend`

鐒跺悗鍙仛涓€娆℃渶灏忋€佹樉寮忔爣娉?`TEST / DO-NOT-USE` 鐨勭湡瀹為€佽揪楠岃瘉銆?
