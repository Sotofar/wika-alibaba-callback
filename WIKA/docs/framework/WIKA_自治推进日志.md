# WIKA 自治推进日志

### 阶段 34 / 35：写侧边界候选矩阵与前置条件收口

- 实际起始 commit：`a8fc18fa23a27784178adaac0422461ae1ba8b59`
- 本轮新增沉淀：
  - `WIKA/projects/wika/data/write-boundary/write-boundary-candidates.js`
  - `WIKA/scripts/validate-wika-stage34-write-boundary-matrix.js`
  - `WIKA/scripts/validate-wika-stage35-write-preflight.js`
  - `WIKA/docs/framework/WIKA_阶段34_写侧边界候选矩阵.md`
  - `WIKA/docs/framework/WIKA_阶段35_写侧文档定锚与前置条件.md`
  - `WIKA/docs/framework/evidence/wika-stage34-write-boundary-matrix.json`
  - `WIKA/docs/framework/evidence/wika-stage35-write-boundary-preflight.json`
- 阶段 34 结论：
  - task3 direct candidate = 3
  - task4 direct candidate = 0
  - task5 direct candidate = 1
  - 当前 runtime-ready 候选 = 0
- 阶段 35 结论：
  - task3 -> `NO_ROLLBACK_PATH`
  - task4 -> `DOC_INSUFFICIENT`
  - task5 -> `NO_ROLLBACK_PATH`
  - 当前不进入阶段 36 / 37 / 38
- 本轮边界：
  - 不做真实写入
  - 不新增 live routes
  - 不新增 Alibaba API runtime 验证
  - task 6 excluded

### 阶段 33：当前边界下最大完成度收口

- 本轮新增沉淀：
  - `WIKA/docs/framework/WIKA_阶段33_当前边界下最大完成度总结.md`
  - `WIKA/docs/framework/evidence/wika-stage33-maximum-completion-summary.json`
- 当前收口结论：
  - task1~5 已达到当前 official mainline + safe derived + no write-side 边界下的最大完成度
  - 当前不再继续包装新消费层
  - 后续若继续，需要转向新的 official field / 契约 / 写侧边界证明 / task6 独立线程

### 阶段 31/32：统一运营控制台层（已部署）

- 实际起始 commit：`0bd08fd430fbe83f4d31cc0498d7bfbc16bb5d42`
- 阶段 31 本地候选 commit：`d7b556e5de4688dd3d57a8a0a52ab39bcf62c97d`
- push：
  - `d7b556e5de4688dd3d57a8a0a52ab39bcf62c97d -> origin/main` 成功
- 本轮新增 route：
  - `/integrations/alibaba/wika/reports/operator-console`
- 本轮新增 helper：
  - `WIKA/projects/wika/data/cockpit/operator-console.js`
- 本轮新增验证脚本：
  - `WIKA/scripts/validate-wika-stage31-operator-console.js`
- 验证结论：
  - stage31 local contract -> `PASS`
  - stage32 post-deploy smoke -> `PASS`
  - 首次 post-deploy 探测命中部署切换瞬时抖动，直接探测后确认关键 route 已恢复 `200 + JSON`，按单次重试策略后正式脚本通过
  - 新增 `/integrations/alibaba/wika/reports/operator-console` 为 `200 + JSON`
- 本轮边界：
  - operator-console 只是统一控制台层
  - 不新增 official fields
  - 不做写侧动作
  - task 6 excluded
  - 不写成 task1~5 complete

### 阶段 31：统一运营控制台层（本地候选）

- 实际起始 commit：`0bd08fd430fbe83f4d31cc0498d7bfbc16bb5d42`
- 本轮新增本地候选 route：
  - `/integrations/alibaba/wika/reports/operator-console`
- 本轮新增 helper：
  - `WIKA/projects/wika/data/cockpit/operator-console.js`
- 本轮新增验证脚本：
  - `WIKA/scripts/validate-wika-stage31-operator-console.js`
- 验证结论：
  - stage31 local contract -> `PASS`
  - no new official fields
  - no new API verification
  - no write action attempted
  - task 6 excluded
- 本轮不写成已上线，不写成 task1~5 complete。

### 阶段 29/30：行动中心与输入感知预览层（已部署）

- 实际起始 commit：`572f41f7a4f5a48760593ff9131c581b3936e4c7`
- 阶段 29 本地候选 commit：`0011bb904f677c7e6caf57a2a4fcd92053718cf1`
- push：
  - `0011bb904f677c7e6caf57a2a4fcd92053718cf1 -> origin/main` 成功
- 本轮新增 route：
  - `/integrations/alibaba/wika/reports/action-center`
  - `/integrations/alibaba/wika/workbench/product-draft-preview`
  - `/integrations/alibaba/wika/workbench/reply-preview`
  - `/integrations/alibaba/wika/workbench/order-preview`
  - `/integrations/alibaba/wika/workbench/preview-center`
- 本轮新增 helper：
  - `WIKA/projects/wika/data/cockpit/action-center.js`
  - `WIKA/projects/wika/data/workbench/product-draft-preview.js`
  - `WIKA/projects/wika/data/workbench/reply-preview.js`
  - `WIKA/projects/wika/data/workbench/order-preview.js`
  - `WIKA/projects/wika/data/workbench/preview-center.js`
- 本轮新增验证脚本：
  - `WIKA/scripts/validate-wika-stage29-action-center-and-preview.js`
- 验证结论：
  - stage29 local contract -> `PASS`
  - stage30 post-deploy smoke -> `PASS`
  - 新增 5 条 route 均为 `200 + JSON`
  - 既有 16 条核心 route 与 2 条 tools route 未回退
- 本轮边界：
  - action-center 只是统一行动消费层
  - preview 只是输入感知预览层
  - 不新增 official fields
  - 不做写侧动作
  - task 6 excluded
  - 不写成 task1~5 complete

### 阶段 28：统一经营驾驶舱与任务 1-5 工作台（本地候选）

- 实际起始 commit：`0c87585268b20231b1fb6b6724f499beaa278f67`
- 本轮先完成线上基线回归：
  - `/health` -> `200`
  - `/integrations/alibaba/auth/debug` -> `200`
  - `operations/products/orders management-summary` -> `200`
  - `operations/products/orders comparison-summary` -> `200`
- 本轮新增本地候选 route：
  - `/integrations/alibaba/wika/reports/business-cockpit`
  - `/integrations/alibaba/wika/workbench/product-draft-workbench`
  - `/integrations/alibaba/wika/workbench/reply-workbench`
  - `/integrations/alibaba/wika/workbench/order-workbench`
  - `/integrations/alibaba/wika/workbench/task-workbench`
- 本轮新增 helper：
  - `WIKA/projects/wika/data/cockpit/business-cockpit.js`
  - `WIKA/projects/wika/data/cockpit/business-cockpit-normalizers.js`
  - `WIKA/projects/wika/data/cockpit/cockpit-gaps.js`
  - `WIKA/projects/wika/data/workbench/product-draft-workbench.js`
  - `WIKA/projects/wika/data/workbench/reply-workbench.js`
  - `WIKA/projects/wika/data/workbench/order-workbench.js`
  - `WIKA/projects/wika/data/workbench/task-workbench.js`
- 本轮新增验证脚本：
  - `WIKA/scripts/validate-wika-stage28-cockpit-and-workbench.js`
- 验证结论：
  - stage28 local contract -> `PASS`
  - no new official fields
  - no new API verification
  - no write action attempted
  - task 6 excluded
- 本轮不写成已上线，不写成 task1~5 complete。

### 阶段 26：官方文档定锚与验证前置包

- 实际起始 commit：`c4e8848b89eeb71dad04899342c63b1ccf0436ed`
- 本轮先完成：
  - `git push origin main`
- push：
  - `c4e8848b89eeb71dad04899342c63b1ccf0436ed -> origin/main` 成功
- stage24 最小线上基线确认：
  - `/health` -> `200`
  - `/integrations/alibaba/auth/debug` -> `200 + JSON`
  - `/integrations/alibaba/wika/reports/operations/management-summary` -> `200 + JSON`
  - `/integrations/alibaba/wika/reports/products/management-summary` -> `200 + JSON`
  - `/integrations/alibaba/wika/reports/orders/management-summary` -> `200 + JSON`
- 本轮新增沉淀：
  - `WIKA/scripts/validate-wika-stage26-doc-anchoring.js`
  - `WIKA/docs/framework/WIKA_阶段26_剩余缺口官方文档定锚.md`
  - `WIKA/docs/framework/evidence/wika-stage26-doc-anchoring-summary.json`
  - `WIKA/docs/framework/evidence/wika-stage26-direct-candidate-matrix.json`
- 本轮 direct candidate 结论：
  - 当前 direct candidate：无
  - 当前只把既有背景候选补到 official doc URL，可达但不具备安全 runtime 前置条件
- 已补到官方 URL 的背景候选：
  - `alibaba.seller.trade.decode`
  - `alibaba.mydata.self.keyword.date.get`
  - `alibaba.mydata.self.keyword.effect.week.get`
  - `alibaba.mydata.self.keyword.effect.month.get`
- 本轮收口：
  - 本轮不进入 runtime 验证
  - 本轮不扩 live routes
  - 本轮没有新增真实字段
  - 当前仍不是 task 1 complete
  - 当前仍不是 task 2 complete
  - 当前仍不是完整经营驾驶舱

### 阶段 24：stage24 远端基线锁定

- 起始 commit：`a41c044797e27b48dc132edbe63b0849b5b6ea57`
- 本阶段目标：
  - push stage24 本地候选提交链
  - 以最小 production smoke 验证目录重整、编码修复、路径修复没有破坏现有 WIKA 线上能力
- push：
  - `a41c044797e27b48dc132edbe63b0849b5b6ea57 -> origin/main` 成功
  - `a2f1f8f9ced7afafc12d1accaf67dcc59e88ca25 -> origin/main` 成功
