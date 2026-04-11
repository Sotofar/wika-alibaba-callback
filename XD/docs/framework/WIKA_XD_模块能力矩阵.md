# WIKA_XD 模块能力矩阵

更新时间：2026-04-04

| 模块 | WIKA | XD | 数据源类型 | 是否生产无状态 | 是否已线上验证 | 备注 |
| --- | --- | --- | --- | --- | --- | --- |
| Auth / Bootstrap | 已完成并已线上验证 | 已完成并已线上验证 | 生产 OAuth + bootstrap refresh token | 是 | 是 | 两店都已验证 `refresh:startup_bootstrap` |
| Products 主数据 | 已完成并已线上验证 | 已完成并已线上验证 | 官方 `/sync` | 是 | 是 | 两店都走 `access_token + sha256` |
| Products 表现层 | 已验证真实数据 | 未接通 | WIKA 本地页面态 | 否 | WIKA 是 / XD 否 | WIKA 不能直接复制给 XD 生产 |
| Orders 最小官方路由 | 已完成并已线上验证 | 已完成并已线上验证 | 官方 `/sync` | 是 | 是 | 已有 `list/detail` 最小字段 |
| Orders 分析层 | 已验证真实数据 | 已上线待扩展 | WIKA 本地页面态 / XD 官方最小字段 | WIKA 否 / XD 部分 | WIKA 否 / XD 部分 | XD 仍缺完整汇总、趋势、国家结构、产品贡献 |
| Overview / Market | 已验证真实数据 | 未接通 | WIKA 本地页面态 | 否 | WIKA 否 / XD 否 | 现有页面源无 cookie 时返回登录页 HTML，不适合直接复制到 XD 生产 |
| Customers | 官方存在但权限阻塞 | 官方存在但权限阻塞 | 官方文档存在，但当前证据指向 `router/rest + session` 与“聚石塔内调用” | 否 | 否 | 仍停留在识别阶段 |
| Inquiries | 当前未识别到可用入口 | 当前未识别到可用入口 | 官方候选存在，但未证明可进入当前生产闭环 | 否 | 否 | 不进入路由开发 |
| Messages | 当前未识别到可用入口 | 当前未识别到可用入口 | 只识别到翻译/发送类线索，未识别到可用读取入口 | 否 | 否 | 不进入路由开发 |
| 官方扩展原始路由（P0） | 已完成并已线上验证 | 可进入下一轮最小路由开发候选池 | 官方 `/sync` | 是 | WIKA 是 / XD 否 | WIKA 已上线：`alibaba.icbu.product.score.get`、`alibaba.seller.order.fund.get`、`alibaba.seller.order.logistics.get` |
| 官方扩展原始路由（P1） | 已完成并已线上验证 | 可进入下一轮最小路由开发候选池 | 官方 `/sync` | 是 | WIKA 是 / XD 否 | WIKA 已上线：`alibaba.icbu.product.get`、`alibaba.icbu.product.group.get` |
| Reports 导出 | 已完成 | 已完成 | 项目内导出脚本 | 是 | 是 | 基于真实可读模块生成 |

## 说明

- “已完成并已线上验证”只表示对应闸门已经走到“数据接口真实可读”。
- “已验证真实数据”表示数据本身可信，但来源仍是本地页面态，不能误写成生产无状态模块。
- `Customers / Inquiries / Messages` 当前都还没有进入路由开发阶段。
- 本轮新增状态变化有三项：
  - `alibaba.icbu.product.score.get`
  - `alibaba.seller.order.fund.get`
  - `alibaba.seller.order.logistics.get`
  已在 `WIKA` 上形成最小正式原始路由，并已完成线上验收。
  - `alibaba.icbu.product.get`
  - `alibaba.icbu.product.group.get`
  已在 `WIKA` 上形成最小正式原始路由，并已完成线上验收。
- `XD` 本轮没有新增路由开发；三条 `P0` 接口在 `XD` 侧仍是“已验证候选（未上线路由）”。
- `XD` 本轮没有新增路由开发；两条 `P1` 接口在 `XD` 侧仍是“已验证候选（未上线路由）”。
