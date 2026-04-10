# WIKA_项目基线

## 2026-04-10 Stage 20 Baseline Update

### 新增只读层
- 已把 5 个已证实可用的 mydata 方法沉淀为 WIKA 共享只读 helper：
  - `alibaba.mydata.overview.date.get`
  - `alibaba.mydata.overview.industry.get`
  - `alibaba.mydata.overview.indicator.basic.get`
  - `alibaba.mydata.self.product.date.get`
  - `alibaba.mydata.self.product.get`

### 新增正式报告路由
- `/integrations/alibaba/wika/reports/operations/traffic-summary`
- `/integrations/alibaba/wika/reports/products/performance-summary`

### 已扩展的正式诊断路由
- `/integrations/alibaba/wika/reports/operations/minimal-diagnostic`
- `/integrations/alibaba/wika/reports/products/minimal-diagnostic`

### 当前已确认 official fields
- Store-level official fields:
  - `visitor`
  - `imps`
  - `clk`
  - `clk_rate`
  - `fb`
  - `reply`
- Product-level official fields:
  - `click`
  - `impression`
  - `visitor`
  - `fb`
  - `order`
  - `bookmark`
  - `compare`
  - `share`
  - `keyword_effects`

### 当前已确认 derived / unavailable 边界
- derived:
  - `UV ~= visitor (business-mapping pending)`
  - `exposure_from_imps`
  - `ctr_candidate_from_clk_rate`
  - `reply_related_metric_from_reply`
  - `ctr_from_click_over_impression`
- unavailable:
  - store: `traffic_source / country_source / quick_reply_rate`
  - product: `access_source / inquiry_source / country_source / period_over_period_change`

### 固定边界
- 本轮没有新增 Alibaba API 探索
- 本轮没有任何写动作
- 本轮只处理 WIKA
- not task 1 complete
- not task 2 complete
- not full business cockpit

## 一句话总基线
只推进 WIKA；当前主线已经形成“稳定的只读 route 底座 + 最小经营诊断层 + 外部草稿工作流 SOP + 通知 fallback”，并且阶段 19 已确认 WIKA `mydata` 权限加包后，5 个核心经营数据方法都能在 production 下返回真实字段；但这仍不等于 task 1 complete，不等于 task 2 complete，也不等于平台内闭环。

## 当前已完成阶段
- 产品 / 订单 / 物流 / 类目 / schema / media 的正式只读路由已上线
- products / orders / operations minimal-diagnostic 已上线
- 外部 reply/order 草稿工作流、handoff、review、regression 已成立
- 通知 fallback 与 provider dry-run 已成立
- 阶段 17 已完成经营数据候选接口验证
- 阶段 18 已完成 `mydata` 权限清障与订单参数契约对账
- 阶段 19 已完成 WIKA 数据管家权限开通后复测

## 阶段 19 关键结论
- production base 继续 `PASS_BASE`
- 当前 WIKA seller 授权态可用：
  - `wika_token_loaded=true`
  - `wika_token_file_exists=true`
  - `wika_has_refresh_token=true`
  - `wika_startup_init_status=refresh:startup_bootstrap`
- `wika_appkey_confirmed=false`
- `assumption_wika_appkey=true`
- 5 个 `mydata` 方法全部 `REAL_DATA_RETURNED`：
  - `alibaba.mydata.overview.date.get`
  - `alibaba.mydata.overview.industry.get`
  - `alibaba.mydata.overview.indicator.basic.get`
  - `alibaba.mydata.self.product.date.get`
  - `alibaba.mydata.self.product.get`

## 当前已确认的真实经营字段
### 店铺级
- `visitor`
- `imps`
- `clk`
- `clk_rate`
- `fb`
- `reply`

### 产品级
- `click`
- `impression`
- `visitor`
- `fb`
- `order`
- `bookmark`
- `compare`
- `share`
- `keyword_effects`

### 已确认的真实参数窗口
- `overview.date.get` 已返回真实可用 `date_range`
- `overview.industry.get` 已返回真实 `industry_id / industry_desc / main_category`
- `self.product.date.get` 已返回：
  - `day` 窗口：`2026-03-10` -> `2026-04-08`
  - `week` 窗口：`2026-03-08` -> `2026-04-04`
  - `month` 窗口：`2026-03-01` -> `2026-03-31`

## 当前仍未在真实响应中看到的字段
### 店铺级
- 流量来源
- 国家来源
- 快速回复率

### 产品级
- 访问来源
- 询盘来源
- 国家来源
- 近周期变化

### 订单级
- 正式汇总
- 国家结构
- 产品贡献

## 当前还缺的核心能力
### 任务 1
- 需要把已确认的 `mydata` 店铺级 / 产品级字段接入正式读取路由或报告层
- 仍未补齐流量来源、国家来源、快速回复率等字段

### 任务 2
- 需要把 `overview.indicator.basic` / `self.product.get` 的真实字段并入经营诊断扩展层
- 仍未形成完整经营驾驶舱

### 任务 3
- `photobank.upload` / `add.draft` 的低风险边界证明
- media 清理 / draft 管理的公开入口

### 任务 4
- customers 真正可读
- inquiries / messages 读侧入口
- 平台内回复能力

### 任务 5
- 平台内订单草稿 / 交易创建的安全边界证明

### 任务 6
- 真实 provider 外发通知，而不只是 dry-run / fallback

## 当前唯一推荐下一步
如果继续，只建议做一件事：
- 局部重开任务 1 / 任务 2 的“只读取数与诊断扩展”部分，把已确认的 `mydata` 真实字段并入 WIKA 正式报告层

## 当前真实数据结论
- WIKA 已能在 production 下真实读取公司级经营字段：
  - `visitor / imps / clk / clk_rate / fb / reply`
- WIKA 已能在 production 下真实读取产品级效果字段：
  - `click / impression / visitor / fb / order / bookmark / compare / share / keyword_effects`
- WIKA 已能在 production 下真实读取 `overview` 与 `self.product` 的日期窗口 / 行业参数

## 当前待验证判断
- 把这些真实字段接入正式 route / report 后，任务 1 的读取侧是否足够稳定
- 把这些真实字段接入经营诊断后，任务 2 是否能形成更高质量的只读经营分析

## 固定边界
- 当前不是 task 1 complete
- 当前不是 task 2 complete
- 当前没有任何写侧动作
- 当前线程只处理 WIKA
- 当前轮次没有更新或推进任何 XD 结果
