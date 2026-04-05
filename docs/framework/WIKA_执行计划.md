# WIKA_执行计划

## 当前阶段
阶段 12：任务 6 的真实 provider 预接线与 dry-run 验证（已完成）

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

## 本阶段实际执行结果
### A. notifier 结构盘点与整理
- 已明确责任边界：
  - `wika-alerts.js`：alert 标准化
  - `wika-notifier.js`：provider 选择、配置检查、fallback 落盘
  - `wika-notifier-webhook.js`：webhook 适配层
  - `wika-notifier-resend.js`：Resend 适配层
- 已保留现有 outbox fallback，不破坏旧链路

### B. 真实 provider 预接线
- 已补 `webhook provider`
- 已补 `Resend provider`
- provider 已改为配置驱动：
  - `WIKA_NOTIFY_PROVIDER=none|webhook|resend`
- 已补充：
  - `WIKA_NOTIFY_DRY_RUN`
  - `WIKA_NOTIFY_ALERTS_ROOT`
  - `WIKA_NOTIFY_WEBHOOK_TIMEOUT_MS`
  - `WIKA_NOTIFY_RESEND_TIMEOUT_MS`

### C. dry-run 验证
- 已完成 `provider=none`
- 已完成 provider 已选但配置不完整
- 已完成 provider 已配置的 dry-run 路径
- 额外完成了：
  - `resend` dry-run

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

## 执行规则落实结果
1. 本阶段没有追求“所有通知渠道都打通”
2. 只完成了真实 provider 预接线与 dry-run
3. provider 不存在、配置不完整、调用失败时都保留 fallback
4. 已明确区分：
   - provider 代码已接好
   - 真实通知已送达

## 完成标准落实结果
- 已完成 notifier 结构整理
- 已新增 webhook provider 适配层
- 已新增 Resend provider 适配层
- 已完成 3 类 dry-run / fallback 验证
- 已更新文档、样例、配置模板
- 已明确区分：
  - 真实 provider 已接好
  - 真实通知已送达
- 阶段结束后已停止，不自动进入下一阶段

## 当前推荐下一步
如果继续任务 6，只建议做一件事：

- 在 Railway production 配置一个真实 provider
  - 优先 `webhook`
  - 其次 `Resend`

然后只做一次带 `TEST / DO-NOT-USE` 标记的最小真实外发验证。

## 停止条件
- 本阶段 3 类 dry-run / fallback 已全部验证完成
- 继续推进需要真实 provider 配置
- 再往前推进会从“预接线”变成“真实外发验证”

## 交付物
- `shared/data/modules/wika-notifier.js`
- `shared/data/modules/wika-notifier-webhook.js`
- `shared/data/modules/wika-notifier-resend.js`
- `scripts/validate-wika-notification-phase12.js`
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
