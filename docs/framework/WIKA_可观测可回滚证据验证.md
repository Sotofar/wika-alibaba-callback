# WIKA 可观测可回滚证据验证

更新时间：2026-04-05

## 阶段目标

本阶段不再直接撞 `photobank.upload` 和 `product.add.draft` 的真实写入边界，而是先回答两个问题：

1. media 侧是否已经具备足够的可观测、可隔离、可管理证据；
2. draft 侧是否已经具备足够的可观测、可区分、可审计证据。

固定前提：

- 只推进 `WIKA`
- 只复用 Railway production 认证闭环
- 只复用 `/sync + access_token + sha256`
- 不走本地 `.env` / 本地 callback / 本地 token
- 不做真实商品发布、真实线上修改、真实客户沟通

## 一、media 侧可观测证据

### 已验证入口

- `alibaba.icbu.photobank.list`
- `alibaba.icbu.photobank.group.list`

### 当前真实调用结果

#### 1. photobank.list

- 已真实走到：
  - `https://open-api.alibaba.com/sync`
  - `access_token`
  - `sha256`
- 当前分类：`真实 JSON 样本数据`
- 已上线正式只读路由：
  - `/integrations/alibaba/wika/data/media/list`

当前已证实的可观测字段包括：

- `id`
- `url`
- `file_name`
- `reference_count`
- `file_size`
- `gmt_modified`
- `owner_member_display_name`

这说明：

1. 图片银行素材确实可以被列出
2. 素材可被赋予独立 `id`
3. 至少能观察到部分引用次数和修改时间

#### 2. photobank.group.list

- 已真实走到：
  - `https://open-api.alibaba.com/sync`
  - `access_token`
  - `sha256`
- 当前分类：`真实 JSON 样本数据`
- 已上线正式只读路由：
  - `/integrations/alibaba/wika/data/media/groups`

这说明：

1. 图片银行分组查询通道存在
2. media 侧至少存在“分组”这一层对象模型

但当前店铺返回的 `groups` 结构信息不足，不能据此证明：

1. 测试素材可以被稳定隔离到独立测试组
2. 分组操作足以支撑后续批量清理
3. 当前已经形成可靠的素材删除/回滚闭环

### media 侧结论

当前已经证实：

- media 素材可观测能力成立
- media 分组查询能力存在

当前仍未证实：

- 可稳定隔离测试素材
- 可安全清理测试素材
- 可形成可回滚的低风险上传闭环

### 当前判断

- `photobank.list`：`可进入最小正式原始路由候选池`，且已实际进入正式只读路由
- `photobank.group.list`：`可进入最小正式原始路由候选池`，且已实际进入正式只读路由
- `photobank.upload`：`当前无法证明低风险边界，因此不继续实写验证`

## 二、draft 侧可观测证据

### 已验证入口

- `alibaba.icbu.product.schema.render.draft`

### 当前真实调用结果

- 已真实走到：
  - `https://open-api.alibaba.com/sync`
  - `access_token`
  - `sha256`
- 当前分类：`真实 JSON 样本数据`
- 已上线正式只读路由：
  - `/integrations/alibaba/wika/data/products/schema/render/draft`

当前使用真实线上商品 `product_id` 调用该接口时，返回：

- `biz_success = false`
- `msg_code = isp.system-service-error:API_SYSTEM_ERROR`
- `message` 含 `Record does not exist`

### 这组证据能证明什么

当前已经能证明：

1. draft 存在独立于正式商品的渲染/读取通道
2. 正式商品 `product_id` 不能直接充当 draft 对象读取
3. draft 对象与正式商品对象至少在读取层是可区分的

### 这组证据还不能证明什么

当前还不能证明：

1. 已存在可读取的真实 draft 对象样本
2. draft 一定天然非公开
3. draft 一定可安全删除、可审计、可回滚
4. `product.add.draft` 已具备低风险真实创建边界

### 当前判断

- `schema.render.draft`：`可进入最小正式原始路由候选池`，且已实际进入正式只读路由
- `product.add.draft`：`当前无法证明低风险边界，因此不继续实写验证`

## 三、当前是否已具备“最小真实写入验证”前置条件

结论：**尚未具备。**

### 原因

#### media 侧

- 已证明“能看见”
- 未证明“能隔离、能清理、能回滚”

#### draft 侧

- 已证明“存在专门 draft 渲染通道”
- 已证明“live product 与 draft object 可区分”
- 未证明“draft create 后可安全回收、无外部副作用”

## 四、当前允许与不允许的动作

### 当前允许

- 继续复用：
  - `/integrations/alibaba/wika/data/media/list`
  - `/integrations/alibaba/wika/data/media/groups`
  - `/integrations/alibaba/wika/data/products/schema/render/draft`
- 继续增强 schema-aware 草稿链路
- 继续沉淀人工接管与阻塞证据

### 当前不允许

- 真实 `photobank.upload`
- 真实 `product.add.draft`
- 任何真实商品发布
- 任何真实线上商品修改

## 五、一句话收口

WIKA 当前已经证明了 **media 可观测** 与 **draft 可区分**，但还没有证明 **可隔离、可清理、可回滚**，因此当前仍不具备进入“最小真实写入验证”的前置条件。
