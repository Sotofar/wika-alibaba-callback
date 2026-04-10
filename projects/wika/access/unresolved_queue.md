# WIKA 未决队列

更新时间：2026-04-10

## 当前总论

- 本文件只收口 `WIKA` 未决接口，不代表任何能力已经打通。
- 本轮没有新增任何 Alibaba API 验证，没有推进平台内回复、平台内创单或真实通知外发.
- 本轮运行环境前置检查显示 Railway production 基础路由连续超时/不可达，因此所有基于 production 路由的复跑统一收口为 `BLOCKED_ENV`。

## A. 本轮复跑后仍未通过的已验证接口

### /health
- 当前结论：`BLOCKED_ENV`
- 最可能根因：`railway_production_unavailable`
- 下一步推荐动作：Recover production health before route-by-route replay.
- 是否适合交给 XD 复测：no
- 是否需要标准权限 / 高权限：standard / not_applicable
- 是否可能涉及写操作风险：no

### /integrations/alibaba/auth/debug
- 当前结论：`BLOCKED_ENV`
- 最可能根因：`railway_production_unavailable`
- 下一步推荐动作：Recover production health before route-by-route replay.
- 是否适合交给 XD 复测：no
- 是否需要标准权限 / 高权限：standard / not_applicable
- 是否可能涉及写操作风险：no

### /integrations/alibaba/auth/start
- 当前结论：`BLOCKED_ENV`
- 最可能根因：`railway_production_unavailable`
- 下一步推荐动作：Recover production health before route-by-route replay.
- 是否适合交给 XD 复测：no
- 是否需要标准权限 / 高权限：standard / not_applicable
- 是否可能涉及写操作风险：no

### /integrations/alibaba/callback
- 当前结论：`BLOCKED_ENV`
- 最可能根因：`railway_production_unavailable`
- 下一步推荐动作：Recover production health before route-by-route replay.
- 是否适合交给 XD 复测：no
- 是否需要标准权限 / 高权限：standard / not_applicable
- 是否可能涉及写操作风险：no

### /integrations/alibaba/wika/data/products/list
- 当前结论：`BLOCKED_ENV`
- 最可能根因：`railway_production_unavailable`
- 下一步推荐动作：Recover production health before route-by-route replay.
- 是否适合交给 XD 复测：no
- 是否需要标准权限 / 高权限：standard / not_applicable
- 是否可能涉及写操作风险：no

### /integrations/alibaba/wika/data/products/score
- 当前结论：`BLOCKED_ENV`
- 最可能根因：`railway_production_unavailable`
- 下一步推荐动作：Recover production health before route-by-route replay.
- 是否适合交给 XD 复测：no
- 是否需要标准权限 / 高权限：standard / not_applicable
- 是否可能涉及写操作风险：no

### /integrations/alibaba/wika/data/products/detail
- 当前结论：`BLOCKED_ENV`
- 最可能根因：`railway_production_unavailable`
- 下一步推荐动作：Recover production health before route-by-route replay.
- 是否适合交给 XD 复测：no
- 是否需要标准权限 / 高权限：standard / not_applicable
- 是否可能涉及写操作风险：no

### /integrations/alibaba/wika/data/products/groups
- 当前结论：`BLOCKED_ENV`
- 最可能根因：`railway_production_unavailable`
- 下一步推荐动作：Recover production health before route-by-route replay.
- 是否适合交给 XD 复测：no
- 是否需要标准权限 / 高权限：standard / not_applicable
- 是否可能涉及写操作风险：no

### /integrations/alibaba/wika/data/categories/tree
- 当前结论：`BLOCKED_ENV`
- 最可能根因：`railway_production_unavailable`
- 下一步推荐动作：Recover production health before route-by-route replay.
- 是否适合交给 XD 复测：no
- 是否需要标准权限 / 高权限：standard / not_applicable
- 是否可能涉及写操作风险：no

### /integrations/alibaba/wika/data/categories/attributes
- 当前结论：`BLOCKED_ENV`
- 最可能根因：`railway_production_unavailable`
- 下一步推荐动作：Recover production health before route-by-route replay.
- 是否适合交给 XD 复测：no
- 是否需要标准权限 / 高权限：standard / not_applicable
- 是否可能涉及写操作风险：no

### /integrations/alibaba/wika/data/products/schema
- 当前结论：`BLOCKED_ENV`
- 最可能根因：`railway_production_unavailable`
- 下一步推荐动作：Recover production health before route-by-route replay.
- 是否适合交给 XD 复测：no
- 是否需要标准权限 / 高权限：standard / not_applicable
- 是否可能涉及写操作风险：no

### /integrations/alibaba/wika/data/products/schema/render
- 当前结论：`BLOCKED_ENV`
- 最可能根因：`railway_production_unavailable`
- 下一步推荐动作：Recover production health before route-by-route replay.
- 是否适合交给 XD 复测：no
- 是否需要标准权限 / 高权限：standard / not_applicable
- 是否可能涉及写操作风险：no

