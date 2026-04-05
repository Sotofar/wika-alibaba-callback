# WIKA_执行计划

## 当前阶段
阶段 15 收口：任务 4/5 的外部草稿工作流 SOP 化与交接标准包

## 本阶段唯一目标
不验证任何新的 Alibaba API，不推进平台内读写，也不推进真实通知外发。
只在现有：

- `/integrations/alibaba/wika/tools/reply-draft`
- `/integrations/alibaba/wika/tools/order-draft`

基础上，把外部草稿工作流继续收口成：

- 可交接
- 可补单
- 可审计
- 可复用

的稳定 SOP 层。

## 起始基线
- 当前实际起始仓库状态以本轮开始时的 `HEAD` 为准：`183384f`
- 只推进 `WIKA`
- 一律复用 Railway production 认证闭环与 `/sync + access_token + sha256`
- 不新增任何 Alibaba API 验证
- 不推进任何平台内写动作
- 当前已存在：
  - `reply-draft` / `order-draft` 工具路由
  - 产品 / 订单 / operations minimal-diagnostic
  - 产品草稿 helper
  - 订单草稿 helper
  - notifier / alerts / fallback
  - 写侧护栏与人工接管规则

## 本阶段分解

### A. 收口稳定输出结构
在不破坏现有字段兼容性的前提下，补齐并标准化：

- `workflow_profile`
- `template_version`
- `handoff_checklist`
- `blocker_code / blocker_reason / blocker_next_action`
- `manual_completion_sop`
- `field-level source / confidence / missing_reason`

必须继续保留：

- `input_summary`
- `available_context`
- `missing_context`
- `hard_blockers`
- `soft_blockers`
- `assumptions`
- `follow_up_questions`
- `handoff_fields`
- `alert_payload`
- `required_manual_fields`（order draft）

### B. 收口 blocker taxonomy
统一 reply / order 的 blocker taxonomy，要求代码和文档使用同一套：

- 稳定 blocker code
- hard / soft 判断依据
- definition
- trigger condition
- next human action
- draft can still be produced
- handoff mandatory

### C. 收口人工补单与 handoff SOP
重点增强：

- reply:
  - follow_up question priority
  - minimum reply package 判断
  - 哪些缺口允许先出草稿，哪些必须先 handoff
- order:
  - `required_manual_fields` 到人工补单模板 section 的映射
  - `why_required / example_value / collection_hint / who_should_fill`
  - `handoff_fields` 与 `required_manual_fields` 的对应关系

### D. 输入模板版本化
只做有限的可复用 profile，不做大而全模板：

- reply 至少 3 个 profile
- order 至少 3 个 profile

profile 必须写清：

- 输入预期
- 常见 blocker
- 适合的交接方式

### E. 样例与验证脚本收口
- 主验证脚本使用稳定命名：
  - `scripts/validate-wika-external-draft-workflows.js`
- 旧脚本：
  - `scripts/validate-wika-workflow-phase14.js`
  只保留为兼容别名
- 样例扩展到至少 6 组：
  - reply 3 组
  - order 3 组
- 验证脚本输出必须显示：
  - `workflow_profile`
  - `template_version`
  - `hard_blockers_count`
  - `soft_blockers_count`
  - `handoff_required`
  - `draft_usable_externally`

## 本阶段明确排除
- XD
- mydata / overview / 数据管家
- inquiries / messages / customers 新验证
- order create 新验证
- RFQ
- 真实商品发布
- 真实线上商品修改
- 真实客户沟通
- 平台内回复发送
- 平台内订单创建
- 真实通知外发
- 自动进入下一阶段

## 推进规则
1. 本阶段不追求平台内自动化
2. 只追求让外部草稿工作流更适合人机协同
3. 不得把“模板更完整 / blocker 更规范”误写成“平台内能力已打通”
4. 若发现潜在新 API，只记录到候选池，不做实测
5. 本阶段完成后停止，不自动进入下一阶段

## 当前执行结果（已完成）
- `reply-draft` 已新增并稳定输出：
  - `workflow_profile`
  - `template_version`
  - `follow_up_question_details`
  - `minimum_reply_package`
  - `draft_usable_externally`
  - `handoff_checklist`
  - `manual_completion_sop`
- `order-draft` 已新增并稳定输出：
  - `workflow_profile`
  - `template_version`
  - `required_manual_field_details`
  - `follow_up_question_details`
  - `handoff_checklist`
  - `manual_completion_sop`
  - `draft_usable_externally`
- blocker taxonomy 已统一到：
  - `shared/data/modules/alibaba-external-workflow-taxonomy.js`
- 当前模板 profile 已固定：
  - reply:
    - `reply_minimal_handoff`
    - `reply_quote_confirmation_needed`
    - `reply_mockup_customization`
  - order:
    - `order_minimal_handoff`
    - `order_quote_confirmation_needed`
    - `order_commercial_review`
- 当前样例已扩展到 6 组：
  - reply 3 组
  - order 3 组
- 主验证脚本已稳定为：
  - `scripts/validate-wika-external-draft-workflows.js`
- 旧脚本 `scripts/validate-wika-workflow-phase14.js` 仅作为兼容别名保留

## 停止条件
- 输出结构、模板、taxonomy、handoff SOP、样例、脚本已经统一
- route smoke test 与样例刷新已经完成
- 再往前推进就会落到平台内自动执行或新 API 验证，不符合本阶段边界

## 交付物
- `docs/framework/WIKA_项目基线.md`
- `docs/framework/WIKA_执行计划.md`
- `docs/framework/WIKA_自治推进日志.md`
- `docs/framework/WIKA_外部草稿工作流说明.md`
- `docs/framework/WIKA_外部回复输入模板.md`
- `docs/framework/WIKA_外部订单输入模板.md`
- `docs/framework/WIKA_人工补单模板.md`
- `docs/framework/WIKA_已上线能力复用清单.md`
- `docs/framework/WIKA_面向6项任务_API缺口矩阵.md`
- `docs/framework/WIKA_下一批必须验证的API候选池.md`
- `docs/framework/WIKA_外部回复草稿样例.json`
- `docs/framework/WIKA_外部订单草稿样例.json`

## 固定汇报结构
- 当前阶段
- 本轮目标
- 已复用的已上线能力
- 本轮新验证 / 新开发 / 新沉淀的内容
- 本轮明确排除的 API / 能力
- 已完成闸门
- 当前唯一阻塞点
- WIKA 是否遇到过
- WIKA 的解决方式是否可复用
- 下一步唯一动作
- 明确未完成项
- 当前还缺哪些经营关键数据
- 当前离“完成 6 项任务”还差哪些能力缺口
- 当前诊断里哪些是真实数据结论，哪些只是待验证判断
