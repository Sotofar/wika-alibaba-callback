# WIKA 人工补数验收规则 STAGE50

## 1. 广告数据如何验收

必须包含：

- campaign_name
- date_range
- spend
- impressions
- clicks
- inquiries
- source_file_or_link

如果缺少时间窗口或来源文件，不能进入广告报告。没有真实导出样本前，不判断 ROI、投产比或转化率。

## 2. 页面盘点如何验收

必须包含：

- page_url
- page_type
- issue_type
- severity
- current_observation
- recommended_change
- evidence_link

如果没有页面 URL 或证据链接，只能作为口头反馈，不进入正式页面优化清单。

## 3. 产品素材如何验收

必须包含：

- product_id_or_name
- material_type
- current_status
- missing_asset
- priority
- source_file_or_link

如果素材状态无法验证，只能保留为待补项，不能写成已补齐。

## 4. 销售跟单信息如何验收

必须包含：

- buyer_or_inquiry_id
- product
- current_stage
- required_action
- quote_status
- sample_status
- next_followup_date

这些信息只用于人工跟单建议，不触发自动发送消息或订单修改。

## 5. 订单末端确认如何验收

必须包含：

- order_id_or_trade_id
- status
- logistics_status
- payment_status
- risk_flag
- required_manual_action

如果订单字段无法人工确认，仍保持待确认，不写成已处理。

## 6. 哪些数据不足以进入报告

- 只有口头描述，没有来源文件。
- 没有时间窗口。
- 没有 owner。
- confidence 为 low 且无说明。
- 与已有报告证据冲突。
- 涉及写侧动作但未证明安全边界。

## 7. 补齐后 Codex 下一步能做什么

- 更新广告样本摘要。
- 更新页面优化建议。
- 更新产品素材缺口。
- 更新销售跟单清单。
- 更新订单末端人工处理清单。
- 生成 stage51 改版计划。