### /integrations/alibaba/wika/data/products/schema/render/draft
- 当前结论：`BLOCKED_ENV`
- 最可能根因：`railway_production_unavailable`
- 下一步推荐动作：Recover production health before route-by-route replay.
- 是否适合交给 XD 复测：no
- 是否需要标准权限 / 高权限：standard / not_applicable
- 是否可能涉及写操作风险：no

### /integrations/alibaba/wika/data/media/list
- 当前结论：`BLOCKED_ENV`
- 最可能根因：`railway_production_unavailable`
- 下一步推荐动作：Recover production health before route-by-route replay.
- 是否适合交给 XD 复测：no
- 是否需要标准权限 / 高权限：standard / not_applicable
- 是否可能涉及写操作风险：no

### /integrations/alibaba/wika/data/media/groups
- 当前结论：`BLOCKED_ENV`
- 最可能根因：`railway_production_unavailable`
- 下一步推荐动作：Recover production health before route-by-route replay.
- 是否适合交给 XD 复测：no
- 是否需要标准权限 / 高权限：standard / not_applicable
- 是否可能涉及写操作风险：no

### /integrations/alibaba/wika/data/customers/list
- 当前结论：`BLOCKED_ENV`
- 最可能根因：`railway_production_unavailable`
- 下一步推荐动作：Recover production health before route-by-route replay.
- 是否适合交给 XD 复测：no
- 是否需要标准权限 / 高权限：standard / not_applicable
- 是否可能涉及写操作风险：no

### /integrations/alibaba/wika/data/orders/list
- 当前结论：`BLOCKED_ENV`
- 最可能根因：`railway_production_unavailable`
- 下一步推荐动作：Recover production health before route-by-route replay.
- 是否适合交给 XD 复测：no
- 是否需要标准权限 / 高权限：standard / not_applicable
- 是否可能涉及写操作风险：no

### /integrations/alibaba/wika/data/orders/detail
- 当前结论：`BLOCKED_ENV`
- 最可能根因：`railway_production_unavailable`
- 下一步推荐动作：Recover production health before route-by-route replay.
- 是否适合交给 XD 复测：no
- 是否需要标准权限 / 高权限：standard / not_applicable
- 是否可能涉及写操作风险：no

### /integrations/alibaba/wika/data/orders/fund
- 当前结论：`BLOCKED_ENV`
- 最可能根因：`railway_production_unavailable`
- 下一步推荐动作：Recover production health before route-by-route replay.
- 是否适合交给 XD 复测：no
- 是否需要标准权限 / 高权限：standard / not_applicable
- 是否可能涉及写操作风险：no

### /integrations/alibaba/wika/data/orders/logistics
- 当前结论：`BLOCKED_ENV`
- 最可能根因：`railway_production_unavailable`
- 下一步推荐动作：Recover production health before route-by-route replay.
- 是否适合交给 XD 复测：no
- 是否需要标准权限 / 高权限：standard / not_applicable
- 是否可能涉及写操作风险：no

### /integrations/alibaba/wika/data/orders/draft-types
- 当前结论：`BLOCKED_ENV`
- 最可能根因：`railway_production_unavailable`
- 下一步推荐动作：Recover production health before route-by-route replay.
- 是否适合交给 XD 复测：no
- 是否需要标准权限 / 高权限：standard / not_applicable
- 是否可能涉及写操作风险：no

### /integrations/alibaba/wika/reports/products/management-summary
- 当前结论：`BLOCKED_ENV`
- 最可能根因：`railway_production_unavailable`
- 下一步推荐动作：Recover production health before route-by-route replay.
- 是否适合交给 XD 复测：no
- 是否需要标准权限 / 高权限：standard / not_applicable
- 是否可能涉及写操作风险：no

### /integrations/alibaba/wika/reports/products/minimal-diagnostic
- 当前结论：`BLOCKED_ENV`
- 最可能根因：`railway_production_unavailable`
- 下一步推荐动作：Recover production health before route-by-route replay.
- 是否适合交给 XD 复测：no
- 是否需要标准权限 / 高权限：standard / not_applicable
- 是否可能涉及写操作风险：no

### /integrations/alibaba/wika/reports/orders/minimal-diagnostic
- 当前结论：`BLOCKED_ENV`
- 最可能根因：`railway_production_unavailable`
- 下一步推荐动作：Recover production health before route-by-route replay.
- 是否适合交给 XD 复测：no
- 是否需要标准权限 / 高权限：standard / not_applicable
- 是否可能涉及写操作风险：no

### /integrations/alibaba/wika/reports/operations/minimal-diagnostic
- 当前结论：`BLOCKED_ENV`
- 最可能根因：`railway_production_unavailable`
- 下一步推荐动作：Recover production health before route-by-route replay.
- 是否适合交给 XD 复测：no
- 是否需要标准权限 / 高权限：standard / not_applicable
- 是否可能涉及写操作风险：no

