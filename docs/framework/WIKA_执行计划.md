# WIKA_执行计划

## 当前阶段
阶段 14：任务 4/5 的外部草稿工作流层

## 本阶段唯一目标
不再验证新 Alibaba API，也不再推进平台内读写。只基于当前已经上线、已验证、已沉淀的能力，形成一层“外部草稿工作流”：
- 客户回复草稿生成
- 订单草稿包生成
- 缺失信息 / 风险 / 人工接管建议
- 与现有 notifier fallback / alert 结构对齐

## 起始基线
- 只推进 `WIKA`
- 一律复用 Railway production 认证闭环与 `/sync + access_token + sha256`
- 产品 / 订单 / 类目 / schema / media / customers 探针 / draft-types 读侧原始路由已稳定
- `operations / products / orders minimal-diagnostic` 已成立
- 产品草稿 helper、订单草稿 helper、写侧护栏、人工接管规则、通知 fallback 已存在
- 任务 3 / 4 / 5 的平台内能力当前仍受权限或安全边界限制
- 任务 6 已有 provider-agnostic notifier + outbox fallback，真实 provider 尚未配置

## 本阶段分解
### A. 先定义外部草稿工作流输入 / 输出协议
- 新增 `docs/framework/WIKA_外部草稿工作流说明.md`
- 明确两类输入：
  - 回复草稿输入
  - 订单草稿输入
- 明确三类输出：
  - reply draft
  - order draft package
  - workflow meta
- 明确哪些字段可自动生成，哪些字段仍需人工补

### B. 实现外部草稿工作流模块
- 新增或增强：
  - `shared/data/modules/alibaba-external-reply-drafts.js`
  - `shared/data/modules/alibaba-order-drafts.js`
  - 如有必要，再加一个轻量 workflow pack 封装
- 回复草稿尽量复用：
  - `products/detail`
  - `products/score`
  - `products/groups`
  - `products/minimal-diagnostic`
  - `products/schema/render`
- 订单草稿尽量复用：
  - `alibaba-order-drafts.js`
  - `orders/minimal-diagnostic`
- 缺价格 / 交期 / 目的国 / 客户身份等关键条件时：
  - 不瞎编
  - 明确 blocker
  - 给出人工补充建议
- 若适合告警：
  - 生成结构化 alert payload
  - 与现有 notifier / alerts 结构兼容
  - 但不触发真实外发

### C. 形成最小可用入口与样例
- 优先考虑内部 POST 路由：
  - `/integrations/alibaba/wika/tools/reply-draft`
  - `/integrations/alibaba/wika/tools/order-draft`
- 若路由不适合，则至少保留可重复执行的 demo script
- 至少沉淀两组样例：
  - 信息相对完整的回复草稿
  - 信息缺失明显的回复 / 订单草稿
- 必须新增或更新：
  - `docs/framework/WIKA_外部回复草稿样例.json`
  - `docs/framework/WIKA_外部订单草稿样例.json`

## 本阶段明确排除
- XD
- mydata / overview / 数据管家
- inquiries / messages / customers 新验证
- order create 新验证
- RFQ
- 真实商品发布
- 真实线上商品修改
- 真实客户沟通
- 平台内回复发送
- 平台内订单创建
- 自动进入下一阶段

## 执行规则
1. 本阶段不追求平台内自动执行
2. 只追求形成“人可直接使用的外部草稿工作流层”
3. 若信息不足，就把 blocker 写清楚，不得瞎补
4. 不得把“草稿已生成”误写成“平台内已回复 / 已创单”
5. 每个新 API 最多 3 轮有差异尝试；但本阶段原则上不新增 API 验证

## 完成标准
- 已形成一套外部草稿工作流输入 / 输出协议
- 已实现回复草稿生成能力
- 已实现订单草稿包生成能力
- 已形成至少 2 组样例产物
- 若采用 route 方案，则已完成最小验收；若采用脚本方案，则已可重复生成样例
- 已明确写清这不是平台内自动回复，也不是平台内订单创建
- 已更新基线、计划、缺口矩阵、复用清单、候选池、自治推进日志
- 本阶段完成后停止，不自动进入下一阶段

## 当前推荐下一步
如果本阶段完成且仍需继续，只建议围绕“外部草稿工作流”的使用体验做低风险补强，例如更清楚的 blocker 分层或更稳定的样例输入模板；不回到新 API 验证循环。

## 停止条件
- 外部草稿工作流协议已明确
- 回复草稿与订单草稿都已可生成
- 样例与文档已落盘
- 路由或脚本验收完成
- 再往前推进会变成平台内写动作

## 交付物
- `docs/framework/WIKA_外部草稿工作流说明.md`
- `docs/framework/WIKA_外部回复草稿样例.json`
- `docs/framework/WIKA_外部订单草稿样例.json`
- `docs/framework/WIKA_项目基线.md`
- `docs/framework/WIKA_执行计划.md`
- `docs/framework/WIKA_面向6项任务_API缺口矩阵.md`
- `docs/framework/WIKA_已上线能力复用清单.md`
- `docs/framework/WIKA_下一批必须验证的API候选池.md`
- `docs/framework/WIKA_自治推进日志.md`

## 固定汇报结构
- 当前阶段
- 本轮目标
- 已复用的已上线能力
- 本轮新验证 / 新开发 / 新沉淀的内容
- 本轮明确排除的 API / 能力
- 已完成闸门
- 当前唯一阻塞点
- WIKA 是否遇到过
- WIKA 的解决方式是否可复用
- 下一步唯一动作
- 明确未完成项
- 当前还缺哪些经营关键数据
- 当前离“完成 6 项任务”还差哪些能力缺口
- 当前诊断里哪些是真实数据结论，哪些只是待验证判断
