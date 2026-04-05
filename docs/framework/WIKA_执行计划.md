# WIKA_执行计划

## 当前阶段
阶段 13：任务 6 的真实 provider 最小真实外发验证

## 本阶段唯一目标
不再碰任何 Alibaba 新 API，也不再扩 notifier 结构；只验证当前已预接线的真实 provider（优先 webhook，其次 Resend）是否能完成一次最小真实外发。

## 起始基线
- 只推进 `WIKA`
- 一律复用 Railway production 认证闭环与 `/sync + access_token + sha256`
- 当前 provider-agnostic notifier、webhook/resend 适配层、outbox fallback、dry-run 已成立
- 当前 production 中尚未证明存在可直接用于真实外发的 provider 配置
- 任务 2 的总诊断 + 产品子诊断 + 订单子诊断都已成立
- 任务 3 / 4 / 5 当前都被权限或安全边界卡住

## 本阶段执行顺序
### A. 先检查真实 provider 配置是否具备
1. 读取：
   - `.env.example`
   - `docs/framework/WIKA_正式通知闭环说明.md`
   - 当前 notifier 代码
2. 确认当前支持的 provider 配置项
3. 检查当前环境中是否存在完整配置：
   - 优先 `webhook`
   - 其次 `resend`
4. 只有当以下条件同时成立时，才允许进入真实外发：
   - provider 已选择
   - provider 必需配置完整
   - 目标明显可控、低风险、用于测试
5. 若缺配置、缺安全目标、或无法证明目标可控：
   - 不再改 notifier 代码
   - 直接记录“缺配置 / 缺安全目标，本阶段停止”

### B. 做一次最小真实外发验证（仅当 A 成立时）
1. 只能选一个 provider：
   - 优先 `webhook`
   - 若 webhook 不可用，再看 `resend`
2. payload 必须显式标记：
   - `TEST`
   - `DO-NOT-USE`
   - `phase13`
3. 内容必须是低风险测试告警，不能包含敏感业务内容
4. 发送后必须记录：
   - provider
   - destination 类型（不得泄露 secret）
   - request / result 概况
   - 是否成功送达
   - 审计文件位置
5. 如果真实发送失败：
   - 必须保留 `failed + outbox fallback`
   - 不得把失败写成成功
6. 如果 webhook / Resend 目标不可控或不适合测试：
   - 不发送
   - 明确记录原因并停止

### C. 收口与文档
1. 必须更新：
   - `docs/framework/WIKA_正式通知样例.json`
   - `docs/framework/WIKA_通知能力盘点.md`
   - `docs/framework/WIKA_正式通知闭环说明.md`
   - `docs/framework/WIKA_项目基线.md`
   - `docs/framework/WIKA_执行计划.md`
   - `docs/framework/WIKA_面向6项任务_API缺口矩阵.md`
   - `docs/framework/WIKA_已上线能力复用清单.md`
   - `docs/framework/WIKA_下一批必须验证的API候选池.md`
   - `docs/framework/WIKA_自治推进日志.md`
2. 必须明确区分：
   - 真实 provider 已接好
   - 真实通知已送达
   - 仍只有 dry-run / fallback

## 本阶段明确排除
- XD
- mydata / overview / 数据管家
- inquiries / messages / customers 新验证
- order create 新验证
- RFQ
- 真实商品发布
- 真实线上商品修改
- 真实客户沟通
- 自动进入下一阶段

## 推进规则
1. 本阶段不新增 provider 类型
2. 本阶段不重构 notifier 架构
3. 本阶段只做“是否真实送达”的最后一小步验证
4. 若外部条件不足，及时停止，不做额外发散工作

## 完成标准
二选一即可：

### A. 成功路径
- 至少完成 1 次真实 provider 外发验证
- 有明确 `TEST / DO-NOT-USE` 审计证据
- fallback 仍保持正常

### B. 收口路径
- 已明确证明当前缺配置或缺安全目标
- 已更新文档并说明为什么现在不能做真实外发
- 没有再做无效代码扩展

## 停止条件
- 已完成最小真实外发验证
- 或已明确缺配置 / 缺安全目标
- 或继续推进会引入不可接受的真实外发风险

## 交付物
- `docs/framework/WIKA_正式通知样例.json`
- `docs/framework/WIKA_通知能力盘点.md`
- `docs/framework/WIKA_正式通知闭环说明.md`
- `.env.example`
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
