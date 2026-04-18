# XD 权限与能力总账 Stage31

## 结论先行

- 在当前已拿到权限、当前 safe-scope、安全只读边界和仓内证据条件下，XD 现有权限已经在 safe-scope 内尽量打通并完成收口。
- 已能直接用于现实工作的能力集中在：订单只读样本、商品基础盘点、类目/媒体/Schema 元信息核查、最小诊断、日报/周报草稿生成、关键 route 巡检。
- 仍然不能继续空转的对象主要有两类：`TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED` 与 `WRITE_ADJACENT_SKIPPED`。
- 当前所有“未继续打通”的对象都已经落入 reopen gate，不应再用“权限未申请”叙事回退。

## 总账表

| family | capability | 当前状态 | 证据来源 | 是否可用于现实任务 | 可用于什么现实任务 | 限制说明 |
| --- | --- | --- | --- | --- | --- | --- |
| orders | orders/list + detail + fund + logistics readonly slice | `AVAILABLE_WITH_SAMPLE_SCOPE_LIMIT` | route live evidence；stage26 evidence；stage27 evidence；stage30 freeze；matrix/docs cross-check | limited | 日报、周报草稿、订单样本趋势摘要、异常发现、关键 route 巡检 | 当前页样本与已读范围；非多页全量聚合；fund/logistics 仅作 sample trade 覆盖信号，不升格为稳定经营指标 |
| orders | orders minimal-diagnostic | `AVAILABLE_AND_PASSED` | stage28 evidence；route live evidence；stage30 freeze | yes | 经营诊断素材、运营摘要、巡检辅助信号 | 采样快照，不等于全量经营驾驶舱 |
| orders | orders report-style summary/trend/report-consumers production route | `FROZEN_BY_REOPEN_GATE` | matrix/docs cross-check；stage31 live 404 probe；stage30 freeze | no | 受控重开待证据 | 当前 production 未绑定；stage31 不回头扩 route，改用文件化报告脚本替代 |
| products | products/list + detail + groups + score readonly slice | `AVAILABLE_WITH_SAMPLE_SCOPE_LIMIT` | route live evidence；stage26 evidence；stage27 evidence；stage30 freeze | limited | 商品基础盘点、详情抽样核查、分组核查、质量分抽样、周报素材 | 当前页样本；非多页全量聚合；不输出全量商品贡献或经营归因 |
| categories | categories/tree + attributes | `AVAILABLE_AND_PASSED` | stage28 evidence；route live evidence；matrix/docs cross-check | yes | 类目树核查、类目属性核查、商品基础治理素材 | 只做元信息核查，不推导经营结果 |
| schema | products/schema + schema/render | `AVAILABLE_AND_PASSED` | stage28 evidence；route live evidence | limited | 结构化属性核查、产品信息完整性辅助判断 | 只读契约；不进入写侧草稿生成 |
| schema | products/schema/render/draft | `AVAILABLE_NO_DATA` | stage28 evidence；matrix/docs cross-check | no | 当前只作状态登记 | 当前租户样本下无有效业务载荷，不应硬写成可用能力 |
| media | media/list + groups | `AVAILABLE_AND_PASSED` | stage28 evidence；route live evidence | yes | 媒体素材存在性核查、媒体基础盘点 | 仅限只读素材与分组信息 |
| customers | customers/list | `TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED` | stage28 evidence；stage30 freeze；matrix/docs cross-check | no | 受控重开待证据 | 对象级 restriction confirmed；不是“没申请权限” |
| mydata | overview.date + self.product.date | `AVAILABLE_AND_PASSED` | direct-method live evidence；stage26 evidence；stage30 freeze | limited | 时间窗口校验、日报/周报时间轴辅助、经营诊断素材 | 不等于完整经营分析；仍受样本与对象范围限制 |
| mydata | overview.industry + indicator.basic + self.product | `AVAILABLE_NO_DATA` | stage26 evidence；stage30 freeze | limited | 只可作为“当前无业务载荷”的事实登记 | 当前读通但无可复用业务载荷，不能拔高解释 |
| mydata | keyword family + seller.trade.decode + opendata restriction set | `TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED` | stage29 evidence；stage30 freeze；reopen gate | no | 受控重开待证据 | 继续重试不会新增仓内证据；需新的外部租户/产品级 live 证据 |
| reports | 文件化日报 / 周报生成资产 | `AVAILABLE_AND_PASSED` | stage31 report generator；weekly report evidence；stage30 freeze | yes | 日报、周报、业务侧摘要草稿 | 基于 safe-scope 证据降级输出；显式标注 not_available 与 required_evidence |
| diagnostics | products/orders/operations minimal-diagnostic | `AVAILABLE_AND_PASSED` | stage28 evidence；route live evidence；stage30 freeze | yes | 经营诊断素材、运营摘要、巡检辅助说明 | sampled snapshot，不是全量经营诊断 |
| tools / draft-adjacent | reply-draft + order-draft | `WRITE_ADJACENT_SKIPPED` | stage28 evidence；stage30 freeze | no | 无；保持跳过 | 明显 write-adjacent；不在 safe-scope 内 |
| governance | reopen gate | `FROZEN_BY_REOPEN_GATE` | stage30 freeze；stage31 productization evidence | limited | restriction 对象重开判断、维护口径统一 | 只有外部新证据才能重开；没有新证据时不得同构重试 |

## 现阶段能直接做什么

- 生成 XD 日报、周报与业务侧运营摘要草稿。
- 做订单当前页样本趋势摘要与异常发现。
- 做商品基础盘点、类目/Schema/媒体元信息核查。
- 做关键 route 巡检与打通能力回归检查。
- 对 restriction 对象做“是否满足 reopen gate”的判断。

## 现阶段不能继续空转什么

- 不能继续把 restriction confirmed 对象当成“再试一次也许会通”的候选项。
- 不能把 write-adjacent skip 重新包装成只读能力。
- 不能把当前页样本写成全量业务结论。
- 不能编造 GMV、转化率、国家结构、完整经营诊断等无证据指标。

## 回答四个关键问题

### 1. 现有权限是否已经在 safe-scope 内尽量打通

是。当前 `remaining_route_gap_count = 0`，`remaining_candidate_unresolved_count = 0`，并且 stage30 已定义 reopen gate。

### 2. 哪些能力已经可以直接用于现实工作

- 订单样本运营摘要
- 商品基础盘点
- 类目 / 媒体 / Schema 元信息核查
- minimal-diagnostic 诊断素材
- 日报 / 周报自动生成
- 关键 route 巡检与回归

### 3. 哪些能力只能作为辅助参考

- fund/logistics 深字段
- mydata 的无载荷对象
- 当前页样本命中的“上周窗口”观察值

### 4. 哪些能力不应继续空转

- customers restriction
- keyword family restriction
- seller.trade.decode restriction
- 所有 write-adjacent skipped 对象

