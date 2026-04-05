# WIKA 外部回复交接包

- workflow_profile: `reply_quote_confirmation_needed`
- template_version: `2026-04-05.sop-v1`
- review_version: `2026-04-05.review-v1`
- readiness_level: `handoff_required`
- handoff_required: `true`
- draft_usable_externally: `true`

## Input Summary
```json
{
  "inquiry_text_present": true,
  "product_ids": [
    "1601700588198"
  ],
  "quantity": "1000 pcs",
  "destination_country": "United States",
  "target_price": null,
  "expected_lead_time": null,
  "language": "en",
  "customer_profile_present": true
}
```

## Minimum Reply Package
```json
{
  "ready_for_human_edit": true,
  "minimum_context_available": true,
  "draft_usable_externally": true,
  "must_handoff_before_any_send": true
}
```

## Prioritized Follow-up Questions
- [high] Please confirm the final quote, currency and quote basis.（missing_final_quote / price.quote_confirmation）
- [high] Please confirm sample lead time, production lead time and the start condition.（missing_lead_time / delivery.lead_time_confirmation）

## Hard Blockers
- `missing_final_quote`：There is no verified live pricing field available, so the system cannot generate a firm quote automatically.；下一步：人工确认最终报价、币种和报价口径。
- `missing_lead_time`：There is no verified lead-time data source, so the system cannot commit a delivery schedule automatically.；下一步：人工确认打样期、量产期和起算条件。

## Soft Blockers
- 无


## Handoff Checklist
- [x] 客户身份已确认（customer_identity）：已有公司或联系人信息。
- [x] 产品上下文已确认（product_context）：已绑定至少一个真实产品。
- [x] 数量与目的地已确认（commercial_context）：数量与目的地已可用于人工回复。
- [ ] 报价与交期已人工确认（quote_and_lead_time）：最终报价或交期仍需人工确认。
- [x] 效果图素材已齐备（mockup_assets）：当前无需额外 mockup 素材，或素材已齐。
- [x] 仍属于外部草稿工作流（external_only）：当前草稿只能用于外部人工协同，不能视为平台内已回复。

## Handoff Fields
- `price.quote_confirmation`：Final quote；补充人：sales；提示：人工确认最终报价、币种和报价口径。
- `delivery.lead_time_confirmation`：Lead time confirmation；补充人：sales；提示：人工确认打样期、量产期和起算条件。

## Boundary
当前只生成外部回复草稿，不触发平台内回复发送。