- 本阶段唯一运行时修正：
  - stage24 首次 push 后出现统一 `502`
  - 根因收口为 `WIKA/projects/wika/data/**` 指向 root `shared/` 的相对 import 少一层
  - 已做最小只读安全修正并重新部署
- production smoke 结果：
  - `/health` -> `200`
  - `/integrations/alibaba/auth/debug` -> `200 + JSON`
  - `/integrations/alibaba/wika/reports/operations/management-summary` -> `200 + JSON + PASS`
  - `/integrations/alibaba/wika/reports/products/management-summary` -> `200 + JSON + PASS`
  - `/integrations/alibaba/wika/reports/orders/management-summary` -> `200 + JSON + PASS`
  - `/integrations/alibaba/wika/reports/operations/minimal-diagnostic` -> `200 + JSON + PASS`
  - `/integrations/alibaba/wika/reports/products/minimal-diagnostic` -> `200 + JSON + PASS`
  - `/integrations/alibaba/wika/reports/orders/minimal-diagnostic` -> `200 + JSON + PASS`
  - `/integrations/alibaba/wika/tools/reply-draft` -> `200 + JSON + PASS`
  - `/integrations/alibaba/wika/tools/order-draft` -> `200 + JSON + PASS`
- 本阶段新增沉淀：
  - `WIKA/docs/framework/evidence/wika-stage24-post-deploy-summary.json`
- 本阶段收口：
  - stage24 已 push 并完成最小 post-deploy 验证
  - WIKA/XD 目录边界已作为远端基线固定
  - 当前仍不是 task 1 complete
  - 当前仍不是 task 2 complete
  - 当前仍不是完整经营驾驶舱
  - 本阶段没有任何写动作

### 阶段 23：WIKA 订单经营摘要层与订单诊断扩展

- 起始 commit：`19f55e9e99a5fa5b9383c8375c86c16b7fb14b05`
- 本阶段先完成：
  - `git push origin 19f55e9e99a5fa5b9383c8375c86c16b7fb14b05:refs/heads/main`
- 本阶段只做两件事：
  - 把 stage22 已确认可保守派生的 `formal_summary / product_contribution` 沉淀成订单经营摘要层
  - 扩展 `/integrations/alibaba/wika/reports/orders/minimal-diagnostic` 正式消费这些 derived 结果
- 新增 / 更新沉淀：
  - `shared/data/modules/wika-order-management-summary.js`
  - `shared/data/modules/wika-minimal-diagnostic.js`
  - `app.js`
  - `WIKA/scripts/validate-wika-order-management-summary.js`
  - `WIKA/docs/framework/WIKA_订单经营派生契约.md`
  - `WIKA/docs/framework/WIKA_订单经营摘要层.md`
  - `WIKA/docs/framework/evidence/wika-order-management-summary-layer-summary.json`
  - `WIKA/docs/framework/evidence/wika_orders_management_summary.json`
  - `WIKA/docs/framework/evidence/wika_orders_minimal_diagnostic_extended.json`
- 本地 contract 验证结果：
  - `orders_management_summary -> PASS_LOCAL_CONTRACT`
  - `orders_minimal_diagnostic -> PASS_LOCAL_CONTRACT`
- push：
  - `537ba3877e357c2e38fea986ad386d7a521e82d6 -> origin/main` 成功
- production smoke 结果：
  - `/integrations/alibaba/wika/reports/operations/management-summary` -> `200 + JSON + PASS`
  - `/integrations/alibaba/wika/reports/products/management-summary` -> `200 + JSON + PASS`
  - `/integrations/alibaba/wika/reports/orders/management-summary` -> `200 + JSON + PASS`
  - `/integrations/alibaba/wika/reports/operations/minimal-diagnostic` -> `200 + JSON + PASS`
  - `/integrations/alibaba/wika/reports/products/minimal-diagnostic` -> `200 + JSON + PASS`
  - `/integrations/alibaba/wika/reports/orders/minimal-diagnostic` -> `200 + JSON + PASS`
- 当前收口：
  - `formal_summary` 已在本地 summary 层成立
  - `product_contribution` 已在本地 summary 层成立
  - `country_structure` 继续 unavailable
  - 本阶段没有修改 store/product live routes
  - 本阶段没有任何写动作
  - 本阶段已完成 deploy lock

### 阶段 21 收口二：隔离工作树部署验证与正式基线锁定

- 原始工作区 `HEAD`：`4814b97fa3dbd32b81d603eaf063a9f19dfaf76b`
- 原始工作区存在大量未跟踪污染项，因此本阶段没有在原始工作区执行 push 或开发
- 已创建隔离工作树：
  - `D:\Code\阿里国际站__stage21_deploy`
- 已在隔离工作树中执行：
  - `git push origin 4814b97fa3dbd32b81d603eaf063a9f19dfaf76b:refs/heads/main`
- production HTTP smoke 结果：
  - `/integrations/alibaba/wika/reports/operations/management-summary` -> `200 + JSON`
  - `/integrations/alibaba/wika/reports/products/management-summary` -> `200 + JSON`
  - `/integrations/alibaba/wika/reports/operations/minimal-diagnostic` -> `200 + JSON`
  - `/integrations/alibaba/wika/reports/products/minimal-diagnostic` -> `200 + JSON`
- 已在线确认：
  - management summary 层已部署生效
  - minimal diagnostic 的解释/消费层已部署生效
  - `products management summary` 继续显式暴露 sample-based 边界：
    - `product_scope_basis=sample_from_products_list`
    - `product_scope_limit=5`
    - `product_scope_truncated=true`
    - `product_ids_used_count=5`
- 本阶段新增沉淀：
  - `WIKA/scripts/validate-wika-stage21-post-deploy.js`
  - `WIKA/docs/framework/evidence/wika-stage21-post-deploy-summary.json`
  - `WIKA/docs/framework/evidence/wika_operations_management_summary_post_deploy.json`
  - `WIKA/docs/framework/evidence/wika_products_management_summary_post_deploy.json`
  - `WIKA/docs/framework/evidence/wika_operations_minimal_diagnostic_post_deploy.json`
  - `WIKA/docs/framework/evidence/wika_products_minimal_diagnostic_post_deploy.json`
- 本阶段收口：
  - stage21 已部署并 smoke 通过
  - 当前仍不是 task 1 complete
  - 当前仍不是 task 2 complete
  - 当前仍不是完整经营驾驶舱
  - 本阶段没有任何写动作

## 2026-04-10

### 阶段 21：WIKA 经营管理摘要层与诊断消费层

- 起始 commit：`6239d2a81203ebbe86a7cc111f2ee4db3dd0213e`
- 本阶段目标：
  - 先固化 `AGENTS.md` 中文输出规则
  - 在 stage20 已落地的 mydata 正式只读层之上，新增经营管理摘要共享层
  - 新增 operations management summary route
  - 扩展既有 products management summary route 与 minimal diagnostic 消费解释层
- 新增共享 helper：
  - `shared/data/modules/wika-mydata-management-summary.js`
  - `shared/data/modules/wika-mydata-product-ranking.js`
- 新增或更新正式路由：
  - `/integrations/alibaba/wika/reports/operations/management-summary`
  - `/integrations/alibaba/wika/reports/products/management-summary`
  - `/integrations/alibaba/wika/reports/operations/minimal-diagnostic`
  - `/integrations/alibaba/wika/reports/products/minimal-diagnostic`
- 验证结果：
  - `operations_management_summary` -> `PASS_LIVE_HELPER_CONTRACT`
  - `products_management_summary` -> `PASS_LIVE_HELPER_CONTRACT`
  - `operations_minimal_diagnostic` stage21 extension -> `PASS_LIVE_HELPER_CONTRACT`
  - `products_minimal_diagnostic` stage21 extension -> `PASS_LIVE_HELPER_CONTRACT`
- 本阶段关键收口：
  - 当前已把 official fields / derived fields / unavailable dimensions 固定进业务可消费层
  - 当前已把产品范围 / 采样边界显式暴露为 `product_scope_limit / product_scope_truncated / product_ids_used_count`
  - 当前仍然不是完整经营驾驶舱
  - 本阶段没有新增 Alibaba API 探索
  - 本阶段没有推进 XD
  - 本阶段没有任何写动作

## 2026-04-04

### 阶段 1：任务 1/2 的数据入口验证与最小原始路由化

- 起始 checkpoint：`4d27e66`
- 收口结论：
  - `alibaba.mydata.overview.indicator.basic.get` -> 权限错误 `InsufficientPermission`
  - `alibaba.mydata.self.product.get` -> 最终权限错误 `InsufficientPermission`
  - `alibaba.mydata.self.product.date.get` -> 权限错误
  - `alibaba.mydata.overview.date.get` -> 权限错误
  - `alibaba.mydata.overview.industry.get` -> 权限错误
- 结果：
  - 数据管家这组接口不再作为当前主线推进
  - 不进入最小正式原始路由候选池
- 结束 checkpoint：`e50a087`

### 阶段 2：写侧安全底座 + 产品上新入口验证

- 起始 checkpoint：`f3bd86a`
- 新增能力：
  - `shared/data/modules/alibaba-write-guardrails.js`
  - `WIKA/docs/framework/WIKA_人工接管规则.md`
  - `WIKA/docs/framework/WIKA_人工接管告警样例.json`
  - `shared/data/modules/alibaba-product-drafts.js`
  - `WIKA/docs/framework/WIKA_产品草稿链路样例.json`
- 真实生产分类结果：
  - `alibaba.icbu.category.get.new` -> 真实 JSON
  - `alibaba.icbu.category.attr.get` -> 真实 JSON
  - `alibaba.icbu.category.attribute.get` -> 真实 JSON
  - `alibaba.icbu.photobank.upload` -> 业务参数错误（已过授权层）
  - `alibaba.icbu.product.add` -> 业务参数错误（已过授权层）
  - `alibaba.icbu.product.schema.add` -> 业务参数错误（已过授权层）
  - `alibaba.icbu.product.update` -> 业务参数错误（已过授权层）
  - `alibaba.icbu.product.schema.update` -> 业务参数错误（已过授权层）
  - `alibaba.icbu.product.update.field` -> 业务参数错误（已过授权层）
