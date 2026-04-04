# WIKA 官方扩展接口最小路由候选池评估

更新时间：2026-04-04

当前阶段只评估 5 个已完成生产适配性验证的官方接口，目标是决定哪些接口应进入 `WIKA` 的最小正式原始路由开发候选池。

| 接口名 | 当前状态 | 业务价值 | 必要入参 | 建议路由路径 | 输出根节点 | 需要保留的核心字段 | 是否直接服务经营层 | 优先级 | 当前是否允许进入原始路由开发 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `alibaba.icbu.product.score.get` | 已验证候选（未上线路由） | 直接补齐 `PIS / 产品质量分 / 精品低质标签` | `product_id` | `/integrations/alibaba/wika/data/products/score` | `alibaba_icbu_product_score_get_response.result` | `boutique_tag`、`final_score`、`problem_map` | 是 | `P0` | 是 |
| `alibaba.seller.order.fund.get` | 已验证候选（未上线路由） | 直接补齐支付、到账、退款、服务费口径 | `e_trade_id`、`data_select` | `/integrations/alibaba/wika/data/orders/fund` | `alibaba_seller_order_fund_get_response.value` | `fund_pay_list`、`service_fee` | 是 | `P0` | 是 |
| `alibaba.seller.order.logistics.get` | 已验证候选（未上线路由） | 直接补齐发货状态、物流状态、发货时间 | `e_trade_id`、`data_select` | `/integrations/alibaba/wika/data/orders/logistics` | `alibaba_seller_order_logistics_get_response.value` | `logistic_status`、`shipping_order_list` | 是 | `P0` | 是 |
| `alibaba.icbu.product.get` | 已验证候选（未上线路由） | 补齐产品详情质量、MOQ、内容完整度 | `product_id`、`language` | `/integrations/alibaba/wika/data/products/detail` | `alibaba_icbu_product_get_response.product` | `subject`、`description`、`keywords`、`pc_detail_url`、`gmt_modified`、`product_id` | 部分直接服务经营层 | `P1` | 是 |
| `alibaba.icbu.product.group.get` | 已验证候选（未上线路由） | 补齐系列/分组树结构，服务产品结构管理 | `group_id` | `/integrations/alibaba/wika/data/products/group` | `alibaba_icbu_product_group_get_response.product_group` | `group_id`、`group_name`、`children_group`、`children_id_list`、`parent_id` | 是 | `P1` | 是 |

## 说明

- 当前“允许进入原始路由开发”只表示：
  - 已完成当前生产适配性验证
  - 已确认可以复用 `WIKA` 现有的 `/sync + access_token + sha256` 闭环
  - 不代表经营层模块已经完成
- 本轮优先只落 `P0` 三个原始路由：
  - `products/score`
  - `orders/fund`
  - `orders/logistics`
- `P1` 两个接口保留在下一轮候选池中，不在本轮扩展。
