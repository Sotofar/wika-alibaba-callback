# WIKA_执行计划

## 当前阶段
阶段 7：任务 4 的读侧入口筛查与最小原始路由候选验证

## 本阶段唯一目标
只验证官方明确存在的 `customers / inquiries / messages` 读侧接口，判断是否能形成最小正式原始路由。

## 起始基线
- 只推进 `WIKA`
- 一律复用 Railway production 认证闭环与 `/sync + access_token + sha256`
- 既有 WIKA 读侧原始路由已经稳定上线并可复用
- `mydata / overview / self.product` 当前不再作为主线推进
- 任务 3 当前已拿到足够的 schema/media/draft 读侧证据，但写侧边界仍不足
- 当前最优下一步切换为任务 4 的只读候选验证
- 当前阶段已完成的实证结果：
  - `customers` 家族都已真实走到 `/sync + access_token + sha256`
  - `customers/list` 已形成最小正式只读路由，但当前仍只属于权限探针型读路由
  - inquiry / message 读侧方法名当前未在官方文档中识别到明确 list/detail 入口

## 候选顺序
### 第一梯队：customers 家族
1. `alibaba.seller.customer.batch.get`
2. `alibaba.seller.customer.get`
3. `alibaba.seller.customer.note.query`
4. `alibaba.seller.customer.note.get`

### 第二梯队：inquiries / messages 读侧
1. 只有在官方文档中明确出现的方法名，才允许进入验证
2. 若没有明确方法名，则收口为：`当前未识别到可用入口`

注意：
- 不得臆造方法名
- 只有在官方文档中明确出现的方法名，才允许进入验证

## 本阶段明确排除
- XD
- mydata / overview / 数据管家
- order create
- RFQ
- 本地旁路
- 平台内回复
- `alibaba.inquiry.cards.send`
- 任何 send / reply / write / create 类接口
- 真实商品发布
- 真实线上商品修改
- 真实客户沟通
- 自动进入下一阶段

## 执行规则
1. 先做 `customers` 家族，再做官方文档中明确存在的 `inquiries / messages` 读侧方法
2. 每个新 API 最多 3 轮有差异的尝试
3. 只要达到“真实 JSON”或“业务参数错误”，就允许进入最小正式原始路由候选池
4. 只有证据充分且属于低风险读侧时，才允许新增正式原始路由
5. 不得为了凑结果伪造 `customer_id / note_id / inquiry_id / message_id`
6. 若官方文档没有明确 inquiry/message 读侧方法名，必须明确收口，不得含糊

## 完成标准
- `customers` 家族完成真实生产分类
- 若官方文档明确存在 `inquiry / message` 读侧方法，则这些方法也完成真实生产分类；若不存在，则明确收口
- 若其中任一证据充分，则至少有 1 条进入最小正式原始路由并完成线上验收
- 已更新基线、计划、缺口矩阵、复用清单、候选池、自治推进日志
- 阶段结束后停止，不自动进入下一阶段

## 停止条件
- 本阶段候选全部完成真实分类
- 或 inquiry/message 当前没有明确官方读侧入口
- 或继续推进会落入写动作、高风险旧体系或非官方方法名猜测

## 当前阶段收口
- `alibaba.seller.customer.batch.get`
  - 缺参时：业务参数错误（说明已过授权层）
  - 使用真实窗口参数时：权限错误
- `alibaba.seller.customer.get`
  - 当前为业务参数错误，缺少 `buyer_member_seq`
- `alibaba.seller.customer.note.query`
  - 当前为业务参数错误，缺少 `note_id`
- `alibaba.seller.customer.note.get`
  - 当前为业务参数错误，缺少 `page_num / page_size / customer_id`
- inquiry / message
  - 当前官方文档里没有明确 list/detail 读侧方法名，收口为：`当前未识别到可用入口`
- 已新增最小只读路由：
  - `/integrations/alibaba/wika/data/customers/list`
  - 注意：该路由当前只证明 customers list 可进入 production 认证闭环与权限分型，不等于客户数据已可稳定读取

## 交付物
- docs/framework/WIKA_可观测可回滚证据验证.md
- docs/framework/WIKA_项目基线.md
- docs/framework/WIKA_执行计划.md
- docs/framework/WIKA_面向6项任务_API缺口矩阵.md
- docs/framework/WIKA_已上线能力复用清单.md
- docs/framework/WIKA_下一批必须验证的API候选池.md
- docs/framework/WIKA_自治推进日志.md

## 固定汇报结构
- 当前阶段
- 本轮目标
- 已复用的已上线能力
- 本轮新验证 / 新开发 / 新沉淀的内容
- 本轮明确排除的 API / 能力
- 已完成闸门
- 当前唯一阻塞点
- WIKA 是否遇到过
- WIKA 的解决方式是否可复用
- 下一步唯一动作
- 明确未完成项
- 当前还缺哪些经营关键数据
- 当前离“完成 6 项任务”还差哪些能力缺口
- 当前诊断里哪些是真实数据结论，哪些只是待验证判断
