# WIKA 订单入口候选清单

更新时间：2026-04-05

## 目标

本清单只面向任务 5：`平台内订单入口边界验证`。  
当前不追求真实下单，只判断：

1. 官方明确存在哪些订单入口方法；
2. 哪些方法适合当前 production 主线做低风险边界验证；
3. 哪些方法只能停在参数 / 授权 / 风险收口层；
4. 当前是否只能先形成“外部订单草稿”。

## 一、官方明确存在的相关方法

根据 ICBU－交易官方目录，当前与订单起草最直接相关的方法包括：

1. `alibaba.trade.order.create`
   - 文档描述：`国际站信保下单`
   - 当前判断：正式创单主入口，高风险
2. `alibaba.seller.trade.query.drafttype`
   - 文档描述：`查询卖家订单起草类型权限`
   - 当前判断：低风险只读权限探针
3. `alibaba.trade.order.modify`
   - 文档描述：`国际站信保订单修改`
   - 当前判断：真实订单修改写侧，不属于本阶段低风险候选
4. `alibaba.intention.order.save`
   - 文档描述：`意向单创建接口`
   - 当前判断：仍是创建类写侧，不属于本阶段低风险候选

## 二、同家族低风险候选筛查结论

本阶段只允许沿着以下关键词继续找同家族显式方法：

- `draft`
- `precheck`
- `query`
- `status`
- `cancel`
- `quote / order draft`

当前公开官方文档中，真正满足“方法名明确存在且与订单起草边界直接相关”的低风险候选，只有：

- `alibaba.seller.trade.query.drafttype`

当前没有再识别到以下类型的明确官方方法名：

- `alibaba.trade.order.precheck`
- `alibaba.trade.order.cancel`
- `alibaba.trade.order.query`
- `alibaba.trade.order.status`
- 明确的 `order draft` 查询 / 删除 / 管理接口

结论：

- 当前可验证的正式主线候选，只有：
  - `alibaba.trade.order.create`
  - `alibaba.seller.trade.query.drafttype`
- 其他同家族低风险候选：`当前未识别到可用入口`

## 三、create 入口参数层级结论

### 1. 官方文档口径

- 文档明确说明：`alibaba.trade.order.create` 是 `国际站信保下单`
- 当前阶段只把它视为：
  - 平台内正式创单入口
  - 不是默认安全草稿入口

### 2. 真实 production 边界验证结果

在当前 WIKA production 认证闭环下，使用 `/sync + access_token + sha256` 做了两轮明显不完整 payload 验证：

#### 尝试 1

- 请求：`param_order_create = {}`
- 返回：`MissingParameter`
- 缺失字段：`product_list`

#### 尝试 2

- 请求：`param_order_create = { product_list: [] }`
- 返回：`MissingParameter`
- 缺失字段：`currency`

### 3. 当前结论

- `alibaba.trade.order.create` 已真实走到：
  - `https://open-api.alibaba.com/sync`
  - `access_token`
  - `sha256`
- 当前分类：
  - `业务参数错误（说明已过授权层）`
- 这说明：
  - 当前 production 闭环能真正到达 create 的业务参数层
  - 但这不等于存在安全草稿模式
  - 更不等于可以继续真实创单验证

## 四、drafttype 入口结论

### 1. 官方文档口径

- `alibaba.seller.trade.query.drafttype`
- 文档响应字段：
  - `types`
- 语义：
  - 查询卖家支持的订单起草类型权限

### 2. 真实 production 结果

- 已真实走到：
  - `https://open-api.alibaba.com/sync`
  - `access_token`
  - `sha256`
- 当前分类：
  - `真实 JSON 样本数据`
- 当前真实样本：
  - `types = ["TA"]`

### 3. 当前结论

- 这是当前任务 5 中最稳的低风险只读候选
- 它可以进入最小正式原始路由候选池
- 并且已适合路由化为：
  - `/integrations/alibaba/wika/data/orders/draft-types`

## 五、本阶段收口

### 当前已成立

- `alibaba.trade.order.create`
  - 已证明能到业务参数层
  - 但仍是高风险真实创单入口
- `alibaba.seller.trade.query.drafttype`
  - 已证明能返回真实 JSON
  - 适合做最小只读正式路由

### 当前未成立

- 平台内订单草稿已安全可用
- 平台内订单创建可在无副作用前提下继续推进
- 当前存在官方明确的 `precheck / cancel / status / query draft` 替代入口

## 一句话结论

当前任务 5 的最稳结论是：

- `drafttype` 已可作为正式只读权限探针入口复用；
- `order.create` 只证明了“已过授权层并进入参数门槛”，当前仍然不能进入真实创单验证；
- 因此当前阶段只能做 `外部订单草稿`，不能误写成“平台内订单已起草成功”。
