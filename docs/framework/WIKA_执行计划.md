# WIKA_执行计划

## 当前阶段
阶段 12：任务 6 的真实 provider 预接线与 dry-run 验证

## 本阶段唯一目标
不再碰 Alibaba 新 API；只把当前已经成立的 provider-agnostic notifier + outbox fallback，升级成“可接真实外发 provider”的结构，并完成 dry-run 验证。

## 起始基线
- 只推进 `WIKA`
- 一律复用 Railway production 认证闭环与 `/sync + access_token + sha256`
- 当前最小正式通知闭环已经成立：
  - 触发
  - 结构化告警生成
  - outbox fallback 落盘
- 当前 production 中没有已确认的正式通知 provider 配置
- 任务 2 的总诊断 + 产品子诊断 + 订单子诊断都已成立
- 任务 3 / 4 / 5 当前都被权限或安全边界卡住

## 本阶段执行顺序
### A. notifier 结构盘点与整理
1. 读取并复核：
   - `shared/data/modules/wika-alerts.js`
   - `shared/data/modules/wika-notifier.js`
   - `docs/framework/WIKA_通知能力盘点.md`
   - `docs/framework/WIKA_正式通知闭环说明.md`
   - `docs/framework/WIKA_正式通知样例.json`
2. 明确责任边界：
   - alert 标准化
   - provider 选择
   - 外发动作
   - fallback 落盘
3. 若结构不够清晰，先重构为更清楚的 provider-agnostic 结构，但不得破坏现有 outbox fallback

### B. 真实 provider 预接线
1. 优先补 `webhook provider`
2. 再补 `Resend provider`
3. provider 必须配置驱动：
   - `WIKA_NOTIFY_PROVIDER=webhook|resend|none`
4. 必须保留 fallback：
   - provider 不存在
   - provider 配置不完整
   - provider 调用失败
   都要退回 outbox / pending alert，不得丢失告警
5. 更新：
   - `.env.example`
   - `docs/framework/WIKA_通知能力盘点.md`
   - `docs/framework/WIKA_正式通知闭环说明.md`
   - `docs/framework/WIKA_正式通知样例.json`

### C. dry-run 验证
1. 覆盖 `provider=none`
2. 覆盖 provider 已选但配置不完整
3. 覆盖 provider 已配置的 dry-run 路径
4. 至少证明：
   - provider selection 正常
   - payload 组装正常
   - fallback 仍然成立
   - 失败可审计
   - 不泄露 secret
5. 新增验证脚本：
   - `scripts/validate-wika-notification-phase12.js`

## 本阶段明确排除
- XD
- mydata / overview / 数据管家
- inquiries / messages / customers 新验证
- order create 新验证
- RFQ
- 真实商品发布
- 真实线上商品修改
- 真实客户沟通
- 任何新的真实写入验证
- 自动进入下一阶段

## 执行规则
1. 本阶段不追求“所有通知渠道都打通”
2. 只追求把真实 provider 预接线做好，并保住 fallback
3. 若环境里没有真实 provider 配置，也算正常，不影响阶段完成
4. 严禁把“provider 代码已接好”写成“真实通知已送达”
5. 只有“触发 -> 生成 -> 分发或可审计落盘”成立，才允许写成最小正式通知闭环已成立

## 完成标准
- 已完成 notifier 结构整理
- 已新增 webhook provider 适配层
- 已新增 Resend provider 适配层，或明确记录为何当前只实现 webhook
- 已完成 3 类 dry-run / fallback 验证
- 已更新文档、样例、配置模板
- 已明确区分：
  - 真实 provider 已接好
  - 真实通知已送达
- 阶段结束后停止，不自动进入下一阶段

## 停止条件
- 3 类 dry-run / fallback 都已验证完成
- 或继续推进需要真实外部 provider 才能前进
- 或继续推进会引入不必要的外部依赖与风险

## 交付物
- `docs/framework/WIKA_通知能力盘点.md`
- `docs/framework/WIKA_正式通知闭环说明.md`
- `docs/framework/WIKA_正式通知样例.json`
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
