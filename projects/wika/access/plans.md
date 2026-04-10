# Stage23：XD direct-method closure 执行计划

更新时间：2026-04-10

## 目标
- 冻结 WIKA 基线，不再重跑 WIKA 27 条已验证/已上线 route。
- 只收口 XD 剩余 5 个 direct-method gap：4 个 mydata 权限证据 + 1 个 indicator.basic 参数契约。
- 只有在明确允许时才做单次 elevated confirm；本轮未满足该条件。
- 本轮不做任何写动作，不扫描未知接口。

## 阶段拆分
1. 阶段 0：极小预检与 production base sentinel
2. 阶段 1：冻结 WIKA 基线
3. 阶段 2：4 个 mydata 方法标准权限证据闭环
4. 阶段 3：受控 elevated confirm 判断
5. 阶段 4：indicator.basic 参数契约闭环
6. 阶段 5：最小回归确认
7. 阶段 6：更新 XD / WIKA 未决队列与决策文档

## 当前进度
- 阶段 0：已完成
- 阶段 1：已完成
- 阶段 2：已完成
- 阶段 3：已完成（未执行 elevated）
- 阶段 4：已完成
- 阶段 5：已完成
- 阶段 6：已完成

## 已完成
- production base 继续维持 PASS_BASE。
- WIKA 基线已冻结，本轮未重跑 WIKA 27 条全量 replay。
- 4 个 XD mydata 方法都已完成标准权限证据闭环，当前最强结论为 `PERMISSION_GAP_CONFIRMED`。
- `alibaba.mydata.overview.indicator.basic.get` 已完成参数契约闭环：补齐 `date_range + industry` 后进入权限错误层。
- 1 个已通过的 `alibaba.seller.order.get` 已完成最小 sanity control。

## 阻塞
- `XD_ELEVATED_ALLOWED` 未设置为 `1`，因此本轮不做 elevated confirm。
- 当前剩余阻塞不再是参数缺失，而是 XD mydata 读权限缺口。

## 取消
- 未做 elevated confirm。
- 未做任何写动作。
- 未扫描未知接口。

## stage24
- 目标：只确认外部权限动作是否已生效。
- 结果：未检测到外部权限变化，且 `XD_ELEVATED_ALLOWED` 未设置为 `1`。
- 当前分类：`AWAITING_EXTERNAL_PERMISSION_ACTION`
- 本轮不重复 stage23 的 5 个 direct-method 调用。
