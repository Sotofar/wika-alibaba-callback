# WIKA 产品安全草稿链路说明

更新时间：2026-04-04

## 目标

这条链路的目标不是直接发布真实商品，而是在当前已经拿到的能力基础上，把产品写侧推进到更安全、更可复核的“草稿模式”：

1. 读取类目树与类目属性
2. 读取商品 schema 规则与 render 结果
3. 生成更贴近真实写入要求的 payload 草稿
4. 明确哪些字段仍需人工补充
5. 在高风险写操作前触发人工接管

## 当前已验证基础

当前 `WIKA` 已经真实走通并可复用：

- `/integrations/alibaba/wika/data/categories/tree`
- `/integrations/alibaba/wika/data/categories/attributes`
- `/integrations/alibaba/wika/data/products/schema`
- `/integrations/alibaba/wika/data/products/schema/render`

同时，以下写侧接口已经证明能走到当前 production 认证闭环，但还不能误写为“可安全执行”：

- `alibaba.icbu.photobank.upload`
- `alibaba.icbu.product.add.draft`
- `alibaba.icbu.product.add`
- `alibaba.icbu.product.schema.add`
- `alibaba.icbu.product.update`
- `alibaba.icbu.product.schema.update`
- `alibaba.icbu.product.update.field`

这些接口当前只证明了：

- 能走到 `/sync + access_token + sha256`
- 已过授权层
- 已拿到真实业务参数错误或真实 JSON

但这不等于：

- 已经具备安全可逆的真实发布能力
- 已经允许自动修改线上商品

## 当前草稿链路结构

### 1. 输入层

当前草稿 helper 接受这些核心输入：

- `category_id`
- `category_name`
- `attributes`
- `attribute_definitions`
- `schema_xml`
- `render_xml`
- `asset_paths`
- 基础文案输入：
  - `base_name`
  - `material`
  - `positioning`
  - `selling_points`
  - `keyword_hints`
  - `application`
  - `customization`
  - `packaging_notes`
  - `moq`
  - `lead_time`

### 2. 读取层

草稿链路优先复用这些已上线原始路由：

- 类目树：`/integrations/alibaba/wika/data/categories/tree`
- 类目属性：`/integrations/alibaba/wika/data/categories/attributes`
- schema：`/integrations/alibaba/wika/data/products/schema`
- render：`/integrations/alibaba/wika/data/products/schema/render`

### 3. 生成层

当前 helper 会输出：

- 标题
- 卖点
- 描述 HTML
- 关键词
- schema-aware 字段映射
- payload 草稿
- 人工仍需补充的 schema 必填字段
- 阻塞分类与人工接管 artifact

## schema-aware 的当前边界

当前不是完整的 XML 直写器，也不是最终发布器。

当前只做到了：

1. 从 `schema.get` / `schema.render` 的 XML 中提取字段 id 与必填字段线索
2. 把现有草稿字段映射到常见 schema 字段，例如：
   - `productTitle`
   - `productKeywords`
   - `productDescType`
   - `superText`
   - `icbuCatProp`
   - `scImages`
   - `minOrderQuantity`
   - `productGroup`
3. 输出 `human_required_fields`，把仍需人工确认或补齐的字段显式列出

当前还没有做到：

- 自动拼装可直接提交的最终 XML
- 自动判断所有行业/类目特有字段
- 自动处理真实图片上传
- 自动触发真实发布

## add.draft 的当前收口

`alibaba.icbu.product.add.draft` 当前已经在 production 闭环下跑到：

- `/sync`
- `access_token`
- `sha256`

并且返回了真实业务参数错误，说明已过授权层。

但当前仍然不能把它推进成正式写路由，原因是：

1. 还没有证明它在当前店铺上具备足够低风险的“只生成草稿、不触发真实发布副作用”的边界
2. 还没有拿到足够完整、可安全复用的 payload 要求集合
3. 当前图片与 schema 必填字段仍有大量人工补充项

所以当前对 `add.draft` 的结论必须保持为：

- 已验证可调用到授权层
- 可用于确认 payload 要求与草稿方向
- 但**不能**误写为“产品上新闭环已完成”

## 人工接管触发条件

当前草稿链路中，只要出现以下任一情况，就必须触发人工接管：

- 缺少素材
- 缺少类目或属性
- 缺少 schema 必填字段
- 准备进入真实写操作
- 操作不可逆或影响线上商品

这部分规则已经统一沉淀在：

- [WIKA_人工接管规则.md](/D:/Code/阿里国际站/docs/framework/WIKA_人工接管规则.md)

## 推荐使用顺序

后续若继续推进任务 3，推荐顺序固定为：

1. 先读类目树
2. 再读类目属性
3. 再读 schema
4. 再读 render
5. 再生成 schema-aware 草稿
6. 再判断是否满足低风险写侧验证前提

不要跳过 schema / render 直接冒进验证真实写入。

## 当前一句话结论

当前 `WIKA` 已经从“普通产品草稿”推进到了“schema-aware 的安全草稿模式”，但仍然停留在：

- 可生成更接近真实写入要求的 payload 草稿
- 可明确人工补充字段
- 可在写前触发人工接管

还**没有**进入：

- 安全可逆的真实平台发布闭环
