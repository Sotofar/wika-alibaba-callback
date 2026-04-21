# WIKA 运营任务执行闭环说明

## 1. stage48 任务包是什么
stage48 把正式运营报告包转成 19 个有角色、优先级、输入、步骤和验收标准的运营任务。它解决的是“报告看完后到底谁做什么”的问题。

## 2. stage49 执行闭环是什么
stage49 在 stage48 任务包上增加任务状态、blocked 清障、人工输入回收、每日记录、每周复盘、证据收集和下一轮报告输入包。

## 3. 每天怎么用
- 打开 `WIKA_任务执行总看板.md` 看总状态。
- 打开 `WIKA_P1任务执行看板.md` 确认当天优先动作。
- 用 `WIKA_每日执行记录模板.md` 记录完成、未完成、阻塞和新增人工输入。

## 4. 每周怎么用
- 用 `WIKA_本周执行计划.md` 排本周动作。
- 用 `WIKA_每周复盘记录模板.md` 汇总完成、延期、阻塞和补齐的数据。
- 把可复用证据写入下一轮报告输入包。

## 5. 谁负责补输入
- 广告数据：运营负责人。
- 页面盘点：店铺运营。
- 产品素材、规格、材质、关键词：产品运营。
- 报价、交期、样品、买家信息、订单字段：销售/跟单与人工接手人员。

## 6. 怎么把人工输入回流到下一轮报告
- 所有输入先进入 `WIKA/docs/tasks/inputs/` 对应清单。
- 执行证据进入 `WIKA_执行证据收集模板.md`。
- 机器可读需求进入 `WIKA_下一轮报告输入包.json`。

## 7. 哪些任务 WIKA 可以支撑
- WIKA 可以支撑任务拆解、状态推导、报告证据链接、任务看板、输入清单和下一轮报告输入包。
- 当前业务执行任务仍没有 `fully_supported`，不能写成平台内自动完成。

## 8. 哪些任务必须人工确认
- 当前需要人工确认/交接/输入的任务数：19。
- blocked 任务数：6。

## 9. 哪些任务当前 blocked
- 主要 blocked 来源：广告真实样本缺失、页面人工盘点输入缺失、官方缺失维度和 task3/4/5 写侧最后一跳。

## 10. 为什么这仍不是平台内自动执行
本轮只做本地任务闭环和人工输入回收，不做平台内发品、回复、创单、通知或其他写侧动作。

## 边界声明

- not task 1 complete
- not task 2 complete
- not task 3 complete
- not task 4 complete
- not task 5 complete
- task 6 excluded
- no write action attempted
- WIKA-only thread for business work
- XD untouched in business execution
- not full business cockpit
