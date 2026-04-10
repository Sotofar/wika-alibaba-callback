# stage21 env unblock 计划

更新时间：2026-04-10

## 本轮目标
- 只定位并尽可能解除 Railway production 基础路由不可达 / 超时问题
- 不重复 stage20 的 route-by-route replay
- 不新增任何 Alibaba API 验证
- 不新增任何写侧动作

## 阶段拆分
1. 读 stage20 产物、`app.js` 与启动链路
2. 拆 `/health`、`auth/debug`、代表性 WIKA/XD list route 的依赖图
3. 区分进程级 / 路由级 / 运行时配置级 / 网络级阻塞
4. 只对 repo 内可逆、可自证的问题做修复
5. 用最小 smoke 证明基础路由是否恢复
6. 只给出 replay readiness，不把本轮扩成全量 replay

## 当前假设
- H1：基础症状不是 route miswire，而是启动链路被 token bootstrap 卡住
- H2：`/health` 与 `auth/debug` 自身是轻量的，问题更可能发生在 `listen()` 前
- H3：如果 `auth/debug` 能恢复并显示 token runtime 已加载，则可排除大部分 `MISSING_RUNTIME_ENV`
- H4：若 DNS / TCP / TLS 都正常，则优先看应用监听与启动期外部依赖

## 验证顺序
1. 代码阅读：`app.js` 启动链 / route 注册 / runtime 初始化
2. production 基础 smoke：`/health`、`auth/debug`
3. representative data smoke：WIKA/XD 的 `products/list`、`orders/list`
4. local no-secret reproducer：故意提供不可达 token URL，确认是否能复现“listen 前阻塞”
5. 若确认可修复，再做 local post-fix smoke

## 停止条件
- 如果 `/health` 和 `auth/debug` 仍不可达，且 repo 内没有可逆修复点，则收口到环境阻塞报告
- 如果 `/health` 和至少一个 `auth/debug` 恢复，则本轮停止在 replay readiness，不在本阶段扩成全量业务 replay
