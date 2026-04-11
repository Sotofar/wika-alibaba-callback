# WIKA 面向 6 项任务 API 缺口矩阵

## 2026-04-11 Stage 23 Orders Derived Summary Delta

### 任务 2：经营诊断扩展
- 已新增订单 derived summary 层：
  - `/integrations/alibaba/wika/reports/orders/management-summary`
- 已扩展订单诊断层：
  - `/integrations/alibaba/wika/reports/orders/minimal-diagnostic`
- 当前已能保守消费的 derived 订单维度：
  - `formal_summary`
  - `product_contribution`
  - `trend_signal`（sample/window based）
- 当前仍未完成：
  - `country_structure`
  - 完整官方订单经营报表
  - 完整经营驾驶舱

### 任务 1：读取平台数据
- store/product 读取层本轮无新增字段
- 仍保持局部重开，不误写成 task 1 complete

## 2026-04-10 Stage 21 Deploy Lock Delta

### 任务 1：读取平台数据
- `management-summary` 层已部署并 smoke 通过：
  - `/integrations/alibaba/wika/reports/operations/management-summary`
  - `/integrations/alibaba/wika/reports/products/management-summary`
- 当前继续保持“局部重开”状态：
  - 店铺级 official fields 已可在线聚合与解释
  - 产品级 official fields 已可在线聚合与解释
- 仍未完成：
  - `traffic_source / country_source / quick_reply_rate`
  - `access_source / inquiry_source / country_source / period_over_period_change`

### 任务 2：经营诊断扩展
- `minimal-diagnostic` 扩展层已部署并 smoke 通过：
  - `/integrations/alibaba/wika/reports/operations/minimal-diagnostic`
  - `/integrations/alibaba/wika/reports/products/minimal-diagnostic`
- 当前诊断消费层已经在线具备：
  - `signal_interpretation / recommendation_block / unavailable_dimensions_echo / confidence_hints`
  - `ranking_interpretation / keyword_signal_takeaways / recommendation_block / unavailable_dimensions_echo / confidence_hints`
- 仍未完成：
  - 当前仍不是完整经营驾驶舱
  - 订单级正式汇总、国家结构、产品贡献仍未补齐

更新时间：2026-04-10

本文只记录当前最关键的能力状态，不把权限加包后的真实取数误写成任务完成。

## 2026-04-10 Stage 21 Delta

### 任务 1：读取平台数据
- 已新增可消费的 management summary 层：
  - `/integrations/alibaba/wika/reports/operations/management-summary`
  - `/integrations/alibaba/wika/reports/products/management-summary`
- 当前前进到“局部持续重开”状态：
  - 店铺级 official fields 已可读、可聚合、可解释
  - 产品级 official fields 已可读、可聚合、可解释
- 仍未完成：
  - `traffic_source / country_source / quick_reply_rate`
  - `access_source / inquiry_source / country_source / period_over_period_change`

### 任务 2：经营诊断扩展
- 已新增诊断消费层解释：
  - operations minimal diagnostic 新增 `signal_interpretation / recommendation_block / unavailable_dimensions_echo / confidence_hints`
  - products minimal diagnostic 新增 `ranking_interpretation / keyword_signal_takeaways / recommendation_block / unavailable_dimensions_echo / confidence_hints`
- 仍未完成：
  - 当前仍不是完整经营驾驶舱
  - 订单级正式汇总、国家结构、产品贡献仍未补齐

## 任务 1：店铺经营指标入口

| 能力项 | 当前状态 | 当前结论 |
| --- | --- | --- |
| `alibaba.mydata.overview.date.get` | WIKA post-grant 复测 `REAL_DATA_RETURNED` | 店铺级日期窗口已可真实读取 |
| `alibaba.mydata.overview.industry.get` | WIKA post-grant 复测 `REAL_DATA_RETURNED` | 行业参数已可真实读取 |
| `alibaba.mydata.overview.indicator.basic.get` | WIKA post-grant 复测 `REAL_DATA_RETURNED` | 店铺级 `visitor / imps / clk / clk_rate / fb / reply` 已可真实读取 |
| 店铺级缺口 | 仍存在 | 当前未见 `流量来源 / 国家来源 / 快速回复率` 真实字段 |

## 任务 2：经营聚合层

| 能力项 | 当前状态 | 当前结论 |
| --- | --- | --- |
| WIKA route 底座 | 已上线且稳定 | 只代表 route 层稳定，不代表经营分析已完整 |
| minimal-diagnostic / products / orders 子诊断 | 已上线 | 当前仍只基于现有真实只读字段 |
| `alibaba.mydata.self.product.date.get` | WIKA post-grant 复测 `REAL_DATA_RETURNED` | `day / week / month` 窗口已可真实读取 |
| `alibaba.mydata.self.product.get` | WIKA post-grant 复测 `REAL_DATA_RETURNED` | 产品级 `click / impression / visitor / fb / order / bookmark / compare / share / keyword_effects` 已可真实读取 |
| 产品级缺口 | 仍存在 | 当前未见 `访问来源 / 询盘来源 / 国家来源 / 近周期变化` 真实字段 |

