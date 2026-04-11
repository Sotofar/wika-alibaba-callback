# WIKA 已验证授权流程

## 已验证步骤

1. 服务端 callback 已上线
2. `/auth/debug` 可查看关键变量状态
3. `/auth/start` 返回 302 到 Alibaba 授权页
4. 使用 WIKA 店铺账号完成授权
5. callback 实际返回成功
6. 服务端成功完成 token exchange
7. WIKA token 已保存到独立存储路径
8. debug 已显示 token 已加载且存在 refresh token

## 已验证成功判定

- callback 返回 200
- token exchange 成功
- token 文件已存在
- `wika_has_refresh_token = true`

## 可供 XD 复用的经验

- 执行顺序固定
- 关键判断点固定
- 环境变量检查应在授权前完成
- callback 和 redirect_uri 一致性必须优先排查
