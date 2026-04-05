# WIKA_人工补单模板

更新时间：2026-04-05

## 用途

该模板用于人工接手：

- 外部回复草稿
- 外部订单草稿包

目标不是自动执行，而是让人工快速补齐关键字段后再决定下一步。

## 一、回复草稿人工补充清单

### 必补字段

- 客户公司名 / 联系人
- 最终报价
- 交期
- 目的国 / 目的港

### 视情况补充

- MOQ / 打样周期
- logo / artwork 文件
- 颜色 / 工艺要求
- mockup 场景

### 推荐 follow-up questions

- Please confirm the target quantity and destination country.
- Please confirm whether you already have the logo / artwork file.
- Please confirm your target delivery schedule.
- Please confirm whether you need mockup views before sampling.

## 二、订单草稿人工补充清单

### 必补字段

- 买家公司名
- 联系人
- 邮箱
- 每行数量
- 每行单价
- 总价
- 交期

### 建议补充

- 目的国 / 目的港
- 贸易术语
- 物流方式
- 预付款比例
- 备注与特殊要求

### 推荐 handoff checklist

- Buyer identity verified
- Quote confirmed by human
- Lead time confirmed by human
- Destination confirmed
- Trade term confirmed
- Shipment method confirmed
- Order remains external draft only

## 三、禁止误报

人工补单过程中，仍然不能把以下内容写成已完成：

- 外部回复草稿 = 平台内已回复
- 外部订单草稿 = 平台内已创单
- mockup_request = 图片已生成
- blocker 已列出 = 风险已解除

## 四、建议使用顺序

1. 先查看 `hard_blockers`
2. 再查看 `soft_blockers`
3. 再补 `handoff_fields`
4. 最后复核 `assumptions` 是否仍成立
