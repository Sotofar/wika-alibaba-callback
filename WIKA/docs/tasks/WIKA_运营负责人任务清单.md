# WIKA 运营负责人任务清单

用于运营负责人把 stage47 报告包转成排期、分工和复盘节奏。

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

### P1｜把报告包拆成一周执行排期

- 任务编号：`OPS-P1-001`
- 任务类型：`schedule`
- 负责人角色：运营负责人
- 归属任务：通用运营
- 来源报告：`WIKA/docs/reports/deliverables/WIKA_运营周报.md`
- 来源证据：`WIKA/docs/reports/deliverables/evidence/WIKA_正式运营报告包证据.json`
- 为什么重要：运营周报已经给出本周优先动作，但需要落到具体人、日期和验收标准，否则仍停留在阅读层。
- 预期收益：形成本周可跟踪的执行计划，避免老板、运营、销售各自理解不一致。
- WIKA 支撑范围：`mostly_supported_needs_human_confirm`
- 是否需要人工输入：是
- 到期窗口：今天
- 不做的风险：报告包无法转化为实际运营节奏。

执行步骤：
- 按本任务包 P1/P2/P3 建立本周排期。
- 把产品、广告、页面、销售、人工接手任务分别指派给对应角色。
- 每天检查 P1 任务状态，周末复盘 P2 和 P3 是否需要升级。

输入要求：
- 本周团队可用人力
- 各角色负责人名单
- 本周可执行时间窗口

验收标准：
- P1 任务全部有负责人和截止时间。
- P2 任务有明确本周推进节点。
- blocked 任务均写明外部输入来源。

阻塞项：
- 无

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

### P2｜建立每周报告到任务包的固定节奏

- 任务编号：`OPS-P2-001`
- 任务类型：`process`
- 负责人角色：运营负责人
- 归属任务：通用运营
- 来源报告：`WIKA/docs/reports/deliverables/WIKA_运营周报.md`
- 来源证据：`WIKA/docs/reports/deliverables/evidence/WIKA_正式运营报告包证据.json`
- 为什么重要：stage47 报告包已经可读，但必须固定转任务节奏，才能持续变成执行。
- 预期收益：形成周报、任务包、验收、复盘的闭环节奏。
- WIKA 支撑范围：`mostly_supported_needs_human_confirm`
- 是否需要人工输入：是
- 到期窗口：本周
- 不做的风险：报告和执行脱节。

执行步骤：
- 每周先生成正式运营报告包。
- 再生成运营任务包。
- 周中检查 P1，周末复盘 P2/P3。

输入要求：
- 每周报告生成时间
- 任务负责人
- 复盘时间

验收标准：
- 每周至少生成一次任务看板。
- P1 任务有跟踪状态。
- 未完成项有原因和下一步。

阻塞项：
- 无

### P3｜保留官方缺失维度为 blocked

- 任务编号：`BLOCK-P3-001`
- 任务类型：`blocked_dimension`
- 负责人角色：运营负责人
- 归属任务：任务1/任务2
- 来源报告：`WIKA/docs/reports/deliverables/WIKA_经营诊断报告.md`
- 来源证据：`WIKA/docs/reports/deliverables/evidence/WIKA_正式运营报告包证据.json`
- 为什么重要：traffic_source、country_source、quick_reply_rate、access_source、inquiry_source、country_structure 等仍不可得，不能在任务包里静默省略。
- 预期收益：避免把当前诊断误读成完整经营驾驶舱。
- WIKA 支撑范围：`blocked`
- 是否需要人工输入：否
- 到期窗口：外部条件到位后
- 不做的风险：业务方可能误以为当前报告覆盖了全部经营维度。

执行步骤：
- 在任务看板中保留 blocked 维度。
- 不基于这些字段生成强结论。
- 只有外部权限或官方稳定入口出现时再重开。

输入要求：
- 官方字段能力
- 稳定参数契约
- 真实返回样本

验收标准：
- 所有 unavailable 维度均在 blocked 区出现。
- 没有用推断替代 official fact。
- 没有新增 API 探索。

阻塞项：
- 缺 official 字段
- 缺稳定参数契约
- 缺真实返回样本

### P3｜复盘 WIKA 工作替代比例

- 任务编号：`OPS-P3-001`
- 任务类型：`process`
- 负责人角色：运营负责人
- 归属任务：通用运营
- 来源报告：`WIKA/docs/reports/deliverables/WIKA_正式运营报告包索引.md`
- 来源证据：`WIKA/docs/reports/deliverables/evidence/WIKA_正式运营报告包证据.json`
- 为什么重要：当前 WIKA 能替代大量整理、诊断、草稿准备工作，但最后一跳仍需人工，需要持续量化。
- 预期收益：让团队知道哪些工作可交给 WIKA，哪些必须人工接手。
- WIKA 支撑范围：`mostly_supported_needs_human_confirm`
- 是否需要人工输入：是
- 到期窗口：后续跟进
- 不做的风险：团队无法判断自动化真实价值。

执行步骤：
- 统计本周 WIKA 报告、工作台、预览、草稿使用次数。
- 记录人工确认和修改耗时。
- 下周调整任务包优先级。

输入要求：
- 本周实际使用记录
- 人工接手耗时
- WIKA 输出被采纳比例

验收标准：
- 形成一份本周 WIKA 使用复盘。
- 明确可完全交给 WIKA 的工作和必须人工确认的工作。
- 未把 WIKA 写成完整业务闭环。

阻塞项：
- 无


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
