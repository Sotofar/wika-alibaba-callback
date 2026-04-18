# WIKA 阶段 45：外部输入产品化

## 本阶段目标
- 不新增 API 探索。
- 不新增写侧动作。
- 把当前真正阻塞广告与页面建议层继续增强的“外部样本依赖”，收口成正式输入口。

## 当前前提
- 阶段 41–44 已 push 到 `origin/main`。
- 广告分析层当前定位仍然是：
  - `import-driven`
  - `not official ads api`
- 页面优化建议层当前定位仍然是：
  - `conservative recommendation`
  - `manual confirmation still required`

## 本轮新增资产

### 广告输入产品化
- `WIKA/docs/templates/WIKA_广告数据导入模板.csv`
- `WIKA/docs/templates/WIKA_广告数据导入说明.md`
- `WIKA/projects/wika/data/ads/import-contract.js`

### 页面人工盘点产品化
- `WIKA/docs/templates/WIKA_页面人工盘点模板.csv`
- `WIKA/docs/templates/WIKA_页面人工盘点说明.md`
- `WIKA/projects/wika/data/content-optimization/page-audit-contract.js`

### 输入总览层
- `WIKA/projects/wika/data/inputs/input-readiness-summary.js`
- `WIKA/scripts/validate-wika-stage45-input-productization.js`
- `WIKA/docs/framework/evidence/wika-stage45-input-productization.json`

## 当前形成的正式输入口

### 1. 广告数据导入口
- 当前状态：`IMPORT_READY_WITH_SAMPLE`
- 当前最低必填字段：
  - `date`
  - `spend`
  - `impressions`
  - `clicks`
  - `campaign_name` / `campaign_id`
- 当前允许来源：
  - 阿里后台导出
  - 人工整理台账
  - 第三方汇总导出
  - 已脱敏历史样本
- 当前可增强的层：
  - `ads_summary`
  - `ads_comparison`
  - `ads_diagnostic`
  - `ads_action_center`

### 2. 页面人工盘点输入口
- 当前状态：`MANUAL_AUDIT_READY_WITH_SAMPLE`
- 当前最低必填字段：
  - `audit_date`
  - `page_type`
  - `page_url`
  - `module_name`
  - `observed_issue`
  - `manual_recommendation`
  - `priority`
- 当前可增强的层：
  - 首页优化建议
  - 产品详情优化建议
  - 主图 / 视频 / 详情内容整改建议
  - `operator-console` 的人工跟进视角

## 输入总览层结论
- 当前已实现 `input_readiness_summary` 本地合同层。
- 本轮没有新增线上 route。
- 当前总输入结构已拆成：
  - 自动抓取层
  - 广告导入层
  - 页面人工盘点层
  - 当前仍 unavailable 的维度

## 当前能力增强点
- WIKA 不再停在“广告样本没到，无法继续”的口头阻塞。
- WIKA 不再停在“页面没有行为数据，无法继续”的空泛结论。
- 当前已经把两类外部输入都产品化成：
  - 模板
  - 字段口径
  - 合同层
  - 验证脚本

## 当前仍需人工提供的输入
- 真实广告导出文件
- 页面人工盘点行
- 若后续要做更强广告建议，还需要持续导出多周期样本
- 若后续要做更强页面建议，还需要持续人工盘点而不只是一次样本

## 当前边界
- not task 1 complete
- not task 2 complete
- not task 3 complete
- not task 4 complete
- not task 5 complete
- task 6 excluded
- no write action attempted
- not full business cockpit
