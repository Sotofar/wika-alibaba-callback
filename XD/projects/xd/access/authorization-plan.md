# XD 授权执行计划

## 执行顺序

1. 按共享中台文档检查前置项
2. 配置 XD 环境变量
3. 检查 `/auth/debug`
4. 触发 `/auth/start`
5. 使用 XD 店铺账号授权
6. 检查 callback 成功与 token 保存
7. 写入 XD 验证记录

## 待替换字段

- `YOUR_XD_CLIENT_ID`
- `YOUR_XD_CLIENT_SECRET`
- `YOUR_XD_CALLBACK_URL`
- `YOUR_XD_REDIRECT_URI`
- `YOUR_XD_TOKEN_STORAGE_PATH`

## 成功标准

- XD callback 返回成功
- XD token 保存成功
- XD debug 显示 token 已加载
