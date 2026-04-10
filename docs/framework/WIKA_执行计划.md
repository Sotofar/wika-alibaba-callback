# WIKA_执行计划

## 当前阶段
阶段 20：WIKA 多轮稳定化复跑与 XD 标准权限逐项确认

## 本阶段唯一目标
先对 `WIKA` 已验证 access 接口做多轮稳定化复跑，再把未决队列按相同方法映射到 `XD` 做标准权限逐项确认；如果基础 production 路由已经证明统一超时/不可达，则在安全边界内收口为 `BLOCKED_ENV`，不继续扩大到下游 route replay。

## 起始基线
- 当前实际起始仓库状态以本阶段开始时的 `HEAD` 为准：`2d804cb`
- 本阶段开始 checkpoint：`33206af`
- 当前任务先做 `WIKA`，再做 `XD` 标准权限预检
- 一律复用 Railway production 闭环与 `/sync + access_token + sha256`
- 当前禁止任何本地 `.env` / callback / token 旁路
- 当前禁止任何平台内写动作
- 阶段 17/18/19 的收口结论保持不变

## 本阶段分解
### A. 阶段 0：预检
- 盘点目录、脚本、依赖、环境变量痕迹、网络可达性与权限模型
- 盘点 WIKA 已验证接口清单、历史未决队列与 XD 复测模板
- 固定本轮交付物、风险点和停止条件

### B. 阶段 1：WIKA 多轮稳定化复跑
- Round 1：基础路由原样复现
- Round 2：仅对失败项检查是否存在安全的参数 / 分页 / 时间窗口纠偏入口
- Round 3：若有恢复成功项，再做可复现性确认
- 若基础路由统一超时/不可达，则全量 route replay 收口为 `BLOCKED_ENV`

### C. 阶段 2：导出 WIKA 未决队列
- 汇总历史未跑通、失败原因不清楚、以及本轮仍未通过对象
- 为每项补齐根因假设、下一步建议、是否适合 XD 复测、标准/高权限建议、写操作风险

### D. 阶段 3：XD 逐项确认
- 只围绕 WIKA 未决队列做标准权限最小验证
- 若基础路由同样统一超时/不可达，则 XD 收口为 `BLOCKED_ENV`
- 本轮不进入高权限补测

## 本阶段明确排除
- 任何新的 Alibaba API 探测、穷举、撞参数、撞权限
- 任何平台内写动作
- 本地 `.env` / callback / token / cookie 旁路
- 高权限盲扫
- 真实商品发布、真实线上修改、真实客户沟通、真实通知外发
- 自动进入下一阶段

## 推进规则
1. 只复用现有 WIKA 流程、脚本结构、校验方式、日志格式
2. 只走 Railway production + 官方 `/sync + access_token + sha256`
3. 若 `/health + auth/debug` 已连续多轮超时/不可达，则统一按 `BLOCKED_ENV` 收口
4. 不把环境阻塞误写成接口回归
5. 不把预检结果误写成能力已打通
6. 不把 XD 复测扩大成全量高权限 API 扫描

## 当前收口结果
- 当前已完成阶段 20 预检、WIKA 多轮复跑收口、未决队列导出、XD 标准权限预检确认
- 当前关键运行结论已固定：
  - `/health`、`/integrations/alibaba/auth/debug`、`/integrations/alibaba/xd/auth/debug` 在多轮 precheck 下连续超时
  - 因此当前 WIKA 已验证 route replay 统一按 `BLOCKED_ENV` 收口
  - XD 侧同样先被基础环境阻塞，当前不形成新的标准权限结论
- 当前关键复用结论已固定：
  - `shared/access/troubleshooting.md` 与 `shared/access/data-validation-checklist.md` 已加入“基础路由统一超时/不可达 -> 按 BLOCKED_ENV 收口”的共享规则
  - `projects/wika/access` 与 `projects/xd/access` 已补建目录级 `AGENTS.md`

## 当前预期交付
- `projects/wika/access/plans.md`
- `projects/wika/access/documentation.md`
- `projects/wika/access/replay_matrix.csv`
- `projects/wika/access/replay_summary.md`
- `projects/wika/access/unresolved_queue.md`
- `projects/xd/access/api_matrix.csv`
- `projects/xd/access/api_coverage.md`
- `projects/xd/access/permission_gap.md`
- `docs/framework/evidence/stage20-access-stabilization-summary.json`
- `docs/framework/WIKA_项目基线.md`
- `docs/framework/WIKA_执行计划.md`
- `docs/framework/WIKA_面向6项任务_API缺口矩阵.md`
- `docs/framework/WIKA_已上线能力复用清单.md`
- `docs/framework/WIKA_下一批必须验证的API候选池.md`
- `docs/framework/WIKA_自治推进日志.md`

## 完成标准
- WIKA 已验证接口全部得到本轮明确状态，不保留“未复核”对象
- WIKA 未决队列已导出，且每项有结论、根因假设、下一步建议
- XD 已至少完成标准权限 precheck；若被环境阻塞，需有统一 `BLOCKED_ENV` 证据
- 共享层只同步已确认规则，不写入猜测
- 本阶段完成后停止，不自动进入下一阶段

## 停止条件
- 连续两轮没有新增通过、没有新增明确根因、没有新增可执行修正项
- 或命中统一环境阻塞，继续推进只会把问题从“环境不可用”误写成“接口失败”

## 交付物
- `projects/wika/access/plans.md`
- `projects/wika/access/documentation.md`
- `projects/wika/access/replay_matrix.csv`
- `projects/wika/access/replay_summary.md`
- `projects/wika/access/unresolved_queue.md`
- `projects/xd/access/api_matrix.csv`
- `projects/xd/access/api_coverage.md`
- `projects/xd/access/permission_gap.md`
- `docs/framework/evidence/stage20-access-stabilization-summary.json`
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
