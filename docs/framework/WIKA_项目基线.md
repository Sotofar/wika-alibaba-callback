# WIKA_项目基线

## 一句话总基线
只推进 WIKA；当前主线是任务 3 的“管理 / 清理 / 回滚证据补齐”；media 可观测、media 分组查询、media 分组管理接口到授权层、draft 渲染通道都已成立，但在未证明 media 与 draft 的可隔离、可清理、可回滚边界前，仍不进入最小真实写入验证。

## 当前已完成阶段
- 产品 / 订单 / 物流基础读侧原始路由已上线并线上验证
- 类目 / 属性原始路由已上线并线上验证
- schema / schema.render 原始路由已上线并线上验证
- media/list、media/groups、products/schema/render/draft 原始路由已上线并线上验证
- mydata / overview / self.product 路线已收口为权限/能力阻塞
- photobank.group.operate 已过授权层，但当前仍无法证明低风险管理边界
- photobank.upload 已过授权层，但当前无法证明低风险上传边界
- product.add.draft 已过授权层，但当前无法证明安全草稿边界

## 已上线可复用路由
- /integrations/alibaba/wika/data/products/list
- /integrations/alibaba/wika/data/products/score
- /integrations/alibaba/wika/data/products/detail
- /integrations/alibaba/wika/data/products/groups
- /integrations/alibaba/wika/data/orders/list
- /integrations/alibaba/wika/data/orders/detail
- /integrations/alibaba/wika/data/orders/fund
- /integrations/alibaba/wika/data/orders/logistics
- /integrations/alibaba/wika/reports/products/management-summary
- /integrations/alibaba/wika/data/categories/tree
- /integrations/alibaba/wika/data/categories/attributes
- /integrations/alibaba/wika/data/products/schema
- /integrations/alibaba/wika/data/products/schema/render
- /integrations/alibaba/wika/data/media/list
- /integrations/alibaba/wika/data/media/groups
- /integrations/alibaba/wika/data/products/schema/render/draft

## 已确认的写侧事实
- alibaba.icbu.category.get.new -> 真实 JSON 样本数据
- alibaba.icbu.category.attr.get -> 真实 JSON 样本数据
- alibaba.icbu.category.attribute.get -> 真实 JSON 样本数据
- alibaba.icbu.product.schema.get -> 真实 JSON 样本数据
- alibaba.icbu.product.schema.render -> 真实 JSON 样本数据
- alibaba.icbu.photobank.list -> 真实 JSON 样本数据
- alibaba.icbu.photobank.group.list -> 真实 JSON 样本数据
- alibaba.icbu.photobank.group.operate -> 业务参数错误（说明已过授权层），但当前仍无法证明可隔离 / 可清理 / 可回滚边界
- alibaba.icbu.product.schema.render.draft -> 真实 JSON（可区分 live product 与 draft object）
- alibaba.icbu.photobank.upload -> 已过授权层，但当前无法证明低风险上传边界
- alibaba.icbu.product.add.draft -> 已过授权层，但当前无法证明安全草稿边界
- alibaba.icbu.product.add / schema.add / update / schema.update / update.field -> 仍只到授权层与 payload 门槛验证
- draft 查询 / 删除 / 管理同家族新增接口 -> 当前未识别到可用入口（除已验证的 schema.render.draft 外）

## 当前明确不推进
- XD
- mydata / overview / 数据管家
- inquiries / messages / customers
- order create
- RFQ
- 本地 `.env` / 本地 callback / 本地 token 旁路
- 真实商品发布
- 真实线上商品修改
- 真实客户沟通

## 当前还缺的核心能力
### 任务 1
- 店铺经营指标入口
- 产品表现入口

### 任务 2
- 最小经营聚合层

### 任务 3
- media 写入的低风险边界证明
- add.draft 的安全草稿边界证明
- add/update 家族的可逆或草稿模式证明

### 任务 4
- 询盘 / 消息 / 客户读写与平台内回复

### 任务 5
- 平台内订单草稿 / 交易创建

### 任务 6
- 邮件通知、阻塞分类到通知动作的正式闭环

## 当前唯一推荐下一步
若继续任务 3，只在“官方文档中明确存在”的 media 删除/清理接口或 draft 查询/删除/管理接口出现时再继续验证；在这些新增证据出现前，不进入最小真实写入验证，也不再围绕 upload / add.draft 反复循环。

## 当前真实数据结论
- media 可观测：已成立
- media 分组查询通道存在：已成立
- media 分组管理接口可到授权层之后：已成立
- draft 渲染通道存在且与 live product 可区分：已成立
- 当前仍不具备进入最小真实写入验证的前置条件：已成立

## 当前待验证判断
- media 是否存在足够稳定的删除 / 清理接口，可证明真正的可回滚边界
- draft 是否存在查询 / 删除 / 管理接口，可证明真正的可审计 / 可回滚边界
- 在这些证据补齐后，是否才可进入最小真实写入验证
