# WIKA 产品安全草稿链路说明

更新时间：2026-04-05

## 2026-04-11 Stage 28 Product Draft Workbench Candidate

### New local candidate route
- `/integrations/alibaba/wika/workbench/product-draft-workbench`

### Route scope
- reuses:
  - `products/detail`
  - `products/score`
  - `products/groups`
  - `categories/tree`
  - `categories/attributes`
  - `products/schema`
  - `products/schema/render`
  - `products/schema/render/draft`
  - `media/list`
  - `media/groups`
- exposes:
  - `product_context`
  - `schema_context`
  - `media_context`
  - `draft_readiness`
  - `required_manual_fields`
  - `blocking_risks`
  - `recommended_next_action`

### Boundary
- safe draft preparation only
- not platform publish
- not write-side closed loop
- local contract only in stage28

## 目标

当前链路的目标不是发布真实商品，而是在 WIKA 已验证的 production 闭环下，形成一条更接近真实写入要求、但仍停留在低风险草稿层的产品准备链路。

这条链路当前只做 4 件事：
1. 读取类目树与类目属性
2. 读取 product schema 与 schema render
3. 生成 schema-aware 的标题、卖点、描述、关键词和 payload 草稿
4. 明确哪些字段仍需人工补，哪些字段因低风险边界未被证明而不能自动化

## 当前已验证的底座

已上线且可直接复用的正式原始路由：
- `/integrations/alibaba/wika/data/categories/tree`
- `/integrations/alibaba/wika/data/categories/attributes`
- `/integrations/alibaba/wika/data/products/schema`
- `/integrations/alibaba/wika/data/products/schema/render`
- `/integrations/alibaba/wika/data/products/schema/render/draft`
- `/integrations/alibaba/wika/data/media/list`
- `/integrations/alibaba/wika/data/media/groups`

这些路由都已经在线上验证：
- 真实走到 `https://open-api.alibaba.com/sync`
- 真实使用 `access_token`
- 真实使用 `sha256`
- 真实返回 JSON

## 当前草稿链路结构

### 输入层
当前 schema-aware 草稿链路支持这些输入：
- 基础产品信息：`base_name`、`material`、`positioning`
- 卖点与文案：`selling_points`、`keyword_hints`、`application`、`customization`、`packaging_notes`
- 交易口径：`moq`、`lead_time`
- 类目结构：`category_id`、`category_name`
- 属性结构：`attributes`、`attribute_definitions`
- schema 结构：`schema_xml`、`render_xml`
- 素材占位：`asset_paths`

### 读取层
草稿链路优先复用已上线的原始路由：
- 类目树：`/integrations/alibaba/wika/data/categories/tree`
- 类目属性：`/integrations/alibaba/wika/data/categories/attributes`
- schema：`/integrations/alibaba/wika/data/products/schema`
- schema render：`/integrations/alibaba/wika/data/products/schema/render`
- schema render draft：`/integrations/alibaba/wika/data/products/schema/render/draft`
- media list：`/integrations/alibaba/wika/data/media/list`
- media groups：`/integrations/alibaba/wika/data/media/groups`

### 生成层
当前 helper 会输出：
- 自动生成标题
- 自动生成卖点
- 自动生成 HTML 描述
- 自动生成关键词
- schema-aware 字段映射结果
- 结构化 payload 草稿
- 人工仍需补齐字段列表
- 被低风险边界阻塞的字段列表
- 人工接管 artifact

## Phase 4 / Phase 5 / Phase 6 新增结论：低风险边界与可观测证据已并入草稿链路

### photobank.upload
当前结论：`当前无法证明低风险边界，因此不继续实写验证`

原因：
1. 官方成功响应会生成真实 `file_id` 与 `photobank_url`，说明会创建真实素材库资产。
2. `media/list` 已证明素材可观测，`media/groups` 已证明存在分组查询通道。
3. 但当前没有拿到可稳定证明“可清理、可回滚、不可外部误用”的边界证据。
4. 因此现阶段不做真实上传，不把它路由化为正式写接口。

Phase 6 新增证据：
1. `alibaba.icbu.photobank.group.operate` 已在 production 闭环下返回业务参数错误，说明 media 管理接口能够到达授权层之后。
2. 但该接口的成功路径是新增、删除、重命名真实图片分组，不属于天然低风险读侧。
3. 当前公开官方文档里也没有识别到明确的素材删除接口，因此仍不能证明“可清理、可回滚”。

