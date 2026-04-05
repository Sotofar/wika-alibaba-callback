# WIKA_执行计划

## 当前阶段
阶段 14：任务 4/5 的外部草稿工作流层（已完成）

## 本阶段唯一目标
不再验证新 Alibaba API，也不再推进平台内读写。只基于当前已上线、已验证、已沉淀的能力，形成“外部草稿工作流层”：
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

## 本阶段实际执行结果

### A. 外部草稿工作流输入 / 输出协议
- 已新增：`docs/framework/WIKA_外部草稿工作流说明.md`
- 已明确两类输入：
  - 回复草稿输入
  - 订单草稿输入
- 已明确三类输出：
  - reply draft
  - order draft package
  - workflow meta

### B. 外部草稿工作流模块
- 已新增：
  - `shared/data/modules/alibaba-external-reply-drafts.js`
- 已增强：
  - `shared/data/modules/alibaba-order-drafts.js`
- 回复草稿已复用：
  - `products/detail`
  - `products/score`
  - `products/minimal-diagnostic`
  - `products/schema/render`
- 订单草稿已复用：
  - `alibaba-order-drafts.js`
  - `orders/minimal-diagnostic`
  - `orders/draft-types`
- 缺价格 / 交期 / 目的地 / 客户身份时：
  - 当前会输出 blocker
  - 当前会给出人工补充建议
  - 当前会生成与现有 alerts 兼容的结构化 alert payload

### C. 最小可用入口与样例
- 已新增内部 POST 路由：
  - `/integrations/alibaba/wika/tools/reply-draft`
  - `/integrations/alibaba/wika/tools/order-draft`
- 已完成线上验收
- 已新增样例：
  - `docs/framework/WIKA_外部回复草稿样例.json`
  - `docs/framework/WIKA_外部订单草稿样例.json`
- 已新增验证脚本：
  - `scripts/validate-wika-workflow-phase14.js`

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

## 推进规则落实结果
1. 本阶段没有新增 Alibaba API 验证
2. 本阶段没有做任何平台内写动作
3. 本阶段只做了“人可直接使用的外部草稿工作流层”
4. 缺价格 / 交期 / 目的地 / 客户身份时，统一输出 blocker，不瞎编
5. 明确保留边界：草稿已生成，不代表平台内已回复或已创单

## 完成标准落实结果
- 已形成一套外部草稿工作流输入 / 输出协议
- 已实现回复草稿生成能力
- 已实现订单草稿包生成能力
- 已形成至少 2 组样例产物
- route 方案已完成最小线上验收
- 已明确写清这不是平台内自动回复，也不是平台内订单创建
- 已更新基线、计划、缺口矩阵、复用清单、候选池、自治推进日志
- 本阶段到此停止，不自动进入下一阶段

## 当前推荐下一步
如果继续，只建议在当前外部草稿工作流层上做更稳的输入模板、blocker 分层和人工补单模板；不回到新 API 验证循环，除非出现新的官方明确入口。

## 停止条件
- 外部草稿工作流协议已明确
- 回复草稿与订单草稿都已可生成
- 样例与文档已落盘
- route 验收已完成
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
