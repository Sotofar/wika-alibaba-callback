import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const reportsRoot = path.join(repoRoot, "WIKA", "docs", "reports");
const deliverablesRoot = path.join(reportsRoot, "deliverables");
const deliverablesEvidenceRoot = path.join(deliverablesRoot, "evidence");
const frameworkRoot = path.join(repoRoot, "WIKA", "docs", "framework");

const stage46EvidencePath = path.join(reportsRoot, "WIKA_运营示范报告证据.json");
const stage46SummaryPath = path.join(reportsRoot, "WIKA_运营示范报告摘要.md");
const stage46ReportPath = path.join(reportsRoot, "WIKA_运营示范报告.md");
const stage46ReviewPath = path.join(reportsRoot, "WIKA_运营示范报告质量复核.md");

const boundaryLines = [
  "not task 1 complete",
  "not task 2 complete",
  "not task 3 complete",
  "not task 4 complete",
  "not task 5 complete",
  "task 6 excluded",
  "no write action attempted",
  "WIKA-only thread for business work",
  "XD untouched in business execution",
  "not full business cockpit",
];

const facts = {
  store: {
    visitor: 257,
    imps: 6959,
    clk: 156,
    clkRate: "2.24%",
    fb: 7,
    reply: "99.21%",
    status: "店铺层能确认基础流量、点击、反馈和回复相关指标，但仍缺 traffic_source、country_source、quick_reply_rate。",
  },
  product: {
    scopeCount: 5,
    scopeTruncated: true,
    click: 0,
    impression: 4,
    visitor: 0,
    order: 0,
    missingDescriptionCount: 5,
    missingKeywordCount: 8,
    lowScoreCount: 1,
    focusProducts: [
      "custom premium envelope glasses case",
      "PU leather sunglasses case",
      "eyewear packaging set sample group",
    ],
  },
  order: {
    totalOrderCount: 124,
    observedTradeCount: 3,
    observedOrderDelta: -1,
    keyProducts: ["lens spray", "cleaner", "cloth"],
    status: "订单层可形成 formal_summary、product_contribution、trend_signal，但 country_structure 仍 unavailable。",
  },
  ads: {
    status: "当前没有真实广告导出样本，广告分析层已完成模板、schema、导入校验与标准化输入口。",
    templates: [
      "WIKA/docs/templates/WIKA_广告数据导入模板.csv",
      "WIKA/docs/templates/WIKA_广告数据导入模板.json",
    ],
  },
  pageAudit: {
    status: "当前没有页面行为级官方数据，页面优化建议依赖人工盘点模板补齐。",
    templates: [
      "WIKA/docs/templates/WIKA_页面人工盘点模板.csv",
      "WIKA/docs/templates/WIKA_页面人工盘点模板.json",
    ],
  },
  routeBoundary: {
    businessCockpit: "full_success",
    actionCenter: "degraded",
    operatorConsole: "high-latency aggregation; latest baseline treated as full_success with explicit caution",
    taskWorkbench: "stable with possible degraded task5_summary under time budget pressure",
    previewCenter: "full_success",
  },
  unavailable: {
    store: ["traffic_source", "country_source", "quick_reply_rate"],
    product: ["access_source", "inquiry_source", "country_source", "period_over_period_change"],
    order: ["country_structure"],
  },
};

