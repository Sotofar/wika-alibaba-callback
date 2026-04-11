# WIKA 已上线能力复用清单

## 2026-04-11 Stage 24 Deploy Lock Additions
- stage24 已 push 到 `origin/main`，目录重整、编码修复、路径修复与资产治理结果已锁定为远端基线。
- stage24 首次 push 后的统一 `502` 已收口为目录迁移导致的 runtime import 层级问题，并已完成最小只读修正。
- 经最小 production smoke 再确认，以下已上线 route 未因 stage24 回退：
  - `/health`
  - `/integrations/alibaba/auth/debug`
  - `/integrations/alibaba/wika/reports/operations/management-summary`
  - `/integrations/alibaba/wika/reports/products/management-summary`
  - `/integrations/alibaba/wika/reports/orders/management-summary`
  - `/integrations/alibaba/wika/reports/operations/minimal-diagnostic`
  - `/integrations/alibaba/wika/reports/products/minimal-diagnostic`
  - `/integrations/alibaba/wika/reports/orders/minimal-diagnostic`
  - `/integrations/alibaba/wika/tools/reply-draft`
  - `/integrations/alibaba/wika/tools/order-draft`

## 2026-04-11 Stage 27 Deploy Lock Additions
- stage27 已 push 到 `origin/main`，comparison layer 已锁定到远端基线。
- 已部署并通过 production smoke 的 comparison route：
  - `/integrations/alibaba/wika/reports/operations/comparison-summary`
  - `/integrations/alibaba/wika/reports/products/comparison-summary`
  - `/integrations/alibaba/wika/reports/orders/comparison-summary`
- 当前复用边界：
  - comparison route 只消费既有 official inputs 与既有 derived 层
  - comparison route 只输出 derived comparison，不新增 official fields
  - unavailable dimensions 继续显式保留，不把缺口伪装成已补齐

## 2026-04-11 Stage 23 Deploy Lock Additions
- stage22 已正式 push 到 `origin/main`，当前远端 main 已锁定缺口压缩结论。
- 已部署并可复用的订单 derived summary 资产：
  - `shared/data/modules/wika-order-management-summary.js`
  - `/integrations/alibaba/wika/reports/orders/management-summary`
  - 已扩展 `/integrations/alibaba/wika/reports/orders/minimal-diagnostic`
- 当前复用边界：
  - 这些 stage23 订单摘要层资产已通过 production smoke，可纳入已上线 route 清单
  - store/product 已上线 route 本轮未改动

## 2026-04-10 Stage 21 Deploy Lock Additions
- 已部署并通过 production HTTP smoke 的 management summary route：
  - `/integrations/alibaba/wika/reports/operations/management-summary`
  - `/integrations/alibaba/wika/reports/products/management-summary`
- 已部署并通过 production HTTP smoke 的 diagnostic route：
  - `/integrations/alibaba/wika/reports/operations/minimal-diagnostic`
  - `/integrations/alibaba/wika/reports/products/minimal-diagnostic`
- 当前正式复用边界：
  - store summary 只暴露已确认的 `visitor / imps / clk / clk_rate / fb / reply`
  - product summary 只暴露已确认的 `click / impression / visitor / fb / order / bookmark / compare / share / keyword_effects`
  - derived fields 与 unavailable dimensions 保持显式暴露
  - `products management summary` 继续明确 sample-based cap，不伪装成全店全量

更新时间：2026-04-10

## 2026-04-10 Stage 21 Additions
- 新增正式可复用的 management summary helper：
  - `shared/data/modules/wika-mydata-management-summary.js`
  - `shared/data/modules/wika-mydata-product-ranking.js`
- 新增正式可复用的 management summary route：
  - `/integrations/alibaba/wika/reports/operations/management-summary`
- 已扩展并继续兼容的 route：
  - `/integrations/alibaba/wika/reports/products/management-summary`
  - `/integrations/alibaba/wika/reports/operations/minimal-diagnostic`
  - `/integrations/alibaba/wika/reports/products/minimal-diagnostic`
