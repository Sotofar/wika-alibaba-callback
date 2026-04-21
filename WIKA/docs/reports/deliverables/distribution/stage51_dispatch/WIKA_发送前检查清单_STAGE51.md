# WIKA 发送前检查清单 STAGE51

## 1. PDF 存在性

- 确认仓库内 8 份 PDF 仍存在于 `WIKA/docs/reports/deliverables/pdf/`。
- 不重新生成 PDF。
- 桌面副本不可见不阻塞仓库分发，但发送人应确认本次实际附件来自仓库 PDF。

## 2. 消息文本最终版

- 使用 `distribution/stage51_final_messages/` 下的最终消息。
- 不使用旧草稿消息替代最终版。
- 不把报告包描述成完整 business cockpit。

## 3. 收件人

- 先查看 `WIKA_收件人登记表_STAGE51.csv`。
- 若 `contact_status=WAITING_FOR_RECIPIENT`，先由人工补齐真实联系人。
- Codex 不发送真实微信、邮件或飞书消息。

## 4. 反馈表

- 发送时附上 `feedback/stage51_feedback_automation/WIKA_反馈录入模板_STAGE51.csv` 或 stage49 业务试用反馈表。
- 发送后把真实反馈录入反馈模板，再运行 triage 脚本。

## 5. 补数模板

- 按角色附对应补数模板：
  - 广告数据模板
  - 页面盘点模板
  - 产品素材模板
  - 销售跟单模板
  - 订单末端确认模板
- 不把空模板写成已补齐。

## 6. 误读边界

发送前必须提醒：

- task1~5 不是 complete。
- task6 excluded。
- 广告数据、页面盘点、产品素材、销售跟单和订单末端字段仍需要人工补数。
- accepted degraded 没有被完全消除，只是不阻塞分发。
- 报告建议不是已执行动作。

## 7. 发送后登记

- 在 `WIKA_正式发送排期_STAGE51.csv` 中更新 `send_status`。
- 收到反馈后更新反馈模板。
- 收到补数后更新 intake registry。
- 没有真实反馈或补数前，不进入报告体系扩展。
