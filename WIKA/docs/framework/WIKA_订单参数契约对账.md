# WIKA_订单参数契约对账

更新时间：2026-04-05

## 文档定位

本文件只收口两件事：

- 为什么 `/orders/list` 能稳定返回真实数据
- 为什么阶段 17 中 `order.get / fund.get / logistics.get` 在 public list `trade_id` 链路上统一落到参数拒绝

## 当前总论

- 本轮没有新增任何 Alibaba API 验证，只围绕阶段 17 已验证方法做复核与对账。
- 当前唯一稳定成立的只读订单入口是 `/integrations/alibaba/wika/data/orders/list`。
- 阶段 17 使用的 `items[].trade_id` 为遮罩值，不能直接当作 `e_trade_id` 复用到 `detail / fund / logistics`。
- 当前仍不能证明 public 只读链路里存在可直接复用的未遮罩订单标识。

## 参数契约矩阵

| route name | downstream Alibaba method | expected params | identifier shape | identifier source | stage-17 validation input | mismatch finding | current conclusion | next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/integrations/alibaba/wika/data/orders/list` | `alibaba.seller.order.list` | `role`、`start_page`、`page_size`、`status`、`sales_man_login_id` | N/A；当前 tenant 返回遮罩 `trade_id` | `response_meta + items[].trade_id` | `role/start_page/page_size` 为主，另做过近期时间窗口尝试 | `SCRIPT_PARAM_NAME_MISMATCH` | `READ_ONLY_ROUTE_CONFIRMED_WORKING` | 保持 list 为已确认只读 route；若未来要补日期窗口契约，只能基于明确官方参数证据重开 |
| `/integrations/alibaba/wika/data/orders/detail` | `alibaba.seller.order.get` | `e_trade_id` | 需要未遮罩、可复用的 `e_trade_id` | 当前 route 仅接受外部 query param，未做内部 remap | `e_trade_id` 直接取自阶段 17 的 `items[].trade_id` | `SCRIPT_ID_SOURCE_MISMATCH` | `MASKED_TRADE_ID_NOT_REUSABLE` | 不硬修 route；只有在证明存在可复用未遮罩订单标识后才重开 |
| `/integrations/alibaba/wika/data/orders/fund` | `alibaba.seller.order.fund.get` | `e_trade_id`、`data_select` | 需要未遮罩、可复用的 `e_trade_id` | 当前 route 仅接受外部 query param，未做内部 remap | `e_trade_id` 直接取自阶段 17 的 `items[].trade_id`，并补 `data_select` | `SCRIPT_ID_SOURCE_MISMATCH` | `MASKED_TRADE_ID_NOT_REUSABLE` | 维持 contract unresolved 状态，等待可复用标识证据 |
| `/integrations/alibaba/wika/data/orders/logistics` | `alibaba.seller.order.logistics.get` | `e_trade_id`、`data_select` | 需要未遮罩、可复用的 `e_trade_id` | 当前 route 仅接受外部 query param，未做内部 remap | `e_trade_id` 直接取自阶段 17 的 `items[].trade_id`，并补 `data_select` | `SCRIPT_ID_SOURCE_MISMATCH` | `MASKED_TRADE_ID_NOT_REUSABLE` | 维持 contract unresolved 状态，等待可复用标识证据 |

## 逐 route 结论

### `/integrations/alibaba/wika/data/orders/list`

- downstream method：`alibaba.seller.order.list`
- 当前结论：`READ_ONLY_ROUTE_CONFIRMED_WORKING`
- 说明：该 route 已可稳定提供订单列表与窗口化读取，但返回的是遮罩后的 `trade_id`

### `/integrations/alibaba/wika/data/orders/detail`

- downstream method：`alibaba.seller.order.get`
- 当前结论：`MASKED_TRADE_ID_NOT_REUSABLE`
- 说明：`items[].trade_id` 不能直接充当 `e_trade_id`

### `/integrations/alibaba/wika/data/orders/fund`

- downstream method：`alibaba.seller.order.fund.get`
- 当前结论：`MASKED_TRADE_ID_NOT_REUSABLE`
- 说明：`data_select` 可构造，但 `e_trade_id` 仍不成立

### `/integrations/alibaba/wika/data/orders/logistics`

- downstream method：`alibaba.seller.order.logistics.get`
- 当前结论：`MASKED_TRADE_ID_NOT_REUSABLE`
- 说明：与 `fund` 同样卡在可复用标识层

## 最小订单趋势派生证明

- signal type：`partial_derived_signal`
- derived from：`alibaba.seller.order.list.create_date`
- 当前只证明订单创建量趋势可由现有官方交易 list 接口部分派生
- 不能扩写成完整订单经营汇总
- 不能扩写成国家结构
- 不能扩写成完整产品贡献报表

证据文件：

- `WIKA/docs/framework/evidence/wika-order-trend-partial-derived-sample.json`

## 边界说明

- 当前不是 task 1 complete，也不是 task 2 complete。
- 当前没有新增任何平台内写动作。
- 当前不是平台内闭环，只是在收口参数契约歧义。
