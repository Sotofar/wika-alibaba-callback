# WIKA_项目基线

## 一句话总基线
只推进 WIKA；当前主线已完成任务 6 的“正式通知闭环”最小落地：系统已能把真实阻塞转成结构化告警，并通过 provider 或 outbox fallback 落盘；在真实外发 provider 未配置前，默认走可审计 fallback，不把它误写成邮件已发出。

## 当前已完成阶段
- 产品 / 订单 / 物流基础读侧原始路由已上线并线上验证
- 类目 / 属性原始路由已上线并线上验证
- schema / schema.render 原始路由已上线并线上验证
- media/list、media/groups、products/schema/render/draft 原始路由已上线并线上验证
- customers 家族已完成真实生产分类
- customers/list 权限探针型只读路由已上线并线上验收
- provider-agnostic 正式通知模块已落地
- 最小正式通知闭环已成立（当前默认 outbox fallback）
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
- /integrations/alibaba/wika/data/customers/list

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
- alibaba.seller.customer.batch.get -> 已真实走到 `/sync + access_token + sha256`；缺参时为业务参数错误，使用真实窗口参数后为权限错误
- alibaba.seller.customer.get -> 已真实走到 `/sync + access_token + sha256`；当前为业务参数错误，缺少 `buyer_member_seq`
- alibaba.seller.customer.note.query -> 已真实走到 `/sync + access_token + sha256`；当前为业务参数错误，缺少 `note_id`
- alibaba.seller.customer.note.get -> 已真实走到 `/sync + access_token + sha256`；当前为业务参数错误，缺少 `page_num / page_size / customer_id`
- alibaba.icbu.photobank.upload -> 已过授权层，但当前无法证明低风险上传边界
- alibaba.icbu.product.add.draft -> 已过授权层，但当前无法证明安全草稿边界
- alibaba.icbu.product.add / schema.add / update / schema.update / update.field -> 仍只到授权层与 payload 门槛验证
- draft 查询 / 删除 / 管理同家族新增接口 -> 当前未识别到可用入口（除已验证的 schema.render.draft 外）

## 当前明确不推进
- XD
- mydata / overview / 数据管家
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
- customers 详情 / note 读侧原始路由
- inquiries / messages 读侧入口
- 平台内回复与客户沟通闭环

### 任务 5
- 平台内订单草稿 / 交易创建

### 任务 6
- 真实邮件 / webhook provider 外发
- 把正式通知闭环接到更多真实阻塞触发点

## 当前唯一推荐下一步
若继续任务 6，只建议先配置一个低风险正式 provider（优先 webhook，其次 Resend 邮件），把当前已经成立的 outbox fallback 升级成真实外发通知；在 provider 未配置前，不再把“通知能力缺失”当作主阻塞。

## 当前真实数据结论
- media 可观测：已成立
- media 分组查询通道存在：已成立
- media 分组管理接口可到授权层之后：已成立
- draft 渲染通道存在且与 live product 可区分：已成立
- customers 家族可走 production 认证闭环：已成立
- `customers/list` 已上线，但当前更接近权限探针而非稳定数据读取能力：已成立
- inquiry / message 官方读侧方法当前未识别到明确入口：已成立
- 当前仍不具备进入最小真实写入验证的前置条件：已成立
- 当前没有现成通知 provider 配置：已成立
- 当前最小正式通知闭环已成立（provider-agnostic + outbox fallback）：已成立

## 当前待验证判断
- customers 详情 / note 是否能在拿到真实 id 后返回真实 JSON
- inquiry / message 是否会出现官方明确的读侧 list/detail 方法
- media / draft 证据补齐后，是否才可进入最小真实写入验证
- 真实 webhook / email provider 配置后，是否能在 production 下完成低风险真实外发通知
