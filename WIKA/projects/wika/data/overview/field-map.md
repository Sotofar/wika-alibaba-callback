# WIKA 店铺概览字段映射（第一版）

| 中文字段 | 标准字段名 | 类型 | 是否必填 | 当前是否已验证 | 是否可用于报告 | 是否可用于建议生成 | 备注 |
|---|---|---|---|---|---|---|---|
| 账号 | `account_key` | string | 是 | 是 | 是 | 是 | 当前固定为 `wika` |
| 时间范围 | `date_range` | string | 是 | 否 | 是 | 是 | 待真实数据源接入 |
| 店铺整体曝光 | `store_impressions` | number | 否 | 否 | 是 | 是 | 待接入 |
| 店铺整体点击 | `store_clicks` | number | 否 | 否 | 是 | 是 | 待接入 |
| 店铺点击率 | `store_ctr` | number | 否 | 否 | 是 | 是 | 待接入 |
| 店铺访客 | `store_visitors` | number | 否 | 否 | 是 | 是 | 待接入 |
| 店铺询盘数 | `store_inquiries` | number | 否 | 否 | 是 | 是 | 待接入 |
| 店铺询盘率 | `store_inquiry_rate` | number | 否 | 否 | 是 | 是 | 待接入 |
| 流量来源 | `traffic_sources` | array | 否 | 否 | 是 | 是 | 待接入 |
| 访客来源国家 | `visitor_countries` | array | 否 | 否 | 是 | 是 | 待接入 |
| 近7天趋势 | `trend_7d` | array | 否 | 否 | 是 | 是 | 待接入 |
| 近30天趋势 | `trend_30d` | array | 否 | 否 | 是 | 是 | 待接入 |
| 近90天趋势 | `trend_90d` | array | 否 | 否 | 是 | 是 | 待接入 |

## 当前已验证字段

当前这一模块里，真正已验证的只有：

- `account_key`

其他业务字段都还没有真实读到。
