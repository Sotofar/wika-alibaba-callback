# WIKA 坏报告示例

## 这是一份不合格报告

下面这份内容故意展示“字段很多、看起来很忙、实际上完全不能拿去开会”的坏写法。

---

本周系统调用了很多 route：
- `/integrations/alibaba/wika/reports/operations/management-summary`
- `/integrations/alibaba/wika/reports/products/management-summary`
- `/integrations/alibaba/wika/reports/orders/management-summary`
- `/integrations/alibaba/wika/reports/business-cockpit`
- `/integrations/alibaba/wika/reports/action-center`
- `/integrations/alibaba/wika/reports/operator-console`

当前字段如下：
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

当前 unavailable 如下：
- `traffic_source`
- `country_source`
- `quick_reply_rate`
- `access_source`
- `inquiry_source`
- `country_source`
- `period_over_period_change`
- `country_structure`

当前 route 也很多：
- `action-center`
- `operator-console`
- `task-workbench`
- `preview-center`
- `reply-draft`
- `order-draft`

当前 comparison 结果：
```json
{
  "visitor_delta": -3,
  "imps_delta": 190,
  "clk_delta": 13,
  "fb_delta": -1,
  "reply_trend": "down"
}
```

产品层也有很多问题：
- `missing_description_count = 5`
- `missing_keywords_count = 8`
- `low_score_count = 1`
- `ungrouped_count = 1`

订单层也有问题：
- `total_order_count = 122`
- `observed_trade_count = 3`
- `logistics_status_distribution = UNDELIVERED:3`

总之，系统现在能力很多，后面继续优化就好。

---

## 这份坏报告为什么不能交付

- 没有先说结论。
- 没有说明最严重的问题是什么。
- 没有说明为什么重要。
- 没有说明先做哪三件事。
- 没有执行人。
- 没有人工接手说明。
- 没有把 unavailable 对判断的影响说清楚。
- 直接把 JSON 塞进正文。
- 把系统能力清单和经营判断混在一起。
- 读者看完只知道“系统很多、字段很多”，不知道“现在该干什么”。
