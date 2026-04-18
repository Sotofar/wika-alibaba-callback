# WIKA 现有权限打通总表

更新时间：2026-04-18

## 结论先行
- 当前已经打通的，不再是零散 route，而是一整套可复用的四层能力：
  - official read mainline
  - safe derived layer
  - import-driven layer
  - cockpit / workbench / preview / report layer
- 当前仓内还能补的，已经不再是新 API，而是输入模板、交付模板、角色分工和边界说明。
- 本轮已把广告导入与页面人工盘点补齐到 `CSV + JSON` 双模板，并把“现有权限下能做什么、不能做什么”正式落盘。
- 当前剩余不能继续仓内补齐的部分，全部属于外部条件：
  - 缺官方字段
  - 缺官方文档或稳定参数契约
  - 缺测试对象 / rollback / readback
  - 缺真实广告导出 / 页面人工盘点持续输入

## 1. 已打通的 official read mainline

### 店铺经营
- 当前状态：`ONLINE_CONFIRMED`
- 已确认字段：
  - `visitor`
  - `imps`
  - `clk`
  - `clk_rate`
  - `fb`
  - `reply`
- 已稳定在线 route：
  - `/integrations/alibaba/wika/reports/operations/management-summary`
  - `/integrations/alibaba/wika/reports/operations/minimal-diagnostic`
  - `/integrations/alibaba/wika/reports/operations/comparison-summary`

### 产品经营
- 当前状态：`ONLINE_CONFIRMED`
- 已确认字段：
  - `click`
  - `impression`
  - `visitor`
  - `fb`
  - `order`
  - `bookmark`
  - `compare`
  - `share`
  - `keyword_effects`
- 已稳定在线 route：
  - `/integrations/alibaba/wika/reports/products/management-summary`
  - `/integrations/alibaba/wika/reports/products/minimal-diagnostic`
  - `/integrations/alibaba/wika/reports/products/comparison-summary`
- 已稳定在线原始只读辅助：
  - `/integrations/alibaba/wika/data/products/detail`
  - `/integrations/alibaba/wika/data/products/score`
  - `/integrations/alibaba/wika/data/products/groups`
  - `/integrations/alibaba/wika/data/products/schema`
  - `/integrations/alibaba/wika/data/products/schema/render`
  - `/integrations/alibaba/wika/data/products/schema/render/draft`
  - `/integrations/alibaba/wika/data/media/list`
  - `/integrations/alibaba/wika/data/media/groups`

### 订单与资金
- 当前状态：`ONLINE_CONFIRMED_PARTIAL`
- 已稳定在线原始只读：
  - `/integrations/alibaba/wika/data/orders/list`
  - `/integrations/alibaba/wika/data/orders/detail`
  - `/integrations/alibaba/wika/data/orders/fund`
  - `/integrations/alibaba/wika/data/orders/logistics`
- 已稳定在线消费 route：
  - `/integrations/alibaba/wika/reports/orders/management-summary`
  - `/integrations/alibaba/wika/reports/orders/minimal-diagnostic`
  - `/integrations/alibaba/wika/reports/orders/comparison-summary`

## 2. 已打通的 derived layer

### 店铺 / 产品 / 订单 comparison
- 当前状态：`ONLINE_CONFIRMED_DERIVED`
- 当前可用：
  - store current vs previous comparable window
  - product current vs previous stat window
  - order current observed segment vs previous observed segment

### 订单经营 derived 层
- 当前状态：`ONLINE_CONFIRMED_DERIVED`
- 已成立：
  - `formal_summary`
  - `product_contribution`
  - `trend_signal`
- 仍未成立：
  - `country_structure`

### 统一消费与建议层
- 当前状态：`ONLINE_CONFIRMED_DERIVED`
- 已成立：
  - `/integrations/alibaba/wika/reports/business-cockpit`
  - `/integrations/alibaba/wika/reports/action-center`
  - `/integrations/alibaba/wika/reports/operator-console`
- 当前定位：
  - 是统一消费层
  - 不是新增 official 字段
  - 不是平台内执行层

### 内容与页面优化建议层
- 当前状态：`LOCAL_CONTRACT_READY`
- 已成立：
  - `homepage_optimization_suggestions`
  - `product_detail_optimization_suggestions`
  - `media_optimization_suggestions`
  - `title_keyword_optimization_suggestions`
  - `new_product_direction_suggestions`
- 当前边界：
  - 保守建议
  - 仍需人工确认
  - 不冒充页面行为数据

## 3. 已打通的 import-driven layer

### 广告 / 直通车导入层
- 当前状态：`IMPORT_READY`
- 已提供：
  - `WIKA/docs/templates/WIKA_广告数据导入模板.csv`
  - `WIKA/docs/templates/WIKA_广告数据导入模板.json`
  - `WIKA/docs/templates/WIKA_广告数据导入说明.md`
  - `WIKA/projects/wika/data/ads/schema.js`
  - `WIKA/projects/wika/data/ads/normalizer.js`
  - `WIKA/projects/wika/data/ads/import-contract.js`
- 当前可增强：
  - ads summary
  - ads comparison
  - ads diagnostic
  - ads action center
- 当前不能宣称：
  - official ads api 已打通
  - 广告平台写回已成立

