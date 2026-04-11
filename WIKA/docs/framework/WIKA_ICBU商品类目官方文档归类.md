# WIKA_ICBU商品类目官方文档归类

更新时间：2026-04-09

## 边界说明

- 本文只记录 `open.alibaba.com` 左侧栏 `ICBU－商品 (cid=20966)` 的整类官方文档阅读结果。
- 本轮是官方文档归类，不是 production API 验证。
- 本文不能证明任何接口已经在 `WIKA` 当前租户下打通。
- 本文不能替代现有 `Railway production -> /sync + access_token + sha256` 实测结论。

## 阅读范围

本次完整阅读 `cid=20966` 左侧栏下的 47 个官方页面，并按当前 `WIKA` 主线相关性归类：

### 1. 类目 / 属性 / 预测 / 映射

- `alibaba.icbu.category.attr.get`
- `alibaba.icbu.category.attribute.get`
- `alibaba.icbu.category.attrvalue.get`
- `alibaba.icbu.category.car.query`
- `alibaba.icbu.category.get`
- `alibaba.icbu.category.get.new`
- `alibaba.icbu.category.id.mapping`
- `alibaba.icbu.category.level.attr.get`
- `alibaba.icbu.category.predict`
- `alibaba.icbu.category.schema.level.get`
- `alibaba.icbu.property.predict`

### 2. 商品读取 / 质量 / ID / 库存 / 权限

- `alibaba.icbu.product.get`
- `alibaba.icbu.product.list`
- `alibaba.icbu.product.score.get`
- `alibaba.icbu.quality.score.calculate`
- `alibaba.icbu.product.country.getcountrylist`
- `alibaba.icbu.product.id.decrypt`
- `alibaba.icbu.product.id.encrypt`
- `alibaba.icbu.product.inventory.get`
- `alibaba.icbu.product.sku.inventory.get`
- `alibaba.icbu.product.type.available.get`

### 3. schema / draft / 写侧

- `alibaba.icbu.product.add.draft`
- `alibaba.icbu.product.schema.add`
- `alibaba.icbu.product.schema.add.draft`
- `alibaba.icbu.product.schema.add.light`
- `alibaba.icbu.product.schema.get`
- `alibaba.icbu.product.schema.render`
- `alibaba.icbu.product.schema.render.draft`
- `alibaba.icbu.product.schema.update`
- `alibaba.icbu.product.schema.update.light`
- `alibaba.icbu.product.update`
- `alibaba.icbu.product.update.field`
- `alibaba.icbu.product.inventory.update`
- `alibaba.icbu.product.batch.update.display`

### 4. 分组 / 主题 / 定招

- `alibaba.icbu.product.group.add`
- `alibaba.icbu.product.group.del`
- `alibaba.icbu.product.group.get`
- `alibaba.icbu.industry.topic.list`
- `alibaba.icbu.topic.products`

### 5. 图片 / 素材

- `alibaba.icbu.photobank.group.list`
- `alibaba.icbu.photobank.group.operate`
- `alibaba.icbu.photobank.list`
- `alibaba.icbu.photobank.upload`
- `alibaba.icbu.rawImage.get`
- `alibaba.icbu.white.background.image.generate`

### 6. 其他

- `alibaba.wholesale.shippingline.template.init`
- `alibaba.wholesale.shippingline.template.list`

## 对当前 WIKA 最有价值的文档级结论

### A. `schema.render.draft` 只是草稿渲染器，不是草稿创建器

- 官方方法：`alibaba.icbu.product.schema.render.draft`
- 文档定位：适用于“单个草稿商品编辑场景”
- 关键契约：
  - 入参中的 `product_id` 明确是“草稿商品明文id”
- 这解释了当前 `schema.render.draft` 的正确语义：
  - 它只能在已经拿到草稿商品明文 ID 时，作为 draft 渲染读侧使用
  - 不能被当成通用商品渲染器
  - 也不能被当成 draft 查询 / 删除 / 管理接口

### B. `schema.add.draft` 是文档上明确存在的草稿上游入口

- 官方方法：`alibaba.icbu.product.schema.add.draft`
- 文档定位：商品草稿发布入口
- 文档关键信息：
  - 返回值中明确存在 `product_id`
  - 文档说明为“商品草稿明文id”
- 这条信息的重要性在于：
  - 它提供了 `schema.render.draft` 所需上游 ID 的文档级来源解释
  - 但它本身仍然是写侧草稿创建入口
  - 当前不能据此误写成“安全 draft 链路已成立”

### C. `product.type.available.get` 可能成为更低风险的 precheck 候选

- 官方方法：`alibaba.icbu.product.type.available.get`
- 文档定位：商家发品类型 / 发品权限查询
- 对 `WIKA` 的潜在价值：
  - 如果未来重开任务 3 的低风险验证，这条方法更像 precheck，而不是直接写侧入口
  - 它可能帮助判断类目下是否具备发品权限
- 当前状态仍然只是：
  - official doc found
  - 未生产验证

### D. `product.id.encrypt / decrypt` 说明产品侧确实存在 ID 契约层

