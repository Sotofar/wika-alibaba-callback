# WIKA_执行计划

## 当前阶段
阶段 9：任务 2 的最小经营诊断层（基于现有真实数据）

## 本阶段唯一目标
只复用当前已经上线并已线上验证的 WIKA 真实读侧能力，形成最小但可信的经营诊断层。

## 起始基线
- 只推进 `WIKA`
- 一律复用 Railway production 认证闭环与 `/sync + access_token + sha256`
- 已上线的 WIKA 读侧原始路由已稳定可复用
- `mydata / overview / self.product` 当前不再作为主线推进
- 任务 3 当前卡在 `photobank.upload / product.add.draft` 的低风险边界不足
- 任务 4 当前卡在 `customers` 权限 / 真实 id，以及 `inquiries / messages` 缺少明确读侧方法名
- 任务 6 的最小正式通知闭环已经成立

## 可复用数据源
- `/integrations/alibaba/wika/data/products/list`
- `/integrations/alibaba/wika/data/products/score`
- `/integrations/alibaba/wika/data/products/detail`
- `/integrations/alibaba/wika/data/products/groups`
- `/integrations/alibaba/wika/data/orders/list`
- `/integrations/alibaba/wika/data/orders/detail`
- `/integrations/alibaba/wika/data/orders/fund`
- `/integrations/alibaba/wika/data/orders/logistics`
- `/integrations/alibaba/wika/reports/products/management-summary`
- `/integrations/alibaba/wika/data/categories/tree`
- `/integrations/alibaba/wika/data/categories/attributes`
- `/integrations/alibaba/wika/data/products/schema`
- `/integrations/alibaba/wika/data/products/schema/render`
- `/integrations/alibaba/wika/data/media/list`
- `/integrations/alibaba/wika/data/media/groups`
- `/integrations/alibaba/wika/data/products/schema/render/draft`

## 本阶段明确排除
- XD
- 任何新的 Alibaba API 验证
- `mydata / overview / 数据管家`
- `inquiries / messages / customers` 新验证
- `order create`
- `RFQ`
- 真实商品发布
- 真实线上商品修改
- 真实客户沟通
- webhook / Resend 实发配置
- 自动进入下一阶段

## 执行顺序
### A. 定义当前可诊断口径
1. 基于现有真实数据明确当前能稳定回答哪些经营问题
2. 明确当前不能回答的问题
3. 新增 `docs/framework/WIKA_最小经营诊断口径.md`

### B. 实现最小经营诊断层
1. 复用现有真实读侧数据
2. 形成至少 1 条最小经营诊断报告路由
3. 输出必须包含：
   - `generated_at`
   - `data_scope`
   - `sample_size`
   - `time_window`
   - `available_signals`
   - `diagnostic_findings`
   - `recommendations`
   - `missing_data_blockers`
4. 必须显式说明采样边界与缺失指标

### C. 形成样例与说明
1. 新增或更新：
   - `docs/framework/WIKA_最小经营诊断说明.md`
   - `docs/framework/WIKA_最小经营诊断样例.json`
2. 说明数据来源、推导逻辑、强结论/弱建议与缺口边界

## 执行规则
1. 不验证新 API
2. 不发明当前未打通的数据指标
3. 只基于真实可读数据做诊断
4. 不得把最小经营诊断层误写成完整经营驾驶舱
5. 若读侧调用成本较高，可使用有限样本聚合，但必须在输出中明确样本边界

## 完成标准
- 已形成一份“当前可诊断口径”文档
- 已形成至少 1 条最小经营诊断报告路由并完成线上验收
- 已形成诊断样例和说明文档
- 已明确当前诊断层仍缺哪些关键数据
- 已更新基线、计划、缺口矩阵、复用清单、候选池、自治推进日志
- 阶段结束后停止，不自动进入下一阶段

## 停止条件
- 最小经营诊断层已基于真实数据跑通
- 或现有真实数据不足以支撑进一步诊断，需要等待新的真实读侧入口

## 交付物
- docs/framework/WIKA_最小经营诊断口径.md
- docs/framework/WIKA_最小经营诊断说明.md
- docs/framework/WIKA_最小经营诊断样例.json
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
