# WIKA 运营示范报告摘要

生成时间：2026-04-18T23:14:19.252Z

## 给管理层的 5 句话

- 当前整体问题不在“没有数据”，而在“已有数据没有被收敛成更强的经营动作”；因此本报告先讲问题和动作，不再先堆字段。
- 店铺层仍能稳定读取 visitor、imps、clk、clk_rate、fb、reply，说明整体经营信号可读，但来源和国家维度仍不可见。
- 产品层当前最明确的短板是内容完整度和关键词准备：missing_description_count=5，missing_keywords_count=8，low_score_count=1。
- 订单层已经能给出 formal_summary、product_contribution、trend_signal，但 country_structure 仍 unavailable，因此只能做保守订单判断。
- task3 / task4 / task5 当前已经形成工作台、预览和外部草稿消费层，但最后一跳仍需人工接手，不是平台内闭环。

## 最重要的 3 个发现

- 产品层最明确的短板是内容完整度和关键词准备，而不是单纯没有商品
- 店铺层当前没有出现“整体流量塌陷”的直接证据
- 订单层已经能做 conservative summary，但国家结构仍不可见

## 最应该先做的 3 个动作

- 先补 task3 所需的 schema 必填字段、分类属性和媒体素材
- 把 reply-preview 暴露出的 final_quote、lead_time、mockup_assets 缺口变成销售跟进清单
- 针对高优先商品先做详情、关键词和主图补强

## 当前关键盲区

- 店铺来源与国家维度：当前没有 `traffic_source`、`country_source`、`quick_reply_rate`，因此不能做渠道归因、国家归因和完整回复效率判断。
- 产品来源与完整周期变化：当前没有 `access_source`、`inquiry_source`、`country_source`、`period_over_period_change`，因此产品层来源分析和完整周期判断仍受限。
- 订单国家结构：`country_structure` 仍 unavailable，因此订单层只能做 conservative summary，不能做国家结构判断。
- 广告与页面行为样本：广告和页面层已经有输入口，但若没有真实导出样本或人工盘点表，建议只能停在导入就绪度或保守建议层。
- 平台内执行闭环：task3/4/5 仍没有低风险写侧边界证明，当前所有结论都只能停留在消费层、准备层和人工接手层。

## 当前路由健康提示

- 本次 live 读取中，full_success route 共 19 条，degraded route 共 2 条，failed route 共 1 条。
- 降级参与的 route：/integrations/alibaba/wika/reports/action-center（time_budget_exceeded, store_diagnostic）、/integrations/alibaba/wika/workbench/task-workbench（time_budget_exceeded, task5_summary）。
- 失败 route：/integrations/alibaba/wika/reports/operator-console（timeout）。
- 核心事实优先回退到 management-summary、minimal-diagnostic、comparison、各 task workbench 等底层稳定 route。

## 当前边界

- official confirmed：店铺级 official fields：visitor、imps、clk、clk_rate、fb、reply；产品级 official fields：click、impression、visitor、fb、order、bookmark、compare、share、keyword_effects；订单级官方原始只读基础来自 orders/list、orders/detail、orders/fund、orders/logistics
- derived：store / product / order comparison；formal_summary / product_contribution / trend_signal；business-cockpit / action-center / operator-console；task3 / task4 / task5 workbench / preview / draft package；广告与页面输入层上的诊断建议
- unavailable：traffic_source；country_source；quick_reply_rate；access_source；inquiry_source；period_over_period_change；country_structure
- degraded route 参与情况：本次检测到 degraded route：/integrations/alibaba/wika/reports/action-center、/integrations/alibaba/wika/workbench/task-workbench；这些 route 只用于辅助排序或 readiness 提示，核心事实回退到底层稳定 route。
- 当前不是完整经营驾驶舱。
- task3 / task4 / task5 当前仍不是平台内闭环。
- task6 excluded。
- no write action attempted。

## 自评分

- 总分：39/40
- 是否通过：通过
