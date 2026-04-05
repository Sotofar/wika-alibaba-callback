# WIKA_执行计划

## 当前阶段
阶段 16：任务 4/5 的外部草稿工作流质量评估、回归闸门与交接包导出

## 本阶段唯一目标
不验证任何新的 Alibaba API，不推进平台内读写，也不推进真实通知外发。
只在现有：

- `/integrations/alibaba/wika/tools/reply-draft`
- `/integrations/alibaba/wika/tools/order-draft`

基础上，补齐一层：

- 可评估
- 可回归
- 可审计
- 可交接

的外部草稿工作流质量控制层。

## 起始基线
- 当前实际起始仓库状态以本阶段开始时的 `HEAD` 为准：`14997a3`
- 当前只推进 `WIKA`
- 一律复用 Railway production 闭环与 `/sync + access_token + sha256`
- 当前禁止任何新的 Alibaba API 验证
- 当前禁止任何平台内写动作
- 当前已稳定存在：
  - `reply-draft` / `order-draft` 工具路由
  - 产品 / 订单 / operations minimal-diagnostic
  - 产品草稿 helper
  - 订单草稿 helper
  - notifier / alerts / fallback
  - blocker taxonomy
  - 输入模板、人工补单模板、样例产物

## 本阶段分解
### A. 建立统一质量评估层
优先新增共享 review helper，而不是强行改主路由语义。

至少覆盖：

- `structure_completeness`
- `blocker_consistency`
- `minimum_package_readiness`
- `handoff_clarity`
- `manual_completion_readiness`
- `externally_usable_boundary`
- `source_traceability`

统一 review 输出至少包含：

- `review_profile`
- `review_version`
- `readiness_level`
- `passed_checks`
- `failed_checks`
- `review_findings`
- `recommended_next_action`
- `handoff_mandatory`
- `draft_usable_externally`

### B. 建立可失败的回归闸门
- 样例从当前 6 组扩充到至少 8 组
- 每组样例必须有明确断言
- 验证失败必须返回非 0 退出码
- 主入口使用稳定命名：
  - `scripts/validate-wika-external-draft-regression.js`
- 旧 `phase14` 脚本若保留，只能作为薄别名

### C. 建立人工交接包导出
至少支持：

- reply handoff pack
- order handoff pack

导出格式至少支持：

- JSON
- Markdown

交接包必须明确：

- 这是外部草稿
- 不代表平台内已回复
- 不代表平台内已创单
- 不代表真实通知已送达

### D. 做 profile / taxonomy / version 治理
收口：

- workflow_profile 定义
- template_version 定义
- blocker taxonomy usage matrix
- profile coverage matrix
- template_version 最小 changelog

代码和文档必须共用同一套命名。

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
- 真实通知外发
- 自动进入下一阶段

## 推进规则
1. 只复用现有已验证读侧与现有中间层
2. 不新增任何平台内写动作
3. 不做任何新的 Alibaba API 探测、撞权限、撞参数
4. 若发现潜在新 API，只记入候选池，不实测
5. 所有新增结构必须向后兼容
6. 当前边界必须持续写清：这仍然只是外部草稿工作流层

## 完成标准
- 已形成统一质量评估层
- 已形成可失败的回归闸门
- 已形成 reply / order handoff pack 导出
- 已完成 profile / taxonomy / version 治理
- 已刷新样例并完成回归脚本验证
- 已更新基线、计划、缺口矩阵、复用清单、候选池、自治推进日志
- 本阶段完成后停止，不自动进入下一阶段

## 停止条件
- 当前外部草稿工作流已经具备稳定 review / regression / handoff 导出能力
- 或继续推进只会重复已有工作，不再增加真实证据

## 交付物
- `shared/data/modules/alibaba-external-draft-review.js`
- `shared/data/modules/alibaba-external-workflow-taxonomy.js`
- `scripts/validate-wika-external-draft-regression.js`
- `docs/framework/WIKA_项目基线.md`
- `docs/framework/WIKA_执行计划.md`
- `docs/framework/WIKA_自治推进日志.md`
- `docs/framework/WIKA_外部草稿工作流说明.md`
- `docs/framework/WIKA_外部回复输入模板.md`
- `docs/framework/WIKA_外部订单输入模板.md`
- `docs/framework/WIKA_人工补单模板.md`
- `docs/framework/WIKA_已上线能力复用清单.md`
- `docs/framework/WIKA_面向6项任务_API缺口矩阵.md`
- `docs/framework/WIKA_下一批必须验证的API候选池.md`

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