- 新增正式原始路由：
  - `/integrations/alibaba/wika/data/categories/tree`
  - `/integrations/alibaba/wika/data/categories/attributes`
- 阶段收口：
  - 类目与属性进入可复用正式原始路由层
  - photobank / add / update 家族只到授权层与参数层，不能误报为产品上新已完成
- 结束 checkpoint：`6850a05`

### 阶段 3：任务 3 的安全草稿模式补强

- 起始 checkpoint：`47c5eec`
- 真实生产分类结果：
  - `alibaba.icbu.product.schema.get` -> 真实 JSON
  - `alibaba.icbu.product.schema.render` -> 真实 JSON
  - `alibaba.icbu.product.add.draft` -> 业务参数错误（已过授权层）
- 新增正式原始路由：
  - `/integrations/alibaba/wika/data/products/schema`
  - `/integrations/alibaba/wika/data/products/schema/render`
- 新增沉淀：
  - `shared/data/modules/alibaba-official-product-schema.js`
  - `WIKA/scripts/validate-wika-write-phase3.js`
  - `WIKA/docs/framework/WIKA_产品安全草稿链路说明.md`
- 阶段收口：
  - schema 与 render 已进入正式原始路由层
  - 草稿链路已经推进到 schema-aware 模式
  - `add.draft` 仍不能误写为安全草稿模式已成立
- 结束 checkpoint：`a716214`

### 阶段 4：任务 3 的低风险写侧边界验证

- 起始 checkpoint：`f71c984`
- 本阶段只做两件事：
  - 判断 `alibaba.icbu.photobank.upload` 是否存在足够低风险的测试/草稿边界
  - 判断 `alibaba.icbu.product.add.draft` 是否存在足够低风险的草稿边界
- 真实收口结论：
  - `alibaba.icbu.photobank.upload`
    - 当前分类：`当前无法证明低风险边界，因此不继续实写验证`
    - 理由：成功响应会创建真实素材库资产；当前缺少可稳定证明“可清理、可隔离、可回滚”的边界证据
  - `alibaba.icbu.product.add.draft`
    - 当前分类：`当前无法证明低风险边界，因此不继续实写验证`
    - 理由：成功响应会创建真实 draft 对象；当前缺少可稳定证明“非发布、非公开、可清理”的边界证据
- 新增沉淀：
  - `WIKA/docs/framework/WIKA_低风险写侧边界验证.md`
  - `WIKA/scripts/validate-wika-write-phase4.js`
  - `shared/data/modules/alibaba-write-guardrails.js` 阶段 4 边界对象
  - `shared/data/modules/alibaba-product-drafts.js` 阶段 4 阻塞字段与边界输出
  - `WIKA/docs/framework/WIKA_产品安全草稿链路说明.md` 阶段 4 更新
  - `WIKA/docs/framework/WIKA_产品草稿链路样例.json` 阶段 4 增强样例
- 阶段收口：
  - photobank 与 add.draft 都不进入真实写验证
  - 当前草稿链路进一步增强，但仍停留在“schema-aware 低风险准备层”
  - 不允许把本阶段结果误写为“产品上新闭环已完成”
- 结束 checkpoint：`c133060`

### 阶段 5：任务 3 的可观测 / 可回滚证据验证

- 起始 checkpoint：`79ac95f`
- 本阶段只做两件事：
  - 判断 media 侧是否已经具备可观测、可隔离、可管理证据
  - 判断 draft 侧是否已经具备可观测、可区分、可审计证据
- 新增正式原始路由：
  - `/integrations/alibaba/wika/data/media/list`
  - `/integrations/alibaba/wika/data/media/groups`
  - `/integrations/alibaba/wika/data/products/schema/render/draft`
- 真实生产分类结果：
  - `alibaba.icbu.photobank.list` -> 真实 JSON
  - `alibaba.icbu.photobank.group.list` -> 真实 JSON
  - `alibaba.icbu.product.schema.render.draft` -> 真实 JSON（`biz_success=false`，`Record does not exist`）
- 阶段收口：
  - media 侧已经证明素材可观测，且存在分组查询通道
  - draft 侧已经证明存在专门的 draft 渲染通道，且 live product 与 draft object 可区分
  - 但当前仍不能证明 media/upload 与 add.draft 具备可隔离、可清理、可回滚的低风险边界
  - 因此当前仍不具备进入“最小真实写入验证”的前置条件
- 新增沉淀：
  - `shared/data/modules/alibaba-official-media.js`
  - `WIKA/scripts/validate-wika-write-phase5.js`
  - `WIKA/docs/framework/WIKA_可观测可回滚证据验证.md`
  - `WIKA/docs/framework/WIKA_产品安全草稿链路说明.md` 阶段 5 更新
  - `WIKA/docs/framework/WIKA_产品草稿链路样例.json` 阶段 5 增强样例
- 结束 checkpoint：`90f6a74`

### 阶段 6：任务 3 的管理 / 清理 / 回滚证据补齐

- 起始 checkpoint：`2c2b1f8`
- 本阶段目标：
  - 继续只验证官方明确存在的 media 管理 / 清理接口
  - 继续只验证官方明确存在的 draft 查询 / 删除 / 管理接口
  - 不进入真实上传、真实 draft 创建或真实发布
- media 侧真实生产分类结果：
  - `alibaba.icbu.photobank.group.operate`
    - 已真实走到 `/sync + access_token + sha256`
    - 当前真实分类：`业务参数错误（说明已过授权层）`
    - 当前收口：`当前仍无法证明可隔离 / 可清理 / 可回滚边界，因此不继续实写验证`
- draft 侧真实收口结果：
  - 当前公开官方文档中，除已验证的 `alibaba.icbu.product.schema.render.draft` 外，没有再识别到明确的 draft 查询 / 删除 / 管理接口
  - `alibaba.icbu.product.schema.add.draft` 虽在官方变动说明中被提及，但它属于“草稿发布成正式”的写侧，不纳入本阶段的 query/delete/manage 主线
- 本阶段新增 / 更新沉淀：
  - `AGENTS.md`
  - `WIKA/docs/framework/WIKA_项目基线.md`
  - `WIKA/docs/framework/WIKA_执行计划.md`
  - `WIKA/docs/framework/WIKA_可观测可回滚证据验证.md`
  - `WIKA/docs/framework/WIKA_低风险写侧边界验证.md`
  - `WIKA/docs/framework/WIKA_产品安全草稿链路说明.md`
  - `WIKA/docs/framework/WIKA_产品草稿链路样例.json`
  - `WIKA/docs/framework/WIKA_面向6项任务_API缺口矩阵.md`
  - `WIKA/docs/framework/WIKA_已上线能力复用清单.md`
  - `WIKA/docs/framework/WIKA_下一批必须验证的API候选池.md`
  - `WIKA/scripts/validate-wika-write-phase6.js`
  - `shared/data/modules/alibaba-write-guardrails.js`
- 阶段收口：
  - media 侧新增了“分组管理接口可到授权层之后”的证据
  - draft 侧没有新增的 query/delete/manage 官方入口
- 当前仍不具备进入“最小真实写入验证”的前置条件
- 本阶段不新增正式原始路由
- 结束 checkpoint：`53ea9ca`

## 2026-04-05

### 阶段 7：任务 4 的读侧入口筛查与最小原始路由候选验证

- 起始 checkpoint：`a742cca`
- 本阶段只做两件事：
  - 先验证 `customers` 家族在当前 production 闭环下是否能形成最小正式原始路由候选
  - 只有在官方文档明确出现时，才判断 inquiry / message 的读侧方法是否值得进入验证
- customers 家族真实生产分类结果：
  - `alibaba.seller.customer.batch.get`
    - 已真实走到 `/sync + access_token + sha256`
    - 缺参时：`业务参数错误（说明已过授权层）`
    - 使用真实窗口参数时：`权限错误`
  - `alibaba.seller.customer.get`
    - 已真实走到 `/sync + access_token + sha256`
    - 当前：`业务参数错误（说明已过授权层）`
    - 缺少参数：`buyer_member_seq`
  - `alibaba.seller.customer.note.query`
    - 已真实走到 `/sync + access_token + sha256`
    - 当前：`业务参数错误（说明已过授权层）`
    - 缺少参数：`note_id`
  - `alibaba.seller.customer.note.get`
    - 已真实走到 `/sync + access_token + sha256`
    - 当前：`业务参数错误（说明已过授权层）`
    - 缺少参数：`page_num / page_size / customer_id`
- inquiry / message 读侧收口：
  - 当前官方文档里没有识别到明确的 list/detail 读侧方法名
  - 已明确排除 `alibaba.inquiry.cards.send` 及一切 send/reply/write/create 方法
- 新增正式只读路由：
  - `/integrations/alibaba/wika/data/customers/list`
- 阶段收口：
  - customers 家族已经证明可进入 current production 认证闭环
  - `customers/list` 已作为权限探针型最小只读路由上线
  - 当前不能误写成 customers 已稳定可读，更不能误写成 inquiry/message 已打通
  - 若继续任务 4，只应在“拿到真实 id”或“官方文档出现明确 inquiry/message 读侧方法”这两种条件下继续前进
- 线上验收：
  - `/integrations/alibaba/wika/data/customers/list` 缺参 -> `400 + parameter_error`
  - `/integrations/alibaba/wika/data/customers/list?customer_id_begin=0&page_size=1&start_time=...&end_time=...&last_sync_end_time=...` -> `502 + permission_error`
- 结束 checkpoint：`6429e86`
- push：待本阶段收口后执行

### 阶段 8：任务 6 的正式通知闭环

- 起始 checkpoint：`5886557`
- 本阶段目标：
  - 先盘点仓库与 production 变量名里是否已有可复用通知链路
  - 若无，则落地 provider-agnostic notifier + outbox fallback
  - 用至少 2 个真实阻塞场景验证“触发 -> 生成 -> 分发或落盘”的完整链路
