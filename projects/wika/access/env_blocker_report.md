# stage21 env blocker report

更新时间：2026-04-10

## 已观察到的现象
- stage20 中 `/health`、`/integrations/alibaba/auth/debug`、`/integrations/alibaba/xd/auth/debug` 与 representative WIKA/XD list routes 全部 `TimeoutError`
- stage21 当前 production 复测中：
  - `/health` -> `200`
  - `/integrations/alibaba/auth/debug` -> `200`
  - `/integrations/alibaba/xd/auth/debug` -> `200`
  - representative WIKA/XD `products/list`、`orders/list` -> `200`
- `auth/debug` 当前明确显示：
  - client id / secret / redirect uri / token url 都存在
  - WIKA / XD token file 存在
  - `startup_init_status = refresh:startup_bootstrap`
  - `startup_init_error = null`

## 证据
- production base smoke：
  - `curl https://api.wikapacking.com/health` -> `200 ok`
  - `curl https://api.wikapacking.com/integrations/alibaba/auth/debug` -> `200 JSON`
  - `curl https://api.wikapacking.com/integrations/alibaba/xd/auth/debug` -> `200 JSON`
  - representative WIKA/XD `products/list?page_size=1`、`orders/list?page_size=1` -> `200 JSON`
- local reproducer（无真实 secret）：
  - 修复前：在 dummy bootstrap refresh token + 不可达 token URL 条件下，进程 4 秒后仍未开放 `/health`
  - 修复后：同样条件下，进程 4 秒内已开放 `/health` 与 `auth/debug`

## 根因分类
- 本轮最终采用的主分类：`TOKEN_BOOTSTRAP_FAILURE`
- 解释：
  - 旧代码在 `app.listen()` 前同步 `await initializeWikaTokenRuntime()` 与 `await initializeXdTokenRuntime()`
  - 若 startup bootstrap refresh 卡住、超时或下游 refresh 端点慢，`/health` 与 `auth/debug` 会被一并阻塞
  - 这可以在本地无 secret reproducer 中稳定复现
- 当前状态：
  - 该 repo 级阻塞点已修复
  - 当前 production 基础路由已恢复到 `PASS_BASE`

## 已排除项
- `RAILWAY_ROUTE_MISWIRED`
- `MISSING_RUNTIME_ENV`
- `FAIL_DNS`
- `FAIL_TLS`
- `SERVER_STARTUP_FAILURE`

## 未排除项
- stage20 那一轮是否叠加过 Railway 短时不可达，当前无法回溯证明
- Alibaba refresh 端点是否曾经短时慢响应，当前也无法回溯证明

## 需要人工外部动作的清单
- 当前无必须人工动作

## 如后续再次出现同类故障，最小人工动作
1. 在 Railway 查看最新部署日志
   - 位置：Railway 项目 -> Deployments -> Latest deployment -> Logs
   - 理由：确认是否再次卡在 startup token bootstrap
   - 风险：只读诊断，无配置变更
2. 打开 `/integrations/alibaba/auth/debug` 与 `/integrations/alibaba/xd/auth/debug`
   - 理由：确认 `startup_init_status`、`startup_init_error`、token file 状态
   - 风险：只读诊断
3. 若基础路由再次不可达，再检查 Alibaba token/refresh endpoint 是否整体超时
   - 理由：确认是否为下游 refresh 端点慢导致
   - 风险：只读诊断，不做 token 旋转