- 当前复用边界：
  - management summary 只暴露 confirmed official fields、derived fields、unavailable dimensions 与样本边界
  - 不把 `imps` 写成 PV confirmed
  - 不把 `reply` 写成广义 response rate confirmed
  - 产品经营摘要默认带 cap，不伪装成全店全量

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
- stage24 的早停证据，也不等于权限已激活。
## 2026-04-10 Stage 20 Additions
- 正式可复用的 mydata 共享只读层：
  - `shared/data/modules/alibaba-mydata-overview.js`
  - `shared/data/modules/alibaba-mydata-product-performance.js`
- 正式可复用的 summary routes：
  - `/integrations/alibaba/wika/reports/operations/traffic-summary`
  - `/integrations/alibaba/wika/reports/products/performance-summary`
- 已扩展但保持兼容的诊断 routes：
  - `/integrations/alibaba/wika/reports/operations/minimal-diagnostic`
  - `/integrations/alibaba/wika/reports/products/minimal-diagnostic`
- 当前复用边界：
  - summary routes only expose confirmed official fields, derived fields, and unavailable dimensions
  - do not assert PV confirmed from `imps`
  - do not assert broad response-rate confirmed from `reply`
  - not full business cockpit


## 2026-04-11 Stage 22 Additions
- 已新增可复用的 stage22 缺口压缩脚本：
  - `WIKA/scripts/validate-wika-stage22-gap-compression.js`
- 当前已确认可以直接复用的订单派生链：
  - `orders/list + orders/detail + orders/fund` -> 可做保守的 `formal_summary` 聚合
  - `orders/detail.order_products` -> 可做样本级 `product_contribution` 聚合
- 当前仍不能直接复用为国家结构的部分：
  - `orders/detail.available_field_keys` 虽然出现 `shipping_address`
  - 但 current public route 仍未暴露 `shipping_address.country` / `buyer.country` 实值
- 本轮复用边界：
  - 只收口缺口，不扩 live routes
  - store/product management summary 保持 stage21 结构
  - not full business cockpit

## 2026-04-11 Stage 25 Additions
- 已新增可复用的 stage25 缺口压缩脚本：
  - `WIKA/scripts/validate-wika-stage25-gap-compression.js`
- 当前可以直接复用的 stage25 审计产物：
  - `WIKA/docs/framework/WIKA_剩余经营维度现有字段穷尽审计_第二轮.md`
  - `WIKA/docs/framework/evidence/wika-stage25-gap-compression-summary.json`
  - `WIKA/docs/framework/evidence/wika-stage25-existing-field-exhaustion.json`
  - `WIKA/docs/framework/evidence/wika-stage25-candidate-method-matrix.json`
- 本轮复用边界：
  - 只收口缺口，不扩 live routes
  - 不把 legacy seller page 证据误报成 current official mainline 已成立
  - `country_structure` 继续保持 unavailable

## 2026-04-11 Stage 28 Additions
- 已新增可复用的 unified cockpit/workbench route：
  - `/integrations/alibaba/wika/reports/business-cockpit`
  - `/integrations/alibaba/wika/workbench/product-draft-workbench`
  - `/integrations/alibaba/wika/workbench/reply-workbench`
  - `/integrations/alibaba/wika/workbench/order-workbench`
  - `/integrations/alibaba/wika/workbench/task-workbench`
- 已新增可复用的 cockpit helper：
  - `WIKA/projects/wika/data/cockpit/business-cockpit.js`
  - `WIKA/projects/wika/data/cockpit/business-cockpit-normalizers.js`
  - `WIKA/projects/wika/data/cockpit/cockpit-gaps.js`
- 已新增可复用的 workbench helper：
  - `WIKA/projects/wika/data/workbench/product-draft-workbench.js`
  - `WIKA/projects/wika/data/workbench/reply-workbench.js`
  - `WIKA/projects/wika/data/workbench/order-workbench.js`
  - `WIKA/projects/wika/data/workbench/task-workbench.js`
- 已新增可复用的 stage28 evidence：
  - `WIKA/docs/framework/evidence/wika-stage28-post-deploy-summary.json`
  - `WIKA/docs/framework/evidence/wika_business_cockpit_post_deploy.json`
  - `WIKA/docs/framework/evidence/wika_product_draft_workbench_post_deploy.json`
  - `WIKA/docs/framework/evidence/wika_reply_workbench_post_deploy.json`
  - `WIKA/docs/framework/evidence/wika_order_workbench_post_deploy.json`
  - `WIKA/docs/framework/evidence/wika_task_workbench_post_deploy.json`