## 任务 3：产品上新与详情编写

| 能力项 | 当前状态 | 当前结论 |
| --- | --- | --- |
| schema / render / media / draft render | 已上线 | 只代表只读与可观测能力成立 |
| `photobank.upload` / `add.draft` | 边界未证明 | 仍不能进入真实写入验证 |
| `product.type.available.get` | 官方文档已确认存在，未验证 | 仅保留为 doc-found 候选 |

## 任务 4：询盘与客户沟通

| 能力项 | 当前状态 | 当前结论 |
| --- | --- | --- |
| `customers/list` route | 已上线 | 当前应视为权限探针 route |
| customers direct methods | 仍缺真实 id 或权限 | 还不是稳定客户读侧 |
| inquiries / messages | 仍缺明确读侧入口 | 当前未重开 |

## 任务 5：订单草稿 / 交易创建

| 能力项 | 当前状态 | 当前结论 |
| --- | --- | --- |
| WIKA `orders/detail / fund / logistics` routes | 已上线 | route 层稳定可复现 |
| 订单参数契约 | 仍有限制 | `public list masked trade_id` 仍不支持完整 public chaining |
| 平台内 create 边界 | 未证明 | 仍不能误写成平台内创单已成立 |

## 任务 6：正式通知闭环

| 能力项 | 当前状态 | 当前结论 |
| --- | --- | --- |
| notifier fallback / dry-run | 已成立 | 仍未有真实 provider 送达证据 |
| 真实 provider 外发 | 未配置 | 仍未完成 |

## 当前总论
- 阶段 19 的增量是：WIKA `mydata` 5 个核心方法已从旧的 `AUTH_BLOCKED` 前进到 `REAL_DATA_RETURNED`
- 当前可以建议局部重开任务 1 / 任务 2 的读数部分
- 当前仍不是 task 1 complete，不是 task 2 complete，也不是平台内闭环
## 2026-04-10 Stage 20 Delta

### Task 1: 读取平台数据
- 已前进到局部重开条件：
  - `overview.date.get` -> real data confirmed
  - `overview.industry.get` -> real data confirmed
  - `overview.indicator.basic.get` -> official store-level metrics confirmed
  - `self.product.get` -> official product-level metrics confirmed
- 仍未完成：
  - store-level `traffic_source / country_source / quick_reply_rate`
  - product-level `access_source / inquiry_source / country_source / period_over_period_change`

### Task 2: 经营诊断扩展
- 已前进到局部重开条件：
  - store-level traffic/performance section can now use real official mydata fields
  - product performance section can now use real official mydata fields
- 仍未完成：
  - not full business cockpit
  - no order-level formal summary / country structure / product contribution

### 本轮边界
- 本轮没有新增 Alibaba API 探索
- 本轮没有任何写动作
- 本轮只处理 WIKA


## 2026-04-11 Stage 22 Gap Compression Delta

### 任务 1：读取平台数据
- 当前保持“局部重开”状态，不新增 store/product live route 扩容
- 店铺级 / 产品级仍未补齐：
  - `traffic_source / country_source / quick_reply_rate`
  - `access_source / inquiry_source / country_source / period_over_period_change`

### 任务 2：经营诊断扩展
- 本轮没有新增 store/product 真实字段，因此 `management-summary` 与 `minimal-diagnostic` 保持不扩容
- 订单级缺口出现收口增量：
  - `formal_summary` -> 已可由现有 `orders/list + orders/detail + orders/fund` 保守派生
  - `product_contribution` -> 已可由现有 `orders/detail.order_products` 保守派生
  - `country_structure` -> 仍未成立

### 任务 5：订单草稿 / 交易创建
- 当前 WIKA route-level 证据表明：
  - `orders/list` 已能返回可复用 `trade_id`
  - `orders/detail / fund / logistics` 已可在 current public route 层正常读取
- 但这不等于平台内创单已成立，也不等于完整订单经营驾驶舱已成立

### 当前边界
- not task 1 complete
- not task 2 complete
- not full business cockpit

## 2026-04-11 Stage 25 Gap Compression Round 2 Delta

### 任务 1：读取平台数据
- 当前继续保持“局部重开”
- 本轮没有新增 store/product 真实字段
- 仍未补齐：
  - `traffic_source / country_source / quick_reply_rate`
  - `access_source / inquiry_source / country_source / period_over_period_change`

### 任务 2：经营诊断扩展
- 本轮没有新增可接入 `management-summary` / `minimal-diagnostic` 的真实字段
- store/product/order live routes 本轮不扩容
- 订单级仍保持：
  - `formal_summary` -> 已成立的 derived 层
  - `product_contribution` -> 已成立的 derived 层
  - `trend_signal` -> 已成立的 derived 层
  - `country_structure` -> 仍 unavailable

### 当前边界
- legacy page-request 证据存在，不等于 current official mainline 已成立
- not task 1 complete
- not task 2 complete
- not full business cockpit