- 通知能力盘点结论：
  - 当前仓库没有现成邮件 / webhook 依赖
  - `.env.example` 原先没有通知配置约定
  - 通过 Railway GraphQL token 读取 production 变量名后，没有发现现成通知 provider 痕迹
  - 最终收口：`当前无正式通知依赖，需先落地 provider-agnostic 通知模块 + fallback`
- 新增能力：
  - `shared/data/modules/wika-alerts.js`
  - `shared/data/modules/wika-notifier.js`
  - `WIKA/scripts/validate-wika-notification-phase8.js`
  - `WIKA/docs/framework/WIKA_通知能力盘点.md`
  - `WIKA/docs/framework/WIKA_正式通知闭环说明.md`
  - `WIKA/docs/framework/WIKA_正式通知样例.json`
- 最小闭环测试结果：
  - 权限阻塞场景：
    - `alibaba.mydata.overview.indicator.basic.get`
    - 成功生成结构化告警，并落盘到 `data/alerts/outbox`
  - 无官方明确入口场景：
    - `inquiries / messages`
    - 成功生成结构化告警，并落盘到 `data/alerts/outbox`
  - 当前 notifier 模式：
    - `outbox`
  - 当前闭环状态：
    - 最小正式通知闭环已成立
    - 真实邮件 / webhook 外发仍未接通
- 阶段收口：
  - 当前不再停留在“只有 json 样例”的状态
  - 当前已经具备 provider-agnostic 正式通知模块，以及在无 provider 时的可审计 fallback
  - 当前不能误写成“邮件已发出”或“外部通知已送达”
- 结束 checkpoint：`1abe8f8`
- push：`origin/main` 成功

### 阶段 9：任务 2 的最小经营诊断层（基于现有真实数据）

- 起始 checkpoint：`cd616c3`
- 本阶段只做一件事：
  - 不验证任何新 API，只复用当前已经上线并已线上验证的 WIKA 真实读侧能力，形成最小经营诊断层
- 新增能力：
  - `/integrations/alibaba/wika/reports/operations/minimal-diagnostic`
- 新增沉淀：
  - `shared/data/modules/wika-minimal-diagnostic.js`
  - `WIKA/scripts/validate-wika-diagnostic-phase9.js`
  - `WIKA/docs/framework/WIKA_最小经营诊断口径.md`
  - `WIKA/docs/framework/WIKA_最小经营诊断说明.md`
  - `WIKA/docs/framework/WIKA_最小经营诊断样例.json`
- 当前真实样例口径：
  - 产品快照样本：12
  - 产品质量分样本：8
  - 产品详情样本：8
  - 订单快照样本：8
  - 订单资金样本：5
  - 订单物流样本：5
- 当前可形成的最小诊断：
  - 产品质量分概况
  - boutique_tag 覆盖
  - 内容完整度问题
  - 分组 / 类目结构提示
  - 订单物流状态摘要
  - 资金字段可见信号
- 当前明确缺口：
  - UV / PV / 曝光 / 点击 / CTR
  - 流量来源 / 国家来源 / 询盘表现
  - 完整订单经营趋势 / 国家结构 / 产品贡献
- 阶段收口：
  - 当前最小经营诊断层已成立
  - 但它不是完整经营驾驶舱
  - 后续若继续任务 2，应优先扩既有诊断口径，而不是回头追已收口的 mydata 路线

### 阶段 10：任务 5 的正式订单入口边界验证

- 起始 checkpoint：`208841f`
- 本阶段目标：
  - 只验证官方明确存在的订单创建相关入口
  - 只判断是否存在“安全草稿 / 参数验证 / 授权验证 / 低风险预检查”边界
  - 不做真实订单创建
- 官方清点结果：
  - 直接相关方法：
    - `alibaba.trade.order.create`
    - `alibaba.seller.trade.query.drafttype`
  - 同目录存在但不纳入本阶段低风险主线：
    - `alibaba.trade.order.modify`
    - `alibaba.intention.order.save`
  - 当前没有再识别到明确的 `precheck / cancel / status / draft query` 同家族低风险方法
- 真实生产分类结果：
  - `alibaba.seller.trade.query.drafttype`
    - 已真实走到 `/sync + access_token + sha256`
    - 返回 `真实 JSON 样本数据`
    - 当前真实样本：`types=["TA"]`
  - `alibaba.trade.order.create`
    - 已真实走到 `/sync + access_token + sha256`
    - 尝试 1：`param_order_create = {}` -> `MissingParameter(product_list)`
    - 尝试 2：`param_order_create = { product_list: [] }` -> `MissingParameter(currency)`
    - 当前分类：`业务参数错误（说明已过授权层）`
- 新增正式只读路由：
  - `/integrations/alibaba/wika/data/orders/draft-types`
- 线上验收：
  - `/integrations/alibaba/wika/data/orders/draft-types` -> `200 + 真实 JSON`
  - 当前真实样本：`types=["TA"]`
- 新增沉淀：
  - `shared/data/modules/alibaba-official-order-entry.js`
  - `shared/data/modules/alibaba-order-drafts.js`
  - `WIKA/scripts/validate-wika-order-entry-phase10.js`
  - `WIKA/docs/framework/WIKA_订单入口候选清单.md`
  - `WIKA/docs/framework/WIKA_订单草稿链路说明.md`
  - `WIKA/docs/framework/WIKA_订单草稿样例.json`
- 阶段收口：
  - `draft-types` 已可作为正式只读权限探针复用
  - `order.create` 当前只证明到参数/授权边界，仍不能证明存在安全创单边界
- 当前任务 5 只能先做“外部订单草稿”，不能误写成“平台内订单已起草成功”
- 结束 checkpoint：`03a937c`
- push：`origin/main` 成功

### 阶段 11：任务 2 的产品/订单子诊断拆分

- 起始 checkpoint：`600c45b`
- 本阶段只做一件事：
  - 不验证任何新 API，只复用现有真实读侧能力，把总的最小经营诊断拆成 products/orders 两个子报告
- 新增正式只读路由：
  - `/integrations/alibaba/wika/reports/products/minimal-diagnostic`
  - `/integrations/alibaba/wika/reports/orders/minimal-diagnostic`
- 新增沉淀：
  - `shared/data/modules/wika-minimal-diagnostic.js` 阶段 11 拆分与复用逻辑
  - `WIKA/scripts/validate-wika-diagnostic-phase11.js`
  - `WIKA/docs/framework/WIKA_产品子诊断说明.md`
  - `WIKA/docs/framework/WIKA_产品子诊断样例.json`
  - `WIKA/docs/framework/WIKA_订单子诊断说明.md`
  - `WIKA/docs/framework/WIKA_订单子诊断样例.json`
- 线上验收：
  - `/integrations/alibaba/wika/reports/products/minimal-diagnostic` -> `200 + 真实 JSON`
  - `/integrations/alibaba/wika/reports/orders/minimal-diagnostic` -> `200 + 真实 JSON`
  - `/integrations/alibaba/wika/reports/operations/minimal-diagnostic` 兼容性保持正常
- 当前样例口径：
  - 产品子诊断样本：`product_snapshot_count=12, product_score_count=8, product_detail_count=8`
  - 订单子诊断样本：`order_snapshot_count=8, order_fund_count=5, order_logistics_count=5`
- 阶段收口：
  - 当前最小经营诊断已经拆成“总报告 + 产品子诊断 + 订单子诊断”
  - 当前仍不能误写成“完整经营驾驶舱已完成”
- 结束 checkpoint：本阶段收口提交已完成
- push：`origin/main` 成功

### 阶段 12：任务 6 的真实 provider 预接线与 dry-run 验证

- 起始 checkpoint：`155423d`
- 本阶段目标：
  - 不再碰 Alibaba 新 API
  - 只把现有 provider-agnostic notifier 升级成可接真实 provider 的结构
  - 完成 `none / 配置不完整 / dry-run` 三类验证
- notifier 结构调整：
  - `shared/data/modules/wika-notifier.js`
    - 明确负责 provider 选择、配置检查、fallback 落盘
  - `shared/data/modules/wika-notifier-webhook.js`
    - 新增 webhook 适配层
  - `shared/data/modules/wika-notifier-resend.js`
    - 新增 Resend 适配层
- dry-run / fallback 验证结果：
  - `provider=none`
    - 成功走到 `outbox fallback`
  - `provider=webhook` 且配置不完整
    - 明确返回 `provider_configuration_error`
    - 同时成功走到 `outbox fallback`
  - `provider=webhook` 且 `dry_run=true`
    - 成功生成 provider dry-run 记录
    - 未做真实外发
  - `provider=resend` 且 `dry_run=true`
    - 成功生成 provider dry-run 记录
    - 未做真实外发
- 新增沉淀：
  - `WIKA/scripts/validate-wika-notification-phase12.js`
  - `WIKA/docs/framework/WIKA_通知能力盘点.md`
  - `WIKA/docs/framework/WIKA_正式通知闭环说明.md`
  - `WIKA/docs/framework/WIKA_正式通知样例.json`
  - `.env.example`
- 阶段收口：
  - 当前已证明真实 provider 预接线成立
  - 当前仍不能误写成真实邮件或 webhook 已送达
  - 若继续任务 6，下一步只能在 production 配置真实 provider 后做一次最小真实外发验证
- 结束 checkpoint：`7838ef6`
- push：`origin/main` 成功

### 阶段 13：任务 6 的真实 provider 最小真实外发验证

- 起始 checkpoint：`c813d6c`
- 本阶段目标：
  - 不再碰 Alibaba 新 API
  - 只验证当前已预接线的真实 provider 是否具备最小真实外发条件
  - 若缺配置或缺可控目标，则及时停止
- 当前真实检查结果：
  - 当前 shell 环境中的 `WIKA_NOTIFY_*` 均未配置
  - Railway production 中的 `WIKA_NOTIFY_*` 变量也不存在
  - 因此当前没有完整 provider 配置
  - 同时也无法证明存在明显可控、低风险、用于测试的真实 destination
