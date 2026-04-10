# WIKA 下一批必须验证的 API 候选池

更新时间：2026-04-10

## 当前总论
- stage22 已完成 WIKA route replay 与 XD 8 项标准权限确认。
- 如果继续，不应再重复 stage22 的 27 条 route replay。
- 当前真正剩下的，是 direct-method 未决项，而不是新的未知接口搜索。

## 最高优先级：已知未决 direct-method
| 优先级 | 方法 | 当前状态 | 下一步 |
| --- | --- | --- | --- |
| P0 | `alibaba.mydata.overview.indicator.basic.get` | XD 标准权限 `PARAM_MISSING` | 只做参数契约对账，不直接写成权限不足 |
| P0 | `alibaba.mydata.overview.date.get` | XD 标准权限 `PERMISSION_DENIED` | 保留 permission gap，等待业务是否真要申请 |
| P0 | `alibaba.mydata.overview.industry.get` | XD 标准权限 `PERMISSION_DENIED` | 保留 permission gap，等待业务是否真要申请 |
| P0 | `alibaba.mydata.self.product.date.get` | XD 标准权限 `PERMISSION_DENIED` | 保留 permission gap，等待业务是否真要申请 |
| P0 | `alibaba.mydata.self.product.get` | XD 标准权限 `PERMISSION_DENIED` | 保留 permission gap，等待业务是否真要申请 |

## 已经从未决主干移出的对象
| 方法 | 当前状态 | 说明 |
| --- | --- | --- |
| `alibaba.seller.order.get` | XD 标准权限 `PASSED` | 不再作为主阻塞 |
| `alibaba.seller.order.fund.get` | XD 标准权限 `PASSED` | 不再作为主阻塞 |
| `alibaba.seller.order.logistics.get` | XD 标准权限 `PASSED` | 不再作为主阻塞 |

## 仅保留为 doc-found only 的对象
- `alibaba.seller.trade.decode`
- `alibaba.icbu.product.type.available.get`
- `alibaba.mydata.self.keyword.date.get`
- `alibaba.mydata.self.keyword.effect.week.get`
- `alibaba.mydata.self.keyword.effect.month.get`
- `alibaba.mydata.industry.keyword.get`
- `alibaba.mydata.seller.opendata.getconkeyword`

## 当前边界
- 本文档不等于这些对象已打通。
- 本文档不等于 task 1 / 2 已完成。
- 本文档不等于平台内闭环。
