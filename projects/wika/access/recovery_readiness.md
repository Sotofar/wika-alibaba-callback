# stage21 recovery readiness

更新时间：2026-04-10

## replay 重开闸门

| 条件 | 当前状态 | 证据 |
| --- | --- | --- |
| `/health` 可响应 | 是 | `200 ok` |
| 至少一个 `auth/debug` 可响应 | 是 | WIKA / XD `auth/debug` 都是 `200 JSON` |
| app 处于可服务状态 | 是 | representative WIKA/XD `products/list`、`orders/list` 都是 `200 JSON` |

## 当前是否满足 replay 重开条件
- `WIKA replay`：满足
- `XD 8 项逐项确认`：当前仍不建议直接推进

## 为什么 XD 暂不推进
- stage21 的目标是环境解阻，不是直接重跑 stage20 的全量 replay
- 按闸门顺序，应先重开 WIKA 27 条已验证 route 的最小 replay
- 只有当 WIKA replay 回到接口级验证层后，才继续 XD 那 8 项标准权限确认

## 当前缺什么
- 对 `WIKA` 27 条已验证 route 的一轮新 replay 结果
- 对 replay 后仍未通过对象的更新分类
- 对 XD 8 项是否落到 permission evidence 的重新判断

## 建议的恢复顺序
1. 先按 stage20 的清单重开 WIKA 27 条最小 replay
2. 更新 `replay_matrix.csv`、`replay_summary.md`、`unresolved_queue.md`
3. 再按未决队列顺序推进 XD 8 项标准权限验证
4. 仍然禁止高权限盲扫，除非拿到接口级 `PERMISSION_DENIED` 证据
