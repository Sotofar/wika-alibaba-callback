# WIKA 阶段 41：运营数据版图与指标口径

## 本阶段目标
- 把 WIKA 当前已经自动可得、只能 derived、必须导入、仍 unavailable 的数据域一次性画清。
- 为后续广告导入层、内容优化建议层、统一运营操作系统提供统一口径。

## 当前运营数据域总表

### 1. 店铺经营域
- 当前状态：`AUTO_READ_CONFIRMED`
- 当前来源：
  - `/integrations/alibaba/wika/reports/operations/management-summary`
  - `/integrations/alibaba/wika/reports/operations/minimal-diagnostic`
  - `/integrations/alibaba/wika/reports/operations/comparison-summary`
- 当前 official fields：
  - `visitor`
  - `imps`
  - `clk`
  - `clk_rate`
  - `fb`
  - `reply`
- 当前 derived outputs：
  - comparison deltas
  - diagnostic findings
  - action recommendations
- 当前 unavailable：
  - `traffic_source`
  - `country_source`
  - `quick_reply_rate`

### 2. 产品经营域
- 当前状态：`AUTO_READ_CONFIRMED`
- 当前来源：
  - `/integrations/alibaba/wika/reports/products/management-summary`
  - `/integrations/alibaba/wika/reports/products/minimal-diagnostic`
  - `/integrations/alibaba/wika/reports/products/comparison-summary`
  - `/integrations/alibaba/wika/data/products/detail`
  - `/integrations/alibaba/wika/data/products/score`
  - `/integrations/alibaba/wika/data/products/groups`
  - `/integrations/alibaba/wika/data/products/schema`
  - `/integrations/alibaba/wika/data/products/schema/render`
  - `/integrations/alibaba/wika/data/products/schema/render/draft`
  - `/integrations/alibaba/wika/data/media/list`
  - `/integrations/alibaba/wika/data/media/groups`
- 当前 official fields：
  - `click`
  - `impression`
  - `visitor`
  - `fb`
  - `order`
  - `bookmark`
  - `compare`
  - `share`
  - `keyword_effects`
- 当前 derived outputs：
  - product comparison deltas
  - product diagnostic findings
  - draft readiness / preview readiness
- 当前 unavailable：
  - `access_source`
  - `inquiry_source`
  - `country_source`
  - `period_over_period_change`（当前只允许自建 comparison，不写成 official）

### 3. 订单与资金域
- 当前状态：`AUTO_READ_CONFIRMED_PARTIAL`
- 当前来源：
  - `/integrations/alibaba/wika/reports/orders/management-summary`
  - `/integrations/alibaba/wika/reports/orders/minimal-diagnostic`
  - `/integrations/alibaba/wika/reports/orders/comparison-summary`
  - `/integrations/alibaba/wika/data/orders/list`
  - `/integrations/alibaba/wika/data/orders/detail`
  - `/integrations/alibaba/wika/data/orders/fund`
  - `/integrations/alibaba/wika/data/orders/logistics`
- 当前 derived outputs：
  - `formal_summary`
  - `product_contribution`
  - `trend_signal`
- 当前 unavailable：
  - `country_structure`

### 4. 广告 / 直通车域
- 当前状态：`IMPORT_REQUIRED`
- 当前结论：
  - 当前仓内没有已验证、稳定、可直接复用的广告 official read route。
  - 当前不把任何未定锚候选写成已打通 official ads api。
- 当前可行路径：
  - 优先保留未来 auto-fetch 接口位
  - 立即建立 CSV/JSON 标准化导入层，承接花费、曝光、点击、询盘、关键词、计划/单元指标

### 5. 页面与内容优化域
- 当前状态：`DERIVED_PLUS_MANUAL`
- 当前来源：
  - 产品 summary / diagnostic / comparison
  - 产品 detail / score / schema / render / media
  - business-cockpit / action-center / operator-console
- 当前能做：
  - 标题 / 关键词 / 主图 / media / 详情结构的保守优化建议
  - 新品补充方向建议
- 当前不能做：
  - 基于真实页面行为热图或页面级点击流的精细化判断

### 6. 工作台输入域
- 当前状态：`AUTO_READ_CONFIRMED`
- 当前来源：
  - `product-draft-workbench`
  - `reply-workbench`
  - `order-workbench`
  - `task-workbench`
  - `product-draft-preview`
  - `reply-preview`
  - `order-preview`
  - `preview-center`
- 当前定位：
  - task3/4/5 的消费层、准备层、预览层已经成立
  - 仍不是平台内执行闭环

### 7. 人工导入域
- 当前状态：`TO_BE_STANDARDIZED`
- 当前优先对象：
  - 广告 / 直通车数据
  - 页面模块人工盘点结果
  - 人工导出的运营补充表

## 指标口径规则

### official / derived / import-required 必须分开
- `official`：
  - 只表示当前 official production mainline 已验证可得字段
- `derived`：
  - 只表示基于当前 official 字段或既有 derived 层保守计算出的结果
- `import-required`：
  - 只表示当前业务上必须，但暂时没有稳定 official read route，因此通过导入层补位

### 当前不允许混写的内容
- 不把广告导入字段写成 official Alibaba mainline 字段
- 不把 comparison delta 写成官方 period-over-period field
- 不把 `country_structure` 写成已成立
- 不把 task3/4/5 workbench 或 preview 写成平台内执行闭环

## 结论
- 阶段 41 已把 WIKA 当前运营数据版图收敛为 7 个域。
- 当前真正缺的不是 summary / diagnostic / cockpit 包装，而是：
  - 广告域稳定数据入口
  - 页面级真实行为数据
  - 若干 official missing dimensions
- 因此阶段 42 直接进入广告导入层，不继续等待不确定广告 API。
