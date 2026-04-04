# WIKA 自治推进日志

## 2026-04-04

### 阶段 1：任务 1/2 的数据入口验证与最小原始路由化

- 起始 checkpoint：`4d27e66`
- 收口结论：
  - `alibaba.mydata.overview.indicator.basic.get` -> 权限错误 `InsufficientPermission`
  - `alibaba.mydata.self.product.get` -> 最终权限错误 `InsufficientPermission`
  - `alibaba.mydata.self.product.date.get` -> 权限错误
  - `alibaba.mydata.overview.date.get` -> 权限错误
  - `alibaba.mydata.overview.industry.get` -> 权限错误
- 结果：
  - 数据管家这组接口不再作为当前主线推进
  - 不进入最小正式原始路由候选池
- 结束 checkpoint：`e50a087`

### 阶段 2：写侧安全底座 + 产品上新入口验证

- 起始 checkpoint：`f3bd86a`
- 新增能力：
  - `shared/data/modules/alibaba-write-guardrails.js`
  - `docs/framework/WIKA_人工接管规则.md`
  - `docs/framework/WIKA_人工接管告警样例.json`
  - `shared/data/modules/alibaba-product-drafts.js`
  - `docs/framework/WIKA_产品草稿链路样例.json`
- 真实生产分类结果：
  - `alibaba.icbu.category.get.new` -> 真实 JSON
  - `alibaba.icbu.category.attr.get` -> 真实 JSON
  - `alibaba.icbu.category.attribute.get` -> 真实 JSON
  - `alibaba.icbu.photobank.upload` -> 业务参数错误（已过授权层）
  - `alibaba.icbu.product.add` -> 业务参数错误（已过授权层）
  - `alibaba.icbu.product.schema.add` -> 业务参数错误（已过授权层）
  - `alibaba.icbu.product.update` -> 业务参数错误（已过授权层）
  - `alibaba.icbu.product.schema.update` -> 业务参数错误（已过授权层）
  - `alibaba.icbu.product.update.field` -> 业务参数错误（已过授权层）
- 新增正式原始路由：
  - `/integrations/alibaba/wika/data/categories/tree`
  - `/integrations/alibaba/wika/data/categories/attributes`
- 阶段收口：
  - 类目与属性进入可复用正式原始路由层
  - photobank / add / update 家族只到授权层与参数层，不能误报为产品上新已完成
- 结束 checkpoint：`6850a05`

### 阶段 3：任务 3 的安全草稿模式补强

- 起始 checkpoint：`47c5eec`
- 真实生产分类结果：
  - `alibaba.icbu.product.schema.get` -> 真实 JSON
  - `alibaba.icbu.product.schema.render` -> 真实 JSON
  - `alibaba.icbu.product.add.draft` -> 业务参数错误（已过授权层）
- 新增正式原始路由：
  - `/integrations/alibaba/wika/data/products/schema`
  - `/integrations/alibaba/wika/data/products/schema/render`
- 新增沉淀：
  - `shared/data/modules/alibaba-official-product-schema.js`
  - `scripts/validate-wika-write-phase3.js`
  - `docs/framework/WIKA_产品安全草稿链路说明.md`
- 阶段收口：
  - schema 与 render 已进入正式原始路由层
  - 草稿链路已经推进到 schema-aware 模式
  - `add.draft` 仍不能误写为安全草稿模式已成立
- 结束 checkpoint：`a716214`

### 阶段 4：任务 3 的低风险写侧边界验证

- 起始 checkpoint：`f71c984`
- 本阶段只做两件事：
  - 判断 `alibaba.icbu.photobank.upload` 是否存在足够低风险的测试/草稿边界
  - 判断 `alibaba.icbu.product.add.draft` 是否存在足够低风险的草稿边界
- 真实收口结论：
  - `alibaba.icbu.photobank.upload`
    - 当前分类：`当前无法证明低风险边界，因此不继续实写验证`
    - 理由：成功响应会创建真实素材库资产；当前缺少可稳定证明“可清理、可隔离、可回滚”的边界证据
  - `alibaba.icbu.product.add.draft`
    - 当前分类：`当前无法证明低风险边界，因此不继续实写验证`
    - 理由：成功响应会创建真实 draft 对象；当前缺少可稳定证明“非发布、非公开、可清理”的边界证据
- 新增沉淀：
  - `docs/framework/WIKA_低风险写侧边界验证.md`
  - `scripts/validate-wika-write-phase4.js`
  - `shared/data/modules/alibaba-write-guardrails.js` 阶段 4 边界对象
  - `shared/data/modules/alibaba-product-drafts.js` 阶段 4 阻塞字段与边界输出
  - `docs/framework/WIKA_产品安全草稿链路说明.md` 阶段 4 更新
  - `docs/framework/WIKA_产品草稿链路样例.json` 阶段 4 增强样例
- 阶段收口：
  - photobank 与 add.draft 都不进入真实写验证
  - 当前草稿链路进一步增强，但仍停留在“schema-aware 低风险准备层”
  - 不允许把本阶段结果误写为“产品上新闭环已完成”
- 结束 checkpoint：`c133060`

### 阶段 5：任务 3 的可观测 / 可回滚证据验证

- 起始 checkpoint：`79ac95f`
- 本阶段只做两件事：
  - 判断 media 侧是否已经具备可观测、可隔离、可管理证据
  - 判断 draft 侧是否已经具备可观测、可区分、可审计证据
- 新增正式原始路由：
  - `/integrations/alibaba/wika/data/media/list`
  - `/integrations/alibaba/wika/data/media/groups`
  - `/integrations/alibaba/wika/data/products/schema/render/draft`
- 真实生产分类结果：
  - `alibaba.icbu.photobank.list` -> 真实 JSON
  - `alibaba.icbu.photobank.group.list` -> 真实 JSON
  - `alibaba.icbu.product.schema.render.draft` -> 真实 JSON（`biz_success=false`，`Record does not exist`）
- 阶段收口：
  - media 侧已经证明素材可观测，且存在分组查询通道
  - draft 侧已经证明存在专门的 draft 渲染通道，且 live product 与 draft object 可区分
  - 但当前仍不能证明 media/upload 与 add.draft 具备可隔离、可清理、可回滚的低风险边界
  - 因此当前仍不具备进入“最小真实写入验证”的前置条件
- 新增沉淀：
  - `shared/data/modules/alibaba-official-media.js`
  - `scripts/validate-wika-write-phase5.js`
  - `docs/framework/WIKA_可观测可回滚证据验证.md`
  - `docs/framework/WIKA_产品安全草稿链路说明.md` 阶段 5 更新
  - `docs/framework/WIKA_产品草稿链路样例.json` 阶段 5 增强样例
- 结束 checkpoint：`90f6a74`

