# XD direct method closure stage26

更新时间：2026-04-13

## 执行前提
- 用户已确认 XD 相关权限已申请到。
- 本轮已先做一次安全 refresh/bootstrap，再执行 direct-method。
- 判定规则改为：`200 + 顶层 *_response` 不再自动算通过，必须出现真实业务 payload，不能只剩 `request_id / _trace_id_`。

## 历史 8 项新结论

| method | 新结论 | 说明 |
| --- | --- | --- |
| `alibaba.seller.order.get` | `PASSED` | 返回真实订单 payload |
| `alibaba.seller.order.fund.get` | `PASSED` | 返回真实资金 payload |
| `alibaba.seller.order.logistics.get` | `PASSED` | 返回真实物流 payload |
| `alibaba.mydata.overview.date.get` | `PASSED` | 返回真实 `date_range` 结果 |
| `alibaba.mydata.overview.industry.get` | `NO_DATA` | 已进入可读层，但当前 XD tenant 只返回追踪字段，无真实行业数据 |
| `alibaba.mydata.self.product.date.get` | `PASSED` | 返回真实产品统计时间窗 |
| `alibaba.mydata.self.product.get` | `NO_DATA` | 已进入可读层，但当前样本下 `result` 为空对象 |
| `alibaba.mydata.overview.indicator.basic.get` | `NO_DATA` | 已补齐固定 `date_range + industry(All)`，不再是缺参；当前 `result` 为空对象 |

## 关键修正
- `overview.industry.get` 不再保留旧的 `PERMISSION_GAP_CONFIRMED`。
- `self.product.get` 不再保留旧的 `PERMISSION_GAP_CONFIRMED`。
- `indicator.basic.get` 不再保留旧的参数缺失标签；当前结论是“契约可进入，但没有拿到真实业务数据”。

## 额外等价证据
- `alibaba.icbu.product.get` -> `PASSED`
- `alibaba.icbu.product.group.get` -> `PASSED`
- `alibaba.icbu.product.score.get` -> `PASSED`

这些等价方法只用于解释 route parity gap，不代表 XD route 已落地。
