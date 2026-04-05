# WIKA_外部回复输入模板

更新时间：2026-04-05

## 用途
该模板用于驱动：

- `POST /integrations/alibaba/wika/tools/reply-draft`

它只生成外部回复草稿，不会发送平台内回复。

## 字段分层

### required
- `inquiry_text`

### recommended
- `product_id` 或 `product_ids`
- `quantity`
- `destination_country`
- `target_price`
- `expected_lead_time`
- `customer_profile`

### optional
- `language`
- `notes`
- `mockup_required`
- `logo_file_reference`
- `color_requirement`
- `mockup_scene`

## blocker 分层

### hard_blockers
这些 blocker 不补，草稿仍可生成，但不能当成可直接发送的正式回复：

| blocker_code | definition | next human action | draft can still be produced | handoff mandatory |
| --- | --- | --- | --- | --- |
| `missing_inquiry_text` | 缺少原始询盘文本，系统无法形成可靠回复草稿 | 补客户原始询盘内容 | 否 | 是 |
| `missing_final_quote` | 缺少最终报价确认，系统不能自动承诺正式价格 | 人工确认最终报价、币种和报价口径 | 是 | 是 |
| `missing_lead_time` | 缺少已确认交期，系统不能自动承诺最终交期 | 人工确认样品期、量产期和起算条件 | 是 | 是 |

### soft_blockers
这些 blocker 不补，系统仍可继续生成草稿，但内容会更保守：

| blocker_code | definition | next human action | draft can still be produced | handoff mandatory |
| --- | --- | --- | --- | --- |
| `missing_destination_country` | 缺少目的国或目的港，物流和报价建议只能保持保守 | 补目的国 / 目的港 | 是 | 否 |
| `missing_product_context` | 缺少稳定产品上下文，回复只能泛化 | 补 `product_id` / 产品链接 / 产品名 | 是 | 否 |
| `missing_quantity` | 缺少数量，报价和交期只能保守表达 | 补采购数量 / MOQ / 打样数量 | 是 | 否 |
| `missing_customer_profile` | 缺少客户身份信息，称呼与商务判断会偏保守 | 补客户公司 / 联系人 / 客户画像 | 是 | 否 |
| `missing_mockup_assets` | 缺少 logo、工艺、颜色或场景素材，效果图需求包无法进入执行 | 补 logo、工艺、颜色和场景说明 | 是 | 否 |

## assumption_needed
若缺这些信息，系统会采用保守假设，并在输出中显式写明：

- 默认语言为 `en`
- 没有实时价格源，因此正式报价需人工确认
- 没有已验证交期源，因此交期仅作占位提示
- 当前草稿只用于外部工作流，不会自动发送

## workflow profile

### `reply_minimal_handoff`
- 输入预期：
  - 只有询盘文本或极少上下文
- 常见 blocker：
  - `missing_product_context`
  - `missing_customer_profile`
  - `missing_destination_country`
- 适用：
  - 先出保守草稿，再人工补关键商务字段

### `reply_quote_confirmation_needed`
- 输入预期：
  - 已有产品和客户上下文，但报价 / 交期仍未最终确认
- 常见 blocker：
  - `missing_final_quote`
  - `missing_lead_time`
  - `missing_quantity`
- 适用：
  - 先形成对外沟通底稿，再人工确认价格和交期

### `reply_mockup_customization`
- 输入预期：
  - 涉及定制、logo、效果图或包装视觉要求
- 常见 blocker：
  - `missing_mockup_assets`
  - `missing_final_quote`
  - `missing_lead_time`
- 适用：
  - 生成回复草稿 + mockup requirement pack + handoff

## JSON 模板样例

### profile: `reply_quote_confirmation_needed`
```json
{
  "inquiry_text": "Hello, please quote 1000 pcs custom sunglasses cases with logo.",
  "product_id": "1601700588198",
  "quantity": "1000 pcs",
  "destination_country": "United States",
  "target_price": "0.65",
  "expected_lead_time": "25-30 days after artwork approval",
  "customer_profile": {
    "company_name": "TEST BUYER / DO-NOT-USE",
    "contact_name": "Sample Buyer"
  },
  "language": "en",
  "notes": [
    "TEST / DO-NOT-USE",
    "external reply draft only"
  ]
}
```

### profile: `reply_mockup_customization`
```json
{
  "inquiry_text": "Need custom logo case with mockup before sample approval.",
  "product_id": "1601700588198",
  "quantity": "500 pcs",
  "destination_country": "Germany",
  "target_price": "0.72",
  "customer_profile": {
    "company_name": "TEST BUYER / DO-NOT-USE",
    "contact_name": "Mockup Buyer"
  },
  "mockup_required": true,
  "color_requirement": "black outside / beige inside",
  "language": "en"
}
```

### profile: `reply_minimal_handoff`
```json
{
  "inquiry_text": "Please quote your case options.",
  "language": "en",
  "notes": [
    "TEST / DO-NOT-USE",
    "minimal handoff sample"
  ]
}
```

## 人工补充重点
在输出阶段，人工应优先补：

1. 最终报价
2. 最终交期
3. 目的国 / 目的港
4. 客户身份
5. logo / artwork / mockup 场景

## 当前边界
这个模板对应的是“外部回复草稿工作流”。

它不代表：

- 平台内已回复
- 真实价格已确认
- 真实交期已确认
- 效果图已生成
