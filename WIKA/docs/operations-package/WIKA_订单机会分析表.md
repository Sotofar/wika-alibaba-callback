# WIKA 订单机会分析表

## 当前订单信号

WIKA 已有 orders management-summary、orders diagnostic、orders comparison、order-workbench、order-preview、order-draft 等可消费层，可用于整理订单机会和草稿准备；但订单末端字段仍需人工确认。

## 产品贡献

当前可以用已有订单摘要和产品贡献 derived 层判断哪些产品更值得跟进，但 'country_structure' 仍 unavailable。

## 潜在订单机会

| 机会类型 |跟进动作 |需要字段 |执行人 |验收标准 |
| --- |--- |--- |--- |--- |
| 高意向询盘转订单 |用 order-preview 检查创单字段 |报价、数量、交期、买家信息 |销售/跟单 |字段齐全并人工确认 |
| 样品单 |确认样品费、快递、样品周期 |样品政策、地址、联系方式 |销售/跟单 |样品信息可用于人工沟通 |
| 复购/组合采购 |结合产品贡献和产品套装建议做组合报价 |历史需求、产品组合、价格 |销售/产品运营 |组合方案可人工发送 |

## 缺失订单字段

- 买家完整信息
- 最终报价
- 交期
- 付款方式
- 物流方式
- 样品安排
- 订单备注

## 如何使用 order-preview / order-draft

order-preview 用于判断字段是否齐；order-draft 用于生成外部订单草稿；最终平台内创单仍由人工完成。

## 边界声明

- 订单国家结构仍 unavailable，不能强行输出国家结构结论。
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
- 本交付包只把当前 WIKA 能力转成运营执行材料，不代表平台内自动执行，也不代表任务 1–5 complete。
