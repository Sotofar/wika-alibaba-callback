# Stage22：WIKA replay 轮次摘要

更新时间：2026-04-10

## Base gate
- `/health` -> `PASS_BASE`
- `/integrations/alibaba/auth/debug` -> `PASS_BASE`
- `/integrations/alibaba/wika/data/products/list?page_size=1` -> `PASS_BASE`
- `/integrations/alibaba/wika/data/orders/list?page_size=1` -> `PASS_BASE`

## Round 1：baseline replay
- 执行对象：WIKA 27 条已验证/已上线 access route。
- 结果：26 条直接 `RECONFIRMED`，`customers/list` 在仅给最小缺参探针参数时先落到参数错误。
- 结论：route 层已回到接口级验证层，不存在 app-level blocking。

## Round 2：targeted stabilization
- 仅处理 `customers/list`。
- 修正项：按文档与现有 route 契约补齐同步窗口参数：`start_time`、`end_time`、`last_sync_end_time`。
- 结果：`customers/list` 稳定落到 `InsufficientPermission`，说明 route 本身工作正常，当前更适合作为权限探针。

## Round 3：confirm recovered / flaky
- 仅复测 `customers/list`。
- 结果：再次稳定返回同类 `permission_error`，不属于 `FLAKY`。

## 最终分类
- `RECONFIRMED`：27
- `FLAKY`：0
- `REGRESSED`：0
- `BLOCKED_ENV`：0
- 其他：0

## 边界说明
- 这轮是 WIKA route replay 稳定化，不是任务 1 完成。
- 这轮是 WIKA route replay 稳定化，不是任务 2 完成。
- 这轮不代表平台内闭环。
