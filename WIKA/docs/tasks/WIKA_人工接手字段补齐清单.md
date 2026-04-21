# WIKA 人工接手字段补齐清单

用于汇总必须人工补齐、人工确认或外部条件到位的字段和边界。

## 任务清单

### P1｜补齐报价、交期、样品和买家关键字段

- 任务编号：`HANDOFF-P1-001`
- 任务类型：`manual_field_completion`
- 负责人角色：人工接手人员
- 归属任务：任务4/任务5
- 来源报告：`WIKA/docs/reports/deliverables/WIKA_人工接手清单.md`
- 来源证据：`WIKA/docs/reports/deliverables/evidence/WIKA_正式运营报告包证据.json`
- 为什么重要：这些字段决定回复和订单草稿能否进入人工确认，WIKA 不能替代真实商业承诺。
- 预期收益：让 reply/order 草稿从准备层更快进入可人工确认状态。
- WIKA 支撑范围：`manual_only`
- 是否需要人工输入：是
- 到期窗口：今天至本周
- 不做的风险：reply/order 草稿会卡在 handoff 层，无法进入人工执行。

执行步骤：
- 按人工接手清单逐项补齐产品、报价、交期、样品、买家、订单字段。
- 把补齐结果回填到销售/跟单任务清单。
- 由销售/跟单最终确认是否可发送或创单。

输入要求：
- 报价
- 交期
- 样品安排
- 买家联系人
- 订单备注

验收标准：
- P1 草稿所需关键字段全部补齐。
- 每个字段都有人工来源或负责人。
- WIKA 未被用于替代人工商业承诺。

阻塞项：
- 无

### P3｜保留 task3/task4/task5 写侧最后一跳为人工

- 任务编号：`BLOCK-P3-002`
- 任务类型：`blocked_write_boundary`
- 负责人角色：人工接手人员
- 归属任务：任务3/任务4/任务5
- 来源报告：`WIKA/docs/reports/deliverables/WIKA_人工接手清单.md`
- 来源证据：`WIKA/docs/reports/deliverables/evidence/WIKA_正式运营报告包证据.json`
- 为什么重要：当前缺测试对象、rollback、readback 或官方 direct candidate，不允许把 preview/workbench 写成平台内执行。
- 预期收益：确保低风险边界不被误穿透。
- WIKA 支撑范围：`blocked`
- 是否需要人工输入：是
- 到期窗口：外部条件到位后
- 不做的风险：可能误触写侧或造成业务风险。

执行步骤：
- 继续把 task3/task4/task5 保持在外部草稿和人工接手模式。
- 任何平台内执行都必须先补齐安全前置条件。
- 在任务包中明确最后一跳由人工完成。

输入要求：
- 测试对象
- rollback/cleanup 路径
- readback 路径
- 官方文档与参数契约

验收标准：
- 没有出现自动发布、自动回复、自动创单表述。
- 人工接手项清楚列出。
- 写侧阻塞条件清楚列出。

阻塞项：
- 缺测试对象
- 缺 rollback/cleanup
- 缺 stable readback


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
