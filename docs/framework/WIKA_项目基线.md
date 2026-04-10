# WIKA_项目基线

## 一句话总基线
只推进 WIKA；当前主线已经形成“稳定的只读 route 底座 + 最小经营诊断层 + 外部草稿工作流 SOP + 通知 fallback”，并且 stage22 已确认 WIKA 27 条已验证/已上线 access route 全部可在 production 下稳定复现；但 `mydata` 经营指标主线仍未打通，当前仍不是 task 1 complete，不是 task 2 complete，也不是平台内闭环。

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

## stage22 关键结论
- production base 继续 `PASS_BASE`
- deployment provenance：`not_proven_but_service_healthy`
- WIKA 27 条已验证/已上线 access route：全部 `RECONFIRMED`
- XD 8 项标准权限确认结果：
  - `PASSED`：3
  - `PERMISSION_DENIED`：4
  - `PARAM_MISSING`：1
- `customers/list` 当前应视为稳定权限探针 route，不应误写成客户数据已稳定可读
- WIKA route 层 `orders/detail / fund / logistics` 已可用 route-level `trade_id` 复现

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
如果继续，不要再重复 route replay。优先处理 direct-method 未决项：
1. XD `mydata` 权限差距
2. `alibaba.mydata.overview.indicator.basic.get` 的参数契约

## 当前真实数据结论
- WIKA 27 条 route replay 已全部 `RECONFIRMED`
- XD `alibaba.seller.order.get / fund.get / logistics.get` 已在标准权限下 `PASSED`
- XD `alibaba.mydata.overview.date.get / overview.industry.get / self.product.date.get / self.product.get` 已在标准权限下 `PERMISSION_DENIED`
- XD `alibaba.mydata.overview.indicator.basic.get` 当前是 `PARAM_MISSING`

## 当前待验证判断
- XD `indicator.basic.get` 的 `industry` 参数契约到底应如何最小补齐
- `mydata` 放权后，任务 1 / 2 是否值得正式重开
