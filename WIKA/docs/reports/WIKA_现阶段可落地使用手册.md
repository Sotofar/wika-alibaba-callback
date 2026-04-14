# WIKA 现阶段可落地使用手册

## 1. WIKA 现在是什么

WIKA 现在是一套基于阿里国际站官方只读主线与保守 derived 层构建的经营诊断、行动建议、草稿准备与人工交接系统。

当前已经上线并可直接使用的能力层包括：
- 店铺、产品、订单三层 `management-summary`
- 店铺、产品、订单三层 `minimal-diagnostic`
- 店铺、产品、订单三层 `comparison-summary`
- 统一经营驾驶舱：`business-cockpit`
- 行动中心：`action-center`
- 统一控制台：`operator-console`
- task3 工作台与预览：`product-draft-workbench`、`product-draft-preview`
- task4 工作台与预览：`reply-workbench`、`reply-preview`、`reply-draft`
- task5 工作台与预览：`order-workbench`、`order-preview`、`order-draft`
- 统一任务工作台：`task-workbench`
- 统一预览入口：`preview-center`

当前边界必须明确：
- WIKA 当前是读取、诊断、比较、预览、草稿和人工交接系统，不是平台内自动执行系统
- 当前不做真实商品发布
- 当前不做平台内自动回复
- 当前不做平台内自动创单
- 任务 6 不在当前范围内
- 当前仍不是 full business cockpit

## 2. WIKA 现在能做什么

### 2.1 经营读取与诊断
- 输出店铺经营摘要：流量、曝光、点击、反馈、回复
- 输出产品经营摘要：样本商品表现、内容完整度、质量分数问题
- 输出订单经营摘要：formal_summary、product_contribution、trend_signal
- 输出店铺、产品、订单三层最小诊断
- 输出店铺、产品、订单三层 comparison，对比当前窗口与上一可比窗口

### 2.2 统一消费层
- `business-cockpit`：把三层 summary、comparison、diagnostic 汇总成统一驾驶舱
- `action-center`：把重点问题、优先动作、草稿与工作台入口放到一个动作视图
- `operator-console`：把经营态势、优先动作、task3/4/5 现状放到统一控制台

### 2.3 task3：产品安全草稿链路
- `product-draft-workbench`：给出产品上下文、类目上下文、schema 上下文、素材上下文、缺失项与下一步动作
- `product-draft-preview`：基于输入生成只读预览，提前暴露缺失字段、风险和人工接手点
- 当前能替人完成：草稿准备、字段清单、缺口识别、人工交接前整理

### 2.4 task4：回复草稿链路
- `reply-workbench`：给出流程能力、输入要求、阻塞分类、handoff 能力、质量门槛
- `reply-preview`：基于输入做只读回复预览，提前暴露报价、交期、素材等缺口
- `reply-draft`：生成外部回复草稿与交接包
- 当前能替人完成：上下文整理、草稿预览、回复草稿生成、人工交接提示

### 2.5 task5：订单草稿链路
- `order-workbench`：给出流程能力、输入要求、手工字段系统、handoff 能力、质量门槛
- `order-preview`：基于输入做只读订单草稿预览
- `order-draft`：生成外部订单草稿与交接包
- 当前能替人完成：订单资料整理、字段清单、草稿预览、人工交接准备

## 3. 业务方怎么用

### 3.1 管理层怎么看
- 先看 `operator-console`
- 再看 `business-cockpit`
- 重点关注：当前经营态势、最优先动作、跨层阻塞、当前仍不可见的盲区
- 管理层主要用它做周复盘、优先级排序和人工资源分配

### 3.2 运营怎么用
- 每天先看 `operations/management-summary`
- 再看 `operations/minimal-diagnostic`
- 然后看 `operations/comparison-summary`
- 最后看 `action-center`，确认今天最值得处理的问题
- 运营主要用它做流量变化判断、商品内容整改优先级判断、跨层问题定位

### 3.3 销售 / 跟单怎么用
- 回复相关场景，先看 `reply-workbench`
- 确认输入是否完整后，再跑 `reply-preview`
- 预览通过后，再使用 `reply-draft` 产出外部草稿
- 订单相关场景，先看 `order-workbench`
- 确认客户资料、价格、付款和交期字段后，再跑 `order-preview`
- 预览通过后，再使用 `order-draft`

