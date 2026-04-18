# XD 关键 route 巡检结果

生成时间：2026-04-18T14:57:15.704Z
overall_status=PASS

| name | target | expected | actual | classification | elapsed_ms | next_action |
| --- | --- | --- | --- | --- | --- | --- |
| health | /health | 200 | 200 | PASS_NO_DATA | 514 | 保持每日巡检。 |
| auth-debug | /integrations/alibaba/auth/debug | 200 | 200 | PASS | 327 | 保持每日巡检。 |
| xd-auth-debug | /integrations/alibaba/xd/auth/debug | 200 | 200 | PASS | 513 | 保持每日巡检。 |
| orders-list | /integrations/alibaba/xd/data/orders/list?page_size=1 | 200 | 200 | PASS | 1318 | 保持每日巡检。 |
| orders-detail | /integrations/alibaba/xd/data/orders/detail?e_trade_id=298944806501026817 | 200 | 200 | PASS | 1392 | 保持每日巡检。 |
| products-list | /integrations/alibaba/xd/data/products/list?page_size=1 | 200 | 200 | PASS | 1011 | 保持每日巡检。 |
| products-detail | /integrations/alibaba/xd/data/products/detail?product_id=1601740545697 | 200 | 200 | PASS | 1118 | 保持每日巡检。 |
| products-groups | /integrations/alibaba/xd/data/products/groups?group_id=812751108 | 200 | 200 | PASS | 899 | 保持每日巡检。 |
| products-score | /integrations/alibaba/xd/data/products/score?product_id=1601740545697 | 200 | 200 | PASS | 1090 | 保持每日巡检。 |
| categories-tree | /integrations/alibaba/xd/data/categories/tree?page_size=1 | 200 | 200 | PASS | 912 | 保持每日巡检。 |
| media-list | /integrations/alibaba/xd/data/media/list?page_size=1 | 200 | 200 | PASS | 1121 | 保持每日巡检。 |
| orders-summary-report | /integrations/alibaba/xd/reports/orders/summary | 200 | 404 | SKIPPED_BY_SAFETY | 506 | 维持文件化报告替代，不在 stage31 回头扩 route。 |
| orders-trend-report | /integrations/alibaba/xd/reports/orders/trend | 200 | 404 | SKIPPED_BY_SAFETY | 510 | 维持文件化报告替代，不在 stage31 回头扩 route。 |
| orders-report-consumers | /integrations/alibaba/xd/reports/orders/report-consumers | 200 | 404 | SKIPPED_BY_SAFETY | 327 | 维持文件化报告替代，不在 stage31 回头扩 route。 |
| products-minimal-diagnostic | /integrations/alibaba/xd/reports/products/minimal-diagnostic | 200 | 200 | PASS | 6505 | 保持每日巡检。 |
| orders-minimal-diagnostic | /integrations/alibaba/xd/reports/orders/minimal-diagnostic | 200 | 200 | PASS | 10403 | 保持每日巡检。 |
| operations-minimal-diagnostic | /integrations/alibaba/xd/reports/operations/minimal-diagnostic | 200 | 200 | PASS | 13297 | 保持每日巡检。 |
| stable-direct | alibaba.seller.order.get | 200 | credentials_unavailable | SKIPPED_BY_SAFETY | 0 | 当前先沿用 stage30 已验证 direct-method 证据，不在 stage31 额外解阻本地 token。 |

