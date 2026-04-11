# WIKA replay 摘要

更新时间：2026-04-10

## 当前结果
- production base：`PASS_BASE`
- deployment provenance：`not_proven_but_service_healthy`
- WIKA 27 条已验证/已上线 access route：全部 `RECONFIRMED`

## 分类计数
- `RECONFIRMED`：27
- `FLAKY`：0
- `REGRESSED`：0
- `BLOCKED_ENV`：0
- `AUTH_SCOPE_CHANGED`：0
- `DOC_MISMATCH`：0
- `PARAM_MISSING`：0
- `RATE_LIMITED`：0
- `NO_DATA`：0
- `DEPRECATED`：0
- `UNKNOWN`：0

## 关键说明
- 当前 route 层已经恢复到可复现状态。
- `customers/list` 当前应被视为稳定的权限探针 route，而不是客户数据已稳定可读。
- `orders/detail` / `fund` / `logistics` 在 WIKA route 层已可复现，不代表 direct method 契约问题已经彻底消失。

## 本轮未做的事
- 没有新增任何 Alibaba API 验证。
- 没有新增任何写动作。
- 没有做 XD 高权限补测。
