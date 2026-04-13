# WIKA 订单草稿链路说明

更新时间：2026-04-05

## 当前定位

当前订单草稿链路的定位是：

- 只生成 `外部结构化订单草稿`
- 不触发平台内订单创建
- 不触发真实信保下单

当前不能误写成：

- 平台内订单已起草成功
- 平台内 draft 已创建成功
- 已进入真实创单闭环

## 为什么当前只能做外部订单草稿

### 1. create 入口的真实结论

`alibaba.trade.order.create` 已经证明：

- 能在 production 下真实走到 `/sync + access_token + sha256`
- 当前用明显不完整 payload 时，会返回 `MissingParameter`

这说明：

- 已经过授权层
- 已经进入业务参数校验层

但当前仍不能证明：

- 存在官方安全草稿模式
- 存在可回滚、无成交副作用的 create 边界
- 可以继续做真实平台创单验证

### 2. 当前最稳的低风险只读证据

当前只拿到了一个真正低风险、且直接与订单起草相关的只读入口：

- `alibaba.seller.trade.query.drafttype`

它只能说明：

- 当前卖家支持哪些订单起草类型权限

它不能说明：

- 平台内 draft 已经可创建
- 平台内订单已能安全生成

## 当前草稿链路输出什么

当前 helper：

- [alibaba-order-drafts.js](../../../shared/data/modules/alibaba-order-drafts.js)

输出的是一份结构化外部草稿，至少包含：

1. 买家占位信息
2. 产品 / SKU / 数量占位信息
3. 价格条目占位
4. 交期 / 物流 / 付款条目占位
5. 自动生成字段清单
6. 人工必补字段清单
7. 为什么当前不能直接提交平台订单
8. 对应的人工作业接管说明

## 当前哪些字段可自动生成

当前可自动生成或自动填入的字段包括：

- `draft_header`
- `line_items[].line_no`
- `line_items[].product_id`
- `line_items[].product_name`
- `payment_terms.currency`
- `shipment_plan.trade_term`
- `shipment_plan.shipment_method`
- 当前订单入口风险边界说明

## 当前哪些字段必须人工补充

当前仍必须人工补充：

- `buyer.company_name`
- `buyer.contact_name`
- `buyer.email`
- `line_items[].quantity`
- `line_items[].unit_price`
- `payment_terms.total_amount`
- `payment_terms.advance_amount`
- `shipment_plan.lead_time_text`

## 2026-04-11 Stage 28 Order Workbench Addendum

### New local candidate route
- `/integrations/alibaba/wika/workbench/order-workbench`

### Route scope
- reuses the existing external order draft package only
- exposes:
  - `workflow_capability`
  - `input_requirements`
  - `current_order_profiles`
  - `required_manual_field_system`
  - `handoff_pack_capability`
  - `quality_gate_summary`
  - `sample_availability`
  - `blocker_taxonomy_summary`
  - `boundary_statement`

### Boundary
- external order draft only
- not platform order create
- no real order creation attempted
- local contract only in stage28

## 2026-04-13 Stage 29/30 Order Preview Addendum

- 已部署：
  - `/integrations/alibaba/wika/workbench/order-preview`
- 当前 preview 只在既有外部订单草稿链路上，额外补一层输入感知输出：
  - `preview_input_summary`
  - `workflow_preview`
  - `draft_preview`
  - `blocking_risks`
  - `quality_gate_summary`
  - `recommended_next_action`
- 固定边界：
  - external order draft only
  - not platform order create
  - no write action attempted

如果这些字段未经人工确认，就不能继续真实创单。

## 当前为什么不能直接提交平台订单

主要原因有 3 个：

1. `alibaba.trade.order.create` 当前只证明了参数层与授权层，不代表存在安全草稿边界
2. 当前缺少经过人工确认的买家、价格、交期、履约与支付承诺字段
3. 当前没有证据证明 create 成功路径是可回滚、无成交副作用的

## 当前一句话收口

当前订单草稿链路已经能稳定输出 `外部结构化订单草稿`，但它仍然只是任务 5 的中间层，不是平台内订单创建闭环。
