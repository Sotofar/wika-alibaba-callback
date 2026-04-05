# WIKA 外部订单交接包

- workflow_profile: `order_commercial_review`
- template_version: `2026-04-05.sop-v1`
- review_version: `2026-04-05.review-v1`
- readiness_level: `externally_usable`
- handoff_required: `false`
- draft_usable_externally: `true`

## Input Summary
```json
{
  "buyer_company_name": "TEST BUYER / DO-NOT-USE",
  "buyer_contact_name": "Sample Buyer",
  "destination_country": "United States",
  "line_item_count": 1,
  "quoted_currency": "USD"
}
```

## Required Manual Fields
- `buyer.company_name`：undefined；补充人：sales；提示：从客户签名、名片、邮箱域名或聊天记录中确认。
- `buyer.contact_name`：undefined；补充人：sales；提示：优先从询盘落款、邮箱签名或聊天记录获取。
- `buyer.email`：undefined；补充人：sales；提示：优先收集可正式回传文件的邮箱地址。
- `line_items[].quantity`：undefined；补充人：sales；提示：确认正式采购量、MOQ 或打样数量。
- `line_items[].unit_price`：undefined；补充人：sales；提示：结合数量、材质、工艺和运费方案人工确认。
- `payment_terms.total_amount`：undefined；补充人：sales；提示：按行项目汇总或人工确认总报价。
- `payment_terms.advance_amount`：undefined；补充人：sales；提示：确认定金比例或预付款金额。
- `shipment_plan.lead_time_text`：undefined；补充人：sales / production；提示：按打样、排产、出货阶段向业务或生产确认。

## Section Mapping
```json
[
  {
    "section": "buyer_identity",
    "fields": [
      {
        "field": "buyer.company_name",
        "who_should_fill": "sales",
        "collection_hint": "从客户签名、名片、邮箱域名或聊天记录中确认。"
      },
      {
        "field": "buyer.contact_name",
        "who_should_fill": "sales",
        "collection_hint": "优先从询盘落款、邮箱签名或聊天记录获取。"
      },
      {
        "field": "buyer.email",
        "who_should_fill": "sales",
        "collection_hint": "优先收集可正式回传文件的邮箱地址。"
      }
    ]
  },
  {
    "section": "commercial_terms",
    "fields": [
      {
        "field": "line_items[].quantity",
        "who_should_fill": "sales",
        "collection_hint": "确认正式采购量、MOQ 或打样数量。"
      },
      {
        "field": "line_items[].unit_price",
        "who_should_fill": "sales",
        "collection_hint": "结合数量、材质、工艺和运费方案人工确认。"
      },
      {
        "field": "payment_terms.total_amount",
        "who_should_fill": "sales",
        "collection_hint": "按行项目汇总或人工确认总报价。"
      },
      {
        "field": "payment_terms.advance_amount",
        "who_should_fill": "sales",
        "collection_hint": "确认定金比例或预付款金额。"
      }
    ]
  },
  {
    "section": "delivery_terms",
    "fields": [
      {
        "field": "shipment_plan.lead_time_text",
        "who_should_fill": "sales / production",
        "collection_hint": "按打样、排产、出货阶段向业务或生产确认。"
      }
    ]
  }
]
```

## Follow-up Questions
- 无


## Commercial Risk Summary
```json
{
  "escalation_recommendation": {
    "level": "low",
    "recommendation": "A human should still review commercial terms, delivery assumptions and buyer identity before reuse."
  },
  "hard_blockers": [],
  "soft_blockers": []
}
```

## Handoff Checklist
- [x] 买家身份已确认（buyer_identity）：买家公司、联系人和邮箱均已具备。
- [x] 价格字段已确认（pricing_ready）：单价与总价已具备。
- [x] 交期与物流条件已确认（delivery_ready）：交期、贸易术语和出运方式已具备基本上下文。
- [x] 仍属于外部订单草稿（external_only）：当前草稿只用于外部补单与人工跟进，不会创建平台订单。

## Handoff Fields
- 无


## Manual Completion SOP
```json
{
  "template_version": "2026-04-05.sop-v1",
  "workflow_profile": "order_commercial_review",
  "sections": [
    {
      "section_code": "buyer_identity",
      "title": "买家身份",
      "owner": "sales",
      "fields": [
        "buyer.company_name",
        "buyer.contact_name",
        "buyer.email"
      ],
      "notes": "买家主体、联系人和邮箱是人工补单和后续报价回传的基础。"
    },
    {
      "section_code": "commercial_terms",
      "title": "价格与付款条款",
      "owner": "sales",
      "fields": [
        "line_items[].unit_price",
        "payment_terms.total_amount",
        "payment_terms.advance_amount"
      ],
      "notes": "没有实时报价源，价格条款必须人工确认。"
    },
    {
      "section_code": "delivery_terms",
      "title": "交期与履约条款",
      "owner": "sales / logistics",
      "fields": [
        "shipment_plan.lead_time_text",
        "shipment_plan.trade_term",
        "shipment_plan.shipment_method",
        "shipment_plan.destination_country"
      ],
      "notes": "交期、贸易术语和出运方式决定订单草稿是否可继续人工推进。"
    }
  ],
  "blocker_summary": {
    "hard_count": 0,
    "soft_count": 0
  },
  "external_boundary": {
    "platform_order_available": false,
    "draft_can_still_be_produced": true,
    "reason": "当前只能生成外部订单草稿，不能视为平台内订单草稿或真实订单。"
  }
}
```

## Boundary
当前只能生成外部订单草稿，不能视为平台内订单草稿或真实订单。
