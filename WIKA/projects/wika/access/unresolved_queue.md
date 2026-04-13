# WIKA 未决队列

更新时间：2026-04-10

## 当前总论
- WIKA route 层 27 条已验证/已上线 access route 继续保持 frozen baseline，不需要本轮重复 replay。
- 当前未决主干只剩 direct-method 层：XD mydata 权限缺口，以及是否需要后续人工权限动作。
- 本文档不代表任务 1 完成，不代表任务 2 完成，也不代表平台内闭环。
- stage24 已确认：在没有新的外部权限变化前，不应继续重复 stage23 的 direct-method 调用。

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

### 3. stage24 统一闸门
- 当前结论：`AWAITING_EXTERNAL_PERMISSION_ACTION`
- 触发条件：
  - 未发现新的外部权限变化证据
  - `XD_ELEVATED_ALLOWED` 未设置为 `1`
- 因此当前不应继续让 Codex 重复 5 个 direct-method 的同构验证。

### 4. 已从未决主干移出的对象
- `alibaba.seller.order.get`
  - 当前结论：`PASSED`
  - 当前定位：sanity control 与已确认通过 direct-method
- `alibaba.seller.order.fund.get`
  - 当前结论：`PASSED`
- `alibaba.seller.order.logistics.get`
  - 当前结论：`PASSED`
## 2026-04-13 Stage26 XD parity/access update

### 当前总论
- XD 不再沿用 stage24 的 `AWAITING_EXTERNAL_PERMISSION_ACTION` 作为总停止标签。
- 本轮已在“权限已申请到”为权威前提下完成 XD parity replay、8 项 direct-method 重闭环、候选池最小尝试。
- WIKA 未决主干不再是“是否继续等外部权限动作”，而是：
  - XD route parity 仍有 14 条 `DOC_MISMATCH`
  - XD 候选池仍有参数契约缺口
  - 个别 mydata 候选仍有对象级 `TENANT_OR_PRODUCT_RESTRICTION`

### 已从未决主干移出的 XD 对象
- `alibaba.mydata.overview.date.get` -> `PASSED`
- `alibaba.mydata.self.product.date.get` -> `PASSED`
- `alibaba.mydata.overview.industry.get` -> `NO_DATA`
- `alibaba.mydata.self.product.get` -> `NO_DATA`
- `alibaba.mydata.overview.indicator.basic.get` -> `NO_DATA`

### 仍保留为未决的 XD 项
- route parity 缺口：
  - categories / media / customers / orders draft-types / minimal-diagnostic / draft-tools
- candidate pool 契约缺口：
  - `alibaba.seller.trade.decode`
  - `alibaba.icbu.product.type.available.get`
  - `alibaba.mydata.self.keyword.effect.week.get`
  - `alibaba.mydata.industry.keyword.get`
- candidate pool 对象级限制：
  - `alibaba.mydata.self.keyword.date.get`
  - `alibaba.mydata.self.keyword.effect.month.get`
  - `alibaba.mydata.seller.opendata.getconkeyword`
## 2026-04-13 Stage28 XD readonly closure update

### 已从未决主干移出的 XD route gap
- `categories/tree`
- `categories/attributes`
- `products/schema`
- `products/schema/render`
- `media/list`
- `media/groups`
- `orders/draft-types`
- `reports/products/minimal-diagnostic`
- `reports/orders/minimal-diagnostic`
- `reports/operations/minimal-diagnostic`

### 当前仍保留为未决的 XD 项
- route:
  - `customers/list` -> `TENANT_OR_PRODUCT_RESTRICTION`
  - `products/schema/render/draft` -> `ROUTE_BOUND_NO_DATA`
  - `tools/reply-draft` -> `WRITE_ADJACENT_SKIPPED`
  - `tools/order-draft` -> `WRITE_ADJACENT_SKIPPED`
- candidate:
  - `alibaba.mydata.self.keyword.effect.week.get` -> `PARAM_CONTRACT_MISSING` (`properties`)
  - `alibaba.mydata.industry.keyword.get` -> `PARAM_CONTRACT_MISSING` (`properties`)
  - `alibaba.seller.trade.decode` -> `TENANT_OR_PRODUCT_RESTRICTION`
  - `alibaba.mydata.self.keyword.date.get` -> `TENANT_OR_PRODUCT_RESTRICTION`
  - `alibaba.mydata.self.keyword.effect.month.get` -> `TENANT_OR_PRODUCT_RESTRICTION`
  - `alibaba.mydata.seller.opendata.getconkeyword` -> `TENANT_OR_PRODUCT_RESTRICTION`
