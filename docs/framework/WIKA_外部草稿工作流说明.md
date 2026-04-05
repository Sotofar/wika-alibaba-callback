# WIKA_外部草稿工作流说明

## 一句话定位
这层能力只负责生成“外部可用的工作草稿”，不触发平台内回复发送，也不触发平台内订单创建。

## 当前目标
在 `WIKA` 已有真实读侧、诊断层、草稿 helper 与通知 fallback 的基础上，补一层人可以直接拿来继续处理的外部草稿工作流：
- 客户回复草稿
- 外部订单草稿包
- 缺失信息 / 风险 / 人工接管建议
- 与现有 alert / notifier 结构对齐

## 输入协议

### 1. 回复草稿输入
最小建议字段：
- `inquiry_text`
- `product_id` 或 `product_ids`

可选增强字段：
- `customer_profile`
- `quantity`
- `destination`
- `target_price`
- `currency`
- `lead_time_context`
- `language_preference`
- `mockup_required`
- `logo_file_reference`
- `color_requirement`
- `mockup_scene`

### 2. 订单草稿输入
最小建议字段：
- `line_items`

可选增强字段：
- `buyer_member_seq`
- `company_name`
- `contact_name`
- `email`
- `phone`
- `country_code`
- `country_name`
- `payment_terms`
- `shipment_plan`
- `notes`

## 输出协议

### 1. 回复草稿输出
- `reply_draft.subject`
- `reply_draft.opening`
- `reply_draft.body`
- `reply_draft.closing`
- `reply_draft.price_information`
- `reply_draft.product_support`
- `reply_draft.lead_time_guidance`
- `reply_draft.mockup_request`
- `reply_draft.risk_flags`
- `reply_draft.escalation_recommendation`

### 2. 订单草稿包输出
- `order_draft_package.buyer`
- `order_draft_package.line_items`
- `order_draft_package.payment_terms`
- `order_draft_package.shipment_plan`
- `order_draft_package.manual_required_fields`
- `order_draft_package.reasons_cannot_submit`
- `order_draft_package.handoff`

### 3. workflow meta
- `generated_at`
- `available_context`
- `missing_context`
- `confidence`
- `risk_level`
- `human_action_required`
- `alert_payload`

## 当前复用的数据源
只复用已经上线并已线上验证的 WIKA 能力：
- `products/detail`
- `products/score`
- `products/groups`
- `orders/fund`
- `orders/logistics`
- `products/minimal-diagnostic`
- `orders/minimal-diagnostic`
- `products/schema/render`

## 当前能自动生成的内容
- 产品基础说明
- 产品质量分与常见问题提示
- 基础回复结构
- mockup / 效果图需求包
- 外部订单草稿包
- 缺失信息 blocker
- 人工接管建议
- 与现有 alert 结构兼容的结构化 payload

## 当前不能自动完成的内容
- 平台内发送回复
- 平台内创建订单
- 自动给出真实成交价格
- 自动承诺最终交期
- 自动生成真实效果图

## blocker 处理原则
只要缺以下关键条件，就必须输出 blocker，而不是瞎编：
- 真实价格
- 真实交期
- 明确目的地
- 客户身份
- logo / artwork / mockup 场景
- 最终成交条款

## 路由边界
如采用 route 方案，工具路由只能做草稿生成：
- `POST /integrations/alibaba/wika/tools/reply-draft`
- `POST /integrations/alibaba/wika/tools/order-draft`

这些 route 的产物只用于外部工作流，不代表：
- 平台内已回复
- 平台内已创单
- 真实业务承诺已生效

## 当前状态结论
当前已经可以形成“人可直接继续处理”的外部草稿工作流层。  
但它仍然不是平台内自动回复，也不是平台内订单创建闭环。
