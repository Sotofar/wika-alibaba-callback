# WIKA 人工分发操作 Runbook STAGE51

## 1. 找到 6 个角色消息

最终消息位于：

- `distribution/stage51_final_messages/WIKA_老板管理层最终发送消息_STAGE51.md`
- `distribution/stage51_final_messages/WIKA_运营负责人最终发送消息_STAGE51.md`
- `distribution/stage51_final_messages/WIKA_店铺运营最终发送消息_STAGE51.md`
- `distribution/stage51_final_messages/WIKA_产品运营最终发送消息_STAGE51.md`
- `distribution/stage51_final_messages/WIKA_销售跟单最终发送消息_STAGE51.md`
- `distribution/stage51_final_messages/WIKA_人工接手最终发送消息_STAGE51.md`

## 2. 补真实收件人

先编辑 `stage51_dispatch/WIKA_收件人登记表_STAGE51.csv`。

- 有真实联系人后，更新 `recipient_name` 和 `recipient_contact`。
- `placeholder_used` 从 `yes` 改为 `no`。
- `contact_status` 从 `WAITING_FOR_RECIPIENT` 改为可发送状态。

没有真实联系人时，不暂停，但不得写成已发送。

## 3. 人工发送

Codex 不执行真实发送。人工发送人复制最终消息，附对应 PDF、反馈表和补数模板，通过微信、邮件或飞书发送。

发送后更新 `stage51_dispatch/WIKA_正式发送排期_STAGE51.csv`：

- `send_status=SENT_BY_HUMAN`
- 记录真实发送时间
- 设置反馈截止时间
- 设置人工补数截止时间

## 4. 登记反馈

真实反馈回收后，填写：

`feedback/stage51_feedback_automation/WIKA_反馈录入模板_STAGE51.csv`

然后执行：

```bash
node WIKA/scripts/triage-wika-feedback-stage51.js --dry-run --input=WIKA/docs/reports/deliverables/feedback/stage51_feedback_automation/WIKA_反馈录入模板_STAGE51.csv --output=WIKA/docs/reports/deliverables/feedback/stage51_feedback_automation/WIKA_反馈triage结果_STAGE51.json
```

## 5. 接收补数

真实补数文件回收后，填写：

`handoff/stage51_intake_automation/WIKA_补数文件登记表_STAGE51.csv`

然后执行：

```bash
node WIKA/scripts/validate-wika-manual-intake-stage51.js --dry-run --registry=WIKA/docs/reports/deliverables/handoff/stage51_intake_automation/WIKA_补数文件登记表_STAGE51.csv --output=WIKA/docs/reports/deliverables/handoff/stage51_intake_automation/WIKA_补数验收结果_STAGE51.json
```

## 6. 判断是否进入 stage52

进入 stage52 的条件：

1. 至少一条真实反馈需要报告表达或格式改版。
2. 至少一类人工补数通过验收。
3. 业务侧明确要求固定输出格式，且不需要新增 API 或写侧动作。

## 7. 不应继续推进的情况

- 没有真实联系人，不应写成已发送。
- 没有真实反馈，不应扩展报告体系。
- 没有补数，不应改写广告、页面、产品、销售或订单相关结论。
- 不应把 task1~5 写成 complete。
- 不应把 accepted degraded 写成完全消除。
- 不应执行任何商品、订单、草稿、消息、发布或上下架写侧动作。
