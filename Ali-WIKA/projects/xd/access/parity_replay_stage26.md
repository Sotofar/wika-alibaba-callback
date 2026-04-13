# XD parity replay stage26

更新时间：2026-04-13

## 结论
- production base 继续 `PASS_BASE`。
- 本轮已按 WIKA stage22 的 27 条已验证 route 对 XD 做全量 parity replay。
- XD 当前结果不是“整体未开权”，而是明确分成三类：
  - 已有 route 且在线可复现：`RECONFIRMED_XD`
  - 运行时 route 缺失，但等价 direct-method 已返回真实业务 payload：`PASSED_WITH_EQUIVALENT_DATA`
  - 当前 production 上不存在对应 XD route：`DOC_MISMATCH`

## 分类计数
- `RECONFIRMED_XD`: 8
- `PASSED_WITH_EQUIVALENT_DATA`: 5
- `DOC_MISMATCH`: 14
- 其他：0

## RECONFIRMED_XD
- `/health`
- `/integrations/alibaba/xd/auth/debug`
- `/integrations/alibaba/xd/auth/start`
- `/integrations/alibaba/xd/auth/callback`
- `/integrations/alibaba/xd/data/products/list`
- `/integrations/alibaba/xd/data/orders/list`
- `/integrations/alibaba/xd/data/orders/detail`
- `/integrations/alibaba/xd/reports/products/management-summary`

## PASSED_WITH_EQUIVALENT_DATA
- `/integrations/alibaba/xd/data/products/detail`
  - 等价 direct-method: `alibaba.icbu.product.get`
- `/integrations/alibaba/xd/data/products/groups`
  - 等价 direct-method: `alibaba.icbu.product.group.get`
- `/integrations/alibaba/xd/data/products/score`
  - 等价 direct-method: `alibaba.icbu.product.score.get`
- `/integrations/alibaba/xd/data/orders/fund`
  - 等价 direct-method: `alibaba.seller.order.fund.get`
- `/integrations/alibaba/xd/data/orders/logistics`
  - 等价 direct-method: `alibaba.seller.order.logistics.get`

## DOC_MISMATCH
- `/integrations/alibaba/xd/data/categories/tree`
- `/integrations/alibaba/xd/data/categories/attributes`
- `/integrations/alibaba/xd/data/products/schema`
- `/integrations/alibaba/xd/data/products/schema/render`
- `/integrations/alibaba/xd/data/products/schema/render/draft`
- `/integrations/alibaba/xd/data/media/list`
- `/integrations/alibaba/xd/data/media/groups`
- `/integrations/alibaba/xd/data/customers/list`
- `/integrations/alibaba/xd/data/orders/draft-types`
- `/integrations/alibaba/xd/reports/products/minimal-diagnostic`
- `/integrations/alibaba/xd/reports/orders/minimal-diagnostic`
- `/integrations/alibaba/xd/reports/operations/minimal-diagnostic`
- `/integrations/alibaba/xd/tools/reply-draft`
- `/integrations/alibaba/xd/tools/order-draft`

## 边界
- 本轮只做 read-only / report / draft-tool parity 判定，不做任何真实写动作。
- `PASSED_WITH_EQUIVALENT_DATA` 不等于 XD route 已存在，只能说明当前 auth 与 direct-method 契约可复用。
- 仍不能把 route 缺失写成“功能已完成”。
