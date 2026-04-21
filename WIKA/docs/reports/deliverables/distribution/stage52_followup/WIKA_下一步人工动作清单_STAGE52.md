# WIKA 下一步人工动作清单 STAGE52

## P1：补齐联系人

- Owner：运营负责人
- 输入：6 个角色真实联系人
- 输出：更新 `WIKA_收件人登记表_STAGE51.csv`
- 完成标准：每个角色 `placeholder_used=no`

## P1：人工发送 6 个角色消息

- Owner：运营负责人或指定发送人
- 输入：`stage51_final_messages/`
- 输出：更新 `WIKA_正式发送排期_STAGE51.csv`
- 完成标准：对应角色 `send_status=SENT_BY_HUMAN`

## P1：回收业务反馈

- Owner：各角色 owner
- 输入：业务侧反馈
- 输出：更新 `WIKA_反馈录入模板_STAGE51.csv`
- 完成标准：至少一条非 `EXAMPLE` 真实反馈

## P1：回收人工补数

- Owner：广告、页面、产品、销售、人工接手 owner
- 输入：补数模板文件或链接
- 输出：更新 `WIKA_补数文件登记表_STAGE51.csv`
- 当前未满足；至少一类补数后续达到 `received_status=RECEIVED` 后才可继续

## 当前不得推进

- 不修改报告正文。
- 不重新生成 PDF。
- 不扩展报告体系。
- 不做任何写侧业务动作。
- 不把 task1~5 写成 complete。
