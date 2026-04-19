# WIKA 广告分析报告

## 当前状态结论

当前没有真实广告导出样本，因此这份报告不是正式投放复盘，而是“广告分析 readiness 报告”。WIKA 已经具备广告输入模板、导入校验、标准化层和后续承接能力，但还不能编造真实花费、曝光、点击、询盘结果。

## 当前没有真实广告样本

- 当前仓内没有可用于正式广告分析的真实导出样本。
- 因此不能输出真实 spend、impressions、clicks、inquiries、ctr、cpc、inquiry_rate。
- 任何关于投放效果的正式结论，都必须等待人工提供样本后再生成。

## 已建立的广告输入层

- WIKA/docs/templates/WIKA_广告数据导入模板.csv：已建立模板，可直接作为导入入口。
- WIKA/docs/templates/WIKA_广告数据导入模板.json：已建立模板，可直接作为导入入口。
- WIKA/projects/wika/data/ads/import-contract.js：用于导入 contract 与字段约束。
- validate-wika-stage45-input-productization.js：用于输入层验证。

## 拿到数据后 WIKA 能分析什么

- 按 campaign / ad_group / keyword 分析 spend、impressions、clicks、inquiries。
- 识别高花费低询盘、低 CTR、低 inquiry_rate 的计划或关键词。
- 输出预算、出价、保留、暂停、扩量、降本建议。
- 把广告问题接回 action-center 与 operator-console。

## 当前能给出的保守投放建议

- P1：先提供真实广告导出样本
  - 做什么：按 WIKA 广告导入模板补 date、campaign、ad_group、keyword、spend、impressions、clicks、inquiries 等字段。
  - 为什么：没有真实样本，就不能输出真实花费、点击、询盘效率判断。
  - 预期收益：让广告分析从 readiness 模式升级到真实诊断模式。
  - 执行人：广告投放负责人
  - WIKA 支撑范围：WIKA 已提供 CSV/JSON 模板、字段说明、导入校验与承接层。
  - 是否需要人工确认：需要人工从平台或第三方工具导出并整理样本。
- P2：建立固定周报导入节奏
  - 做什么：每周固定导出一份广告样本，保证至少按周可比较。
  - 为什么：广告分析要形成节奏，不能靠临时抓样本。
  - 预期收益：后续可以稳定生成 ads-summary、ads-diagnostic、ads-comparison 风格分析。
  - 执行人：运营负责人
  - WIKA 支撑范围：WIKA 已具备导入层、诊断层、建议层承接能力。
  - 是否需要人工确认：需要人工执行导出并上传。
- P3：把广告与页面盘点联动
  - 做什么：把广告投放问题与页面盘点问题放在同一周报里看。
  - 为什么：广告点击与页面承接本来就是一条链，分开看会丢失经营动作优先级。
  - 预期收益：减少“投放调了很多，但页面没接住”的情况。
  - 执行人：广告投放负责人 + 页面运营
  - WIKA 支撑范围：WIKA 已支持页面人工盘点输入层与统一报告承接。
  - 是否需要人工确认：需要人工共同提供广告样本和页面盘点。

## 当前人工必须提供的输入

- 广告导出 CSV/JSON 样本。
- 样本对应日期范围与口径说明。
- 如有第三方汇总表，需要说明字段映射。

## 边界声明

- official fields 与 derived judgments 已在正文区分。
- degraded route 只作为受限信号，不按 full success 叙述。
- task3/task4/task5 当前仍是 workbench、preview、外部草稿与人工接手模式，不是平台内执行闭环。
- 广告分析依赖导入样本，页面优化依赖人工盘点输入。
- 没有真实广告样本前，这份报告只代表 readiness，不代表真实投放效果已经被系统打通。
- not task 1 complete
- not task 2 complete
- not task 3 complete
- not task 4 complete
- not task 5 complete
- task 6 excluded
- no write action attempted
- WIKA-only thread for business work
- XD untouched in business execution
- not full business cockpit
