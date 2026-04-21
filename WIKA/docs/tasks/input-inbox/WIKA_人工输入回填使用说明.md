# WIKA 人工输入回填使用说明

## 用途
本目录用于接收业务方在运营周期内补齐的人工输入，例如广告导出样本、页面人工盘点、产品素材、销售跟单字段和订单人工确认字段。

本机制只服务 WIKA 运营复盘与下一轮报告刷新，不会写回阿里国际站平台，不会发送消息，不会创建订单，不推进任务 6。

## 目录约定
- `received/`：业务方新提交的待验收文件。
- `processed/`：通过基础格式验收并已进入本轮复盘的文件。
- `rejected/`：未通过格式验收的文件。
- `WIKA_人工输入验收结果.json`：本轮输入验收摘要。
- `WIKA_人工输入标准化结果.json`：本轮可被后续脚本读取的标准化输入结果。

## 支持的文件类型
- `.json`：必须是可解析 JSON。
- `.csv`：必须有表头，且至少有一行数据。
- `.md` / `.txt`：必须非空，用作人工说明或证据索引。

## 推荐输入类型
- 广告数据：按 `WIKA/docs/templates/WIKA_广告数据导入模板.csv` 或等价 JSON 提供。
- 页面盘点：按 `WIKA/docs/templates/WIKA_页面人工盘点模板.csv` 或盘点说明提供。
- 产品素材：补齐标题、关键词、规格、材质、图片、视频、详情页素材。
- 销售跟单：补齐报价、交期、样品、买家确认信息。
- 订单字段：补齐买家、价格、付款、物流、交付条款等人工确认字段。

## 运行方式
1. 把待回填文件放入 `WIKA/docs/tasks/input-inbox/received/`。
2. 执行 `node WIKA/scripts/ingest-wika-manual-inputs.js`。
3. 执行任务状态刷新、下一轮报告输入包刷新和本轮复盘生成脚本。

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
