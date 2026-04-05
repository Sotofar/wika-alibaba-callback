# WIKA 订单子诊断说明

更新时间：2026-04-05

## 当前路由
- `/integrations/alibaba/wika/reports/orders/minimal-diagnostic`

## 目标
这条路由只聚焦 `WIKA` 订单执行层的最小经营诊断，严格基于已经上线并已线上验证的订单读侧原始数据输出可追溯结论，不引入任何新的平台经营指标。

## 当前使用的数据源
- `orders/list`
  - 提供采样订单池与创建时间窗口
- `orders/fund`
  - 提供 `fund_pay_list`、`service_fee`
- `orders/logistics`
  - 提供 `logistic_status`、`shipping_order_list`

## 当前可稳定输出的诊断维度

### 物流状态摘要
- 原始字段：
  - `value.logistic_status`
  - `value.shipping_order_list`
- 当前输出：
  - `logistics_summary`
- 当前能直接判断：
  - 当前样本主要物流状态
  - 是否存在物流明细缺失导致的执行风险

### 资金可见信号
- 原始字段：
  - `value.fund_pay_list`
  - `value.service_fee`
- 当前输出：
  - `fund_signal_summary`
- 当前能直接判断：
  - 资金字段是否可见
  - 服务费字段是否可见

### 订单执行风险
- 原始字段：
  - `value.logistic_status`
  - `value.shipping_order_list`
  - `value.service_fee`
- 当前输出：
  - `operational_risks`
  - `diagnostic_findings`

## 当前样例里的真实信号
- 当前订单样本总量口径：`total_count = 120`
- 当前采样物流状态集中在：
  - `UNDELIVERED = 5`
- 当前采样资金字段可见：
  - `fund_value_visible_count = 5`
  - `service_fee_visible_count = 5`
  - `fund_pay_list_visible_count = 5`

## 强结论与弱建议

### 强结论
以下结论都必须直接回溯到真实字段：
- 当前采样订单的物流状态分布
- 当前采样订单是否可看到资金字段
- 当前采样订单是否存在运单信息缺失风险

### 弱建议
以下建议必须明确标为“需要更多数据后再做”：
- 完整订单趋势判断
- 国家结构判断
- 产品贡献判断
- 金额序列判断

## 当前仍缺的关键数据
- 完整金额趋势
- 国家结构
- 产品贡献
- 更多订单样本下的长期执行变化

## 当前一句话边界
当前订单子诊断已经能稳定输出“物流摘要 + 资金可见信号 + 执行层风险提示”，但它不是完整订单经营驾驶舱。
