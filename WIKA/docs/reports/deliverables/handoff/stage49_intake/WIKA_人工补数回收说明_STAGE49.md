# WIKA 人工补数回收说明 STAGE49

## 1. 回收目的

Stage49 将 stage48 的人工补数字段清单转成可填写模板。当前目标是回收真实业务输入，让下一轮报告能基于证据改进，而不是重复生成同一批 PDF。

## 2. 模板清单

- `WIKA_广告数据补充模板_STAGE49.csv`
- `WIKA_页面盘点补充模板_STAGE49.csv`
- `WIKA_产品素材补充模板_STAGE49.csv`
- `WIKA_销售跟单补充模板_STAGE49.csv`
- `WIKA_订单末端确认模板_STAGE49.csv`

## 3. 填写要求

每条记录至少保留：

- `owner`
- `due_date`
- `source_file_or_link`
- `confidence`
- `notes`
- `codex_next_action`

所有示例行都必须替换为真实业务输入后，才能用于下一轮报告复跑。

## 4. 存放路径

建议把真实补数文件放到：

- `WIKA/docs/reports/inputs/ads/`
- `WIKA/docs/reports/inputs/page-audit/`
- `WIKA/docs/reports/inputs/products/`
- `WIKA/docs/reports/inputs/sales/`
- `WIKA/docs/reports/inputs/orders/`

## 5. 完成标准

- owner 明确。
- due_date 明确。
- source_file_or_link 可访问。
- confidence 已填写。
- notes 说明数据边界。
- codex_next_action 能说明补完后下一步报告如何变化。

## 6. 当前不能做的事

- 不把模板示例写成真实数据。
- 不编造广告消耗、ROI、GMV、转化率、国家结构或完整经营诊断。
- 不自动修改商品、订单、草稿、上下架或发送消息。
- 不把 task1-5 写成 complete。

