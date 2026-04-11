# AGENTS.md

## 浣滅敤鑼冨洿
- 鏈粨搴撳綋鍓嶄笟鍔′富绾垮彧鎺ㄨ繘 WIKA銆?- XD 鍐荤粨锛屼笉鍋氭柊璺敱寮€鍙戙€佷笉鍋氭柊 API 楠岃瘉銆佷笉鍋氫笟鍔℃帹杩涖€?- 鎵€鏈変换鍔℃寜鈥滈樁娈甸棴鐜€濇墽琛岋紝涓嶈嚜鍔ㄨ繘鍏ヤ笅涓€闃舵銆?
## 鐩綍褰掑睘瑙勫垯
- 浠婂悗 WIKA 鐨勪笟鍔″伐浣溿€佹枃妗ｃ€佽剼鏈€佽瘉鎹€佽鍒掓潗鏂欙紝鍙繘鍏?`WIKA/` 瀵瑰簲鐩綍銆?- 浠婂悗 XD 鐨勪笟鍔″伐浣溿€佹枃妗ｃ€佽剼鏈€佽瘉鎹€佽鍒掓潗鏂欙紝鍙繘鍏?`XD/` 瀵瑰簲鐩綍銆?- truly shared / common 鍐呭鍗曠嫭淇濈暀鍦ㄦ牴鐩綍鎴?`shared/`銆乣src/`銆佸繀瑕佹椂鐨?`common/` 鍖哄煙锛屼笉鍐嶆贩鏀惧埌 WIKA 鎴?XD 涓氬姟鐩綍銆?- 鏈兘璇佹槑鍙睘浜庡崟椤圭洰鐨勫熀纭€璁炬柦锛屼笉瑕佸己琛岃縼鍏?`WIKA/` 鎴?`XD/`銆?
## 鐢熶骇浼樺厛
- 涓€寰嬪鐢?Railway production 璁よ瘉闂幆銆?- 涓€寰嬭蛋 Alibaba 瀹樻柟 `/sync + access_token + sha256`銆?- 绂佹鍥為€€鍒版湰鍦?`.env`銆佹湰鍦?callback銆佹湰鍦?token 鏂囦欢銆佹湰鍦?cookie 鏃佽矾銆?
## 宸蹭笂绾胯兘鍔涚姝㈤噸鍋?浠ヤ笅绾夸笂鑳藉姏鍙厑璁稿鐢紝涓嶈閲嶅鍋氣€滈€傞厤鎬ч獙璇佲€濇垨閲嶅瀹炵幇锛岄櫎闈炴槸鍦ㄤ慨澶嶅洖褰掞細
- /integrations/alibaba/wika/data/products/list
- /integrations/alibaba/wika/data/products/score
- /integrations/alibaba/wika/data/products/detail
- /integrations/alibaba/wika/data/products/groups
- /integrations/alibaba/wika/data/orders/list
- /integrations/alibaba/wika/data/orders/detail
- /integrations/alibaba/wika/data/orders/fund
- /integrations/alibaba/wika/data/orders/logistics
- /integrations/alibaba/wika/reports/products/management-summary
- /integrations/alibaba/wika/data/categories/tree
- /integrations/alibaba/wika/data/categories/attributes
- /integrations/alibaba/wika/data/products/schema
- /integrations/alibaba/wika/data/products/schema/render
- /integrations/alibaba/wika/data/media/list
- /integrations/alibaba/wika/data/media/groups
- /integrations/alibaba/wika/data/products/schema/render/draft

## 褰撳墠宸叉敹鍙ｃ€佹殏涓嶄富绾挎帹杩?- mydata / overview / self.product 璺嚎褰撳墠鏀跺彛涓烘潈闄?鑳藉姏闃诲锛屼笉鍐嶄綔涓哄綋鍓嶄富绾挎帹杩涖€?- inquiries / messages / customers 鏆備笉鎺ㄨ繘銆?- order create 鏆備笉鎺ㄨ繘銆?- RFQ 鏆備笉鎺ㄨ繘銆?
## 鐘舵€佹湳璇繀椤讳弗鏍煎尯鍒?绂佹娣锋穯浠ヤ笅姒傚康锛?- 鏂囨。瀛樺湪
- 鎺ュ彛鍊欓€夊瓨鍦?- 宸茶繃鎺堟潈灞?- 宸插舰鎴愭寮忓師濮嬭矾鐢?- 宸茶兘璇绘暟鎹?- 宸茶兘鍐欏洖骞冲彴
- 宸插畬鎴愪笟鍔￠棴鐜?
鍏佽鐨勫垎绫诲彧鏈夛細
- 鐪熷疄 JSON 鏍锋湰鏁版嵁
- 涓氬姟鍙傛暟閿欒锛堣鏄庡凡杩囨巿鏉冨眰锛?- 鏉冮檺閿欒
- 搴旂敤鑳藉姏涓嶅尮閰?- 鏃т綋绯?/ 楂橀闄?- 褰撳墠鏈瘑鍒埌鍙敤鍏ュ彛
- 褰撳墠鏃犳硶璇佹槑浣庨闄╄竟鐣岋紝鍥犳涓嶇户缁疄鍐欓獙璇?
## 灏濊瘯棰勭畻
- 姣忎釜鏂?API 鏈€澶氬厑璁?3 杞€滄湁瀹炶川宸紓鐨勪慨姝ｅ皾璇曗€濄€?- 瓒呰繃 3 杞粛鏃犳柊璇佹嵁锛屽繀椤诲綊绫诲苟鍓嶈繘銆?- 涓嶅緱鍦ㄥ悓涓€鎺ュ彛涓婃寰幆銆?
## 鍐欎晶瀹夊叏杈圭晫
榛樿涓嶅仛浠ヤ笅鍔ㄤ綔锛?- 鐪熷疄鍟嗗搧鍙戝竷
- 鐪熷疄绾夸笂鍟嗗搧淇敼
- 鐪熷疄瀹㈡埛娌熼€?- 鐪熷疄璁㈠崟鍒涘缓

鍙湁鍦ㄨ兘澶熻瘉鏄庘€滀綆椋庨櫓銆佸彲闅旂銆佸彲娓呯悊銆佸彲鍥炴粴鈥濇椂锛屾墠鍏佽缁х画鎺ㄨ繘鏈€灏忕湡瀹炲啓鍏ラ獙璇併€傝嫢杈圭晫鏈璇佹槑锛屽彧鑳藉仠鍦細
- 鐪熷疄鐢熶骇鍒嗙被
- payload / 鍙傛暟闂ㄦ纭
- 鑽夌閾捐矾澧炲己
- 椋庨櫓鏀跺彛涓庢枃妗ｈ惤鐩?
## Git 涓庢枃妗?- 姣忎釜闃舵寮€濮嬪墠鍋氫竴娆?git checkpoint銆?- 姣忎釜闃舵缁撴潫鍚庡啀鍋氫竴娆?git checkpoint銆?- 鑻ヨ繙绔?push 鍙揪锛屽湪闃舵缁撴潫鏃堕噸璇曚竴娆?push锛涜嫢浠嶅け璐ワ紝璁板綍鍒版枃妗ｅ悗鍋滄銆?
鐘舵€佸彉鍖栨椂蹇呴』鏇存柊锛?- `WIKA/docs/framework/WIKA_椤圭洰鍩虹嚎.md`
- `WIKA/docs/framework/WIKA_鎵ц璁″垝.md`
- `WIKA/docs/framework/WIKA_闈㈠悜6椤逛换鍔API缂哄彛鐭╅樀.md`
- `WIKA/docs/framework/WIKA_宸蹭笂绾胯兘鍔涘鐢ㄦ竻鍗?md`
- `WIKA/docs/framework/WIKA_涓嬩竴鎵瑰繀椤婚獙璇佺殑API鍊欓€夋睜.md`
- `WIKA/docs/framework/WIKA_鑷不鎺ㄨ繘鏃ュ織.md`

## 宸ヤ綔鏂瑰紡
- 姣忔闃舵寮€濮嬪墠鍏堣锛?  - `WIKA/docs/framework/WIKA_椤圭洰鍩虹嚎.md`
  - `WIKA/docs/framework/WIKA_鎵ц璁″垝.md`
- 姣忔鍙仛涓€涓樁娈点€?- 浼樺厛鍋氣€滆兘澧炲姞鐪熷疄璇佹嵁鈥濈殑鏈€灏忎笅涓€姝ャ€?- 闃舵瀹屾垚鍚庡仠姝紝涓嶈嚜鍔ㄨ繘鍏ヤ笅涓€闃舵銆?
## 杈撳嚭瑙勮寖
- 鎵€鏈変腑闂磋繘搴︺€佹渶缁堟€荤粨銆侀獙鏀剁粨鏋溿€佹彁浜よ鏄庯紝涓€寰嬩娇鐢ㄧ畝浣撲腑鏂囪緭鍑恒€?- 濡傛灉闇€瑕佸紩鐢?API 鍚嶃€佽矾鐢辫矾寰勩€佸瓧娈靛悕銆乧ommit hash銆侀敊璇爜銆佹枃浠惰矾寰勩€佷唬鐮佺墖娈碉紝鍙繚鐣欒嫳鏂囧師鏍枫€?
## 鍥哄畾姹囨姤缁撴瀯
- 褰撳墠闃舵
- 鏈疆鐩爣
- 宸插鐢ㄧ殑宸蹭笂绾胯兘鍔?- 鏈疆鏂伴獙璇?/ 鏂板紑鍙?/ 鏂版矇娣€鐨勫唴瀹?- 鏈疆鏄庣‘鎺掗櫎鐨?API / 鑳藉姏
- 宸插畬鎴愰椄闂?- 褰撳墠鍞竴闃诲鐐?- WIKA 鏄惁閬囧埌杩?- WIKA 鐨勮В鍐虫柟寮忔槸鍚﹀彲澶嶇敤
- 涓嬩竴姝ュ敮涓€鍔ㄤ綔
- 鏄庣‘鏈畬鎴愰」
- 褰撳墠杩樼己鍝簺缁忚惀鍏抽敭鏁版嵁
- 褰撳墠绂烩€滃畬鎴?6 椤逛换鍔♀€濊繕宸摢浜涜兘鍔涚己鍙?- 褰撳墠璇婃柇閲屽摢浜涙槸鐪熷疄鏁版嵁缁撹锛屽摢浜涘彧鏄緟楠岃瘉鍒ゆ柇


