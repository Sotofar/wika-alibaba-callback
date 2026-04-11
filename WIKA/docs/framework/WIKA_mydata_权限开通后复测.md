# WIKA mydata 权限开通后复测

更新时间：2026-04-10

## 本轮目标
- 只在 WIKA production 主线下复测 5 个 `mydata` 官方方法
- 把“权限后台已加包”转化成“真实字段是否可取”的明确证据
- 不扩展到其他新 API
- 不做任何写侧动作
- 不混入 XD

## appkey 对应关系
- `wika_appkey_confirmed=false`
- `assumption_wika_appkey=true`
- 原因：
  - 当前可以确认本轮走的是 WIKA production auth profile
  - 当前无法在仓内或 `auth/debug` 输出中，把权限后台截图里的 appkey 文本与运行时 appkey 做一一比对

## base sentinel
- `/health` -> `200`
- `/integrations/alibaba/auth/debug` -> `200 JSON`
- `/integrations/alibaba/wika/data/products/list?page_size=1` -> `200 JSON`

## 当前 WIKA auth/session state
- `wika_client_id_present=true`
- `wika_client_secret_present=true`
- `wika_token_loaded=true`
- `wika_token_file_exists=true`
- `wika_has_refresh_token=true`
- `wika_runtime_loaded_from=refresh:startup_bootstrap`
- `wika_startup_init_status=refresh:startup_bootstrap`
- `wika_last_refresh_reason=startup_bootstrap`

## 5 个方法的 post-grant 结果

| 方法 | 最终分类 | 关键参数来源 | 关键结果 |
| --- | --- | --- | --- |
| `alibaba.mydata.overview.date.get` | `REAL_DATA_RETURNED` | 无 | 返回真实 `date_range` |
| `alibaba.mydata.overview.industry.get` | `REAL_DATA_RETURNED` | 真实 `date_range` | 返回真实 `industry_id / industry_desc / main_category` |
| `alibaba.mydata.overview.indicator.basic.get` | `REAL_DATA_RETURNED` | 真实 `date_range + industry` | 返回真实 `visitor / imps / clk / clk_rate / fb / reply` |
| `alibaba.mydata.self.product.date.get` | `REAL_DATA_RETURNED` | `statistics_type=day/week/month` | 三种窗口都返回真实 `start_date / end_date` |
| `alibaba.mydata.self.product.get` | `REAL_DATA_RETURNED` | 真实 `product_ids + stat_date` | 返回真实产品级效果字段 |

## 已确认字段

### 公司级经营字段
- `visitor`
- `imps`
- `clk`
- `clk_rate`
- `fb`
- `reply`

### 产品级表现字段
- `click`
- `impression`
- `visitor`
- `fb`
- `order`
- `bookmark`
- `compare`
- `share`
- `keyword_effects`

## 当前未见覆盖的字段

### 店铺级
- 流量来源
- 国家来源
- 快速回复率

### 产品级
- 访问来源
- 询盘来源
- 国家来源
- 近周期变化

## 重开建议
- `task1_partially_reopen=true`
- `task2_partially_reopen=true`

说明：
- 这是“局部重开只读取数与诊断扩展”的建议
- 不是 task 1 complete
- 不是 task 2 complete
- 不是完整经营驾驶舱已完成

## 边界说明
- 本轮没有验证任何新的 Alibaba API
- 本轮没有做任何写侧动作
- 本轮只处理 WIKA
- 本轮没有更新或推进任何 XD 结果
