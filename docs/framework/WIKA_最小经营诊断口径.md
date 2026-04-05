# WIKA_最小经营诊断口径

更新时间：2026-04-05

## 一句话定义
当前最小经营诊断层只基于已经上线并已线上验证的 `WIKA` 真实读侧数据，输出“产品质量与结构 + 订单执行信号”的最小可信诊断，不覆盖流量、曝光、点击、CTR、来源、国家和询盘经营分析。

## 当前路由分层
- 总报告：
  - `/integrations/alibaba/wika/reports/operations/minimal-diagnostic`
- 产品子诊断：
  - `/integrations/alibaba/wika/reports/products/minimal-diagnostic`
- 订单子诊断：
  - `/integrations/alibaba/wika/reports/orders/minimal-diagnostic`

当前关系是：
- 总报告负责聚合产品与订单两个子诊断口径
- 子诊断负责给出更细的模块内结论
- 三者都不等于完整经营驾驶舱

## 当前使用的真实数据源
- `/integrations/alibaba/wika/data/products/list`
- `/integrations/alibaba/wika/data/products/score`
- `/integrations/alibaba/wika/data/products/detail`
- `/integrations/alibaba/wika/data/products/groups`
- `/integrations/alibaba/wika/data/orders/list`
- `/integrations/alibaba/wika/data/orders/fund`
- `/integrations/alibaba/wika/data/orders/logistics`
- `/integrations/alibaba/wika/reports/products/management-summary`

## 当前可直接回答的问题

### 产品侧
- 当前样本产品的质量分大致分布如何
- 当前样本产品里 boutique_tag 覆盖情况如何
- 当前样本产品是否存在明显的详情缺失、关键词缺失
- 当前样本产品最近更新时间是否明显老化
- 当前样本产品是否存在未分组、类目集中度过高等结构问题

### 订单侧
- 当前样本订单的物流状态分布是什么
- 当前样本订单是否能看到 `fund_pay_list` 和 `service_fee`
- 当前样本订单里是否存在需要人工重点关注的执行风险

### 可直接产出的最小建议
- 哪些产品应优先补详情
- 哪些产品应优先补关键词
- 哪些产品应优先补分组结构
- 当前订单执行层是否需要人工关注物流推进

## 当前不能回答的问题
- 全店 UV / PV
- 曝光 / 点击 / CTR
- 流量来源 / 关键词来源 / 国家来源
- 询盘表现 / 回复率 / 快速回复率
- 完整订单金额趋势
- 订单国家结构
- 产品贡献 / 热门产品贡献
- 完整经营驾驶舱级别的增长判断

## 当前诊断口径的采样边界
- 产品快照：默认按 `products/list` 单页采样
- 产品质量分：默认只取前一小批产品做 `products/score`
- 产品详情完整度：默认只取前一小批产品做 `products/detail`
- 订单执行信号：默认只取前一小批订单做 `orders/fund` 与 `orders/logistics`

这意味着：
- 当前诊断更适合回答“样本里有什么可立即处理的问题”
- 不适合回答“全店经营趋势是否改善”

## 强结论与弱结论的划分

### 强结论
以下结论只要出现在报告里，都必须直接对应真实字段：
- `result.final_score`
- `result.boutique_tag`
- `product.description`
- `product.keywords`
- `group_name`
- `category_id`
- `value.logistic_status`
- `value.fund_pay_list`
- `value.service_fee`

### 弱建议
以下建议允许输出，但必须显式标明“需要更多数据后再做”：
- 流量增长判断
- 渠道效率判断
- 国家市场优先级判断
- 完整订单经营趋势判断

## 当前口径一句话结论
当前最小经营诊断层已经能稳定回答“产品质量与结构问题、订单执行可见风险”，但还不能替代完整经营分析。
