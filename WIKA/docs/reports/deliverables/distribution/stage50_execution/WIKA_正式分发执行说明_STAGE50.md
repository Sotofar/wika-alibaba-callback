# WIKA 正式分发执行说明 STAGE50

## 1. 如何使用分发台账

使用 `WIKA_正式分发执行台账_STAGE50.csv` 跟踪每个角色的发送准备、人工发送、反馈回收和下一步动作。当前没有真实联系人时，不暂停流程，使用 `{角色联系人}` 占位符，并将状态保持为 `WAITING_FOR_RECIPIENT`。

## 2. 每个状态是什么意思

- `READY_TO_SEND`：联系人、附件、话术和 owner 都已确认，可由人工发送。
- `WAITING_FOR_RECIPIENT`：缺真实联系人，暂不能发送。
- `SENT_BY_HUMAN`：已由人工复制消息并发送。
- `FEEDBACK_PENDING`：已发送，等待反馈。
- `FEEDBACK_RECEIVED`：反馈已回收。
- `BLOCKED_BY_MISSING_OWNER`：缺发送 owner 或反馈 owner。

## 3. 发送前检查什么

1. 主 PDF 和辅助 PDF 是否在仓库 PDF 目录存在。
2. 对应角色 outbox 是否存在。
3. 待发送消息是否已准备。
4. 是否明确不承诺 task1-5 complete。
5. 是否明确广告、页面盘点、产品素材、销售和订单末端字段仍需人工补数。

## 4. 发送后记录什么

- 真实发送时间。
- 发送渠道。
- 发送人。
- 接收人。
- 反馈截止时间。
- 对方是否确认收到。
- 是否需要补数。

## 5. 反馈截止日如何设置

默认建议：

- 老板 / 管理层：发送后 3 个工作日。
- 运营负责人：发送后 2 个工作日。
- 店铺运营、产品运营、销售 / 跟单、人工接手：发送后 5 个工作日。

若业务节奏不同，由 `ops_lead` 手动调整。

## 6. 没有真实联系人时如何处理

- 不停止 stage50。
- 使用角色占位符。
- `send_status` 和 `status` 均保持 `WAITING_FOR_RECIPIENT`。
- 后续由人工补联系人后再发送。

## 7. 哪些文件必须作为附件

- 每个角色对应的主 PDF。
- 至少一份辅助 PDF。
- 必要时附上角色 outbox。
- 对人工接手人员必须附补数模板目录。

## 8. 哪些内容必须提醒对方不能误读

- 当前报告包不是完整 business cockpit。
- 当前不是 task1-5 complete。
- task6 excluded。
- no write action attempted。
- 广告数据、页面盘点、产品素材、报价、交期、样品、买家和订单末端字段仍需人工补数。
- 已接受的 degraded route 不阻塞分发，但不代表 degraded 已完全消除。
