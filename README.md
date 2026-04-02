# WIKA Alibaba Callback

## 项目用途

本项目是一个独立的 Node.js + Express 后端服务，用于承接 Alibaba OAuth 回调，并兼容 Railway 部署。

当前版本已经进入第三阶段：

- 保留 `GET /health` 健康检查
- 提供 `GET /integrations/alibaba/auth/start` 发起授权
- 提供 `GET /integrations/alibaba/callback` 校验 `state` 并完成 token exchange
- 提供 `GET /integrations/alibaba/auth/debug` 输出当前 OAuth 与 Wika token 运行状态摘要
- 为 `Wika` 单店铺增加 refresh token 持久化
- 为 `Wika` 单店铺增加 access token 自动续期

当前实现仍然不引入数据库，也不改现有域名与部署结构。

## 当前范围

这版只处理一个固定持久化槽位：

- `Wika`

这意味着：

- 当前 callback 成功后，会把获取到的 token 视为 `Wika` 店铺 token
- 后续如果接第二个店铺，需要单独扩展为多店铺结构，不能直接复用当前文件覆盖

## 当前接口

### `GET /health`

- 返回状态码：`200`
- 返回内容：`ok`

### `GET /integrations/alibaba/auth/debug`

- 返回当前 OAuth 配置的脱敏摘要
- 返回当前 Wika token 持久化和自动续期状态
- 不会返回真实 `client_secret`、`access_token`、`refresh_token`

### `GET /integrations/alibaba/auth/start`

- 生成随机 `state`
- 将 `state` 临时保存在内存中，默认 10 分钟过期
- 按环境变量拼接 Alibaba 授权 URL
- 302 跳转到 Alibaba 授权页

### `GET /integrations/alibaba/callback`

- 无 `code` 时返回 `400` 和文本 `Missing code`
- 有 `code` 时先校验 `state`
- `state` 无效或过期时返回 `400` 和错误页面
- `state` 有效时调用 Alibaba token exchange
- 成功后：
  - 返回 HTML 成功页
  - 脱敏显示 access token、refresh token、过期信息
  - 把 `Wika` token 写入持久化文件
  - 启动下一次自动续期调度
- 失败后：
  - 返回 HTML 错误页
  - 日志输出脱敏后的错误上下文

## 环境变量

### 必填

- `ALIBABA_CLIENT_ID`
- `ALIBABA_CLIENT_SECRET`
- `ALIBABA_REDIRECT_URI`
- `ALIBABA_AUTH_URL`
- `ALIBABA_TOKEN_URL`
- `APP_BASE_URL`

### 强烈建议填写

- `ALIBABA_REFRESH_TOKEN_URL`
- `SESSION_SECRET`

### Wika 持久化与自动续期

- `ALIBABA_WIKA_TOKEN_STORAGE_PATH`
- `ALIBABA_WIKA_AUTO_REFRESH_ENABLED`
- `ALIBABA_WIKA_REFRESH_BUFFER_SECONDS`

### 可选

- `ALIBABA_PARTNER_ID`
- `ALIBABA_WIKA_BOOTSTRAP_REFRESH_TOKEN`

说明：

- `ALIBABA_REFRESH_TOKEN_URL` 用于 `/auth/token/refresh`。如果未填写，代码会尝试基于 `ALIBABA_TOKEN_URL` 推导；如果你的联调环境不是标准地址，建议显式填写。
- `SESSION_SECRET` 当前用于增强 `state` 生成，避免直接使用纯随机串。
- `ALIBABA_WIKA_TOKEN_STORAGE_PATH` 默认是 `./data/alibaba/runtime/wika-token.json`
- `ALIBABA_WIKA_BOOTSTRAP_REFRESH_TOKEN` 用于“你已经拿到 refresh token，但当前还没有本地 token 文件”的首次引导

`.env.example` 示例：

```env
PORT=3000
APP_BASE_URL=https://api.wikapacking.com

ALIBABA_CLIENT_ID=506918
ALIBABA_CLIENT_SECRET=replace_with_real_client_secret
ALIBABA_REDIRECT_URI=https://api.wikapacking.com/integrations/alibaba/callback
ALIBABA_AUTH_URL=https://open-api.alibaba.com/oauth/authorize
ALIBABA_TOKEN_URL=https://open-api.alibaba.com/rest/auth/token/create
ALIBABA_REFRESH_TOKEN_URL=https://open-api.alibaba.com/rest/auth/token/refresh
SESSION_SECRET=replace_with_random_session_secret

ALIBABA_PARTNER_ID=codex-alibaba-callback

ALIBABA_WIKA_TOKEN_STORAGE_PATH=./data/alibaba/runtime/wika-token.json
ALIBABA_WIKA_AUTO_REFRESH_ENABLED=true
ALIBABA_WIKA_REFRESH_BUFFER_SECONDS=600
ALIBABA_WIKA_BOOTSTRAP_REFRESH_TOKEN=replace_with_existing_refresh_token_if_needed
```

