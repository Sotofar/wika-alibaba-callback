# WIKA_项目基线

## 一句话总基线
只推进 `WIKA`；当前主线已经形成“真实读侧原始路由 + 最小经营诊断层 + provider-agnostic 正式通知闭环 + 模板化外部草稿工作流 SOP 层”，并补充完成“经营数据候选接口只读验证 + mydata 权限清障包 + 订单参数契约对账包”；但 `mydata / overview / self.product` 仍停在权限/能力阻塞，订单级经营汇总当前只证明到“可由现有交易 API 部分派生”，还没有形成完整经营驾驶舱，也没有证明平台内安全写入边界。

## 当前已完成阶段
- 产品 / 订单 / 物流基础读侧原始路由已上线并线上验证
- 类目 / 属性原始路由已上线并线上验证
- schema / schema.render 原始路由已上线并线上验证
- `media/list`、`media/groups`、`products/schema/render/draft` 原始路由已上线并线上验证
- `customers` 家族已完成生产分类，`customers/list` 作为权限探针型只读路由已上线
- provider-agnostic 正式通知闭环已成立
- webhook / resend provider 预接线与 dry-run 已成立
- phase13 已确认真实 provider 外发当前缺配置 / 缺可控目标
- operations / products / orders minimal-diagnostic 已上线并线上验证
- 外部回复草稿工具路由已上线并线上验证
- 外部订单草稿工具路由已上线并线上验证
- 外部回复 / 外部订单工作流输入模板、blocker taxonomy、follow-up questions、handoff_fields、handoff checklist、manual completion SOP 已成立
- 外部草稿工作流质量评估层、可失败回归闸门、交接包导出已成立
- `mydata / overview / self.product` 路线已多轮收口为权限 / 能力阻塞
- `photobank.upload` 已过授权层，但当前无法证明低风险上传边界
- `product.add.draft` 已过授权层，但当前无法证明安全草稿边界
- 阶段 17 已完成经营数据候选接口只读验证：
  - `alibaba.mydata.overview.date.get` -> `AUTH_BLOCKED`
  - `alibaba.mydata.overview.industry.get` -> `AUTH_BLOCKED`
  - `alibaba.mydata.overview.indicator.basic.get` -> `AUTH_BLOCKED`
  - `alibaba.mydata.self.product.date.get` -> `AUTH_BLOCKED`
  - `alibaba.mydata.self.product.get` -> `AUTH_BLOCKED`
  - `alibaba.seller.order.list` -> `REAL_DATA_RETURNED`
  - `alibaba.seller.order.get` -> `PARAMETER_REJECTED`
  - `alibaba.seller.order.fund.get` -> `PARAMETER_REJECTED`
  - `alibaba.seller.order.logistics.get` -> `PARAMETER_REJECTED`
  - 订单经营汇总当前只证明到 `DERIVABLE_FROM_EXISTING_ORDER_APIS` 的“部分成立”
- 阶段 18 已完成经营数据清障与订单参数契约对账：
  - `mydata` 5 个方法已形成对外权限清障包，当前状态统一固定为：
    - current classification = `AUTH_BLOCKED`
    - clearance status = `ACCESS_REOPEN_READY`
  - `/orders/list` 当前对账结论 = `READ_ONLY_ROUTE_CONFIRMED_WORKING`
  - `/orders/detail` 当前对账结论 = `MASKED_TRADE_ID_NOT_REUSABLE`
  - `/orders/fund` 当前对账结论 = `MASKED_TRADE_ID_NOT_REUSABLE`
  - `/orders/logistics` 当前对账结论 = `MASKED_TRADE_ID_NOT_REUSABLE`
  - 当前没有发现可证明成立的“纯参数层安全修正”

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
- /integrations/alibaba/wika/data/orders/draft-types
- /integrations/alibaba/wika/reports/operations/minimal-diagnostic
- /integrations/alibaba/wika/reports/products/minimal-diagnostic
- /integrations/alibaba/wika/reports/orders/minimal-diagnostic
- /integrations/alibaba/wika/tools/reply-draft
- /integrations/alibaba/wika/tools/order-draft

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
- alibaba.trade.order.create -> 已真实走到 `/sync + access_token + sha256`，但当前只证明到参数校验层，仍不能证明安全创单边界

