# AGENTS.md

## 仓库总则
- 先看仓库结构，再改文件。
- 多步骤任务先做简短计划，再实施。
- 优先做小而安全的修改，不做无边界重写。
- 要求不清时，先明确假设，再编码。
- 修改完成后，必须说明改了什么、为什么改、怎么验证。

## 当前作用范围
- 本仓库当前业务主线只推进 WIKA。
- XD 业务能力冻结，不做新路由开发、不做新 API 验证、不推进 XD 业务结论。
- 所有任务按“阶段闭环”执行，不自动进入下一阶段。

## 目录边界
- 今后 WIKA 的业务工作、文档、脚本、证据、规划材料，只进入 `WIKA/` 对应目录。
- 今后 XD 的业务工作、文档、脚本、证据、规划材料，只进入 `XD/` 对应目录。
- truly shared / common 内容单独保留在根目录或 `shared/`、`src/`、`common/`，不再混放到 WIKA 或 XD 业务目录。
- 不确定归属的内容，先保留在共享区或待归档区，不要强行塞进 `WIKA/` 或 `XD/`。

## 生产优先
- 一律复用 Railway production 认证闭环。
- 一律走 Alibaba 官方 `/sync + access_token + sha256`。
- 禁止回退到本地 `.env`、本地 callback、本地 token 文件、本地 cookie 旁路。

## 已上线能力只复用，不重复重做
以下 WIKA 线上能力只允许复用，不要重复做适配性验证或重复实现，除非是在修复回归：
- `/integrations/alibaba/wika/data/products/list`
- `/integrations/alibaba/wika/data/products/score`
- `/integrations/alibaba/wika/data/products/detail`
- `/integrations/alibaba/wika/data/products/groups`
- `/integrations/alibaba/wika/data/categories/tree`
- `/integrations/alibaba/wika/data/categories/attributes`
- `/integrations/alibaba/wika/data/products/schema`
- `/integrations/alibaba/wika/data/products/schema/render`
- `/integrations/alibaba/wika/data/products/schema/render/draft`
- `/integrations/alibaba/wika/data/media/list`
- `/integrations/alibaba/wika/data/media/groups`
- `/integrations/alibaba/wika/data/orders/list`
- `/integrations/alibaba/wika/data/orders/detail`
- `/integrations/alibaba/wika/data/orders/fund`
- `/integrations/alibaba/wika/data/orders/logistics`
- `/integrations/alibaba/wika/reports/operations/traffic-summary`
- `/integrations/alibaba/wika/reports/products/performance-summary`
- `/integrations/alibaba/wika/reports/operations/management-summary`
- `/integrations/alibaba/wika/reports/products/management-summary`
- `/integrations/alibaba/wika/reports/orders/management-summary`
- `/integrations/alibaba/wika/reports/operations/minimal-diagnostic`
- `/integrations/alibaba/wika/reports/products/minimal-diagnostic`
- `/integrations/alibaba/wika/reports/orders/minimal-diagnostic`
- `/integrations/alibaba/wika/tools/reply-draft`
- `/integrations/alibaba/wika/tools/order-draft`

## 当前已收口、暂不主线推进
- 不做新的 Alibaba API 无边界探索。
- 不推进 inquiries / messages / customers 新路线。
- 不推进 order create。
- 不推进 RFQ。
- 不做任何写侧动作，除非任务明确要求且已证明低风险、可隔离、可回滚。

## 状态术语必须严格区分
禁止混淆以下概念：
- 文档存在
- 接口候选存在
- 已过授权层
- 已形成正式原始路由
- 已能读数据
- 已能写回平台
- 已完成业务闭环

允许使用的判断应明确落到可审计分类，例如：
- 真实 JSON 样本数据
- 业务参数错误（说明已过授权层）
- 权限错误
- 应用能力不匹配
- 旧体系 / 高风险
- 当前未识别到可用入口
- 当前无法证明低风险边界，因此不继续实写验证

## 尝试预算
- 每个新 API 最多允许 3 轮“有实质差异的修正尝试”。
- 超过 3 轮仍无新证据，必须归类并前进。
- 不得在同一接口上死循环。

## 写侧安全边界
默认不做以下动作：
- 真实商品发布
- 真实线上商品修改
- 真实客户沟通
- 真实订单创建

只有在能够证明“低风险、可隔离、可清理、可回滚”时，才允许继续推进最小真实写入验证。
若边界未被证明，只能停在：
- 真实生产分类
- payload / 参数门槛确认
- 草稿链路增强
- 风险收口与文档落盘

## Git 与文档
- 每个阶段开始前做一次 git checkpoint。
- 每个阶段结束后再做一次 git checkpoint。
- 若远端 push 可达，在阶段结束时重试一次 push；若仍失败，记录到文档后停止。

状态变化时必须更新：
- `WIKA/docs/framework/WIKA_项目基线.md`
- `WIKA/docs/framework/WIKA_执行计划.md`
- `WIKA/docs/framework/WIKA_面向6项任务_API缺口矩阵.md`
- `WIKA/docs/framework/WIKA_已上线能力复用清单.md`
- `WIKA/docs/framework/WIKA_下一批必须验证的API候选池.md`
- `WIKA/docs/framework/WIKA_自治推进日志.md`

## 工作方式
- 每次阶段开始前先读：
  - `WIKA/docs/framework/WIKA_项目基线.md`
  - `WIKA/docs/framework/WIKA_执行计划.md`
- 每次只做一个阶段。
- 优先做“能增加真实证据”的最小下一步。
- 阶段完成后停止，不自动进入下一阶段。

## 输出规范
- 所有中间进度、最终总结、验收结果、提交说明，一律使用简体中文输出。
- 如果需要引用 API 名、路由路径、字段名、commit hash、错误码、文件路径、代码片段，可保留英文原样。
- 代码注释保持简洁、务实，不写空话。
- 不要编造文件、命令、URL 或验证结果。
- 如果改动可能影响生产行为，必须先明确提示风险。

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
