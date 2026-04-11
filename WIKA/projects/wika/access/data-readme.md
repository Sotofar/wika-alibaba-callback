# WIKA 鍚庡彴鏁版嵁璇诲彇璇存槑

## 鏂囨。鐢ㄩ€?
鏈枃浠剁敤浜庤鏄庡綋鍓?`WIKA` 鍥介檯绔欏悗鍙板湪**鍙妯″紡**涓嬪凡缁忓叿澶囩殑璇诲彇鑳藉姏銆佸綋鍓嶉檺鍒讹紝浠ュ強鍚庣画鎵╁睍鍒?`XD` 鏃跺彲澶嶇敤鐨勮鍙栨鏋躲€?
鏈缁撹鍙熀浜庝互涓嬬湡瀹炴潵婧愶細

- 褰撳墠浠撳簱涓殑鐜版湁浠ｇ爜銆佽剼鏈€侀厤缃笌鏂囨。
- 褰撳墠绾夸笂鍙闂帴鍙ｇ殑瀹為檯杩斿洖
- 鏈湴椤圭洰鐩綍涓殑瀹為檯鏂囦欢

鏈**娌℃湁**鎵ц閲嶆柊鎺堟潈銆侀噸缃?token銆佷慨鏀?callback銆佷慨鏀?redirect_uri銆佷慨鏀?client 閰嶇疆绛夋搷浣溿€?
## 褰撳墠缁撹

鎴嚦 `2026-04-02`锛屽綋鍓嶉」鐩凡缁忕ǔ瀹氭墦閫氱殑鏄細

- OAuth 鎺堟潈鍏ュ彛
- callback 鎺ユ敹
- `code -> access_token / refresh_token`
- WIKA 鍗曡处鍙?token 鎸佷箙鍖?- WIKA 鍗曡处鍙?token 鑷姩缁湡
- 閫氳繃 `/integrations/alibaba/auth/debug` 璇诲彇鎺ュ叆閰嶇疆鐘舵€佷笌 token 杩愯鐘舵€?
浣嗗綋鍓嶉」鐩?*杩樻病鏈夊疄鐜?*浠ヤ笅涓氬姟鏁版嵁璇诲彇閾捐矾锛?
- 搴楅摵鏁翠綋鏁版嵁璇诲彇
- 浜у搧鍒楄〃涓庝骇鍝佽〃鐜拌鍙?- 璇㈢洏/瀹㈡埛鏁版嵁璇诲彇
- 骞垮憡/鎶曟斁鏁版嵁璇诲彇
- 娲诲姩銆侀〉闈紭鍖栥€佸晢鍝佽瘖鏂瓑涓氬姟鏁版嵁璇诲彇

涔熷氨鏄锛屽綋鍓嶅凡缁忔墦閫氱殑鏄€?*鎺ュ叆涓庨壌鏉冩暟鎹摼璺?*鈥濓紝涓嶆槸鈥?*涓氬姟鍒嗘瀽鏁版嵁閾捐矾**鈥濄€?
## 褰撳墠鍚庡彴鏁版嵁璇诲彇涓婚摼璺?
褰撳墠鐪熸鍙敤鐨勮鍙栦富閾捐矾濡備笅锛?
1. `GET /health`
   - 鐢ㄤ簬纭鏈嶅姟鍦ㄧ嚎
2. `GET /integrations/alibaba/auth/debug`
   - 鐢ㄤ簬璇诲彇褰撳墠 OAuth 閰嶇疆鐘舵€?   - 鐢ㄤ簬璇诲彇 WIKA token 鏂囦欢瀛樺湪鐘舵€併€佸姞杞界姸鎬併€佽嚜鍔ㄧ画鏈熺姸鎬?3. `GET /integrations/alibaba/callback`
   - 鍦ㄦ巿鏉冨洖璋冩椂鎺ユ敹 `code`銆佹牎楠?`state`
   - 鎴愬姛鍚庢墽琛?token exchange 骞舵妸 token 鍐欏叆 WIKA 鎸佷箙鍖栬矾寰?4. WIKA token 杩愯鏃?   - 鍚姩鏃朵粠鎸佷箙鍖栨枃浠惰鍙?   - 杩愯鏃舵牴鎹?`expires_in` 璁＄畻涓嬩竴娆″埛鏂版椂闂?   - 鍒版湡鍓嶈嚜鍔ㄨ皟鐢?`/auth/token/refresh`

## 褰撳墠鍙鍙栫殑鏁版嵁鑼冨洿

### 宸查獙璇佸彲璇诲彇

- 鎺ュ叆閰嶇疆鐘舵€?- OAuth 鐩稿叧 URL 閰嶇疆
- WIKA token 鏂囦欢鏄惁瀛樺湪
- WIKA token 鏄惁宸插姞杞?- WIKA 鏄惁宸叉寔鏈?refresh token
- WIKA 涓嬩竴娆¤嚜鍔ㄧ画鏈熸椂闂?- WIKA 涓婁竴娆″埛鏂版椂闂淬€佹潵婧愩€侀敊璇姸鎬?
### 褰撳墠鏈帴鍏?
- 搴楅摵鏇濆厜銆佺偣鍑汇€佽瀹€佽鐩樿秼鍔?- 浜у搧鍒楄〃銆佷骇鍝佽〃鐜般€侀珮鏇濆厜/楂樼偣鍑?浣庢晥浜у搧
- 璇㈢洏鍒楄〃銆佹潵婧愪骇鍝併€佸鎴峰湴鍖恒€佸鎴疯川閲忓瓧娈?- 骞垮憡璁″垝銆佸箍鍛婃秷鑰椼€佸箍鍛婄偣鍑汇€佸叧閿瘝琛ㄧ幇
- 娲诲姩鎶ュ悕銆佸晢鍝佽瘖鏂€侀〉闈紭鍖栫浉鍏冲悗鍙版暟鎹?
## 褰撳墠鏂囨。绱㈠紩

- 鏁版嵁鏉ユ簮涓庨摼璺細`WIKA/projects/wika/access/data-sources.md`
- 瀛楁璇存槑锛歚WIKA/projects/wika/access/data-field-map.md`
- 楠岃瘉璁板綍锛歚WIKA/projects/wika/access/data-validation-notes.md`
- 璇诲彇娴佺▼锛歚WIKA/projects/wika/access/read-flow.md`
- 鍙鐢ㄦ鏋讹細`shared/access/data-reading-framework.md`
- 閫氱敤楠岃瘉娓呭崟锛歚shared/access/data-validation-checklist.md`

## 瀵?XD 鐨勭洿鎺ュ惎鍙?
WIKA 宸茬粡楠岃瘉鎴愬姛鐨勯儴鍒嗭紝鍙互鐩存帴涓?XD 澶嶇敤锛?
- 鎺ュ叆鍓嶆鏌ユ柟娉?- 閰嶇疆妫€鏌ユ柟娉?- `/auth/debug` 绫荤姸鎬佹鏌ユ柟娉?- token 鎸佷箙鍖栦笌鑷姩缁湡楠岃瘉鏂规硶
- 鈥滄槸鍚﹀凡鐪熸鍏峰涓氬姟鏁版嵁璇诲彇鑳藉姏鈥濈殑鍒ゅ畾鏂规硶

浣嗕笉鑳界洿鎺ュ鐢ㄧ殑鍐呭鍖呮嫭锛?
- WIKA 鐨?token 瀛樺偍璺緞
- WIKA 鐨?token 鏂囦欢
- WIKA 鐨勬巿鏉冭褰?- WIKA 鐨勮繍琛岀姸鎬佺粨璁?