- 阶段收口：
  - 本阶段没有做真实 webhook 外发
  - 本阶段没有做真实 Resend 邮件发送
  - 当前只能确认：
    - provider 代码已接好
    - dry-run 已成立
    - fallback 已成立
  - 但当前不能误写成“真实通知已送达”
- 结束 checkpoint：`97a1943`
- push：`origin/main` 成功

### 阶段 14：任务 4/5 的外部草稿工作流层

- 起始 checkpoint：`42e039e`
- 本阶段只做一件事：
  - 不再验证新 Alibaba API，也不再推进平台内读写
  - 只基于现有真实读侧、诊断层、草稿 helper、alerts/notifier，形成“外部草稿工作流层”
- 新增工具路由：
  - `/integrations/alibaba/wika/tools/reply-draft`
  - `/integrations/alibaba/wika/tools/order-draft`
- 新增沉淀：
  - `shared/data/modules/alibaba-external-reply-drafts.js`
  - `shared/data/modules/alibaba-order-drafts.js`（增强）
  - `WIKA/scripts/validate-wika-workflow-phase14.js`
  - `WIKA/docs/framework/WIKA_外部草稿工作流说明.md`
  - `WIKA/docs/framework/WIKA_外部回复草稿样例.json`
  - `WIKA/docs/framework/WIKA_外部订单草稿样例.json`
- 工作流能力结果：
  - 回复草稿可输出：
    - `subject / opening / body / closing`
    - 价格 blocker
    - 交期 blocker
    - `mockup_request / visual_requirements / asset_requirements`
    - `risk_flags / escalation_recommendation`
    - 与现有 alerts 兼容的结构化 `alert_payload`
  - 订单草稿包可输出：
    - 买家摘要
    - line items
    - 价格 / 交期 / 物流 / 付款占位
    - `manual_required_fields`
    - `reasons_cannot_submit`
    - `handoff`
    - 与现有 alerts 兼容的结构化 `alert_payload`
- 线上验收：
  - `POST /integrations/alibaba/wika/tools/reply-draft` -> `200 + 真实 JSON`
  - `POST /integrations/alibaba/wika/tools/order-draft` -> `200 + 真实 JSON`
  - `node WIKA/scripts/validate-wika-workflow-phase14.js` 成功生成两组样例
- 阶段收口：
  - 当前已经形成“可直接给人继续处理”的外部回复草稿与外部订单草稿工作流层
  - 当前不能误写成平台内已回复、平台内已创单
  - 后续若继续，应优先增强输入模板、blocker 分层和人工补充模板，而不是回到平台内写动作
- 实现提交：`7b4f741`
- 清洗修正提交：`f9df52d`

### 阶段 15：任务 4/5 的外部草稿工作流模板化与人工补单包

- 起始 checkpoint：`0e24fd2`
- 本阶段只做一件事：
  - 不验证任何新 Alibaba API，不推进平台内读写
  - 只把现有 `/tools/reply-draft` 与 `/tools/order-draft` 继续增强成更适合人机协同的模板化外部草稿工作流
- 本阶段确认并固化的输出结构：
  - reply draft：
    - `input_summary`
    - `available_context`
    - `missing_context`
    - `hard_blockers`
    - `soft_blockers`
    - `assumptions`
    - `follow_up_questions`
    - `handoff_fields`
    - `alert_payload`
  - order draft：
    - `input_summary`
    - `available_context`
    - `missing_context`
    - `hard_blockers`
    - `soft_blockers`
    - `assumptions`
    - `required_manual_fields`
    - `follow_up_questions`
    - `handoff_fields`
    - `alert_payload`
- 新增 / 固化沉淀：
  - `WIKA/docs/framework/WIKA_外部回复输入模板.md`
  - `WIKA/docs/framework/WIKA_外部订单输入模板.md`
  - `WIKA/docs/framework/WIKA_人工补单模板.md`
  - `WIKA/docs/framework/WIKA_外部草稿工作流说明.md`
  - `WIKA/docs/framework/WIKA_外部回复草稿样例.json`
  - `WIKA/docs/framework/WIKA_外部订单草稿样例.json`
- 样例结果：
  - 已形成 4 组可复现样例：
    - 信息较完整的 reply draft
    - 信息缺失明显的 reply draft
    - 信息较完整的 order draft
    - 信息缺失明显的 order draft
- route 验收：
  - `POST /integrations/alibaba/wika/tools/reply-draft` -> `200 + 真实 JSON`
  - `POST /integrations/alibaba/wika/tools/order-draft` -> `200 + 真实 JSON`
  - `node WIKA/scripts/validate-wika-workflow-phase14.js` 已成功回灌阶段 15 样例
- 阶段收口：
  - 当前已经形成更稳定的外部草稿工作流模板层
  - 当前不能误写成平台内已回复或平台内已创单
  - 若后续继续，应优先增强人机协同模板与 handoff checklist，而不是回到平台内写动作

### 阶段 15 收口任务：外部草稿工作流 SOP 化与交接标准包

- 实际起始 commit：`183384f`
- 本轮未做任何新的 Alibaba API 验证
- 本轮未推进平台内自动回复、平台内订单创建、真实通知外发
- 本轮只做：
  - workflow_profile 与 template_version 收口
  - blocker taxonomy 统一
  - handoff checklist / manual completion SOP 固化
  - reply / order 输入模板版本化
  - 样例扩展到 6 组
  - 验证脚本稳定命名
- 新增 / 固化沉淀：
  - `shared/data/modules/alibaba-external-workflow-taxonomy.js`
  - `WIKA/scripts/validate-wika-external-draft-workflows.js`
  - `WIKA/scripts/validate-wika-workflow-phase14.js`（兼容别名）
  - `WIKA/docs/framework/WIKA_外部回复输入模板.md`
  - `WIKA/docs/framework/WIKA_外部订单输入模板.md`
  - `WIKA/docs/framework/WIKA_人工补单模板.md`
- 收口后的固定 profile：
  - reply：
    - `reply_minimal_handoff`
    - `reply_quote_confirmation_needed`
    - `reply_mockup_customization`
  - order：
    - `order_minimal_handoff`
    - `order_quote_confirmation_needed`
    - `order_commercial_review`
- 当前 route 输出新增并稳定的字段：
  - `workflow_profile`
  - `template_version`
  - `follow_up_question_details`
  - `handoff_checklist`
  - `manual_completion_sop`
  - `draft_usable_externally`
  - `required_manual_field_details`（order）
- 样例与验证：
  - reply 3 组
  - order 3 组
  - 当前总样例 6 组
  - 主验证脚本输出：
    - `workflow_profile`
    - `template_version`
    - `hard_blockers_count`
    - `soft_blockers_count`
    - `handoff_required`
    - `draft_usable_externally`
- 当前边界：
  - 仍然只是外部草稿工作流 SOP 层
  - 不是平台内自动回复
  - 不是平台内订单创建
  - 不是真实通知送达


### 阶段 16：任务 4/5 的外部草稿工作流质量评估、回归闸门与交接包导出

- 实际起始 commit：`14997a32a9a4f832eafc0e1dd0e83035042c2456`
- 起始 checkpoint：`8d11c9b`
- 本轮没有做任何新的 Alibaba API 验证
- 本轮没有推进平台内自动回复、平台内订单创建、真实通知外发
- 本轮只做：
  - reply / order 统一质量评估层
  - 可失败的回归闸门
  - JSON / Markdown handoff pack 导出
  - workflow profile / template version / blocker taxonomy 治理
- 新增 / 固化沉淀：
  - `shared/data/modules/alibaba-external-draft-review.js`
  - `shared/data/modules/alibaba-external-workflow-governance.js`
  - `shared/data/modules/alibaba-external-workflow-taxonomy.js`
  - `WIKA/scripts/validate-wika-external-draft-regression.js`
  - `WIKA/scripts/validate-wika-external-draft-workflows.js`
  - `WIKA/docs/framework/WIKA_外部回复交接包样例.json`
  - `WIKA/docs/framework/WIKA_外部回复交接包样例.md`
  - `WIKA/docs/framework/WIKA_外部订单交接包样例.json`
  - `WIKA/docs/framework/WIKA_外部订单交接包样例.md`
- 回归结果：
  - reply 4 组样例
  - order 4 组样例
  - 当前总样例 8 组
  - 回归脚本会断言：
    - `workflow_profile`
    - `template_version`
    - `hard_blockers_count`
    - `soft_blockers_count`
    - `handoff_required`
    - `draft_usable_externally`
    - `readiness_level`
- smoke test：
  - `POST /integrations/alibaba/wika/tools/reply-draft` -> 已执行
  - `POST /integrations/alibaba/wika/tools/order-draft` -> 已执行
- 阶段收口：
  - 当前已经形成可评估、可回归、可审计、可交接的外部草稿工作流质量层
  - 当前仍不能误写成平台内已回复、平台内已创单、真实通知已送达

### 阶段 17：任务 1/2 的经营数据候选接口只读验证

- 实际起始 commit：`c26ef19bb6c4454928f3844ed66164add38cf86d`
- 本轮没有做任何新的平台内写动作
- 本轮没有走本地 `.env` / callback / token 旁路
- 本轮只复用 Railway production + 官方 `/sync + access_token + sha256` 主线
- 新增验证脚本：
  - `WIKA/scripts/validate-wika-metrics-candidates.js`
- 新增沉淀：
  - `WIKA/docs/framework/WIKA_经营数据候选接口验证.md`
  - `WIKA/docs/framework/WIKA_经营数据字段覆盖矩阵.md`
  - `WIKA/docs/framework/evidence/`
