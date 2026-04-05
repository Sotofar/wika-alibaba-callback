# WIKA_执行计划

## 当前阶段
阶段 11：任务 2 的产品/订单子诊断拆分

## 本阶段唯一目标
不再验证任何新 API，只复用当前已经上线并已线上验证的 WIKA 真实读侧能力，把现有
`/integrations/alibaba/wika/reports/operations/minimal-diagnostic`
拆成两个更细的只读子报告：
- `/integrations/alibaba/wika/reports/products/minimal-diagnostic`
- `/integrations/alibaba/wika/reports/orders/minimal-diagnostic`

## 起始基线
- 只推进 `WIKA`
- 一律复用 Railway production 认证闭环与 `/sync + access_token + sha256`
- 当前已存在总的 `operations/minimal-diagnostic`
- 任务 3 / 4 / 5 当前都被权限或安全边界卡住
- 当前最有价值的下一步，是把已有真实数据沉淀成更细的只读诊断层

## 可复用能力
- 现有全部 WIKA 只读原始路由
- `products/management-summary`
- `reports/operations/minimal-diagnostic`
- 现有最小经营诊断口径与样例文档

## 本阶段明确排除
- XD
- `mydata / overview / 数据管家`
- `inquiries / messages / customers` 新验证
- `order create` 新验证
- `RFQ`
- 真实商品发布
- 真实线上商品修改
- 真实客户沟通
- 真实通知外发配置
- 自动进入下一阶段

## 执行顺序
### A. 产品子诊断
1. 从现有总诊断中拆出产品侧信号
2. 覆盖：
   - `final_score`
   - `boutique_tag`
   - `problem_map`
   - `subject / description / keywords`
   - `group / category`
   - `gmt_modified`
3. 新增：
   - `docs/framework/WIKA_产品子诊断说明.md`
   - `docs/framework/WIKA_产品子诊断样例.json`

### B. 订单子诊断
1. 从现有总诊断中拆出订单侧信号
2. 覆盖：
   - `logistics`
   - `fund`
   - `service_fee`
   - 订单执行层风险提示
3. 新增：
   - `docs/framework/WIKA_订单子诊断说明.md`
   - `docs/framework/WIKA_订单子诊断样例.json`

### C. 兼容总诊断层
1. 不删除现有 `operations/minimal-diagnostic`
2. 优先复用新的产品/订单子诊断逻辑
3. 若改动风险过高，则至少保持口径一致

## 执行规则
1. 本阶段不追求更完整数据，只拆分现有真实数据
2. 不得虚构 `UV / PV / 曝光 / 点击 / CTR / 来源 / 国家 / 询盘表现`
3. 必须把“能诊断什么”和“还不能诊断什么”明确分开
4. 不得把本阶段误写成“完整经营驾驶舱已完成”

## 完成标准
- 已形成产品子诊断路由并完成线上验收
- 已形成订单子诊断路由并完成线上验收
- 已形成两个子诊断的样例与说明文档
- 现有总诊断层兼容性保持正常
- 已明确写清这仍不是完整经营驾驶舱
- 已更新基线、计划、缺口矩阵、复用清单、候选池、自治推进日志
- 阶段结束后停止，不自动进入下一阶段

## 停止条件
- 产品与订单两个子诊断都已完成最小落地
- 或其中任一拆分存在不可接受的兼容性风险
- 或继续拆分需要引入新的 API 验证

## 交付物
- docs/framework/WIKA_最小经营诊断口径.md
- docs/framework/WIKA_最小经营诊断说明.md
- docs/framework/WIKA_产品子诊断说明.md
- docs/framework/WIKA_产品子诊断样例.json
- docs/framework/WIKA_订单子诊断说明.md
- docs/framework/WIKA_订单子诊断样例.json
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
