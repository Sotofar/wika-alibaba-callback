# WIKA 坏报告示例

## 这是一份不合格报告

下面这份内容故意展示“看起来很多、实际上没用”的坏写法。

---

本周我们看了很多 route：
- `/integrations/alibaba/wika/reports/operations/management-summary`
- `/integrations/alibaba/wika/reports/products/management-summary`
- `/integrations/alibaba/wika/reports/orders/management-summary`
- `/integrations/alibaba/wika/reports/business-cockpit`
- `/integrations/alibaba/wika/reports/action-center`
- `/integrations/alibaba/wika/reports/operator-console`

当前拿到的字段包括：
- `visitor`
- `imps`
- `clk`
- `clk_rate`
- `fb`
- `reply`
- `click`
- `impression`
- `visitor`
- `fb`
- `order`
- `bookmark`
- `compare`
- `share`
- `keyword_effects`
- `formal_summary`
- `product_contribution`
- `trend_signal`

当前 unavailable：
- `traffic_source`
- `country_source`
- `quick_reply_rate`
- `access_source`
- `inquiry_source`
- `country_source`
- `period_over_period_change`
- `country_structure`

当前 comparison 如下：
- visitor delta = -3
- imps delta = 190
- clk delta = 13
- fb delta = -1
- reply trend = down

产品层问题很多：
- missing_description_count = 5
- missing_keywords_count = 8
- low_score_count = 1
- ungrouped_count = 1

订单层也有一些问题：
- total_order_count = 122
- observed_trade_count = 3
- logistics_status_distribution = `UNDELIVERED:3`

task3 / task4 / task5 当前也有很多输出：
- workbench
- preview
- draft

总之系统现在能力很多，还要继续努力。

---

## 这份坏报告为什么不能交付

- 没有先说结论。
- 没有告诉读者最严重的问题是什么。
- 没有告诉读者为什么重要。
- 没有告诉读者先做哪三件事。
- 没有人工接手说明。
- unavailable 只是堆出来，没有解释影响。
- 系统能力说明和经营结论混在一起。
- 读者看完只知道“字段很多”，不知道“怎么行动”。
