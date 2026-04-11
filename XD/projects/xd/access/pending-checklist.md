# XD 接入待执行清单

## 前置准备

- [ ] 确认 XD 授权执行人
- [ ] 确认 XD 应用信息
- [ ] 确认 XD callback URL
- [ ] 确认 XD redirect_uri
- [ ] 确认 XD token 存储路径
- [ ] 确认 XD Railway Variables 准备完成

## 授权前验证

- [ ] `/health` 正常
- [ ] `/auth/debug` 显示 XD 需要的关键变量存在
- [ ] `/auth/start` 302 正常

## 授权后验证

- [ ] callback 实际命中
- [ ] token create 成功
- [ ] refresh token 已保存
- [ ] XD token 状态已记录
