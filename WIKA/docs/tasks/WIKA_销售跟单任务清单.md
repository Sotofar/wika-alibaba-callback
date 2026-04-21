# WIKA 销售跟单任务清单

用于销售 / 跟单使用 reply/order workbench、preview 与 draft，但最后一跳仍由人工执行。

## 任务清单

### P1｜统一 reply/order 草稿人工确认流程

- 任务编号：`SALES-P1-001`
- 任务类型：`sales_handoff`
- 负责人角色：销售/跟单
- 归属任务：任务4/任务5
- 来源报告：`WIKA/docs/reports/deliverables/WIKA_销售跟单使用清单.md`
- 来源证据：`WIKA/docs/reports/deliverables/evidence/WIKA_正式运营报告包证据.json`
- 为什么重要：WIKA 已能生成回复和订单外部草稿，但最后发送和创单仍必须人工确认。
- 预期收益：减少重复整理字段和草稿时间，同时避免无隔离写侧风险。
- WIKA 支撑范围：`preview_or_handoff_only`
- 是否需要人工输入：是
- 到期窗口：每日
- 不做的风险：销售继续手工整理，且容易漏掉报价、交期、样品等关键字段。

执行步骤：
- 先用 reply-workbench / reply-preview 检查回复草稿条件。
- 再用 reply-draft 生成外部草稿并交人工确认。
- 订单相关先用 order-workbench / order-preview 检查字段，再用 order-draft 生成外部草稿。
- 所有平台内发送或创单动作均由人工完成。

输入要求：
- 最终报价
- 交期
- 样品政策
- 买家信息
- 订单字段

验收标准：
- 每次回复或订单草稿都有人工确认记录。
- 缺字段时不得直接发送或创单。
- 没有把外部草稿写成平台内执行成功。

阻塞项：
- 无

### P2｜沉淀高频询盘回复模板

- 任务编号：`SALES-P2-001`
- 任务类型：`reply_template`
- 负责人角色：销售/跟单
- 归属任务：任务4
- 来源报告：`WIKA/docs/reports/deliverables/WIKA_销售跟单使用清单.md`
- 来源证据：`WIKA/docs/reports/deliverables/evidence/WIKA_正式运营报告包证据.json`
- 为什么重要：reply-draft 可生成外部草稿，但高频问题仍需要团队统一口径。
- 预期收益：提高回复一致性，降低人工重复编辑时间。
- WIKA 支撑范围：`preview_or_handoff_only`
- 是否需要人工输入：是
- 到期窗口：本周
- 不做的风险：销售回复口径继续不统一。

执行步骤：
- 从最近询盘中整理高频问题。
- 使用 reply-draft 生成外部草稿底稿。
- 人工确认后沉淀为团队模板。

输入要求：
- 高频问题列表
- 标准报价说明
- 交期说明
- 样品政策

验收标准：
- 至少沉淀 5 条高频回复模板。
- 模板经过销售负责人确认。
- 没有自动平台内发送。

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
