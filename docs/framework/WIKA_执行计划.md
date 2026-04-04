# WIKA_执行计划

## 当前阶段
阶段 8：任务 6 的正式通知闭环

## 本阶段唯一目标
把当前已经存在的阻塞分类、人工接管规则、结构化告警样例，落成“正式通知闭环”。

优先级顺序：

1. 先盘点仓库与生产环境里是否已有可复用的邮件/通知基础设施
2. 若已有，则优先复用并打通最小通知链路
3. 若没有，则实现 provider-agnostic 的通知模块 + outbox / pending alert fallback

## 起始基线

- 只推进 `WIKA`
- 一律复用 Railway production 认证闭环与 `/sync + access_token + sha256`
- 既有 WIKA 读侧原始路由已经稳定上线并可复用
- `mydata / overview / self.product` 当前不再作为主线推进
- 任务 3 当前卡在 `photobank.upload / product.add.draft` 的安全边界不足
- 任务 4 当前卡在 `customers` 权限 / 真实 id，以及 `inquiries / messages` 缺少明确读侧方法名
- 当前已存在：
  - 写侧护栏 helper
  - 人工接管规则文档
  - 结构化告警样例

## 候选顺序

### 第一梯队：现有通知基础设施盘点
1. 仓库内现有邮件 / webhook / 通知能力
2. `.env.example` 与已有配置约定
3. Railway production 环境里现有通知 provider 痕迹

### 第二梯队：正式通知闭环
1. 复用现有 provider（若存在）
2. provider-agnostic 通知模块
3. outbox / pending alert fallback
4. 最小闭环测试

注意：

- 不得为了这一阶段引入沉重外部依赖
- 若无现成 provider，优先落地轻量、可扩展、可退化的通知模块

## 本阶段明确排除

- XD
- mydata / overview / 数据管家
- inquiries / messages / customers 的新验证
- order create
- RFQ
- 真实商品发布
- 真实线上商品修改
- 真实客户沟通
- 任何新的真实写入验证
- 自动进入下一阶段

## 执行规则

1. 先盘点现有通知基础设施，再实现通知闭环，最后做最小闭环测试
2. 不追求把所有通知渠道都接上，只先形成 1 条正式可用或可退化的通知闭环
3. 若存在现成 provider，则优先复用
4. 若不存在，则 provider-agnostic + fallback 必须做扎实
5. 若正式 provider 不可用，不能让告警消失，必须结构化落盘

## 完成标准

- 已完成通知能力盘点
- 已形成正式通知模块或 provider-agnostic + fallback 方案
- 已完成至少 2 个真实阻塞场景的最小闭环测试
- 已形成“触发 -> 生成 -> 分发或落盘”的完整链路
- 已更新基线、计划、缺口矩阵、复用清单、候选池、自治推进日志
- 阶段结束后停止，不自动进入下一阶段

## 停止条件

- 已形成最小正式通知闭环
- 或已证明当前只能稳定落到 fallback，不再继续引入外部 provider
- 或继续推进需要新的外部账号 / 权限 / 人工登录配合

## 交付物

- docs/framework/WIKA_通知能力盘点.md
- docs/framework/WIKA_正式通知闭环说明.md
- docs/framework/WIKA_正式通知样例.json
- docs/framework/WIKA_项目基线.md
- docs/framework/WIKA_执行计划.md
- docs/framework/WIKA_面向6项任务_API缺口矩阵.md
- docs/framework/WIKA_已上线能力复用清单.md
- docs/framework/WIKA_下一批必须验证的API候选池.md
- docs/framework/WIKA_自治推进日志.md

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