## 本地启动步骤

1. 进入项目目录。
2. 安装依赖：

```bash
npm install
```

3. 复制环境变量模板：

```bash
copy .env.example .env
```

4. 填写真实 Alibaba 配置与 Wika 持久化路径。
5. 启动服务：

```bash
npm start
```

## Railway 部署说明

Railway 仍可直接部署当前项目，不需要改 `start` 命令。

### Railway Variables

至少配置这些变量：

- `APP_BASE_URL=https://api.wikapacking.com`
- `ALIBABA_CLIENT_ID=你的 App Key`
- `ALIBABA_CLIENT_SECRET=你的 App Secret`
- `ALIBABA_REDIRECT_URI=https://api.wikapacking.com/integrations/alibaba/callback`
- `ALIBABA_AUTH_URL=你联调通过的授权地址`
- `ALIBABA_TOKEN_URL=你联调通过的 token create 地址`
- `ALIBABA_REFRESH_TOKEN_URL=你联调通过的 token refresh 地址`
- `SESSION_SECRET=一段随机高强度字符串`
- `ALIBABA_WIKA_TOKEN_STORAGE_PATH=你的持久化文件路径`
- `ALIBABA_WIKA_AUTO_REFRESH_ENABLED=true`
- `ALIBABA_WIKA_REFRESH_BUFFER_SECONDS=600`

可选：

- `ALIBABA_PARTNER_ID=你的 partner_id`
- `ALIBABA_WIKA_BOOTSTRAP_REFRESH_TOKEN=已有的 Wika refresh token`

## Wika refresh token 持久化说明

当前版本把 Wika token 写入一个 JSON 文件。

默认路径：

```text
./data/alibaba/runtime/wika-token.json
```

重要说明：

- 这个路径已经被 `.gitignore` 忽略，不会进 Git
- 如果你在 Railway 上直接写容器文件系统，重部署后文件可能丢失
- 如果你希望真正跨重部署保留 refresh token，应该把 `ALIBABA_WIKA_TOKEN_STORAGE_PATH` 指到持久卷挂载目录
- 当前实现适合“先跑通单店铺 refresh token 持久化 + 自动续期”，不是最终长期生产方案

## 自动续期行为

当前逻辑：

- callback 成功后，会立即把 token 落盘
- 服务根据 `expires_in` 计算下一次自动续期时间
- 默认提前 `600` 秒发起 refresh
- refresh 成功后，会覆盖本地 Wika token 文件并重新调度下一次续期
- refresh 失败后，会记录错误并在 5 分钟后重试

## 手动测试完整流程

### 1. 检查基础服务

访问：

```text
https://api.wikapacking.com/health
```

预期：

- 返回 `200`
- 返回内容 `ok`

### 2. 检查 OAuth 与 Wika 运行摘要

访问：

```text
https://api.wikapacking.com/integrations/alibaba/auth/debug
```

预期：

- 返回 JSON
- 可看到：
  - `client_id_present`
  - `client_secret_present`
  - `redirect_uri`
  - `token_url`
  - `refresh_token_url`
  - `wika_token_storage_path`
  - `wika_token_file_exists`
  - `wika_token_loaded`
  - `wika_has_refresh_token`
  - `wika_next_refresh_at`
- 不会暴露真实 secret 和 token

### 3. 检查 callback 基本行为

访问：

```text
https://api.wikapacking.com/integrations/alibaba/callback
```

预期：

- 返回 `400`
- 返回 `Missing code`

### 4. 从授权入口发起授权

访问：

```text
https://api.wikapacking.com/integrations/alibaba/auth/start
```

预期：

- 浏览器跳转到 Alibaba 授权页

### 5. 使用 Wika 店铺账号完成授权

预期：

- Alibaba 授权后回跳：

```text
https://api.wikapacking.com/integrations/alibaba/callback?code=...&state=...
```

### 6. 判断 token exchange + 持久化是否完成

回调成功页会显示：

- `Access token received: yes`
- `Refresh token present: yes`
- `Storage path`
- `Next auto refresh`
- `expires_in`
- `refresh_expires_in`
- `request_id`

同时你可以再看：

```text
https://api.wikapacking.com/integrations/alibaba/auth/debug
```

预期：

- `wika_token_file_exists = true`
- `wika_token_loaded = true`
- `wika_has_refresh_token = true`
- `wika_next_refresh_at` 有值

