# WIKA_XD 框架状态总览

更新时间：2026-04-04

## 1. 已完成并已线上验证

### WIKA
- Auth / callback / runtime token 落盘：已完成并已线上验证
- Bootstrap refresh token 写回 Railway：已完成并已线上验证
- 冷启动恢复：已完成并已线上验证
  - `wika_runtime_loaded_from = refresh:startup_bootstrap`
- Products 主数据：
  - `/integrations/alibaba/wika/data/products/list`
  - `/integrations/alibaba/wika/reports/products/management-summary`
- Orders 最小官方路由：
  - `/integrations/alibaba/wika/data/orders/list`
  - `/integrations/alibaba/wika/data/orders/detail`

### XD
- Auth / callback / runtime token 落盘：已完成并已线上验证
- Bootstrap refresh token 写回 Railway：已完成并已线上验证
- 冷启动恢复：已完成并已线上验证
  - `xd_runtime_loaded_from = refresh:startup_bootstrap`
- Products 主数据：
  - `/integrations/alibaba/xd/data/products/list`
  - `/integrations/alibaba/xd/reports/products/management-summary`
- Orders 最小官方路由：
  - `/integrations/alibaba/xd/data/orders/list`
  - `/integrations/alibaba/xd/data/orders/detail`

## 2. 已验证但未完全上线

### WIKA
- Products 表现层：已验证真实数据，但来源仍是本地页面态，不是生产无状态 API
- Orders 分析层：已验证真实数据，但来源仍是本地页面态，不是生产无状态 API
- Overview / Market：已验证真实数据，但来源仍是本地页面态，不是生产无状态 API

### XD
- Orders 分析层：官方 `list/detail` 已上线并已线上验证，但汇总、趋势、国家结构、产品贡献仍未形成完整生产路由

## 3. 当前无可用生产无状态数据源

### XD
- Overview：当前暂无已验证可复用的生产无状态数据源
- Inquiries / Messages / Customers：当前官方权限阻塞

### WIKA
- Inquiries / Messages / Customers：当前没有独立、已验证、生产无状态模块

## 4. 当前状态纪律

- 路由存在，不等于模块完成
- 授权成功，不等于数据可读
- Runtime token 已落盘，不等于冷启动恢复已验证
- Orders `list/detail` 可读，不等于 orders 分析层已完成
- WIKA 的本地页面态分析结果，不能误写成 XD 的生产可复用链路

## 5. 当前统一框架结论

- 统一账户层：已成立
- 统一 bootstrap 恢复层：已成立
- 统一 debug 状态层：已成立
- 统一官方 `/sync` 适配层：已成立
- 统一 products 主数据层：已成立
- 统一 orders 最小官方层：已成立
- 统一报告导出层：已成立，但仍需继续补 overview / inquiries 等模块状态

## 6. 下一步优先级

1. 在现有官方 orders 路由之上补最小汇总 / 趋势层
2. 继续识别 XD overview 是否存在生产无状态数据源
3. 继续确认 XD inquiries / messages / customers 的权限边界
4. 维持桌面导出与项目内框架文档同步
5. 只在存在低风险、可生产复用入口时再尝试“回复询盘”
