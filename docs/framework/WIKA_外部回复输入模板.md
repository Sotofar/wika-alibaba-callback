# WIKA_外部回复输入模板

更新时间：2026-04-05

## 目标

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

## 缺失影响分层

### hard_blocker

缺这些信息时，系统仍可生成草稿，但不能把它当成可直接发送的正式回复：

- `inquiry_text`
- `final_quote`
- `expected_lead_time`

### soft_blocker

缺这些信息时，系统仍可继续生成草稿，但内容会更保守：

- `product_id / product_ids`
- `quantity`
- `destination_country`
- `customer_profile`
- `mockup_required` 相关素材

### assumption_needed

若缺这些信息，系统会采用保守假设，并在输出中显式写明：

- 默认语言为 `en`
- 没有实时价格源，因此正式报价需人工确认
- 没有已验证交期源，因此交期仅作占位提示
- 当前草稿只用于外部工作流，不会自动发送

## JSON 模板示例

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
    "Use as external draft only",
    "Do not send directly"
  ],
  "mockup_required": true,
  "logo_file_reference": "logo-ai-file-needed",
  "color_requirement": "black outside / beige inside",
  "mockup_scene": "front + open case view"
}
```

## 人工补充重点

在输出阶段，人工应优先补：

- 最终报价
- 最终交期
- 目的国 / 目的港
- 客户身份
- logo / artwork / mockup 场景

## 边界说明

这个模板对应的是“外部回复草稿工作流”。

它不代表：

- 平台内已回复
- 真实价格已确认
- 真实交期已确认
- 效果图已生成
