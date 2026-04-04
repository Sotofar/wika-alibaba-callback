# WIKA_执行计划

## 当前阶段
阶段 10：任务 5 的正式订单入口边界验证

## 本阶段唯一目标
只验证官方明确存在的订单创建相关入口，判断是否存在“安全草稿 / 参数验证 / 授权验证 / 低风险预检查”边界；不做真实订单创建。

## 起始基线
- 只推进 `WIKA`
- 一律复用 Railway production 认证闭环与 `/sync + access_token + sha256`
- 已上线的 WIKA 读侧原始路由与最小经营诊断层已稳定可复用
- `mydata / overview / self.product` 当前不再作为主线推进
- 任务 3 当前卡在 `photobank.upload / product.add.draft` 的低风险边界不足
- 任务 4 当前卡在 `customers` 权限 / 真实 id，以及 `inquiries / messages` 缺少明确读侧方法名
- 任务 6 的最小正式通知闭环已经成立
- 官方明确存在 `alibaba.trade.order.create`，当前值得做正式入口边界验证

## 可复用能力
- 现有全部 WIKA 只读原始路由
- 现有写侧护栏 helper 与人工接管规则
- 现有正式通知 fallback 闭环
- 现有产品 / 订单 / 物流 / schema / media 的真实样本与样例文档

## 本阶段明确排除
- XD
- `mydata / overview / 数据管家`
- `inquiries / messages / customers` 新验证
- `RFQ`
- 真实商品发布
- 真实线上商品修改
- 真实客户沟通
- 真实订单创建
- 任何不可逆写动作
- 自动进入下一阶段

## 执行顺序
### A. 官方文档清点
1. 确认 `alibaba.trade.order.create` 的官方文档信息、参数层级与是否明确属于国际站信保下单
2. 继续只查找官方明确存在的同家族低风险候选：
   - `draft`
   - `precheck`
   - `query`
   - `status`
   - `cancel`
   - `quote / order draft`
3. 仅当方法名在官方文档中明确出现时，才允许进入验证
4. 新增或更新 `docs/framework/WIKA_订单入口候选清单.md`

### B. 最小生产边界验证
1. 优先验证 `alibaba.trade.order.create`
2. 仅验证 A 步中明确存在的同家族低风险候选
3. 默认只做缺参 / 不完整 payload / 明显不会成交的参数层验证
4. 不构造可能触发真实订单创建的完整 payload
5. 只有低风险读侧或预检查侧，且证据充分时，才允许考虑最小正式原始路由

### C. 订单草稿链路沉淀
1. 新增订单草稿 helper
2. 生成结构化订单草稿样例
3. 新增或更新：
   - `docs/framework/WIKA_订单草稿链路说明.md`
   - `docs/framework/WIKA_订单草稿样例.json`
4. 若 create 或同家族低风险接口证据不足，明确写成“当前只能做外部订单草稿”

## 执行规则
1. 本阶段不追求平台订单创建成功
2. 只追求把任务 5 的正式入口边界摸清，并形成可靠的外部草稿中间层
3. 若官方明确候选不足或边界过高，必须明确收口
4. 不得因追求进度而越过真实创单风险边界

## 完成标准
- 已完成 `alibaba.trade.order.create` 的真实生产分类
- 若官方明确存在同家族低风险候选，也已完成其真实生产分类；若不存在，已明确收口
- 已形成订单草稿 helper + 订单草稿样例
- 已明确写清当前是“平台内订单入口边界验证”还是“只能外部订单草稿”
- 已更新基线、计划、缺口矩阵、复用清单、候选池、自治推进日志
- 阶段结束后停止，不自动进入下一阶段

## 停止条件
- `alibaba.trade.order.create` 及同家族明确候选完成真实分类
- 或已证明当前只有高风险真实创单入口，不存在足够低风险的同家族边界
- 或继续推进会触发不可接受的真实创单风险

## 交付物
- docs/framework/WIKA_订单入口候选清单.md
- docs/framework/WIKA_订单草稿链路说明.md
- docs/framework/WIKA_订单草稿样例.json
- docs/framework/WIKA_项目基线.md
- docs/framework/WIKA_执行计划.md
- docs/framework/WIKA_面向6项任务_API缺口矩阵.md
- docs/framework/WIKA_已上线能力复用清单.md
- docs/framework/WIKA_下一批必须验证的API候选池.md
- docs/framework/WIKA_自治推进日志.md

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