### 3.4 task3/4/5 的人工接手怎么用
- task3：把 `product-draft-workbench` 和 `product-draft-preview` 暴露的缺失字段补齐后，再进入人工审稿
- task4：把 `reply-preview` 暴露的报价、交期、素材缺口补齐后，再由人工确认正式回复
- task5：把 `order-workbench` 和 `order-preview` 暴露的必填商业字段补齐后，再由人工确认正式创单动作

## 4. 建议使用流程

### 4.1 每日查看顺序
- 先看 `operator-console`
- 再看 `action-center`
- 然后看 `operations/management-summary`
- 再看 `products/management-summary`
- 如有订单波动，再看 `orders/management-summary`
- 如果要找原因，继续看三层 `minimal-diagnostic`
- 如果要判断趋势，继续看三层 `comparison-summary`

### 4.2 每周复盘顺序
- 先看 `business-cockpit`
- 再看 `operator-console`
- 然后对照三层 `comparison-summary`
- 最后结合 `task-workbench` 看 task3/4/5 当前准备度和人工阻塞点

### 4.3 进入 workbench 的场景
- 需要补商品内容、类目属性、schema 字段时，进入 `product-draft-workbench`
- 需要准备回复但上下文还不完整时，进入 `reply-workbench`
- 需要准备订单草稿但商业字段还不完整时，进入 `order-workbench`

### 4.4 只停在 preview 的场景
- 商品信息还不完整，只想先看缺什么时，用 `product-draft-preview`
- 回复内容还未最终确认，只想先看草稿可不可发时，用 `reply-preview`
- 订单字段尚未补齐，只想先看草稿结构是否合理时，用 `order-preview`
- 想一次看 task3/4/5 输入就绪度时，用 `preview-center`

### 4.5 必须人工接手的场景
- 真正的平台内商品发布
- 真正的平台内客户回复
- 真正的平台内创单
- 涉及最终报价、最终交期、付款条件、客户身份绑定的场景
- 涉及当前 unavailable 维度判断的场景

## 5. 现在做不到什么

当前 still unavailable 的关键维度包括：
- 店铺级：`traffic_source`、`country_source`、`quick_reply_rate`
- 产品级：`access_source`、`inquiry_source`、`country_source`、`period_over_period_change`
- 订单级：`country_structure`

这些维度当前做不到，意味着：
- 还不能精确判断流量来自哪里
- 还不能精确判断国家结构
- 还不能把回复效率写成已确认的完整平台指标
- 还不能把产品层 period-over-period 变化写成官方字段

task3/4/5 当前还不是平台内闭环，原因分别是：
- task3：只有安全草稿准备与预览，没有低风险、可回滚的真实发布边界证明
- task4：只有外部回复草稿与预览，没有平台内自动发送闭环
- task5：只有外部订单草稿与预览，没有平台内自动创单闭环

task6 当前明确不在范围内，原因是：
- 本线程不推进真实通知能力
- 不推进 provider 接入、真实送达、外发能力

## 6. 当前边界下最大完成度说明

当前之所以可以说已经达到“当前边界下最大完成度”，原因是：
- 经营读取层已经覆盖店铺、产品、订单三层的当前 official mainline confirmed 能力
- derived consumption layer 已经形成 summary、diagnostic、comparison、cockpit、action-center、operator-console
- task3/4/5 已经形成 workbench、preview、draft/handoff 三层消费链
- 当前剩余问题主要不是消费层缺失，而是 official mainline 缺字段、平台内执行闭环未开放、低风险写侧边界未证明

如果要继续推进，必须增加外部条件：
- 官方主线补齐当前 unavailable 维度
- 提供稳定参数契约、测试对象、readback 和 rollback 条件
- 或明确允许进入低风险写侧边界证明线程

## 7. 业务方使用时必须记住的三条话
- WIKA 现在最擅长的是“读、诊、比、预览、整理、交接”，不是“直接替你点发布/发送/创单”
- 先看控制台和行动中心，再下钻 summary / diagnostic / comparison，不要一开始就钻细节
- task3/4/5 现在的最佳用法是“先让 WIKA 做准备和预览，再由人工完成最后一步”
