# WIKA 补数验收规则 STAGE51

## 1. 通用规则

- 默认只验收已登记的人工补数文件。
- `WAITING_OWNER` 不算失败。
- 未收到文件时，不改写任何报告结论。
- 不调用外部 API，不发送消息，不执行写侧业务动作。

## 2. 广告数据

必须包含：

- campaign_name
- date_range
- spend
- impressions
- clicks
- inquiries
- source_file_or_link

缺 spend、impressions 或 clicks 时，不能进入广告分析改版。

## 3. 页面盘点

必须包含：

- page_url
- page_type
- issue_type
- severity
- current_observation
- recommended_change
- owner

缺页面 URL 或现状观察时，不能进入页面优化结论。

## 4. 产品素材

必须包含：

- product_id_or_name
- material_type
- current_status
- missing_asset
- priority
- owner

缺产品标识或素材类型时，不能进入产品优化结论。

## 5. 销售跟单

必须包含：

- buyer_or_inquiry_id
- product
- current_stage
- required_action
- quote_status
- sample_status
- next_followup_date
- owner

缺跟单对象或下一步动作时，不能进入跟单建议。

## 6. 订单末端确认

必须包含：

- order_id_or_trade_id
- status
- logistics_status
- payment_status
- risk_flag
- required_manual_action
- owner

缺订单标识或人工动作时，不能写成订单末端已确认。

## 7. 验收输出

- `VALID`：字段完整，能进入下一轮报告改版。
- `INCOMPLETE`：字段缺失，需要补填。
- `LOW_CONFIDENCE`：来源或可信度不足。
- `CONFLICTING`：字段相互冲突。
- `UNUSABLE`：格式或内容不可用。
