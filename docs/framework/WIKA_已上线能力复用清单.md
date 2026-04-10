# WIKA 已上线能力复用清单

更新时间：2026-04-10

## 当前可直接复用的核心能力
- Railway production 认证闭环
- 官方 `/sync + access_token + sha256` 调用层
- 已上线 WIKA 只读原始路由与诊断路由
- 外部草稿工作流 SOP 层
- provider-agnostic 通知 fallback / dry-run

## stage22 / stage23 新增确认的复用结论
1. WIKA 27 条已验证/已上线 access route 可以在 production 下稳定 replay，当前全部 `RECONFIRMED`。
2. `customers/list` 当前最稳的定位是“权限探针型 route”，而不是“稳定客户数据入口”。
3. 对 WIKA route replay，应优先使用当前 `/integrations/alibaba/wika/data/orders/list` 返回的 route-level `trade_id` 作为 `orders/detail / fund / logistics` 样本。
4. stage17 direct-method 阶段里的遮罩 `trade_id` 结论，不能直接套到 stage22 的 route replay。
5. stage23 起，WIKA route 基线应冻结为已确认状态；后续若继续，不应再默认重跑 27 条全量 replay。
6. stage23 已确认：对 XD `mydata` direct-method，若标准权限下明确返回 `InsufficientPermission`，且参数已满足最小文档契约，应先写成权限缺口，而不是继续误写成纯参数问题。

## 当前已上线且 stage22 再次确认的 route 分组
- runtime：`/health`、`/integrations/alibaba/auth/debug`、`/integrations/alibaba/auth/start`、`/integrations/alibaba/callback`
- products：`products/list`、`score`、`detail`、`groups`、`schema`、`schema/render`、`schema/render/draft`
- categories：`categories/tree`、`categories/attributes`
- media：`media/list`、`media/groups`
- customers：`customers/list`
- orders：`orders/list`、`detail`、`fund`、`logistics`、`draft-types`
- reports：`products/management-summary`、`products/minimal-diagnostic`、`orders/minimal-diagnostic`、`operations/minimal-diagnostic`
- tools：`tools/reply-draft`、`tools/order-draft`

## 当前不能误报的边界
- stage22 route replay 全部 `RECONFIRMED`，不等于 task 1 完成。
- stage22 route replay 全部 `RECONFIRMED`，不等于 task 2 完成。
- XD 8 项已有接口级结论，不等于平台内闭环已完成。
- stage23 direct-method 收口完成，也不等于 mydata 权限已解决。
