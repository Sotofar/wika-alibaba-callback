# Stage22：deployment provenance 记录

更新时间：2026-04-10

## 当前结论
- provenance 状态：`not_proven_but_service_healthy`

## 已确认的事实
- 当前 production `/health` 返回 `200 ok`
- 当前 production `/integrations/alibaba/auth/debug` 返回 `200 JSON`
- 当前 production 代表性 WIKA `products/list` / `orders/list` 返回 `200 JSON`
- 当前 HEAD 已包含 stage21 的 startup bootstrap 修复

## 为什么不是 proven
- 本轮没有引入额外的 deployment fingerprint、build id 或 Railway dashboard 对照证据
- 因此不能低成本地把这次健康状态写成“已证明切到某个特定构建”

## 为什么仍可继续 replay
- stage22 的闸门只要求服务继续 PASS_BASE，而不是要求 deployment provenance 100% proven
- 当前服务已在接口级可响应，因此 replay 可以继续推进
