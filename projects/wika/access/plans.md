# Stage22：WIKA replay 执行计划

更新时间：2026-04-10

## 目标
- 在 production base 继续保持 PASS_BASE 的前提下，完成 WIKA 27 条已验证/已上线 access route 的多轮最小 replay。
- 只有在 WIKA replay 回到接口级验证层后，才推进 XD 历史未决 8 项的标准权限确认。
- 本轮不做任何写侧动作，不新增任何 Alibaba API 猜测或 undocumented method。

## 阶段拆分
1. 阶段 0：续跑预检与 base smoke 闸门确认
2. 阶段 0.5：轻量 deployment provenance 记录
3. 阶段 1：WIKA replay 闸门 precheck
4. 阶段 2：整理 WIKA 27 条 route 清单
5. 阶段 3：WIKA Round 1 baseline replay
6. 阶段 4：WIKA Round 2 targeted stabilization
7. 阶段 5：WIKA Round 3 confirm recovered / flaky
8. 阶段 6：更新 WIKA unresolved queue
9. 阶段 7：XD 闸门判断
10. 阶段 8：XD 历史未决 8 项标准权限确认

## 当前进度
- 阶段 0：已完成
- 阶段 0.5：已完成
- 阶段 1：已完成
- 阶段 2：已完成
- 阶段 3：已完成
- 阶段 4：已完成
- 阶段 5：已完成
- 阶段 6：已完成
- 阶段 7：已完成
- 阶段 8：已完成

## 已完成
- production base 继续维持 PASS_BASE：`/health`、`/integrations/alibaba/auth/debug`、代表性 WIKA `products/list` / `orders/list` 都返回 200 / JSON。
- 轻量 provenance 已记录为 `not_proven_but_service_healthy`。
- WIKA 27 条 route 已完成多轮最小 replay，最终全部 `RECONFIRMED`。
- XD 8 项已在标准权限下完成逐项确认。
- 所有结构化证据已写入矩阵和 JSON 摘要。

## 阻塞
- 当前没有阻止 replay 的 app-level 环境阻塞。
- 当前剩余阻塞转为接口级：XD `mydata` 仍有权限/参数契约问题。

## 取消
- 未做 XD 高权限补测。
- 未做任何写动作。
- 未新增任何新的 Alibaba API 验证。

## 停止条件
- 本轮完成后停止，不继续扩展到新的 API 候选或新的平台内动作。
