# WIKA 阶段 34 写侧边界候选矩阵

更新时间：2026-04-13

## 阶段目标

本阶段只做三件事：

1. 把任务 3 / 4 / 5 的 direct write candidate 收敛成正式矩阵
2. 把每个 candidate 的官方文档、参数契约、隔离条件、readback、rollback 条件写清
3. 明确哪些候选只是 direct candidate，哪些已经不具备进入 runtime 的基本条件

固定边界：

- 只处理 `WIKA`
- 只走官方 `/sync + access_token + sha256`
- 本阶段不做真实写入
- task 6 excluded

## 任务 3：产品上新 / 详情写侧

| method_name | doc_url | intended_write_action | parameter_contract_status | sandbox_or_test_scope_available | draft_mode_available | readback_available | cleanup_or_rollback_available | runtime_test_ready | risk_level | 结论 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `alibaba.icbu.photobank.upload` | [official doc](https://open.alibaba.com/doc/api.htm#/api?path=alibaba.icbu.photobank.upload&methodType=GET/POST) | 上传真实图片银行素材 | `documented_minimum_keys_but_safe_test_payload_not_proven` | `no` | `no` | `yes_via_media_list_and_media_groups` | `no` | `false` | `high` | direct candidate，但成功即创建真实素材资产，当前没有可回滚证据 |
| `alibaba.icbu.product.add.draft` | [official doc](https://open.alibaba.com/doc/api.htm#/api?path=alibaba.icbu.product.add.draft&methodType=GET/POST) | 创建真实商品 draft 对象 | `documented_success_shape_but_safe_minimum_payload_not_proven` | `no` | `yes_but_not_safe_boundary_proven` | `partial_via_schema_render_draft_after_real_draft_id` | `no` | `false` | `high` | direct candidate，但当前没有 draft 删除 / 管理 / 回滚闭环 |
| `alibaba.icbu.product.schema.add.draft` | [official doc](https://open.alibaba.com/doc/api.htm#/api?path=alibaba.icbu.product.schema.add.draft&methodType=GET/POST) | 把 draft payload 推进到平台侧草稿/正式路径 | `doc_found_but_runtime_contract_not_stable_enough` | `no` | `yes_but_publish_direction_increases_risk` | `no_stable_query_delete_manage_chain` | `no` | `false` | `very_high` | direct candidate，但它更接近 publish 方向，不是安全边界证明入口 |

## 任务 4：平台内回复写侧

当前结论：`direct candidate count = 0`

原因：

- 仓内当前只有外部回复草稿、handoff pack、preview/workbench 这条成熟消费层
- 没有找到与“平台内回复发送”直接对应、且具备官方方法名 + 字段说明 + 参数契约的候选方法
- 因此本阶段不把 customers / messages / 弱相关方法误报成 direct candidate

## 任务 5：订单草稿 / 交易创建写侧

| method_name | doc_url | intended_write_action | parameter_contract_status | sandbox_or_test_scope_available | draft_mode_available | readback_available | cleanup_or_rollback_available | runtime_test_ready | risk_level | 结论 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `alibaba.trade.order.create` | [official doc](https://open.alibaba.com/doc/api.htm#/api?path=alibaba.trade.order.create&methodType=GET/POST) | 创建真实平台交易订单 | `documented_but_safe_non_transactional_payload_not_proven` | `no` | `no_safe_draft_mode_proven` | `no_direct_safe_readback_for_created_trade` | `no` | `false` | `very_high` | direct candidate，但当前只证明到 `MissingParameter` 边界，没有安全 create 试点前提 |

## 当前 supporting read-side / precheck

这些能力可以支撑边界判断，但不等于 direct write candidate 已安全：

- task 3：
  - `/integrations/alibaba/wika/data/media/list`
  - `/integrations/alibaba/wika/data/media/groups`
  - `/integrations/alibaba/wika/data/products/schema/render/draft`
- task 5：
  - `/integrations/alibaba/wika/data/orders/draft-types`
  - `alibaba.seller.trade.query.drafttype`

## 阶段 34 收口结论

- task 3 direct candidate：3 个
- task 4 direct candidate：0 个
- task 5 direct candidate：1 个
- 当前 `runtime_test_ready = 0`
- 下一阶段只允许做“文档定锚 + 前置条件证明”，不允许直接进入真实写入