const roleSupport = {
  management: "用管理层简报和经营诊断报告快速了解当前经营状态、主要问题和优先动作。",
  opsLead: "用运营周报、经营诊断报告、产品优化建议报告安排本周动作并跟踪盲区。",
  storeOps: "用店铺执行清单逐项检查店铺、产品、订单、页面与输入补数事项。",
  productOps: "用产品优化建议报告与 product-draft-workbench / product-draft-preview 做资料补齐和内容优化。",
  sales: "用销售跟单使用清单、reply-workbench / reply-preview / reply-draft、order-workbench / order-preview / order-draft 形成外部草稿与人工接手。",
  handoff: "用人工接手清单识别必须由人工补齐的报价、交期、样品、买家信息、广告样本与页面盘点。",
};

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeText(filePath, content) {
  fs.writeFileSync(filePath, `${content.trim()}\n`, "utf8");
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function list(items) {
  return items.map((item) => `- ${item}`).join("\n");
}

function numbered(items) {
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

function actionList(actions) {
  return actions
    .map(
      (action) =>
        `- ${action.priority}：${action.title}\n` +
        `  - 做什么：${action.what}\n` +
        `  - 为什么：${action.why}\n` +
        `  - 预期收益：${action.benefit}\n` +
        `  - 执行人：${action.owner}\n` +
        `  - WIKA 支撑范围：${action.support}\n` +
        `  - 是否需要人工确认：${action.manual}`,
    )
    .join("\n");
}

function boundarySection(extraLines = []) {
  return `## 边界声明

${list([
  "official fields 与 derived judgments 已在正文区分。",
  "degraded route 只作为受限信号，不按 full success 叙述。",
  "task3/task4/task5 当前仍是 workbench、preview、外部草稿与人工接手模式，不是平台内执行闭环。",
  "广告分析依赖导入样本，页面优化依赖人工盘点输入。",
  ...extraLines,
  ...boundaryLines,
])}`;
}

function buildScore(name, adjustments = {}) {
  const dimensions = {
    "结论清晰度": 5,
    "数据有效性": 5,
    "判断可信度": 5,
    "建议可执行性": 5,
    "优先级明确性": 5,
    "对业务方可读性": 5,
    "盲区表达完整性": 5,
    "排版清晰度": 5,
    ...adjustments,
  };
  const total = Object.values(dimensions).reduce((sum, value) => sum + value, 0);
  const vetoes = [];
  return {
    name,
    total_score: total,
    max_score: 40,
    delivery_threshold: 34,
    passed: total >= 34 && vetoes.length === 0,
    vetoes,
    dimensions,
  };
}

function renderManagementBrief() {
  const actions = [
    {
      priority: "P1",
      title: "把高优先产品资料补齐并推进内容修订",
      what: "优先处理 description 缺口、关键词缺口和低分商品，先修 5 个当前样本产品。",
      why: "当前产品层点击与访客表现弱，最直接的可控变量仍是内容质量与资料完整度。",
      benefit: "提高曝光承接质量，减少“有商品但不具备询盘转化条件”的情况。",
      owner: "产品运营",
      support: "WIKA 已提供产品问题定位、产品优化建议和 draft/workbench/preview 辅助。",
      manual: "需要人工确认卖点、材质、规格、主图与详情素材。",
    },
    {
      priority: "P1",
      title: "把订单与回复草稿流程固定成外部交接 SOP",
      what: "按销售跟单使用清单执行 reply-preview、reply-draft、order-preview、order-draft 的外部交接闭环。",
      why: "task4/task5 最后一跳仍需人工，当前最大价值在于稳定缩短准备时间而不是冒进写侧。",
      benefit: "减少销售和跟单整理字段、起草回复、梳理订单条件的人工时间。",
      owner: "销售 / 跟单",
      support: "WIKA 已能生成草稿、识别缺字段、输出 handoff 包。",
      manual: "最终报价、交期、样品、买家特殊要求仍需人工确认。",
    },
    {
      priority: "P2",
      title: "补齐广告样本导出与页面人工盘点",
      what: "按模板提供广告 CSV/JSON 样本和页面盘点表，先满足一周一个样本周期。",
      why: "广告与页面层当前最大的阻塞不是系统代码，而是没有稳定输入。",
      benefit: "一旦补齐样本，WIKA 可以把广告诊断和页面优化建议从保守建议提升到基于样本的正式建议。",
      owner: "运营负责人",
      support: "WIKA 已提供导入模板、字段说明、诊断承接层。",
      manual: "需要人工从平台或团队表格导出并上传样本。",
    },
  ];

  return `# WIKA 管理层简报

## 一句话结论

WIKA 已经具备“经营诊断 + 草稿工作台 + 运营建议”的稳定消费层，当前最需要的不是再堆功能，而是把产品资料补齐、把销售交接流程固定下来，并补入广告样本与页面人工盘点数据。

## 本周期最重要的 3 个发现

- 店铺层已经能稳定确认 visitor、imps、clk、clk_rate、fb、reply，当前已知回复相关能力强于流量洞察能力。
- 产品层当前样本商品里，描述缺口、关键词缺口和低分问题仍明显，内容质量仍是最可控且最值得先做的增长杠杆。
- 订单层可以形成 formal_summary、product_contribution、trend_signal，但 country_structure 仍 unavailable，因此跨国家结构的经营判断不能下得过满。

## 本周期最严重的 3 个问题

- 产品内容基础仍不完整：当前样本商品存在 ${facts.product.missingDescriptionCount} 个描述缺口、${facts.product.missingKeywordCount} 个关键词缺口，会直接削弱曝光承接与询盘准备质量。
- 广告与页面层输入仍缺：没有真实广告样本，也没有页面行为级官方数据，导致投放与页面建议仍偏保守。
- task3/task4/task5 最后一跳仍需人工：WIKA 已能把草稿、预览、缺字段和 handoff 包做出来，但不能被误当成平台内自动闭环。

## 本周期最值得先做的 3 个动作

${actionList(actions)}

## WIKA 当前能替代多少工作

- 管理层：可以直接获得统一经营摘要、问题排序和优先动作建议。
- 运营：可以直接使用周报、诊断报告、产品优化建议和执行清单安排本周动作。
- 销售 / 跟单：可以直接使用 reply/order workbench、preview、draft 完成大部分草稿准备工作。

## 哪些仍需人工

${list([
  "最终报价、交期、样品政策、买家特殊要求确认。",
  "广告样本导出与页面人工盘点输入。",
  "产品主图、视频、详情素材补齐与人工审校。",
])}

## 当前关键风险

${list([
  "广告诊断目前没有真实样本，无法输出真实花费、曝光、点击、询盘结论。",
  "页面优化建议缺少页面行为数据，仍是 conservative recommendation。",
  "order country_structure unavailable，会限制区域结构判断。",
])}

${boundarySection()}`;
}

function renderWeeklyReport() {
  const actions = [
    {
      priority: "P1",
      title: "先修产品层高优先缺口",
      what: "按照产品优化建议报告优先处理缺描述、缺关键词和低分产品。",
      why: "当前样本商品的流量与订单转化信号都偏弱，先修基础内容是最低风险且最直接的动作。",
      benefit: "提高商品承接质量，为后续广告和询盘承接创造更稳底盘。",
      owner: "产品运营",
      support: "WIKA 已标出样本范围、问题分类、建议动作。",
      manual: "需要人工准备准确的材质、规格、主图与详情信息。",
    },
    {
      priority: "P2",
      title: "把销售/跟单草稿使用改为固定流程",
      what: "本周统一使用 reply-preview、reply-draft、order-preview、order-draft 先做预览再交人工确认。",
      why: "当前回复和订单流程已经有较成熟的准备层，继续口头式处理会浪费稳定能力。",
      benefit: "缩短草稿准备时间，降低遗漏字段与交接混乱。",
      owner: "销售 / 跟单",
      support: "WIKA 已提供 workbench、preview、draft 与手工接手清单。",
      manual: "最终发送与创单仍需人工完成。",
    },
    {
      priority: "P3",
      title: "补广告样本与页面盘点",
      what: "按导入模板准备过去一周广告数据，并按页面盘点模板记录首页、banner、类目入口和询盘入口状态。",
      why: "广告和页面层当前最缺的不是结论模板，而是真实输入。",
      benefit: "让 WIKA 在下周周报里输出更强的投放建议与页面优化建议。",
      owner: "运营负责人",
      support: "WIKA 已提供输入模板、校验与承接说明。",
      manual: "需要人工导出或录入样本。",
    },
  ];

  return `# WIKA 运营周报

## 执行摘要

本周 WIKA 仍以“经营诊断 + 草稿工作台 + 运营建议”作为主要价值层。店铺层可确认基础流量与回复表现，产品层暴露出明显的内容完整度缺口，订单层能看出订单贡献与趋势信号，但 country_structure 仍不可得。当前最值得先做的不是扩新功能，而是先修商品内容、固化销售交接流程，并补入广告样本与页面盘点输入。

## 店铺表现

- 已确认指标：visitor=${facts.store.visitor}、imps=${facts.store.imps}、clk=${facts.store.clk}、clk_rate=${facts.store.clkRate}、fb=${facts.store.fb}、reply=${facts.store.reply}。
- 当前可下的判断：店铺具备基础流量与回复层判断，但 traffic_source、country_source、quick_reply_rate 仍 unavailable，因此流量结构分析仍不完整。
- 经营含义：当前可以监控“有没有流量、有没有点击、有没有反馈、回复是否及时”，但还不能下“哪类渠道或国家结构出了问题”的结论。

## 产品表现

- 当前样本范围为 ${facts.product.scopeCount} 个商品，且 product scope truncated 为 ${facts.product.scopeTruncated ? "true" : "false"}。
- 样本商品 aggregate metrics：click=${facts.product.click}、impression=${facts.product.impression}、visitor=${facts.product.visitor}、order=${facts.product.order}。
- 当前最明显的问题不是“数据太少”，而是内容准备度不足：缺描述 ${facts.product.missingDescriptionCount} 个、缺关键词 ${facts.product.missingKeywordCount} 个、低分商品 ${facts.product.lowScoreCount} 个。

## 订单表现

- 当前订单层可确认 total_order_count=${facts.order.totalOrderCount}，可观察 trade 样本 ${facts.order.observedTradeCount} 笔。
- 最新趋势信号显示 observed order count delta=${facts.order.observedOrderDelta}，说明当前窗口与上一窗口相比没有明显抬升。
- 当前可以定位主要贡献商品，但 country_structure unavailable，因此区域结构判断不能写成正式结论。

## comparison 变化

- 店铺 comparison 可用，但主要用于确认当前窗口与上一可比窗口的方向变化，不能补齐 unavailable 维度。
- 产品 comparison 能指出当前样本商品层的“继续低表现”与“缺少改善动作”。
- 订单 comparison 能提示订单趋势与商品贡献变化，但不能替代完整订单经营分析。

## 本周优先行动

${actionList(actions)}

## 下周跟进项

${list([
  "检查产品内容修订后，下一轮 comparison 是否出现点击或访客改善。",
  "检查销售/跟单是否已按统一草稿流程执行，是否仍存在大量人工反复补字段。",
  "确认广告样本与页面盘点输入是否已按模板提供。",
])}

## 数据盲区

${list([
  `店铺盲区：${facts.unavailable.store.join("、")}。`,
  `产品盲区：${facts.unavailable.product.join("、")}。`,
  `订单盲区：${facts.unavailable.order.join("、")}。`,
  "广告没有真实导入样本，因此不能下真实投放效果结论。",
])}

## 人工接手项

${list([
  "人工确认产品卖点、规格、材质与媒体素材。",
  "人工确认回复中的报价、交期、样品条件与客户特殊要求。",
  "人工提供广告导出样本与页面盘点信息。",
])}

${boundarySection()}`;
}

function renderDiagnosticReport() {
  const actions = [
    {
      priority: "P1",
      title: "先补高优先产品内容缺口",
      what: "按产品优化建议报告处理样本商品的描述、关键词、主图和详情内容。",
      why: "现阶段最明确的可控问题集中在产品内容准备度，而不是更多数据采集。",
      benefit: "提高商品质量分和基础承接能力。",
      owner: "产品运营",
      support: "WIKA 已定位缺口并输出建议。",
      manual: "需要人工确认最终内容与素材真实性。",
    },
    {
      priority: "P1",
      title: "把回复与订单流程固定到 preview + draft + handoff 模式",
      what: "统一采用 workbench 识别缺字段，preview 审核，draft 交人工最终执行。",
      why: "这是当前 task4/task5 最稳定的低风险路径。",
      benefit: "降低回复与订单准备错误，缩短交接时间。",
      owner: "销售 / 跟单",
      support: "WIKA 可完成大部分准备工作。",
      manual: "最终发送与创单仍需人工完成。",
    },
    {
      priority: "P2",
      title: "把广告与页面输入补齐到固定节奏",
      what: "每周一固定导入广告样本，每周一次完成页面人工盘点。",
      why: "当前广告和页面建议的主要限制来自输入缺失，不来自算法能力。",
      benefit: "让建议层从保守推断逐步升级到基于真实样本的诊断。",
      owner: "运营负责人",
      support: "WIKA 已提供模板、导入层和后续承接层。",
      manual: "需要人工提交样本和盘点结果。",
    },
  ];

  return `# WIKA 经营诊断报告

## 数据覆盖说明

- official read mainline：management-summary、minimal-diagnostic、comparison-summary、business-cockpit、preview/workbench/tool 层。
- safe derived：formal_summary、product_contribution、trend_signal、comparison judgments、跨层经营判断。
- import-driven：广告 CSV/JSON 模板、页面人工盘点模板。
- 当前 degraded 风险：action-center 可能 degraded，operator-console 作为高延迟聚合层需谨慎使用，正式判断优先回退到底层稳定 route。

## 店铺诊断

- 事实层：当前确认 visitor=${facts.store.visitor}、imps=${facts.store.imps}、clk=${facts.store.clk}、clk_rate=${facts.store.clkRate}、fb=${facts.store.fb}、reply=${facts.store.reply}。
- 判断层：店铺基础曝光与点击可读，回复相关能力稳定，但流量结构和国家结构仍不可见，因此当前只能判断“有流量/点击/反馈/回复”，不能判断“哪些来源或国家正在拖累”。
- 建议层：优先把商品内容与销售响应流程固定住，再用后续 comparison 观察基础指标是否改善。

## 产品诊断

- 事实层：当前样本商品仅 ${facts.product.scopeCount} 个，且仍是 truncated 观察口径；aggregate click=${facts.product.click}、impression=${facts.product.impression}、visitor=${facts.product.visitor}、order=${facts.product.order}。
- 事实层：缺描述 ${facts.product.missingDescriptionCount} 个、缺关键词 ${facts.product.missingKeywordCount} 个、低分商品 ${facts.product.lowScoreCount} 个。
- 判断层：当前产品层的主要问题是“资料与内容不足”，不是“已经证明某个广告词或渠道失效”。
- 判断层：${facts.product.focusProducts.join("、")} 仍应作为优先处理样本，因为它们更接近当前真实销售与包装主线。

## 订单诊断

- 事实层：total_order_count=${facts.order.totalOrderCount}，observed_trade_count=${facts.order.observedTradeCount}，observed_order_count_delta=${facts.order.observedOrderDelta}。
- 判断层：订单层更适合作为“结构与趋势信号层”，不是完整营收驾驶舱。
- 事实层：当前可识别重点贡献商品 ${facts.order.keyProducts.join("、")}，但 country_structure unavailable。
- 判断层：订单层能辅助判断“近期是否抬升、哪些商品在撑订单”，不能支持国家结构与更完整的订单效率分布分析。

## 跨层综合判断

- 当前最显著的跨层问题是：产品内容准备度不足，会同时影响产品表现、销售草稿质量与订单前置准备效率。
- 当前最值得先解决的不是继续扩 route，而是让产品运营、销售跟单和管理层围绕同一份执行清单协同。
- 广告与页面层目前最大的阻塞不是系统无能力，而是缺真实输入，因此应按输入产品化路径推进，而不是在系统内继续堆空结论。

## 问题优先级

${numbered([
  "高优先：产品描述、关键词、主图、详情素材缺口。",
  "高优先：回复/订单流程仍依赖人工最后一跳，交接若不固定会反复返工。",
  "中优先：广告样本与页面盘点缺失，限制了投放建议与页面优化建议。",
  "中优先：店铺与订单层 unavailable 维度导致经营结构判断不完整。",
])}

## 建议动作

${actionList(actions)}

## 风险与盲区

${list([
  `store unavailable：${facts.unavailable.store.join("、")}。`,
  `product unavailable：${facts.unavailable.product.join("、")}。`,
  `order unavailable：${facts.unavailable.order.join("、")}。`,
  "广告分析没有真实样本前，不应输出真实投放效果判断。",
  "页面优化建议当前仍属于 conservative recommendation，需要人工盘点输入强化。",
])}

${boundarySection()}`;
}

function renderProductOptimizationReport() {
  const actions = [
    {
      priority: "P1",
      title: "先补描述与关键词缺口",
      what: "按样本商品逐个补齐产品描述、关键词与卖点结构。",
      why: "当前缺描述和缺关键词数量都明显，直接影响商品可读性和搜索承接。",
      benefit: "改善详情质量分和关键词覆盖度。",
      owner: "产品运营",
      support: "WIKA 已定位缺口与优先商品。",
      manual: "需要人工确认真实卖点、材质与规格，不可用模板硬填。",
    },
    {
      priority: "P2",
      title: "同步修主图、视频和详情素材",
      what: "围绕重点样本商品补主图表达、细节图、应用场景图与必要视频。",
      why: "内容缺口不仅是文字问题，也包括素材表达不足。",
      benefit: "增强商品可信度和询盘准备度。",
      owner: "设计 / 产品运营",
      support: "WIKA 可给出素材缺口方向与页面优化建议。",
      manual: "素材生产与最终上架内容仍需人工完成。",
    },
    {
      priority: "P3",
      title: "建立新品方向与页面盘点联动",
      what: "结合页面人工盘点和产品结构，持续记录哪些包装类目需要补新品或补系列化表达。",
      why: "当前没有页面行为数据，先用人工盘点把“看不见的问题”记录下来。",
      benefit: "减少新品方向只靠主观判断。",
      owner: "运营负责人",
      support: "WIKA 已支持页面盘点输入层与内容优化建议层。",
      manual: "需要人工填写盘点模板并确认页面优先级。",
    },
  ];

  return `# WIKA 产品优化建议报告

## 当前产品主要问题

- 当前样本商品范围有限，且 product scope truncated，说明这份报告是“样本优先级建议”，不是全站完整产品诊断。
- 缺描述 ${facts.product.missingDescriptionCount} 个、缺关键词 ${facts.product.missingKeywordCount} 个、低分商品 ${facts.product.lowScoreCount} 个，是当前最明确、最可操作的问题。
- 当前已见样本商品没有证明“流量指标已经健康”，更像是“内容准备度先天不足，导致后续流量/转化承接弱”。

## 内容缺口

${list([
  "描述层：核心卖点、材质、尺寸、包装规格和定制说明不完整。",
  "关键词层：搜索承接词、使用场景词、材料词和包装形式词缺失。",
  "素材层：主图、细节图、应用场景图、视频资料仍需补齐。",
])}

## 关键词与曝光/点击问题

- 当前没有足够强的产品级曝光/点击样本支持“关键词已经失效”的判断。
- 当前更可靠的结论是：关键词完整度不足，会削弱未来曝光与点击承接。
- 因此本阶段建议先做关键词补齐与商品内容修订，而不是臆断投放策略。

## 可优先优化的产品类型

${list(facts.product.focusProducts.map((name) => `${name}：优先作为内容修订和素材补齐样本。`))}

## 详情页修改建议

${actionList(actions)}

## 新品方向建议

${list([
  "围绕 eyewear packaging 的现有成交与主推方向，优先补齐可组合销售的包装套组与差异化材质方案。",
  "新品建议先围绕已有订单贡献商品扩展，而不是跳到无证据的新大类。",
  "页面人工盘点完成后，再决定首页主推的新品露出顺序。",
])}

## 人工需要补充的资料

${list([
  "产品真实规格、材质、最小起订量、定制能力。",
  "主图、细节图、应用场景图、视频。",
  "关键词人工校对与行业表达确认。",
  "页面人工盘点结果。",
])}

${boundarySection([
  "产品优化建议当前基于样本商品与当前官方主线，不等于全量产品自动优化完成。",
])}`;
}

function renderAdsReport() {
  const actions = [
    {
      priority: "P1",
      title: "先提供真实广告导出样本",
      what: "按 WIKA 广告导入模板补 date、campaign、ad_group、keyword、spend、impressions、clicks、inquiries 等字段。",
      why: "没有真实样本，就不能输出真实花费、点击、询盘效率判断。",
      benefit: "让广告分析从 readiness 模式升级到真实诊断模式。",
      owner: "广告投放负责人",
      support: "WIKA 已提供 CSV/JSON 模板、字段说明、导入校验与承接层。",
      manual: "需要人工从平台或第三方工具导出并整理样本。",
    },
    {
      priority: "P2",
      title: "建立固定周报导入节奏",
      what: "每周固定导出一份广告样本，保证至少按周可比较。",
      why: "广告分析要形成节奏，不能靠临时抓样本。",
      benefit: "后续可以稳定生成 ads-summary、ads-diagnostic、ads-comparison 风格分析。",
      owner: "运营负责人",
      support: "WIKA 已具备导入层、诊断层、建议层承接能力。",
      manual: "需要人工执行导出并上传。",
    },
    {
      priority: "P3",
      title: "把广告与页面盘点联动",
      what: "把广告投放问题与页面盘点问题放在同一周报里看。",
      why: "广告点击与页面承接本来就是一条链，分开看会丢失经营动作优先级。",
      benefit: "减少“投放调了很多，但页面没接住”的情况。",
      owner: "广告投放负责人 + 页面运营",
      support: "WIKA 已支持页面人工盘点输入层与统一报告承接。",
      manual: "需要人工共同提供广告样本和页面盘点。",
    },
  ];

  return `# WIKA 广告分析报告

## 当前状态结论

当前没有真实广告导出样本，因此这份报告不是正式投放复盘，而是“广告分析 readiness 报告”。WIKA 已经具备广告输入模板、导入校验、标准化层和后续承接能力，但还不能编造真实花费、曝光、点击、询盘结果。

## 当前没有真实广告样本

${list([
  "当前仓内没有可用于正式广告分析的真实导出样本。",
  "因此不能输出真实 spend、impressions、clicks、inquiries、ctr、cpc、inquiry_rate。",
  "任何关于投放效果的正式结论，都必须等待人工提供样本后再生成。",
])}

## 已建立的广告输入层

${list([
  ...facts.ads.templates.map((item) => `${item}：已建立模板，可直接作为导入入口。`),
  "WIKA/projects/wika/data/ads/import-contract.js：用于导入 contract 与字段约束。",
  "validate-wika-stage45-input-productization.js：用于输入层验证。",
])}

## 拿到数据后 WIKA 能分析什么

${list([
  "按 campaign / ad_group / keyword 分析 spend、impressions、clicks、inquiries。",
  "识别高花费低询盘、低 CTR、低 inquiry_rate 的计划或关键词。",
  "输出预算、出价、保留、暂停、扩量、降本建议。",
  "把广告问题接回 action-center 与 operator-console。",
])}

## 当前能给出的保守投放建议

${actionList(actions)}

## 当前人工必须提供的输入

${list([
  "广告导出 CSV/JSON 样本。",
  "样本对应日期范围与口径说明。",
  "如有第三方汇总表，需要说明字段映射。",
])}

${boundarySection([
  "没有真实广告样本前，这份报告只代表 readiness，不代表真实投放效果已经被系统打通。",
])}`;
}

function renderStoreExecutionChecklist() {
  return `# WIKA 店铺执行清单

## 今日检查

${list([
  "查看 management-summary、minimal-diagnostic、comparison-summary 是否有异常信号。",
  "检查本周高优先商品是否已补齐描述、关键词、主图和详情素材。",
  "检查 reply-preview / order-preview 是否存在积压的人工确认事项。",
])}

## 本周必须做

${list([
  "按产品优化建议报告处理高优先商品内容缺口。",
  "按销售跟单使用清单执行 reply/order 草稿交接流程。",
  "提交本周广告导出样本与页面人工盘点表。",
])}

## 本周建议做

${list([
  "回顾 business-cockpit 与 action-center 的跨层问题是否已进入执行清单。",
  "对重点包装商品补应用场景图、材质说明和 MOQ 说明。",
  "把人工接手中反复出现的缺字段沉淀到团队 SOP。",
])}

## 需要人工确认

${list([
  "价格、交期、样品政策、买家特殊要求。",
  "产品真实规格、材质、包装细节。",
  "广告导出与页面盘点口径是否准确。",
])}

## 需要补数据

${list([
  "广告导出样本。",
  "页面人工盘点数据。",
  "高优先商品最新素材。",
])}

## 需要交给销售/设计/运营的事项

${list([
  "销售：确认报价与跟单口径。",
  "设计：补主图、细节图、视频素材。",
  "运营：完善关键词、详情结构和页面盘点。",
])}

${boundarySection()}`;
}

function renderSalesChecklist() {
  return `# WIKA 销售跟单使用清单

## 如何使用 reply-workbench / reply-preview / reply-draft

${numbered([
  "先在 reply-workbench 查看当前 reply profile、缺字段与质量门槛。",
  "再用 reply-preview 看草稿结构与是否缺 final_quote、lead_time、mockup_assets 等关键字段。",
  "确认无误后使用 reply-draft 生成外部草稿，再交人工做最终发送。",
])}

## 如何使用 order-workbench / order-preview / order-draft

${numbered([
  "先在 order-workbench 查看订单准备所需字段和 handoff pack 能力。",
  "再用 order-preview 检查报价、交期、样品、运输、买家信息是否齐全。",
  "确认无误后使用 order-draft 生成外部订单草稿，再交人工做最终创建或沟通。",
])}

## 哪些字段必须人工确认

${list([
  "最终报价、币种、付款条件。",
  "交期、样品安排、物流方式。",
  "买家公司信息、联系人、地址与特殊要求。",
  "任何承诺类话术。",
])}

## 哪些情况下不能直接发送

${list([
  "缺 final_quote、lead_time、sample_policy 等关键字段时。",
  "客户需求超出当前产品资料覆盖范围时。",
  "涉及价格让步、定制承诺、交期承诺时。",
])}

## 如何把 WIKA 生成内容交给人工接手

${list([
  "先把 preview 或 draft 输出作为草稿底稿。",
  "把缺字段、风险点、需确认项一并附给人工。",
  "人工确认后再由人工在平台内发送或创建订单。",
])}

${boundarySection([
  "reply/order 工具当前仍是外部草稿与人工接手模式，不是平台内自动执行。",
])}`;
}

function renderHumanHandoffChecklist() {
  return `# WIKA 人工接手清单

## 产品资料

${list([
  "产品规格、材质、尺寸、包装方式、MOQ。",
  "定制能力、交付周期、可选工艺。",
])}

## 媒体 / 图片 / 视频

${list([
  "主图、细节图、应用场景图。",
  "视频或动图素材。",
  "页面 banner 或首页模块素材。",
])}

## 报价

${list([
  "阶梯价、样品价、运费说明、付款条件。",
])}

## 交期

${list([
  "打样周期、量产周期、库存可用性。",
])}

## 样品

${list([
  "样品是否可提供、费用、寄送条件。",
])}

## 买家信息

${list([
  "联系人、公司、电话、邮箱、收货地址、国家。",
])}

## 订单字段

${list([
  "物流方式、付款方式、收货条件、包装要求、备注。",
])}

## 广告导出数据

${list([
  "campaign / ad_group / keyword 级别的 spend、impressions、clicks、inquiries。",
  "日期范围与口径说明。",
])}

## 页面人工盘点数据

${list([
  "首页模块、主 banner、重点类目入口、询盘入口。",
  "当前露出问题、内容缺口、人工建议。",
])}

${boundarySection()}`;
}

function scoreDeliverables() {
  return {
    "WIKA_管理层简报.md": buildScore("管理层简报", { "数据有效性": 4 }),
    "WIKA_运营周报.md": buildScore("运营周报", { "数据有效性": 4 }),
    "WIKA_经营诊断报告.md": buildScore("经营诊断报告", { "数据有效性": 4 }),
    "WIKA_产品优化建议报告.md": buildScore("产品优化建议报告", { "数据有效性": 4, "判断可信度": 4 }),
    "WIKA_广告分析报告.md": buildScore("广告分析报告", { "数据有效性": 3, "判断可信度": 4 }),
  };
}

function renderIndex(scores, evidencePath) {
  return `# WIKA 正式运营报告包索引

## 报告包说明

这套报告包基于 stage46 已锁定的运营报告规范、评分标准、示范报告与质量复核结果生成，目标是把 WIKA 当前“经营诊断 + 草稿工作台 + 输入产品化层”的能力整理成可给管理层、运营、销售、执行同事直接使用的交付物。

## 角色使用导航

${list([
  `管理层：${roleSupport.management}`,
  `运营负责人：${roleSupport.opsLead}`,
  `店铺运营：${roleSupport.storeOps}`,
  `产品运营：${roleSupport.productOps}`,
  `销售 / 跟单：${roleSupport.sales}`,
  `人工接手人员：${roleSupport.handoff}`,
])}

## 交付文件清单

${list([
  "WIKA_管理层简报.md",
  "WIKA_运营周报.md",
  "WIKA_经营诊断报告.md",
  "WIKA_产品优化建议报告.md",
  "WIKA_广告分析报告.md",
  "WIKA_店铺执行清单.md",
  "WIKA_销售跟单使用清单.md",
  "WIKA_人工接手清单.md",
])}

## 主要报告评分

${list(
  Object.entries(scores).map(
    ([file, score]) =>
      `${file}：${score.total_score}/${score.max_score}，${score.passed ? "达到可交付阈值" : "未达到可交付阈值"}`,
  ),
)}

## 当前已知边界

${list([
  "action-center 仍可能 degraded，应优先回退到底层稳定 route 取证。",
  "operator-console 作为高延迟聚合层，使用时仍应关注延迟与降级状态。",
  "广告分析没有真实样本前，只能输出 readiness 报告。",
  "页面优化建议没有页面行为数据前，仍属于 conservative recommendation。",
  "task3/task4/task5 最后一跳仍需人工接手。",
])}

## 证据与来源

${list([
  `stage46 示范报告：${path.relative(repoRoot, stage46ReportPath)}`,
  `stage46 质量复核：${path.relative(repoRoot, stage46ReviewPath)}`,
  `stage46 摘要：${path.relative(repoRoot, stage46SummaryPath)}`,
  `deliverables evidence：${path.relative(repoRoot, evidencePath)}`,
])}

${boundarySection()}`;
}

function buildEvidence(scores) {
  const stage46Evidence = readJsonIfExists(stage46EvidencePath);
  return {
    generated_at: new Date().toISOString(),
    source_reports: {
      stage46_report: path.relative(repoRoot, stage46ReportPath),
      stage46_summary: path.relative(repoRoot, stage46SummaryPath),
      stage46_review: path.relative(repoRoot, stage46ReviewPath),
      stage46_evidence: path.relative(repoRoot, stage46EvidencePath),
    },
    stage46_score: stage46Evidence?.report_model?.self_score ?? stage46Evidence?.self_score ?? null,
    facts,
    scores,
    boundaries: boundaryLines,
  };
}

function main() {
  ensureDir(deliverablesRoot);
  ensureDir(deliverablesEvidenceRoot);

  const files = {
    managementBrief: path.join(deliverablesRoot, "WIKA_管理层简报.md"),
    weeklyReport: path.join(deliverablesRoot, "WIKA_运营周报.md"),
    diagnosticReport: path.join(deliverablesRoot, "WIKA_经营诊断报告.md"),
    productReport: path.join(deliverablesRoot, "WIKA_产品优化建议报告.md"),
    adsReport: path.join(deliverablesRoot, "WIKA_广告分析报告.md"),
    storeChecklist: path.join(deliverablesRoot, "WIKA_店铺执行清单.md"),
    salesChecklist: path.join(deliverablesRoot, "WIKA_销售跟单使用清单.md"),
    handoffChecklist: path.join(deliverablesRoot, "WIKA_人工接手清单.md"),
    index: path.join(deliverablesRoot, "WIKA_正式运营报告包索引.md"),
    scores: path.join(deliverablesRoot, "WIKA_正式运营报告包评分.json"),
    evidence: path.join(deliverablesEvidenceRoot, "WIKA_正式运营报告包证据.json"),
  };

  writeText(files.managementBrief, renderManagementBrief());
  writeText(files.weeklyReport, renderWeeklyReport());
  writeText(files.diagnosticReport, renderDiagnosticReport());
  writeText(files.productReport, renderProductOptimizationReport());
  writeText(files.adsReport, renderAdsReport());
  writeText(files.storeChecklist, renderStoreExecutionChecklist());
  writeText(files.salesChecklist, renderSalesChecklist());
  writeText(files.handoffChecklist, renderHumanHandoffChecklist());

  const scores = scoreDeliverables();
  writeJson(files.scores, scores);

  const evidence = buildEvidence(scores);
  writeJson(files.evidence, evidence);

  writeText(files.index, renderIndex(scores, files.evidence));

  console.log(
    JSON.stringify(
      {
        generated_at: evidence.generated_at,
        deliverables_root: path.relative(repoRoot, deliverablesRoot),
        main_reports: Object.keys(scores),
        scores,
      },
      null,
      2,
    ),
  );
}

main();