- 候选方法真实生产分类结果：
  - `alibaba.mydata.overview.date.get` -> `AUTH_BLOCKED`
  - `alibaba.mydata.overview.industry.get` -> `AUTH_BLOCKED`
  - `alibaba.mydata.overview.indicator.basic.get` -> `AUTH_BLOCKED`
  - `alibaba.mydata.self.product.date.get` -> `AUTH_BLOCKED`
  - `alibaba.mydata.self.product.get` -> `AUTH_BLOCKED`
  - `alibaba.seller.order.list` -> `REAL_DATA_RETURNED`
  - `alibaba.seller.order.get` -> `PARAMETER_REJECTED`
  - `alibaba.seller.order.fund.get` -> `PARAMETER_REJECTED`
  - `alibaba.seller.order.logistics.get` -> `PARAMETER_REJECTED`
- 真实证据摘要：
  - `mydata / overview / self.product` 在当前租户下统一返回 `InsufficientPermission`
  - `order.list` 可稳定返回真实订单样本、分页能力和 `create_date / modify_date`
  - `order.list` 返回的 `trade_id` 在真实响应里已是遮罩值，因此继续喂给 `order.get / fund.get / logistics.get` 时统一落到参数拒绝
- 派生证明：
  - `趋势` -> 可由 `order.list.create_date` 派生
  - `正式汇总` -> 当前未证明成立
  - `国家结构` -> 当前未证明成立
  - `产品贡献` -> 当前未证明成立
- 阶段收口：
  - 当前不建议正式重开 `mydata` 主线
  - 若继续任务 2，订单级经营汇总只能先写成“基于现有交易 API 的部分派生”
  - 本轮只是候选接口验证，不等于任务 1 / 2 已完成

### 阶段 18：经营数据清障与订单参数契约对账

- 实际起始 commit：`218d073fe9aa3f5bc6b11682a5eadb4a4e1a8a90`
- 起始 checkpoint：`97d00e2`
- 本轮没有新增任何 Alibaba API 验证
- 本轮没有推进平台内回复、平台内创单、真实通知外发
- 本轮只做两件事：
  - 复用阶段 17 证据，形成 `mydata` 权限清障包
  - 复用阶段 17 证据与现有代码，形成订单参数契约对账包
- 新增 / 固化沉淀：
  - `WIKA/scripts/validate-wika-metrics-clearance-and-order-contract.js`
  - `WIKA/docs/framework/WIKA_经营数据权限清障包.md`
  - `WIKA/docs/framework/WIKA_订单参数契约对账.md`
  - `WIKA/docs/framework/evidence/wika-metrics-clearance-and-order-contract-summary.json`
  - `WIKA/docs/framework/evidence/wika-order-trend-partial-derived-sample.json`
- `mydata` 清障收口结论：
  - `alibaba.mydata.overview.date.get` -> `AUTH_BLOCKED`
  - `alibaba.mydata.overview.industry.get` -> `AUTH_BLOCKED`
  - `alibaba.mydata.overview.indicator.basic.get` -> `AUTH_BLOCKED`
  - `alibaba.mydata.self.product.date.get` -> `AUTH_BLOCKED`
  - `alibaba.mydata.self.product.get` -> `AUTH_BLOCKED`
  - 当前清障包状态：`ACCESS_REOPEN_READY`
- 订单参数契约对账结论：
  - `/orders/list` -> `READ_ONLY_ROUTE_CONFIRMED_WORKING`
  - `/orders/detail` -> `MASKED_TRADE_ID_NOT_REUSABLE`
  - `/orders/fund` -> `MASKED_TRADE_ID_NOT_REUSABLE`
  - `/orders/logistics` -> `MASKED_TRADE_ID_NOT_REUSABLE`
  - 当前 public 只读链路里没有证据证明 `order.list` 返回的遮罩 `trade_id` 可以直接复用为 `e_trade_id`
- 只读纠偏结论：
  - 当前没有发现可证明成立的“纯参数层安全修正”
  - 因此本轮不做 runtime 代码硬修
- partial derived signal：
  - `订单趋势` -> 仅由 `order.list.create_date` 部分派生
  - `正式汇总 / 国家结构 / 产品贡献` -> 当前仍未证明成立
- 阶段收口：
  - 当前不是 task 1 complete
  - 当前不是 task 2 complete
  - 当前没有任何写侧动作
  - 当前不是平台内闭环

### 阶段 19：ICBU 商品类目官方文档归类与候选池收口

- 实际起始 commit：`2b202e5e5d97e9d17c2ce37f57dd51912af26cf3`
- 起始 checkpoint：`e125612`
- 本轮没有做任何新的 Alibaba API 验证
- 本轮没有推进平台内自动回复、平台内订单创建、真实通知外发
- 本轮只做一件事：
  - 把 `ICBU－商品 (cid=20966)` 左侧栏 47 个官方页面的阅读结果，收口成可复用的官方文档归类与候选池
- 新增沉淀：
  - `WIKA/docs/framework/WIKA_ICBU商品类目官方文档归类.md`
- 当前最有价值的文档级结论：
  - `alibaba.icbu.product.schema.add.draft` 文档上明确返回“商品草稿明文id”
  - `alibaba.icbu.product.schema.render.draft` 文档上明确要求“草稿商品明文id”
  - `alibaba.icbu.product.type.available.get` 已被识别为更低风险的发品权限 precheck 候选
  - `alibaba.icbu.product.id.encrypt / decrypt` 已被识别为商品侧 ID 契约辅助能力
- 当前关键负结论：
  - 该类目中没有明确的 draft query / delete / manage 公开接口
  - 该类目中没有明确的 media delete / cleanup 公开接口
  - 该类目文档不能直接解决 `mydata` 的 `AUTH_BLOCKED`
  - 该类目文档不能直接解决订单 detail / fund / logistics 的参数契约
- 阶段收口：
  - 当前只把“文档已确认存在”的对象补充进候选池
  - 当前不能把这些方法误写成“已验证通过”或“已适合立即重开主线”
  - 当前边界仍然不是 task 1 complete，不是 task 2 complete，也不是平台内闭环

### 阶段 20：WIKA 多轮稳定化复跑与 XD 标准权限逐项确认

- 实际起始 commit：`2d804cbd177aeca787eee9b8d6357ab31b607f10`
- 起始 checkpoint：`33206af`
- 本轮没有新增任何 Alibaba API 验证
- 本轮没有推进平台内自动回复、平台内订单创建、真实通知外发
- 本轮只做四件事：
  - 读取并收口 `shared/access`、`WIKA/projects/wika/access`、`XD/projects/xd/access` 的现有流程资产
  - 对 WIKA 已验证 access 路由做多轮 precheck/replay 判定
  - 导出 WIKA 未决队列
  - 按同一方法对 XD 做标准权限预检
- 新增 / 更新沉淀：
  - `WIKA/projects/wika/AGENTS.md`
  - `XD/projects/xd/AGENTS.md`
  - `WIKA/projects/wika/access/plans.md`
  - `WIKA/projects/wika/access/documentation.md`
  - `WIKA/projects/wika/access/replay_matrix.csv`
  - `WIKA/projects/wika/access/replay_summary.md`
  - `WIKA/projects/wika/access/unresolved_queue.md`
  - `XD/projects/xd/access/api_matrix.csv`
  - `XD/projects/xd/access/api_coverage.md`
  - `XD/projects/xd/access/permission_gap.md`
  - `scripts/validate-access-stability-stage20.js`
  - `docs/framework/evidence/stage20-access-stabilization-summary.json`
  - `shared/access/troubleshooting.md`
  - `shared/access/data-validation-checklist.md`
- 真实 precheck 结论：
  - `/health` -> `BLOCKED_ENV`
  - `/integrations/alibaba/auth/debug` -> `BLOCKED_ENV`
  - `/integrations/alibaba/xd/auth/debug` -> `BLOCKED_ENV`
  - representative `products/list` / `orders/list` -> `BLOCKED_ENV`
  - 当前 Node 运行环境下统一表现为超时，不继续扩写成接口级回归
- 阶段收口：
  - WIKA 已验证 access route 本轮统一按 `BLOCKED_ENV` 收口
  - XD 标准权限逐项确认在进入业务接口前即被统一 `BLOCKED_ENV` 阻塞
  - 当前没有发现任何可证明成立的安全参数纠偏
  - 当前最先要恢复的不是接口参数，而是 Railway production 基础可用性
  - 当前边界仍然不是 task 1 complete，不是 task 2 complete，也不是平台内闭环

### 阶段 21：Railway production 环境解阻与基础路由恢复

- 实际起始 commit：`03fdea6cf0598db3542b8bc91feccbed2292228d`
- 本轮没有新增任何 Alibaba API 验证
- 本轮没有推进平台内回复、平台内订单创建、真实通知外发
- 本轮只做两件事：
  - 诊断 stage20 的统一 `BLOCKED_ENV`
  - 在 repo 内做最小可逆修复，避免 startup token bootstrap 拖住 `/health` 与 `auth/debug`
- 真实证据：
  - production `/health` -> `200`
  - production WIKA/XD `auth/debug` -> `200`
  - representative WIKA/XD `products/list`、`orders/list` -> `200`
  - local no-secret reproducer 已证明旧代码会在 `listen()` 前被 startup bootstrap 卡住
- repo 修复：
  - `app.js` 由“启动前等待 WIKA/XD token runtime 初始化”改为“先 listen，再后台 bootstrap”
- 当前闸门：
  - `WIKA replay` -> 可重开
  - `XD 8 项` -> 仍需先等 WIKA replay 回到接口级验证层
- 当前边界：
  - 当前不是 task 1 complete
  - 当前不是 task 2 complete
  - 当前不是平台内闭环

### 阶段 22：WIKA access route replay 与 XD 历史未决 8 项标准权限确认

- 续跑基线 commit：`6bd61031f70e41017432fa5737f8376f37975f5f`
- 当前实际起始 HEAD：`6bd61035ce4e774050670c9ea5e7496e0a568814`
- 本轮先做极短 production base smoke：
  - `/health` -> `200 ok`
  - `/integrations/alibaba/auth/debug` -> `200 JSON`
  - representative WIKA `products/list` / `orders/list` -> `200 JSON`
