# WIKA_执行计划

## 当前阶段
阶段 19：WIKA 数据管家权限开通后复测

## 本阶段唯一目标
- 只在 WIKA production 主线下复测 5 个 `mydata` 官方方法
- 把“权限后台已加包”转化成“真实字段是否可取”的明确证据
- 不扩展到任何新 API
- 不做任何写侧动作
- 不混入 XD

## 固定执行顺序
1. 确认当前线程只处理 WIKA，并把 appkey 对应关系收口为：
   - `wika_appkey_confirmed=false`
   - `assumption_wika_appkey=true`
2. 复核 WIKA production base sentinel：
   - `/health`
   - `/integrations/alibaba/auth/debug`
   - 一个代表性 WIKA 只读 route
3. 按固定顺序复测 5 个方法：
   - `alibaba.mydata.overview.date.get`
   - `alibaba.mydata.overview.industry.get`
   - `alibaba.mydata.overview.indicator.basic.get`
   - `alibaba.mydata.self.product.date.get`
   - `alibaba.mydata.self.product.get`
4. 提取真实字段证据并刷新字段覆盖矩阵
5. 只在真实字段成立后判断是否建议局部重开任务 1 / 2 的读数部分

## 本阶段实际结果
- WIKA production base：`PASS_BASE`
- 当前 seller 授权态：可用；`wika_token_loaded=true`、`wika_has_refresh_token=true`
- 5 个 `mydata` 方法本轮都已从旧的 `AUTH_BLOCKED` 进入 `REAL_DATA_RETURNED`
- 已确认的真实字段：
  - 店铺级：`visitor`、`imps`、`clk`、`clk_rate`、`fb`、`reply`
  - 产品级：`click`、`impression`、`visitor`、`fb`、`order`、`bookmark`、`compare`、`share`、`keyword_effects`
- 已确认的真实窗口：
  - `overview.date.get` 提供可用 `date_range`
  - `self.product.date.get` 提供 `day / week / month` 三种真实窗口
- 当前未在真实返回中看到：
  - 店铺级 `流量来源 / 国家来源 / 快速回复率`
  - 产品级 `访问来源 / 询盘来源 / 国家来源 / 近周期变化`

## 本阶段分类口径
- 本阶段允许使用的最终分类：
  - `REAL_DATA_RETURNED`
  - `STILL_AUTH_BLOCKED`
  - `ILLEGAL_ACCESS_TOKEN`
  - `MISSING_ACCESS_TOKEN`
  - `PARAMETER_REJECTED`
  - `ENVIRONMENT_BLOCKED`
  - `UPSTREAM_SAMPLE_MISSING`
  - `AWAITING_WIKA_REAUTH`
  - `APPKEY_NOT_CONFIRMED`
- 本阶段实际收口：
  - 5 / 5 方法 = `REAL_DATA_RETURNED`

## 本阶段之后允许的唯一下一步
- 若继续，只建议局部重开任务 1 / 任务 2 的“只读取数与诊断扩展”部分
- 仍不进入写侧验证，不宣布任务完成

## 固定边界
- 当前不是 task 1 complete
- 当前不是 task 2 complete
- 当前没有任何写侧动作
- 当前线程只处理 WIKA
- 当前没有更新或推进任何 XD 结果
