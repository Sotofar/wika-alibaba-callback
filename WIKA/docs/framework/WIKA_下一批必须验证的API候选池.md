# WIKA 下一批必须验证的 API 候选池

## 2026-04-11 Stage 23 Order Candidate Delta

### 本轮不再作为高优先级新 API 候选的方向
- `formal_summary`
- `product_contribution`
- 原因：当前已可由现有 `orders/list + orders/detail + orders/fund / logistics` 保守派生，并已沉淀到已部署的 orders management summary / minimal diagnostic。

### 当前订单级真正剩余的高优先级缺口
- `country_structure`
- 当前结论：`NOT_DERIVABLE_CURRENTLY`
- 当前不新增 runtime 候选验证，不回到新 API 探索

更新时间：2026-04-10

## 2026-04-10 Stage 21 Delta

### 本轮不再作为候选验证对象的内容
- `management-summary` 相关工作本轮已收口为“已落地的业务消费层”，不是新的 API 候选验证
- 当前不应再把以下 5 个方法重新放回候选池头部：
  - `alibaba.mydata.overview.date.get`
  - `alibaba.mydata.overview.industry.get`
  - `alibaba.mydata.overview.indicator.basic.get`
  - `alibaba.mydata.self.product.date.get`
  - `alibaba.mydata.self.product.get`

### Stage 21 之后真正剩余的方向
- 店铺级仍缺：
  - `traffic_source`
  - `country_source`
  - `quick_reply_rate`
- 产品级仍缺：
  - `access_source`
  - `inquiry_source`
  - `country_source`
  - `period_over_period_change`
- 订单级仍缺：
  - 正式汇总
  - 国家结构
  - 产品贡献

## 当前总论
- 阶段 19 已完成 WIKA `mydata` 权限开通后复测
- 以下 5 个方法不再属于“最高优先级未决候选”，因为它们已经在 WIKA production 下返回真实数据：
  - `alibaba.mydata.overview.date.get`
  - `alibaba.mydata.overview.industry.get`
  - `alibaba.mydata.overview.indicator.basic.get`
  - `alibaba.mydata.self.product.date.get`
  - `alibaba.mydata.self.product.get`
- 如果继续，不应再重复这 5 个方法的同构复测；下一步应转向“如何把已确认字段接入正式读取层 / 诊断层”

## 已完成 post-grant 复测的对象

| 方法 | 当前状态 | 当前价值 |
| --- | --- | --- |
| `alibaba.mydata.overview.date.get` | `REAL_DATA_RETURNED` | 提供 overview 真实可用 date range |
| `alibaba.mydata.overview.industry.get` | `REAL_DATA_RETURNED` | 提供 overview 真实行业参数 |
| `alibaba.mydata.overview.indicator.basic.get` | `REAL_DATA_RETURNED` | 提供公司级经营字段 |
| `alibaba.mydata.self.product.date.get` | `REAL_DATA_RETURNED` | 提供产品级 `day / week / month` 窗口 |
| `alibaba.mydata.self.product.get` | `REAL_DATA_RETURNED` | 提供产品级效果字段 |

## 下一批真正剩余的候选方向

### P0：把已确认字段接入正式读取层
- 不是新 API 验证
- 而是把以下真实字段并入 WIKA 正式 route / report：
  - 店铺级：`visitor / imps / clk / clk_rate / fb / reply`
  - 产品级：`click / impression / visitor / fb / order / bookmark / compare / share / keyword_effects`

### P1：补充当前响应里仍未见覆盖的经营维度
- 店铺级：
  - `流量来源`
  - `国家来源`
  - `快速回复率`
- 产品级：
  - `访问来源`
  - `询盘来源`
  - `国家来源`
  - `近周期变化`

### P2：仍然保留为 doc-found only 的对象
- `alibaba.seller.trade.decode`
- `alibaba.icbu.product.type.available.get`
- `alibaba.mydata.self.keyword.date.get`
- `alibaba.mydata.self.keyword.effect.week.get`
- `alibaba.mydata.self.keyword.effect.month.get`
- `alibaba.mydata.industry.keyword.get`
- `alibaba.mydata.seller.opendata.getconkeyword`

## 当前边界
- 本文档不等于这些对象已全部接入业务层
- 本文档不等于 task 1 / 2 已完成
- 本文档不等于平台内闭环
- 当前线程只处理 WIKA
- 当前轮次没有更新或推进任何 XD 结果
## 2026-04-10 Stage 20 Delta

### 不再重复验证的对象
- 以下 5 个 mydata 方法已经完成 post-grant retest，并已被 stage20 正式路由化：
  - `alibaba.mydata.overview.date.get`
  - `alibaba.mydata.overview.industry.get`
  - `alibaba.mydata.overview.indicator.basic.get`
  - `alibaba.mydata.self.product.date.get`
  - `alibaba.mydata.self.product.get`

### 下一批真正剩余的候选方向
- store-level missing dimensions:
  - `traffic_source`
  - `country_source`
  - `quick_reply_rate`
- product-level missing dimensions:
  - `access_source`
  - `inquiry_source`
  - `country_source`
  - `period_over_period_change`
- order-level analytics still missing:
  - `formal summary`
  - `country structure`
  - `product contribution`

### 本轮边界
- 本轮没有新增 Alibaba API 探索
- 本轮只把已证实字段并入正式只读 route / diagnostic layer
- not full business cockpit
更新时间：2026-04-11

## 2026-04-11 Stage 22 Gap Compression Delta

### 本轮没有新增候选方法
- 本轮优先完成“现有字段穷尽审计”
- 因此没有把新的 method name 加入候选池
- 只复核了仓内既有 doc-found only 候选

### 订单级缺口收口后，候选池优先级变化
- 不再把以下两个方向继续放在“高优先级需要新 API”的位置：
  - 正式汇总
  - 产品贡献
- 原因：
  - 这两个方向当前已可由现有 `orders/list + orders/detail + orders/fund` / `orders/detail.order_products` 保守派生
- 当前订单级真正剩余的高优先级缺口只剩：
  - 国家结构

### 既有 doc-found only 候选保持不变
- `alibaba.seller.trade.decode`
- `alibaba.icbu.product.type.available.get`
- `alibaba.mydata.self.keyword.date.get`
- `alibaba.mydata.self.keyword.effect.week.get`
- `alibaba.mydata.self.keyword.effect.month.get`
- `alibaba.mydata.industry.keyword.get`
- `alibaba.mydata.seller.opendata.getconkeyword`

### 本轮不做 runtime 验证的原因
- 仓内当前只有 doc-found 记录
- 当前没有足够的 doc URL + 参数契约落盘
- 且它们不是本轮 store/product 剩余缺口的直接 route-level 证据入口

## 2026-04-11 Stage 25 Gap Compression Round 2 Delta

### 本轮新增候选
- 无

### 既有候选保持不变
- `alibaba.seller.trade.decode`
- `alibaba.icbu.product.type.available.get`
- `alibaba.mydata.self.keyword.date.get`
- `alibaba.mydata.self.keyword.effect.week.get`
- `alibaba.mydata.self.keyword.effect.month.get`
- `alibaba.mydata.industry.keyword.get`
- `alibaba.mydata.seller.opendata.getconkeyword`

### 本轮处理原则
- 只要仓内仍缺 doc URL + 稳定参数契约，就继续保持 `DOC_FOUND_NOT_TESTED`
- 不因为 legacy page-request 里见过同义字段，就绕回去做 undocumented runtime 探测

