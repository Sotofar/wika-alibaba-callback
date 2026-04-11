# WIKA 数据读取流程说明

## 1. 当前可执行的读取目标

当前项目里“数据读取”一词，准确说对应两类动作：

### A. 已实现的读取

- 读取接入配置状态
- 读取 WIKA token 运行状态
- 读取自动续期状态

### B. 尚未实现的读取

- 读取店铺概览数据
- 读取产品数据
- 读取询盘数据
- 读取广告数据

因此，当前推荐的读取流程，首先是“确认接入状态与 token 状态”，而不是直接进入业务数据分析。

## 2. 当前读取逻辑如何启动

### 线上方式

#### 第一步：检查服务是否在线

访问：

```text
https://api.wikapacking.com/health
```

预期：

- 返回 `200`
- 返回内容 `ok`

#### 第二步：读取 WIKA 当前接入状态

访问：

```text
https://api.wikapacking.com/integrations/alibaba/auth/debug
```

预期：

- 返回 JSON
- 可看到当前 OAuth 变量状态
- 可看到 WIKA token 是否已存在、是否已加载、是否会自动续期

### 本地方式

#### 启动现有服务

```bash
npm start
```

然后访问本地对应路径：

```text
http://localhost:3000/health
http://localhost:3000/integrations/alibaba/auth/debug
```

## 3. 当前需要的环境变量

### 读取接入状态所需

- `ALIBABA_CLIENT_ID`
- `ALIBABA_CLIENT_SECRET`
- `ALIBABA_REDIRECT_URI`
- `ALIBABA_AUTH_URL`
- `ALIBABA_TOKEN_URL`
- `ALIBABA_REFRESH_TOKEN_URL`
- `APP_BASE_URL`
- `SESSION_SECRET`

### WIKA 强绑定变量

- `ALIBABA_WIKA_TOKEN_STORAGE_PATH`
- `ALIBABA_WIKA_AUTO_REFRESH_ENABLED`
- `ALIBABA_WIKA_REFRESH_BUFFER_SECONDS`
- `ALIBABA_WIKA_BOOTSTRAP_REFRESH_TOKEN`（可选）

## 4. 哪些配置与 WIKA 强绑定

以下逻辑当前是 WIKA 单账号强绑定：

- token 持久化路径
- `store_key: "wika"`
- WIKA token 运行时对象
- WIKA 自动续期调度

这些内容未来不能直接拿去给 XD 共用同一份真实值。

## 5. 哪些逻辑未来可以复用到 XD

以下逻辑可以复用：

- `/health` 检查思路
- `/auth/debug` 状态检查思路
- token create / refresh 请求封装思路
- token 文件结构规则
- 自动续期调度思路
- “先验证 access/token，再验证业务数据接口”的排查顺序

未来复制到 XD 时，只需要替换：

- 账号标识
- token 存储路径
- 环境变量命名或实例化方式
- 验证记录目录

## 6. 当前数据读取执行顺序建议

### 当前推荐顺序

1. 先看 `/health`
2. 再看 `/auth/debug`
3. 确认以下状态：
   - `client_id_present = true`
   - `client_secret_present = true`
   - `wika_token_file_exists = true`
   - `wika_token_loaded = true`
   - `wika_has_refresh_token = true`
4. 记录：
   - `wika_token_storage_path`
   - `wika_next_refresh_at`
   - `wika_last_refresh_at`
   - `wika_last_refresh_error`
5. 如果业务目标是读取店铺/产品/询盘/广告数据，则进入“当前未接入”判断，不要误判为“已经能读”

### 当前不建议做的事

- 不要为了验证业务数据去重新授权
- 不要手动刷新 token
- 不要修改 callback / redirect_uri
- 不要把 callback 服务误当成业务数据 API 服务

## 7. 日志在哪里看

### 本地运行

- 终端控制台

当前会记录：

- `Alibaba auth flow started`
- `Alibaba token exchange completed`
- `Wika token refresh completed`
- `Wika token refresh failed`

### Railway 线上

- Railway 服务日志

适合查看：

- token create 是否成功
- refresh 是否成功
- refresh 重试是否发生
- 最近一次失败原因

## 8. 失败时优先排查什么

### 如果 `/health` 失败

先排查：

- 服务是否在线
- Railway 部署是否成功
- 域名是否仍指向当前服务

### 如果 `/auth/debug` 返回字段缺失

先排查：

- Railway Variables 是否齐全
- 本地 `.env` 是否齐全
- 启动的是否是当前版本代码

### 如果 `wika_token_file_exists = false`

先排查：

- 持久化路径是否正确
- Railway 是否使用了临时容器文件系统
- 是否发生过重部署导致文件丢失

### 如果业务方问“为什么还拿不到店铺/产品/询盘/广告数据”

优先结论应是：

- 当前代码尚未实现这些业务接口读取

不要直接下结论为：

- 权限不足
- 阿里接口没有开放

除非后续实际调用过业务接口并拿到明确报错。
