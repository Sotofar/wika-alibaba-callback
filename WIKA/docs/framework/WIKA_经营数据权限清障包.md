# WIKA_经营数据权限清障包

更新时间：2026-04-05

> 历史说明：本文件记录的是阶段 18“权限加包前”的清障口径。当前最新状态请以 [WIKA_经营数据候选接口验证.md](./WIKA_经营数据候选接口验证.md) 与 [WIKA_mydata_权限开通后复测.md](./WIKA_mydata_权限开通后复测.md) 为准。  
> 当前 `mydata` 方法在 WIKA production 下已经从旧的 `AUTH_BLOCKED` 前进到 `REAL_DATA_RETURNED`。本文件仅保留为历史权限申请与复验材料。

## 当时的总体结论

- 本包只用于对外说明当时 `mydata` 权限阻塞现状、最小权限申请口径，以及 access grant 之后应如何复验。
- 当时 5 个 `mydata` 官方方法在 WIKA tenant 下统一落到 `AUTH_BLOCKED`。
- 当时可对外输出的结论不是“接口不存在”，而是“官方方法存在，但当前租户无访问权限”。

## 历史清障对象

### `alibaba.mydata.overview.date.get`
- intended business use：发现 overview 可用日期窗口
- target fields：`start_date`、`end_date`
- historical classification：`AUTH_BLOCKED`
- historical error：`InsufficientPermission / App does not have permission to access this api`
- why it mattered：没有可用日期窗口，就无法稳定复验店铺级 overview 指标
- historical ask wording：为当前 WIKA app tenant 申请该方法的生产访问权限，以发现真实 overview 日期窗口

### `alibaba.mydata.overview.industry.get`
- intended business use：发现 overview 可用行业上下文
- target fields：`industry_id`、`industry_desc`、`main_category`
- historical classification：`AUTH_BLOCKED`
- historical error：`InsufficientPermission / App does not have permission to access this api`
- why it mattered：没有 `industry` 维度，就无法稳定构造 overview 指标查询参数
- historical ask wording：为当前 WIKA app tenant 申请该方法的生产访问权限，以发现真实行业上下文

### `alibaba.mydata.overview.indicator.basic.get`
- intended business use：读取店铺级基础经营指标
- target fields：`visitor`、`imps`、`clk`、`clk_rate`、`fb`、`reply`
- historical classification：`AUTH_BLOCKED`
- historical error：`InsufficientPermission / App does not have permission to access this api`
- why it mattered：这是店铺级经营指标最直接的公开入口
- historical ask wording：为当前 WIKA app tenant 申请该方法的生产访问权限，以读取店铺级基础经营指标

### `alibaba.mydata.self.product.date.get`
- intended business use：发现产品表现可用统计窗口
- target fields：`start_date`、`end_date`
- historical classification：`AUTH_BLOCKED`
- historical error：`InsufficientPermission / App does not have permission to access this api`
- why it mattered：没有产品表现日期窗口，就无法稳定读取产品级表现指标
- historical ask wording：为当前 WIKA app tenant 申请该方法的生产访问权限，以发现产品表现的真实日期窗口

### `alibaba.mydata.self.product.get`
- intended business use：读取产品级表现指标
- target fields：`click`、`impression`、`visitor`、`fb`、`order`、`bookmark`、`compare`、`share`、`keyword_effects`
- historical classification：`AUTH_BLOCKED`
- historical error：`InsufficientPermission / App does not have permission to access this api`
- why it mattered：这是产品级曝光、点击、访客、询盘与关键词效果的最直接公开入口
- historical ask wording：为当前 WIKA app tenant 申请该方法的生产访问权限，以读取产品级表现指标

## 当前边界说明

- 本文件不是“权限已解决”的证明。
- 本文件是历史阶段的权限申请说明与复验说明。
- 当前业务判断应以阶段 19 之后的真实取数字段证据为准。
