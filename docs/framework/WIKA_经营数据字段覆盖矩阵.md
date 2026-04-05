# WIKA_经营数据字段覆盖矩阵

| 分类桶 | 维度 | 目标字段 |
| --- | --- | --- |
| public official entry exists but AUTH_BLOCKED in current tenant | 店铺级 | UV(visitor) |
| public official entry exists but AUTH_BLOCKED in current tenant | 店铺级 | PV/imps |
| public official entry exists but AUTH_BLOCKED in current tenant | 店铺级 | 点击(clk) |
| public official entry exists but AUTH_BLOCKED in current tenant | 店铺级 | CTR(clk_rate) |
| public official entry exists but AUTH_BLOCKED in current tenant | 店铺级 | 询盘表现(fb) |
| public official entry exists but AUTH_BLOCKED in current tenant | 店铺级 | 响应相关(reply) |
| public official entry exists but AUTH_BLOCKED in current tenant | 产品级 | 曝光(impression) |
| public official entry exists but AUTH_BLOCKED in current tenant | 产品级 | 点击(click) |
| public official entry exists but AUTH_BLOCKED in current tenant | 产品级 | 访客(visitor) |
| public official entry exists but AUTH_BLOCKED in current tenant | 产品级 | 询盘(fb) |
| public official entry exists but AUTH_BLOCKED in current tenant | 产品级 | 订单(order) |
| public official entry exists but AUTH_BLOCKED in current tenant | 产品级 | bookmark |
| public official entry exists but AUTH_BLOCKED in current tenant | 产品级 | compare |
| public official entry exists but AUTH_BLOCKED in current tenant | 产品级 | share |
| public official entry exists but AUTH_BLOCKED in current tenant | 产品级 | 关键词来源(keyword_effects) |
| not found in current response / not yet evidenced | 店铺级 | 流量来源 |
| not found in current response / not yet evidenced | 店铺级 | 国家来源 |
| not found in current response / not yet evidenced | 店铺级 | 快速回复率 |
| not found in current response / not yet evidenced | 产品级 | 访问来源 |
| not found in current response / not yet evidenced | 产品级 | 询盘来源 |
| not found in current response / not yet evidenced | 产品级 | 国家来源 |
| not found in current response / not yet evidenced | 产品级 | 近周期变化 |
| not found in current response / not yet evidenced | 订单级 | 正式汇总 |
| not found in current response / not yet evidenced | 订单级 | 国家结构 |
| not found in current response / not yet evidenced | 订单级 | 产品贡献 |
| only derivable from existing order APIs | 订单级 | 订单趋势（仅基于 order.list.create_date） |

## 边界说明

- 本轮没有新增任何 Alibaba API 验证。
- `AUTH_BLOCKED` 只表示公开官方入口存在，但当前 tenant 没有权限。
- `only derivable from existing order APIs` 当前只证明到订单趋势，不等于完整订单经营汇总。
