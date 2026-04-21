# WIKA 销售跟单待发送消息 STAGE50

## 标题

WIKA 销售跟单清单与人工确认字段

## 发送对象占位符

`{销售/跟单联系人}`

## 正文

请优先看 `WIKA_销售跟单使用清单.pdf` 和 `WIKA_人工接手清单.pdf`。这些文件用于人工确认报价、交期、样品、买家信息和订单末端字段。

Codex 不会自动发送消息或修改订单。请把报告当作跟单辅助和补数字段清单。

## 附件清单

- `WIKA_销售跟单使用清单.pdf`
- `WIKA_人工接手清单.pdf`
- `WIKA_经营诊断报告.pdf`

## 对方需要做什么

1. 补充报价状态。
2. 补充交期和样品状态。
3. 标记下一次跟进日期。
4. 标记订单末端风险。

## 反馈截止时间占位符

`{YYYY-MM-DD}`

## 人工补数要求

请补 buyer_or_inquiry_id、product、current_stage、quote_status、sample_status、next_followup_date 和 owner。

## 不能误读的边界

- 报告不能代替销售判断。
- 不自动发消息。
- 不自动修改订单。

## 下一步

由 `sales_owner` 回填销售跟单补充模板。
