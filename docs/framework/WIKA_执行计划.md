# WIKA_执行计划

## 当前阶段
阶段 13：任务 6 的真实 provider 最小真实外发验证（已完成）

## 本阶段唯一目标
不再碰任何 Alibaba 新 API，也不再扩 notifier 结构；只验证当前已预接线的真实 provider（优先 webhook，其次 Resend）是否能完成一次最小真实外发。

## 起始基线
- 只推进 `WIKA`
- 一律复用 Railway production 认证闭环与 `/sync + access_token + sha256`
- 当前 provider-agnostic notifier、webhook/resend 适配层、outbox fallback、dry-run 已成立
- 当前 production 中尚未证明存在可直接用于真实外发的 provider 配置
- 任务 2 的总诊断 + 产品子诊断 + 订单子诊断都已成立
- 任务 3 / 4 / 5 当前都被权限或安全边界卡住

## 本阶段实际执行结果
### A. 真实 provider 前置条件检查
- 已读取：
  - `.env.example`
  - `docs/framework/WIKA_正式通知闭环说明.md`
  - notifier 相关代码
- 已检查当前 shell 环境中的 `WIKA_NOTIFY_*`
- 已检查 Railway production 中的 `WIKA_NOTIFY_*`
- 当前结果：
  - shell 环境无完整 provider 配置
  - Railway production 中也没有任何 `WIKA_NOTIFY_*` 变量
  - 当前无法证明存在可控、低风险、用于测试的真实 destination

### B. 真实外发验证结果
- 本阶段没有进入真实外发
- 原因不是代码缺失，而是：
  - 缺配置
  - 缺可控目标
- 因此本阶段严格停在：
  - 真实 provider 已接好
  - dry-run 已成立
  - fallback 已成立
  - 真实送达未验证

### C. 文档收口
- 已更新：
  - `docs/framework/WIKA_正式通知样例.json`
  - `docs/framework/WIKA_通知能力盘点.md`
  - `docs/framework/WIKA_正式通知闭环说明.md`
  - `docs/framework/WIKA_项目基线.md`
  - `docs/framework/WIKA_执行计划.md`
  - `docs/framework/WIKA_面向6项任务_API缺口矩阵.md`
  - `docs/framework/WIKA_已上线能力复用清单.md`
  - `docs/framework/WIKA_下一批必须验证的API候选池.md`
  - `docs/framework/WIKA_自治推进日志.md`

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

## 推进规则落实结果
1. 本阶段没有新增 provider 类型
2. 本阶段没有重构 notifier 架构
3. 本阶段只做了“是否具备真实送达条件”的最后一步检查
4. 因为外部条件不足，已及时停止，没有追加无效开发

## 完成标准落实结果
本阶段走的是收口路径：

- 已明确证明当前缺配置或缺安全目标
- 已更新文档并说明为什么现在不能做真实外发
- 没有再做无效代码扩展

## 当前推荐下一步
如果继续任务 6，只建议做一件事：

- 在 Railway production 配置一个真实 provider
  - 优先 `webhook`
  - 其次 `Resend`

并确保目标明显可控、低风险、用于测试；然后再做一次最小真实外发验证。

## 停止条件
- 已明确缺配置 / 缺安全目标
- 继续推进需要外部真实 provider 条件
- 再往前推进会从“边界验证”变成“真实外发”

## 交付物
- `docs/framework/WIKA_正式通知样例.json`
- `docs/framework/WIKA_通知能力盘点.md`
- `docs/framework/WIKA_正式通知闭环说明.md`
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
