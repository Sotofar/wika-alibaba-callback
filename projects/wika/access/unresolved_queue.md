# WIKA 未决队列

更新时间：2026-04-10

## 当前总论
- stage22 之后，WIKA route 层 27 条已验证/已上线 access route 已全部 `RECONFIRMED`。
- 当前未决队列不再以 route replay 失败为主，而是转向 direct-method 权限差距与参数契约问题。
- 本文档不代表任务 1 完成，不代表任务 2 完成，也不代表平台内闭环。

## A. WIKA route 层
- 当前无新的 WIKA route replay 未决项。
- `customers/list` 保留为“权限探针型只读 route”，不是“稳定客户数据 route”。

## B. 历史 direct-method 未决项

### 1. mydata 系列
- `alibaba.mydata.overview.date.get`
  - 当前结论：XD 标准权限下 `PERMISSION_DENIED`
  - 最可能根因：标准权限不含所需 mydata scope
  - 是否已回到接口级验证：是
  - 下一步动作：保留在 permission gap，不做高权限补测
  - 是否适合交给 XD：已完成标准权限确认
  - 是否绝对不适合用 XD 确认：否

- `alibaba.mydata.overview.industry.get`
  - 当前结论：XD 标准权限下 `PERMISSION_DENIED`
  - 最可能根因：标准权限不含所需 mydata scope
  - 是否已回到接口级验证：是
  - 下一步动作：保留在 permission gap，不做高权限补测
  - 是否适合交给 XD：已完成标准权限确认
  - 是否绝对不适合用 XD 确认：否

- `alibaba.mydata.overview.indicator.basic.get`
  - 当前结论：XD 标准权限下 `PARAM_MISSING`
  - 最可能根因：当前最小参数集仍缺 `industry` 等文档必填契约
  - 是否已回到接口级验证：是
  - 下一步动作：只在文档契约明确后补一次参数对账，不写成权限不足
  - 是否适合交给 XD：已完成标准权限确认
  - 是否绝对不适合用 XD 确认：否

- `alibaba.mydata.self.product.date.get`
  - 当前结论：XD 标准权限下 `PERMISSION_DENIED`
  - 最可能根因：标准权限不含所需 mydata scope
  - 是否已回到接口级验证：是
  - 下一步动作：保留在 permission gap，不做高权限补测
  - 是否适合交给 XD：已完成标准权限确认
  - 是否绝对不适合用 XD 确认：否

- `alibaba.mydata.self.product.get`
  - 当前结论：XD 标准权限下 `PERMISSION_DENIED`
  - 最可能根因：标准权限不含所需 mydata scope
  - 是否已回到接口级验证：是
  - 下一步动作：保留在 permission gap，不做高权限补测
  - 是否适合交给 XD：已完成标准权限确认
  - 是否绝对不适合用 XD 确认：否

### 2. order detail / fund / logistics direct methods
- `alibaba.seller.order.get`
  - 当前结论：XD 标准权限下 `PASSED`
  - 最可能根因：历史问题不再是接口不可用，而是旧样本 / 旧契约路径不稳定
  - 是否已回到接口级验证：是
  - 下一步动作：保留为已确认通过，不再留在未决队列主干
  - 是否适合交给 XD：已完成
  - 是否绝对不适合用 XD 确认：否

- `alibaba.seller.order.fund.get`
  - 当前结论：XD 标准权限下 `PASSED`
  - 最可能根因：同上
  - 是否已回到接口级验证：是
  - 下一步动作：保留为已确认通过，不再留在未决队列主干
  - 是否适合交给 XD：已完成
  - 是否绝对不适合用 XD 确认：否

- `alibaba.seller.order.logistics.get`
  - 当前结论：XD 标准权限下 `PASSED`
  - 最可能根因：同上
  - 是否已回到接口级验证：是
  - 下一步动作：保留为已确认通过，不再留在未决队列主干
  - 是否适合交给 XD：已完成
  - 是否绝对不适合用 XD 确认：否