被阻塞的自动化字段：
- `main_image.images`
- `product_sku.attributes[].sku_custom_image_url`
- `product_sku.special_skus[].attributes[].sku_custom_image_url`
- `description_html` 中的真实图片 URL

### product.add.draft
当前结论：`当前无法证明低风险边界，因此不继续实写验证`

原因：
1. 文档与成功响应特征都说明它会创建真实 draft 对象，而不是纯本地草稿。
2. `schema/render/draft` 已证明存在专门的 draft 渲染通道。
3. 使用正式商品 `product_id` 调用 `schema.render.draft` 时，平台返回 `Record does not exist`，说明 live product 与 draft object 可区分。
4. 但当前仍没有证据证明 draft 天然非公开、可清理、且不会带来真实业务副作用。
5. 因此现阶段不做真实 draft 创建，不把它当成已证明安全的草稿写入能力。

Phase 6 新增证据：
1. 当前公开官方文档里，除 `alibaba.icbu.product.schema.render.draft` 外，没有再识别到明确的 draft 查询 / 删除 / 管理接口。
2. `alibaba.icbu.product.schema.add.draft` 虽然被官方变动说明明确提及，但它属于“草稿发布成正式”的写侧，不属于当前阶段要补的可回滚证据。
3. 因此现阶段只能继续把 `add.draft` 视为“已过授权层，但仍未证明安全草稿边界”的候选。

被阻塞的自动化动作：
- 针对真实店铺账号执行 draft create
- 任何依赖真实 draft id 的后续写入链路

## 当前可做与不可做的边界

### 当前可做
- 读取类目与属性
- 读取 schema 与 render
- 读取 schema render draft
- 读取 media 列表与 media 分组
- 读取并分析已证明存在的 media / draft 管理证据
- 生成 schema-aware payload 草稿
- 输出自动生成字段与人工补齐字段
- 输出写侧边界阻塞说明、可观测/可回滚证据说明和人工接管 artifact
- 当命中写侧边界不足时，生成正式通知告警并进入 outbox fallback

### 当前不可做
- 真实商品发布
- 真实线上商品修改
- 真实 photobank 上传
- 真实 add.draft 创建
- 把 payload 草稿误写成平台商品已创建

## 人工接管触发条件

出现下列任一情况时，必须进入人工接管：
- 缺少类目或关键属性
- 缺少 schema 必填字段
- 缺少媒体素材
- 价格、MOQ、交期等商业承诺字段不确定
- 即将进入真实写操作
- 无法证明低风险边界

对应规则文档：
- `WIKA/docs/framework/WIKA_人工接管规则.md`
- `WIKA/docs/framework/WIKA_低风险写侧边界验证.md`
- `WIKA/docs/framework/WIKA_可观测可回滚证据验证.md`
- `WIKA/docs/framework/WIKA_正式通知闭环说明.md`

## 阶段 8 新增结论：正式通知闭环已并入草稿链路

当前草稿链路在命中以下阻塞时，已经不再只停留在本地样例层，而是可以进入正式通知闭环：

1. 权限阻塞
2. 平台无入口
3. 写侧边界不足
4. 写操作需要人工确认
5. 参数或样本 id 缺失

当前默认通知模式是：

- provider-agnostic notifier
- 无 provider 时写入 `data/alerts/outbox`

这意味着：

- 当前草稿链路已经具备“阻塞 -> 结构化告警 -> 可审计落盘”的正式通知能力
- 但这仍不等于真实邮件已发出，也不等于真实写入已经安全可用

## 当前一句话结论

WIKA 当前已经具备“schema-aware 的低风险产品草稿准备链路”，并且已经证明 media 可观测、draft 可区分；但还没有证明 photobank.upload 和 product.add.draft 具备可隔离、可清理、可回滚的低风险边界，因此仍不能把这条链路写成“产品上新闭环已完成”。

## 2026-04-13 Stage 29/30 Product Preview Addendum

- 已部署：
  - `/integrations/alibaba/wika/workbench/product-draft-preview`
- 当前 preview 只在既有安全草稿链路上，额外补一层输入感知输出：
  - `preview_input_summary`
  - `product_context`
  - `context_snapshot`
  - `draft_preview`
  - `required_manual_fields`
  - `blocking_risks`
  - `recommended_next_action`
- 固定边界：
  - safe draft preparation only
  - not platform publish
  - no write action attempted

