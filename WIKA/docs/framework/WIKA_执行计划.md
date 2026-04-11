# WIKA_执行计划

## 2026-04-11 Stage 26 官方文档定锚与验证前置包

### 当前阶段
- 阶段 26：官方文档定锚与验证前置包

### 本轮唯一目标
- 先把 stage25 本地结论 push 到 `origin/main`
- 用最小线上基线确认 stage24 没有回退
- 只围绕剩余缺口建立官方文档定锚、候选映射与 runtime 前置判断
- 若 direct candidate 不完整，则停在文档定锚，不进入 runtime

### 已完成
- 已 push：
  - `c4e8848b89eeb71dad04899342c63b1ccf0436ed -> origin/main`
- 已完成最小线上基线确认：
  - `/health`
  - `/integrations/alibaba/auth/debug`
  - `/integrations/alibaba/wika/reports/operations/management-summary`
  - `/integrations/alibaba/wika/reports/products/management-summary`
  - `/integrations/alibaba/wika/reports/orders/management-summary`
- 已新增 stage26 沉淀：
  - `WIKA/scripts/validate-wika-stage26-doc-anchoring.js`
  - `WIKA/docs/framework/WIKA_阶段26_剩余缺口官方文档定锚.md`
  - `WIKA/docs/framework/evidence/wika-stage26-doc-anchoring-summary.json`
  - `WIKA/docs/framework/evidence/wika-stage26-direct-candidate-matrix.json`
- 已确认：
  - 当前 direct candidate 为空
  - 背景 doc-found 候选虽已有 `doc_url`，但仍缺稳定字段说明与参数契约，不进入 runtime
  - 本轮不扩 live routes

### 本轮明确边界
- 不新增 Alibaba API 探索
- 不推进 XD
- 不做任何写动作
- not task 1 complete
- not task 2 complete
- not full business cockpit

## 2026-04-11 Stage 24 Final Lock Update

### 当前阶段
- 阶段 24：stage24 远端基线锁定

### 本轮唯一目标
- 将 stage24 本地提交链 push 到 `origin/main`
- 用最小 production smoke 确认目录重整、编码修复、路径修复没有破坏现有 WIKA 线上能力
- 把 stage24 锁定为新的远端基线

### 已完成
- 已 push：
  - `a41c044797e27b48dc132edbe63b0849b5b6ea57 -> origin/main`
  - `a2f1f8f9ced7afafc12d1accaf67dcc59e88ca25 -> origin/main`
- 已完成最小 production smoke：
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
- 已完成最小只读安全修正：
  - 修正 `WIKA/projects/wika/data/**` 到 root `shared/` 的相对 import 层级
- 已新增 stage24 post-deploy evidence：
  - `WIKA/docs/framework/evidence/wika-stage24-post-deploy-summary.json`

### 本轮明确边界
- 不新增 Alibaba API 探索
- 不推进 XD 业务功能
- 不做任何写动作
- 不改业务语义
- not task 1 complete
- not task 2 complete
- not full business cockpit

## 2026-04-11 Stage 23 Orders Summary Update

### 当前阶段
- 阶段 23：WIKA 订单经营摘要层与订单诊断扩展

### 本轮唯一目标
- 先把 stage22 commit `19f55e9e99a5fa5b9383c8375c86c16b7fb14b05` push 到 `origin/main`
- 在不新增 API 探索的前提下，把 `formal_summary / product_contribution` 沉淀为正式只读订单经营摘要层
- 扩展 `/integrations/alibaba/wika/reports/orders/minimal-diagnostic` 消费这些 derived 结果
- 保持 `country_structure` unavailable

### 已完成
- stage22 已成功 push 到 `origin/main`
- 已新增本地 helper：`shared/data/modules/wika-order-management-summary.js`
- 已新增本地 route：`/integrations/alibaba/wika/reports/orders/management-summary`
- 已扩展本地 route：`/integrations/alibaba/wika/reports/orders/minimal-diagnostic`
- 已通过本地 contract 验证：
  - `orders_management_summary -> PASS_LOCAL_CONTRACT`
  - `orders_minimal_diagnostic -> PASS_LOCAL_CONTRACT`
- 已通过 production smoke：
  - `/integrations/alibaba/wika/reports/operations/management-summary`
  - `/integrations/alibaba/wika/reports/products/management-summary`
  - `/integrations/alibaba/wika/reports/orders/management-summary`
  - `/integrations/alibaba/wika/reports/operations/minimal-diagnostic`
  - `/integrations/alibaba/wika/reports/products/minimal-diagnostic`
  - `/integrations/alibaba/wika/reports/orders/minimal-diagnostic`
