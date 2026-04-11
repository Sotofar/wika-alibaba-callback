# WIKA_缁忚惀鏁版嵁鏉冮檺娓呴殰鍖?
鏇存柊鏃堕棿锛?026-04-05

> 鍘嗗彶璇存槑锛氭湰鏂囦欢璁板綍鐨勬槸闃舵 18 鈥滄潈闄愬姞鍖呭墠鈥濈殑娓呴殰鍙ｅ緞銆傚綋鍓嶆渶鏂扮姸鎬佽浠ラ樁娈?19 鐨?[WIKA_缁忚惀鏁版嵁鍊欓€夋帴鍙ｉ獙璇?md](/D:/Code/闃块噷鍥介檯绔?WIKA/docs/framework/WIKA_缁忚惀鏁版嵁鍊欓€夋帴鍙ｉ獙璇?md) 涓?[WIKA_mydata_鏉冮檺寮€閫氬悗澶嶆祴.md](/D:/Code/闃块噷鍥介檯绔?WIKA/docs/framework/WIKA_mydata_鏉冮檺寮€閫氬悗澶嶆祴.md) 涓哄噯锛? 涓?`mydata` 鏂规硶鍦?WIKA production 涓嬪凡缁忎粠鏃х殑 `AUTH_BLOCKED` 鍓嶈繘鍒?`REAL_DATA_RETURNED`銆?
鏈寘鍙敤浜庡澶栬鏄庡綋鍓?`mydata` 鏉冮檺闃诲鐜扮姸銆佹渶灏忔潈闄愮敵璇峰彛寰勶紝浠ュ強 access grant 涔嬪悗搴斿浣曞楠屻€?
## 褰撳墠鎬昏

- 鏈疆娌℃湁鏂板浠讳綍 Alibaba API 楠岃瘉锛屽彧澶嶇敤闃舵 17 鐜版湁 evidence 鍋氭潈闄愭竻闅滄敹鍙ｃ€?- 褰撳墠 5 涓?`mydata` 鐩稿叧瀹樻柟鏂规硶鍦ㄥ綋鍓?`WIKA` tenant 涓嬬粺涓€钀藉埌 `AUTH_BLOCKED`銆?- 褰撳墠鍙洿鎺ュ澶栬緭鍑虹殑缁撹涓嶆槸鈥滄帴鍙ｄ笉瀛樺湪鈥濓紝鑰屾槸鈥滃叕寮€瀹樻柟鏂规硶瀛樺湪锛屼絾褰撳墠绉熸埛鏃犺闂潈闄愨€濄€?- 褰撳墠娓呴殰鍖呯姸鎬侊細`ACCESS_REOPEN_READY`銆?
## alibaba.mydata.overview.date.get

1. official method name: `alibaba.mydata.overview.date.get`
2. intended business use: 搴楅摵绾х粡钀ユ棩鏈熺獥鍙ｅ彂鐜帮紝缁欏悗缁?overview 鎸囨爣鏌ヨ鎻愪緵鐪熷疄鍙敤鏃ユ湡鑼冨洿
3. target fields: `start_date`銆乣end_date`
4. stage-17 observed result: `AUTH_BLOCKED`
5. observed error code / message: `InsufficientPermission / App does not have permission to access this api`
6. current classification: `AUTH_BLOCKED`
7. affected tasks: 浠诲姟1銆佷换鍔?
8. why this method matters to WIKA: 娌℃湁 date range锛屽氨鏃犳硶瀵瑰簵閾虹骇 visitor/imps/click/fb/reply 鍙ｅ緞鍋氱ǔ瀹氳皟鐢ㄤ笌澶嶉獙銆?9. minimal permission/scope ask wording: Please grant the current WIKA app tenant access to alibaba.mydata.overview.date.get for the current ICBU seller account so we can discover valid overview date windows in production.
10. what evidence would count as 鈥渁ccess granted鈥? 鐪熷疄杩斿洖 start_date / end_date 鑼冨洿锛屼笖涓嶅啀鍑虹幇 InsufficientPermission銆?11. what route/report would be reopened after access grant: `/integrations/alibaba/wika/data/store/overview-basic`銆乣/integrations/alibaba/wika/reports/operations/minimal-diagnostic`
- evidence file: `WIKA/docs/framework/evidence/alibaba_mydata_overview_date_get.json`