### 7. 判断自动续期是否跑起来

方法一：

- 等到 `wika_next_refresh_at` 附近
- 查看 Railway 日志
- 预期出现 `Wika token refresh completed`

方法二：

- 临时把 `ALIBABA_WIKA_REFRESH_BUFFER_SECONDS` 调大一些
- 让下一次 refresh 更快发生
- 观察日志是否成功刷新并重新写入下一次调度时间

## 如果你已经有 refresh token，但还没生成本地 token 文件

可以把已有的 Wika refresh token 填到：

```text
ALIBABA_WIKA_BOOTSTRAP_REFRESH_TOKEN
```

然后重启服务。

预期行为：

- 服务启动时读取这个 bootstrap refresh token
- 自动生成 `wika-token.json`
- 尝试调用 `/auth/token/refresh`
- 成功后写入完整 access token / refresh token 信息

## 常见错误排查

### 1. 缺少环境变量

现象：

- `/integrations/alibaba/auth/start` 返回错误页
- callback 页面显示配置缺失

处理：

- 打开 `/integrations/alibaba/auth/debug`
- 检查缺失项
- 在 Railway Variables 中补齐

### 2. state 无效或过期

现象：

- callback 返回 `Invalid or expired state`

常见原因：

- 授权页停留过久
- 服务刚重启，内存态 `state` 丢失
- 复制了旧的 callback URL 重新打开

处理：

- 重新访问 `/integrations/alibaba/auth/start`
- 重新走一次完整授权

### 3. redirect_uri 不一致

现象：

- Alibaba 授权失败
- 或回调无法命中生产地址

处理：

- Alibaba 后台 callback URL
- `ALIBABA_REDIRECT_URI`

这两个值必须完全一致。

### 4. token exchange 失败

现象：

- callback 页面返回授权失败
- 日志里有 `Alibaba callback processing failed`

处理：

- 检查 `ALIBABA_CLIENT_ID`
- 检查 `ALIBABA_CLIENT_SECRET`
- 检查 `ALIBABA_TOKEN_URL`
- 检查签名是否按官方 `HMAC_SHA256`
- 检查 `code` 是否已过期

### 5. refresh 失败

现象：

- `/integrations/alibaba/auth/debug` 中 `wika_last_refresh_error` 有值
- 日志里有 `Wika token refresh failed`

处理：

- 检查 `ALIBABA_REFRESH_TOKEN_URL`
- 检查当前保存的 refresh token 是否仍有效
- 检查 Railway 是否丢失了持久化文件
- 检查服务是否被重部署导致容器本地文件丢失

### 6. Railway 上 token 文件丢失

现象：

- 服务重部署后 `wika_token_file_exists = false`
- 自动续期停止

原因：

- 你把 token 文件写到了临时容器文件系统

处理：

- 把 `ALIBABA_WIKA_TOKEN_STORAGE_PATH` 改到持久卷目录
- 或后续升级到数据库 / KV / Postgres

## Alibaba 官方文档依据

以下实现细节基于 Alibaba 官方文档：

- 卖家授权介绍：
  - [https://open.alibaba.com/doc/doc.htm?docId=107343&docType=1#/?docId=72](https://open.alibaba.com/doc/doc.htm?docId=107343&docType=1#/?docId=72)
- API 调用步骤：
  - [https://open.alibaba.com/doc/doc.htm?docId=107343&docType=1#/?docId=132](https://open.alibaba.com/doc/doc.htm?docId=107343&docType=1#/?docId=132)
- 签名算法：
  - [https://open.alibaba.com/doc/doc.htm?docId=107343&docType=1#/?docId=135](https://open.alibaba.com/doc/doc.htm?docId=107343&docType=1#/?docId=135)
- token create：
  - [https://open.alibaba.com/doc/api.htm#/api?cid=2&path=/auth/token/create&methodType=GET/POST](https://open.alibaba.com/doc/api.htm#/api?cid=2&path=/auth/token/create&methodType=GET/POST)
- token refresh：
  - [https://open.alibaba.com/doc/api.htm#/api?cid=2&path=/auth/token/refresh&methodType=GET/POST](https://open.alibaba.com/doc/api.htm#/api?cid=2&path=/auth/token/refresh&methodType=GET/POST)

当前实现说明：

- token create 使用 `POST` + JSON body
- token refresh 使用 `POST` + JSON body
- 两者都按官方签名算法使用 `HMAC_SHA256`
- 请求头中包含 `Accept-Encoding: gzip`
- 授权地址和 token 地址均可通过环境变量调整，不在代码里写死生产值
