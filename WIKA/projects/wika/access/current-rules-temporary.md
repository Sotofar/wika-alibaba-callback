# WIKA 当前规则临时版 / 待固化清单

更新时间：2026-04-03

本文档只记录当前已经验证成功的运行规则、仍待确认的规则，以及明确禁止继续使用的旧调用方式。
本文档不存放任何真实密钥、真实 token 或其他敏感值。

## 一、已验证成功规则

### 1. token 运行时与重部署恢复

- 当前 WIKA token 运行时主存储仍是文件：
  - `ALIBABA_WIKA_TOKEN_STORAGE_PATH`
  - 生产当前路径：`/app/data/alibaba/runtime/wika-token.json`
- 现有代码已支持启动时双路径恢复：
  - 优先读取持久化文件
  - 文件不存在时，回退读取 `ALIBABA_WIKA_BOOTSTRAP_REFRESH_TOKEN`
- 自动续期链路已验证有效：
  - callback 写入 token 文件
  - refresh token 自动续期
  - `auth/debug` 可读到 `wika_token_file_exists / wika_token_loaded / wika_has_refresh_token`

### 2. products 主数据与表现数据分工

- `A` 负责产品主数据：
  - 接口：`alibaba.icbu.product.list`
  - 网关：`https://open-api.alibaba.com/sync`
  - 鉴权参数：`access_token`
  - 签名方式：`sha256`
- `B` 负责产品表现数据：
  - 来源：`customerAdviser/prodList`
  - 登录态：AliWorkbench 页面请求
- 当前统一视图的职责边界已固定：
  - `A` 不承担当期表现字段
  - `B` 不承当主数据主来源

### 3. products A/B 匹配规则

- 主匹配规则：
  - `A.id <-> B.product_id`
- 回退别名规则：
  - `A.product_id` 只作为别名，不作为主 join key
- 当前已验证结果：
  - `A` 主数据总量：`533`
  - `B` 表现池：`20`
  - 当前 `20` 个表现产品已全部匹配到 `A`
  - 当前统一覆盖：
    - `matched_count = 20`
    - `official_only_count = 513`
    - `performance_only_count = 0`

### 4. products 官方分页规则

- `A products` 当前必须分页读取，不能只取第一页
- 当前已验证：
  - `page_size = 30`
  - 共 `18` 页
  - `total_item = 533`
- 用于报告和统一视图时，主数据池应按全量分页读取，不应只取第一页快照

### 5. products 字段口径规则

- `business_uv` 保留“商机相关 UV”原始语义
- `business_rate` 保留“商机率”原始语义
- 不得擅自改写成“询盘数 / 询盘率”
- `order_uv` 表示订单相关 UV，不等同于订单数

### 6. orders 当前已验证规则

- `orders summary + trends` 已验证来自页面请求：
  - `vip/trade/getTradeSummary`
  - `vip/trade/getTradeTrends`
- `orders list` 已验证支持分页：
  - 当前已覆盖 `120` 条订单
  - `page_size = 50`
  - `pages_fetched = 3`
  - `fully_covered = true`
- 订单国家结构与产品贡献已从“第一页快照”提升到“分页订单池统计”

### 7. orders 深层口径规则

- 当前稳定可读：
  - `order_status_name / order_status_display_name`
  - `shipping_type_code / shipping_type_label`
  - `available_action_names`
  - 金额拆分：
    - `total_amount`
    - `advance_amount`
    - `shipping_fee_amount`
    - `item_subtotal_amount`
    - `shipping_fee_before_discount_amount`
    - `subtotal_amount`
    - `total_with_tax_amount`
    - `shipping_assurance_fee_amount`
    - `product_total_amount`
- 当前金额口径说明：
  - `total_amount` 为订单页展示总金额
  - `item_subtotal_amount` 为商品小计
  - `shipping_fee_amount` 为运费金额
  - `product_total_amount` 当前可用于产品贡献辅助，不应直接当成最终结算金额

### 8. overview 市场维度规则

- 当前已验证市场维度来源：
  - `customerAdviser/customerProfile`
- 已可进入管理简报：
  - 访客国家分布
  - 重点市场
  - 市场结构变化
  - 市场集中度风险

## 二、待确认规则

### 1. token 重部署稳定性

- 当前代码虽已支持 `bootstrap refresh token` 恢复，但是否已在生产变量中长期配置，仍需单独确认
- 如果生产没有持久卷，也没有 `ALIBABA_WIKA_BOOTSTRAP_REFRESH_TOKEN`，重部署后 token 文件仍有丢失风险

### 2. overview 快照周期口径

- `overviewSnapshot` 当前更接近“当前快照”
- 不能直接当成完整 `7d / 30d` 聚合汇总
- 需要后续继续确认 `getShopSummary` 的时间窗真实语义

### 3. visitor extraInfo 语义

- `customerProfile.extraInfo` 已读到原始值与序列
- 但时间粒度与业务语义仍需进一步确认
- 当前可保留原始值，不应直接写成已验证趋势字段

### 4. orders 深层履约/异常口径

- 当前订单列表页尚未验证到：
  - 发货状态字段
  - 退款原因字段
  - 异常原因字段
- `shipping_type` 仅代表发货方式，不代表发货状态
- `available_action_names` 仅代表页面动作入口，不代表异常原因

### 5. orders 金额精确口径

- 当前产品贡献金额仍基于订单列表中商品行的估算值
- 不能直接当成最终成交结算金额
- 如需更精确金额口径，后续需要订单详情层或交易明细层验证

## 三、明确禁止的旧错误调用方式

### 1. 禁止继续使用旧版 A products 调用方式

- 禁止：
  - `https://eco.taobao.com/router/rest`
  - `session`
  - `hmac/md5` 旧 TOP 组合
- 当前 WIKA 已验证成功的 `A products` 只允许：
  - `https://open-api.alibaba.com/sync`
  - `access_token`
  - `sha256`

### 2. 禁止把 B 表现字段擅自改写口径

- 禁止把：
  - `business_uv` 改写成“询盘数”
  - `business_rate` 改写成“询盘率”
  - `order_uv` 改写成“订单数”

### 3. 禁止混用 buyer_country 与 shipping_country

- `buyer_country` 在部分订单中为空
- `shipping_country` 代表发货国家/地区
- 两者必须分开展示，不能混成统一“国家”字段

### 4. 禁止把 orders summary 当成完整周期聚合结论

- 当前 `trade summary` 更接近当前快照
- 不得直接写成完整 `7d / 30d` 汇总结论

### 5. 禁止把页面可见字段写成已接入

- 只要没有真实 reader 返回，就必须标记为：
  - `未接入`
  - `待验证`
  - `页面可见但未实读`

## 四、进入最终 AGENTS.md 之前的准入条件

以下事项至少完成后，才适合把当前规则固化进最终版 AGENTS：

1. 生产重部署稳定性已验证
   - 明确使用持久卷或已确认 `ALIBABA_WIKA_BOOTSTRAP_REFRESH_TOKEN`
2. products A/B 统一视图已连续回归稳定
   - `A` 全量分页主数据
   - `B` 重点表现池
   - 匹配率维持可接受状态
3. orders 深层口径边界已固定
   - 明确哪些字段只是“状态/方式/动作”
   - 明确哪些字段还不是“原因/最终金额”
4. overview 市场字段口径已复核
   - 至少确认 `extraInfo` 是否能作为稳定趋势输入