## 当前明确不推进
- XD
- mydata / overview / 数据管家
- inquiries / messages / customers 新验证
- order create 新验证
- RFQ
- 本地 `.env` / 本地 callback / 本地 token 旁路
- 真实商品发布
- 真实线上商品修改
- 真实客户沟通
- 平台内回复发送
- 平台内订单创建

## 当前还缺的核心能力
### 任务 1
- 店铺经营指标入口
- 产品表现入口

### 任务 2
- 更完整的经营聚合层
- 店铺经营指标接入后的增强诊断层
- 订单经营汇总里除“趋势”之外的稳定派生能力

### 任务 3
- media 写入的低风险边界证明
- add.draft 的安全草稿边界证明
- add/update 家族的可逆或草稿模式证明

### 任务 4
- customers 详情 / note 读侧原始路由
- inquiries / messages 读侧入口
- 平台内回复与客户沟通闭环
- 外部回复草稿继续向更稳定的人机协同模板扩展

### 任务 5
- 平台内订单草稿 / 交易创建的安全边界证明
- 外部订单草稿向更完整报价单 / 订单包继续扩展
- 人工补单模板与补字段 SOP 持续增强

### 任务 6
- 真实 webhook / email provider 外发
- 把正式通知闭环挂到更多真实 blocker 触发点

## 当前唯一推荐下一步
如果继续，只建议在当前“外部草稿工作流 SOP 层 + 质量评估与回归闸门层”之上继续增强人机协同模板；不要重开 `mydata / overview / self.product` 循环。若任务 2 需要继续推进，优先把订单级经营汇总写成“基于现有交易 API 的部分派生”，而不是误报为新报表入口已打通。

## 当前真实数据结论
- media 可观测：已成立
- media 分组查询通道存在：已成立
- media 分组管理接口可到授权层之后：已成立
- draft 渲染通道存在且与 live product 可区分：已成立
- customers 家族可走 production 认证闭环：已成立
- 当前最小正式通知闭环已成立：已成立
- 当前真实 provider 预接线 + dry-run 已成立：已成立
- 当前真实 provider 最小外发验证前置条件不足：已成立
- 当前总诊断层、产品子诊断、订单子诊断都已成立：已成立
- 当前外部回复草稿与外部订单草稿工作流层都已成立：已成立
- 当前外部草稿工作流的 blocker taxonomy、workflow profile、template version、handoff checklist、manual completion SOP 都已成立：已成立
- 当前 reply/order 已具备面向人工接手的字段级 missing reason：已成立
- 当前 `mydata / overview / self.product` 在当前租户下仍统一 `AUTH_BLOCKED`：已成立
- 当前 `order.list` 能稳定返回真实数据：已成立
- 当前 `order.get / fund.get / logistics.get` 在使用 `order.list` 返回的遮罩 `trade_id` 时统一落到 `PARAMETER_REJECTED`：已成立
- 当前 `mydata` 权限清障包已经可直接用于对外申请：已成立
- 当前订单参数契约对账已明确：
  - `orders/list` 是当前唯一稳定成立的只读订单入口：已成立
  - `detail / fund / logistics` 当前 public chaining 仍未闭合：已成立
- 当前订单级经营汇总只能部分派生：
  - 趋势：已成立（来自 `order.list.create_date`）
  - 正式汇总：未成立
  - 国家结构：未成立
  - 产品贡献：未成立
- 当前仍不能诊断 UV / PV / 曝光 / 点击 / CTR / 来源 / 国家 / 询盘表现：已成立
- 当前只能生成外部草稿，不得误写为平台内已回复或已创单：已成立

## 当前待验证判断
- webhook 或 Resend 在 production 配置完成后，是否能完成低风险真实外发
- customers 详情 / note 是否能在拿到真实 id 后返回真实 JSON
- inquiry / message 是否会出现官方明确的读侧 list/detail 方法
- media / draft 边界证据补齐后，是否才可进入最小真实写入验证
- 后续是否会出现官方明确的 order `precheck / cancel / status / draft` 低风险接口
- 后续是否能在当前官方只读链路里拿到可复用的未遮罩订单 identifier，补齐 detail / fund / logistics 契约
