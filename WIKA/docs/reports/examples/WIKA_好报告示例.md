# WIKA 好报告示例

## 执行摘要

- 当前整体问题不在“有没有数据”，而在“高流量商品没有稳定转成高质量承接与后续动作”。
- 当前最重要的三个发现是：店铺层活跃度仍可读、产品层内容准备不足、订单层可以做 conservative summary 但国家结构不可见。
- 当前最严重的三个问题是：高价值商品内容完整度不足、来源与国家维度缺失、task3/4/5 仍停在外部草稿与人工接力层。
- 当前最值得先做的三个动作是：先补 task3 所需字段与媒体、再补高优先商品详情与关键词、最后把 reply/order 缺口变成人工跟进清单。
- 当前报告适合做经营判断和动作排序，不适合冒充平台内自动发布、自动回复或自动创单。

## 核心发现

### 发现 1
- 发现：店铺层活跃度仍可读，当前没有证据支持“整体流量塌陷”。
- 证据：`visitor / imps / clk / clk_rate / fb / reply` 仍可稳定读取，comparison 仍可输出可比窗口变化。
- 影响：当前不应先把重心放在“流量救火”，而应先处理承接链路。

### 发现 2
- 发现：产品层最明确的问题是内容完整度和关键词准备，而不是单纯商品数量不足。
- 证据：`missing_description_count`、`missing_keywords_count`、`low_score_count` 仍明显存在。
- 影响：如果不先补内容质量，流量改善也难以稳定转成询盘或订单。

### 发现 3
- 发现：订单层已经能输出正式汇总和主力商品贡献，但国家结构仍不可见。
- 证据：`formal_summary`、`product_contribution`、`trend_signal` 已成立，`country_structure` 仍 unavailable。
- 影响：可以做履约与主力商品判断，但不能做国家市场判断。

## 关键问题

### 问题 1
- 问题：高价值商品内容准备不充分。
- 为什么重要：它直接影响点击后的承接、询盘质量和 task3 输入质量。
- 如果不处理会怎样：店铺层流量信号再好，也可能继续停在“有点击、没转化”。

### 问题 2
- 问题：来源与国家维度仍不可见。
- 为什么重要：这会限制渠道归因、国家判断和资源分配。
- 如果不处理会怎样：很多判断只能停在“整体变好/变坏”，不能进入“为什么变好/变坏”。

### 问题 3
- 问题：task3/4/5 仍不是平台内闭环。
- 为什么重要：WIKA 只能把准备工作、预览和交接包做到很强，最后一步仍需人工执行。
- 如果不处理会怎样：业务方容易误判系统已经能自动执行。

## 优先行动

### P1：立即做
- 做什么：先补 task3 所需的 schema 必填字段、分类属性和媒体素材。
- 为什么：这是 task3、task4、task5 三层输入质量的共同源头。
- 预期收益：提高商品准备质量，并减少 reply/order 草稿缺字段。
- 执行人：运营负责人 + 商品维护同事。
- WIKA 当前能支持到什么程度：已能输出缺失字段、风险项和推荐下一步。
- 是否需要人工确认：需要。字段补全和媒体选择必须人工确认。

### P2：本周做
- 做什么：针对高优先商品补详情、关键词和主图。
- 为什么：这是当前最可能直接改善点击后承接质量的动作。
- 预期收益：减少“有流量、没转化”的情况。
- 执行人：产品运营。
- WIKA 当前能支持到什么程度：已能输出商品缺口、内容优化建议和优先级。
- 是否需要人工确认：需要。最终文案、图片和关键词仍需人工审核。

### P3：后续跟进
- 做什么：把 reply-preview 和 order-preview 暴露出的缺口变成销售 / 跟单跟进清单。
- 为什么：当前瓶颈不在草稿生成，而在报价、交期、买家信息和条款确认。
- 预期收益：减少交接反复，提高外部草稿的落地效率。
- 执行人：销售 / 跟单。
- WIKA 当前能支持到什么程度：已能输出 preview、draft package 和 handoff pack。
- 是否需要人工确认：必须。所有商业条款与客户信息都需要人工确认。

## 数据盲区

- `traffic_source`、`country_source`、`quick_reply_rate` 仍不可见，因此不能做渠道和国家层结论。
- `access_source`、`inquiry_source`、`period_over_period_change` 仍不可见，因此产品层来源分析和完整周期判断仍受限。
- `country_structure` 仍 unavailable，因此订单层国家结构不能下结论。
- 若高层 route 为 degraded，只能把它当辅助排序输入，不能当核心事实来源。

## 边界声明

- official confirmed：店铺级 `visitor / imps / clk / clk_rate / fb / reply`；产品级 `click / impression / visitor / fb / order / bookmark / compare / share / keyword_effects`。
- derived：comparison、formal_summary、product_contribution、trend_signal、business-cockpit、action-center、operator-console、task3/4/5 workbench 与 preview。
- unavailable：来源、国家和部分周期变化维度仍缺。
- degraded route 参与情况：若 `action-center` 或 `operator-console` 为 degraded，只能辅助排序，不能替代底层 summary / diagnostic / comparison。
- 当前不是完整经营驾驶舱。
- task3 / task4 / task5 当前仍不是平台内闭环。
