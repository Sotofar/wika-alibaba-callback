# XD 每周执行清单 Stage33

## 使用原则

- 周报窗口只用上一完整自然周
- “当前状态附注”只能放在能力状态章节，不能混进周报窗口结论
- 不把样本报告写成全量经营报告
- restriction 对象是否重开，只能按 stage30 reopen gate 判断

## 推荐一键入口

```powershell
node scripts/run-xd-operations-workflow-stage33.js --mode=weekly --week-start=YYYY-MM-DD --week-end=YYYY-MM-DD
```

## 拆分执行清单

| 步骤 | 命令 | 输入文件 | 输出文件 | 成功标准 | 失败时下一步 | 是否需要人工判断 |
| --- | --- | --- | --- | --- | --- | --- |
| 1. 确认上一完整自然周窗口 | `node scripts/generate-xd-operations-report-stage31.js --mode=weekly --dry-run --timezone=Asia/Shanghai` | 系统日期、时区约定 | dry-run 输出到控制台 | 已明确本次周报的 `start/end`，且与上一完整自然周一致 | 若窗口不明确，先人工确认时间范围，不要直接生成周报 | 需要 |
| 2. 跑周报 | `node scripts/generate-xd-operations-report-stage31.js --mode=weekly --start=<week_start> --end=<week_end> --timezone=Asia/Shanghai` | live stable routes、stage30/stage31 证据 | `Ali-WIKA/projects/xd/access/XD_WEEKLY_OPERATIONS_REPORT_STAGE31.md`、`docs/framework/evidence/xd_weekly_operations_report_stage31.json`、`Ali-WIKA/projects/xd/access/reports/xd_weekly_report_<week_start>_<week_end>.md`、`.json` | 周报 markdown / json 都生成，且报告范围、能力状态、风险限制齐全 | 若单 route 缺失，允许降级；若周报脚本失败，停止管理层分发 | 否 |
| 3. 跑 critical route 巡检 | `node scripts/check-xd-critical-routes-stage31.js --json --markdown --output=Ali-WIKA/projects/xd/access/monitoring/runs/xd_critical_routes_weekly_<week_start>_<week_end>` | 无 | `Ali-WIKA/projects/xd/access/monitoring/runs/xd_critical_routes_weekly_<week_start>_<week_end>.json`、`.md` | `overall_status` 为 `PASS` 或 `DEGRADED`，且关键 stable routes 没有整体失效 | 若 base 失败，周报只能停在“环境异常”结论 | 需要 |
| 4. 生成老板摘要 | `Get-Content Ali-WIKA/projects/xd/access/XD_WEEKLY_OPERATIONS_REPORT_STAGE31.md` | 周报 md/json、巡检 JSON、stage30 freeze/reopen gate | 一页内老板摘要 | 摘要明确能力状态、运营价值、限制、下周建议、是否值得继续投入 | 若摘要需要依赖 GMV / 转化率等不可得指标，必须删掉并改写为限制说明 | 需要 |
| 5. 复核限制说明 | `Get-Content Ali-WIKA/projects/xd/access/reopen_gate_stage30.md` | reopen gate、permission gap、周报 JSON | 限制复核结论 | 已再次确认样本口径、restriction freeze、write-adjacent skip 没有被误写 | 若发现摘要误把样本写成全量，先修正文案再分发 | 需要 |
| 6. 输出业务建议 | `Get-Content Ali-WIKA/projects/xd/access/reports/XD_EXECUTIVE_SUMMARY_STAGE32.md` | 老板摘要、周报、巡检结果 | 下周建议清单 | 建议聚焦日报 / 周报 / 巡检 / 样本运营动作 | 若建议开始滑向 API 试探或写侧动作，应立即收回 | 需要 |
| 7. 判断是否满足 reopen gate | `Get-Content Ali-WIKA/projects/xd/access/final_safe_scope_freeze_stage30.md` | reopen gate、周报结果、外部新增证据 | reopen gate 判断结论 | 只有出现新的外部 live 证据时才写“可重开” | 若没有新证据，明确结论为“维持冻结” | 需要 |

## 每周完成门槛

- 已锁定上一完整自然周窗口
- 周报已生成
- 本周巡检已生成
- 老板摘要已形成
- 限制说明已复核
- 已明确“是否满足 reopen gate”
