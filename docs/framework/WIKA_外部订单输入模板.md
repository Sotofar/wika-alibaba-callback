# WIKA_外部订单输入模板

更新时间：2026-04-05

## 用途
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

## blocker 分层

### hard_blockers
这些 blocker 不补，系统仍可输出结构化草稿，但不能把它当成可执行商务包：

| blocker_code | definition | next human action | draft can still be produced | handoff mandatory |
| --- | --- | --- | --- | --- |
| `missing_buyer_company` | 缺少买家公司主体 | 补买家公司名称和主体身份 | 是 | 是 |
| `missing_buyer_contact` | 缺少买家联系人 | 补联系人姓名 | 是 | 是 |
| `missing_buyer_email` | 缺少买家邮箱 | 补正式回传邮箱 | 是 | 是 |
| `missing_line_items` | 缺少行项目 | 补至少一行产品 / SKU / 数量信息 | 否 | 是 |
| `missing_line_item_quantity` | 缺少行项目数量 | 补每行数量 | 是 | 是 |
| `missing_line_item_unit_price` | 缺少行项目单价 | 补每行单价 | 是 | 是 |
| `missing_total_amount` | 缺少总价 | 补总报价 | 是 | 是 |
| `missing_lead_time` | 缺少已确认交期 | 补样品期 / 量产期 / 起算条件 | 是 | 是 |

### soft_blockers
这些 blocker 不补，系统仍能产出草稿，但履约与付款条件会保持占位：

| blocker_code | definition | next human action | draft can still be produced | handoff mandatory |
| --- | --- | --- | --- | --- |
| `missing_advance_amount` | 缺少预付款安排 | 补定金比例或预付款金额 | 是 | 否 |
| `missing_destination_country` | 缺少目的国 / 目的港 | 补目的国或目的港 | 是 | 否 |
| `missing_trade_term` | 缺少贸易术语 | 补 FOB / CIF / EXW 等 | 是 | 否 |
| `missing_shipment_method` | 缺少出运方式 | 补海运 / 空运 / 快递 | 是 | 否 |

## assumption_needed
若缺这些信息，系统会采用保守假设，并在输出中显式写明：

- 默认币种为 `USD`
- 默认交期文本为 `TBD by human confirmation`
- 当前草稿只用于外部工作流，不会创建平台订单

## workflow profile

### `order_minimal_handoff`
- 输入预期：
  - 只有最小行项目或极少买家信息
- 常见 blocker：
  - `missing_buyer_company`
  - `missing_line_items`
  - `missing_line_item_quantity`
- 适用：
  - 先形成外部交接包，再人工补单

### `order_quote_confirmation_needed`
- 输入预期：
  - 已有买家和产品骨架，但价格 / 总价 / 交期未确认
- 常见 blocker：
  - `missing_line_item_unit_price`
  - `missing_total_amount`
  - `missing_lead_time`
- 适用：
  - 先形成订单草稿，再人工确认商务字段

### `order_commercial_review`
- 输入预期：
  - 主要商务字段基本具备，可进入人工复核
- 常见 blocker：
  - `missing_advance_amount`
  - `missing_trade_term`
  - `missing_shipment_method`
- 适用：
  - 作为人工复核和补单底稿继续处理

## JSON 模板样例

### profile: `order_commercial_review`
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
    "lead_time_text": "25-30 days after artwork approval",
    "destination_country": "United States"
  }
}
```

### profile: `order_quote_confirmation_needed`
```json
{
  "company_name": "TEST BUYER / DO-NOT-USE",
  "contact_name": "Sample Buyer",
  "email": "buyer@example.com",
  "line_items": [
    {
      "product_id": "1601700588198",
      "quantity": "1000",
      "unit": "Pieces",
      "currency": "USD"
    }
  ],
  "shipment_plan": {
    "destination_country": "United States"
  }
}
```

### profile: `order_minimal_handoff`
```json
{
  "line_items": [
    {
      "product_id": "1601700588198"
    }
  ],
  "notes": [
    "TEST / DO-NOT-USE",
    "minimal handoff sample"
  ]
}
```

## 人工补充重点
人工应优先补：

1. 买家身份
2. 每行单价
3. 总价
4. 交期
5. 目的地 / 贸易术语 / 物流方式

## 当前边界
这个模板对应的是“外部订单草稿工作流”。

它不代表：

- 平台内订单已创建
- 平台内 draft 已创建
- 真实信保下单已触发
