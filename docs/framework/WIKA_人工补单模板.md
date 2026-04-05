# WIKA_人工补单模板

更新时间：2026-04-05

## 用途
该模板用于人工接手：

- 外部回复草稿
- 外部订单草稿包

目标不是自动执行，而是让人工快速补齐关键字段后再决定下一步。

## 一、回复草稿人工接手 SOP

### section: customer_and_destination
- 字段：
  - `customer_profile`
  - `destination_country`
  - `quantity`
- why_required：
  - 决定回复语气、物流建议、MOQ 表达和报价上下文
- who_should_fill：
  - `sales`

### section: pricing_confirmation
- 字段：
  - `price.quote_confirmation`
- why_required：
  - 当前没有实时价格源，最终报价必须人工确认
- who_should_fill：
  - `sales`

### section: lead_time_confirmation
- 字段：
  - `delivery.lead_time_confirmation`
- why_required：
  - 当前没有已验证交期源，最终交期必须人工确认
- who_should_fill：
  - `sales / production`

### section: mockup_requirements
- 字段：
  - `mockup_request.asset_requirements`
- why_required：
  - 没有 logo / 工艺 / 场景素材时，效果图需求包不能进入执行
- who_should_fill：
  - `sales / design`

### 回复草稿最小可回复包判断
先看：

1. `hard_blockers`
2. `minimum_reply_package`
3. `follow_up_question_details`
4. `handoff_checklist`

结论规则：

- 若存在 `missing_inquiry_text`
  - 不能继续
  - 必须人工补询盘原文
- 若存在 `missing_final_quote` 或 `missing_lead_time`
  - 可以继续形成内部草稿
  - 但不能当成可直接发送的正式回复
- 若只剩 `soft_blockers`
  - 可以继续形成保守版草稿
  - 但必须把 follow-up question 一并带给人工

## 二、订单草稿人工补单 SOP

### section: buyer_identity
- 字段：
  - `buyer.company_name`
  - `buyer.contact_name`
  - `buyer.email`
- why_required：
  - 没有买家主体与正式联系信息，订单草稿无法交接为商务文件
- example_value：
  - `ABC Trading LLC`
  - `John Smith`
  - `buyer@example.com`
- collection_hint：
  - 从询盘签名、邮箱域名、名片或聊天记录中确认
- who_should_fill：
  - `sales`

### section: commercial_terms
- 字段：
  - `line_items[].quantity`
  - `line_items[].unit_price`
  - `payment_terms.total_amount`
  - `payment_terms.advance_amount`
- why_required：
  - 决定报价完整度、付款安排与交接有效性
- example_value：
  - `1000`
  - `0.65`
  - `650`
  - `195`
- collection_hint：
  - 结合数量、工艺、包装与汇总报价人工确认
- who_should_fill：
  - `sales`

### section: delivery_terms
- 字段：
  - `shipment_plan.lead_time_text`
  - `shipment_plan.destination_country`
  - `shipment_plan.trade_term`
  - `shipment_plan.shipment_method`
- why_required：
  - 决定交期、物流口径、贸易责任边界
- example_value：
  - `25-30 days after artwork approval`
  - `United States`
  - `FOB`
  - `sea`
- collection_hint：
  - 从客户需求、物流方案和业务确认里补齐
- who_should_fill：
  - `sales / logistics`

### order draft 人工补单顺序
1. 先看 `hard_blockers`
2. 再看 `required_manual_fields`
3. 再看 `required_manual_field_details`
4. 再看 `handoff_fields`
5. 最后复核 `assumptions` 是否仍成立

## 三、follow-up questions 使用顺序

### reply
- 优先级 `high`
  - 直接影响是否可发送
  - 例如价格、交期、询盘原文
- 优先级 `medium`
  - 影响回复质量
  - 例如 mockup 素材、目的国
- 优先级 `low`
  - 影响语气和细节
  - 例如客户画像补充

### order
- 优先级 `high`
  - 买家身份、数量、单价、总价、交期
- 优先级 `medium`
  - 目的国、贸易术语、物流方式、预付款

## 四、禁止误报
人工补单过程中，仍然不能把以下内容写成已完成：

- 外部回复草稿 = 平台内已回复
- 外部订单草稿 = 平台内已创单
- `mockup_request` = 图片已生成
- blocker 已列出 = 风险已解除
- 草稿可用 = 平台内可自动执行

## 五、当前边界
这份模板只服务：

- 外部草稿工作流
- 人工接手
- blocker 收口
- handoff / escalation

它不代表：

- 平台内自动回复
- 平台内自动创单
- 真实业务承诺已生效