- 官方方法：
  - `alibaba.icbu.product.id.encrypt`
  - `alibaba.icbu.product.id.decrypt`
- 文档含义：
  - 产品侧存在“明文 / 混淆 / 加密后”ID 契约层
- 对 `WIKA` 的帮助：
  - 它能支持“产品侧 ID 契约需要单独对账”的判断
  - 但它不解决当前订单侧遮罩 `trade_id` 的 public chaining 问题

## 只对外部草稿准备层有帮助，但不能直接解决当前阻塞

以下方法在文档上存在，适合以后增强类目映射、属性补全、素材准备或外部草稿质量，但当前不是直接解法：

- `alibaba.icbu.category.id.mapping`
- `alibaba.icbu.category.predict`
- `alibaba.icbu.property.predict`
- `alibaba.icbu.category.attrvalue.get`
- `alibaba.icbu.category.schema.level.get`
- `alibaba.icbu.category.level.attr.get`
- `alibaba.icbu.rawImage.get`
- `alibaba.icbu.white.background.image.generate`

当前只能把它们归类为：

- 对任务 3 的外部草稿准备层可能有价值
- 不是当前 `WIKA` 核心阻塞的直接解决方案
- 仍需单独生产验证后才有资格进入正式候选池

## 明显属于高风险写侧，不适合当前主线直接重开

以下方法文档明确存在，但当前不应因为“文档已找到”就直接重开主线：

- `alibaba.icbu.product.add.draft`
- `alibaba.icbu.product.schema.add`
- `alibaba.icbu.product.schema.add.draft`
- `alibaba.icbu.product.schema.add.light`
- `alibaba.icbu.product.schema.update`
- `alibaba.icbu.product.schema.update.light`
- `alibaba.icbu.product.update`
- `alibaba.icbu.product.update.field`
- `alibaba.icbu.product.inventory.update`
- `alibaba.icbu.product.batch.update.display`
- `alibaba.icbu.photobank.upload`
- `alibaba.icbu.product.group.add`
- `alibaba.icbu.product.group.del`

原因不是“它们不存在”，而是：

- 它们属于写侧或高风险管理侧
- 当前 `WIKA` 仍未证明低风险、可隔离、可清理、可回滚边界
- 文档存在不等于当前主线适合立即推进

## 关键负结论

### 1. 当前没有读到明确的 draft 查询 / 删除 / 管理接口

在 `cid=20966` 的 47 个页面里，当前没有读到明确的：

- draft list
- draft query
- draft delete
- draft cancel
- draft manage

因此当前仍不能把：

- `schema.render.draft`
- `schema.add.draft`

误写成“draft 管理闭环已具备”

### 2. 当前没有读到明确的 media 删除 / 清理接口

当前确实读到了：

- `photobank.list`
- `photobank.group.list`
- `photobank.group.operate`
- `photobank.upload`

但没有在本类目里读到明确的：

- media delete
- photo cleanup
- asset rollback

因此当前仍不能用这批文档直接补齐：

- `photobank.upload` 的可清理边界
- media rollback 证据

### 3. 这批商品类目文档不能解决 `mydata` 权限阻塞

本次阅读范围属于 `ICBU－商品`

它不能直接回答或解决：

- `alibaba.mydata.overview.date.get`
- `alibaba.mydata.overview.industry.get`
- `alibaba.mydata.overview.indicator.basic.get`
- `alibaba.mydata.self.product.date.get`
- `alibaba.mydata.self.product.get`

这些方法在当前 `WIKA` 租户下的 `AUTH_BLOCKED` 问题

### 4. 这批商品类目文档不能直接解决订单 detail/fund/logistics 契约

当前读到的是商品侧文档，不是订单 detail/fund/logistics 的契约说明。

因此它不能直接解决：

- 阶段 17 / 18 里 `order.list` 返回遮罩 `trade_id`
- 但 `order.get / fund.get / logistics.get` 需要可复用 `e_trade_id`

这条 public readonly chaining 仍然未闭合的问题

## 对 WIKA 的可执行启发

如果后续重新打开任务 3，当前最值得优先保留的“文档已确认，但未验证”候选是：

1. `alibaba.icbu.product.type.available.get`
2. `alibaba.icbu.product.schema.add.draft`
3. `alibaba.icbu.product.id.encrypt`
4. `alibaba.icbu.product.id.decrypt`

优先级解释：

- `product.type.available.get`
  - 更像低风险 precheck
- `schema.add.draft`
  - 更像 `schema.render.draft` 的上游 ID 来源候选
  - 但仍属于写侧，不等于安全 draft 已成立
- `id.encrypt / decrypt`
  - 更像契约对账辅助能力
  - 不是直接业务闭环能力

## 当前边界声明

- 本轮没有做任何新的 Alibaba API 验证。
- 本轮没有推进平台内自动回复。
- 本轮没有推进平台内订单创建。
- 本轮没有推进真实通知外发。
- 本轮只是在收口 `ICBU－商品` 官方文档阅读结果与候选池。
- 当前边界仍然不是 task 1 complete，不是 task 2 complete，也不是平台内闭环。
