# WIKA_阶段29_行动中心与预览层说明

## 阶段定位
- 本阶段只在既有 stage28 消费层之上继续做统一整合。
- 不新增 official fields。
- 不新增 Alibaba API 验证。
- 不做任何写侧动作。

## 新增 route

### `/integrations/alibaba/wika/reports/action-center`
- 复用：
  - `business-cockpit`
  - `task-workbench`
  - store / product / order diagnostic
  - store / product / order comparison
- 最少输出：
  - `business_cockpit_summary`
  - `diagnostic_signal_summary`
  - `comparison_signal_summary`
  - `task3_summary`
  - `task4_summary`
  - `task5_summary`
  - `prioritized_actions`
  - `shared_blockers`
  - `boundary_statement`

### `/integrations/alibaba/wika/workbench/product-draft-preview`
- 复用：
  - 安全产品草稿链路
  - 既有 schema / media / product context
- 最少输出：
  - `preview_input_summary`
  - `product_context`
  - `context_snapshot`
  - `draft_preview`
  - `required_manual_fields`
  - `blocking_risks`
  - `recommended_next_action`
  - `boundary_statement`

### `/integrations/alibaba/wika/workbench/reply-preview`
- 复用：
  - `reply-draft` 外部草稿链路
- 最少输出：
  - `preview_input_summary`
  - `workflow_preview`
  - `draft_preview`
  - `blocking_risks`
  - `quality_gate_summary`
  - `recommended_next_action`
  - `boundary_statement`

### `/integrations/alibaba/wika/workbench/order-preview`
- 复用：
  - `order-draft` 外部草稿链路
- 最少输出：
  - `preview_input_summary`
  - `workflow_preview`
  - `draft_preview`
  - `blocking_risks`
  - `quality_gate_summary`
  - `recommended_next_action`
  - `boundary_statement`

### `/integrations/alibaba/wika/workbench/preview-center`
- 聚合：
  - `product_preview`
  - `reply_preview`
  - `order_preview`
  - `preview_readiness`
  - `shared_blockers`
  - `boundary_statement`

## 证据与脚本
- 验证脚本：
  - `WIKA/scripts/validate-wika-stage29-action-center-and-preview.js`
- 本地 evidence：
  - `WIKA/docs/framework/evidence/wika-stage29-action-center-and-preview-summary.json`
  - `WIKA/docs/framework/evidence/wika_action_center.json`
  - `WIKA/docs/framework/evidence/wika_product_draft_preview.json`
  - `WIKA/docs/framework/evidence/wika_reply_preview.json`
  - `WIKA/docs/framework/evidence/wika_order_preview.json`
  - `WIKA/docs/framework/evidence/wika_preview_center.json`

## 当前边界
- action-center 是消费层，不是平台内执行层。
- preview 是输入感知预览层，不是平台内发布 / 回复 / 创单。
- 当前仍未上线，不能写成已部署。
- not task 1 complete
- not task 2 complete
- not task 3 complete
- not task 4 complete
- not task 5 complete
- task 6 excluded
- not full business cockpit
