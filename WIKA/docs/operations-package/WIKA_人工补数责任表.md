# WIKA 人工补数责任表

## 使用说明

所有人工输入统一进入 `WIKA/docs/tasks/input-inbox/received/`，由现有 ingest 脚本校验。没有进入该目录的数据，不写入下一轮正式报告。

| 数据类型 |负责人 |提交模板 |提交路径 |提交频率 |会增强哪些报告 |不提交的影响 |
| --- |--- |--- |--- |--- |--- |--- |
| 产品素材与关键词 |老板/管理层 |WIKA_产品优化工单.csv / WIKA_关键词优化矩阵.csv |WIKA/docs/tasks/input-inbox/received/ |本周 P1 产品先补，之后随产品上新更新 |产品优化工单、新品开发建议表、关键词优化矩阵 |产品优化只能停在建议层，无法进入可执行改版工单 |
| 广告导出数据 |运营负责人 |WIKA_直通车数据导入模板.csv |WIKA/docs/tasks/input-inbox/received/ |每周一次，周报前提交 |广告分析报告、运营周报、运营任务总看板 |无法判断真实花费、点击、询盘和投放调整优先级 |
| 运营执行确认 |运营负责人 |WIKA_人工补数责任表.csv |WIKA/docs/tasks/input-inbox/received/ |本周内补齐，后续按复盘节奏更新 |运营负责人周计划、任务总看板 |任务无法关闭，下一轮报告仍会标记等待输入 |
| 页面人工盘点 |店铺运营 |WIKA_页面人工盘点表.csv |WIKA/docs/tasks/input-inbox/received/ |每周一次，页面调整前后各一次 |主页转化优化清单、经营诊断报告、店铺运营每日检查表 |首页和详情页建议只能保持保守，不能形成强页面结论 |
| 运营执行确认 |店铺运营 |WIKA_人工补数责任表.csv |WIKA/docs/tasks/input-inbox/received/ |本周内补齐，后续按复盘节奏更新 |运营负责人周计划、任务总看板 |任务无法关闭，下一轮报告仍会标记等待输入 |
| 产品素材与关键词 |产品运营 |WIKA_产品优化工单.csv / WIKA_关键词优化矩阵.csv |WIKA/docs/tasks/input-inbox/received/ |本周 P1 产品先补，之后随产品上新更新 |产品优化工单、新品开发建议表、关键词优化矩阵 |产品优化只能停在建议层，无法进入可执行改版工单 |
| 销售/跟单确认字段 |销售/跟单 |WIKA_询盘回复字段补齐表.csv |WIKA/docs/tasks/input-inbox/received/ |每次询盘或订单草稿前 |询盘跟进SOP、销售跟单使用清单、订单机会分析表 |reply/order 草稿无法进入人工确认后的实际发送或创单 |
| 销售/跟单确认字段 |人工接手人员 |WIKA_询盘回复字段补齐表.csv |WIKA/docs/tasks/input-inbox/received/ |每次询盘或订单草稿前 |询盘跟进SOP、销售跟单使用清单、订单机会分析表 |reply/order 草稿无法进入人工确认后的实际发送或创单 |
| 广告导出数据 |运营负责人 |WIKA_直通车数据导入模板.csv |WIKA/docs/tasks/input-inbox/received/ |每周一次，周报前提交 |广告分析报告、运营周报、运营任务总看板 |无法判断真实花费、点击、询盘和投放调整优先级 |
| 运营执行确认 |运营负责人 |WIKA_人工补数责任表.csv |WIKA/docs/tasks/input-inbox/received/ |本周内补齐，后续按复盘节奏更新 |运营负责人周计划、任务总看板 |任务无法关闭，下一轮报告仍会标记等待输入 |
| 运营执行确认 |店铺运营 |WIKA_人工补数责任表.csv |WIKA/docs/tasks/input-inbox/received/ |本周内补齐，后续按复盘节奏更新 |运营负责人周计划、任务总看板 |任务无法关闭，下一轮报告仍会标记等待输入 |
| 页面人工盘点 |店铺运营 |WIKA_页面人工盘点表.csv |WIKA/docs/tasks/input-inbox/received/ |每周一次，页面调整前后各一次 |主页转化优化清单、经营诊断报告、店铺运营每日检查表 |首页和详情页建议只能保持保守，不能形成强页面结论 |
| 运营执行确认 |产品运营 |WIKA_人工补数责任表.csv |WIKA/docs/tasks/input-inbox/received/ |本周内补齐，后续按复盘节奏更新 |运营负责人周计划、任务总看板 |任务无法关闭，下一轮报告仍会标记等待输入 |
| 销售/跟单确认字段 |销售/跟单 |WIKA_询盘回复字段补齐表.csv |WIKA/docs/tasks/input-inbox/received/ |每次询盘或订单草稿前 |询盘跟进SOP、销售跟单使用清单、订单机会分析表 |reply/order 草稿无法进入人工确认后的实际发送或创单 |
| 广告导出数据 |老板/管理层 |WIKA_直通车数据导入模板.csv |WIKA/docs/tasks/input-inbox/received/ |每周一次，周报前提交 |广告分析报告、运营周报、运营任务总看板 |无法判断真实花费、点击、询盘和投放调整优先级 |
| 运营执行确认 |运营负责人 |WIKA_人工补数责任表.csv |WIKA/docs/tasks/input-inbox/received/ |本周内补齐，后续按复盘节奏更新 |运营负责人周计划、任务总看板 |任务无法关闭，下一轮报告仍会标记等待输入 |
| 运营执行确认 |运营负责人 |WIKA_人工补数责任表.csv |WIKA/docs/tasks/input-inbox/received/ |本周内补齐，后续按复盘节奏更新 |运营负责人周计划、任务总看板 |任务无法关闭，下一轮报告仍会标记等待输入 |
| 产品素材与关键词 |产品运营 |WIKA_产品优化工单.csv / WIKA_关键词优化矩阵.csv |WIKA/docs/tasks/input-inbox/received/ |本周 P1 产品先补，之后随产品上新更新 |产品优化工单、新品开发建议表、关键词优化矩阵 |产品优化只能停在建议层，无法进入可执行改版工单 |
| 运营执行确认 |人工接手人员 |WIKA_人工补数责任表.csv |WIKA/docs/tasks/input-inbox/received/ |本周内补齐，后续按复盘节奏更新 |运营负责人周计划、任务总看板 |任务无法关闭，下一轮报告仍会标记等待输入 |

## 边界声明

- 人工补数是现有闭环的输入层，不是平台写侧动作。
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
