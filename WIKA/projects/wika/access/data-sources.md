# WIKA 后台数据来源与读取链路

## 1. 当前数据读取主链路

当前 WIKA 后台数据读取能力，严格说分为两层：

### A. 已落地的接入状态读取链路

- 线上主服务：`app.js`
- 当前可直接读取的接口：
  - `GET /health`
  - `GET /integrations/alibaba/auth/debug`
- 当前可直接读取的数据：
  - OAuth 配置存在状态
  - WIKA token 运行状态
  - WIKA token 文件存在状态
  - 自动续期调度状态

### B. 已落地的 token 管理链路

- `GET /integrations/alibaba/callback`
  - 接收回调
  - 处理 `code`
  - 换取 token
  - 持久化 WIKA token
- 自动续期逻辑
  - 根据 `expires_in` 计算刷新时机
  - 自动调用 `/auth/token/refresh`
  - 刷新后覆盖持久化记录

### C. 当前不存在的业务数据读取链路

在当前仓库中，未发现以下读取实现：

- 店铺概览数据 API 请求
- 产品数据 API 请求
- 询盘/客户数据 API 请求
- 广告/关键词数据 API 请求
- 活动/页面优化/商品诊断 API 请求

## 2. 关键文件位置

| 文件 | 作用 | 当前与数据读取的关系 |
|---|---|---|
| `app.js` | 当前线上主服务 | 当前真实可用的读取主入口，仅提供 `/health`、`/auth/debug`、`/auth/start`、`/callback` |
| `src/server.js` | 早期 OAuth 原型服务 | 只处理授权 URL、callback、token 落盘，不读业务数据 |
| `src/alibaba/oauth.js` | 早期 Alibaba OAuth 请求封装 | 只封装 `/auth/token/create` 与 `/auth/token/refresh` |
| `src/alibaba/config.js` | 早期环境变量读取 | 定义 OAuth 所需配置 |
| `src/alibaba/token-store.js` | 早期 token 文件保存 | 保存和加载历史 token 文件 |
| `scripts/print-auth-url.js` | 打印授权 URL | 仅授权辅助脚本 |
| `scripts/refresh-token.js` | 手动 refresh token | 仅 token 管理辅助脚本 |
| `.env.example` | 当前环境变量模板 | 列出所有读取接入状态所需变量 |
| `README.md` | 当前主服务说明 | 描述 OAuth、token 持久化、自动续期 |

## 3. 当前实际数据来源清单

| 数据来源 | 读取入口 | 来源类型 | 当前状态 | 说明 |
|---|---|---|---|---|
| 服务存活状态 | `GET /health` | HTTP 接口 | 已验证可读取 | 只能证明服务在线，不提供业务数据 |
| OAuth 配置状态 | `GET /integrations/alibaba/auth/debug` | HTTP 接口 | 已验证可读取 | 返回 client/token URL/redirect 等状态摘要 |
| WIKA token 运行状态 | `GET /integrations/alibaba/auth/debug` | HTTP 接口 | 已验证可读取 | 返回 token 文件存在、是否已加载、是否有 refresh token、下一次刷新时间等 |
| WIKA token 持久化记录 | `ALIBABA_WIKA_TOKEN_STORAGE_PATH` | 文件 | 已通过 debug 间接验证 | 线上 debug 已确认文件存在，但当前未直接读取生产文件内容 |
| OAuth 回调结果 | `GET /integrations/alibaba/callback` | HTTP 接口 | 已接通，但本次未重新触发 | 只在授权回调时发生，不属于日常业务数据读取 |
| token 刷新日志 | 服务运行日志 | 日志 | 已有代码支持 | 可用于排查 refresh 状态，不是业务分析数据源 |

## 4. 实际读取动作从哪里发起

### 当前线上服务

真实读取动作从以下位置发起：

- `app.js` 中的 `app.get("/integrations/alibaba/auth/debug", ...)`
  - 读取配置状态
  - 读取 WIKA token 运行时状态
- `app.js` 中的 `exchangeAuthorizationCode()`
  - 调用 `ALIBABA_TOKEN_URL`
- `app.js` 中的 `refreshAuthorizationToken()`
  - 调用 `ALIBABA_REFRESH_TOKEN_URL`

### 早期原型

- `src/server.js`
  - 提供 `/integrations/alibaba/authorize-url`
  - 提供 `/integrations/alibaba/callback`
- `src/alibaba/oauth.js`
  - 只对接 token create / refresh

## 5. 当前 fetch / 外部请求目标

通过代码扫描，当前仓库中仅发现两处 `fetch()`：

1. `app.js`
   - 用于调用 Alibaba token create / refresh
2. `src/alibaba/oauth.js`
   - 用于早期原型中的 token create / refresh

当前没有发现任何面向以下业务接口的请求实现：

- 店铺数据接口
- 产品接口
- 询盘接口
- 广告接口
- 活动接口

## 6. 当前返回数据大致分类

当前项目里实际返回的数据，仅能分成以下几类：

### A. 接入状态类

- `client_id_present`
- `client_secret_present`
- `redirect_uri`
- `auth_url`
- `token_url`
- `refresh_token_url`
- `app_base_url`
- `session_secret_present`

### B. 运行时状态类

- `active_state_count`
- `state_ttl_seconds`
- `wika_auto_refresh_enabled`
- `wika_refresh_buffer_seconds`

### C. WIKA token 状态类

- `wika_token_storage_path`
- `wika_token_file_exists`
- `wika_token_loaded`
- `wika_runtime_loaded_from`
- `wika_has_refresh_token`
- `wika_next_refresh_at`
- `wika_last_refresh_at`
- `wika_last_refresh_reason`
- `wika_last_refresh_error`

### D. token 载荷类

这部分在代码里会被持久化或脱敏展示，但当前没有单独开放读取接口。代码中实际处理到的字段包括：

- `access_token`
- `refresh_token`
- `expires_in`
- `refresh_expires_in`
- `access_token_expires_at`
- `refresh_token_expires_at`
- `account`
- `account_id`
- `account_platform`
- `request_id`

## 7. 当前结论

当前 WIKA 已接通的是“授权与 token 状态读取链路”，不是“店铺业务数据读取链路”。

如果后续要继续读取：

- 店铺整体数据
- 产品表现
- 询盘数据
- 广告数据

则需要在现有 token 可用的基础上，新增独立的业务数据读取模块，而不是继续复用当前 callback 服务当作数据采集服务。
