# stage21 runtime dependency map

更新时间：2026-04-10

## app 启动链路
1. `node app.js`
2. 顶层 import 各 Alibaba/WIKA 模块
3. `express()` 初始化，注册 `express.json`
4. 定义 OAuth、token runtime、只读数据 route 与工具 route
5. 注册 `/health`、`auth/debug`、WIKA/XD 数据 route
6. 注册 `setInterval(cleanupExpiredStates, ...)`
7. 读取 `PORT` 与 startup warnings
8. `app.listen(port, ...)`
9. `startTokenRuntimeBootstrap()` 在监听后后台初始化 WIKA/XD token runtime

## /health 依赖
- 代码位置：`app.js:2959`
- 直接依赖：Express app 已监听
- 不依赖：token file、Alibaba `/sync`、OAuth callback、外部网络

## /integrations/alibaba/auth/debug 依赖
- 代码位置：`app.js:2963`
- 直接依赖：env 读取、token runtime state、token storage path 文件存在性检查
- 不依赖：request 时的外部 Alibaba 网络

## /integrations/alibaba/xd/auth/debug 依赖
- 代码位置：`app.js:2967`
- 直接依赖：env 读取、token runtime state、token storage path 文件存在性检查
- 不依赖：request 时的外部 Alibaba 网络

## WIKA / XD data route 共同依赖
- app 已监听并能处理请求
- 对应账户的 runtime token / refresh token
- `getAlibabaReadOnlyClientConfig(accountKey)`
- 如 access token 不在 runtime 中，可能触发 on-demand refresh
- Alibaba 官方 `/sync + access_token + sha256`

## 代表性 route 依赖图
### `/integrations/alibaba/wika/data/products/list?page_size=1`
- handler：`app.js:2974`
- 运行时依赖：WIKA token runtime + read-only client config + Wika product module
- 外部依赖：Alibaba `/sync`

### `/integrations/alibaba/wika/data/orders/list?page_size=1`
- handler：`app.js:3094`
- 运行时依赖：WIKA token runtime + order list handler + read-only client config
- 外部依赖：Alibaba `/sync`

### `/integrations/alibaba/xd/data/products/list?page_size=1`
- handler：`app.js:3054`
- 运行时依赖：XD token runtime + read-only client config + Wika product module
- 外部依赖：Alibaba `/sync`

### `/integrations/alibaba/xd/data/orders/list?page_size=1`
- handler：`app.js:3114`
- 运行时依赖：XD token runtime + order list handler + read-only client config
- 外部依赖：Alibaba `/sync`

## 最可能解释 stage20 统一 BLOCKED_ENV 的依赖点
- 旧设计下，`initializeWikaTokenRuntime()` 与 `initializeXdTokenRuntime()` 在 `listen()` 前被 `await`
- 一旦 startup bootstrap refresh 被下游 refresh 端点卡住，进程即使未崩溃，也会在对外可服务前停住
- 这会同时解释 `/health`、`auth/debug`、WIKA/XD representative list route 的同步不可达

## 当前 stage21 结论
- route 注册本身没有 miswire 证据
- `/health` 与 `auth/debug` 已被修正为不再受 startup bootstrap 阻塞
- 当前 replay gate 已恢复到可继续 WIKA replay 的状态
