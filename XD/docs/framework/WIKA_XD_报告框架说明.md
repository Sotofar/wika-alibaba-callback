# WIKA_XD 报告框架说明

更新时间：2026-04-04

## 1. 报告目标

在不伪造数据、不混淆状态的前提下，为 WIKA 和 XD 输出：
- 账号状态报告
- 产品管理报告
- 订单状态与结构报告
- 综合经营诊断报告
- 指标覆盖矩阵
- 模块状态与数据覆盖报告
- 行业对标与学习建议报告

## 2. 主交付格式

从本阶段开始，正式交付以 Excel 和 PDF 为主：

### Excel
- `WIKA_XD_运营总报告_YYYY-MM-DD.xlsx`
- `WIKA_XD_模块状态与数据覆盖_YYYY-MM-DD.xlsx`
- `WIKA_XD_指标覆盖矩阵_YYYY-MM-DD.xlsx`
- `行业领头企业对比与学习建议_YYYY-MM-DD.xlsx`

### PDF
- `WIKA_XD_运营总报告_YYYY-MM-DD.pdf`
- `行业领头企业分析报告_YYYY-MM-DD.pdf`

### 附录
- `WIKA_完整数据_YYYY-MM-DD.json`
- `XD_完整数据_YYYY-MM-DD.json`
- `WIKA_XD_对比汇总_YYYY-MM-DD.csv`
- `WIKA_XD_指标覆盖矩阵_YYYY-MM-DD.csv`
- `行业领头企业对比表_YYYY-MM-DD.csv`
- `WIKA_XD_运营总报告_YYYY-MM-DD.md`

## 3. 当前统一采集入口

原始数据导出脚本：
- `scripts/export-store-audit.js`

管理交付生成脚本：
- `scripts/build_management_artifacts.py`

执行顺序：
1. 先用 `export-store-audit.js` 刷新真实原始数据
2. 再用 `build_management_artifacts.py` 生成 Excel / PDF / README 主交付

## 4. 当前报告能力边界

### WIKA
- 已具备：
  - Auth / bootstrap 状态
  - 官方 products 主数据
  - 官方 orders 最小 list/detail
  - 已验证本地页面态：
    - products 表现层
    - orders 分析层
    - overview / market
- 当前不能误写为生产无状态的部分：
  - products 表现层
  - orders 分析层
  - overview / market

### XD
- 已具备：
  - Auth / bootstrap 状态
  - 官方 products 主数据
  - 官方 orders 最小 list/detail
- 当前未接通：
  - overview
  - inquiries / messages / customers
- 当前不能误写为已完成的部分：
  - orders 汇总/趋势/国家结构/产品贡献
  - overview 真实市场诊断
  - inquiries 与客户结构诊断

## 5. 数据源原则

- 只使用真实可读、已验证来源的数据
- 已上线但未验收的能力必须单独标注
- 未接通模块必须明确标注为：
  - 未接通
  - 权限阻塞
  - 需页面态
  - 暂无生产数据源
- 不把本地页面态已验证结果写成生产无状态能力

## 6. 当前交付中的结论类型

以后所有报告中的判断必须区分为：
- 真实数据结论
- 基于结构的推断
- 官方运营知识对应建议
- 因数据缺失暂不能判断

## 7. 当前限制

- XD overview 当前没有已验证生产无状态数据源
- XD inquiries / messages / customers 当前仍受权限或来源限制
- WIKA overview 和 orders/products 深层分析仍主要依赖本地页面态
- 回复询盘入口当前没有已验证、低风险、可生产复用的官方方案

## 8. 后续扩展方向

1. 在现有官方 orders 路由之上补最小汇总 / 趋势层
2. 继续识别 XD overview 是否存在生产无状态数据源
3. 继续确认 XD inquiries / messages / customers 的权限边界
4. 持续维护指标覆盖矩阵、Excel/PDF 主交付与项目内框架文档同步
