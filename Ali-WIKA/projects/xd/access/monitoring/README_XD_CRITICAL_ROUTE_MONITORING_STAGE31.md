# XD Critical Route Monitoring Stage31

## 目的

把已打通的 XD safe-scope 能力变成每日可巡检、可防回退的机制。

## 入口脚本

- `scripts/check-xd-critical-routes-stage31.js`

## 支持参数

- `--dry-run`
- `--json`
- `--markdown`
- `--output=<path>`
- `--timeout=<ms>`

## 推荐用法

```powershell
node scripts/check-xd-critical-routes-stage31.js --json
```

```powershell
node scripts/check-xd-critical-routes-stage31.js --dry-run
```

## 覆盖范围

Base:

- `/health`
- `/integrations/alibaba/auth/debug`
- `/integrations/alibaba/xd/auth/debug`

XD stable routes:

- `orders/list`
- `orders/detail`
- `products/list`
- `products/detail`
- `products/groups`
- `products/score`
- `categories/tree`
- `media/list`
- `reports/products/minimal-diagnostic`
- `reports/orders/minimal-diagnostic`
- `reports/operations/minimal-diagnostic`

Frozen references:

- `reports/orders/summary`
- `reports/orders/trend`
- `reports/orders/report-consumers`

Direct-method sanity:

- `alibaba.seller.order.get`

## 分类

- `PASS`
- `PASS_NO_DATA`
- `FAIL_ROUTE`
- `FAIL_AUTH`
- `FAIL_TIMEOUT`
- `FAIL_SHAPE`
- `SKIPPED_BY_SAFETY`
- `UNKNOWN`

## 当前边界

- 单 route 失败不会让脚本整体崩溃。
- 本地缺 Railway token 时，stable direct-method 允许退回 stage30 已验证证据，不在 stage31 额外解阻本地 token。
- `orders/summary|trend|report-consumers` 当前 production 未绑定，脚本会显式标成 `SKIPPED_BY_SAFETY`，不会伪装成已通过。

