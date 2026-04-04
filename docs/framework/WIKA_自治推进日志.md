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

### 阶段 6：任务 3 的管理 / 清理 / 回滚证据补齐

- 起始 checkpoint：`2c2b1f8`
- 本阶段目标：
  - 继续只验证官方明确存在的 media 管理 / 清理接口
  - 继续只验证官方明确存在的 draft 查询 / 删除 / 管理接口
  - 不进入真实上传、真实 draft 创建或真实发布
- media 侧真实生产分类结果：
  - `alibaba.icbu.photobank.group.operate`
    - 已真实走到 `/sync + access_token + sha256`
    - 当前真实分类：`业务参数错误（说明已过授权层）`
    - 当前收口：`当前仍无法证明可隔离 / 可清理 / 可回滚边界，因此不继续实写验证`
- draft 侧真实收口结果：
  - 当前公开官方文档中，除已验证的 `alibaba.icbu.product.schema.render.draft` 外，没有再识别到明确的 draft 查询 / 删除 / 管理接口
  - `alibaba.icbu.product.schema.add.draft` 虽在官方变动说明中被提及，但它属于“草稿发布成正式”的写侧，不纳入本阶段的 query/delete/manage 主线
- 本阶段新增 / 更新沉淀：
  - `AGENTS.md`
  - `docs/framework/WIKA_项目基线.md`
  - `docs/framework/WIKA_执行计划.md`
  - `docs/framework/WIKA_可观测可回滚证据验证.md`
  - `docs/framework/WIKA_低风险写侧边界验证.md`
  - `docs/framework/WIKA_产品安全草稿链路说明.md`
  - `docs/framework/WIKA_产品草稿链路样例.json`
  - `docs/framework/WIKA_面向6项任务_API缺口矩阵.md`
  - `docs/framework/WIKA_已上线能力复用清单.md`
  - `docs/framework/WIKA_下一批必须验证的API候选池.md`
  - `scripts/validate-wika-write-phase6.js`
  - `shared/data/modules/alibaba-write-guardrails.js`
- 阶段收口：
  - media 侧新增了“分组管理接口可到授权层之后”的证据
  - draft 侧没有新增的 query/delete/manage 官方入口
- 当前仍不具备进入“最小真实写入验证”的前置条件
- 本阶段不新增正式原始路由
- 结束 checkpoint：`53ea9ca`

## 2026-04-05

### 阶段 7：任务 4 的读侧入口筛查与最小原始路由候选验证

- 起始 checkpoint：`a742cca`
- 本阶段只做两件事：
  - 先验证 `customers` 家族在当前 production 闭环下是否能形成最小正式原始路由候选
  - 只有在官方文档明确出现时，才判断 inquiry / message 的读侧方法是否值得进入验证
- customers 家族真实生产分类结果：
  - `alibaba.seller.customer.batch.get`
    - 已真实走到 `/sync + access_token + sha256`
    - 缺参时：`业务参数错误（说明已过授权层）`
    - 使用真实窗口参数时：`权限错误`
  - `alibaba.seller.customer.get`
    - 已真实走到 `/sync + access_token + sha256`
    - 当前：`业务参数错误（说明已过授权层）`
    - 缺少参数：`buyer_member_seq`
  - `alibaba.seller.customer.note.query`
    - 已真实走到 `/sync + access_token + sha256`
    - 当前：`业务参数错误（说明已过授权层）`
    - 缺少参数：`note_id`
  - `alibaba.seller.customer.note.get`
    - 已真实走到 `/sync + access_token + sha256`
    - 当前：`业务参数错误（说明已过授权层）`
    - 缺少参数：`page_num / page_size / customer_id`
- inquiry / message 读侧收口：
  - 当前官方文档里没有识别到明确的 list/detail 读侧方法名
  - 已明确排除 `alibaba.inquiry.cards.send` 及一切 send/reply/write/create 方法
- 新增正式只读路由：
  - `/integrations/alibaba/wika/data/customers/list`
- 阶段收口：
  - customers 家族已经证明可进入 current production 认证闭环
  - `customers/list` 已作为权限探针型最小只读路由上线
  - 当前不能误写成 customers 已稳定可读，更不能误写成 inquiry/message 已打通
  - 若继续任务 4，只应在“拿到真实 id”或“官方文档出现明确 inquiry/message 读侧方法”这两种条件下继续前进
- 线上验收：
  - `/integrations/alibaba/wika/data/customers/list` 缺参 -> `400 + parameter_error`
  - `/integrations/alibaba/wika/data/customers/list?customer_id_begin=0&page_size=1&start_time=...&end_time=...&last_sync_end_time=...` -> `502 + permission_error`
- 结束 checkpoint：`6429e86`
- push：`origin/main` 成功

### 阶段 8：任务 6 的正式通知闭环

- 起始 checkpoint：`5886557`
- 本阶段目标：
  - 先盘点仓库与 production 变量名里是否已有可复用通知链路
  - 若无，则落地 provider-agnostic notifier + outbox fallback
  - 用至少 2 个真实阻塞场景验证“触发 -> 生成 -> 分发或落盘”的完整链路
- 通知能力盘点结论：
  - 当前仓库没有现成邮件 / webhook 依赖
  - `.env.example` 原先没有通知配置约定
  - 通过 Railway GraphQL token 读取 production 变量名后，没有发现现成通知 provider 痕迹
  - 最终收口：`当前无正式通知依赖，需先落地 provider-agnostic 通知模块 + fallback`
- 新增能力：
  - `shared/data/modules/wika-alerts.js`
  - `shared/data/modules/wika-notifier.js`
  - `scripts/validate-wika-notification-phase8.js`
  - `docs/framework/WIKA_通知能力盘点.md`
  - `docs/framework/WIKA_正式通知闭环说明.md`
  - `docs/framework/WIKA_正式通知样例.json`
- 最小闭环测试结果：
  - 权限阻塞场景：
    - `alibaba.mydata.overview.indicator.basic.get`
    - 成功生成结构化告警，并落盘到 `data/alerts/outbox`
  - 无官方明确入口场景：
    - `inquiries / messages`
    - 成功生成结构化告警，并落盘到 `data/alerts/outbox`
  - 当前 notifier 模式：
    - `outbox`
  - 当前闭环状态：
    - 最小正式通知闭环已成立
    - 真实邮件 / webhook 外发仍未接通
- 阶段收口：
  - 当前不再停留在“只有 json 样例”的状态
  - 当前已经具备 provider-agnostic 正式通知模块，以及在无 provider 时的可审计 fallback
  - 当前不能误写成“邮件已发出”或“外部通知已送达”
- 结束 checkpoint：`1abe8f8`
- push：`origin/main` 成功

