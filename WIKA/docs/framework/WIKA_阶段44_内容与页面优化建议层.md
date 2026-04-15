# WIKA 阶段 44：内容与页面优化建议层

## 本阶段目标
- 让 WIKA 不只会“看经营数据”，还要能给出首页、详情、主图、关键词、新品方向的保守优化建议。
- 当前不等待页面级行为 API，直接利用已有：
  - product summary
  - product minimal diagnostic
  - product comparison
  - business-cockpit
  - operator-console

## 本轮新增
- `WIKA/projects/wika/data/content-optimization/content-optimization.js`
- `WIKA/scripts/validate-wika-stage44-content-optimization.js`
- `WIKA/docs/framework/evidence/wika-stage44-content-optimization.json`

## 当前输出结构
- `homepage_optimization_suggestions`
- `product_detail_optimization_suggestions`
- `media_optimization_suggestions`
- `title_keyword_optimization_suggestions`
- `new_product_direction_suggestions`
- `unavailable_dimensions`
- `boundary_statement`

## 当前能做
- 对重点商品详情承接给出保守建议
- 对主图与媒体整改给出优先级建议
- 对标题/关键词一致性给出优化建议
- 对新品方向给出保守候选建议

## 当前不能做
- 不能基于真实页面热图判断首页模块排序
- 不能基于页面点击流判断详情模块逐屏效果
- 不能把当前建议写成“已被页面行为数据直接证明”

## 当前边界
- current official mainline plus derived only
- no page behavior api confirmed
- recommendations are conservative
- manual confirmation still required
- no write action attempted

## 当前结论
- 阶段 44 已把“内容与页面优化建议层”从文档想法推进到可验证 helper。
- 继续往前若要把建议显著做强，下一步将开始依赖：
  - 真实广告导出数据
  - 页面级人工盘点
  - 或稳定页面行为数据源
