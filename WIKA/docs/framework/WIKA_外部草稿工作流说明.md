# WIKA_外部草稿工作流说明

更新时间：2026-04-11

## 文档定位

本文件说明 WIKA 当前已经收口的“外部草稿工作流层”，覆盖 reply draft、order draft、review / gate、handoff pack、人工补单与回归脚本。

当前边界必须明确：

- 这是一层外部草稿与交接能力，不是平台内闭环。
- 这不代表平台内已回复、已创单、已通知送达。
- 这不代表写侧动作已经放开。

## 当前稳定输出结构

reply draft 与 order draft 当前统一保留以下核心字段：

- `input_summary`
- `available_context`
- `missing_context`
- `hard_blockers`
- `soft_blockers`
- `assumptions`
- `follow_up_questions`
- `handoff_fields`
- `alert_payload`

在此基础上，已稳定补充：

- `workflow_profile`
- `template_version`
- `handoff_checklist`
- `manual_completion_sop`
- 统一 blocker taxonomy
- 合理范围内的 `source / confidence / missing_reason`

order draft 继续保留：

- `required_manual_fields`

## 当前不能自动完成的内容

- 平台内发送回复
- 平台内创建订单
- 自动承诺最终成交价格
- 自动承诺最终交期
- 自动生成真实效果图
- 自动发送真实通知

## 人工接手与补单

当前人工接手统一配套：

- `WIKA/docs/framework/WIKA_外部回复输入模板.md`
- `WIKA/docs/framework/WIKA_外部订单输入模板.md`
- `WIKA/docs/framework/WIKA_人工补单模板.md`

人工接手的核心判断顺序：

1. 先看 `hard_blockers`
2. 再看 `soft_blockers`
3. 再看 `follow_up_question_details`
4. 再看 `handoff_checklist`
5. 最后按 `manual_completion_sop` 补齐字段

## blocker taxonomy 收口

当前 reply / order 使用同一套 blocker taxonomy。每个 blocker 都要求明确：

- `code`
- `hard_or_soft`
- `definition`
- `trigger_condition`
- `next_human_action`
- `draft_can_still_be_produced`
- `handoff_mandatory`

文档和代码必须共用同一套命名，不允许代码一套、文档一套。

## 样例与验证

当前样例已固定覆盖 reply / order 的完整与缺失场景，验证脚本负责回灌样例并做可失败断言。

主验证脚本：

- `WIKA/scripts/validate-wika-external-draft-regression.js`

兼容入口：

- `WIKA/scripts/validate-wika-external-draft-workflows.js`
- `WIKA/scripts/validate-wika-workflow-phase14.js`

验证脚本至少输出：

- `workflow_profile`
- `template_version`
- `hard_blockers_count`
- `soft_blockers_count`
- `handoff_required`
- `draft_usable_externally`
- `readiness_level`

## 质量评估层与交接包

当前 reply / order 输出已经补齐质量评估层，统一 review 维度包括：

- `structure_completeness`
- `blocker_consistency`
- `minimum_package_readiness`
- `handoff_clarity`
- `manual_completion_readiness`
- `externally_usable_boundary`
- `source_traceability`

统一 review 输出至少包括：

- `review_profile`
- `review_version`
- `readiness_level`
- `passed_checks`
- `failed_checks`
- `review_findings`
- `recommended_next_action`
- `handoff_mandatory`
- `draft_usable_externally`

当前已支持两类 handoff pack：

- reply handoff pack
- order handoff pack

支持格式：

- JSON
- Markdown

## 2026-04-11 Stage 28 Workbench Addendum

### New local workbench routes
- `/integrations/alibaba/wika/workbench/reply-workbench`
- `/integrations/alibaba/wika/workbench/order-workbench`
- `/integrations/alibaba/wika/workbench/task-workbench`

### What stage28 adds
- one consumer-facing summary layer on top of existing `reply-draft` and `order-draft`
- explicit `workflow_capability / input_requirements / blocker_taxonomy_summary / handoff_pack_capability / quality_gate_summary / boundary_statement`
- one combined `task-workbench` route for task3/4/5 handoff view

### Boundary
- external drafts only
- no platform reply send
- no platform order create
- task 6 excluded
- local contract only in stage28

## 当前结论

当前已经形成“外部草稿工作流层 + blocker taxonomy + 人工补单 SOP + 可失败回归闸门 + handoff pack 导出”的稳定中间层。

但这仍然只代表：

- 外部回复草稿可用
- 外部订单草稿可用
- 人工接手更顺畅

并不代表：

- 平台内已回复
- 平台内已创单
- 真实通知已送达

## 固定边界

- 本轮没有做新的 Alibaba API 验证。
- 本轮没有推进平台内自动回复。
- 本轮没有推进平台内订单创建。
- 本轮没有推进真实通知外发。
- 当前增强的是任务 4/5 的外部草稿工作流层，不是平台内闭环。
