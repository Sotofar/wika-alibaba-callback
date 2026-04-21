# WIKA 广告数据补充任务清单

用于补齐真实广告导出样本，让广告分析从 readiness 进入真实诊断。

## 任务清单

### P1｜导出真实广告样本

- 任务编号：`ADS-P1-001`
- 任务类型：`ads_input`
- 负责人角色：运营负责人
- 归属任务：输入层
- 来源报告：`WIKA/docs/reports/deliverables/WIKA_广告分析报告.md`
- 来源证据：`WIKA/docs/reports/deliverables/evidence/WIKA_正式运营报告包证据.json`
- 为什么重要：广告分析报告明确当前没有真实广告样本，不能编造花费、曝光、点击和询盘。
- 预期收益：拿到样本后，WIKA 可进入真实广告诊断与投放建议模式。
- WIKA 支撑范围：`manual_only`
- 是否需要人工输入：是
- 到期窗口：本周
- 不做的风险：广告分析只能停留在 readiness，不能进入真实投放复盘。

执行步骤：
- 按广告导入模板从平台或第三方报表导出一周样本。
- 检查字段是否覆盖最低必填列。
- 交给 WIKA 广告导入层做校验和标准化。

输入要求：
- date
- campaign_name
- ad_group_name
- keyword
- spend
- impressions
- clicks
- inquiries

验收标准：
- 样本文件存在且字段完整。
- 样本时间范围明确。
- 广告报告未在无样本情况下输出真实投放效果结论。

阻塞项：
- 缺真实广告导出样本

### P2｜固定广告样本导入节奏

- 任务编号：`ADS-P2-001`
- 任务类型：`ads_input`
- 负责人角色：运营负责人
- 归属任务：输入层
- 来源报告：`WIKA/docs/reports/deliverables/WIKA_广告分析报告.md`
- 来源证据：`WIKA/docs/reports/deliverables/evidence/WIKA_正式运营报告包证据.json`
- 为什么重要：一次性样本只能支持单次判断，固定节奏才能支持 comparison 和投放复盘。
- 预期收益：让广告分析层形成周度趋势判断能力。
- WIKA 支撑范围：`manual_only`
- 是否需要人工输入：是
- 到期窗口：7–30 天
- 不做的风险：广告分析无法持续化。

执行步骤：
- 约定每周固定导出时间。
- 使用广告导入模板检查字段。
- 将导入结果纳入下周运营报告。

输入要求：
- 每周广告导出
- 字段映射说明
- 导入责任人

验收标准：
- 广告样本导入节奏明确。
- 字段缺失时有补充责任人。
- 未将导入层写成官方广告 API 已打通。

阻塞项：
- 缺稳定广告导入承接节奏


## 边界声明

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