- 已生成 stage23 post-deploy evidence：
  - `WIKA/docs/framework/evidence/wika-stage23-post-deploy-summary.json`
  - `WIKA/docs/framework/evidence/wika_orders_management_summary_post_deploy.json`
  - `WIKA/docs/framework/evidence/wika_orders_minimal_diagnostic_post_deploy.json`

### 本轮明确边界
- 不新增 Alibaba API 探索
- 不推进 XD
- 不做任何写动作
- `country_structure` 继续 unavailable
- 订单层当前已部署，但仍只成立为 derived / conservative / partial

## 2026-04-10 Stage 21 Deploy Lock Update

### 当前阶段
- 阶段 21 收口二：隔离工作树部署验证与正式基线锁定

### 本轮唯一目标
- 在隔离工作树中完成 stage21 commit 的 `push origin/main`
- 等部署完成后，对 4 个 route 做 production HTTP smoke
- 把 smoke 通过结果写回正式基线文档与 evidence

### 已完成
- 已在隔离工作树中 push `4814b97fa3dbd32b81d603eaf063a9f19dfaf76b -> origin/main`
- 以下 route 已通过 production HTTP smoke：
  - `/integrations/alibaba/wika/reports/operations/management-summary`
  - `/integrations/alibaba/wika/reports/products/management-summary`
  - `/integrations/alibaba/wika/reports/operations/minimal-diagnostic`
  - `/integrations/alibaba/wika/reports/products/minimal-diagnostic`
- 已新增 post-deploy evidence：
  - `wika-stage21-post-deploy-summary.json`
  - `wika_operations_management_summary_post_deploy.json`
  - `wika_products_management_summary_post_deploy.json`
  - `wika_operations_minimal_diagnostic_post_deploy.json`
  - `wika_products_minimal_diagnostic_post_deploy.json`

### 本轮明确边界
- 不新增 Alibaba API 探索
- 不推进 XD
- 不做任何写动作
- `products management summary` 仍是 sample-based
- not task 1 complete
- not task 2 complete
- not full business cockpit

## 2026-04-10 Stage 21 Update

### 当前阶段
- 阶段 21：WIKA 经营管理摘要层与诊断消费层

### 本轮唯一目标
- 在 stage20 已落地的 mydata 正式只读层之上，新增面向业务消费的 management summary 共享层
- 新增 operations management summary route，并扩展既有 products management summary route
- 扩展 operations / products minimal diagnostic 的解释层、建议块与 unavailable 回显
- 固定产品范围 / 采样边界表达

### 已完成
- `AGENTS.md` 已新增稳定输出规则：
  - `所有中间进度、最终总结、验收结果、提交说明，一律使用简体中文输出。`
- 新增 management summary helper：
  - `shared/data/modules/wika-mydata-management-summary.js`
  - `shared/data/modules/wika-mydata-product-ranking.js`
- 新增或更新正式路由：
  - `/integrations/alibaba/wika/reports/operations/management-summary`
  - `/integrations/alibaba/wika/reports/products/management-summary`
  - `/integrations/alibaba/wika/reports/operations/minimal-diagnostic`
  - `/integrations/alibaba/wika/reports/products/minimal-diagnostic`
- 已通过 live helper contract 验证：
  - operations management summary
  - products management summary
  - operations minimal diagnostic stage21 extension
  - products minimal diagnostic stage21 extension

### 本轮明确边界
- 不新增 Alibaba API 探索
- 不推进 XD
- 不做任何写动作
- 当前仍然不是完整经营驾驶舱
- not task 1 complete
- not task 2 complete

## 2026-04-10 Stage 20 Update

### 当前阶段
- 阶段 20：WIKA mydata 正式只读路由化与经营诊断扩展

### 本轮唯一目标
- 把 5 个已证实可用的 mydata 方法沉淀为正式只读共享层与 summary routes
- 扩展 operations / products minimal diagnostic
- 固定 official / derived / unavailable 三层边界

### 已完成
- 新增只读共享 helper：
  - `shared/data/modules/alibaba-mydata-overview.js`
  - `shared/data/modules/alibaba-mydata-product-performance.js`
- 新增正式 summary routes：
  - `/integrations/alibaba/wika/reports/operations/traffic-summary`
  - `/integrations/alibaba/wika/reports/products/performance-summary`
- 扩展正式诊断 routes：
  - `/integrations/alibaba/wika/reports/operations/minimal-diagnostic`
  - `/integrations/alibaba/wika/reports/products/minimal-diagnostic`
- 已通过 live helper contract 验证：
  - operations traffic summary
  - products performance summary
  - operations minimal diagnostic extension
  - products minimal diagnostic extension

