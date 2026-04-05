# WIKA_外部草稿工作流说明

更新时间：2026-04-05

## 一句话定位
这一层能力只负责生成“外部可用的工作草稿与人工交接包”，不触发平台内回复发送，也不触发平台内订单创建。

## 当前边界
当前只允许复用：

- 已上线的 WIKA 真实读侧能力
- 最小经营诊断层
- 产品草稿 helper
- 订单草稿 helper
- notifier / alerts / fallback
- 写侧护栏与人工接管规则

当前明确不做：

- 新 Alibaba API 验证
- 平台内回复发送
- 平台内订单创建
- 真实商品发布
- 真实线上商品修改
- 真实通知外发

## 当前工具入口
- `POST /integrations/alibaba/wika/tools/reply-draft`
- `POST /integrations/alibaba/wika/tools/order-draft`

这两个入口都只生成草稿，不产生外部副作用。

## 稳定输出结构

### reply-draft 当前稳定输出
- `workflow_profile`
- `template_version`
- `input_summary`
- `available_context`
- `missing_context`
- `hard_blockers`
- `soft_blockers`
- `assumptions`
- `follow_up_questions`
- `follow_up_question_details`
- `reply_draft`
- `mockup_request`
- `minimum_reply_package`
- `draft_usable_externally`
- `handoff_checklist`
- `handoff_fields`
- `manual_completion_sop`
- `alert_payload`
- `workflow_meta`

### order-draft 当前稳定输出
- `workflow_profile`
- `template_version`
- `input_summary`
- `available_context`
- `missing_context`
- `hard_blockers`
- `soft_blockers`
- `assumptions`
- `required_manual_fields`
- `required_manual_field_details`
- `order_draft_package`
- `follow_up_questions`
- `follow_up_question_details`
- `handoff_checklist`
- `handoff_fields`
- `manual_completion_sop`
- `draft_usable_externally`
- `alert_payload`
- `workflow_meta`

## blocker taxonomy
代码与文档当前统一使用：

- `shared/data/modules/alibaba-external-workflow-taxonomy.js`

taxonomy 统一定义了：

- `blocker_code`
- `blocker_level`
- `blocker_definition`
- `blocker_reason`
- `blocker_next_action`
- `draft_can_still_be_produced`
- `handoff_mandatory`

当前常见 reply blocker：

- `missing_inquiry_text`
- `missing_final_quote`
- `missing_lead_time`
- `missing_destination_country`
- `missing_product_context`
- `missing_quantity`
- `missing_customer_profile`
- `missing_mockup_assets`

当前常见 order blocker：

- `missing_buyer_company`
- `missing_buyer_contact`
- `missing_buyer_email`
- `missing_line_items`
- `missing_line_item_quantity`
- `missing_line_item_unit_price`
- `missing_total_amount`
- `missing_advance_amount`
- `missing_trade_term`
- `missing_shipment_method`
- `missing_destination_country`
- `missing_lead_time`

## workflow profile

### reply profile
- `reply_minimal_handoff`
  - 适用：只有最小询盘上下文，必须先人工补信息
- `reply_quote_confirmation_needed`
  - 适用：已有产品与客户上下文，但报价 / 交期仍需人工确认
- `reply_mockup_customization`
  - 适用：涉及 logo、效果图、定制说明，需要素材和需求补齐

### order profile
- `order_minimal_handoff`
  - 适用：只有最小行项目或买家信息，必须先人工补单
- `order_quote_confirmation_needed`
  - 适用：已有订单骨架，但价格 / 总价 / 交期仍需人工确认
- `order_commercial_review`
  - 适用：主要商务字段基本具备，可进入人工复核

## 数据复用来源
当前只复用已上线 WIKA 真实读侧：

- `products/detail`
- `products/score`
- `products/groups`
- `products/minimal-diagnostic`
- `orders/fund`
- `orders/logistics`
- `orders/minimal-diagnostic`
- `products/schema/render`

## 当前自动生成能力

### reply-draft 可自动生成
- 基础回复结构：
  - `subject`
  - `opening`
  - `body`
  - `closing`
- 产品支撑信息
- 价格 / 交期 blocker
- `mockup_request`
- `follow_up_questions`
- `handoff_fields`
- `alert_payload`

### order-draft 可自动生成
- 订单草稿包骨架
- 买家摘要
- line items 草稿
- 付款 / 物流占位字段
- `required_manual_fields`
- `required_manual_field_details`
- `handoff_fields`
- `alert_payload`

## 当前不能自动完成的内容
- 平台内发送回复
- 平台内创建订单
- 自动承诺最终成交价格
- 自动承诺最终交期
- 自动生成真实效果图
- 自动发送真实通知

## 人工接手与补单
当前人工接手统一配套：

- `docs/framework/WIKA_外部回复输入模板.md`
- `docs/framework/WIKA_外部订单输入模板.md`
- `docs/framework/WIKA_人工补单模板.md`

人工接手的核心依据：

- 先看 `hard_blockers`
- 再看 `soft_blockers`
- 再看 `follow_up_question_details`
- 再看 `handoff_checklist`
- 最后按 `manual_completion_sop` 补齐字段

## 样例与验证
当前样例已经固定为 6 组：

### reply
- `complete_context_sample`
- `mockup_customization_sample`
- `minimal_handoff_sample`

### order
- `commercial_review_sample`
- `pricing_gap_sample`
- `minimal_handoff_sample`

主验证脚本：

- `scripts/validate-wika-external-draft-workflows.js`

兼容别名脚本：

- `scripts/validate-wika-workflow-phase14.js`

验证脚本会输出：

- `workflow_profile`
- `template_version`
- `hard_blockers_count`
- `soft_blockers_count`
- `handoff_required`
- `draft_usable_externally`

## 当前结论
当前已经形成“外部草稿工作流层 + blocker taxonomy + 人工补单 SOP + 可复现样例”的稳定中间层。

但这仍然只代表：

- 外部回复草稿可用
- 外部订单草稿可用
- 人工接手更顺畅

并不代表：

- 平台内已回复
- 平台内已创单
- 真实通知已送达
