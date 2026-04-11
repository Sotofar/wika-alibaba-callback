# WIKA 产品表现字段映射（第一版）

| 中文字段 | 标准字段名 | 类型 | 是否必填 | 当前是否已验证 | 是否可用于报告 | 是否可用于建议生成 | 备注 |
|---|---|---|---|---|---|---|---|
| 账号 | `account_key` | string | 是 | 是 | 是 | 是 | 当前固定为 `wika` |
| 产品ID | `product_id` | string | 是 | 否 | 是 | 是 | 待接入 |
| 产品名称 | `product_name` | string | 是 | 否 | 是 | 是 | 待接入 |
| 产品分组/类目 | `product_group` | string | 否 | 否 | 是 | 是 | 待接入 |
| 在线状态 | `online_status` | string | 否 | 否 | 是 | 是 | 待接入 |
| 上架时间 | `created_at` | string | 否 | 否 | 是 | 否 | 待接入 |
| 更新时间 | `updated_at` | string | 否 | 否 | 是 | 否 | 待接入 |
| 曝光 | `impressions` | number | 否 | 否 | 是 | 是 | 待接入 |
| 点击 | `clicks` | number | 否 | 否 | 是 | 是 | 待接入 |
| 点击率 | `ctr` | number | 否 | 否 | 是 | 是 | 待接入 |
| 访客 | `visitors` | number | 否 | 否 | 是 | 是 | 待接入 |
| 询盘 | `inquiries` | number | 否 | 否 | 是 | 是 | 待接入 |
| 询盘率 | `inquiry_rate` | number | 否 | 否 | 是 | 是 | 待接入 |
| 订单数 | `orders` | number | 否 | 否 | 是 | 是 | 后续可选 |
| 支付买家数 | `paid_buyers` | number | 否 | 否 | 是 | 是 | 后续可选 |
| 成交金额 | `gmv` | number | 否 | 否 | 是 | 是 | 后续可选 |
| 近7天趋势 | `trend_7d` | array | 否 | 否 | 是 | 是 | 待接入 |
| 近30天趋势 | `trend_30d` | array | 否 | 否 | 是 | 是 | 待接入 |

## 当前已验证字段

当前这一模块里，真正已验证的只有：

- `account_key`

其他业务字段都还没有真实读到。
