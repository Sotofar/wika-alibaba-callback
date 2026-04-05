# WIKA_经营数据权限清障包

更新时间：2026-04-05

本包只用于对外说明当前 `mydata` 权限阻塞现状、最小权限申请口径，以及 access grant 之后应如何复验。

## 当前总论

- 本轮没有新增任何 Alibaba API 验证，只复用阶段 17 现有 evidence 做权限清障收口。
- 当前 5 个 `mydata` 相关官方方法在当前 `WIKA` tenant 下统一落到 `AUTH_BLOCKED`。
- 当前可直接对外输出的结论不是“接口不存在”，而是“公开官方方法存在，但当前租户无访问权限”。
- 当前清障包状态：`ACCESS_REOPEN_READY`。

## alibaba.mydata.overview.date.get

1. official method name: `alibaba.mydata.overview.date.get`
2. intended business use: 店铺级经营日期窗口发现，给后续 overview 指标查询提供真实可用日期范围
3. target fields: `start_date`、`end_date`
4. stage-17 observed result: `AUTH_BLOCKED`
5. observed error code / message: `InsufficientPermission / App does not have permission to access this api`
6. current classification: `AUTH_BLOCKED`
7. affected tasks: 任务1、任务2
8. why this method matters to WIKA: 没有 date range，就无法对店铺级 visitor/imps/click/fb/reply 口径做稳定调用与复验。
9. minimal permission/scope ask wording: Please grant the current WIKA app tenant access to alibaba.mydata.overview.date.get for the current ICBU seller account so we can discover valid overview date windows in production.
10. what evidence would count as “access granted”: 真实返回 start_date / end_date 范围，且不再出现 InsufficientPermission。
11. what route/report would be reopened after access grant: `/integrations/alibaba/wika/data/store/overview-basic`、`/integrations/alibaba/wika/reports/operations/minimal-diagnostic`
- evidence file: `docs/framework/evidence/alibaba_mydata_overview_date_get.json`

## alibaba.mydata.overview.industry.get

1. official method name: `alibaba.mydata.overview.industry.get`
2. intended business use: 店铺级行业/主营维度发现，给 overview 指标查询提供真实 industry context
3. target fields: `industry_id`、`industry_desc`、`main_category`
4. stage-17 observed result: `AUTH_BLOCKED`
5. observed error code / message: `InsufficientPermission / App does not have permission to access this api`
6. current classification: `AUTH_BLOCKED`
7. affected tasks: 任务1、任务2
8. why this method matters to WIKA: 没有 industry 维度，就无法稳定构造店铺级 overview 指标查询的真实业务参数。
9. minimal permission/scope ask wording: Please grant the current WIKA app tenant access to alibaba.mydata.overview.industry.get for the current ICBU seller account so we can discover valid industry context in production.
10. what evidence would count as “access granted”: 真实返回 industry_id / industry_desc / main_category，且不再出现 InsufficientPermission。
11. what route/report would be reopened after access grant: `/integrations/alibaba/wika/data/store/overview-basic`、`/integrations/alibaba/wika/reports/operations/minimal-diagnostic`
- evidence file: `docs/framework/evidence/alibaba_mydata_overview_industry_get.json`

## alibaba.mydata.overview.indicator.basic.get

1. official method name: `alibaba.mydata.overview.indicator.basic.get`
2. intended business use: 店铺级经营基础指标读取
3. target fields: `visitor`、`imps`、`clk`、`clk_rate`、`fb`、`reply`
4. stage-17 observed result: `AUTH_BLOCKED`
5. observed error code / message: `InsufficientPermission / App does not have permission to access this api`
6. current classification: `AUTH_BLOCKED`
7. affected tasks: 任务1、任务2
8. why this method matters to WIKA: 这是当前最直接的店铺级 UV / 曝光 / 点击 / 询盘 / 回复相关公开候选入口；若无权限，任务 1/2 无法获得店铺级经营指标。
9. minimal permission/scope ask wording: Please grant the current WIKA app tenant access to alibaba.mydata.overview.indicator.basic.get for the current ICBU seller account so we can read store-level visitor / imps / click / feedback / reply metrics in production.
10. what evidence would count as “access granted”: 真实返回 visitor / imps / clk / clk_rate / fb / reply 任一字段，且不再出现 InsufficientPermission。
11. what route/report would be reopened after access grant: `/integrations/alibaba/wika/data/store/overview-basic`、`/integrations/alibaba/wika/reports/operations/minimal-diagnostic`
- evidence file: `docs/framework/evidence/alibaba_mydata_overview_indicator_basic_get.json`

## alibaba.mydata.self.product.date.get

1. official method name: `alibaba.mydata.self.product.date.get`
2. intended business use: 产品级表现日期窗口发现，给 self.product 指标查询提供真实统计周期
3. target fields: `start_date`、`end_date`
4. stage-17 observed result: `AUTH_BLOCKED`
5. observed error code / message: `InsufficientPermission / App does not have permission to access this api`
6. current classification: `AUTH_BLOCKED`
7. affected tasks: 任务1、任务2
8. why this method matters to WIKA: 没有产品级 date range，就无法稳定调用曝光、点击、访客、询盘等产品表现指标。
9. minimal permission/scope ask wording: Please grant the current WIKA app tenant access to alibaba.mydata.self.product.date.get for the current ICBU seller account so we can discover valid product-performance date windows in production.
10. what evidence would count as “access granted”: 真实返回 start_date / end_date 范围，且不再出现 InsufficientPermission。
11. what route/report would be reopened after access grant: `/integrations/alibaba/wika/data/products/performance-by-date`、`/integrations/alibaba/wika/reports/products/minimal-diagnostic`
- evidence file: `docs/framework/evidence/alibaba_mydata_self_product_date_get.json`

## alibaba.mydata.self.product.get

1. official method name: `alibaba.mydata.self.product.get`
2. intended business use: 产品级表现指标读取
3. target fields: `click`、`impression`、`visitor`、`fb`、`order`、`bookmark`、`compare`、`share`、`keyword_effects`
4. stage-17 observed result: `AUTH_BLOCKED`
5. observed error code / message: `InsufficientPermission / App does not have permission to access this api`
6. current classification: `AUTH_BLOCKED`
7. affected tasks: 任务1、任务2
8. why this method matters to WIKA: 这是当前最直接的产品级曝光、点击、访客、询盘、关键词效果公开候选入口；若无权限，任务 1/2 无法获得产品表现层。
9. minimal permission/scope ask wording: Please grant the current WIKA app tenant access to alibaba.mydata.self.product.get for the current ICBU seller account so we can read product-level performance metrics in production.
10. what evidence would count as “access granted”: 真实返回 click / impression / visitor / fb / order / bookmark / compare / share / keyword_effects 任一字段，且不再出现 InsufficientPermission。
11. what route/report would be reopened after access grant: `/integrations/alibaba/wika/data/products/performance`、`/integrations/alibaba/wika/reports/products/minimal-diagnostic`
- evidence file: `docs/framework/evidence/alibaba_mydata_self_product_get.json`

## 边界说明

- 本清障包不是“权限已解决”，只是一份可直接对外申请的权限阻塞说明。
- 当前不是 task 1 complete，也不是 task 2 complete。
- 当前没有推进任何平台内写动作，也没有形成平台内闭环。
