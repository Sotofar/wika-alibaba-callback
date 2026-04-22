# WIKA 直通车数据导入与投放调整表

## 当前状态

当前没有真实广告样本，因此不能给出真实花费、曝光、点击、询盘、CTR、CPC 或转化率判断。本表用于指导运营导出数据，并在数据补齐后进入 WIKA 广告分析。

## 需要运营导出的字段

- date
- campaign_name
- ad_group_name
- keyword
- spend
- impressions
- clicks
- inquiries
- ctr
- cpc

## 拿到数据后 WIKA 能分析什么

- 哪些 campaign 花费高但询盘低。
- 哪些 keyword 点击高但询盘弱。
- 哪些 ad_group 适合保留、降价、暂停或扩量。
- 广告点击和页面盘点问题是否互相影响。

## 当前可给出的保守投放建议

| 优先级 |动作 |为什么 |执行人 |验收标准 |
| --- |--- |--- |--- |--- |
| P1 |先导出一周真实广告样本 |没有样本不能做效果判断 |广告投放负责人 |CSV 字段完整且可导入 |
| P2 |建立每周固定导出节奏 |后续才能做周对比 |运营负责人 |每周固定进入 input-inbox |
| P3 |广告与页面盘点联合复盘 |点击后承接页面会影响询盘 |广告投放负责人/店铺运营 |广告问题和页面问题能合并排序 |

## 哪些计划/关键词需要补数据后判断

所有 campaign、ad_group、keyword 均需要补真实样本后才能判断。当前不得编造投放效果。

## 边界声明

- 广告分析当前为 import-driven layer，不是稳定官方广告 API 自动抓取。
- not task 1 complete
- not task 2 complete
- not task 3 complete
- not task 4 complete
- not task 5 complete
- task 6 excluded
- no write action attempted
- WIKA-only thread for business work
- XD untouched in business execution
- not full business cockpit
- 本交付包只把当前 WIKA 能力转成运营执行材料，不代表平台内自动执行，也不代表任务 1–5 complete。
