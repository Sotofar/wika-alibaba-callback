# WIKA 产品安全草稿链路说明

更新时间：2026-04-04

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

## Phase 4 新增结论：低风险边界已并入草稿链路

### photobank.upload
当前结论：`当前无法证明低风险边界，因此不继续实写验证`

原因：
1. 官方成功响应会生成真实 `file_id` 与 `photobank_url`，说明会创建真实素材库资产。
2. 当前没有拿到可稳定证明“可清理、可回滚、不可外部误用”的边界证据。
3. 因此现阶段不做真实上传，不把它路由化为正式写接口。

被阻塞的自动化字段：
- `main_image.images`
- `product_sku.attributes[].sku_custom_image_url`
- `product_sku.special_skus[].attributes[].sku_custom_image_url`
- `description_html` 中的真实图片 URL

### product.add.draft
当前结论：`当前无法证明低风险边界，因此不继续实写验证`

原因：
1. 文档与成功响应特征都说明它会创建真实 draft 对象，而不是纯本地草稿。
2. 当前没有证据证明 draft 天然非公开、可清理、且不会带来真实业务副作用。
3. 因此现阶段不做真实 draft 创建，不把它当成已证明安全的草稿写入能力。

被阻塞的自动化动作：
- 针对真实店铺账号执行 draft create
- 任何依赖真实 draft id 的后续写入链路

## 当前可做与不可做的边界

### 当前可做
- 读取类目与属性
- 读取 schema 与 render
- 生成 schema-aware payload 草稿
- 输出自动生成字段与人工补齐字段
- 输出写侧边界阻塞说明和人工接管 artifact

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
- `docs/framework/WIKA_人工接管规则.md`
- `docs/framework/WIKA_低风险写侧边界验证.md`

## 当前一句话结论

WIKA 当前已经具备“schema-aware 的低风险产品草稿准备链路”，但还没有证明 photobank.upload 和 product.add.draft 的低风险边界成立，因此仍不能把这条链路写成“产品上新闭环已完成”。
