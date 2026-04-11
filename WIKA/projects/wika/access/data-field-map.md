# WIKA 后台读取字段说明

## 1. 当前已验证接口字段

本文件只记录当前代码或线上实际返回中**真实出现**的字段。

## 2. `/integrations/alibaba/auth/debug` 字段

以下字段已通过线上接口实际验证。

| 字段 | 含义 | 来源 |
|---|---|---|
| `client_id_present` | 是否已配置 `ALIBABA_CLIENT_ID` | `app.js` / `/auth/debug` |
| `client_secret_present` | 是否已配置 `ALIBABA_CLIENT_SECRET` | `app.js` / `/auth/debug` |
| `redirect_uri` | 当前生效的回调地址 | `app.js` / `/auth/debug` |
| `auth_url` | 当前授权 URL | `app.js` / `/auth/debug` |
| `token_url` | 当前 token create URL | `app.js` / `/auth/debug` |
| `refresh_token_url` | 当前 token refresh URL | `app.js` / `/auth/debug` |
| `app_base_url` | 当前服务基础域名 | `app.js` / `/auth/debug` |
| `session_secret_present` | 是否配置 `SESSION_SECRET` | `app.js` / `/auth/debug` |
| `partner_id_present` | 是否配置 `ALIBABA_PARTNER_ID` | `app.js` / `/auth/debug` |
| `state_ttl_seconds` | 授权 `state` 过期时间（秒） | `app.js` / `/auth/debug` |
| `active_state_count` | 当前内存中未过期的 `state` 数量 | `app.js` / `/auth/debug` |
| `wika_auto_refresh_enabled` | WIKA 自动续期是否开启 | `app.js` / `/auth/debug` |
| `wika_refresh_buffer_seconds` | 自动续期提前量（秒） | `app.js` / `/auth/debug` |
| `wika_token_storage_path` | WIKA token 持久化路径 | `app.js` / `/auth/debug` |
| `wika_token_file_exists` | WIKA token 文件是否存在 | `app.js` / `/auth/debug` |
| `wika_token_loaded` | WIKA token 是否已加载到运行时 | `app.js` / `/auth/debug` |
| `wika_runtime_loaded_from` | 当前 token 记录来自哪里 | `app.js` / `/auth/debug` |
| `wika_has_refresh_token` | 当前是否已有 refresh token | `app.js` / `/auth/debug` |
| `wika_next_refresh_at` | 下一次自动续期时间 | `app.js` / `/auth/debug` |
| `wika_last_refresh_at` | 上一次刷新时间 | `app.js` / `/auth/debug` |
| `wika_last_refresh_reason` | 上一次刷新来源 | `app.js` / `/auth/debug` |
| `wika_last_refresh_error` | 上一次刷新错误 | `app.js` / `/auth/debug` |

## 3. WIKA token 文件结构字段

以下字段来自 `persistWikaToken()`、`normalizeTokenPayload()`、`readPersistedWikaTokenRecord()` 的实际代码处理结果。

### 外层记录字段

| 字段 | 含义 |
|---|---|
| `store_key` | 固定账号标识，当前为 `wika` |
| `saved_at` | 本次写入时间 |
| `last_source` | 最近一次写入来源，如 `oauth_callback`、`refresh:scheduled` |
| `token_payload` | Alibaba token 返回体及归一化后的字段集合 |

### `token_payload` 中代码实际处理到的字段

| 字段 | 含义 | 说明 |
|---|---|---|
| `access_token` | access token | 代码中仅脱敏展示，不应明文输出 |
| `refresh_token` | refresh token | 代码中仅脱敏展示，不应明文输出 |
| `expires_in` | access token 有效期秒数 | Alibaba 返回 |
| `refresh_expires_in` | refresh token 有效期秒数 | Alibaba 返回 |
| `obtained_at` | 当前服务记录的获取时间 | 由本地代码补写 |
| `access_token_expires_at` | 计算后的 access token 到期时间 | 由本地代码补写 |
| `refresh_token_expires_at` | 计算后的 refresh token 到期时间 | 由本地代码补写 |
| `expire_time` | Alibaba 返回的过期时间字段 | 代码兼容读取 |
| `account` | 账号标识 | Alibaba 返回时会被保留 |
| `account_id` | 账号 ID | Alibaba 返回时会被保留 |
| `account_platform` | 平台标识 | Alibaba 返回时会被保留 |
| `request_id` | 接口请求 ID | 便于日志与排查 |

## 4. callback 成功页中实际展示过的字段

以下字段并非单独接口，但在 callback 成功页中已被实际展示或使用：

| 字段 | 说明 |
|---|---|
| `Access token received` | 是否成功拿到 access token |
| `Refresh token present` | 是否成功拿到 refresh token |
| `Storage path` | WIKA token 持久化路径 |
| `Next auto refresh` | 下一次自动续期时间 |
| `expires_in` | access token 有效期 |
| `refresh_expires_in` | refresh token 有效期 |
| `request_id` | Alibaba 返回的请求 ID |

## 5. 当前未出现的业务分析字段

截至本次只读验证，以下运营常用字段**未在当前代码或已验证返回中出现**：

| 字段 | 当前状态 |
|---|---|
| `日期`（业务报表维度） | 未接入 |
| `曝光` | 未接入 |
| `点击` | 未接入 |
| `点击率` | 未接入 |
| `访客` | 未接入 |
| `询盘` | 未接入 |
| `产品ID` | 未接入 |
| `产品名称` | 未接入 |
| `客户地区` | 未接入 |
| `广告消耗` | 未接入 |
| `关键词` | 未接入 |
| `数据时间范围` | 未接入 |

这部分不是“字段名没整理出来”，而是“当前项目里还没有实现对应业务数据读取”。
