# WIKA/XD access 过程记录

更新时间：2026-04-10

## 这轮做了什么

1. 读取了 shared/access、projects/wika/access、projects/xd/access 与各级 AGENTS。
2. 盘点了当前 app.js 中可见的 WIKA/XD route 面。
3. 用 production 公共路由做了最小 precheck，多轮确认 `health/auth debug/products list/orders list`。
4. 在不引入本地旁路、不新增写动作的前提下，把结果固化成 replay matrix、未决队列与 XD 覆盖矩阵。

## 发现了什么

- 当前 Railway production 在本轮 precheck 中对基础路由连续超时/不可达。
- 该阻塞同时影响 `WIKA` 和 `XD`。
- 因为基础 health/debug 已失败，本轮没有继续扩大到全量下游 route 盲打。
- 当前 shell 中没有可用的本地 WIKA/XD 明文运行变量，但这不影响我们识别 production 是否可达。
- 当前工作树中 `projects/wika/access` 和 `projects/xd/access` 缺少目录级 AGENTS，需要补建。

## 哪些是证据，哪些是推断

### 已确认的证据
- health_round1: status=n/a classification=BLOCKED_ENV summary=exception(The operation was aborted due to timeout)
- wika_auth_debug_round1: status=n/a classification=BLOCKED_ENV summary=exception(The operation was aborted due to timeout)
- wika_products_list_round1: status=n/a classification=BLOCKED_ENV summary=exception(The operation was aborted due to timeout)
- xd_auth_debug_round1: status=n/a classification=BLOCKED_ENV summary=exception(The operation was aborted due to timeout)
- xd_products_list_round1: status=n/a classification=BLOCKED_ENV summary=exception(The operation was aborted due to timeout)
- health_round2: status=n/a classification=BLOCKED_ENV summary=exception(The operation was aborted due to timeout)
- wika_auth_debug_round2: status=n/a classification=BLOCKED_ENV summary=exception(The operation was aborted due to timeout)
- xd_auth_debug_round2: status=n/a classification=BLOCKED_ENV summary=exception(The operation was aborted due to timeout)
- wika_orders_list_round3: status=n/a classification=BLOCKED_ENV summary=exception(The operation was aborted due to timeout)
- xd_orders_list_round3: status=n/a classification=BLOCKED_ENV summary=exception(The operation was aborted due to timeout)

### 基于证据的推断
- 当 `/health + WIKA auth/debug + XD auth/debug` 在多轮都连续超时/不可达时，本轮其余依赖 production 的 route replay 统一按 `BLOCKED_ENV` 收口。
- 这不是能力回归结论，只是当前运行环境不可用结论。

## 下一步为什么这样做

- 先恢复 Railway production 基础可用性，再进入 WIKA 全量 route replay。
- 在 production 未恢复前，不适合用 XD 做任何标准权限或高权限补测。

# 阶段 21：环境解阻记录

## 本轮做了什么
- 复读了 stage20 产物、`shared/access` 与 `app.js` 启动/路由代码
- 对 `/health`、WIKA/XD `auth/debug`、representative `products/list` / `orders/list` 做了 production base smoke
- 用 local no-secret reproducer 证明旧代码会在 `listen()` 前等待 token bootstrap
- 做了最小 repo 修复：改成先监听，再后台初始化 token runtime

## 发现了什么
- stage20 的统一 `BLOCKED_ENV` 不是 route handler 本身太重
- `/health` 与 `auth/debug` 的 handler 本身很轻
- 真正的问题在于旧代码把 startup token bootstrap 放在 `app.listen()` 前等待
- 这会让 token refresh 一旦慢/卡，就把整站 health/debug 一起拖死
- 当前 production 已恢复：
  - `/health` -> `200`
  - `auth/debug` -> `200`
  - representative WIKA/XD list route -> `200`

## 哪些是证据，哪些是推断
- 证据：
  - production base smoke 结果
  - local no-secret pre-fix / post-fix reproducer
  - `auth/debug` 当前显示 `startup_init_status=refresh:startup_bootstrap`
- 推断：
  - stage20 那一轮的最可能主因是 startup bootstrap 被下游 refresh 链路拖住
  - 不能回溯证明当时是否还叠加了 Railway 短时不可达

## 下一步为什么这样做
- 当前只把 stage21 收口到“环境已恢复 + repo 级阻塞已消除 + replay gate reopened”
- 不在同一轮里把它扩成全量 WIKA replay，避免重新落回 stage20 的大范围 replay
- 下一步应先单独重开 WIKA replay，再决定 XD 8 项是否进入接口级确认

## 补充边界说明
- push 后再次 smoke 时，production 仍返回 `200`
- 但 `auth/debug` 中的 startup 时间戳未变化，因此当前只能确认“线上基础服务健康”，不能仅凭这一次 smoke 证明 Railway 已切换到 stage21 新构建
- 本轮对 repo 修复的直接自证仍以 local no-secret reproducer 为主
