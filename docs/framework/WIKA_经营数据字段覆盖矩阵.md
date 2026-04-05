# WIKA_经营数据字段覆盖矩阵

| 维度 | 目标字段 | 状态 | 来源 | 说明 |
| --- | --- | --- | --- | --- |
| 店铺级 | UV | auth/capability blocked | - | 当前只把 visitor 视为 UV，不把 imps 视为 PV。 |
| 店铺级 | PV | auth/capability blocked | - | 当前响应里可见 imps，但未确认其等同 PV。 |
| 店铺级 | 流量来源 | auth/capability blocked | - | 当前未见公开 source/traffic 字段时不脑补。 |
| 店铺级 | 国家来源 | auth/capability blocked | - | 当前未把任意 country 字段脑补为访客国家来源。 |
| 店铺级 | 询盘表现 | auth/capability blocked | - | 当前只确认 fb 可用，不外推为完整询盘漏斗。 |
| 店铺级 | 响应率 | auth/capability blocked | - | 当前 reply 更像回复相关计数，不等同公开响应率字段。 |
| 店铺级 | 快速回复率 | auth/capability blocked | - | 当前真实返回未见 quick reply 相关公开字段。 |
| 产品级 | 曝光 | auth/capability blocked | - | - |
| 产品级 | 点击 | auth/capability blocked | - | - |
| 产品级 | CTR | auth/capability blocked | - | 当前未见公开 CTR 字段时，只做派生，不冒充官方字段。 |
| 产品级 | 访问来源 | auth/capability blocked | - | - |
| 产品级 | 关键词来源 | auth/capability blocked | - | - |
| 产品级 | 询盘来源 | auth/capability blocked | - | 当前真实返回未见 inquiry source 公开字段。 |
| 产品级 | 国家来源 | auth/capability blocked | - | - |
| 产品级 | 近周期变化 | auth/capability blocked | - | 当前未见公开环比/同比字段时不脑补。 |
| 订单级 | 正式汇总 | not found in current response | - | - |
| 订单级 | 趋势 | derived field | derived from order.list.create_date | - |
| 订单级 | 国家结构 | not found in current response | - | 当前样本未稳定返回 buyer.country 或 shipping country。 |
| 订单级 | 产品贡献 | not found in current response | - | - |
