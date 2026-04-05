# WIKA_最小经营诊断说明

更新时间：2026-04-05

## 当前路由
- `/integrations/alibaba/wika/reports/operations/minimal-diagnostic`
- `/integrations/alibaba/wika/reports/products/minimal-diagnostic`
- `/integrations/alibaba/wika/reports/orders/minimal-diagnostic`

## 目标
这些路由都不是完整经营驾驶舱，而是把当前已经上线、已经真实可读的 WIKA 产品与订单原始数据，整理成一层可追溯、可解释、可直接执行的最小经营诊断。

其中：
- `operations/minimal-diagnostic`：总报告
- `products/minimal-diagnostic`：产品子诊断
- `orders/minimal-diagnostic`：订单子诊断

## 当前使用的数据源

### 产品侧
- `products/list`
  - 提供产品主数据快照、分组、类目、状态、更新时间
- `products/score`
  - 提供 `final_score`、`boutique_tag`、`problem_map`
- `products/detail`
  - 提供 `subject`、`description`、`keywords`、`gmt_modified`
- `products/management-summary`
  - 复用现有产品管理摘要口径

### 订单侧
- `orders/list`
  - 提供采样订单池和时间范围
- `orders/fund`
  - 提供 `fund_pay_list`、`service_fee` 等资金可见信号
- `orders/logistics`
  - 提供 `logistic_status`、`shipping_order_list`

## 结论如何从原始字段推导

### 产品质量分概况
- 原始字段：
  - `result.final_score`
  - `result.boutique_tag`
  - `result.problem_map`
- 推导方式：
  - 统计评分均值、最小值、最大值
  - 统计 boutique_tag 覆盖
  - 归纳高频 problem_map 问题项

### 内容完整度问题
- 原始字段：
  - `product.subject`
  - `product.description`
  - `product.keywords`
  - `product.gmt_modified`
- 推导方式：
  - 判断标题、详情、关键词是否缺失
  - 计算更新时间是否老化

### 结构提示
- 原始字段：
  - `group_name`
  - `category_id`
  - `display`
  - `status`
- 推导方式：
  - 统计未分组数量
  - 统计类目覆盖分布
  - 给出分组/类目结构提示

### 订单执行风险
- 原始字段：
  - `value.logistic_status`
  - `value.shipping_order_list`
  - `value.fund_pay_list`
  - `value.service_fee`
- 推导方式：
  - 统计物流状态分布
  - 判断资金字段是否可见
  - 标记缺少物流明细或异常执行信号的订单

## 强结论与弱建议

### 强结论
强结论必须能直接回溯到真实字段，例如：
- 样本产品有多少个缺 description
- 样本产品有多少个缺 keywords
- 当前样本产品分组是否缺失
- 当前采样订单的物流状态是否集中在某一状态
- fund/service_fee 是否可见

### 弱建议
弱建议允许输出，但必须显式说明“需要更多数据后再做”，例如：
- 流量增长判断
- 渠道质量判断
- 国家市场判断
- 完整订单经营趋势判断

## 当前样例中已经看到的真实信号
- 样本产品质量分为五分制，当前采样均值约 `4.96`
- 当前采样 `boutique_tag` 覆盖为全量可见
- 当前采样存在详情缺失和关键词缺失
- 当前采样存在未分组产品
- 当前采样订单物流状态可见，且资金字段可见
- 当前产品子诊断已可单独输出质量分、内容完整度、结构提示
- 当前订单子诊断已可单独输出物流摘要、资金可见信号与执行层风险提示

## 当前仍缺的关键经营数据
- `UV`
- `PV`
- 曝光
- 点击
- `CTR`
- 流量来源
- 关键词来源
- 国家来源
- 询盘表现
- 完整订单金额趋势
- 国家结构
- 产品贡献

## 为什么它还不是完整经营驾驶舱
因为当前诊断层只覆盖：
- 产品质量与结构
- 订单执行信号

但还没有覆盖：
- 店铺经营指标
- 产品表现指标
- 渠道来源
- 国家来源
- 询盘表现
- 完整订单经营趋势

所以当前最准确的表述是：
- `最小经营诊断层已成立`
- 但 `完整经营驾驶舱未完成`
