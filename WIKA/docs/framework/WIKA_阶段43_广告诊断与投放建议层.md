# WIKA 阶段 43：广告诊断与投放建议层

## 本阶段目标
- 基于阶段 42 的导入合同，先把广告分析层跑通。
- 当前优先建立：
  - `ads_summary`
  - `ads_comparison`
  - `ads_diagnostic`
  - `ads_action_center`

## 本轮新增
- `WIKA/projects/wika/data/ads/diagnostics.js`
- `WIKA/scripts/validate-wika-stage43-ads-diagnostic.js`
- `WIKA/docs/framework/evidence/wika-stage43-ads-diagnostic.json`

## 当前输出结构

### ads_summary
- 导入合同摘要
- 汇总指标
- campaign / ad group / keyword breakdown
- unavailable dimensions
- boundary_statement

### ads_comparison
- current / previous window
- metric deltas
- trend_direction
- unavailable dimensions
- boundary_statement

### ads_diagnostic
- official_inputs（明确为 imported fields）
- summary
- comparison
- diagnostic_findings
- recommendations
- unavailable_dimensions
- boundary_statement

### ads_action_center
- summary_snapshot
- comparison_snapshot
- prioritized_actions
- shared_blockers
- unavailable_dimensions
- boundary_statement

## 当前诊断边界
- 当前所有广告建议都建立在：
  - imported ads data
  - derived comparison
  - conservative recommendation logic
- 当前不能写成：
  - 已自动打通广告 official api
  - 已具备预算 / 出价 / 关键词写回能力
  - 已形成广告平台执行闭环

## 当前阻塞
- 真实广告业务诊断仍需要真实导出数据输入。
- 在没有真实导出数据前，本阶段只能做到：
  - 合同成立
  - 样本级验证通过
  - 规则链可复用

## 下一步
- 若拿到真实广告导出，优先把真实数据接入当前合同层。
- 若仍没有真实广告导出，则后续统一运营操作系统只能把广告层标记为：
  - import-ready
  - waiting-for-real-export
