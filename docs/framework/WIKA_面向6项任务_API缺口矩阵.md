# WIKA 面向 6 项任务 API 缺口矩阵

更新时间：2026-04-10

本文只记录当前最关键的能力状态，不把 route replay 结果误写成任务完成。

## 任务 1：店铺经营指标入口
| 能力项 | 当前状态 | 当前结论 |
| --- | --- | --- |
| `alibaba.mydata.overview.date.get` | 官方存在，XD 标准权限已收口为 `PERMISSION_GAP_CONFIRMED` | 仍缺权限，不可写成已打通 |
| `alibaba.mydata.overview.industry.get` | 官方存在，XD 标准权限已收口为 `PERMISSION_GAP_CONFIRMED` | 仍缺权限，不可写成已打通 |
| `alibaba.mydata.overview.indicator.basic.get` | 官方存在，补齐 `date_range + industry` 后进入 `PERMISSION_DENIED` | 参数契约已过，当前也更像权限缺口 |

## 任务 2：经营聚合层
| 能力项 | 当前状态 | 当前结论 |
| --- | --- | --- |
| WIKA route 底座 | 已上线并在 stage22 全部 `RECONFIRMED` | 只代表 route 层稳定，不代表经营指标已完整 |
| minimal-diagnostic / products / orders 子诊断 | 已上线 | 仍只基于现有真实只读字段 |
| 店铺 / 产品经营指标 | 仍受 `mydata` 权限限制 | 任务 2 不能正式重开 |

## 任务 3：产品上新与详情编写
| 能力项 | 当前状态 | 当前结论 |
| --- | --- | --- |
| schema / render / media / draft render | 已上线 | 只代表只读与可观测能力成立 |
| `photobank.upload` / `add.draft` | 边界未证明 | 仍不能进入真实写入验证 |
| `product.type.available.get` | 官方文档已确认存在，未验证 | 仅保留为 doc-found 候选 |

## 任务 4：询盘与客户沟通
| 能力项 | 当前状态 | 当前结论 |
| --- | --- | --- |
| `customers/list` route | stage22 `RECONFIRMED` | 当前应视为权限探针 route |
| customers direct methods | 仍缺真实 id 或权限 | 还不是稳定客户读侧 |
| inquiries / messages | 仍缺明确读侧入口 | 当前未重开 |

## 任务 5：订单草稿 / 交易创建
| 能力项 | 当前状态 | 当前结论 |
| --- | --- | --- |
| WIKA `orders/detail / fund / logistics` routes | stage22 `RECONFIRMED` | route 层稳定可复现 |
| XD `alibaba.seller.order.get / fund.get / logistics.get` | 标准权限 `PASSED` | direct-method 层不再是主阻塞 |
| 平台内 create 边界 | 未证明 | 仍不能误写成平台内创单已成立 |

## 任务 6：正式通知闭环
| 能力项 | 当前状态 | 当前结论 |
| --- | --- | --- |
| notifier fallback / dry-run | 已成立 | 仍未有真实 provider 送达证据 |
| 真实 provider 外发 | 未配置 | 仍未完成 |

## 当前总论
- stage22 最大增量不是“新 API 打通”，而是 WIKA route replay 全部稳定复现，且 XD 8 项已有接口级标准权限结论。
- stage24 未检测到新的外部权限变化，因此当前不再重复 5 个 XD direct-method 调用。
- 当前仍不是 task 1 complete，不是 task 2 complete，也不是平台内闭环。
