# WIKA 正式运营报告包 Runbook STAGE48

## 1. 什么时候复跑报告包

复跑触发条件：

- 每周固定运营复盘前。
- 人工补数完成后。
- 报告包需要重新分发给业务角色前。
- 线上 WIKA report route 发生明显回退后。

不建议复跑的情况：

- 没有新输入，只是重复确认 PDF 是否存在。
- 想把 task1-5 写成 complete，但没有真实执行证据。
- 想自动执行商品、订单、上下架、草稿或消息动作。

## 2. 怎么生成 Markdown

使用现有脚本：

```powershell
node WIKA/scripts/generate-wika-operational-deliverables.js
```

## 3. 怎么生成 PDF

使用现有脚本：

```powershell
python WIKA/scripts/export-wika-operational-deliverables-pdfs.py
```

Stage48 不默认重新导出 PDF。只有当 Markdown 已更新或 PDF 缺失时再执行。

## 4. 怎么复制到桌面

PDF 导出脚本会记录桌面副本路径。若当前环境无法访问桌面或桌面副本缺失，只记录为分发风险，不阻塞仓库内报告包。

## 5. 怎么校验 PDF

```powershell
node WIKA/scripts/run-wika-operational-report-package-stage48.js --check-only --output-json
```

校验内容包括 8 份 Markdown、8 份 PDF、PDF 清单 JSON、评分 JSON、证据 JSON、桌面副本状态和线上 sanity。

## 6. 怎么跑线上 sanity

线上 sanity 只检查：

- `/health`
- `/integrations/alibaba/auth/debug`
- `/integrations/alibaba/wika/reports/business-cockpit`
- `/integrations/alibaba/wika/reports/operator-console`
- `/integrations/alibaba/wika/reports/action-center`

`operator-console` 和 `action-center` 允许出现已记录的 section 级 degraded，只要 HTTP 200 JSON、基础结果可用、degraded metadata 明确。

## 7. 发现 degraded 时怎么处理

- `business-cockpit` degraded：需要优先排查，可能影响整体基线。
- `operator-console/task_workbench` degraded：按 Stage48 合理降级记录，不阻塞报告包分发。
- `action-center/store_diagnostic` 或 `order_diagnostic` degraded：按 Stage48 合理降级记录，不阻塞报告包分发。
- route 非 JSON 或 HTTP 5xx：记录为 runtime 失败，单独处理。

## 8. 哪些情况需要人工补数

见：

- `handoff/WIKA_人工补数总表_STAGE48.md`
- `handoff/WIKA_人工补数字段清单_STAGE48.csv`
- `handoff/WIKA_人工接手执行说明_STAGE48.md`

## 9. 哪些情况不能继续自动推进

- 需要写侧动作。
- 需要未知 API 扫描。
- 需要把 WIKA-only 结论写成 XD 已完成。
- 需要把报告包写成完整 business cockpit。
- 需要编造广告数据、GMV、转化率、国家结构或完整经营诊断。

## 10. 推荐命令

只检查当前包：

```powershell
node WIKA/scripts/run-wika-operational-report-package-stage48.js --check-only --output-json
```

只做 dry-run：

```powershell
node WIKA/scripts/run-wika-operational-report-package-stage48.js --dry-run --output-json
```

执行验证链：

```powershell
node WIKA/scripts/validate-wika-operational-report-package-stage48.js
```
