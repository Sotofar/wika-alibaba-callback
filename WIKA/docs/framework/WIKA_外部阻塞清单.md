# WIKA 外部阻塞清单

更新时间：2026-04-18

## 结论先行
- 当前阻塞已经不是仓内代码能力不足，而是外部条件不足。
- 继续在仓内硬做，不会新增真实证据，反而会把边界写乱。
- 因此当前应把所有阻塞正式分类，并让业务方知道下一步要补的不是“再写代码”，而是“补外部条件”。

## 1. 需要额外权限或官方字段的阻塞

### 店铺级
- `traffic_source`
  - 当前阻塞：现有 official mainline 未返回
  - 影响：不能做渠道来源归因
- `country_source`
  - 当前阻塞：现有 official mainline 未返回
  - 影响：不能做国家来源归因
- `quick_reply_rate`
  - 当前阻塞：现有 official mainline 未返回
  - 影响：不能做完整回复效率判断

### 产品级
- `access_source`
  - 当前阻塞：现有 official mainline 未返回
  - 影响：不能做商品来源分析
- `inquiry_source`
  - 当前阻塞：现有 official mainline 未返回
  - 影响：不能做询盘来源归因
- `country_source`
  - 当前阻塞：现有 official mainline 未返回
  - 影响：不能做商品国家结构判断
- `period_over_period_change`
  - 当前阻塞：官方字段未成立
  - 当前替代：只允许 current comparison derived
  - 影响：不能把 comparison 写成官方字段

### 订单级
- `country_structure`
  - 当前阻塞：现有 orders 主线缺稳定国家结构实值
  - 影响：不能做国家订单结构判断

## 2. 需要官方文档 / 参数契约的阻塞

### task4 平台内回复写侧
- 当前阻塞：
  - `DOC_INSUFFICIENT`
  - 缺 direct candidate
- 影响：
  - 不能安全进入 runtime 写侧边界证明
  - 当前只能停在 external reply draft / preview / handoff pack

### 其他剩余 read gap
- 当前阻塞：
  - 缺 direct candidate 的完整 `doc_url + field + stable parameter contract`
- 影响：
  - 不能继续做新 API runtime
  - 不能把背景候选误写成现成能力

## 3. 需要测试对象的阻塞

### task3 产品写侧
- 当前阻塞：
  - `NO_TEST_SCOPE`
- 影响：
  - 不能做低风险、可隔离的真实写入试点

### task5 订单创建写侧
- 当前阻塞：
  - `NO_TEST_SCOPE`
- 影响：
  - 不能安全证明创单边界

## 4. 需要 rollback / cleanup / readback 的阻塞

### task3
- 当前阻塞：
  - `NO_ROLLBACK_PATH`
  - `PARAM_CONTRACT_UNSTABLE`
- 影响：
  - 即使能尝试写入，也不能证明污染可回滚

### task5
- 当前阻塞：
  - `NO_ROLLBACK_PATH`
  - 缺 stable readback
- 影响：
  - 不能安全证明写后可验证、可清理

## 5. 需要外部数据持续供给的阻塞

### 广告 / 直通车
- 当前阻塞：
  - 没有稳定 official ads api mainline
  - 没有真实广告导出样本持续输入
- 当前可做：
  - `CSV + JSON` 导入模板
  - 合同校验
  - 标准化分析
- 仍做不到：
  - 自动抓取广告后台
  - 自动写回预算 / 出价 / 关键词

### 页面与内容优化
- 当前阻塞：
  - 没有官方页面行为数据
  - 没有热图 / 点击流
  - 需要持续人工盘点输入
- 当前可做：
  - 人工盘点模板
  - 保守内容优化建议
- 仍做不到：
  - 基于真实点击行为的页面排序判断

## 6. 影响范围
- 对老板 / 管理层：
  - 仍不能获得来源归因和国家归因级判断
- 对运营负责人：
  - 仍不能把广告层完全自动化
  - 仍需组织人工盘点页面
- 对销售 / 跟单：
  - WIKA 已能做准备和预览，但最后一跳仍必须人工接手
- 对 task3/4/5：
  - 当前仍是 workbench / preview / draft support，不是平台内执行闭环

## 7. 下一步真正需要的外部条件
- 提供真实广告导出样本，并按周持续输入
- 提供页面人工盘点样本，并按周期持续维护
- 若要重开 task3 / task5 写侧：
  - 提供 test scope
  - 提供 rollback / cleanup 路径
  - 提供 stable readback
- 若要重开 task4：
  - 提供 direct candidate 的官方文档与稳定参数契约

## 当前结论
- 当前剩余阻塞已经全部是外部条件问题。
- 没有这些条件，继续仓内扩功能不会形成新增真实能力。
