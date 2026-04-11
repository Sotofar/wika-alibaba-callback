# token 管理与隔离规则

## 管理目标

- 获取 `access_token`
- 安全保存 `refresh_token`
- 保证不同账号之间完全隔离
- 保证刷新逻辑可持续运行

## access token 规则

- `access_token` 只作为短期访问凭证使用。
- 不要把完整 `access_token` 输出到日志。
- 调试页只允许展示“是否存在”或脱敏摘要。

## refresh token 规则

- `refresh_token` 属于长期有效凭证，必须单独保护。
- 不要写入共享文档。
- 不要提交到 Git 仓库。
- 不要在不同账号之间复用。

## 账号隔离规则

- WIKA 使用独立 token 存储路径。
- XD 使用独立 token 存储路径。
- 后续新增账号也必须使用独立路径和独立变量名。
- 变量名、文件名、目录名都必须带账号标识。

示例：

- `WIKA/projects/wika/access/` 只记录 WIKA 接入状态
- `XD/projects/xd/access/` 只记录 XD 接入状态
- `WIKA_TOKEN_STORAGE_PATH`
- `XD_TOKEN_STORAGE_PATH`

## 存储位置规范

- 共享文档只写规则，不写真实值。
- 模板里使用占位值，例如 `YOUR_TOKEN_STORAGE_PATH`。
- 真实路径只允许留在本地安全配置或 Railway Variables。
- 如果使用文件持久化，必须确认宿主环境具备持久卷。

## 自动刷新规则

- 在 `access_token` 到期前预留缓冲时间进行刷新。
- 刷新失败时记录错误摘要和下次重试时间。
- 不允许一个账号的刷新失败影响另一个账号。

## 模板中允许与禁止写入的内容

可以写：

- 字段名
- 变量名
- 文件命名规则
- 验证动作

不可以写：

- 真实 `secret`
- 真实 `access_token`
- 真实 `refresh_token`
