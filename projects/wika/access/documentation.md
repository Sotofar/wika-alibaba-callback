# WIKA/XD access 执行记录

更新时间：2026-04-10

## 本轮做了什么
1. 复读 stage20 / stage21 产物，确认 stage21 修复已在当前 HEAD 中。
2. 只做极短 production base smoke，确认 `/health`、`/integrations/alibaba/auth/debug`、代表性 WIKA `products/list` / `orders/list` 继续 PASS_BASE。
3. 从当前生产可读 route 中提取真实样本参数：`product_id`、数值 `id`、`cat_id`、`group_id`、`trade_id`。
4. 对 WIKA 27 条已验证/已上线 access route 做多轮最小 replay。
5. 只对 `customers/list` 做必要的参数补齐与权限探针化稳定确认。
6. 在 WIKA 闸门满足后，对 XD 历史未决 8 项做标准权限逐项确认。

## 发现了什么
### 已确认的证据
- production base 继续健康，当前不是 app-level `BLOCKED_ENV`。
- WIKA 27 条 route 全部回到接口级验证层，最终分类全部为 `RECONFIRMED`。
- `customers/list` 不是稳定客户数据入口，而是稳定的参数/权限探针 route：
  - 缺 `last_sync_end_time` 时落到参数错误
  - 补齐 sync window 后稳定落到 `InsufficientPermission`
- WIKA route 级 `orders/list` 返回的 `trade_id` 当前可直接支撑 route 级 `orders/detail` / `orders/fund` / `orders/logistics` replay，说明 stage18 的“public direct method chaining 未闭合”不再阻塞 WIKA route 层复核。
- XD 历史未决 8 项的标准权限确认结果：
  - `PASSED`：3
  - `PERMISSION_DENIED`：4
  - `PARAM_MISSING`：1

### 推断与边界
- `overview.indicator.basic.get` 在 XD 当前只得到 `PARAM_MISSING`，不能直接写成权限不足。
- XD 的 4 个 `PERMISSION_DENIED` 只适用于本轮标准权限接口级证据，不得扩写成“任务 1 / 2 已可继续推进”。
- WIKA 27 条 route 全部 `RECONFIRMED` 只代表 route 层稳定可复现，不代表任务 1 / 2 已完成。

## 证据与产物
- 结构化摘要：
  - `docs/framework/evidence/stage22-wika-replay-summary.json`
- WIKA replay 矩阵：
  - `projects/wika/access/replay_matrix.csv`
- XD 8 项矩阵：
  - `projects/xd/access/api_matrix.csv`

## 下一步为什么这样做
- 下一轮不应再重复 stage22 的 27 条 route replay。
- 如果继续，应把精力集中到剩余的 direct-method 问题：
  - XD `mydata` 权限差距
  - `overview.indicator.basic.get` 的参数契约
- 在没有新证据前，不要回到新 API 猜测或任何平台内写动作。