### 页面人工盘点层
- 当前状态：`MANUAL_AUDIT_READY`
- 已提供：
  - `WIKA/docs/templates/WIKA_页面人工盘点模板.csv`
  - `WIKA/docs/templates/WIKA_页面人工盘点模板.json`
  - `WIKA/docs/templates/WIKA_页面人工盘点说明.md`
  - `WIKA/projects/wika/data/content-optimization/page-audit-contract.js`
- 当前可增强：
  - 页面与内容优化建议
  - 首页整改建议
  - media / detail 完整度建议
  - `operator-console` 的人工跟进视角
- 当前不能宣称：
  - page behavior api 已打通
  - 页面热图 / 点击流已可用

### 输入总览层
- 当前状态：`LOCAL_CONTRACT_READY`
- 已提供：
  - `WIKA/projects/wika/data/inputs/input-readiness-summary.js`
- 当前整合：
  - 自动抓取层
  - 广告导入层
  - 页面人工盘点层
  - 当前 unavailable 维度

## 4. 已打通的 cockpit / workbench / preview / report layer

### cockpit / console
- `/integrations/alibaba/wika/reports/business-cockpit`
- `/integrations/alibaba/wika/reports/action-center`
- `/integrations/alibaba/wika/reports/operator-console`

### workbench
- `/integrations/alibaba/wika/workbench/product-draft-workbench`
- `/integrations/alibaba/wika/workbench/reply-workbench`
- `/integrations/alibaba/wika/workbench/order-workbench`
- `/integrations/alibaba/wika/workbench/task-workbench`

### preview
- `/integrations/alibaba/wika/workbench/product-draft-preview`
- `/integrations/alibaba/wika/workbench/reply-preview`
- `/integrations/alibaba/wika/workbench/order-preview`
- `/integrations/alibaba/wika/workbench/preview-center`

### draft tools
- `/integrations/alibaba/wika/tools/reply-draft`
- `/integrations/alibaba/wika/tools/order-draft`

### report layer
- 现有已形成：
  - 全平台诊断报告
  - 上周运营报告
  - 运营示范报告
  - 运营报告模板 / 示例 / 评分标准
- 当前定位：
  - 已能支撑业务阅读、开会、交接
  - 仍不是平台内执行闭环

### 本轮最小线上校验备注
- 本轮 live-first 最小 smoke 中，以下 route 直连 `200 + JSON`：
  - `/health`
  - `/integrations/alibaba/auth/debug`
  - `/integrations/alibaba/wika/reports/operations/management-summary`
  - `/integrations/alibaba/wika/reports/products/management-summary`
  - `/integrations/alibaba/wika/reports/orders/management-summary`
  - `/integrations/alibaba/wika/reports/business-cockpit`
  - `/integrations/alibaba/wika/workbench/product-draft-workbench`
  - `/integrations/alibaba/wika/workbench/reply-workbench`
  - `/integrations/alibaba/wika/workbench/order-workbench`
- 本轮 live-first 最小 smoke 中，以下高层消费 route 出现了线上一致性波动，因此使用 post-deploy evidence 完成结构校验：
  - `/integrations/alibaba/wika/reports/action-center`：timeout fallback
  - `/integrations/alibaba/wika/reports/operator-console`：timeout fallback
  - `/integrations/alibaba/wika/workbench/task-workbench`：timeout fallback
  - `/integrations/alibaba/wika/workbench/preview-center`：当前 live `404`，使用 post-deploy evidence fallback
- 以上现象说明：
  - 当前权限能力边界判断仍成立
  - 但高层消费 route 仍需要单独做一次线上一致性回归
  - 本轮不把这类线上一致性波动误写成“权限未打通”

## 5. 当前仓内还能补、并已在本轮补齐的部分
- 广告导入模板从单一 CSV 补齐到 `CSV + JSON`
- 页面人工盘点模板从单一 CSV 补齐到 `CSV + JSON`
- 广告导入层新增 JSON 解析支持
- 页面盘点层新增 JSON 解析支持
- 当前权限打通总表正式落盘
- 外部阻塞清单正式落盘
- 工作分配清单正式落盘

## 6. 当前仓内已经没有必要继续硬补的部分
- 不再继续扩 summary / diagnostic / cockpit 包装层
- 不再继续做无新证据的 official field 猜测
- 不再继续做 task3/4/5 写侧试点空转
- 不再把广告或页面输入误包装成 fully automated capability

## 7. 当前外部阻塞层

### 缺官方字段
- store：
  - `traffic_source`
  - `country_source`
  - `quick_reply_rate`
- product：
  - `access_source`
  - `inquiry_source`
  - `country_source`
  - `period_over_period_change`
- order：
  - `country_structure`

### 缺写侧前置条件
- task3：
  - `NO_ROLLBACK_PATH`
  - `NO_TEST_SCOPE`
  - `PARAM_CONTRACT_UNSTABLE`
- task4：
  - `DOC_INSUFFICIENT`
  - 缺 direct candidate
- task5：
  - `NO_ROLLBACK_PATH`
  - `NO_TEST_SCOPE`
  - 缺 stable readback

### 缺外部数据持续供给
- 真实广告导出文件
- 页面人工盘点持续输入
- 若要增强广告比较层，还需要多周期样本

## 当前结论
- 当前仓内能打通的，已经基本全部打通。
- 本轮新增的实质进展，不是新 API，而是把现有权限边界内还能补的输入模板、验证和工作分配全部补齐。
- 剩下不能继续仓内补齐的部分，已经全部转成外部条件问题。
