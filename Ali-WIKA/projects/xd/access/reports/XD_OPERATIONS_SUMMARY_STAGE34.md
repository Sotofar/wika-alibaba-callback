# XD 运营可读摘要 Stage34

## 1. 本轮范围

- 日报窗口：2026-04-19（Asia/Shanghai）
- 周报窗口：2026-04-06 至 2026-04-12（上一完整自然周）
- 当前状态附注：本轮执行时 `/health`、`/integrations/alibaba/auth/debug`、`/integrations/alibaba/xd/auth/debug`、`/integrations/alibaba/xd/data/orders/list?page_size=1` 均返回 `200`
- 数据来源：
  - `Ali-WIKA/projects/xd/access/operations/runs/xd_operations_workflow_both_2026-04-19_2026-04-06_2026-04-12.json`
  - `Ali-WIKA/projects/xd/access/reports/xd_daily_report_2026-04-19.json`
  - `Ali-WIKA/projects/xd/access/reports/xd_weekly_report_2026-04-06_2026-04-12.json`
  - `Ali-WIKA/projects/xd/access/monitoring/runs/xd_critical_routes_stage33_both_2026-04-19_2026-04-06_2026-04-12.json`
- 口径限制：
  - 当前页样本 / 已读范围
  - 非多页全量聚合
  - `total_count` / `total_item` 只是接口信号
  - fund/logistics 仅为样本订单覆盖信号
  - 不输出 GMV、转化率、国家结构、完整经营诊断

## 2. 今日能看到什么

- 当前页可见订单样本数 `10`
- orders/list 当前响应 `total_count=1225`，这是接口总量信号，不等于今日全量订单结果
- 今日窗口命中当前页样本：
  - 创建命中 `0`
  - 修改命中 `2`
- 当前页订单创建时间范围：`2026-04-11` 至 `2026-04-18`
- 已抽样订单状态分布：`unpay=4`、`undeliver=1`
- 已抽样履约渠道分布：`TAD=3`、`TAO=2`
- 已抽样发货方式分布：`multimodal_transport=3`、`express=2`
- fund/logistics 在样本 trade 上可读，可作为订单侧覆盖信号
- 当前页可见商品样本数 `10`
- products/list 当前响应 `total_item=919`，这是接口总量信号，不等于今日全量商品结果

## 3. 本周能看到什么

- 周报窗口：`2026-04-06` 至 `2026-04-12`
- 周报窗口命中当前页订单样本：
  - 创建命中 `1`
  - 修改命中 `0`
- 周报窗口命中当前页商品样本：
  - 创建命中 `8`
  - 修改命中 `9`
- 商品详情、分组、评分、类目树、媒体清单均可读，适合做商品基础盘点和异常样本抽查

## 4. 订单样本摘要

- 当前最明显的订单样本信号仍是待处理堆积：`unpay=4`、`undeliver=1`
- 今日窗口没有命中创建样本，但命中 `2` 条修改样本，说明当前页更像“存量订单状态变化”而不是“今日新建订单页”
- 样本详情里暂未出现 `shipment_date`
- fund/logistics 已读通，但当前只能写成“样本覆盖信号”

## 5. 商品样本摘要

- 当前页商品样本 `10` 条，`total_item=919`
- 周报窗口内，当前页商品样本创建命中 `8`、修改命中 `9`
- 商品详情、分组、评分、类目、媒体均可读，说明商品基础巡查链路已经可以日常使用
- 当前仍不能把这些样本抽查结果扩写成全量商品经营结论

## 6. Route 健康情况

- 本轮关键 route 巡检总体结论：`PASS`
- 分类统计：
  - `PASS=13`
  - `PASS_NO_DATA=1`
  - `SKIPPED_BY_SAFETY=4`
  - `FAIL=0`
- 当前稳定可用通路：
  - `orders/list`
  - `orders/detail`
  - `products/list`
  - `products/detail`
  - `products/groups`
  - `products/score`
  - `categories/tree`
  - `media/list`
  - `reports/*/minimal-diagnostic`
- 当前仍按安全冻结处理：
  - `orders/summary`
  - `orders/trend`
  - `orders/report-consumers`
  - 本地 direct-method 凭证不可用时，回退为 stage30 已验证证据

## 7. 当前最值得业务侧看的 3 个点

1. 当前订单样本里仍可见待付款 / 待发货堆积信号：`unpay=4`、`undeliver=1`，适合作为今日盯盘起点。
2. 商品基础巡查链路已足够稳定：详情、分组、评分、类目、媒体都能读，周窗口内商品样本创建/修改命中明显高于订单样本。
3. 巡检继续 `PASS` 且无失败项，说明现在更适合固定做“日报 + 周报 + 巡检”，而不是继续做接口试探。

## 8. 当前最不该误读的 3 个点

1. `total_count=1225` 和 `total_item=919` 只能写成接口信号，不能写成今日或本周严格窗口全量结果。
2. `orders/summary`、`orders/trend`、`orders/report-consumers` 当前 production 为 `404`，不等于运营工作流失效；当前正式路径是文件化报告和 minimal-diagnostic。
3. fund/logistics 现在只能说明“样本 trade 可读”，不能写成稳定财务或物流经营指标。

## 9. 下一步实际运营动作建议

1. 固定每天运行一次巡检和日报，优先盯 `unpay`、`undeliver` 等样本堆积信号。
2. 每周固定生成上一完整自然周周报和老板摘要，保持窗口与当前状态附注分离。
3. 把本轮摘要交给业务侧试用，收集“哪些样本信号最有用、哪些表述仍容易误读”的反馈。
