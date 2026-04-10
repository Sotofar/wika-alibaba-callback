# WIKA 未决队列

更新时间：2026-04-10

## 当前总论
- WIKA route 层 27 条已验证/已上线 access route 继续保持 frozen baseline，不需要本轮重复 replay。
- 当前未决主干只剩 direct-method 层：XD mydata 权限缺口，以及是否需要后续人工权限动作。
- 本文档不代表任务 1 完成，不代表任务 2 完成，也不代表平台内闭环。

## A. WIKA route 层
- 当前无新的 WIKA route replay 未决项。
- `customers/list` 继续保留为权限探针型 route，不写成稳定客户数据入口。

## B. XD direct-method 未决项

### 1. mydata 权限缺口（已收口到接口级证据）
- `alibaba.mydata.overview.date.get`
  - 当前结论：`PERMISSION_GAP_CONFIRMED`
  - 最可能根因：XD 标准权限不含对应 mydata scope
  - 是否已回到接口级验证：是
  - 下一步动作：如业务仍需要，申请权限或在明确允许时做单次 elevated confirm
  - 是否适合继续交给 XD：已完成标准权限闭环
  - 是否绝对不适合用 XD 确认：否

- `alibaba.mydata.overview.industry.get`
  - 当前结论：`PERMISSION_GAP_CONFIRMED`
  - 最可能根因：XD 标准权限不含对应 mydata scope
  - 是否已回到接口级验证：是
  - 下一步动作：如业务仍需要，申请权限或在明确允许时做单次 elevated confirm
  - 是否适合继续交给 XD：已完成标准权限闭环
  - 是否绝对不适合用 XD 确认：否

- `alibaba.mydata.self.product.date.get`
  - 当前结论：`PERMISSION_GAP_CONFIRMED`
  - 最可能根因：XD 标准权限不含对应 mydata scope
  - 是否已回到接口级验证：是
  - 下一步动作：如业务仍需要，申请权限或在明确允许时做单次 elevated confirm
  - 是否适合继续交给 XD：已完成标准权限闭环
  - 是否绝对不适合用 XD 确认：否

- `alibaba.mydata.self.product.get`
  - 当前结论：`PERMISSION_GAP_CONFIRMED`
  - 最可能根因：XD 标准权限不含对应 mydata scope
  - 是否已回到接口级验证：是
  - 下一步动作：如业务仍需要，申请权限或在明确允许时做单次 elevated confirm
  - 是否适合继续交给 XD：已完成标准权限闭环
  - 是否绝对不适合用 XD 确认：否

### 2. indicator.basic 参数契约 -> 权限层闭环
- `alibaba.mydata.overview.indicator.basic.get`
  - 当前结论：`PERMISSION_DENIED`
  - 最可能根因：补齐 `date_range + industry` 后已进入权限错误层，当前更像权限缺口而非继续缺参
  - 是否已回到接口级验证：是
  - 下一步动作：如业务仍需要，申请对应 mydata 权限；不要再写成纯参数问题
  - 是否适合继续交给 XD：本轮已完成标准权限与参数契约闭环
  - 是否绝对不适合用 XD 确认：否

### 3. 已从未决主干移出的对象
- `alibaba.seller.order.get`
  - 当前结论：`PASSED`
  - 当前定位：sanity control 与已确认通过 direct-method
- `alibaba.seller.order.fund.get`
  - 当前结论：`PASSED`
- `alibaba.seller.order.logistics.get`
  - 当前结论：`PASSED`
