# WIKA_XD 报告框架说明

更新时间：2026-04-04

## 1. 报告目标

在不伪造数据、不混淆状态的前提下，为 WIKA 和 XD 输出：
- 账号状态报告
- 产品管理报告
- 订单状态与结构报告
- 综合运营诊断报告
- 桌面交付物

## 2. 数据来源原则

- 只使用真实可读、已验证来源的数据
- 已上线但未验收的能力要单独标记
- 未接通模块必须明确说明“未接通 / 权限阻塞 / 暂无生产数据源”
- 不把本地页面态验证结果写成生产无状态能力

## 3. 当前统一采集入口

主导出脚本：
- `scripts/export-store-audit.js`

当前输出内容：
- `README_交付说明.md`
- `WIKA_XD_运营总报告_YYYY-MM-DD.md`
- `WIKA_完整数据_YYYY-MM-DD.json`
- `XD_完整数据_YYYY-MM-DD.json`
- `WIKA_XD_对比汇总_YYYY-MM-DD.csv`
- `行业领头企业对比表_YYYY-MM-DD.csv`
- `行业领头企业分析报告_YYYY-MM-DD.md`

## 4. 当前报告能力

### WIKA
- Auth / bootstrap 状态
- 官方 products 主数据
- 官方 orders 最小 list/detail
- 已验证本地页面态：
  - products 表现层
  - orders 分析层
  - overview / market

### XD
- Auth / bootstrap 状态
- 官方 products 主数据
- 官方 orders 最小 list/detail
- overview：未接通
- inquiries/messages/customers：未接通

## 5. 当前限制

- XD orders 还不能输出完整订单汇总 / 趋势 / 国家结构报告
- XD overview 还不能输出真实市场诊断
- XD inquiries/messages/customers 还不能输出真实客户与询盘质量诊断
- WIKA 本地页面态数据虽然真实，但不应误写成生产官方能力

## 6. 后续扩展方向

1. 在官方 orders list/detail 基础上补最小汇总 / 趋势层
2. 若 overview 找到生产无状态数据源，再接入 XD 市场报告
3. 若 inquiries/messages/customers 权限打通，再接入客户与询盘报告
4. 保持导出脚本、项目内框架文档、桌面交付三者同步
