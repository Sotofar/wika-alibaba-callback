# WIKA_执行计划

## 当前阶段
阶段 17：任务 1/2 的经营数据候选接口只读验证

## 本阶段唯一目标
只验证官方明确存在的经营数据候选接口，在当前 `WIKA` production 闭环下判断：

- 哪些方法能返回真实数据
- 哪些只到参数层
- 哪些被权限或能力阻塞
- 订单级经营汇总是否可由现有官方交易读侧派生

本阶段不新增任何平台内写动作，不回到本地旁路，不把候选验证误报成能力已打通。

## 起始基线
- 当前实际起始仓库状态以本阶段开始时的 `HEAD` 为准：`c26ef19`
- 当前只推进 `WIKA`
- 一律复用 Railway production 闭环与 `/sync + access_token + sha256`
- 当前禁止任何本地 `.env` / callback / token 旁路
- 当前禁止任何平台内写动作
- 当前稳定可复用读侧包括：
  - `products/list`
  - `products/detail`
  - `products/score`
  - `products/groups`
  - `orders/list`
  - `orders/detail`
  - `orders/fund`
  - `orders/logistics`
  - `products/management-summary`
  - `operations / products / orders minimal-diagnostic`

## 本阶段分解
### A. 复用基础盘点
- 找出现有官方 `/sync` 调用封装
- 找出现有签名逻辑与 access_token 获取逻辑
- 找出现有稳定 products/orders helper 与 smoke / validation 脚本模式

### B. 只读候选脚本验证
新增主脚本：
- `scripts/validate-wika-metrics-candidates.js`

脚本只做：
- 原始响应摘要
- 字段覆盖矩阵
- 统一分类结果
- 脱敏证据落盘

### C. 候选验证顺序
先验证店铺级：
- `alibaba.mydata.overview.date.get`
- `alibaba.mydata.overview.industry.get`
- `alibaba.mydata.overview.indicator.basic.get`

再验证产品级：
- `alibaba.mydata.self.product.date.get`
- `alibaba.mydata.self.product.get`

最后验证订单级：
- `alibaba.seller.order.list`
- `alibaba.seller.order.get`
- `alibaba.seller.order.fund.get`
- 如有必要，再补 `alibaba.seller.order.logistics.get`

### D. 派生证明
基于真实订单数据，给出最小派生样例，判断能否派生：
- 正式汇总
- 趋势（按日 / 周）
- 国家结构
- 产品贡献

## 本阶段明确排除
- XD
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
1. 每个候选 API 最多 3 轮 materially different attempts
2. 只允许验证官方明确列出的 method
3. 不直连 `router/rest`
4. 不把 `permission error` 写成“接口不存在”
5. 不把 `parameter accepted` 写成“已打通”
6. 不虚构 UV / PV / 来源 / 国家字段

## 分类标准
- `DOC_FOUND`
- `ROUTE_NOT_BOUND`
- `AUTH_BLOCKED`
- `CAPABILITY_BLOCKED`
- `PARAMETER_REJECTED`
- `PARAMETER_ACCEPTED_NO_REAL_DATA`
- `REAL_DATA_RETURNED`
- `DERIVABLE_FROM_EXISTING_ORDER_APIS`

## 当前收口结果
- `alibaba.mydata.overview.date.get` -> `AUTH_BLOCKED`
- `alibaba.mydata.overview.industry.get` -> `AUTH_BLOCKED`
- `alibaba.mydata.overview.indicator.basic.get` -> `AUTH_BLOCKED`
- `alibaba.mydata.self.product.date.get` -> `AUTH_BLOCKED`
- `alibaba.mydata.self.product.get` -> `AUTH_BLOCKED`
- `alibaba.seller.order.list` -> `REAL_DATA_RETURNED`
- `alibaba.seller.order.get` -> `PARAMETER_REJECTED`
- `alibaba.seller.order.fund.get` -> `PARAMETER_REJECTED`
- `alibaba.seller.order.logistics.get` -> `PARAMETER_REJECTED`
- 订单级派生结论：
  - `趋势` -> 可由现有 `order.list.create_date` 派生
  - `正式汇总 / 国家结构 / 产品贡献` -> 当前未证明成立

## 完成标准
- 已完成店铺级、产品级、订单级候选方法的真实生产分类
- 已形成字段覆盖矩阵
- 已落盘脱敏证据
- 已判断哪些字段可直接取、哪些字段只能派生、哪些字段仍缺公开入口
- 已更新基线、计划、缺口矩阵、候选池、自治推进日志
- 本阶段完成后停止，不自动进入下一阶段

## 停止条件
- 候选方法全部完成分类
- 或超过尝试预算仍无新证据
- 或继续推进只会回到被禁止的权限碰撞 / 写动作方向

## 交付物
- `scripts/validate-wika-metrics-candidates.js`
- `docs/framework/WIKA_经营数据候选接口验证.md`
- `docs/framework/WIKA_经营数据字段覆盖矩阵.md`
- `docs/framework/evidence/`
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
