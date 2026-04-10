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

### 症状 0：`/health`、`/auth/debug`、代表性业务只读接口同时返回 502

优先排查：

- Railway production 服务是否可响应
- 是否是统一的 `Application failed to respond`
- 是否需要先恢复基础运行态，再停止所有下游 replay

处理原则：

- 当 `/health` 与至少一个 `auth/debug` 连续两轮都返回同类 502 时，当前轮次统一收口为 `BLOCKED_ENV`
- 不再继续盲打下游业务接口
- 先修复环境，再重开 route-by-route 验证

### 症状 2：授权页正常，但 callback 没回来

优先排查：

- callback URL 与 redirect_uri 是否一致
- 域名是否可访问
- HTTPS 是否可用
- 是否使用了旧授权链接

### 症状 3：callback 命中，但换 token 失败

优先排查：

- `ALIBABA_CLIENT_SECRET`
- `ALIBABA_TOKEN_URL`
- 签名是否按官方规则
- code 是否已过期

### 症状 4：token 已获取，但后续读取数据失败

优先排查：

- API 权限是否已开通
- 当前 token 是否属于正确账号
- 是否误用了其他账号的 token

### 症状 5：refresh 失效

优先排查：

- refresh token 是否仍有效
- `ALIBABA_REFRESH_TOKEN_URL` 是否正确
- token 文件是否在重部署后丢失
- 自动刷新调度是否还在运行
