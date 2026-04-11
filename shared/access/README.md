# 国际站后台权限获取共享中台

## 这个模块的职责

这个模块用于沉淀阿里国际站后台权限获取与授权接入的共享标准，不存放任何账号的真实敏感信息。

这里负责：

- 标准授权流程
- callback / redirect_uri 配置规则
- token 获取与刷新规则
- 环境变量规范
- 联调验证方法
- 常见报错排查 SOP
- 新账号接入 checklist
- 可复制的模板与占位字段

这里不负责：

- 存放任何账号真实 `client_secret`
- 存放任何账号真实 `access_token`
- 存放任何账号真实 `refresh_token`
- 记录某个账号的专属预算、数据结论、诊断结果

## 新账号接入时先看哪些文件

1. [auth-flow.md](./auth-flow.md)
2. [callback-rules.md](./callback-rules.md)
3. [token-management.md](./token-management.md)
4. [new-account-checklist.md](./new-account-checklist.md)
5. [env-template.md](./env-template.md)
6. [authorization-template.md](./authorization-template.md)

## 共享层与项目层边界

- 共享层只沉淀流程、规则、模板、占位字段
- 项目层才记录某个账号“是否已打通、何时验证、当前状态如何”
- 敏感配置只允许留在本地安全配置或 Railway Variables，不写入共享文档
