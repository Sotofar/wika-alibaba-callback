import fs from "node:fs";
import path from "node:path";
import { createTask } from "../projects/wika/data/tasks/ops-task-model.js";
import { sortTasks, summarizeTasks } from "../projects/wika/data/tasks/ops-task-prioritizer.js";
import { renderDashboard, renderIndex, renderTaskList, scoreTaskPackage } from "../projects/wika/data/tasks/ops-task-writer.js";

const repoRoot = process.cwd();
const deliverablesRoot = path.join(repoRoot, "WIKA", "docs", "reports", "deliverables");
const tasksRoot = path.join(repoRoot, "WIKA", "docs", "tasks");
const sourceEvidence = "WIKA/docs/reports/deliverables/evidence/WIKA_正式运营报告包证据.json";

const inputFiles = [
  "WIKA_管理层简报.md",
  "WIKA_运营周报.md",
  "WIKA_经营诊断报告.md",
  "WIKA_产品优化建议报告.md",
  "WIKA_广告分析报告.md",
  "WIKA_店铺执行清单.md",
  "WIKA_销售跟单使用清单.md",
  "WIKA_人工接手清单.md",
  "WIKA_正式运营报告包评分.json",
  path.join("evidence", "WIKA_正式运营报告包证据.json"),
];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeText(filePath, content) {
  fs.writeFileSync(filePath, `${content.trim()}\n`, "utf8");
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function readRequiredInputs() {
  return Object.fromEntries(
    inputFiles.map((file) => {
      const absolutePath = path.join(deliverablesRoot, file);
      if (!fs.existsSync(absolutePath)) {
        throw new Error(`缺少 stage47 输入文件: ${absolutePath}`);
      }
      const text = fs.readFileSync(absolutePath, "utf8");
      if (!text.trim()) {
        throw new Error(`stage47 输入文件为空: ${absolutePath}`);
      }
      return [file, text];
    }),
  );
}

function source(fileName) {
  return `WIKA/docs/reports/deliverables/${fileName}`;
}

function boundary() {
  return [
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
}

function buildTasks() {
  const tasks = [
    {
      task_id: "MGMT-P1-001",
      task_title: "拍板本周三件优先事项",
      task_type: "decision",
      priority: "P1",
      owner_role: "老板/管理层",
      business_task_scope: "通用运营",
      source_report: source("WIKA_管理层简报.md"),
      source_evidence: sourceEvidence,
      why_it_matters: "stage47 报告包已经把问题收敛为产品内容、销售交接、广告与页面输入三条主线；如果管理层不拍板，执行会继续分散。",
      expected_impact: "把团队注意力集中到本周最能产生经营收益的动作上，减少泛泛优化和重复讨论。",
      wika_support_level: "mostly_supported_needs_human_confirm",
      manual_input_required: true,
      required_inputs: ["管理层确认本周资源优先级", "确认产品运营、销售/跟单、店铺运营负责人"],
      execution_steps: [
        "确认 P1 为产品内容补强、销售草稿 SOP、广告与页面输入补齐。",
        "指定每条主线的负责人和本周交付时间。",
        "要求运营负责人按任务总看板回填执行状态。",
      ],
      acceptance_criteria: [
        "三条优先事项均有明确负责人。",
        "每条事项均有本周完成窗口。",
        "没有把 task3/task4/task5 写成平台内自动执行闭环。",
      ],
      due_window: "今天",
      risk_if_not_done: "团队会继续把报告当资料看，而不是转成执行动作。",
      blocked_by: [],
      boundary_statement: boundary(),
    },
    {
      task_id: "OPS-P1-001",
      task_title: "把报告包拆成一周执行排期",
      task_type: "schedule",
      priority: "P1",
      owner_role: "运营负责人",
      business_task_scope: "通用运营",
      source_report: source("WIKA_运营周报.md"),
      source_evidence: sourceEvidence,
      why_it_matters: "运营周报已经给出本周优先动作，但需要落到具体人、日期和验收标准，否则仍停留在阅读层。",
      expected_impact: "形成本周可跟踪的执行计划，避免老板、运营、销售各自理解不一致。",
      wika_support_level: "mostly_supported_needs_human_confirm",
      manual_input_required: true,
      required_inputs: ["本周团队可用人力", "各角色负责人名单", "本周可执行时间窗口"],
      execution_steps: [
        "按本任务包 P1/P2/P3 建立本周排期。",
        "把产品、广告、页面、销售、人工接手任务分别指派给对应角色。",
        "每天检查 P1 任务状态，周末复盘 P2 和 P3 是否需要升级。",
      ],
      acceptance_criteria: [
        "P1 任务全部有负责人和截止时间。",
        "P2 任务有明确本周推进节点。",
        "blocked 任务均写明外部输入来源。",
      ],
      due_window: "今天",
      risk_if_not_done: "报告包无法转化为实际运营节奏。",
      blocked_by: [],
      boundary_statement: boundary(),
    },
    {
      task_id: "STORE-P1-001",
      task_title: "建立每日店铺经营检查",
      task_type: "store_daily_check",
      priority: "P1",
      owner_role: "店铺运营",
      business_task_scope: "任务1/任务2",
      source_report: source("WIKA_店铺执行清单.md"),
      source_evidence: sourceEvidence,
      why_it_matters: "WIKA 已能读取店铺、产品、订单三层摘要与诊断，必须把这些能力变成每日检查动作。",
      expected_impact: "及时发现流量、点击、反馈、订单和工作台交接异常。",
      wika_support_level: "mostly_supported_needs_human_confirm",
      manual_input_required: true,
      required_inputs: ["每日检查人", "异常记录表", "需要人工确认的异常阈值"],
      execution_steps: [
        "每天查看 business-cockpit、management-summary、minimal-diagnostic、comparison-summary。",
        "若 action-center 或 operator-console degraded，回到底层稳定 route 查证。",
        "把异常项登记到运营负责人排期清单。",
      ],
      acceptance_criteria: [
        "每日检查记录不少于 1 条。",
        "异常项均有来源 route 或报告章节。",
        "degraded route 没有被写成 full success。",
      ],
      due_window: "每日",
      risk_if_not_done: "线上经营变化无法进入团队执行节奏。",
      blocked_by: [],
      boundary_statement: boundary(),
    },
    {
      task_id: "PROD-P1-001",
      task_title: "补齐高优先级产品内容缺口",
      task_type: "product_optimization",
      priority: "P1",
      owner_role: "产品运营",
      business_task_scope: "任务3",
      source_report: source("WIKA_产品优化建议报告.md"),
      source_evidence: sourceEvidence,
      why_it_matters: "报告指出产品层仍有描述、关键词、素材和低分商品问题，这是当前最可控的转化基础动作。",
      expected_impact: "提升产品承接质量，为后续曝光、点击和询盘承接提供更稳定底盘。",
      wika_support_level: "mostly_supported_needs_human_confirm",
      manual_input_required: true,
      required_inputs: ["产品规格", "材质", "MOQ", "定制能力", "主图", "详情图", "视频素材"],
      execution_steps: [
        "按产品优化建议报告列出优先处理产品。",
        "先补描述、关键词、主图和详情结构。",
        "使用 product-draft-workbench / product-draft-preview 做安全草稿准备。",
        "人工确认后再进入平台内处理，不由 WIKA 直接发布。",
      ],
      acceptance_criteria: [
        "优先产品均完成描述和关键词补齐。",
        "每个产品都有人工确认过的主图或详情素材计划。",
        "未把 preview 写成平台内发布成功。",
      ],
      due_window: "本周",
      risk_if_not_done: "产品内容继续拖累曝光承接和询盘转化。",
      blocked_by: [],
      boundary_statement: boundary(),
    },
    {
      task_id: "SALES-P1-001",
      task_title: "统一 reply/order 草稿人工确认流程",
      task_type: "sales_handoff",
      priority: "P1",
      owner_role: "销售/跟单",
      business_task_scope: "任务4/任务5",
      source_report: source("WIKA_销售跟单使用清单.md"),
      source_evidence: sourceEvidence,
      why_it_matters: "WIKA 已能生成回复和订单外部草稿，但最后发送和创单仍必须人工确认。",
      expected_impact: "减少重复整理字段和草稿时间，同时避免无隔离写侧风险。",
      wika_support_level: "preview_or_handoff_only",
      manual_input_required: true,
      required_inputs: ["最终报价", "交期", "样品政策", "买家信息", "订单字段"],
      execution_steps: [
        "先用 reply-workbench / reply-preview 检查回复草稿条件。",
        "再用 reply-draft 生成外部草稿并交人工确认。",
        "订单相关先用 order-workbench / order-preview 检查字段，再用 order-draft 生成外部草稿。",
        "所有平台内发送或创单动作均由人工完成。",
      ],
      acceptance_criteria: [
        "每次回复或订单草稿都有人工确认记录。",
        "缺字段时不得直接发送或创单。",
        "没有把外部草稿写成平台内执行成功。",
      ],
      due_window: "每日",
      risk_if_not_done: "销售继续手工整理，且容易漏掉报价、交期、样品等关键字段。",
      blocked_by: [],
      boundary_statement: boundary(),
    },
    {
      task_id: "HANDOFF-P1-001",
      task_title: "补齐报价、交期、样品和买家关键字段",
      task_type: "manual_field_completion",
      priority: "P1",
      owner_role: "人工接手人员",
      business_task_scope: "任务4/任务5",
      source_report: source("WIKA_人工接手清单.md"),
      source_evidence: sourceEvidence,
      why_it_matters: "这些字段决定回复和订单草稿能否进入人工确认，WIKA 不能替代真实商业承诺。",
      expected_impact: "让 reply/order 草稿从准备层更快进入可人工确认状态。",
      wika_support_level: "manual_only",
      manual_input_required: true,
      required_inputs: ["报价", "交期", "样品安排", "买家联系人", "订单备注"],
      execution_steps: [
        "按人工接手清单逐项补齐产品、报价、交期、样品、买家、订单字段。",
        "把补齐结果回填到销售/跟单任务清单。",
        "由销售/跟单最终确认是否可发送或创单。",
      ],
      acceptance_criteria: [
        "P1 草稿所需关键字段全部补齐。",
        "每个字段都有人工来源或负责人。",
        "WIKA 未被用于替代人工商业承诺。",
      ],
      due_window: "今天至本周",
      risk_if_not_done: "reply/order 草稿会卡在 handoff 层，无法进入人工执行。",
      blocked_by: [],
      boundary_statement: boundary(),
    },
    {
      task_id: "ADS-P1-001",
      task_title: "导出真实广告样本",
      task_type: "ads_input",
      priority: "P1",
      owner_role: "运营负责人",
      business_task_scope: "输入层",
      source_report: source("WIKA_广告分析报告.md"),
      source_evidence: sourceEvidence,
      why_it_matters: "广告分析报告明确当前没有真实广告样本，不能编造花费、曝光、点击和询盘。",
      expected_impact: "拿到样本后，WIKA 可进入真实广告诊断与投放建议模式。",
      wika_support_level: "manual_only",
      manual_input_required: true,
      required_inputs: ["date", "campaign_name", "ad_group_name", "keyword", "spend", "impressions", "clicks", "inquiries"],
      execution_steps: [
        "按广告导入模板从平台或第三方报表导出一周样本。",
        "检查字段是否覆盖最低必填列。",
        "交给 WIKA 广告导入层做校验和标准化。",
      ],
      acceptance_criteria: [
        "样本文件存在且字段完整。",
        "样本时间范围明确。",
        "广告报告未在无样本情况下输出真实投放效果结论。",
      ],
      due_window: "本周",
      risk_if_not_done: "广告分析只能停留在 readiness，不能进入真实投放复盘。",
      blocked_by: ["缺真实广告导出样本"],
      boundary_statement: boundary(),
    },
    {
      task_id: "PAGE-P1-001",
      task_title: "完成首页与重点页面人工盘点",
      task_type: "page_audit",
      priority: "P1",
      owner_role: "店铺运营",
      business_task_scope: "输入层",
      source_report: source("WIKA_店铺执行清单.md"),
      source_evidence: sourceEvidence,
      why_it_matters: "页面优化建议当前缺少真实页面行为数据，只能依赖人工盘点增强判断。",
      expected_impact: "让页面优化建议从保守建议变成基于人工观察证据的执行建议。",
      wika_support_level: "manual_only",
      manual_input_required: true,
      required_inputs: ["首页模块", "主 banner", "重点类目入口", "询盘入口", "B2B 信任信息", "当前观察问题"],
      execution_steps: [
        "按页面人工盘点模板检查首页和重点页面。",
        "记录每个模块的问题、建议和负责人。",
        "把盘点结果交给产品运营和设计执行。",
      ],
      acceptance_criteria: [
        "页面盘点表覆盖首页模块、banner、类目入口和询盘入口。",
        "每个问题均有人工建议。",
        "没有把人工盘点写成官方页面行为数据。",
      ],
      due_window: "本周",
      risk_if_not_done: "页面优化建议继续缺少可执行证据。",
      blocked_by: ["缺页面人工盘点输入"],
      boundary_statement: boundary(),
    },
    {
      task_id: "OPS-P2-001",
      task_title: "建立每周报告到任务包的固定节奏",
      task_type: "process",
      priority: "P2",
      owner_role: "运营负责人",
      business_task_scope: "通用运营",
      source_report: source("WIKA_运营周报.md"),
      source_evidence: sourceEvidence,
      why_it_matters: "stage47 报告包已经可读，但必须固定转任务节奏，才能持续变成执行。",
      expected_impact: "形成周报、任务包、验收、复盘的闭环节奏。",
      wika_support_level: "mostly_supported_needs_human_confirm",
      manual_input_required: true,
      required_inputs: ["每周报告生成时间", "任务负责人", "复盘时间"],
      execution_steps: [
        "每周先生成正式运营报告包。",
        "再生成运营任务包。",
        "周中检查 P1，周末复盘 P2/P3。",
      ],
      acceptance_criteria: [
        "每周至少生成一次任务看板。",
        "P1 任务有跟踪状态。",
        "未完成项有原因和下一步。",
      ],
      due_window: "本周",
      risk_if_not_done: "报告和执行脱节。",
      blocked_by: [],
      boundary_statement: boundary(),
    },
    {
      task_id: "PROD-P2-001",
      task_title: "补齐产品媒体与详情页素材",
      task_type: "product_media",
      priority: "P2",
      owner_role: "产品运营",
      business_task_scope: "任务3",
      source_report: source("WIKA_产品优化建议报告.md"),
      source_evidence: sourceEvidence,
      why_it_matters: "产品内容优化不只是文案，主图、细节图、视频和详情结构会影响询盘信任。",
      expected_impact: "提高商品信息完整度和 B2B 买家判断效率。",
      wika_support_level: "mostly_supported_needs_human_confirm",
      manual_input_required: true,
      required_inputs: ["主图", "细节图", "应用场景图", "视频", "详情页结构"],
      execution_steps: [
        "按产品优先级列出缺素材产品。",
        "把缺失素材交给设计或产品负责人补齐。",
        "用 product-draft-preview 检查草稿完整度。",
      ],
      acceptance_criteria: [
        "每个优先产品至少有主图和详情补齐计划。",
        "素材经过人工确认。",
        "草稿只停留在准备层，不写成发布成功。",
      ],
      due_window: "本周",
      risk_if_not_done: "产品优化只停留在文本层，无法支撑高质量询盘。",
      blocked_by: [],
      boundary_statement: boundary(),
    },
    {
      task_id: "STORE-P2-001",
      task_title: "检查首页模块、banner、类目入口和询盘入口",
      task_type: "page_audit",
      priority: "P2",
      owner_role: "店铺运营",
      business_task_scope: "输入层",
      source_report: source("WIKA_店铺执行清单.md"),
      source_evidence: sourceEvidence,
      why_it_matters: "页面是广告、产品和询盘之间的承接层，人工盘点能补足当前缺少页面行为数据的盲区。",
      expected_impact: "减少页面承接断点，提高重点产品和询盘入口的可见性。",
      wika_support_level: "manual_only",
      manual_input_required: true,
      required_inputs: ["页面截图或盘点记录", "模块名称", "问题描述", "建议动作"],
      execution_steps: [
        "检查首页首屏和主 banner 是否突出重点产品。",
        "检查类目入口和询盘入口是否清晰。",
        "把页面问题记录到页面人工盘点任务清单。",
      ],
      acceptance_criteria: [
        "盘点记录覆盖所有指定模块。",
        "每个问题都有建议动作和负责人。",
        "不把盘点结果写成官方行为数据。",
      ],
      due_window: "本周",
      risk_if_not_done: "内容优化和广告投放难以判断页面是否接住流量。",
      blocked_by: [],
      boundary_statement: boundary(),
    },
    {
      task_id: "SALES-P2-001",
      task_title: "沉淀高频询盘回复模板",
      task_type: "reply_template",
      priority: "P2",
      owner_role: "销售/跟单",
      business_task_scope: "任务4",
      source_report: source("WIKA_销售跟单使用清单.md"),
      source_evidence: sourceEvidence,
      why_it_matters: "reply-draft 可生成外部草稿，但高频问题仍需要团队统一口径。",
      expected_impact: "提高回复一致性，降低人工重复编辑时间。",
      wika_support_level: "preview_or_handoff_only",
      manual_input_required: true,
      required_inputs: ["高频问题列表", "标准报价说明", "交期说明", "样品政策"],
      execution_steps: [
        "从最近询盘中整理高频问题。",
        "使用 reply-draft 生成外部草稿底稿。",
        "人工确认后沉淀为团队模板。",
      ],
      acceptance_criteria: [
        "至少沉淀 5 条高频回复模板。",
        "模板经过销售负责人确认。",
        "没有自动平台内发送。",
      ],
      due_window: "本周",
      risk_if_not_done: "销售回复口径继续不统一。",
      blocked_by: [],
      boundary_statement: boundary(),
    },
    {
      task_id: "ADS-P2-001",
      task_title: "固定广告样本导入节奏",
      task_type: "ads_input",
      priority: "P2",
      owner_role: "运营负责人",
      business_task_scope: "输入层",
      source_report: source("WIKA_广告分析报告.md"),
      source_evidence: sourceEvidence,
      why_it_matters: "一次性样本只能支持单次判断，固定节奏才能支持 comparison 和投放复盘。",
      expected_impact: "让广告分析层形成周度趋势判断能力。",
      wika_support_level: "manual_only",
      manual_input_required: true,
      required_inputs: ["每周广告导出", "字段映射说明", "导入责任人"],
      execution_steps: [
        "约定每周固定导出时间。",
        "使用广告导入模板检查字段。",
        "将导入结果纳入下周运营报告。",
      ],
      acceptance_criteria: [
        "广告样本导入节奏明确。",
        "字段缺失时有补充责任人。",
        "未将导入层写成官方广告 API 已打通。",
      ],
      due_window: "7–30 天",
      risk_if_not_done: "广告分析无法持续化。",
      blocked_by: ["缺稳定广告导入承接节奏"],
      boundary_statement: boundary(),
    },
    {
      task_id: "PAGE-P2-001",
      task_title: "建立页面问题记录与整改闭环",
      task_type: "page_audit",
      priority: "P2",
      owner_role: "店铺运营",
      business_task_scope: "输入层",
      source_report: source("WIKA_店铺执行清单.md"),
      source_evidence: sourceEvidence,
      why_it_matters: "人工盘点如果没有闭环，就会变成一次性记录，无法支撑页面优化建议。",
      expected_impact: "把页面问题从观察转为整改任务。",
      wika_support_level: "manual_only",
      manual_input_required: true,
      required_inputs: ["问题截图", "整改建议", "负责人", "完成时间"],
      execution_steps: [
        "将页面盘点问题整理成列表。",
        "给每个问题指定负责人。",
        "下周复盘是否已处理。",
      ],
      acceptance_criteria: [
        "每个页面问题都有负责人和处理状态。",
        "整改结果可追溯。",
        "仍明确这是人工盘点输入。",
      ],
      due_window: "本周",
      risk_if_not_done: "页面优化建议无法转成实际修改。",
      blocked_by: [],
      boundary_statement: boundary(),
    },
    {
      task_id: "MGMT-P3-001",
      task_title: "决定是否投入广告数据长期归集",
      task_type: "decision",
      priority: "P3",
      owner_role: "老板/管理层",
      business_task_scope: "输入层",
      source_report: source("WIKA_广告分析报告.md"),
      source_evidence: sourceEvidence,
      why_it_matters: "广告层当前最大阻塞是样本输入，不是代码；是否长期做，需要管理层明确投入。",
      expected_impact: "决定广告分析是否从 readiness 进入持续运营能力。",
      wika_support_level: "manual_only",
      manual_input_required: true,
      required_inputs: ["广告投入目标", "导出责任人", "周度复盘机制"],
      execution_steps: [
        "评估广告数据归集是否纳入固定运营流程。",
        "决定由谁每周导出和校验。",
        "确认是否把广告分析纳入月度复盘。",
      ],
      acceptance_criteria: [
        "是否长期归集有明确结论。",
        "若继续，明确负责人和节奏。",
        "若不继续，广告报告保持 readiness 口径。",
      ],
      due_window: "后续跟进",
      risk_if_not_done: "广告分析能力会停留在模板层。",
      blocked_by: ["需要管理层资源决策"],
      boundary_statement: boundary(),
    },
    {
      task_id: "PROD-P3-001",
      task_title: "基于现有订单贡献整理新品方向",
      task_type: "new_product_direction",
      priority: "P3",
      owner_role: "产品运营",
      business_task_scope: "任务3",
      source_report: source("WIKA_产品优化建议报告.md"),
      source_evidence: sourceEvidence,
      why_it_matters: "新品建议应基于已有产品贡献和可见需求，不应跳到无证据大类。",
      expected_impact: "形成更稳妥的新产品补充方向。",
      wika_support_level: "mostly_supported_needs_human_confirm",
      manual_input_required: true,
      required_inputs: ["现有订单贡献产品", "产品利润判断", "供应链可行性"],
      execution_steps: [
        "从订单贡献和重点产品中整理候选新品方向。",
        "人工确认供应链和利润空间。",
        "进入产品安全草稿准备层。",
      ],
      acceptance_criteria: [
        "新品方向均有来源产品或订单信号。",
        "供应链可行性经过人工确认。",
        "未把新品建议写成自动上架。",
      ],
      due_window: "30 天以上",
      risk_if_not_done: "新品动作可能脱离当前真实业务信号。",
      blocked_by: [],
      boundary_statement: boundary(),
    },
    {
      task_id: "OPS-P3-001",
      task_title: "复盘 WIKA 工作替代比例",
      task_type: "process",
      priority: "P3",
      owner_role: "运营负责人",
      business_task_scope: "通用运营",
      source_report: source("WIKA_正式运营报告包索引.md"),
      source_evidence: sourceEvidence,
      why_it_matters: "当前 WIKA 能替代大量整理、诊断、草稿准备工作，但最后一跳仍需人工，需要持续量化。",
      expected_impact: "让团队知道哪些工作可交给 WIKA，哪些必须人工接手。",
      wika_support_level: "mostly_supported_needs_human_confirm",
      manual_input_required: true,
      required_inputs: ["本周实际使用记录", "人工接手耗时", "WIKA 输出被采纳比例"],
      execution_steps: [
        "统计本周 WIKA 报告、工作台、预览、草稿使用次数。",
        "记录人工确认和修改耗时。",
        "下周调整任务包优先级。",
      ],
      acceptance_criteria: [
        "形成一份本周 WIKA 使用复盘。",
        "明确可完全交给 WIKA 的工作和必须人工确认的工作。",
        "未把 WIKA 写成完整业务闭环。",
      ],
      due_window: "后续跟进",
      risk_if_not_done: "团队无法判断自动化真实价值。",
      blocked_by: [],
      boundary_statement: boundary(),
    },
    {
      task_id: "BLOCK-P3-001",
      task_title: "保留官方缺失维度为 blocked",
      task_type: "blocked_dimension",
      priority: "P3",
      owner_role: "运营负责人",
      business_task_scope: "任务1/任务2",
      source_report: source("WIKA_经营诊断报告.md"),
      source_evidence: sourceEvidence,
      why_it_matters: "traffic_source、country_source、quick_reply_rate、access_source、inquiry_source、country_structure 等仍不可得，不能在任务包里静默省略。",
      expected_impact: "避免把当前诊断误读成完整经营驾驶舱。",
      wika_support_level: "blocked",
      manual_input_required: false,
      required_inputs: ["官方字段能力", "稳定参数契约", "真实返回样本"],
      execution_steps: [
        "在任务看板中保留 blocked 维度。",
        "不基于这些字段生成强结论。",
        "只有外部权限或官方稳定入口出现时再重开。",
      ],
      acceptance_criteria: [
        "所有 unavailable 维度均在 blocked 区出现。",
        "没有用推断替代 official fact。",
        "没有新增 API 探索。",
      ],
      due_window: "外部条件到位后",
      risk_if_not_done: "业务方可能误以为当前报告覆盖了全部经营维度。",
      blocked_by: ["缺 official 字段", "缺稳定参数契约", "缺真实返回样本"],
      boundary_statement: boundary(),
    },
    {
      task_id: "BLOCK-P3-002",
      task_title: "保留 task3/task4/task5 写侧最后一跳为人工",
      task_type: "blocked_write_boundary",
      priority: "P3",
      owner_role: "人工接手人员",
      business_task_scope: "任务3/任务4/任务5",
      source_report: source("WIKA_人工接手清单.md"),
      source_evidence: sourceEvidence,
      why_it_matters: "当前缺测试对象、rollback、readback 或官方 direct candidate，不允许把 preview/workbench 写成平台内执行。",
      expected_impact: "确保低风险边界不被误穿透。",
      wika_support_level: "blocked",
      manual_input_required: true,
      required_inputs: ["测试对象", "rollback/cleanup 路径", "readback 路径", "官方文档与参数契约"],
      execution_steps: [
        "继续把 task3/task4/task5 保持在外部草稿和人工接手模式。",
        "任何平台内执行都必须先补齐安全前置条件。",
        "在任务包中明确最后一跳由人工完成。",
      ],
      acceptance_criteria: [
        "没有出现自动发布、自动回复、自动创单表述。",
        "人工接手项清楚列出。",
        "写侧阻塞条件清楚列出。",
      ],
      due_window: "外部条件到位后",
      risk_if_not_done: "可能误触写侧或造成业务风险。",
      blocked_by: ["缺测试对象", "缺 rollback/cleanup", "缺 stable readback"],
      boundary_statement: boundary(),
    },
  ];

  return tasks.map(createTask);
}

function writeOutputs(tasks) {
  ensureDir(tasksRoot);
  const sorted = sortTasks(tasks);
  const summary = summarizeTasks(sorted);
  const score = scoreTaskPackage(sorted);

  if (!score.passed) {
    throw new Error(`任务包评分未达标: ${score.total_score}/40, vetoes=${score.vetoes.join(", ")}`);
  }

  const byOwner = (owner) => sorted.filter((task) => task.owner_role === owner);
  const byType = (types) => sorted.filter((task) => types.includes(task.task_type));

  const files = {
    dashboard: path.join(tasksRoot, "WIKA_运营任务总看板.md"),
    management: path.join(tasksRoot, "WIKA_老板管理层任务清单.md"),
    opsLead: path.join(tasksRoot, "WIKA_运营负责人任务清单.md"),
    storeOps: path.join(tasksRoot, "WIKA_店铺运营任务清单.md"),
    productOps: path.join(tasksRoot, "WIKA_产品运营任务清单.md"),
    ads: path.join(tasksRoot, "WIKA_广告数据补充任务清单.md"),
    pageAudit: path.join(tasksRoot, "WIKA_页面人工盘点任务清单.md"),
    sales: path.join(tasksRoot, "WIKA_销售跟单任务清单.md"),
    handoff: path.join(tasksRoot, "WIKA_人工接手字段补齐清单.md"),
    index: path.join(tasksRoot, "WIKA_运营任务包索引.md"),
    json: path.join(tasksRoot, "WIKA_运营任务包.json"),
    summary: path.join(tasksRoot, "WIKA_运营任务包摘要.json"),
    score: path.join(tasksRoot, "WIKA_运营任务包评分.json"),
  };

  writeText(files.dashboard, renderDashboard(sorted, summary));
  writeText(files.management, renderTaskList("WIKA 老板管理层任务清单", byOwner("老板/管理层"), "用于老板 / 管理层拍板本周优先事项、资源协调和外部条件推进。"));
  writeText(files.opsLead, renderTaskList("WIKA 运营负责人任务清单", byOwner("运营负责人"), "用于运营负责人把 stage47 报告包转成排期、分工和复盘节奏。"));
  writeText(files.storeOps, renderTaskList("WIKA 店铺运营任务清单", byOwner("店铺运营"), "用于店铺运营执行每日检查、页面盘点和店铺层动作。"));
  writeText(files.productOps, renderTaskList("WIKA 产品运营任务清单", byOwner("产品运营"), "用于产品运营补齐标题、关键词、详情、图片、视频和新品方向。"));
  writeText(files.ads, renderTaskList("WIKA 广告数据补充任务清单", byType(["ads_input"]), "用于补齐真实广告导出样本，让广告分析从 readiness 进入真实诊断。"));
  writeText(files.pageAudit, renderTaskList("WIKA 页面人工盘点任务清单", byType(["page_audit"]), "用于把页面人工观察转成页面优化建议输入。"));
  writeText(files.sales, renderTaskList("WIKA 销售跟单任务清单", byOwner("销售/跟单"), "用于销售 / 跟单使用 reply/order workbench、preview 与 draft，但最后一跳仍由人工执行。"));
  writeText(files.handoff, renderTaskList("WIKA 人工接手字段补齐清单", byOwner("人工接手人员"), "用于汇总必须人工补齐、人工确认或外部条件到位的字段和边界。"));
  writeText(files.index, renderIndex(sorted, summary, score));
  writeJson(files.json, { generated_at: new Date().toISOString(), tasks: sorted });
  writeJson(files.summary, summary);
  writeJson(files.score, score);

  return { files, summary, score };
}

function main() {
  readRequiredInputs();
  const tasks = buildTasks();
  const result = writeOutputs(tasks);
  console.log(JSON.stringify({
    generated_at: new Date().toISOString(),
    tasks_root: path.relative(repoRoot, tasksRoot),
    total_tasks: result.summary.total_tasks,
    priority_distribution: result.summary.priority_distribution,
    role_distribution: result.summary.role_distribution,
    score: `${result.score.total_score}/${result.score.max_score}`,
    passed: result.score.passed,
  }, null, 2));
}

main();
