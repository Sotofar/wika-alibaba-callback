# XD 每日执行清单 Stage33

## 使用原则

- 默认只读
- 先跑巡检，再跑日报，再做人读摘要
- 所有输出都保留“当前页样本 / 非多页全量聚合”说明
- 没有新外部证据时，不做 restriction 对象同构重试

## 推荐一键入口

```powershell
node scripts/run-xd-operations-workflow-stage33.js --mode=daily --date=YYYY-MM-DD
```

## 拆分执行清单

| 步骤 | 命令 | 输入文件 | 输出文件 | 成功标准 | 失败时下一步 | 是否需要人工判断 |
| --- | --- | --- | --- | --- | --- | --- |
| 1. 确认 production base | `node scripts/check-xd-critical-routes-stage31.js --json --output=Ali-WIKA/projects/xd/access/monitoring/runs/xd_critical_routes_daily_<date>` | 无 | `Ali-WIKA/projects/xd/access/monitoring/runs/xd_critical_routes_daily_<date>.json` | `health`、`auth-debug`、`xd-auth-debug` 均为 `PASS` 或 `PASS_NO_DATA` | 若 base 失败，停止当日对外输出，等待 runtime / auth 恢复 | 需要 |
| 2. 跑 critical route 巡检 | `node scripts/check-xd-critical-routes-stage31.js --json --markdown --output=Ali-WIKA/projects/xd/access/monitoring/runs/xd_critical_routes_daily_<date>` | 无 | `Ali-WIKA/projects/xd/access/monitoring/runs/xd_critical_routes_daily_<date>.json`、`.md` | `overall_status` 为 `PASS` 或 `DEGRADED`，且脚本本身不崩溃 | 若出现 `FAIL_*`，保留结果并进入异常标记，不要扩大成全局失效 | 需要 |
| 3. 跑日报 | `node scripts/generate-xd-operations-report-stage31.js --mode=daily --start=<date> --end=<date> --timezone=Asia/Shanghai` | stage30/stage31 freeze 证据、live stable routes | `Ali-WIKA/projects/xd/access/reports/xd_daily_report_<date>.md`、`.json` | markdown / json 均生成，且 JSON 含 `time_window`、`orders`、`products`、`capability_state` | 若单 route 缺失，允许降级；若报告脚本失败，改查巡检结果与 live route | 否 |
| 4. 读取日报 JSON | `Get-Content Ali-WIKA/projects/xd/access/reports/xd_daily_report_<date>.json` | 当日日报 JSON | 人工阅读输入 | 已确认样本订单数、商品样本数、窗口命中数、风险说明 | 若 JSON 结构异常，先跑 `node scripts/validate-xd-operations-report-stage31.js` | 需要 |
| 5. 生成人读摘要 | `Get-Content Ali-WIKA/projects/xd/access/reports/xd_daily_report_<date>.md` | 当日日报 md/json、当日巡检 JSON | 面向业务侧的文字摘要 | 摘要明确可讲 / 不可讲、样本口径、异常项 | 若摘要无法落到 3-5 个重点，说明当日数据不足，应写清 not_available 与原因 | 需要 |
| 6. 标记异常 | `Get-Content Ali-WIKA/projects/xd/access/monitoring/runs/xd_critical_routes_daily_<date>.json` | 巡检 JSON、日报 JSON | 当日异常列表 | 已明确是否出现 `FAIL_ROUTE`、`FAIL_AUTH`、样本消失、总量信号异常 | 若异常影响 base，停止分发；若仅单 route 异常，输出降级说明 | 需要 |
| 7. 输出给业务侧 | `Get-Content Ali-WIKA/projects/xd/access/reports/XD_OPERATIONS_SUMMARY_STAGE32.md` | 当日摘要文本、日报、巡检结果 | 对业务侧的日报摘要 | 摘要中显式保留“当前页样本 / 非全量聚合”说明 | 若业务侧需要全量经营指标，明确说明当前不能提供 | 需要 |

## 每日完成门槛

- 巡检已完成并有 JSON / markdown
- 日报已生成
- 当日摘要已形成
- 异常项已被标记
- 对业务侧输出时保留限制说明
