# XD 运营可读摘要 Stage32

## 1. 试运行范围

- 日报窗口：2026-04-19（Asia/Shanghai）
- 最新周报窗口：2026-04-06 至 2026-04-12（完整自然周）
- 当前状态附注：2026-04-19 执行时 `/health`、`/integrations/alibaba/auth/debug`、`/integrations/alibaba/xd/auth/debug` 和稳定 XD route 均可读
- 数据来源：
  - `Ali-WIKA/projects/xd/access/reports/xd_daily_report_2026-04-19_stage32.md`
  - `Ali-WIKA/projects/xd/access/reports/xd_weekly_report_2026-04-06_2026-04-12_stage32.md`
  - `Ali-WIKA/projects/xd/access/monitoring/runs/xd_critical_routes_stage32_trial.json`
- 口径限制：
  - 当前页样本 / 已读范围
  - 非多页全量聚合
  - fund/logistics 仅为样本订单覆盖信号
  - 不输出 GMV、转化率、国家结构、完整经营诊断

## 2. 今天 / 本周能看到什么

### 今日

- 订单当前页可见样本数 `10`
- 订单列表响应中的 `total_count` 为 `1225`，但这只是当前 route 返回的总量信号，不等于今日严格窗口全量订单数
- 今日窗口内，当前页样本命中：
  - 创建命中 `0`
  - 修改命中 `2`
- 当前页订单创建时间范围：`2026-04-11` 至 `2026-04-18`
- 样本订单状态分布：`unpay=4`、`undeliver=1`
- 样本履约渠道分布：`TAD=3`、`TAO=2`
- 样本发货方式分布：`multimodal_transport=3`、`express=2`
- fund/logistics 在样本 trade 上可读，可作为“订单侧覆盖信号”使用
- 商品当前页可见样本数 `10`
- 商品列表响应中的 `total_item` 为 `919`

### 本周

- 周报窗口：`2026-04-06` 至 `2026-04-12`
- 周报窗口内，当前页订单样本命中：
  - 创建命中 `1`
  - 修改命中 `0`
- 周报窗口内，当前页商品样本命中：
  - 创建命中 `8`
  - 修改命中 `9`
- 商品详情、分组、评分、类目树、媒体清单均可读，可支撑商品基础盘点

## 3. 哪些订单 / 商品指标可讲

### 可讲

- 订单当前页样本数
- 订单列表响应中的 `total_count` 信号
- 当前页样本内的订单状态分布
- 当前页样本内的履约渠道和发货方式分布
- fund/logistics 是否在样本 trade 上可读
- 商品当前页样本数
- 商品列表响应中的 `total_item` 信号
- 商品详情、分组、评分、类目、媒体是否可读
- 最小诊断 route 是否健康

### 不可讲

- 严格窗口下的全量订单数
- 严格窗口下的全量商品变化数
- GMV
- 转化率
- 国家结构
- 完整经营诊断
- 全量商品贡献或全量订单贡献

## 4. Route 健康情况

- 本轮关键 route 巡检总体结论：`PASS`
- 通过或通过但无业务载荷的检查项：`14`
- `SKIPPED_BY_SAFETY`：`4`
  - `orders/summary`
  - `orders/trend`
  - `orders/report-consumers`
  - 稳定 direct-method 本地凭证回退到 stage30 证据
- 明确失败项：`0`
- 当前可直接用于运营产出的稳定通路：
  - `orders/list`
  - `orders/detail`
  - `products/list`
  - `products/detail`
  - `products/groups`
  - `products/score`
  - `categories/tree`
  - `media/list`
  - `reports/*/minimal-diagnostic`

## 5. 当前最值得业务侧看的 3 个点

1. 当前订单样本里可见待处理堆积信号：`unpay=4`、`undeliver=1`。这是样本页信号，适合当“今日关注项”，不适合外推成全量结论。
2. 商品基础盘点链路已经实用化：详情、分组、评分、类目、媒体都能读，足够支持日常商品巡查和问题样本抽查。
3. 健康巡检已经稳定：base、auth、XD auth 和核心只读 route 都通过，说明现在更适合进入“固定运营产出”节奏，而不是继续做接口试探。

## 6. 当前最不该误读的 3 个点

1. `total_count=1225` 和 `total_item=919` 不能被写成“今日/本周全量业务结果”，它们只是当前 route 响应中的总量字段。
2. `orders/summary`、`orders/trend`、`orders/report-consumers` 当前 production 为 `404`，这不等于能力失效；现阶段正式支持路径是文件化日报 / 周报资产和 minimal-diagnostic。
3. fund/logistics 目前只能写成样本订单的覆盖信号，不能写成稳定财务或物流经营指标。

## 7. 下一步实际运营动作建议

1. 每天固定运行一次日报生成和关键 route 巡检，优先看 `unpay`、`undeliver` 等样本堆积信号。
2. 每周一固定生成上一完整自然周周报，给业务侧试用，持续校对口径表达。
3. 把商品详情 / 分组 / 评分 / 类目 / 媒体抽样结果纳入日常商品巡查清单。
4. 对外分发报告时，始终保留“当前页样本 / 非多页全量聚合”的显式说明。
5. 没有新的外部 live 证据前，不要继续重试 restriction 对象，把精力转到运营报告、巡检和回归维护。
