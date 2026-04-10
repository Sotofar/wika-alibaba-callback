# WIKA 下一批必须验证的 API 候选池

更新时间：2026-04-10

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
