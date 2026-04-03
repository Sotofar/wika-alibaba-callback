# WIKA_XD 模块能力矩阵

更新时间：2026-04-04

| 模块 | WIKA | XD | 数据源类型 | 是否生产无状态 | 是否已线上验证 | 备注 |
| --- | --- | --- | --- | --- | --- | --- |
| Auth / Bootstrap | 已完成并已线上验证 | 已完成并已线上验证 | 生产 OAuth + bootstrap refresh token | 是 | 是 | 两店都已验证 `refresh:startup_bootstrap` |
| Products 主数据 | 已完成并已线上验证 | 已完成并已线上验证 | 官方 `/sync` | 是 | 是 | 两店都走 `access_token + sha256` |
| Products 表现层 | 已验证真实数据 | 未接通 | WIKA 本地页面态 | 否 | WIKA 是 / XD 否 | WIKA 不能直接复制给 XD 生产 |
| Orders 最小官方路由 | 已完成并已线上验证 | 已完成并已线上验证 | 官方 `/sync` | 是 | 是 | 仅 `list/detail` 最小字段 |
| Orders 分析层 | 已验证真实数据 | 已上线待验收 | WIKA 本地页面态 / XD 官方最小字段派生 | WIKA 否 / XD 部分 | WIKA 否 / XD 部分 | XD 仍缺完整汇总、趋势、国家结构 |
| Overview / Market | 已验证真实数据 | 未接通 | WIKA 本地页面态 | 否 | WIKA 否 / XD 否 | 已确认现有页面源无 cookie 时返回登录页 HTML，不适合直接复制到 XD 生产 |
| Inquiries | 未接通 | 未接通 | 官方候选存在，但当前未识别到可用生产入口 | 否 | 否 | RFQ / inquiry 相关公开能力存在，但尚未证明可用于当前 WIKA/XD 生产闭环 |
| Messages | 未接通 | 未接通 | 当前未识别到可用生产读接口 | 否 | 否 | 仅发现翻译设置/发送类线索，没有已验证消息读取入口 |
| Customers | 未接通 | 未接通 | 官方存在，但权限/上下文阻塞 | 否 | 否 | `alibaba.seller.customer.batch.get`、`customer.get`、`customer.note.*` 文档存在，但标注“聚石塔内调用”，且未验证兼容当前生产认证体系 |
| Reports 导出 | 已完成 | 已完成 | 项目内导出脚本 | 是 | 是 | 基于真实可读模块生成 |

## 说明

- “已完成并已线上验证”只表示对应闸门已经走到“数据接口真实可读”。
- “已验证真实数据”表示数据本身可信，但来源仍是本地页面态，不能误写成生产无状态模块。
- `Inquiries / Messages / Customers` 当前都还没有进入路由开发阶段。
- 对 `Customers` 的最新判断是：
  - 官方接口存在
  - 但当前证据指向 `router/rest + session` 和“聚石塔内调用”上下文
  - 尚未证明适配当前 `open-api /sync + access_token + sha256` 生产闭环
- 对 `Inquiries / Messages` 的最新判断是：
  - 目前还没有同时满足“生产可认证、无状态、非登录页、有真实业务样本”的入口
