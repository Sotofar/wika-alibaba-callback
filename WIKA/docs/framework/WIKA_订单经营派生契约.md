# WIKA_订单经营派生契约

更新时间：2026-04-11

## 当前范围
- 本文只收口 WIKA 订单级 derived 经营维度。
- 只复用现有正式只读链：
  - `/integrations/alibaba/wika/data/orders/list`
  - `/integrations/alibaba/wika/data/orders/detail`
  - `/integrations/alibaba/wika/data/orders/fund`
  - `/integrations/alibaba/wika/data/orders/logistics`
- 不新增 Alibaba API 探索，不新增写动作。

## 订单派生字段契约表

| derived_dimension | source_route_chain | required_fields | derivation_rule | current_evidence_strength | unavailable_dependencies | boundary_statement |
| --- | --- | --- | --- | --- | --- | --- |
| `formal_summary` | `orders/list -> orders/detail -> orders/fund -> orders/logistics` | `orders/list.response_meta.total_count`, `items.trade_id`, `detail.item.amount`, `detail.item.product_total_amount`, `detail.item.shipment_fee`, `detail.item.trade_status`, `fund.value.service_fee`, `logistics.value.logistic_status` | 先从 `orders/list` 取受控 trade 样本，再聚合 detail/fund/logistics 的金额、状态与执行信号 | strong：stage22 evidence + stage23 local contract | 不具备全历史窗口过滤；不是官方完整订单报表 | 只能写成 derived / conservative / partial summary，不能冒充官方完整订单经营报表 |
| `product_contribution` | `orders/detail` | `detail.item.order_products[].product_id`, `quantity`, `unit_price` | 按 trade 样本聚合 occurrence-based / quantity-based 贡献；当 `unit_price` 可用时仅做 estimated amount 辅助 | strong：stage22 evidence + stage23 local contract | 当前不是全店全历史；amount 仅能按 quantity x unit_price 估算 | 必须显式写清 contribution_basis；不能写成完整 GMV 贡献报表 |
| `trend_signal` | `orders/list` | `items.create_date` | 只按当前样本窗口的 `create_date` 做按日计数 | medium：已有 stage17 partial derived proof + stage23 local contract | 缺少不受样本限制的完整历史窗口 | 只能写成 sample/window based trend signal |
| `country_structure` | 当前无稳定 route chain | 当前 public route 未稳定暴露 `shipping_address.country` 或 `buyer.country` 实值 | 不成立 | blocked | 稳定 country 实值 | 当前保持 unavailable，不得脑补 |

## 当前固定边界
- `formal_summary` 与 `product_contribution` 当前只证明“现有只读链足以保守派生”。
- `trend_signal` 当前只证明 sample/window based 计数成立。
- `country_structure` 当前仍 unavailable。
- not task 1 complete
- not task 2 complete
- no write action attempted
- WIKA-only thread
- XD untouched in this round
- not full business cockpit
