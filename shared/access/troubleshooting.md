# 接入排查 SOP

## 排查总顺序
1. 服务是否在线
2. callback / redirect_uri 是否一致
3. 环境变量是否齐全
4. auth/start 是否 302
5. callback 是否实际命中
6. token create 是否成功
7. token 是否保存
8. 权限范围是否足够

## 症状与排查路径
### 症状 1：`/auth/start` 返回 500
优先排查：
- `ALIBABA_CLIENT_ID`
- `ALIBABA_REDIRECT_URI`
- `ALIBABA_AUTH_URL`

### 症状 2：callback 命中，但换 token 失败
优先排查：
- `ALIBABA_CLIENT_SECRET`
- `ALIBABA_TOKEN_URL`
- 签名是否按官方规则
- code 是否已过期

### 症状 3：token 已获取，但后续读数失败
优先排查：
- API 权限是否已开通
- 当前 token 是否属于正确账号
- 是否误用了其他账号的 token

### 症状 4：refresh 失败
优先排查：
- refresh token 是否仍有效
- `ALIBABA_REFRESH_TOKEN_URL` 是否正确
- token 文件是否在重部署后丢失
- 自动刷新调度是否还在运行

### 症状 5：`/health`、`/auth/debug` 与代表性只读接口同时 502 / timeout
优先排查：
- Railway production 是否整体不可服务
- 是否是统一的 `Application failed to respond`
- 是否先命中 app 启动阻塞，而不是业务接口回归

处理原则：
- 当 `/health` 与至少一个 `auth/debug` 连续两轮都失败时，当前轮统一按 `BLOCKED_ENV` 收口
- 不继续扩大到下游 route-by-route replay
- 先恢复基础可服务性，再回到业务接口验证

### 症状 6：startup token bootstrap 拖住 `/health`
优先排查：
- `app.listen()` 之前是否 `await initialize*TokenRuntime()`
- startup bootstrap 是否访问外部 refresh endpoint
- `auth/debug` 是否只是诊断入口，却被 bootstrap 阻塞

处理原则：
- `/health` 必须保持轻量，不依赖外部 refresh 成功
- `auth/debug` 应允许先可诊断、后后台 bootstrap
- 已确认可复用修复：先 `listen()`，再后台启动 WIKA/XD token runtime bootstrap

### 症状 7：WIKA route replay 里 `orders/list` 可读，但 `detail/fund/logistics` 仍失败
优先排查：
- 是否错误使用了 direct method 验证阶段的遮罩 `trade_id`
- 是否没有沿用当前 production `/integrations/alibaba/wika/data/orders/list` 返回的 route-level `trade_id`
- 是否遗漏了 `e_trade_id` / `data_select` 这些文档必填参数

处理原则：
- 对 WIKA route replay，优先使用 route-level `orders/list` 真实返回的 `trade_id` 作为下游样本
- 不要把 stage17 的 direct-method 遮罩 `trade_id` 结论直接套到 stage22 的 route replay
- route replay 成功只代表 route 层可复现，不等于 direct method 契约完全闭合

### 症状 8：`overview.indicator.basic.get` 先报缺 `industry`，补参后才报权限错误
优先排查：
- 是否只停在 `date_range` 单参尝试，导致把对象误写成纯参数问题
- 是否补了文档支持的 `industry` 对象，而不是盲试额外参数
- 是否在补齐 `date_range + industry` 后已经进入 `InsufficientPermission`

处理原则：
- 在没有 `industry` 的情况下，只能先记为参数问题，不能直接写成权限不足
- 若补齐文档支持的 `date_range + industry` 后进入 `InsufficientPermission`，则应改写为权限问题
- 不要为确认这一步继续扩大到未知参数枚举或未知接口扫描
