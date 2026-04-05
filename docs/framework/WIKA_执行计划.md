# WIKA_执行计划

## 当前阶段
阶段 18：经营数据清障与订单参数契约对账

## 本阶段唯一目标
不新增任何 Alibaba API 验证，只围绕阶段 17 已有结果做两类收口：

- `mydata` 5 个方法的权限清障包
- `orders/detail/fund/logistics` 的参数契约对账包

如果存在纯只读、纯参数映射层面的安全修正，则允许小范围纠偏并复测；如果不能证明是只读参数层问题，就明确写成阻塞并停止。

## 起始基线
- 当前实际起始仓库状态以本阶段开始时的 `HEAD` 为准：`218d073`
- 当前只推进 `WIKA`
- 一律复用 Railway production 闭环与 `/sync + access_token + sha256`
- 当前禁止任何本地 `.env` / callback / token 旁路
- 当前禁止任何平台内写动作
- 阶段 17 已收口：
  - `alibaba.mydata.overview.date.get` -> `AUTH_BLOCKED`
  - `alibaba.mydata.overview.industry.get` -> `AUTH_BLOCKED`
  - `alibaba.mydata.overview.indicator.basic.get` -> `AUTH_BLOCKED`
  - `alibaba.mydata.self.product.date.get` -> `AUTH_BLOCKED`
  - `alibaba.mydata.self.product.get` -> `AUTH_BLOCKED`
  - `alibaba.seller.order.list` -> `REAL_DATA_RETURNED`
  - `alibaba.seller.order.get` -> `PARAMETER_REJECTED`
  - `alibaba.seller.order.fund.get` -> `PARAMETER_REJECTED`
  - `alibaba.seller.order.logistics.get` -> `PARAMETER_REJECTED`
- 当前仅部分成立的订单派生信号：
  - `趋势` -> 仅可由 `order.list.create_date` 做 partial derived signal

## 本阶段分解
### A. `mydata` 权限清障包
- 复用阶段 17 现有 evidence
- 对 5 个 `mydata` 官方方法逐一整理：
  - method name
  - intended use
  - target fields
  - observed result / error
  - affected tasks
  - minimal permission ask wording
  - access grant 后可重开的 route/report

### B. 订单参数契约对账
- 对齐现有正式只读链路：
  - `/orders/list`
  - `/orders/detail`
  - `/orders/fund`
  - `/orders/logistics`
- 明确：
  - downstream Alibaba method
  - expected params
  - identifier shape
  - identifier source
  - stage-17 validation input
  - mismatch finding
  - current conclusion
  - next action

### C. 只读参数层安全纠偏
- 只有在能证明问题只是：
  - 参数名映射错误
  - ID 来源使用错误
  - helper 少传只读必要参数
  - 路由文档与实际契约不一致
  才允许最小只读修正并复测
- 若无法证明，仅收口，不硬修

### D. Partial derived signal 固化
- 基于现有 `order.list.create_date`
- 固化一份最小“订单趋势派生证明”
- 明确它只是 `partial derived signal`，不能扩写成完整订单经营汇总

## 本阶段明确排除
- XD
- 任何新的 Alibaba API 验证
- inquiries / messages / customers
- RFQ
- order create
- photobank / add.draft / 任何写侧边界继续循环
- 本地旁路
- 真实商品发布
- 真实线上商品修改
- 真实客户沟通
- 真实通知外发
- 自动进入下一阶段

## 推进规则
1. 只允许围绕阶段 17 已验证方法做复核、对账、证据收口
2. 不新增 undocumented method，不穷举新接口名
3. 不直连 `router/rest`
4. 不把 `AUTH_BLOCKED` 写成“接口不存在”
5. 不把“参数通过”写成“经营汇总已成立”
6. 不能证明是只读参数层问题时，不做代码硬修

## 分类标准
### `mydata`
- `AUTH_BLOCKED`
- `ACCESS_REOPEN_READY`

### 订单 detail / fund / logistics 契约
- `SCRIPT_PARAM_NAME_MISMATCH`
- `SCRIPT_ID_SOURCE_MISMATCH`
- `MASKED_TRADE_ID_NOT_REUSABLE`
- `ROUTE_USES_DIFFERENT_INTERNAL_ID_SOURCE`
- `EXTRA_REQUIRED_PARAM_MISSING`
- `READ_ONLY_ROUTE_CONFIRMED_WORKING`
- `PARAM_CONTRACT_STILL_UNRESOLVED`

## 当前预期交付
- `docs/framework/WIKA_经营数据权限清障包.md`
- `docs/framework/WIKA_订单参数契约对账.md`
- `scripts/validate-wika-metrics-clearance-and-order-contract.js`
- `docs/framework/evidence/wika-metrics-clearance-and-order-contract-summary.json`

## 完成标准
- 已形成 `mydata` 权限清障包
- 已形成订单参数契约对账矩阵
- 如有纯参数层安全修正，已完成只读复测；如无，已明确阻塞
- 已固化最小订单趋势派生证明
- 已更新基线、计划、候选验证文档、字段矩阵、缺口矩阵、候选池、自治推进日志
- 本阶段完成后停止，不自动进入下一阶段

## 停止条件
- `mydata` 清障包与订单契约对账包都已形成
- 或者无法证明存在纯只读参数层修正空间
- 或继续推进只会回到新 API 验证 / 写动作方向

## 交付物
- `scripts/validate-wika-metrics-clearance-and-order-contract.js`
- `docs/framework/evidence/wika-metrics-clearance-and-order-contract-summary.json`
- `docs/framework/WIKA_经营数据权限清障包.md`
- `docs/framework/WIKA_订单参数契约对账.md`
- `docs/framework/WIKA_经营数据候选接口验证.md`
- `docs/framework/WIKA_经营数据字段覆盖矩阵.md`
- `docs/framework/WIKA_项目基线.md`
- `docs/framework/WIKA_执行计划.md`
- `docs/framework/WIKA_面向6项任务_API缺口矩阵.md`
- `docs/framework/WIKA_下一批必须验证的API候选池.md`
- `docs/framework/WIKA_自治推进日志.md`

## 固定汇报结构
- 当前阶段
- 本轮目标
- 已复用的已上线能力
- 本轮新验证 / 新开发 / 新沉淀的内容
- 本轮明确排除的 API / 能力
- 已完成闸门
- 当前唯一阻塞点
- WIKA 是否遇到过
- WIKA 的解决方式是否可复用
- 下一步唯一动作
- 明确未完成项
- 当前还缺哪些经营关键数据
- 当前离“完成 6 项任务”还差哪些能力缺口
- 当前诊断里哪些是真实数据结论，哪些只是待验证判断
