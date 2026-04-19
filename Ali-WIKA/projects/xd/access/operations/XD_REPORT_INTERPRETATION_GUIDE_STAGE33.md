# XD 报告解读说明书 Stage33

## 1. 业务侧能直接使用的内容

业务侧当前可以直接使用以下内容做日常判断：

- 当前页订单样本数
- 当前页商品样本数
- 当前页样本里的订单状态分布
- 履约渠道 / 发货方式分布
- fund/logistics 是否在样本 trade 上可读
- 商品详情 / 分组 / 评分 / 类目 / 媒体是否可读
- minimal-diagnostic 是否正常
- 关键 route 是否持续健康

适用动作：

- 当日问题样本盯盘
- 商品基础巡查
- 周例会素材整理
- route 回归监控

## 2. 管理层能使用的内容

管理层当前可以使用的结论主要是“机制层”和“样本层”：

- XD 已具备稳定的日报 / 周报能力
- XD 已具备持续巡检能力
- 已能产出订单 / 商品样本运营摘要
- 已能防止已打通 route 静默回退
- 当前 safe-scope 完整，后续重开需要外部新证据

这类结论可用于：

- 判断是否值得继续投入运营自动化
- 判断是否继续维持 daily / weekly 机制
- 判断当前要不要回头做 access 重试

## 3. 当前不能使用的内容

以下内容当前不能作为业务结论或管理层结论：

- GMV
- 转化率
- 国家结构
- 产品贡献
- 完整经营诊断
- 严格窗口全量订单数
- 严格窗口全量商品变化数

原因：

- 当前只读范围仍是“当前页样本 / 已读范围”
- 当前没有多页全量聚合
- fund/logistics 没有升格为稳定经营字段

## 4. 如何判断异常

### route 从 `PASS` 变 `FAIL_*`

- 含义：当前某条稳定通路退化
- 动作：
  - 先看 `/health`、`auth/debug`、`xd/auth/debug`
  - 若 base 正常，只记为单 route 异常并降级输出
  - 若 base 也失败，停止正常运营分发

### auth/debug 失败

- 含义：runtime 或认证链路异常
- 动作：
  - 当天不再输出“正常运行”的结论
  - 等待 production 恢复或人工排查

### current page 样本消失

- 含义：当前页没有样本，不等于业务为 0
- 动作：
  - 写成 `PASS_NO_DATA` 或 `not_available`
  - 不把“样本为空”直接解释成业务断崖

### `total_count` / `total_item` 异常变化

- 含义：route 响应的总量信号发生波动
- 动作：
  - 先和上一期同类输出比对
  - 只写成“总量信号变化”
  - 不直接上升为经营归因结论

### 关键 direct-method control 失败

- 若只是本地 direct token 不可用，但 stage30 已有稳定证据：
  - 维持 `SKIPPED_BY_SAFETY`
  - 不把它写成 production 退化
- 若 live 与 fallback 都失效：
  - 才升级为需要排查的异常

## 5. 什么时候值得重开冻结对象

只能按 [reopen_gate_stage30.md](D:/Code/阿里国际站/Ali-WIKA/projects/xd/access/reopen_gate_stage30.md)：

- 新的外部租户 / 产品级 live 证据
- 新的官方文档 / 控制台 / payload 证据
- 新的真实对象样本
- 新的只读 route / direct-method 证据

以下都不构成重开理由：

- 单纯“再试一次”
- 没有新证据的重复调用
- 继续猜 keyword `properties`
- 把 restriction confirmed 改写回“权限未申请”
- 把 write-adjacent skipped 重新包装成只读
