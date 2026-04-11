# WIKA_XD API适配说明

更新时间：2026-04-04

## 1. 核心原则

- WIKA 是唯一已验证生产基线
- XD 以 WIKA 的最小差异接入推进
- 优先生产闭环，不回退本地 `.env` / 本地 callback / 本地 token 文件主流程

## 2. 统一账户层

账户标识：
- `wika`
- `xd`

统一能力：
- 账户级 client id / client secret / redirect uri
- 账户级 runtime token
- 账户级 bootstrap refresh token
- 账户级 debug 状态
- 账户级自动刷新调度

## 3. 统一官方调用层

当前已验证可复用的官方链路：
- `https://open-api.alibaba.com/sync`
- `access_token`
- `sha256`

已应用模块：
- Products 主数据
- Orders 最小官方 list/detail

不再复用的旧路径：
- `router/rest + session` 旧 TOP 调用方式，不作为当前 WIKA/XD 已验证主路径
- WIKA 本地页面 cookie 方案，不作为 XD 生产方案

## 4. 统一请求构造

统一抽象已覆盖：
- `method`
- 公共参数拼装
- `sign_method`
- 签名函数
- `access_token` 注入
- 错误包装
- root key 提取

共享文件：
- `shared/data/clients/alibaba-sync-client.js`
- `shared/data/modules/alibaba-official-orders.js`

## 5. 当前模块适配状态

### Products
- WIKA：已完成并已线上验证
- XD：已完成并已线上验证

### Orders
- WIKA：最小官方 list/detail 已完成并已线上验证；高层分析仍主要依赖本地页面态
- XD：最小官方 list/detail 已完成并已线上验证；高层分析仍未完全上线

### Overview
- WIKA：仅本地页面态验证
- XD：暂无生产无状态数据源

### Inquiries / Messages / Customers
- WIKA：未形成独立生产模块
- XD：当前权限阻塞

## 6. 错误分类规则

统一错误分类包含：
- `authentication_error`
- `permission_error`
- `parameter_error`
- `gateway_error`
- `platform_api_error`
- `unknown_error`

规则：
- 认证、权限、参数、平台错误不得混写
- 未验证模块不得写成“已接通”

## 7. 当前适配边界

- 已验证：Products 主数据、Orders 最小官方路由
- 已验证但非生产无状态：WIKA products 表现、orders 分析、overview/market
- 未验证：XD overview、XD inquiries/messages/customers
- 不建议当前接入：任何必须依赖高风险页面态、验证码或人工交互的动作型入口
