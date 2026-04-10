# WIKA/XD access 执行记录

更新时间：2026-04-10

## stage24
1. 复读 stage23 证据与 XD/WIKA 当前矩阵。
2. 用 `/health`、`/integrations/alibaba/auth/debug` 和 representative WIKA route 确认 production base 继续 PASS_BASE。
3. 检查 `XD_ELEVATED_ALLOWED`，结果仍未设置为 `1`。
4. 检查 repo / debug 可见信息，未发现新的外部权限变化证据。
5. 按 stage24 规则安全早停，不重复 stage23 的 5 个 direct-method 调用。

## stage24 结论
- 本轮分类：`AWAITING_EXTERNAL_PERMISSION_ACTION`
- 当前不是代码问题、不是环境问题、不是继续试参数的问题。
- 当前必须先发生外部权限动作，再进入下一轮权限激活确认。

## 本轮做了什么
1. 复读 stage22 产物，确认 WIKA 27 条 route 已全部 `RECONFIRMED`，因此本轮只做极小 sentinel smoke。
2. 用 `/health`、`/integrations/alibaba/auth/debug` 和一个 representative WIKA route 确认 production base 继续 PASS_BASE。
3. 冻结 WIKA 基线，不再重复 WIKA 27 条全量 replay。
4. 只围绕 4 个 XD mydata 方法做标准权限证据闭环。
5. 只围绕 `alibaba.mydata.overview.indicator.basic.get` 做有限、文档支持的参数组对账。
6. 用一个已通过的 `alibaba.seller.order.get` 做 sanity control。

## 已确认的证据
- WIKA frozen baseline 仍然有效；当前没有新的 app-level 阻塞。
- 以下 4 个方法在 XD 标准权限下都稳定返回 `InsufficientPermission`：
  - `alibaba.mydata.overview.date.get`
  - `alibaba.mydata.overview.industry.get`
  - `alibaba.mydata.self.product.date.get`
  - `alibaba.mydata.self.product.get`
- 对这 4 个方法，当前最强结论是：`PERMISSION_GAP_CONFIRMED`。
- `alibaba.mydata.overview.indicator.basic.get`：
  - `date_range` alone -> `MissingParameter(industry)`
  - `date_range + industry` -> `InsufficientPermission`
  - 因此当前已不再只是参数缺失，而是“补齐文档支持参数后进入权限错误层”。
- `alibaba.seller.order.get` 作为 sanity control 继续 `PASSED`，说明本轮 direct-method 收口没有重新跌回 app-level blocking。

## 推断与边界
- 本轮没有 elevated confirm，因此“更高权限是否一定能解”仍未实证；但标准权限缺口已经拿到接口级证据。
- 对 4 个 mydata 方法，当前没有 tenant / product 特有错误文案，最合理的主因仍是权限缺口，而不是样本 product_id 缺失。
- 本轮仍然不是 task 1 complete，不是 task 2 complete，也不是平台内闭环。
- 本轮没有任何写动作。

## 证据与产物
- `docs/framework/evidence/stage23-xd-direct-method-closure.json`
- `projects/xd/access/mydata_permission_matrix.csv`
- `projects/xd/access/mydata_permission_gap_stage23.md`
- `projects/xd/access/indicator_basic_contract_stage23.md`

## 下一步为什么这样做
- 如果继续，不要再重跑 WIKA 27 条 route replay。
- 如果业务确实要推进 task 1 / task 2，下一步应先决定是否申请 XD / WIKA 对应 mydata 权限，或是否在明确允许条件下做单次受控 elevated confirm。
- 若没有权限动作，就不应继续把 direct-method 问题误写成“可继续开发实现”。
