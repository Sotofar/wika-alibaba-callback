## 广告数据导入层

### 当前定位
- 本目录只承接 WIKA 的广告 / 直通车数据导入、标准化、诊断与建议合同。
- 当前没有把任何广告数据伪装成已自动打通的 official API。
- 当前优先级是：
  - 能自动抓取的经营数据继续走已验证的 production read-only route
  - 广告数据在当前权限下若没有稳定官方入口，则走“导入兜底”

### 当前包含
- `schema.js`
  - 广告导入字段、必填项、可选项、数值字段、维度字段口径
- `normalizer.js`
  - CSV / JSON 行级解析
  - 字段校验
  - 标准化输出
  - 基础汇总与窗口对比
- `diagnostics.js`
  - 广告摘要
  - 广告诊断
  - 广告 comparison
  - 广告 action-center 合同
- `sample-import.csv`
  - 仅用于本地合同验证的示例导入文件
  - 不是业务真实数据

### 当前边界
- manual import only
- not official ads api
- no platform write action attempted
- no budget mutation / bid mutation / campaign mutation
- no hidden candidate api exploration

### 后续接入原则
- 若未来拿到稳定广告 official route，可在保持字段口径不变的前提下把 auto-fetch 接回本目录。
- 在没有稳定官方入口前，不允许写成“广告已自动打通”。
