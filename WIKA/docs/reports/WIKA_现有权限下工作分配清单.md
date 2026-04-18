# WIKA 现有权限下工作分配清单

更新时间：2026-04-18

## 使用前提
- 本清单只基于当前已经打通的：
  - official read mainline
  - safe derived layer
  - import-driven layer
  - cockpit / workbench / preview / report layer
- 本清单不包含：
  - 平台内真实写侧
  - task 6
  - 未验证的新 API

## 1. 老板 / 管理层

### WIKA 现在能直接替他做什么
- 汇总当前店铺、产品、订单经营状态
- 输出统一 `business-cockpit` / `action-center` / `operator-console`
- 给出当前最重要发现、关键问题和优先动作
- 形成管理层可读的报告与周报

### WIKA 能替他做大半、但仍需人工确认什么
- 广告 / 页面优化判断
  - 当前需要人工提供广告导出和页面盘点输入
- 跨国家经营判断
  - 当前受 `country_source` / `country_structure` 缺口限制

### WIKA 只能做准备层 / 预览层什么
- task3/4/5 的 readiness 汇总
- 人工接手前的 blocker、风险和 next action 汇总

### WIKA 完全做不了什么
- 平台内真实发品、回复、创单
- task 6 通知能力

## 2. 运营负责人

### WIKA 现在能直接替他做什么
- 看店铺/产品/订单 summary、diagnostic、comparison
- 统一看 action-center 和 operator-console 的优先动作
- 看产品质量、内容完整度、关键词与 workbench 阻塞
- 读取广告导入层和页面盘点层的 readiness 状态

### WIKA 能替他做大半、但仍需人工确认什么
- 内容与页面优化建议
  - WIKA 能给保守建议，但最终方案仍要人工确认
- 广告优化建议
  - WIKA 能吃导出并给建议，但当前不自动抓取广告后台

### WIKA 只能做准备层 / 预览层什么
- `product-draft-workbench`
- `product-draft-preview`
- 广告导入模板 / 页面人工盘点模板

### WIKA 完全做不了什么
- 直接改首页模块
- 直接改详情页
- 直接改广告出价 / 预算

## 3. 店铺运营

### WIKA 现在能直接替他做什么
- 看店铺层经营摘要与变化
- 看产品层重点问题与优先整改方向
- 看内容与页面优化建议
- 按 operator-console 的优先级安排本周动作

### WIKA 能替他做大半、但仍需人工确认什么
- 首页与详情页整改清单
  - 需要结合人工盘点和素材情况落地
- 新品方向建议
  - 需要人工确认供应、价格、交付条件

### WIKA 只能做准备层 / 预览层什么
- 列出 schema、media、detail、keyword 缺口
- 输出整改建议和人工接手清单

### WIKA 完全做不了什么
- 直接在平台改商品
- 直接改站内页面结构

## 4. 产品运营

### WIKA 现在能直接替他做什么
- 识别低分商品、缺图商品、缺关键词商品、缺描述商品
- 输出产品侧 comparison 和 diagnostic
- 输出产品草稿准备与预览结论
- 帮他把 schema / media / render / score 信息统一收口

### WIKA 能替他做大半、但仍需人工确认什么
- 详情优化方案
- 标题 / 关键词调整方向
- 新品方向建议

### WIKA 只能做准备层 / 预览层什么
- `product-draft-workbench`
- `product-draft-preview`
- 草稿就绪度与阻塞项识别

### WIKA 完全做不了什么
- 平台内发品
- 平台内真实修改商品

## 5. 销售 / 跟单

### WIKA 现在能直接替他做什么
- 汇总订单信息、资金信息、物流信息
- 输出 reply / order 的 workbench 和 preview
- 输出外部草稿、交接包、缺失字段与风险提示
- 帮他把“要补哪些商业信息”说清楚

### WIKA 能替他做大半、但仍需人工确认什么
- reply 草稿
  - 草稿可以生成，但最终是否发送仍需人工
- order 草稿
  - 草稿可以生成，但最终是否创建仍需人工

### WIKA 只能做准备层 / 预览层什么
- `reply-workbench`
- `reply-preview`
- `/integrations/alibaba/wika/tools/reply-draft`
- `order-workbench`
- `order-preview`
- `/integrations/alibaba/wika/tools/order-draft`

### WIKA 完全做不了什么
- 平台内真实发送回复
- 平台内真实创建订单

## 6. 人工接手人员

### WIKA 现在能直接替他做什么
- 把当前问题、证据、建议、必填缺口整理好
- 把任务按优先级排好
- 把商品、回复、订单三类输入条件和阻塞写清楚

### WIKA 能替他做大半、但仍需人工确认什么
- 执行前复核
- 客户沟通口径确认
- 报价、交期、付款条款等最终业务判断

### WIKA 只能做准备层 / 预览层什么
- 生成 ready-to-handoff 的草稿包
- 生成 preview 结果
- 生成 operator-console / task-workbench 汇总

### WIKA 完全做不了什么
- 替人工承担不可回滚的真实业务动作

## 当前角色分工总原则
- WIKA 当前最强的是：
  - 汇总
  - 诊断
  - 排优先级
  - 生成人工接手前的准备层
- WIKA 当前不是：
  - 平台内执行机器人
  - 写侧闭环系统
  - 完整经营驾驶舱

## 当前结论
- 如果业务方把 WIKA 当成“运营分析 + 行动优先级 + 草稿准备 + 人工交接系统”，当前已经可用。
- 如果业务方要求 WIKA 直接替人完成发品、回询盘、创单或广告写回，当前还做不到。
