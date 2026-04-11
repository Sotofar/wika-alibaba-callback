# WIKA 订单报告（30d）

## 订单汇总
- 周期：30d
- 摘要口径：current_snapshot
- 统计日期：2026-04-01
- 创建订单数：56
- 成功订单数：48
- 实收相关金额：39933.38
- 实收金额（real）：39933.380000000005
- 成功买家数：38
- 退款订单率：0.00%
- 创建转成功率：85.71%

## 订单趋势
- 趋势点数：30
- 最早日期：2026-03-03
- 最新日期：2026-04-01
- 峰值金额日：2026-03-31 / 43426.079999999994

## 订单池覆盖
- 快照口径：paged_pool_full
- 页大小：50
- 已抓页数：25
- 是否覆盖完成：是
- 已读订单数：1206
- 总记录数：1206
- 总页数：25

## 金额口径拆分（订单池）
- 订单总金额：913371.75
- 商品小计：660054.82
- 运费金额：252730.53
- 含税总金额：921589.3
- 产品金额合计：660054.82

## 订单状态分布
- 订单完成：订单 1096
- 待卖家发货：订单 44
- 待买家付款：订单 31
- 待买家确认收货：订单 25
- 发货中：订单 6
- 待买家付足款项：订单 2
- 待买家确认已修改的合同：订单 1
- 待卖家接单：订单 1

## 发货方式分布
- 快递：订单 842
- 多式联运：订单 296
- 海运：订单 47
- 陆运：订单 16
- 多式联运：订单 5

## 买家国家/地区分布
- United States：订单 214，订单金额 149615.63
- France：订单 46，订单金额 22623.81
- Australia：订单 45，订单金额 19617.5
- South Korea：订单 43，订单金额 33885.6
- Canada：订单 37，订单金额 22849.3

## 发货国家/地区分布
- China：订单 414，订单金额 280353.32
- United States：订单 303，订单金额 188887.78
- Australia：订单 71，订单金额 73625.38
- Canada：订单 47，订单金额 22897.18
- United Kingdom：订单 42，订单金额 21743.21

## 产品贡献
- Lens Spray Cleaning Kit Cleaner Glasses Custom Logo Lens Cleaner Solution Sunglasses Liquid Cleaner With  MSDS：涉及订单 110，数量 137565.3，估算金额 34158
- black cheap custom hard hinge luxury  funda gafas eye glasses box sunglasses：涉及订单 10，数量 53713，估算金额 31196.82
- 2020 wholesale hot-selling printed customized kids leather hard eyeglass glasses case：涉及订单 1，数量 43008，估算金额 20643.84
- bulk wholesale spectacle microfiber cleaner suede cloth with custom logo for eyeglasses lens cleaning eye glasses：涉及订单 139，数量 152088.16，估算金额 17467.98
- Wholesale Lens Cleaner Glasses Cleaning Liquid Spray for Optical and Sunglasses Eyeglass with Custom logo：涉及订单 56，数量 63943.3，估算金额 16682.75

## 可立即执行
- 新建订单数高于成功订单数，优先排查报价、支付、确认环节的流失点。

## 需要补更多数据后再执行
- 暂无

## 当前口径说明
- 当前已验证订单 summary、trend 与订单列表首屏快照三条只读页面请求，可用于 P0 经营结果层分析。
- 订单 summary 当前更接近交易分析页的当前快照，不应直接当成完整 7d/30d 聚合汇总。
- 订单列表国家/产品贡献当前来自已分页读取的订单列表池，仍属于订单列表口径，不等同完整交易明细。
- buyer.country 在部分订单记录中为空；当前报告会将 buyer_country 与 shipping_country 分开呈现，避免口径混用。
