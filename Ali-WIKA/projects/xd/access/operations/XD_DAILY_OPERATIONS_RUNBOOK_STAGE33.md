# XD 日常运营 Runbook Stage33

## 1. 运营目标

XD 当前已经进入 `safe-scope complete`，日常运营目标不是继续试 API，而是稳定复用既有只读能力，持续产出以下内容：

- 每日关键 route 巡检
- 每日 XD 日报
- 每周 XD 周报
- 每日订单 / 商品样本运营摘要
- 每周老板摘要
- route 回归与异常发现
- restriction 对象是否满足 reopen gate 的判断

当前明确不能稳定产出的内容：

- 全量 GMV
- 转化率
- 国家结构
- 产品贡献归因
- 完整经营诊断
- 多页全量窗口统计

## 2. 每日固定流程

### Step 1：跑 critical route 巡检

- 使用：`node scripts/check-xd-critical-routes-stage31.js --json --markdown --output=Ali-WIKA/projects/xd/access/monitoring/runs/xd_critical_routes_daily_<date>`
- 目标：先确认 `/health`、`auth/debug`、`xd/auth/debug` 和核心稳定 route 是否仍健康

### Step 2：跑 XD 日报

- 使用：`node scripts/generate-xd-operations-report-stage31.js --mode=daily --start=<date> --end=<date> --timezone=Asia/Shanghai`
- 目标：生成当前页样本口径的日报 markdown / json

### Step 3：生成人读运营摘要

- 使用：
  - 读取当日日报 JSON
  - 读取最新巡检 JSON
  - 生成对业务侧可直接阅读的摘要
- 目标：把 route 状态、订单/商品样本信号和限制说明转成可分发内容

### Step 4：检查异常项

重点检查：

- `overall_status` 是否仍为 `PASS`
- 是否出现 `FAIL_ROUTE` / `FAIL_AUTH` / `FAIL_TIMEOUT`
- 当前页样本是否突然消失
- `total_count` / `total_item` 是否出现显著异常变化
- `SKIPPED_BY_SAFETY` 是否仍然只落在冻结对象

### Step 5：判断是否需要人工介入

需要人工介入的典型情况：

- `/health`、`auth/debug`、`xd/auth/debug` 任一失败
- 关键稳定 route 从 `PASS` 变成 `FAIL_*`
- 当前页样本异常消失
- JSON 已生成，但需要业务侧判断“今天该盯哪些样本问题”

## 3. 每周固定流程

### Step 1：确认上一完整自然周窗口

- 默认时区：`Asia/Shanghai`
- 只能使用上一完整自然周，不得把“当前状态附注”混入周报窗口

### Step 2：跑周报

- 使用：`node scripts/generate-xd-operations-report-stage31.js --mode=weekly --start=<week_start> --end=<week_end> --timezone=Asia/Shanghai`
- 目标：生成上一完整自然周的样本口径周报

### Step 3：生成老板摘要

- 基于周报 JSON、最新巡检结果和 stage30 freeze / reopen gate 口径
- 只保留：
  - 当前能稳定做什么
  - 本周有什么运营价值
  - 当前受限点是什么
  - 下周应该怎么用

### Step 4：汇总 route 健康趋势

- 对比最近至少两次巡检：
  - 是否持续 `PASS`
  - 是否出现新的 `FAIL_*`
  - 是否出现新的 `PASS_NO_DATA`
  - 是否有不该扩散的 `SKIPPED_BY_SAFETY`

### Step 5：复核限制说明并输出下周建议

- 再次明确：
  - 当前页样本不是全量
  - `total_count` / `total_item` 只是总量信号
  - fund/logistics 只是覆盖信号
  - restriction 对象没有新外部证据前不重开

## 4. 结果解读方式

### `PASS`

- 含义：route / method 读通、结构满足当前预期、可继续进入报告或巡检
- 不代表：全量经营能力已打通

### `PASS_NO_DATA`

- 含义：读通了，但当前业务载荷为空或不足
- 应对：写成“当前无数据 / 当前样本为空”，不要写成失败，也不要写成全量 0

### `SKIPPED_BY_SAFETY`

- 含义：对象在当前 safe-scope 下不应继续推进，或当前以文件化替代方案为正式路径
- 当前典型对象：
  - `orders/summary`
  - `orders/trend`
  - `orders/report-consumers`
  - 缺本地 direct token 时回退到 stage30 证据的 stable direct control

### `TENANT_OR_PRODUCT_RESTRICTION_CONFIRMED`

- 含义：对象已经越过参数层，但稳定落在对象级限制层
- 不应误写成：权限未申请
- 当前动作：保持冻结，只做 reopen gate 判断

### 当前页样本

- 含义：报告只基于当前页可见样本与已读范围
- 不应外推成：店铺全量订单 / 全量商品业务结果

### `total_count` / `total_item` 信号

- 含义：当前 route 响应暴露的总量字段，可做趋势信号或异常提醒
- 不等于：严格窗口下的全量经营结果

## 5. 不允许误读的内容

- 当前页样本不是全量
- `total_count` / `total_item` 不是严格窗口业务结果
- fund/logistics 是覆盖信号，不是稳定经营指标
- 当前不输出 GMV、转化率、国家结构、产品贡献、完整经营诊断
- `SKIPPED_BY_SAFETY` 不是“以后一定会打通”，只是当前明确不该推进

## 6. 异常处理

### 单 route 失败怎么办

- 先看 base 是否仍健康
- 如果 base 健康、只是单 route 失败：
  - 保留已有巡检结果
  - 报告降级输出
  - 明确该 route 当前不可用
  - 不扩大写成“整个平台失效”

### auth/debug 失败怎么办

- 视为高优先级运行异常
- 当天停止对外分发“正常运营”结论
- 先等待 runtime 恢复或人工排查 production auth

### 巡检 `overall_status=DEGRADED` 怎么办

- 仍可输出有限运营摘要
- 必须显式标注：
  - 哪些 route 通过
  - 哪些 route 失败
  - 哪些结论因此不能讲
- 不得伪装成完全正常

### restriction 对象什么时候才允许重开

只能按 [reopen_gate_stage30.md](D:/Code/阿里国际站/Ali-WIKA/projects/xd/access/reopen_gate_stage30.md)：

- 新的外部租户 / 产品级 live 证据
- 新的官方文档 / 控制台 / payload 证据
- 新的真实对象样本
- 新的可验证只读 route / direct-method 证据

### 什么时候应该停止并等待外部新证据

- restriction confirmed 对象没有新证据时
- keyword family 没有新 payload / 官方证据时
- write-adjacent skipped 对象仍然靠近写侧时
- 当前仓内继续重试只会重复旧结果时
