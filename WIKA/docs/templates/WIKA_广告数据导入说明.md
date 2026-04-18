# WIKA 广告数据导入说明

## 目标
- 把当前无法自动抓取的广告/直通车数据，统一收口为 WIKA 可验证、可标准化、可继续进入诊断层的正式输入口。
- 当前定位是 import-driven 能力，不是假装官方广告 API 已打通。

## 最低必填字段
- `date`
- `spend`
- `impressions`
- `clicks`
- `campaign_name` 或 `campaign_id`

## 可选字段
- `ad_group_name`
- `ad_group_id`
- `keyword`
- `inquiries`
- `ctr`
- `cpc`
- `conversion`
- `inquiry_rate`
- `budget`
- `bid`
- `region`
- `device`
- `currency`
- `source_file`

## 字段解释
- `date`
  当前导入行所属日期，系统会标准化到 `YYYY-MM-DD`。
- `campaign_name` / `campaign_id`
  广告计划标识，二者至少一个必须存在。
- `ad_group_name` / `ad_group_id`
  单元级标识，建议尽量提供，便于后续定位低效单元。
- `keyword`
  关键词级输入，若无关键词维度，可留空。
- `spend`
  花费，数值型。
- `impressions`
  曝光量，数值型。
- `clicks`
  点击量，数值型。
- `inquiries`
  询盘量，数值型；若缺失，广告诊断层会显式降级。
- `ctr`
  点击率；若未提供，按 `clicks / impressions` 保守计算。
- `cpc`
  单次点击成本；若未提供，按 `spend / clicks` 保守计算。
- `conversion`
  当前导出里可用的转化率字段；若缺失，不强制要求。
- `inquiry_rate`
  询盘率；若未提供，按 `inquiries / clicks` 保守计算。
- `budget`
  预算，仅作只读分析，不产生任何预算写回。
- `bid`
  出价，仅作只读分析，不产生任何出价写回。
- `region`
  地域维度，若导出可得则建议提供。
- `device`
  设备维度，若导出可得则建议提供。
- `currency`
  币种，默认建议显式填写。
- `source_file`
  原始导出文件名或来源标记，便于追溯。

## 允许的数据来源
- 阿里后台人工导出报表
- 人工整理后的广告台账
- 第三方投放平台汇总导出
- 已脱敏的历史广告样本

## 进入 WIKA 的方式
- 导入模板先进入：
  - `WIKA/projects/wika/data/ads/import-contract.js`
  - `WIKA/projects/wika/data/ads/schema.js`
  - `WIKA/projects/wika/data/ads/normalizer.js`
- 标准化后可继续进入：
  - `buildAdsSummaryReport`
  - `buildAdsComparisonReport`
  - `buildAdsDiagnosticReport`
  - `buildAdsActionCenterReport`
- 当前这些输出属于 import-driven local contract / helper 层，尚未写成稳定线上广告 route。

## 哪些建议依赖广告输入
- 广告花费变化判断
- 广告曝光/点击/询盘变化判断
- 关键词层降本/扩量建议
- 计划/单元优先级建议
- 广告 action center 的优先动作排序

## 哪些建议不依赖广告输入
- 店铺/产品/订单既有 summary / diagnostic / comparison
- `business-cockpit`
- `action-center`
- `operator-console`
- 产品详情与内容优化的保守建议层

## 当前边界
- current status: `IMPORT_READY`
- current mode: `manual_or_third_party_import_only`
- not official ads api
- no platform write action attempted
