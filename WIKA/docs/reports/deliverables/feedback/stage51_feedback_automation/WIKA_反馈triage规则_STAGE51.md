# WIKA 反馈 triage 规则 STAGE51

## 1. 输入文件

- 默认输入：`WIKA_反馈录入模板_STAGE51.csv`
- 真实反馈未收回前，只保留 `EXAMPLE` 示例行。
- 示例行用于验证分类逻辑，不计入真实反馈数量。

## 2. feedback_type 枚举

- `content_clarity`：文字、结构、边界说明不清。
- `business_action`：建议是否能执行、执行优先级如何。
- `manual_input_needed`：需要广告、页面、产品、销售或订单补数。
- `new_data_source_needed`：需要新数据源或外部证据。
- `format_request`：需要 Excel、飞书、邮件或其他格式。
- `not_actionable`：建议暂不采纳或不可执行。
- `unsafe_or_out_of_scope`：涉及写侧、自动发送、平台修改或越界诉求。

## 3. triage 原则

- 能在现有报告文字内调整的，进入 stage52 报告表达改版。
- 需要人工补数的，先进入 intake registry，不直接改结论。
- 需要新数据源的，标记为新证据依赖。
- 涉及写侧动作、自动发布、自动发消息、自动修改商品或订单的，标记为 `unsafe_or_out_of_scope`。

## 4. 没有真实反馈时

- triage 脚本必须输出空 summary。
- 不得失败。
- 不得扩展报告体系。
- 下一步仍是等待人工发送和反馈回收。

## 5. 进入 stage52 的条件

满足任一条件即可进入 stage52：

1. 至少一条真实反馈进入 `READY_FOR_NEXT_STAGE`。
2. 至少一类人工补数通过验收。
3. 业务侧明确要求报告格式改版，且不需要新 API 或写侧动作。
