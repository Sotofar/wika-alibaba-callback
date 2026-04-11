# 新账号接入 Checklist

## 接入前

- [ ] 确认账号名称
- [ ] 确认店铺主体与授权执行人
- [ ] 确认开放应用是否已创建
- [ ] 确认 API 权限范围
- [ ] 确认 callback URL
- [ ] 确认 redirect_uri
- [ ] 确认环境变量承载位置
- [ ] 确认 token 存储路径

## 授权发起前

- [ ] `/health` 正常
- [ ] `/auth/debug` 关键变量存在
- [ ] `/auth/start` 可返回 302
- [ ] `Location` 中 client_id 正确
- [ ] `Location` 中 redirect_uri 正确

## 授权后

- [ ] callback 返回成功
- [ ] token create 成功
- [ ] refresh token 已保存
- [ ] debug 显示 token 已加载
- [ ] 写入本账号项目组的接入记录

## 归档

- [ ] 更新项目组 `current-status` 或 `pending-checklist`
- [ ] 更新验证记录
- [ ] 标记已打通 / 待补项
