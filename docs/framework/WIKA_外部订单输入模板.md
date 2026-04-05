# WIKA_外部订单输入模板

更新时间：2026-04-05

## 目标

该模板用于驱动：

- `POST /integrations/alibaba/wika/tools/order-draft`

它只生成外部订单草稿包，不会创建平台订单。

## 字段分层

### required

- `line_items`

### recommended

- `company_name`
- `contact_name`
- `email`
- `country_name`
- `line_items[].quantity`
- `line_items[].unit_price`
- `payment_terms`
- `shipment_plan`

### optional

- `buyer_member_seq`
- `phone`
- `country_code`
- `notes`

## 缺失影响分层

### hard_blocker

缺这些信息时，系统只能输出结构化草稿，不能把它当成可提交的商务订单包：

- `buyer.company_name`
- `buyer.contact_name`
- `buyer.email`
- `line_items[].quantity`
- `line_items[].unit_price`
- `payment_terms.total_amount`
- `shipment_plan.lead_time_text`

### soft_blocker

缺这些信息时，系统仍能产出草稿，但履约与付款条件会保持占位：

- `payment_terms.advance_amount`
- `shipment_plan.destination_country`
- `shipment_plan.trade_term`
- `shipment_plan.shipment_method`

### assumption_needed

若缺这些信息，系统会采用保守假设，并在输出中显式写明：

- 默认币种为 `USD`
- 默认交期文本为 `TBD by human confirmation`
- 当前草稿只用于外部工作流，不会创建平台订单

## JSON 模板示例

```json
{
  "company_name": "TEST BUYER / DO-NOT-USE",
  "contact_name": "Sample Buyer",
  "email": "buyer@example.com",
  "country_name": "United States",
  "country_code": "US",
  "line_items": [
    {
      "product_id": "1601700588198",
      "quantity": "1000",
      "unit": "Pieces",
      "unit_price": "0.65",
      "currency": "USD"
    }
  ],
  "payment_terms": {
    "currency": "USD",
    "total_amount": "650",
    "advance_amount": "195",
    "payment_terms_text": "30% deposit, balance before shipment"
  },
  "shipment_plan": {
    "trade_term": "FOB",
    "shipment_method": "sea",
    "lead_time_text": "25-30 days after artwork confirmation",
    "destination_country": "United States",
    "logistics_notes": "TEST / DO-NOT-USE"
  },
  "notes": [
    "External draft only",
    "Do not create platform order"
  ]
}
```

## 人工补充重点

人工应优先补：

- 买家身份绑定信息
- 最终单价 / 总价
- 交期
- 目的国 / 港口
- 付款方式与履约条款

## 边界说明

这个模板对应的是“外部订单草稿工作流”。

它不代表：

- 平台内订单已创建
- 平台内 draft 已创建
- 真实信保下单已触发
