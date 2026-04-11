# WIKA 接入笔记

## 已验证经验

- callback 与 redirect_uri 必须完全一致
- `/auth/start` 的 302 跳转地址必须现场检查
- debug 接口适合先看变量是否齐全，再发起授权
- callback 成功页不是唯一依据，还要看 debug 和日志
- token 保存后，要再确认自动续期状态是否已安排

## 风险提醒

- 不要把 WIKA token 复用到 XD
- 不要把 WIKA 的接入结果写入共享模板
- 不要把真实 secret 写入项目文档
