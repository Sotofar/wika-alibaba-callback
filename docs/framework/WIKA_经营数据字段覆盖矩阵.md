# WIKA_经营数据字段覆盖矩阵

更新时间：2026-04-10

本矩阵已从旧的“以 `AUTH_BLOCKED` 为主”切换到阶段 19 的 post-grant 真实结果。

| 维度 | 目标字段 | 当前标注 | 证据来源 |
| --- | --- | --- | --- |
| 店铺级（官方字段） | visitor | confirmed but blocked no longer | `overview.indicator.basic.get -> visitor` |
| 店铺级（官方字段） | imps | confirmed but blocked no longer | `overview.indicator.basic.get -> imps` |
| 店铺级（官方字段） | clk | confirmed but blocked no longer | `overview.indicator.basic.get -> clk` |
| 店铺级（官方字段） | clk_rate | confirmed but blocked no longer | `overview.indicator.basic.get -> clk_rate` |
| 店铺级（官方字段） | fb | confirmed but blocked no longer | `overview.indicator.basic.get -> fb` |
| 店铺级（官方字段） | reply | confirmed but blocked no longer | `overview.indicator.basic.get -> reply` |
| 店铺级（业务映射） | UV ~= visitor | business mapping pending | 官方返回 `visitor`，但当前不直接断言业务 UV 已完全等价 |
| 店铺级（业务映射） | PV | not yet evidenced | 当前只确认 `imps/exposure`，不直接断言 PV |
| 店铺级（业务映射） | broad response-rate | not yet evidenced | 当前只确认 `reply` 相关指标，建议使用 `reply-related metric / recent first-reply-rate` 表述 |
| 店铺级 | 流量来源 | not found in current response | `overview.indicator.basic.get extra_fields.source_related=[]` |
| 店铺级 | 国家来源 | not found in current response | `overview.indicator.basic.get extra_fields.country_related=[]` |
| 店铺级 | 快速回复率 | not found in current response | `overview.indicator.basic.get extra_fields.quick_reply_related=[]` |
| 产品级 | 曝光 | confirmed but blocked no longer | `self.product.get -> impression` |
| 产品级 | 点击 | confirmed but blocked no longer | `self.product.get -> click` |
| 产品级 | CTR | derived field | `click + impression` 可派生 |
| 产品级 | 访客 | confirmed but blocked no longer | `self.product.get -> visitor` |
| 产品级 | 询盘 | confirmed but blocked no longer | `self.product.get -> fb` |
| 产品级 | 订单 | confirmed but blocked no longer | `self.product.get -> order` |
| 产品级 | bookmark | confirmed but blocked no longer | `self.product.get -> bookmark` |
| 产品级 | compare | confirmed but blocked no longer | `self.product.get -> compare` |
| 产品级 | share | confirmed but blocked no longer | `self.product.get -> share` |
| 产品级 | 关键词来源 | confirmed but blocked no longer | `self.product.get -> keyword_effects` |
| 产品级 | 访问来源 | not found in current response | `self.product.get extra_fields.source_related=[]` |
| 产品级 | 询盘来源 | not found in current response | 当前响应未见公开字段覆盖 |
| 产品级 | 国家来源 | not found in current response | `self.product.get extra_fields.country_related=[]` |
| 产品级 | 近周期变化 | not found in current response | `self.product.get extra_fields.trend_related=[]` |
| 订单级 | 正式汇总 | not yet evidenced | 本轮未涉及订单经营汇总补齐 |
| 订单级 | 趋势 | derived field | 仍仅基于 `order.list.create_date` |
| 订单级 | 国家结构 | not yet evidenced | 本轮未新增订单国家结构证据 |
| 订单级 | 产品贡献 | not yet evidenced | 本轮未新增订单产品贡献证据 |

## 真实窗口补充

### 店铺级 overview 可用窗口
- `2026-03-29 -> 2026-04-04`
- `2026-03-22 -> 2026-03-28`
- `2026-03-15 -> 2026-03-21`
- `2026-03-08 -> 2026-03-14`

### 产品级 self.product 可用窗口
- `day`: `2026-03-10 -> 2026-04-08`
- `week`: `2026-03-08 -> 2026-04-04`
- `month`: `2026-03-01 -> 2026-03-31`

## 边界说明
- 本轮没有新增任何 Alibaba API 验证范围
- 本轮没有推进任何写侧动作
- 真实字段已返回，不等于 task 1 complete
- 真实字段已返回，不等于 task 2 complete
- 当前线程只处理 WIKA
- 当前轮次没有更新或推进任何 XD 结果