- 轻量 provenance：`not_proven_but_service_healthy`
- WIKA 27 条已验证/已上线 access route 多轮 replay 结果：
  - `RECONFIRMED`：27
  - `FLAKY`：0
  - `REGRESSED`：0
  - `BLOCKED_ENV`：0
- 关键 route 级结论：
  - `customers/list` 当前稳定表现为权限探针 route
  - `orders/detail / fund / logistics` 已能使用 route-level `trade_id` 在 WIKA route 层复现
- XD 历史未决 8 项标准权限确认结果：
  - `PERMISSION_DENIED`：4
    - `alibaba.mydata.overview.date.get`
    - `alibaba.mydata.overview.industry.get`
    - `alibaba.mydata.self.product.date.get`
    - `alibaba.mydata.self.product.get`
  - `PARAM_MISSING`：1
    - `alibaba.mydata.overview.indicator.basic.get`
  - `PASSED`：3
    - `alibaba.seller.order.get`
    - `alibaba.seller.order.fund.get`
    - `alibaba.seller.order.logistics.get`
- 本轮收口：
  - route replay 已稳定回到接口级验证层
  - 不再重复 stage22 的 27 条 route replay
- 当前剩余问题应转向 `mydata` 权限差距与 `indicator.basic.get` 参数契约
- 结束 checkpoint：`待本轮提交后补记`

### 阶段 23：冻结 WIKA 基线，只收口 XD 剩余 5 个 direct-method gap

- 续跑基线：`771337b2fb0cabb3f34f57778f1fd234fcb4d39f`
- 本轮没有新增任何 Alibaba API 验证范围
- 本轮没有推进平台内回复、平台内订单创建、真实通知外发
- 本轮只做三件事：
  - 用极小 sentinel 确认 production base 继续 `PASS_BASE`
  - 冻结 WIKA 27 条 route 为已确认基线，不再全量 replay
  - 只收口 XD 4 个 mydata 方法与 1 个 `indicator.basic` direct-method gap
- 极小 sentinel 结果：
  - `/health` -> `PASS_BASE`
  - `/integrations/alibaba/auth/debug` -> `PASS_BASE`
  - representative WIKA `products/list` -> `PASS_BASE`
- 4 个 mydata 方法标准权限证据闭环结果：
  - `alibaba.mydata.overview.date.get` -> `PERMISSION_GAP_CONFIRMED`
  - `alibaba.mydata.overview.industry.get` -> `PERMISSION_GAP_CONFIRMED`
  - `alibaba.mydata.self.product.date.get` -> `PERMISSION_GAP_CONFIRMED`
  - `alibaba.mydata.self.product.get` -> `PERMISSION_GAP_CONFIRMED`
- `indicator.basic` 参数契约闭环结果：
  - `date_range` alone -> `MissingParameter(industry)`
  - `date_range + industry` -> `InsufficientPermission`
  - 最终收口：`PERMISSION_DENIED`
- sanity control：
  - `alibaba.seller.order.get` -> `PASSED`
- elevated confirm：
  - 本轮未执行
  - 原因：`XD_ELEVATED_ALLOWED` 未设置为 `1`
- 本轮新增 / 更新沉淀：
  - `XD/scripts/validate-xd-direct-method-closure-stage23.js`
  - `XD/docs/framework/evidence/stage23-xd-direct-method-closure.json`
  - `XD/projects/xd/access/mydata_permission_matrix.csv`
  - `XD/projects/xd/access/mydata_permission_gap_stage23.md`
  - `XD/projects/xd/access/indicator_basic_contract_stage23.md`
- 本轮收口：
- 当前最大阻塞已明确是 XD mydata 权限缺口
- `indicator.basic` 不再只是参数歧义
- 当前不能误写成 task 1 complete、task 2 complete 或平台内闭环

### 阶段 24：XD 权限激活确认早停

- 起始 checkpoint：`37331d4`
- 本阶段目标：
  - 只确认外部权限动作是否已生效
  - 在没有变化时安全早停，不重复 stage23 的 5 个 direct-method 调用
- 极小预检结果：
  - production base 继续 `PASS_BASE`
  - `XD_ELEVATED_ALLOWED` 未设置为 `1`
  - 当前 repo / debug 可见信息里未发现新的外部权限变化证据
- 阶段收口：
  - 当前分类：`AWAITING_EXTERNAL_PERMISSION_ACTION`
- 不是代码问题，不是环境问题，也不是继续试参数的问题
- 当前需要先发生外部权限动作，再进入下一轮最小权限激活确认

### 阶段 19：WIKA 数据管家权限开通后复测

- 实际起始 commit：`74bfb9faec070c45ac012057c2d646b475f56682`
- 本轮线程范围：`WIKA-only`
- 本轮没有读取、复测、更新或推进任何 XD 结果
- 本轮没有新增任何 Alibaba API 验证范围
- 本轮没有推进平台内回复、平台内创单、真实通知外发
- 本轮只做一件事：
  - 在 WIKA production 主线下复测 `mydata` 5 个已加包官方方法
- 当前 appkey 结论：
  - `wika_appkey_confirmed=false`
  - `assumption_wika_appkey=true`
- base sentinel：
  - `/health` -> `200`
  - `/integrations/alibaba/auth/debug` -> `200 JSON`
  - representative WIKA `products/list` -> `200 JSON`
- 当前 WIKA auth/session state：
  - `wika_token_loaded=true`
  - `wika_token_file_exists=true`
  - `wika_has_refresh_token=true`
  - `wika_startup_init_status=refresh:startup_bootstrap`
- 5 个方法复测结果：
  - `alibaba.mydata.overview.date.get` -> `REAL_DATA_RETURNED`
  - `alibaba.mydata.overview.industry.get` -> `REAL_DATA_RETURNED`
  - `alibaba.mydata.overview.indicator.basic.get` -> `REAL_DATA_RETURNED`
  - `alibaba.mydata.self.product.date.get` -> `REAL_DATA_RETURNED`
  - `alibaba.mydata.self.product.get` -> `REAL_DATA_RETURNED`
- 已确认真实字段：
  - 店铺级：`visitor / imps / clk / clk_rate / fb / reply`
  - 产品级：`click / impression / visitor / fb / order / bookmark / compare / share / keyword_effects`
- 已确认真实窗口：
  - `overview.date.get` -> 可用 `date_range`
  - `self.product.date.get` -> `day / week / month` 全部返回真实窗口
- 当前未在真实响应里看到：
  - 店铺级 `流量来源 / 国家来源 / 快速回复率`
  - 产品级 `访问来源 / 询盘来源 / 国家来源 / 近周期变化`
- 本轮建议：
  - 可局部重开任务 1 的只读取数部分
  - 可局部重开任务 2 的经营诊断扩展部分
- 本轮边界：
  - 当前不是 task 1 complete
  - 当前不是 task 2 complete
  - 当前没有任何写侧动作
  - 当前不是平台内闭环
## 2026-04-10

### 阶段 20：WIKA mydata 正式只读路由化与经营诊断扩展

- 实际起始 commit：`12f9694458140c0deeac09cfd7f0eba52f3bb0cb`
- 本轮只处理 WIKA，不碰 XD，不做任何写动作
- 新增共享只读 helper：
  - `shared/data/modules/alibaba-mydata-overview.js`
  - `shared/data/modules/alibaba-mydata-product-performance.js`
- 新增正式 summary routes：
  - `/integrations/alibaba/wika/reports/operations/traffic-summary`
  - `/integrations/alibaba/wika/reports/products/performance-summary`
- 扩展正式诊断 routes：
  - `/integrations/alibaba/wika/reports/operations/minimal-diagnostic`
  - `/integrations/alibaba/wika/reports/products/minimal-diagnostic`
- route-level validation 结果：
  - `operations_traffic_summary` -> `PASS_LIVE_HELPER_CONTRACT`
  - `products_performance_summary` -> `PASS_LIVE_HELPER_CONTRACT`
  - `operations_minimal_diagnostic` -> `PASS_LIVE_HELPER_CONTRACT`
  - `products_minimal_diagnostic` -> `PASS_LIVE_HELPER_CONTRACT`
- confirmed official fields:
  - store: `visitor / imps / clk / clk_rate / fb / reply`
  - product: `click / impression / visitor / fb / order / bookmark / compare / share / keyword_effects`
- derived fields:
  - store: `uv_candidate_from_visitor / exposure_from_imps / ctr_candidate_from_clk_rate / reply_related_metric_from_reply`
  - product: `ctr_from_click_over_impression`
- unavailable dimensions:
  - store: `traffic_source / country_source / quick_reply_rate`
  - product: `access_source / inquiry_source / country_source / period_over_period_change`
- 阶段收口：
  - task 1 / task 2 仍只是局部重开条件成立
  - not task 1 complete
  - not task 2 complete
  - not full business cockpit


### 阶段 22：WIKA 剩余经营维度缺口压缩（只读）

- 隔离工作树：`D:\Code\阿里国际站__stage21_deploy`
- 起始 commit：`01f229cd368d2ee51f2f41c3c3edcf5320a6a9d0`
- 本阶段先复核 stage21 在线基线：
  - `/health` -> `200`
  - `/integrations/alibaba/auth/debug` -> `200 JSON`
  - `/integrations/alibaba/wika/reports/operations/management-summary` -> `200 JSON`
  - `/integrations/alibaba/wika/reports/products/management-summary` -> `200 JSON`
- 本阶段字段穷尽审计结论：
  - store: `traffic_source / country_source / quick_reply_rate` 仍未在现有 raw response 中出现
  - product: `access_source / inquiry_source / country_source / period_over_period_change` 仍未在现有 raw response 中出现
  - order:
    - `formal_summary` -> `DERIVABLE_FROM_EXISTING_APIS`
    - `product_contribution` -> `DERIVABLE_FROM_EXISTING_APIS`
    - `country_structure` -> `NOT_DERIVABLE_CURRENTLY`
- 订单级最小派生证明：
  - 样本 `trade_id` 数：`3`
  - `sampled_total_amount_sum=2445.2`
  - `sampled_service_fee_sum=73.36`
  - 已可做样本级产品贡献聚合
