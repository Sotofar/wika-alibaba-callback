# WIKA 阶段 42：广告数据导入层

## 本阶段目标
- 在不新增不确定广告 API 调用的前提下，把广告 / 直通车分析能力先建起来。
- 采用“自动抓取优先，导入兜底”的口径：
  - 当前无稳定 official ads route 时，立即启用标准化导入层

## 本轮新增
- `WIKA/projects/wika/data/ads/schema.js`
- `WIKA/projects/wika/data/ads/normalizer.js`
- `WIKA/projects/wika/data/ads/sample-import.csv`
- `WIKA/docs/templates/WIKA_广告数据导入模板.csv`
- `WIKA/docs/templates/WIKA_广告数据导入模板.json`
- `WIKA/scripts/validate-wika-stage42-ads-import-layer.js`
- `WIKA/docs/framework/evidence/wika-stage42-ads-import-layer.json`

## 导入字段最小集合
- 必填：
  - `date`
  - `spend`
  - `impressions`
  - `clicks`
- 计划标识：
  - `campaign_name` 或 `campaign_id`
- 建议补充：
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

## 当前标准化规则
- `date` 统一标准化到 `YYYY-MM-DD`
- `ctr` 若缺失，则按 `clicks / impressions` 计算
- `cpc` 若缺失，则按 `spend / clicks` 计算
- `inquiry_rate` 若缺失，则按 `inquiries / clicks` 计算
- `cost_per_inquiry` 统一按 `spend / inquiries` 派生
- 当前模板支持：
  - CSV 行式导入
  - JSON 数组导入

## 当前边界
- manual import only
- not official ads api
- no platform write action attempted
- 当前导入层只解决“数据能被标准化分析”
- 当前不解决：
  - 广告官方自动抓取
  - 出价 / 预算 / 投放计划写回
  - 广告平台闭环执行

## 为什么本阶段必须先做导入层
- 广告分析是运营操作系统不可缺的能力域。
- 当前若继续等待未知广告 API，会让 WIKA 运营能力长期停在“无广告视角”。
- 标准化导入层至少能先把：
  - 花费
  - 曝光
  - 点击
  - 询盘
  - 关键词
  - 计划 / 单元
 统一进入分析合同。

## 当前结论
- 阶段 42 已形成可验证的广告导入 schema 与标准化层。
- 下一阶段不再纠结“是否有广告 API”，直接在导入层之上做诊断与建议层。
