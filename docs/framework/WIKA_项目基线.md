# WIKA_项目基线

## 一句话总基线
只推进 WIKA；当前主线已经形成“稳定的只读 route 底座 + 最小经营诊断层 + 外部草稿工作流 SOP + 通知 fallback”，并且 stage22 已确认 WIKA 27 条已验证/已上线 access route 全部可在 production 下稳定复现；stage23 进一步把 XD 剩余 5 个 direct-method gap 收口到接口级证据；但 `mydata` 经营指标主线仍未打通，当前仍不是 task 1 complete，不是 task 2 complete，也不是平台内闭环。

## 当前已完成阶段
- 产品 / 订单 / 物流 / 类目 / schema / media 的正式只读路由已上线
- products / orders / operations minimal-diagnostic 已上线
- 外部 reply/order 草稿工作流、taxonomy、handoff、review、regression 已成立
- 通知 fallback 与 provider dry-run 已成立
- stage17 已完成经营数据候选接口验证
- stage18 已完成 `mydata` 权限清障与订单参数契约对账
- stage19 已完成 `ICBU－商品 (cid=20966)` 47 页官方文档归类
- stage20 已完成 access 预检与未决队列收口
- stage21 已恢复 base-route PASS_BASE
- stage22 已完成 WIKA 27 条 route replay 与 XD 8 项标准权限确认
- stage23 已完成 XD `mydata` 权限证据闭环与 `indicator.basic` 参数契约闭环

## stage22 / stage23 关键结论
- production base 继续 `PASS_BASE`
- deployment provenance：`not_proven_but_service_healthy`
- WIKA 27 条已验证/已上线 access route：全部 `RECONFIRMED`
- XD direct-method 最新结论：
  - `alibaba.mydata.overview.date.get` -> `PERMISSION_GAP_CONFIRMED`
  - `alibaba.mydata.overview.industry.get` -> `PERMISSION_GAP_CONFIRMED`
  - `alibaba.mydata.self.product.date.get` -> `PERMISSION_GAP_CONFIRMED`
  - `alibaba.mydata.self.product.get` -> `PERMISSION_GAP_CONFIRMED`
  - `alibaba.mydata.overview.indicator.basic.get` -> 补齐 `date_range + industry` 后进入 `PERMISSION_DENIED`
- `customers/list` 当前应视为稳定权限探针 route，不应误写成客户数据已稳定可读
- WIKA route 层 `orders/detail / fund / logistics` 已可用 route-level `trade_id` 复现
- 本轮未执行 `elevated confirm`，因为 `XD_ELEVATED_ALLOWED` 未设置为 `1`

## 当前明确不推进
- 新 Alibaba API 猜测、穷举、盲扫
- 平台内回复发送
- 平台内订单创建
- 真实通知外发
- RFQ / XD 新路由开发
- 本地 `.env` / callback / token 旁路
- 真实商品发布、真实线上修改、真实客户沟通

## 当前还缺的核心能力
### 任务 1
- 店铺经营指标入口
- 产品表现入口

### 任务 2
- 更完整的经营聚合层
- `mydata` 放开后的经营指标补齐

### 任务 3
- `photobank.upload` / `add.draft` 的低风险边界证明
- media 清理 / draft 管理的公开入口

### 任务 4
- customers 真正可读
- inquiries / messages 读侧入口
- 平台内回复能力

### 任务 5
- 平台内订单草稿 / 交易创建的安全边界证明

### 任务 6
- 真实 provider 外发通知，而不只是 dry-run / fallback

## 当前唯一推荐下一步
如果继续，不要再重复 route replay。优先只做一种后续动作：
1. 若业务仍需要 task 1 / 2 的 mydata 指标，先申请权限
2. 或在明确允许条件下，只对 4 个 mydata 方法做单次受控 elevated confirm

## 当前真实数据结论
- WIKA 27 条 route replay 已全部 `RECONFIRMED`
- XD `alibaba.seller.order.get / fund.get / logistics.get` 已在标准权限下 `PASSED`
- XD `alibaba.mydata.overview.date.get / overview.industry.get / self.product.date.get / self.product.get` 已在标准权限下完成 `PERMISSION_GAP_CONFIRMED`
- XD `alibaba.mydata.overview.indicator.basic.get` 已在补齐 `date_range + industry` 后进入权限错误层

## 当前待验证判断
- `mydata` 放权后，任务 1 / 2 是否值得正式重开
- 在没有 `XD_ELEVATED_ALLOWED=1` 的前提下，是否还需要继续做 direct-method 实测
