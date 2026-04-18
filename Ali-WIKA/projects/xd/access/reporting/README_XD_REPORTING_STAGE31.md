# XD Reporting Stage31

## 目的

把已经封板的 XD safe-scope 能力转成可重复执行的日报 / 周报生成资产，而不是继续试接口。

## 入口脚本

- `scripts/generate-xd-operations-report-stage31.js`

## 支持参数

- `--mode=daily`
- `--mode=weekly`
- `--start=YYYY-MM-DD`
- `--end=YYYY-MM-DD`
- `--timezone=Asia/Shanghai`
- `--output=<markdown path>`
- `--json-output=<json path>`
- `--dry-run`
- `--from-evidence`

## 推荐用法

```powershell
node scripts/generate-xd-operations-report-stage31.js --mode=weekly --timezone=Asia/Shanghai
```

```powershell
node scripts/generate-xd-operations-report-stage31.js --mode=daily --from-evidence --dry-run
```

## 输出原则

- 默认只读。
- 先写口径限制，再写可见事实。
- route 不可用时降级到 evidence / docs，不因为单个 route 失败整体崩溃。
- 不可得指标必须输出：
  - `not_available`
  - `reason`
  - `required_evidence`

## 当前默认产物

- `Ali-WIKA/projects/xd/access/XD_WEEKLY_OPERATIONS_REPORT_STAGE31.md`
- `docs/framework/evidence/xd_weekly_operations_report_stage31.json`
- `Ali-WIKA/projects/xd/access/reports/xd_weekly_report_<start>_<end>.md`
- `Ali-WIKA/projects/xd/access/reports/xd_weekly_report_<start>_<end>.json`

## 明确边界

- 不做多页全量聚合。
- 不把当前页样本写成全量数据。
- 不编造 GMV、转化率、国家结构、完整经营诊断。
- `orders/summary|trend|report-consumers` 当前 production 未绑定；stage31 使用文件化报告资产与 minimal-diagnostic 辅助信号替代。

