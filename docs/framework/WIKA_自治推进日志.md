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

#### 本阶段新增的安全底座

- 新增写侧阻塞分类 helper：
  - `shared/data/modules/alibaba-write-guardrails.js`
- 新增规则文档：
  - `docs/framework/WIKA_人工接管规则.md`
- 新增结构化告警样例：
  - `docs/framework/WIKA_人工接管告警样例.json`
- 新增产品草稿 helper：
  - `shared/data/modules/alibaba-product-drafts.js`
- 新增产品草稿样例：
  - `docs/framework/WIKA_产品草稿链路样例.json`

#### 本阶段真实生产分类结果

- `alibaba.icbu.category.get.new`
  - 真实走到 `/sync + access_token + sha256`
  - 返回真实 JSON
- `alibaba.icbu.category.attr.get`
  - 真实走到 `/sync + access_token + sha256`
  - 返回真实 JSON
- `alibaba.icbu.category.attribute.get`
  - 真实走到 `/sync + access_token + sha256`
  - 返回真实 JSON
- `alibaba.icbu.photobank.upload`
  - 真实走到 `/sync + access_token + sha256`
  - 返回业务参数错误，说明已过授权层
- `alibaba.icbu.product.add`
  - 真实走到 `/sync + access_token + sha256`
  - 返回业务参数错误，说明已过授权层
- `alibaba.icbu.product.schema.add`
  - 真实走到 `/sync + access_token + sha256`
  - 返回业务参数错误，说明已过授权层
- `alibaba.icbu.product.update`
  - 真实走到 `/sync + access_token + sha256`
  - 返回业务参数错误，说明已过授权层
- `alibaba.icbu.product.schema.update`
  - 真实走到 `/sync + access_token + sha256`
  - 返回业务参数错误，说明已过授权层
- `alibaba.icbu.product.update.field`
  - 真实走到 `/sync + access_token + sha256`
  - 返回业务参数错误，说明已过授权层

#### 本阶段落地的正式原始路由

- `/integrations/alibaba/wika/data/categories/tree`
  - 对接 `alibaba.icbu.category.get.new`
  - 已上线并已线上验证
- `/integrations/alibaba/wika/data/categories/attributes`
  - 对接 `alibaba.icbu.category.attr.get` + `alibaba.icbu.category.attribute.get`
  - 已上线并已线上验证
  - 缺少 `cat_id` 时，已线上返回 `400 + parameter_error`

#### 本阶段边界结论

- `categories/tree` 和 `categories/attributes` 已经进入可复用正式原始路由层
- `photobank.upload` 仅进入候选池，暂不路由化
- `product.add / schema.add / update / schema.update / update.field`
  - 当前只到授权层与参数层
  - 不能误报为“产品上新已完成”
  - 当前最安全的成果是“结构化产品草稿链路”

- 结束 checkpoint：`a716214`

### 阶段 3：任务 3 的安全草稿模式补强

- 起始 checkpoint：`47c5eec`

#### 本阶段真实生产分类结果

- `alibaba.icbu.product.schema.get`
  - 真实走到 `/sync + access_token + sha256`
  - 返回真实 JSON 样本数据
- `alibaba.icbu.product.schema.render`
  - 真实走到 `/sync + access_token + sha256`
  - 返回真实 JSON 样本数据
- `alibaba.icbu.product.add.draft`
  - 真实走到 `/sync + access_token + sha256`
  - 返回业务参数错误，说明已过授权层

#### 本阶段落地的正式原始路由

- `/integrations/alibaba/wika/data/products/schema`
  - 对接 `alibaba.icbu.product.schema.get`
  - 已上线并已线上验证
  - 缺少 `cat_id` 时，已线上返回 `400 + parameter_error`
- `/integrations/alibaba/wika/data/products/schema/render`
  - 对接 `alibaba.icbu.product.schema.render`
  - 已上线并已线上验证
  - 缺少 `cat_id / product_id` 时，已线上返回 `400 + parameter_error`

#### 本阶段新增的草稿链路沉淀

- 新增 schema 原始读取模块：
  - `shared/data/modules/alibaba-official-product-schema.js`
- 增强 schema-aware 草稿 helper：
  - `shared/data/modules/alibaba-product-drafts.js`
- 新增阶段验证脚本：
  - `scripts/validate-wika-write-phase3.js`
- 新增草稿链路说明：
  - `docs/framework/WIKA_产品安全草稿链路说明.md`
- 增强草稿链路样例：
  - `docs/framework/WIKA_产品草稿链路样例.json`

#### 本阶段边界结论

- `schema.get` 和 `schema.render` 已经进入可复用正式原始路由层
- 当前草稿链路已经从“普通草稿”推进到“schema-aware 草稿”
- `add.draft` 当前只证明：
  - 已过授权层
  - 可以继续确认 payload 要求
  - 但还不能误报为“安全草稿模式已证明成立”
- `photobank.upload` 当前仍只保留在候选池，未进入正式路由

- 结束 checkpoint：待本阶段最终收口后补记
