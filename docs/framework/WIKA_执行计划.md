# WIKA_执行计划

## 当前阶段
阶段 23：冻结 WIKA 基线，只收口 XD 剩余 5 个 direct-method gap

## 本阶段唯一目标
- 先用极小 sentinel 确认 production base 继续 PASS_BASE
- 冻结 WIKA 27 条已验证/已上线 route 为已确认基线，不再全量 replay
- 只收口 XD 剩余 5 个 direct-method gap：4 个 mydata 权限证据 + 1 个 `indicator.basic` 参数契约
- 本轮不做任何写动作，不新增任何 Alibaba API 猜测

## 起始基线
- stage21 已恢复 `/health`、WIKA/XD `auth/debug` 与代表性 list routes 的 base 可服务性
- stage22 已确认 WIKA 27 条 route 全部 `RECONFIRMED`
- stage22 已完成 XD 历史未决 8 项标准权限确认
- 当前剩余问题是 XD mydata 权限差距与 `indicator.basic` 参数契约

## 本阶段结果
- production base：`PASS_BASE`
- WIKA 27 条 route：保持 frozen baseline，本轮不重跑全量 replay
- XD 4 个 mydata 方法：已完成 `PERMISSION_GAP_CONFIRMED`
- `alibaba.mydata.overview.indicator.basic.get`：补齐 `date_range + industry` 后进入 `PERMISSION_DENIED`
- `alibaba.seller.order.get`：sanity control 继续 `PASSED`
- 本轮没有高权限补测
- 本轮没有写动作

## 如果继续的下一步
- 不再重复 stage22 route replay
- 若业务仍需要 task 1 / 2 的 mydata 能力，先申请权限
- 只有在明确允许条件下，才对 4 个 mydata 方法做单次受控 elevated confirm
- 若没有新的权限变化证据，也没有 `XD_ELEVATED_ALLOWED=1`，则 stage24 直接安全早停

## 固定边界
- 这只是 access replay 与 direct-method 标准权限确认
- 不是 task 1 complete
- 不是 task 2 complete
- 不是平台内闭环
