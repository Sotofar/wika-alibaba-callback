# WIKA 低风险写侧边界验证

更新时间：2026-04-05

## 阶段范围

本阶段只验证两件事：

1. `alibaba.icbu.photobank.upload` 是否存在足够低风险的测试/草稿边界
2. `alibaba.icbu.product.add.draft` 是否存在足够低风险的草稿边界

固定前提：

- 只推进 `WIKA`
- 只复用 Railway production 认证闭环
- 只复用 `/sync + access_token + sha256`
- 不走本地 `.env` / 本地 callback / 本地 token
- 不做真实商品发布、真实线上商品修改、真实客户沟通

## 一、photobank.upload 的边界收口

### 已继承的真实事实

- 已在 production 闭环下走到：
  - `/sync`
  - `access_token`
  - `sha256`
- 当前真实分类：`业务参数错误（说明已过授权层）`

### 文档层证据

官方文档显示：

- 请求参数要求 `file_name` 与 `image_bytes`
- 成功响应会返回：
  - `file_id`
  - `photobank_url`
- `photobank_url` 会被产品主图、SKU 图、详情图等写侧字段直接引用

这说明成功调用不会只生成一个本地测试结果，而是会创建真实图片银行资产。

### 低风险边界判断

当前无法证明以下几点：

1. 上传后的图片天然非公开
2. 上传后的图片天然不会被业务侧误用
3. 测试素材一定可清理、可回滚
4. 当前已识别到的图片银行相关接口足以形成稳定删除/清理闭环

### 阶段结论

- 当前分类：`当前无法证明低风险边界，因此不继续实写验证`
- 当前不进入真实上传验证
- 当前不进入正式原始路由开发

### 当前允许保留的能力

- 保留参数门槛与 payload 依赖分析
- 保留素材字段映射设计
- 保留已上线的 media 可观测读路由：
  - `/integrations/alibaba/wika/data/media/list`
  - `/integrations/alibaba/wika/data/media/groups`
- 保留后续候选池地位，但不继续实写

## 二、product.add.draft 的边界收口

### 已继承的真实事实

- 已在 production 闭环下走到：
  - `/sync`
  - `access_token`
  - `sha256`
- 当前真实分类：`业务参数错误（说明已过授权层）`

### 文档层证据

官方文档显示：

- `alibaba.icbu.product.add.draft` 的成功响应会返回 `product_id`
- 该 `product_id` 是混淆后的产品 ID
- 官方同时存在 `alibaba.icbu.product.schema.render.draft`

这说明成功调用不会只是生成一个本地 payload，而是会创建平台侧可持续引用的草稿对象。

### 低风险边界判断

当前无法证明以下几点：

1. draft 对象天然非公开、不会出现在外部可见商品面
2. draft 对象一定可安全删除或清理
3. 一次最小测试 draft 创建不会在卖家后台留下不可接受的真实业务副作用
4. 当前草稿 payload 已经足够完整到可以做低风险、可控、可回滚的真实 draft 创建验证

### 阶段结论

- 当前分类：`当前无法证明低风险边界，因此不继续实写验证`
- 当前不进入真实 draft 创建验证
- 当前不进入正式写路由开发

### 当前允许保留的能力

- 继续增强 schema-aware payload 草稿
- 继续确认哪些字段自动生成、哪些字段必须人工补充
- 保留已上线的 draft 可观测读路由：
  - `/integrations/alibaba/wika/data/products/schema/render/draft`
- 继续把人工接管规则前置到写侧链路中

## 三、阶段结论汇总

| 接口 | 当前真实调用状态 | 边界结论 | 本阶段动作 |
| --- | --- | --- | --- |
| `alibaba.icbu.photobank.upload` | 已过授权层，当前返回业务参数错误 | 当前无法证明低风险边界，因此不继续实写验证 | 不上正式路由，不做真实上传 |
| `alibaba.icbu.product.add.draft` | 已过授权层，当前返回业务参数错误 | 当前无法证明低风险边界，因此不继续实写验证 | 不做真实 draft 创建，只增强草稿链路 |

## 四、对现有草稿链路的影响

本阶段之后，`WIKA` 的写侧状态应当准确描述为：

- 已具备：
  - 类目树读取
  - 类目属性读取
  - schema 读取
  - schema render 读取
  - schema-aware payload 草稿生成
  - 人工接管规则
- 尚不具备：
  - 安全可逆的真实素材上传闭环
  - 安全可逆的真实 draft 创建闭环
  - 安全可逆的真实商品发布闭环

## 五、Phase 5 新增证据

### media 侧

- `photobank.list` 已证明素材可被列出和识别
- `photobank.group.list` 已证明存在分组查询通道
- `photobank.group.operate` 已证明官方分组管理接口可以到授权层之后
- 但当前仍无法证明测试素材可稳定隔离、可删除、可回滚

### draft 侧

- `schema.render.draft` 已证明存在专门的 draft 渲染通道
- 使用正式商品 `product_id` 调用时，平台返回 `Record does not exist`
- 这说明 live product 与 draft object 可以区分
- 当前公开官方文档中，除 `schema.render.draft` 外，没有再识别到明确的 draft 查询 / 删除 / 管理接口
- 但当前仍无法证明真实 draft 创建后可清理、可审计、可回滚

## 六、下一步建议

如果继续推进任务 3，下一步不应直接做真实写入，而应优先选择：

1. 继续增强 payload 草稿质量
2. 继续识别更安全的 schema / render / draft 辅助入口
3. 只有在能证明低风险边界成立时，才重新考虑真实写侧验证