## Draft Text / Guidance
```json
{
  "draft_text": {
    "subject": "Draft reply for Customizable PU Leather Portable Sunglasses Case New Design Logo Plug-in Closure Travel Anti-scratch Eyeglasses Soft Case",
    "opening": "Hello, thank you for your inquiry from TEST BUYER / DO-NOT-USE.",
    "body": "Inquiry summary: Hello, we need 1000 pcs PU sunglasses cases for US shipment. Please confirm quote and lead time.\n\nRequested quantity: 1000 pcs\n\nDestination: United States\n\nProduct references:\n- Customizable PU Leather Portable Sunglasses Case New Design Logo Plug-in Closure Travel Anti-scratch Eyeglasses Soft Case | description available\n\nPrice note: There is no verified live pricing field available, so the system cannot generate a firm quote automatically.\n\nLead time note: There is no verified lead-time data source, so the system cannot commit a delivery schedule automatically.",
    "closing": "Please confirm the following items before sending a formal reply: final_quote, lead_time.",
    "price_information": {
      "status": "blocked",
      "text": "There is no verified live pricing field available, so the system cannot generate a firm quote automatically.",
      "blocker_keys": [
        "price",
        "currency_confirmation"
      ],
      "related_products": [
        "1601700588198"
      ]
    },
    "product_support": [
      {
        "product_id": "1601700588198",
        "subject": "Customizable PU Leather Portable Sunglasses Case New Design Logo Plug-in Closure Travel Anti-scratch Eyeglasses Soft Case",
        "category_id": 36127040,
        "group_id": null,
        "group_name": null,
        "pc_detail_url": "https://www.alibaba.com/product-detail/Customizable-PU-Leather-Portable-Sunglasses-Case_1601700588198.html",
        "main_image_url": "https://sc04.alicdn.com/kf/H081bc9376637401ab1b9fa4ac3d772e8l.jpg",
        "description_available": true,
        "keywords": [],
        "gmt_modified": "2026-03-26 15:51:53",
        "quality_signals": [
          "quality score 5",
          "boutique tag enabled"
        ],
        "problem_hints": []
      }
    ],
    "lead_time_guidance": {
      "status": "blocked",
      "text": "There is no verified lead-time data source, so the system cannot commit a delivery schedule automatically.",
      "blocker_keys": [
        "lead_time"
      ]
    },
    "mockup_request": {
      "needed": false,
      "mockup_request": "The current inquiry does not explicitly request a mockup.",
      "visual_requirements": [],
      "asset_requirements": [
        "Customer logo / artwork source file is required",
        "Color / finish requirement needs confirmation",
        "Mockup scene / usage context needs confirmation"
      ],
      "product_references": [
        {
          "product_id": "1601700588198",
          "subject": "Customizable PU Leather Portable Sunglasses Case New Design Logo Plug-in Closure Travel Anti-scratch Eyeglasses Soft Case",
          "pc_detail_url": "https://www.alibaba.com/product-detail/Customizable-PU-Leather-Portable-Sunglasses-Case_1601700588198.html"
        }
      ]
    },
    "risk_flags": [
      "platform_reply_unavailable"
    ],
    "escalation_recommendation": {
      "level": "high",
      "recommendation": "A human should fill in pricing, lead time, customer identity or destination details before a formal reply is sent."
    }
  },
  "draft_guidance": {
    "assumptions": [
      "This draft is for the external workflow only and will not send any platform reply automatically.",
      "If language preference is not explicit, the system defaults to English.",
      "There is no verified live pricing source, so the system does not produce a firm quote.",
      "There is no verified lead-time source, so lead time remains subject to manual confirmation."
    ],
    "escalation_recommendation": {
      "level": "high",
      "recommendation": "A human should fill in pricing, lead time, customer identity or destination details before a formal reply is sent."
    },
    "alert_payload": {
      "schema_version": 1,
      "kind": "wika_blocker_alert",
      "account": "wika",
      "stage_name": "external_reply_draft_workflow",
      "blocker_category": {
        "code": "parameter_missing",
        "label": "参数缺失",
        "description": "关键入参、业务参数或必填字段不足，无法继续验证或生成草稿。"
      },
      "triggered_at": "2026-04-05T04:09:08.053Z",
      "related_apis": [
        "alibaba.seller.customer.batch.get",
        "alibaba.seller.customer.get"
      ],
      "related_modules": [
        "external_reply_draft",
        "wika_minimal_product_diagnostic"
      ],
      "current_evidence": [
        "External reply draft generated from existing read-side signals only.",
        "Current platform reply path is still unavailable or unverified.",
        "Missing context: final_quote, lead_time"
      ],
      "cannot_continue_reason": "关键参数或样本 id 缺失，当前无法继续完成真实实证。",
      "user_needs": [
        "final_quote",
        "lead_time"
      ],
      "suggested_next_steps": [
        "Manually confirm final quote and lead time before sending.",
        "Provide destination, customer identity and artwork files if a mockup is required."
      ],
      "allow_human_handoff": true,
      "human_handoff": {
        "account": "wika",
        "stage": "formal_notification_loop",
        "status": "pending_human_handoff",
        "severity": "high",
        "action": "parameter_backfill",
        "api_name": null,
        "blocker_category": {
          "code": "parameter_missing",
          "label": "参数缺失",
          "description": "关键入参、业务参数或必填字段不足，无法继续验证或生成草稿。"
        },
        "triggers": [
          {
            "code": "missing_category_or_attributes",
            "label": "类目或属性不足",
            "description": "草稿所需的类目、属性或必填项未补齐时，必须人工确认后续信息来源。"
          }
        ],
        "requires_human_handoff": true,
        "input_summary": {
          "product_ids": [
            "1601700588198"
          ],
          "quantity": "1000 pcs",
          "destination": "United States"
        },
        "evidence": {
          "stage_name": "external_reply_draft_workflow",
          "related_apis": [
            "alibaba.seller.customer.batch.get",
            "alibaba.seller.customer.get"
          ],
          "related_modules": [
            "external_reply_draft",
            "wika_minimal_product_diagnostic"
          ],
          "current_evidence": [
            "External reply draft generated from existing read-side signals only.",
            "Current platform reply path is still unavailable or unverified.",
            "Missing context: final_quote, lead_time"
          ],
          "cannot_continue_reason": "关键参数或样本 id 缺失，当前无法继续完成真实实证。"
        },
        "next_action": "Manually confirm final quote and lead time before sending.；Provide destination, customer identity and artwork files if a mockup is required.",
        "created_at": "2026-04-05T04:09:08.053Z"
      }
    }
  }
}
```
