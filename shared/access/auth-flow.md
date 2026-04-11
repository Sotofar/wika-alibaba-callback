# 国际站后台权限获取标准流程

## 适用范围

适用于阿里国际站店铺使用统一 OAuth 接入架构的后台权限获取流程，例如：

- WIKA 国际站
- XD 国际站
- 后续新增的第 3 个国际站账号

## 标准步骤

### 1. 接入前准备

- 确认要接入的店铺账号主体
- 确认该账号是否具备授权操作权限
- 确认开放平台应用已创建
- 确认所需 API 权限范围已申请或准备申请
- 确认 callback URL 与 redirect_uri 规划完成
- 确认环境变量承载方式
- 确认 token 存储位置与隔离规则

### 2. 应用信息确认

至少确认以下信息：

- `CLIENT_ID / App Key`
- `CLIENT_SECRET / App Secret`
- 应用名称
- 允许授权的账号范围
- callback 配置入口位置
- 权限包是否覆盖目标数据范围

### 3. 平台账号确认

- 谁是授权执行人
- 该账号是否就是店铺 owner 或有授权权限
- 是否存在多个店铺共用浏览器登录导致误授权风险

### 4. callback / redirect_uri 配置

- 在平台后台配置 callback URL
- 在服务端环境变量中配置同一个 `redirect_uri`
- 两者必须完全一致
- 改动 callback 时，必须同步检查授权链接生成逻辑

### 5. 授权链接生成

授权链接至少包含：

- `response_type=code`
- `client_id`
- `redirect_uri`
- `state`

生成前检查：

- client_id 是否正确
- redirect_uri 是否与后台 callback 完全一致
- state 是否随机且带过期机制

### 6. 用户授权动作

- 从标准授权入口发起
- 使用目标店铺账号登录
- 检查授权页展示的应用名是否正确
- 确认授权后跳转到正确 callback 地址

### 7. 回调接收

callback 接口至少要做：

- 接收 `code`
- 接收 `state`
- 验证 state 是否存在且未过期
- 记录成功 / 失败 / 取消情况
- 打印脱敏日志

### 8. 授权码换 token

- 使用标准 token create 接口
- 按官方签名规则进行签名
- 成功后获取 `access_token` 和 `refresh_token`
- 不在日志中输出完整 token

### 9. refresh token 续期

- 持久化保存 refresh token
- 在 access token 到期前自动刷新
- 刷新失败时记录重试与错误信息

### 10. token 存储

- 不同账号独立存储
- 文件名 / 存储位 / 数据库键名中必须带账号标识
- 不能把 WIKA 的 token 覆盖到 XD

### 11. 首次联调验证

最低验证动作：

- `/health` 正常
- `/auth/debug` 显示关键变量存在
- `/auth/start` 返回 302
- 授权成功后 callback 返回 200
- token 成功保存
- debug 能看到 token 已加载

### 12. 接入成功判定标准

同时满足以下条件才算打通：

- 授权入口可用
- callback 实际命中
- code 成功换 token
- refresh token 已保存
- token 状态可在 debug 或验证记录中确认

### 13. 新账号复用方式

- 复用这套流程
- 替换账号参数与存储路径
- 保持 callback / redirect_uri 校验规则不变
- 保持 token 隔离规则不变