## alibaba.mydata.overview.industry.get

1. official method name: `alibaba.mydata.overview.industry.get`
2. intended business use: 搴楅摵绾ц涓?涓昏惀缁村害鍙戠幇锛岀粰 overview 鎸囨爣鏌ヨ鎻愪緵鐪熷疄 industry context
3. target fields: `industry_id`銆乣industry_desc`銆乣main_category`
4. stage-17 observed result: `AUTH_BLOCKED`
5. observed error code / message: `InsufficientPermission / App does not have permission to access this api`
6. current classification: `AUTH_BLOCKED`
7. affected tasks: 浠诲姟1銆佷换鍔?
8. why this method matters to WIKA: 娌℃湁 industry 缁村害锛屽氨鏃犳硶绋冲畾鏋勯€犲簵閾虹骇 overview 鎸囨爣鏌ヨ鐨勭湡瀹炰笟鍔″弬鏁般€?9. minimal permission/scope ask wording: Please grant the current WIKA app tenant access to alibaba.mydata.overview.industry.get for the current ICBU seller account so we can discover valid industry context in production.
10. what evidence would count as 鈥渁ccess granted鈥? 鐪熷疄杩斿洖 industry_id / industry_desc / main_category锛屼笖涓嶅啀鍑虹幇 InsufficientPermission銆?11. what route/report would be reopened after access grant: `/integrations/alibaba/wika/data/store/overview-basic`銆乣/integrations/alibaba/wika/reports/operations/minimal-diagnostic`
- evidence file: `WIKA/docs/framework/evidence/alibaba_mydata_overview_industry_get.json`

## alibaba.mydata.overview.indicator.basic.get

1. official method name: `alibaba.mydata.overview.indicator.basic.get`
2. intended business use: 搴楅摵绾х粡钀ュ熀纭€鎸囨爣璇诲彇
3. target fields: `visitor`銆乣imps`銆乣clk`銆乣clk_rate`銆乣fb`銆乣reply`
4. stage-17 observed result: `AUTH_BLOCKED`
5. observed error code / message: `InsufficientPermission / App does not have permission to access this api`
6. current classification: `AUTH_BLOCKED`
7. affected tasks: 浠诲姟1銆佷换鍔?
8. why this method matters to WIKA: 杩欐槸褰撳墠鏈€鐩存帴鐨勫簵閾虹骇 UV / 鏇濆厜 / 鐐瑰嚮 / 璇㈢洏 / 鍥炲鐩稿叧鍏紑鍊欓€夊叆鍙ｏ紱鑻ユ棤鏉冮檺锛屼换鍔?1/2 鏃犳硶鑾峰緱搴楅摵绾х粡钀ユ寚鏍囥€?9. minimal permission/scope ask wording: Please grant the current WIKA app tenant access to alibaba.mydata.overview.indicator.basic.get for the current ICBU seller account so we can read store-level visitor / imps / click / feedback / reply metrics in production.
10. what evidence would count as 鈥渁ccess granted鈥? 鐪熷疄杩斿洖 visitor / imps / clk / clk_rate / fb / reply 浠讳竴瀛楁锛屼笖涓嶅啀鍑虹幇 InsufficientPermission銆?11. what route/report would be reopened after access grant: `/integrations/alibaba/wika/data/store/overview-basic`銆乣/integrations/alibaba/wika/reports/operations/minimal-diagnostic`
- evidence file: `WIKA/docs/framework/evidence/alibaba_mydata_overview_indicator_basic_get.json`

## alibaba.mydata.self.product.date.get

1. official method name: `alibaba.mydata.self.product.date.get`
2. intended business use: 浜у搧绾ц〃鐜版棩鏈熺獥鍙ｅ彂鐜帮紝缁?self.product 鎸囨爣鏌ヨ鎻愪緵鐪熷疄缁熻鍛ㄦ湡
3. target fields: `start_date`銆乣end_date`
4. stage-17 observed result: `AUTH_BLOCKED`
5. observed error code / message: `InsufficientPermission / App does not have permission to access this api`
6. current classification: `AUTH_BLOCKED`
7. affected tasks: 浠诲姟1銆佷换鍔?
8. why this method matters to WIKA: 娌℃湁浜у搧绾?date range锛屽氨鏃犳硶绋冲畾璋冪敤鏇濆厜銆佺偣鍑汇€佽瀹€佽鐩樼瓑浜у搧琛ㄧ幇鎸囨爣銆?9. minimal permission/scope ask wording: Please grant the current WIKA app tenant access to alibaba.mydata.self.product.date.get for the current ICBU seller account so we can discover valid product-performance date windows in production.
10. what evidence would count as 鈥渁ccess granted鈥? 鐪熷疄杩斿洖 start_date / end_date 鑼冨洿锛屼笖涓嶅啀鍑虹幇 InsufficientPermission銆?11. what route/report would be reopened after access grant: `/integrations/alibaba/wika/data/products/performance-by-date`銆乣/integrations/alibaba/wika/reports/products/minimal-diagnostic`
- evidence file: `WIKA/docs/framework/evidence/alibaba_mydata_self_product_date_get.json`

## alibaba.mydata.self.product.get

1. official method name: `alibaba.mydata.self.product.get`
2. intended business use: 浜у搧绾ц〃鐜版寚鏍囪鍙?3. target fields: `click`銆乣impression`銆乣visitor`銆乣fb`銆乣order`銆乣bookmark`銆乣compare`銆乣share`銆乣keyword_effects`
4. stage-17 observed result: `AUTH_BLOCKED`
5. observed error code / message: `InsufficientPermission / App does not have permission to access this api`
6. current classification: `AUTH_BLOCKED`
7. affected tasks: 浠诲姟1銆佷换鍔?
8. why this method matters to WIKA: 杩欐槸褰撳墠鏈€鐩存帴鐨勪骇鍝佺骇鏇濆厜銆佺偣鍑汇€佽瀹€佽鐩樸€佸叧閿瘝鏁堟灉鍏紑鍊欓€夊叆鍙ｏ紱鑻ユ棤鏉冮檺锛屼换鍔?1/2 鏃犳硶鑾峰緱浜у搧琛ㄧ幇灞傘€?9. minimal permission/scope ask wording: Please grant the current WIKA app tenant access to alibaba.mydata.self.product.get for the current ICBU seller account so we can read product-level performance metrics in production.
10. what evidence would count as 鈥渁ccess granted鈥? 鐪熷疄杩斿洖 click / impression / visitor / fb / order / bookmark / compare / share / keyword_effects 浠讳竴瀛楁锛屼笖涓嶅啀鍑虹幇 InsufficientPermission銆?11. what route/report would be reopened after access grant: `/integrations/alibaba/wika/data/products/performance`銆乣/integrations/alibaba/wika/reports/products/minimal-diagnostic`
- evidence file: `WIKA/docs/framework/evidence/alibaba_mydata_self_product_get.json`

## 杈圭晫璇存槑

- 鏈竻闅滃寘涓嶆槸鈥滄潈闄愬凡瑙ｅ喅鈥濓紝鍙槸涓€浠藉彲鐩存帴瀵瑰鐢宠鐨勬潈闄愰樆濉炶鏄庛€?- 褰撳墠涓嶆槸 task 1 complete锛屼篃涓嶆槸 task 2 complete銆?- 褰撳墠娌℃湁鎺ㄨ繘浠讳綍骞冲彴鍐呭啓鍔ㄤ綔锛屼篃娌℃湁褰㈡垚骞冲彴鍐呴棴鐜€?
