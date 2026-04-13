# WIKA_阶段31_统一控制台层说明

## 阶段定位
- 本阶段只在既有 `business-cockpit + action-center + task-workbench + preview-center` 之上，再补一层统一控制台。
- 不新增 official fields。
- 不新增 Alibaba API 验证。
- 不做任何写侧动作。

## 新增 route

### `/integrations/alibaba/wika/reports/operator-console`
- 复用：
  - `/integrations/alibaba/wika/reports/business-cockpit`
  - `/integrations/alibaba/wika/reports/action-center`
  - `/integrations/alibaba/wika/workbench/task-workbench`
  - `/integrations/alibaba/wika/workbench/preview-center`
- 最少输出：
  - `business_cockpit_summary`
  - `action_center_summary`
  - `task3_summary`
  - `task4_summary`
  - `task5_summary`
  - `preview_readiness`
  - `shared_blockers`
  - `next_best_actions`
  - `boundary_statement`

## 当前目标
- 让业务侧一眼看到：
  - 当前经营态势总览
  - 当前优先动作
  - task3/4/5 当前是否具备 preview readiness
  - 当前仍需要人工接手的 blocker

## 证据与脚本
- 验证脚本：
  - `WIKA/scripts/validate-wika-stage31-operator-console.js`
- 本地 evidence：
  - `WIKA/docs/framework/evidence/wika-stage31-operator-console-summary.json`
  - `WIKA/docs/framework/evidence/wika_operator_console.json`

## 当前边界
- operator-console 只是统一控制台层，不是平台内执行层。
- comparison 仍是 derived。
- order `formal_summary / product_contribution / trend_signal` 仍是 derived。
- unavailable dimensions 继续显式保留。
- 当前仍未上线，不能写成已部署能力。
- not task 1 complete
- not task 2 complete
- not task 3 complete
- not task 4 complete
- not task 5 complete
- task 6 excluded
- not full business cockpit
