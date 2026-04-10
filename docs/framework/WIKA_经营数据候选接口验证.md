# WIKA_经营数据候选接口验证

## 2026-04-10 Stage 20 Route Layer Update

### 当前状态
- 5 个 mydata 方法已在 stage19 post-grant retest 中进入 `REAL_DATA_RETURNED`
- stage20 没有新增 Alibaba API 探索
- stage20 只把已确认字段路由化为正式只读层与诊断层

### 正式只读路由承接关系
- operations traffic summary:
  - source methods:
    - `alibaba.mydata.overview.date.get`
    - `alibaba.mydata.overview.industry.get`
    - `alibaba.mydata.overview.indicator.basic.get`
- products performance summary:
  - source methods:
    - `alibaba.mydata.self.product.date.get`
    - `alibaba.mydata.self.product.get`

### 当前 route-level 验证结论
- `operations_traffic_summary` -> `PASS_LIVE_HELPER_CONTRACT`
- `products_performance_summary` -> `PASS_LIVE_HELPER_CONTRACT`
- `operations_minimal_diagnostic` (extended) -> `PASS_LIVE_HELPER_CONTRACT`
- `products_minimal_diagnostic` (extended) -> `PASS_LIVE_HELPER_CONTRACT`

### 明确边界
- 当前是正式只读路由化 + 诊断扩展
- 不是 task 1 complete
- 不是 task 2 complete
- 不是完整经营驾驶舱

- evaluated_at: 2026-04-10T09:11:04.489Z
- route_line: Railway production -> /sync + access_token + sha256
- scope: WIKA-only post-grant retest

## 阶段 19：WIKA 数据管家权限开通后复测

### appkey 与线程边界
- 当前线程：`WIKA-only`
- `wika_appkey_confirmed=false`
- `assumption_wika_appkey=true`
- 说明：
  - 当前可以确认本轮走的是 WIKA production auth profile
  - 当前无法在仓内或 debug 输出中，把权限后台截图里的 appkey 文本与运行时 appkey 做一一比对
  - 因此本轮最终结论显式依赖 `ASSUMPTION_WIKA_APPKEY`

### base sentinel
- `/health` -> `200`
- `/integrations/alibaba/auth/debug` -> `200 JSON`
- `/integrations/alibaba/wika/data/products/list?page_size=1` -> `200 JSON`
- current auth/session state:
  - `wika_client_id_present=true`
  - `wika_client_secret_present=true`
  - `wika_token_loaded=true`
  - `wika_token_file_exists=true`
  - `wika_has_refresh_token=true`
  - `wika_startup_init_status=refresh:startup_bootstrap`
  - `wika_last_refresh_reason=startup_bootstrap`

## 5 个 mydata 方法复测结果

| 方法 | 最终分类 | 最佳尝试 | 真实上游参数 | 证据文件 |
| --- | --- | --- | --- | --- |
| `alibaba.mydata.overview.date.get` | `REAL_DATA_RETURNED` | `empty_params` | 无 | `alibaba_mydata_overview_date_get_post_grant.json` |
| `alibaba.mydata.overview.industry.get` | `REAL_DATA_RETURNED` | `real_date_range` | `date_range` 来自 `overview.date.get` | `alibaba_mydata_overview_industry_get_post_grant.json` |
| `alibaba.mydata.overview.indicator.basic.get` | `REAL_DATA_RETURNED` | `date_range_with_real_industry` | `date_range + industry` 都来自真实上游返回 | `alibaba_mydata_overview_indicator_basic_get_post_grant.json` |
| `alibaba.mydata.self.product.date.get` | `REAL_DATA_RETURNED` | `day / week / month` 全部成功 | `statistics_type`=`day/week/month` | `alibaba_mydata_self_product_date_get_post_grant.json` |
| `alibaba.mydata.self.product.get` | `REAL_DATA_RETURNED` | `day` | `stat_date` 来自真实 `self.product.date.get`，`product_ids` 来自真实 `products/list` | `alibaba_mydata_self_product_get_post_grant.json` |

## 已确认的真实字段

### 店铺级（overview.indicator.basic.get）
- `visitor`
- `imps`
- `clk`
- `clk_rate`
- `fb`
- `reply`

本轮真实样例值：
- `visitor=260`
- `imps=6769`
- `clk=143`
- `clk_rate=0.0211`
- `fb=8`
- `reply=0.9927`

额外检查结果：
- `source_related=[]`
- `country_related=[]`
- `quick_reply_related=[]`

结论：
- 当前不能脑补 `流量来源 / 国家来源 / 快速回复率` 已经存在

### 产品级（self.product.get）
- `click`
- `impression`
- `visitor`
- `fb`
- `order`
- `bookmark`
- `compare`
- `share`
- `keyword_effects`

额外检查结果：
- `source_related=[]`
- `country_related=[]`
- `trend_related=[]`

结论：
- 当前不能脑补 `访问来源 / 询盘来源 / 国家来源 / 近周期变化` 已经存在

## 已确认的真实参数窗口

### overview.date.get
- `2026-03-29 -> 2026-04-04`
- `2026-03-22 -> 2026-03-28`
- `2026-03-15 -> 2026-03-21`
- `2026-03-08 -> 2026-03-14`

### self.product.date.get
- `day`: `2026-03-10 -> 2026-04-08`
- `week`: `2026-03-08 -> 2026-04-04`
- `month`: `2026-03-01 -> 2026-03-31`

## 当前阻塞层收口
- 本轮 5 / 5 方法都不再是：
  - `STILL_AUTH_BLOCKED`
  - `ILLEGAL_ACCESS_TOKEN`
  - `MISSING_ACCESS_TOKEN`
  - `PARAMETER_REJECTED`
  - `ENVIRONMENT_BLOCKED`
- 本轮没有失败方法，因此当前没有剩余阻塞层需要继续下钻

## 建议
- `task1_partially_reopen=true`
- `task2_partially_reopen=true`

说明：
- 这是“局部重开只读取数与诊断扩展”的建议
- 不是 task 1 complete
- 不是 task 2 complete
- 不是完整经营驾驶舱已成立

## 边界说明
- 本轮没有验证任何新的 Alibaba API
- 本轮没有做任何写侧动作
- 本轮只处理 WIKA
- 本轮没有更新或推进任何 XD 结果
