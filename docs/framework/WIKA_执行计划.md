# WIKA_执行计划

## 当前阶段
阶段 19：ICBU 商品类目官方文档归类与候选池收口

## 本阶段唯一目标
不新增任何 Alibaba API 验证，只把已经完整读取过的 `ICBU－商品 (cid=20966)` 左侧栏 47 个官方页面收口成：

- 一份可复用的官方文档归类文档
- 一组“文档已确认存在，但尚未生产验证”的候选清单
- 一组明确的负结论：
  - 当前没有读到 draft 查询 / 删除 / 管理接口
  - 当前没有读到 media 删除 / 清理接口
  - 这批商品类目文档不能直接解决 `mydata` 权限阻塞
  - 这批商品类目文档不能直接解决订单 detail / fund / logistics 契约

## 起始基线
- 当前实际起始仓库状态以本阶段开始时的 `HEAD` 为准：`2b202e5`
- 本阶段开始 checkpoint：`e125612`
- 当前只推进 `WIKA`
- 一律复用 Railway production 闭环与 `/sync + access_token + sha256`
- 当前禁止任何本地 `.env` / callback / token 旁路
- 当前禁止任何平台内写动作
- 阶段 18 已收口：
  - `mydata` 5 个方法 -> `AUTH_BLOCKED` + `ACCESS_REOPEN_READY`
  - `/orders/list` -> `READ_ONLY_ROUTE_CONFIRMED_WORKING`
  - `/orders/detail` -> `MASKED_TRADE_ID_NOT_REUSABLE`
  - `/orders/fund` -> `MASKED_TRADE_ID_NOT_REUSABLE`
  - `/orders/logistics` -> `MASKED_TRADE_ID_NOT_REUSABLE`
- 当前已完成 `ICBU－商品 (cid=20966)` 全类目 47 页官方文档阅读

## 本阶段分解
### A. 全量文档阅读结果归类
- 按 47 个方法整理成 6 个桶：
  - 类目 / 属性 / 预测 / 映射
  - 商品读取 / 质量 / ID / 库存 / 权限
  - schema / draft / 写侧
  - 分组 / 主题 / 定招
  - 图片 / 素材
  - 其他

### B. 直接有文档价值的关键契约
- 固定以下高价值结论：
  - `alibaba.icbu.product.schema.render.draft` 的 `product_id` 是“草稿商品明文id”
  - `alibaba.icbu.product.schema.add.draft` 返回“商品草稿明文id”
  - `alibaba.icbu.product.type.available.get` 是低风险 precheck 候选
  - `alibaba.icbu.product.id.encrypt / decrypt` 说明商品侧存在 ID 契约层

### C. 关键负结论收口
- 明确写清：
  - 当前没有读到 draft query / delete / manage 公开接口
  - 当前没有读到 media delete / cleanup 公开接口
  - 当前商品类目文档不能解决 `mydata` 权限阻塞
  - 当前商品类目文档不能解决订单 detail / fund / logistics 契约

### D. 候选池与缺口矩阵同步
- 仅把“文档已确认存在，但未验证”的方法放入候选池
- 不把它们误写成：
  - 已打通
  - 已形成正式路由
  - 已形成平台内闭环

## 本阶段明确排除
- XD
- 任何新的 Alibaba API 验证
- inquiries / messages / customers
- RFQ
- order create
- photobank / add.draft / 任何写侧边界继续循环
- 本地旁路
- 真实商品发布
- 真实线上商品修改
- 真实客户沟通
- 真实通知外发
- 自动进入下一阶段

## 推进规则
1. 只允许做官方文档归类与候选池收口
2. 不新增 undocumented method，不穷举新接口名
3. 不直连 `router/rest`
4. 不做任何 production API 实测
5. 不把“文档存在”写成“已打通”
6. 不把“文档里有 product_id”写成“安全 draft 链路已成立”

## 分类标准
### 文档归类候选
- `OFFICIAL_DOC_FOUND_NOT_VALIDATED`
- `HIGH_RISK_WRITE_SIDE_DOC_FOUND`
- `NO_EXPLICIT_PUBLIC_ENTRY_FOUND`
- `DOC_CLARIFIES_CONTRACT_ONLY`

## 当前收口结果
- 当前已把 `ICBU－商品 (cid=20966)` 左侧栏 47 页完整归类
- 当前最有价值的文档级结论已固定：
  - `schema.render.draft` 只适用于草稿商品编辑，且依赖“草稿商品明文id”
  - `schema.add.draft` 文档上明确返回“商品草稿明文id”
  - `product.type.available.get` 值得保留为以后可能的低风险 precheck 候选
  - `product.id.encrypt / decrypt` 说明商品侧存在单独的 ID 契约层
- 当前关键负结论已固定：
  - 没有读到 draft query / delete / manage 公开接口
  - 没有读到 media delete / cleanup 公开接口
  - 这批商品类目文档不能解决 `mydata` 的 `AUTH_BLOCKED`
  - 这批商品类目文档不能解决订单 detail / fund / logistics 契约

## 当前预期交付
- `docs/framework/WIKA_ICBU商品类目官方文档归类.md`
- `docs/framework/WIKA_项目基线.md`
- `docs/framework/WIKA_执行计划.md`
- `docs/framework/WIKA_面向6项任务_API缺口矩阵.md`
- `docs/framework/WIKA_已上线能力复用清单.md`
- `docs/framework/WIKA_下一批必须验证的API候选池.md`
- `docs/framework/WIKA_自治推进日志.md`

## 完成标准
- 已形成 `ICBU－商品` 47 页官方文档归类文档
- 已把文档已确认但未验证的方法同步进候选池
- 已把关键负结论同步进基线、缺口矩阵与推进日志
- 已明确写清本轮没有做任何新的 Alibaba API 验证
- 本阶段完成后停止，不自动进入下一阶段

## 停止条件
- 文档归类已完成
- 候选池和基线已同步
- 或继续推进只会回到新 API 验证 / 写动作方向

## 交付物
- `docs/framework/WIKA_ICBU商品类目官方文档归类.md`
- `docs/framework/WIKA_项目基线.md`
- `docs/framework/WIKA_执行计划.md`
- `docs/framework/WIKA_面向6项任务_API缺口矩阵.md`
- `docs/framework/WIKA_已上线能力复用清单.md`
- `docs/framework/WIKA_下一批必须验证的API候选池.md`
- `docs/framework/WIKA_自治推进日志.md`

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