### 本轮明确边界
- 不新增 Alibaba API 探索
- 不推进 XD
- 不做任何写动作
- not task 1 complete
- not task 2 complete
- not full business cockpit

## 当前阶段
阶段 19：WIKA 数据管家权限开通后复测

## 本阶段唯一目标
- 只在 WIKA production 主线下复测 5 个 `mydata` 官方方法
- 把“权限后台已加包”转化成“真实字段是否可取”的明确证据
- 不扩展到任何新 API
- 不做任何写侧动作
- 不混入 XD

## 固定执行顺序
1. 确认当前线程只处理 WIKA，并把 appkey 对应关系收口为：
   - `wika_appkey_confirmed=false`
   - `assumption_wika_appkey=true`
2. 复核 WIKA production base sentinel：
   - `/health`
   - `/integrations/alibaba/auth/debug`
   - 一个代表性 WIKA 只读 route
3. 按固定顺序复测 5 个方法：
   - `alibaba.mydata.overview.date.get`
   - `alibaba.mydata.overview.industry.get`
   - `alibaba.mydata.overview.indicator.basic.get`
   - `alibaba.mydata.self.product.date.get`
   - `alibaba.mydata.self.product.get`
4. 提取真实字段证据并刷新字段覆盖矩阵
5. 只在真实字段成立后判断是否建议局部重开任务 1 / 2 的读数部分

## 本阶段实际结果
- WIKA production base：`PASS_BASE`
- 当前 seller 授权态：可用；`wika_token_loaded=true`、`wika_has_refresh_token=true`
- 5 个 `mydata` 方法本轮都已从旧的 `AUTH_BLOCKED` 进入 `REAL_DATA_RETURNED`
- 已确认的真实字段：
  - 店铺级：`visitor`、`imps`、`clk`、`clk_rate`、`fb`、`reply`
  - 产品级：`click`、`impression`、`visitor`、`fb`、`order`、`bookmark`、`compare`、`share`、`keyword_effects`
- 已确认的真实窗口：
  - `overview.date.get` 提供可用 `date_range`
  - `self.product.date.get` 提供 `day / week / month` 三种真实窗口
- 当前未在真实返回中看到：
  - 店铺级 `流量来源 / 国家来源 / 快速回复率`
  - 产品级 `访问来源 / 询盘来源 / 国家来源 / 近周期变化`

## 本阶段分类口径
- 本阶段允许使用的最终分类：
  - `REAL_DATA_RETURNED`
  - `STILL_AUTH_BLOCKED`
  - `ILLEGAL_ACCESS_TOKEN`
  - `MISSING_ACCESS_TOKEN`
  - `PARAMETER_REJECTED`
  - `ENVIRONMENT_BLOCKED`
  - `UPSTREAM_SAMPLE_MISSING`
  - `AWAITING_WIKA_REAUTH`
  - `APPKEY_NOT_CONFIRMED`
- 本阶段实际收口：
  - 5 / 5 方法 = `REAL_DATA_RETURNED`

## 本阶段之后允许的唯一下一步
- 若继续，只建议局部重开任务 1 / 任务 2 的“只读取数与诊断扩展”部分
- 仍不进入写侧验证，不宣布任务完成

## 固定边界
- 当前不是 task 1 complete
- 当前不是 task 2 complete
- 当前没有任何写侧动作
- 当前线程只处理 WIKA
- 当前没有更新或推进任何 XD 结果


## 2026-04-11 Stage 22 Gap Compression Update

### 当前阶段
- 阶段 22：WIKA 剩余经营维度缺口压缩（只读）

### 本轮唯一目标
- 先确认 stage21 在线基线没有回退
- 先把现有 raw response / helper / route 输出做字段穷尽审计
- 只在现有响应确实没有覆盖时，才继续保留候选方法
- 如果没有新真实字段，就只更新矩阵、候选池、evidence 与文档，不扩 live routes

### 已完成
- stage21 在线基线回归通过：
  - `/health`
  - `/integrations/alibaba/auth/debug`
  - `/integrations/alibaba/wika/reports/operations/management-summary`
  - `/integrations/alibaba/wika/reports/products/management-summary`
- 已完成现有字段穷尽审计：
  - store: `traffic_source / country_source / quick_reply_rate` 仍未在 current response 中出现
  - product: `access_source / inquiry_source / country_source / period_over_period_change` 仍未在 current response 中出现
- 订单级缺口压缩：
  - `formal_summary` -> `DERIVABLE_FROM_EXISTING_APIS`
  - `product_contribution` -> `DERIVABLE_FROM_EXISTING_APIS`
  - `country_structure` -> `NOT_DERIVABLE_CURRENTLY`
