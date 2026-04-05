# WIKA_执行计划

## 当前阶段
阶段 15：任务 4/5 的外部草稿工作流模板化与人工补单包

## 本阶段唯一目标
不验证任何新 Alibaba API，也不推进平台内读写。只在现有 `/tools/reply-draft` 与 `/tools/order-draft` 基础上，继续增强：
- 输入模板
- blocker 分层
- follow-up questions
- 人工补单模板
- handoff / escalation 包

本阶段实现策略：
- 优先增强现有工具路由输出，不新增平台内执行动作
- 所有样例都必须可复现，且必须明确区分 hard blocker / soft blocker / assumption

## 起始基线
- 只推进 `WIKA`
- 一律复用 Railway production 认证闭环与 `/sync + access_token + sha256`
- 产品 / 订单 / 类目 / schema / media / customers 探针 / draft-types 读侧原始路由已稳定
- `operations / products / orders minimal-diagnostic` 已成立
- 产品草稿 helper、订单草稿 helper、写侧护栏、人工接管规则、通知 fallback 已存在
- 任务 3 / 4 / 5 的平台内能力当前仍受权限或安全边界限制
- 任务 6 已有 provider-agnostic notifier + outbox fallback，真实 provider 尚未配置

## 本阶段分解
### A. 标准化输入模板
- 新增：
  - `docs/framework/WIKA_外部回复输入模板.md`
  - `docs/framework/WIKA_外部订单输入模板.md`
- 明确字段分层：
  - `required`
  - `recommended`
  - `optional`
- 明确缺失影响分层：
  - `hard_blocker`
  - `soft_blocker`
  - `assumption_needed`

### B. 增强 blocker / follow-up / handoff 分层
- 回复草稿输出至少增强：
  - `input_summary`
  - `available_context`
  - `missing_context`
  - `hard_blockers`
  - `soft_blockers`
  - `assumptions`
  - `follow_up_questions`
  - `handoff_fields`
  - `alert_payload`
- 订单草稿输出至少增强：
  - `input_summary`
  - `available_context`
  - `missing_context`
  - `hard_blockers`
  - `soft_blockers`
  - `assumptions`
  - `required_manual_fields`
  - `follow_up_questions`
  - `handoff_fields`
  - `alert_payload`

### C. 输出人工补单包与可复用样例
- 优先增强现有路由输出：
  - `/integrations/alibaba/wika/tools/reply-draft`
  - `/integrations/alibaba/wika/tools/order-draft`
- 新增：
  - `docs/framework/WIKA_人工补单模板.md`
- 更新：
  - `docs/framework/WIKA_外部草稿工作流说明.md`
  - `docs/framework/WIKA_外部回复草稿样例.json`
  - `docs/framework/WIKA_外部订单草稿样例.json`
- 至少形成 4 组样例：
  - 信息较完整的 reply draft
  - 信息缺失明显的 reply draft
  - 信息较完整的 order draft
  - 信息缺失明显的 order draft

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
- 自动进入下一阶段

## 推进规则
1. 本阶段不追求平台内自动化
2. 只追求让外部草稿工作流更适合人机协同
3. 不得把“模板更完整”误写成“平台内能力已打通”
4. 若现有路由输出结构不稳定，可先重构模块层，再补样例
5. 本阶段完成后停止，不自动进入下一阶段

## 当前推荐下一步
如果本阶段完成且仍需继续，只建议围绕“人机协同使用体验”继续做低风险增强，例如更细的输入模板版本、更清楚的 handoff checklist，或对现有 blocker 分层进一步精炼；不回到新 API 验证循环。

## 停止条件
- 输入模板已标准化
- reply/order draft 输出已具备 blocker 分层、follow-up questions、handoff_fields
- 样例与文档已落盘
- route 增强验收已完成
- 再往前推进会变成平台内自动执行或新 API 验证

## 交付物
- `docs/framework/WIKA_外部回复输入模板.md`
- `docs/framework/WIKA_外部订单输入模板.md`
- `docs/framework/WIKA_人工补单模板.md`
- `docs/framework/WIKA_外部草稿工作流说明.md`
- `docs/framework/WIKA_外部回复草稿样例.json`
- `docs/framework/WIKA_外部订单草稿样例.json`
- `docs/framework/WIKA_项目基线.md`
- `docs/framework/WIKA_执行计划.md`
- `docs/framework/WIKA_面向6项任务_API缺口矩阵.md`
- `docs/framework/WIKA_已上线能力复用清单.md`
- `docs/framework/WIKA_下一批必须验证的API候选池.md`
- `docs/framework/WIKA_自治推进日志.md`

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