### /integrations/alibaba/wika/tools/reply-draft
- 当前结论：`BLOCKED_ENV`
- 最可能根因：`railway_production_unavailable`
- 下一步推荐动作：Recover production health before route-by-route replay.
- 是否适合交给 XD 复测：no
- 是否需要标准权限 / 高权限：standard / not_applicable
- 是否可能涉及写操作风险：no

### /integrations/alibaba/wika/tools/order-draft
- 当前结论：`BLOCKED_ENV`
- 最可能根因：`railway_production_unavailable`
- 下一步推荐动作：Recover production health before route-by-route replay.
- 是否适合交给 XD 复测：no
- 是否需要标准权限 / 高权限：standard / not_applicable
- 是否可能涉及写操作风险：no

## B. 历史未决接口（来自阶段 17/18）

### alibaba.mydata.overview.date.get
- 当前结论：`AUTH_BLOCKED`
- 最可能根因：`wika_tenant_missing_mydata_scope`
- 下一步推荐动作：Use clearance pack to request mydata overview date access, then reopen readonly verification.
- 是否适合交给 XD 复测：blocked_by_env_before_retest
- 是否需要标准权限 / 高权限：standard / only_if_explicit_allowlist_exists
- 是否可能涉及写操作风险：no

### alibaba.mydata.overview.industry.get
- 当前结论：`AUTH_BLOCKED`
- 最可能根因：`wika_tenant_missing_mydata_scope`
- 下一步推荐动作：Use clearance pack to request industry scope, then reopen readonly verification.
- 是否适合交给 XD 复测：blocked_by_env_before_retest
- 是否需要标准权限 / 高权限：standard / only_if_explicit_allowlist_exists
- 是否可能涉及写操作风险：no

### alibaba.mydata.overview.indicator.basic.get
- 当前结论：`AUTH_BLOCKED`
- 最可能根因：`wika_tenant_missing_mydata_scope`
- 下一步推荐动作：Use clearance pack to request basic indicator scope, then reopen readonly verification.
- 是否适合交给 XD 复测：blocked_by_env_before_retest
- 是否需要标准权限 / 高权限：standard / only_if_explicit_allowlist_exists
- 是否可能涉及写操作风险：no

### alibaba.mydata.self.product.date.get
- 当前结论：`AUTH_BLOCKED`
- 最可能根因：`wika_tenant_missing_mydata_scope`
- 下一步推荐动作：Use clearance pack to request product date scope, then reopen readonly verification.
- 是否适合交给 XD 复测：blocked_by_env_before_retest
- 是否需要标准权限 / 高权限：standard / only_if_explicit_allowlist_exists
- 是否可能涉及写操作风险：no

### alibaba.mydata.self.product.get
- 当前结论：`AUTH_BLOCKED`
- 最可能根因：`wika_tenant_missing_mydata_scope`
- 下一步推荐动作：Use clearance pack to request product metrics scope, then reopen readonly verification.
- 是否适合交给 XD 复测：blocked_by_env_before_retest
- 是否需要标准权限 / 高权限：standard / only_if_explicit_allowlist_exists
- 是否可能涉及写操作风险：no

### alibaba.seller.order.get
- 当前结论：`MASKED_TRADE_ID_NOT_REUSABLE`
- 最可能根因：`order_list_returns_masked_trade_id`
- 下一步推荐动作：Do not hard-fix. Reopen only after proving reusable unmasked order identifier source.
- 是否适合交给 XD 复测：blocked_by_env_before_retest
- 是否需要标准权限 / 高权限：standard / only_if_explicit_allowlist_exists
- 是否可能涉及写操作风险：no

### alibaba.seller.order.fund.get
- 当前结论：`MASKED_TRADE_ID_NOT_REUSABLE`
- 最可能根因：`order_list_returns_masked_trade_id`
- 下一步推荐动作：Do not hard-fix. Reopen only after proving reusable unmasked order identifier source.
- 是否适合交给 XD 复测：blocked_by_env_before_retest
- 是否需要标准权限 / 高权限：standard / only_if_explicit_allowlist_exists
- 是否可能涉及写操作风险：no

### alibaba.seller.order.logistics.get
- 当前结论：`MASKED_TRADE_ID_NOT_REUSABLE`
- 最可能根因：`order_list_returns_masked_trade_id`
- 下一步推荐动作：Do not hard-fix. Reopen only after proving reusable unmasked order identifier source.
- 是否适合交给 XD 复测：blocked_by_env_before_retest
- 是否需要标准权限 / 高权限：standard / only_if_explicit_allowlist_exists
- 是否可能涉及写操作风险：no

## 边界说明

- 当前边界仍然不是 task 1 complete，不是 task 2 complete，也不是平台内闭环。
- 本文件只用于后续 WIKA/XD 继续推进时的收口与交接。
