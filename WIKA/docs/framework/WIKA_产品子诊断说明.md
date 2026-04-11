# WIKA 产品子诊断说明

更新时间：2026-04-05

## 当前路由
- `/integrations/alibaba/wika/reports/products/minimal-diagnostic`

## 目标
这条路由只聚焦 `WIKA` 产品侧的最小经营诊断，严格基于已经上线并已线上验证的真实读侧数据输出可追溯结论，不引入任何新的平台指标。

## 当前使用的数据源
- `products/list`
  - 提供产品主数据快照、分组、类目、状态、更新时间
- `products/score`
  - 提供 `final_score`、`boutique_tag`、`problem_map`
- `products/detail`
  - 提供 `subject`、`description`、`keywords`、`gmt_modified`
- `products/management-summary`
  - 提供产品管理摘要口径

## 当前可稳定输出的诊断维度

### 质量分与问题分布
- 原始字段：
  - `result.final_score`
  - `result.boutique_tag`
  - `result.problem_map`
- 当前输出：
  - `score_summary.quality_score`
  - `score_summary.boutique_tag`
  - `score_summary.problem_map_top`

### 内容完整度
- 原始字段：
  - `product.subject`
  - `product.description`
  - `product.keywords`
  - `product.gmt_modified`
- 当前输出：
  - `content_completeness_findings`
- 当前能直接判断：
  - 是否缺标题
  - 是否缺详情
  - 是否缺关键词
  - 最近一次修改时间的可见窗口

### 结构提示
- 原始字段：
  - `group_name`
  - `category_id`
  - `status`
  - `display`
- 当前输出：
  - `structure_findings`
- 当前能直接判断：
  - 是否有未分组产品
  - 当前样本的分组覆盖
  - 当前样本的类目覆盖

## 当前样例里的真实信号
- 当前样本产品总量口径：`total_item = 533`
- 质量分样本为五分制，当前均值约 `4.96`
- 当前采样 `boutique_tag` 全量可见
- 当前样本存在：
  - `missing_description_count = 4`
  - `missing_keywords_count = 8`
  - `ungrouped_count = 1`

## 强结论与弱建议

### 强结论
以下结论都必须直接回溯到真实字段：
- 哪些样本产品缺 `description`
- 哪些样本产品缺 `keywords`
- 当前样本分组是否缺失
- 当前质量分是否低于当前五分制低分阈值

### 弱建议
以下建议必须明确标为“需要更多数据后再做”：
- 流量增长判断
- 产品 CTR 判断
- 关键词来源判断
- 国家市场优先级判断

## 当前仍缺的关键数据
- 曝光
- 点击
- CTR
- 关键词来源
- 询盘来源
- 国家来源
- 近周期变化

## 当前一句话边界
当前产品子诊断已经能稳定输出“质量分 + 内容完整度 + 结构提示”，但它不是完整产品经营驾驶舱。
