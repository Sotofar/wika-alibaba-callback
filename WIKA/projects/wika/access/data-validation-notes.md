# WIKA 后台数据读取验证记录

## 验证目标

本记录用于说明 WIKA 后台数据读取链路在只读模式下的验证范围、证据来源与当前限制。

本阶段验证目标不是重新授权，也不是修改接入逻辑，而是确认：

- 当前 WIKA 后台数据读取链路到底通到了哪一层
- 哪些数据已经可以稳定读取
- 哪些仍然只是理论可做、但项目里尚未接入

## 验证时间与方式

- 验证日期：`2026-04-02`
- 验证方式：
  - 代码扫描
  - 线上只读 route 验证
  - 本地目录与文档检查

## 实际验证动作

### 1. 代码扫描

扫描范围：

- `app.js`
- `src/**/*.js`
- `scripts/*.js`
- `README.md`
- `WIKA/projects/wika/access/*.md`
- `shared/access/*.md`

重点确认：

- 现有外部请求目标
- 现有 HTTP 路由
- 现有 token 使用位置
- 是否存在店铺 / 产品 / 询盘 / 广告读取函数或脚本

### 2. 线上只读验证

已实际验证：

- `GET https://api.wikapacking.com/health`
  - 返回 `200`
- `GET https://api.wikapacking.com/integrations/alibaba/auth/debug`
  - 返回 `200`
  - 已确认 WIKA token 文件存在、已加载、已持有 `refresh_token`

### 3. 本地文件检查

已检查：

- `data/alibaba/tokens/`
- `.gitignore`

结论：

- 当前线上 token 依赖运行环境持久化路径
- 本地仓库不保存生产 token 文件

## 验证结果矩阵

| 数据模块 | 当前状态 | 验证依据 | 说明 |
| --- | --- | --- | --- |
| 服务在线状态 | 已验证可读取 | `/health` 实测 `200` | 仅服务存活检查 |
| OAuth 配置状态 | 已验证可读取 | `/auth/debug` 实测 | 可确认配置与 token 运行状态 |
| WIKA token 运行状态 | 已验证可读取 | `/auth/debug` 实测 | 可确认 token 是否存在、是否加载、是否持有 `refresh_token` |
| 自动续期状态 | 已验证可读取 | `/auth/debug` + `app.js` | 可确认刷新时间与错误状态 |
| 店铺整体数据 | 当时未接入 | 代码扫描未发现稳定实现 | 历史阶段尚未具备经营数据读取 |
| 产品数据 | 当时未接入 | 代码扫描未发现稳定实现 | 历史阶段尚未具备产品表现读取 |
| 询盘 / 客户数据 | 当时未接入 | 代码扫描未发现稳定实现 | 历史阶段尚未具备询盘读取 |
| 广告 / 投放数据 | 当时未接入 | 代码扫描未发现稳定实现 | 历史阶段尚未具备广告读取 |

## 关键证据

### 证据 1：当时只有 token 相关外部请求

历史阶段代码里实际 `fetch()` 的重点位置主要集中在：

- `app.js`
- `src/alibaba/oauth.js`

主要用于：

- `/auth/token/create`
- `/auth/token/refresh`

### 证据 2：`/auth/debug` 返回真实运行状态

当时确认过的关键字段包括：

- `client_id_present = true`
- `client_secret_present = true`
- `wika_token_file_exists = true`
- `wika_token_loaded = true`
- `wika_has_refresh_token = true`

这只证明接入与 token 运行状态真实可读，不等于业务数据已打通。

## 当前限制结论

历史阶段已验证可读取的只有：

- 接入状态
- token 状态
- 自动续期状态

历史阶段尚未接入的包括：

- 店铺数据
- 产品数据
- 询盘数据
- 广告数据

因此，那个阶段更准确的结论是：

- 当时还没有实现这些业务数据读取链路
- 不能简单归类为“权限不足或接口未开放”
- 只能归类为“当前未接入”