- 已新增 stage22 evidence：
  - `wika-stage22-gap-compression-summary.json`
  - `wika-stage22-existing-field-exhaustion.json`
  - `wika-stage22-candidate-method-matrix.json`
  - `WIKA_剩余经营维度现有字段穷尽审计.md`

### 本轮明确边界
- 不新增 Alibaba API 探索
- 不推进 XD
- 不做任何写动作
- 不扩 live routes
- not task 1 complete
- not task 2 complete
- not full business cockpit

## 2026-04-11 Stage 25 Gap Compression Round 2

### 当前阶段
- 阶段 25：WIKA 剩余经营维度缺口压缩第二轮

### 本轮唯一目标
- 先确认 stage24 远端基线没有回退
- 优先复核现有 route / helper / evidence / raw response 是否已覆盖剩余维度
- 只有在 current official mainline 明确没有覆盖时，才继续保留既有 doc-found only 候选
- 如果没有新真实字段，就只更新矩阵、候选池、evidence 与文档，不扩 live routes

### 已完成
- stage24 线上基线回归通过：
  - `/health`
  - `/integrations/alibaba/auth/debug`
  - `/integrations/alibaba/wika/reports/operations/management-summary`
  - `/integrations/alibaba/wika/reports/products/management-summary`
  - `/integrations/alibaba/wika/reports/orders/management-summary`
- 已完成“现有字段穷尽审计第二轮”：
  - store: `traffic_source / country_source / quick_reply_rate` 仍未在 current official mainline 中出现
  - product: `access_source / inquiry_source / country_source / period_over_period_change` 仍未在 current official mainline 中出现
  - order: `country_structure` 仍未在 current public route 层成立
- 已把 legacy seller page 证据与 current official mainline 边界拆开落盘
- 本轮新增沉淀：
  - `WIKA/scripts/validate-wika-stage25-gap-compression.js`
  - `WIKA/docs/framework/WIKA_剩余经营维度现有字段穷尽审计_第二轮.md`
  - `WIKA/docs/framework/evidence/wika-stage25-gap-compression-summary.json`
  - `WIKA/docs/framework/evidence/wika-stage25-existing-field-exhaustion.json`
  - `WIKA/docs/framework/evidence/wika-stage25-candidate-method-matrix.json`

### 本轮明确边界
- 不新增 Alibaba API 探索
- 不推进 XD
- 不做任何写动作
- 不扩 live routes
- not task 1 complete
- not task 2 complete
- not full business cockpit

## 阶段 27：周期对比层（derived comparison layer）

### 本轮目标
- 先完成 stage26 push 与最小线上基线确认
- 再只基于当前已确认 official mainline / existing derived layer 构建 comparison layer
- 优先补齐 current window vs previous comparable window 的 derived comparison 能力
- 若 comparison 只达到本地 contract，则停在本地候选，不提前上线

### 已完成闸门
- `stage26 doc anchoring and validation preflight` 已 push 到 `origin/main`
- 最小线上基线确认通过：
  - `/health`
  - `/integrations/alibaba/auth/debug`
  - `operations/products/orders management-summary`

### 本轮新增沉淀
- comparison helper：
  - `WIKA/projects/wika/data/reports/comparison-utils.js`
  - `WIKA/projects/wika/data/reports/operations-comparison.js`
  - `WIKA/projects/wika/data/reports/products-comparison.js`
  - `WIKA/projects/wika/data/reports/orders-comparison.js`
- comparison route：
  - `/integrations/alibaba/wika/reports/operations/comparison-summary`
  - `/integrations/alibaba/wika/reports/products/comparison-summary`
  - `/integrations/alibaba/wika/reports/orders/comparison-summary`
- 验证脚本与证据：
  - `WIKA/scripts/validate-wika-stage27-comparison-layer.js`
  - `WIKA/docs/framework/WIKA_阶段27_周期对比层设计.md`
  - `WIKA/docs/framework/evidence/wika-stage27-comparison-layer-summary.json`
  - `WIKA/docs/framework/evidence/wika_operations_comparison_summary.json`
  - `WIKA/docs/framework/evidence/wika_products_comparison_summary.json`
  - `WIKA/docs/framework/evidence/wika_orders_comparison_summary.json`

### 当前状态
- comparison 层已达到本地 contract pass
- comparison 层尚未 push，不写成已部署能力
- 本轮没有新增 official 字段
- 本轮没有新增 doc-found runtime 验证

### 本轮明确边界
- comparison 只是一层 derived comparison，不补 official gap
- 不推进 XD
- 不做任何写动作
- 仍不把 `traffic_source / country_source / quick_reply_rate / access_source / inquiry_source / country_structure` 写成已成立
- not task 1 complete
- not task 2 complete
- not full business cockpit