- 本阶段新增沉淀：
  - `WIKA/scripts/validate-wika-stage22-gap-compression.js`
  - `WIKA/docs/framework/evidence/wika-stage22-gap-compression-summary.json`
  - `WIKA/docs/framework/evidence/wika-stage22-existing-field-exhaustion.json`
  - `WIKA/docs/framework/evidence/wika-stage22-candidate-method-matrix.json`
  - `WIKA/docs/framework/WIKA_剩余经营维度现有字段穷尽审计.md`
- 本阶段没有新增候选方法 runtime 验证成功对象
- 本阶段没有扩 live routes
- 本阶段没有任何写动作
- 当前仍不是 task 1 complete
- 当前仍不是 task 2 complete
- 当前仍不是完整经营驾驶舱

### 阶段 25：WIKA 剩余经营维度缺口压缩第二轮

- 实际起始 commit：`01ae3fd966f75a1f43894ee73aac433d158708a7`
- 本轮只处理 WIKA，不碰 XD，不做任何写动作
- stage24 远端基线回归通过：
  - `/health`
  - `/integrations/alibaba/auth/debug`
  - `/integrations/alibaba/wika/reports/operations/management-summary`
  - `/integrations/alibaba/wika/reports/products/management-summary`
  - `/integrations/alibaba/wika/reports/orders/management-summary`
- 本轮新增沉淀：
  - `WIKA/scripts/validate-wika-stage25-gap-compression.js`
  - `WIKA/docs/framework/WIKA_剩余经营维度现有字段穷尽审计_第二轮.md`
  - `WIKA/docs/framework/evidence/wika-stage25-gap-compression-summary.json`
  - `WIKA/docs/framework/evidence/wika-stage25-existing-field-exhaustion.json`
  - `WIKA/docs/framework/evidence/wika-stage25-candidate-method-matrix.json`
- 本轮现有字段穷尽审计结论：
  - store: `traffic_source / country_source / quick_reply_rate` 仍未在 current official mainline 中出现
  - product: `access_source / inquiry_source / country_source / period_over_period_change` 仍未在 current official mainline 中出现
  - order: `country_structure` 仍未在 current public route 中成立
- legacy seller page 报告补充证据：
  - 仓内仍可看到 `traffic_source / country_source / quick_reply_rate / country_structure`
  - 但这不属于当前 official `/sync` 主线，因此本轮不接入 live routes
- 本轮没有新增候选方法 runtime 验证
- 本轮没有扩 live routes
- 当前仍不是 task 1 complete
- 当前仍不是 task 2 complete
- 当前仍不是完整经营驾驶舱

## 2026-04-11 Stage 27 Derived Comparison Layer

### 起始基线
- local start commit: `1981a4d8725b0374afdbdd2378d88907801266bd`
- `stage26 doc anchoring and validation preflight` 处于待 push 状态

### 本轮动作
- push `stage26 doc anchoring and validation preflight` 到 `origin/main`
- 完成最小线上基线确认：
  - `/health` -> `200`
  - `/integrations/alibaba/auth/debug` -> `200`
  - `operations/products/orders management-summary` -> `200`
- 新增 stage27 comparison helper：
  - `comparison-utils.js`
  - `operations-comparison.js`
  - `products-comparison.js`
  - `orders-comparison.js`
- 在 `app.js` 中新增 comparison summary route：
  - `/integrations/alibaba/wika/reports/operations/comparison-summary`
  - `/integrations/alibaba/wika/reports/products/comparison-summary`
  - `/integrations/alibaba/wika/reports/orders/comparison-summary`
- 新增：
  - `WIKA/docs/framework/WIKA_阶段27_周期对比层设计.md`
  - `WIKA/scripts/validate-wika-stage27-comparison-layer.js`
  - stage27 comparison evidence 一组

### 本轮验证结果
- `node --check app.js` 通过
- comparison helper / route / script 的 `node --check` 通过
- `node WIKA/scripts/validate-wika-stage27-comparison-layer.js` 通过
- comparison route 当前状态：
  - operations -> `PASS_LOCAL_CONTRACT`
  - products -> `PASS_LOCAL_CONTRACT`
  - orders -> `PASS_LOCAL_CONTRACT`

### 本轮结论
- 本轮没有新增 official fields
- 本轮没有新增官方候选方法 runtime 验证
- 本轮 comparison 层已达到本地 contract 候选，可作为下一轮上线判断基础
- 本轮不 push stage27
- 当前仍不是 task 1 complete
- 当前仍不是 task 2 complete
- 当前仍不是完整经营驾驶舱

### 阶段 27 收口：comparison layer 远端基线锁定

- 实际起始 commit：`1981a4d8725b0374afdbdd2378d88907801266bd`
- 本轮先完成：
  - `git push origin main`
- push：
  - `8b3c5dde936d956b5cafff8f57daf2aebae69386 -> origin/main` 成功
- production smoke 结果：
  - `/health` -> `200`
  - `/integrations/alibaba/auth/debug` -> `200 + JSON`
  - `/integrations/alibaba/wika/reports/operations/management-summary` -> `200 + JSON`
  - `/integrations/alibaba/wika/reports/products/management-summary` -> `200 + JSON`
  - `/integrations/alibaba/wika/reports/orders/management-summary` -> `200 + JSON`
  - `/integrations/alibaba/wika/reports/operations/minimal-diagnostic` -> `200 + JSON`
  - `/integrations/alibaba/wika/reports/products/minimal-diagnostic` -> `200 + JSON`
  - `/integrations/alibaba/wika/reports/orders/minimal-diagnostic` -> `200 + JSON`
  - `/integrations/alibaba/wika/reports/operations/comparison-summary` -> `200 + JSON`
  - `/integrations/alibaba/wika/reports/products/comparison-summary` -> `200 + JSON`
  - `/integrations/alibaba/wika/reports/orders/comparison-summary` -> `200 + JSON`
- 本轮没有发生 runtime 回退
- 本轮没有新增 official fields
- comparison layer 已部署，但继续保持 derived comparison 定位
- 本轮新增 post-deploy evidence：
  - `WIKA/docs/framework/evidence/wika-stage27-post-deploy-summary.json`
  - `WIKA/docs/framework/evidence/wika_operations_comparison_summary_post_deploy.json`
  - `WIKA/docs/framework/evidence/wika_products_comparison_summary_post_deploy.json`
  - `WIKA/docs/framework/evidence/wika_orders_comparison_summary_post_deploy.json`

## 2026-04-11 阶段 28 收口：统一经营驾驶舱与任务 3/4/5 工作台远端基线锁定

### push
- `d1dc79a04f29f0e682198c2a63f5974a7d678492 -> origin/main` 成功
- `02e42c196c44e6ec57f8bf9f246ea7a284ecc1e5 -> origin/main` 成功

### production smoke
- `/health` -> `200`
- `/integrations/alibaba/auth/debug` -> `200 + JSON`
- `operations/products/orders management-summary` -> `200 + JSON`
- `operations/products/orders minimal-diagnostic` -> `200 + JSON`
- `operations/products/orders comparison-summary` -> `200 + JSON`
- `/integrations/alibaba/wika/tools/reply-draft` -> `200 + JSON`
- `/integrations/alibaba/wika/tools/order-draft` -> `200 + JSON`
- `/integrations/alibaba/wika/reports/business-cockpit` -> `200 + JSON`
- `/integrations/alibaba/wika/workbench/product-draft-workbench` -> `200 + JSON`
- `/integrations/alibaba/wika/workbench/reply-workbench` -> `200 + JSON`
- `/integrations/alibaba/wika/workbench/order-workbench` -> `200 + JSON`
- `/integrations/alibaba/wika/workbench/task-workbench` -> `200 + JSON`

### 结果
- 本轮没有发生 runtime 回退
- 本轮只补了 stage28 workbench boundary statement 的显式布尔位
- `business-cockpit` 和 4 个 workbench route 均已在线可读
- 随后补充 `stage28 task workbench pacing fix`，用于降低 task3/4/5 聚合读取时触发上游 `ApiCallLimit` 的概率
- 最终验收按 paced production smoke + single retry on `ApiCallLimit` 执行，18 条 route 全部回到 `200`
- 继续保持：
  - not task 1 complete
  - not task 2 complete
  - not task 3 complete
  - not task 4 complete
  - not task 5 complete
  - task 6 excluded
  - not full business cockpit




### 阶段 26：XD parity/access 全量推进

- 实际起始 commit：`4e8ec3638d0be8a26d9c0d3536e814fcf945c5bf`
- 本轮先确认 base canary：
  - `/health` -> `200`
  - `/integrations/alibaba/auth/debug` -> `200`
  - `/integrations/alibaba/xd/auth/debug` -> `200`
  - `/integrations/alibaba/xd/data/products/list?page_size=1` -> `200`
  - `/integrations/alibaba/xd/data/orders/list?page_size=1` -> `200`
- 本轮执行了：
  - XD 27 条 parity route replay
  - XD 历史 8 项 direct-method 重闭环
  - WIKA 候选池 7 项在 XD 上的单次最小调用
- 本轮新增落盘：
  - `scripts/validate-xd-stage26-full-parity.js`
  - `docs/framework/evidence/stage26-xd-full-parity.json`
  - `Ali-WIKA/projects/xd/access/api_matrix.csv`
  - `Ali-WIKA/projects/xd/access/parity_replay_stage26.md`
  - `Ali-WIKA/projects/xd/access/direct_method_closure_stage26.md`
  - `Ali-WIKA/projects/xd/access/candidate_pool_stage26.md`
  - `Ali-WIKA/projects/xd/access/api_coverage.md`
  - `Ali-WIKA/projects/xd/access/permission_gap.md`
- 本轮关键结论：
  - XD 不是“整体未开权”
  - 5 个 direct-method `PASSED`
  - 3 个 direct-method `NO_DATA`
  - 5 条 route `PASSED_WITH_EQUIVALENT_DATA`
  - 14 条 route `DOC_MISMATCH`
