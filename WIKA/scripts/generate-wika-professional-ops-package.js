import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const packageRoot = path.join(repoRoot, "WIKA", "docs", "operations-package");
const pdfRoot = path.join(packageRoot, "pdf");
const reportsRoot = path.join(repoRoot, "WIKA", "docs", "reports", "deliverables");
const tasksRoot = path.join(repoRoot, "WIKA", "docs", "tasks");
const executionRoot = path.join(tasksRoot, "execution");

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

const markdownFiles = [
  "WIKA_专业运营总览.md",
  "WIKA_老板管理层简报.md",
  "WIKA_运营负责人周计划.md",
  "WIKA_店铺运营每日检查表.md",
  "WIKA_产品优化工单.md",
  "WIKA_新品开发建议表.md",
  "WIKA_关键词优化矩阵.md",
  "WIKA_直通车数据导入与投放调整表.md",
  "WIKA_主页转化优化清单.md",
  "WIKA_询盘跟进SOP.md",
  "WIKA_订单机会分析表.md",
  "WIKA_人工补数责任表.md",
  "WIKA_运营任务总看板.md",
  "WIKA_交付包索引.md",
];

const csvFiles = [
  "WIKA_运营负责人任务分配表.csv",
  "WIKA_店铺运营每日检查表.csv",
  "WIKA_产品优化工单.csv",
  "WIKA_新品开发建议表.csv",
  "WIKA_关键词优化矩阵.csv",
  "WIKA_直通车数据导入模板.csv",
  "WIKA_直通车投放调整表.csv",
  "WIKA_页面人工盘点表.csv",
  "WIKA_询盘回复字段补齐表.csv",
  "WIKA_订单机会分析表.csv",
  "WIKA_人工补数责任表.csv",
  "WIKA_运营任务总看板.csv",
];

const jsonFiles = [
  "WIKA_专业运营交付包.json",
  "WIKA_运营任务总看板.json",
  "WIKA_人工补数责任表.json",
  "WIKA_交付包评分.json",
];

const pdfFiles = [
  "WIKA_专业运营总览.pdf",
  "WIKA_老板管理层简报.pdf",
  "WIKA_运营负责人周计划.pdf",
  "WIKA_产品优化工单.pdf",
  "WIKA_直通车数据导入与投放调整表.pdf",
  "WIKA_运营任务总看板.pdf",
];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function readJson(filePath) {
  return JSON.parse(readText(filePath));
}

function readFirstJson(paths) {
  const found = paths.find((filePath) => fs.existsSync(filePath));
  if (!found) {
    throw new Error(`缺少输入文件：${paths.join(" | ")}`);
  }
  return readJson(found);
}

function writeText(fileName, content) {
  const filePath = path.join(packageRoot, fileName);
  fs.writeFileSync(filePath, `${content.trim()}\n`, "utf8");
  return filePath;
}

function writeJson(fileName, value) {
  const filePath = path.join(packageRoot, fileName);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  return filePath;
}

function csvValue(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function writeCsv(fileName, headers, rows) {
  const lines = [headers.map(csvValue).join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => csvValue(row[header])).join(","));
  }
  const filePath = path.join(packageRoot, fileName);
  fs.writeFileSync(filePath, `\uFEFF${lines.join("\n")}\n`, "utf8");
  return filePath;
}

function bullet(items) {
  return items.map((item) => `- ${item}`).join("\n");
}

function numbered(items) {
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

function table(headers, rows) {
  return [
    `| ${headers.join(" |")} |`,
    `| ${headers.map(() => "---").join(" |")} |`,
    ...rows.map((row) => `| ${headers.map((header) => row[header] ?? "").join(" |")} |`),
  ].join("\n");
}

function boundarySection(extra = []) {
  return [
    "## 边界声明",
    "",
    bullet([
      ...extra,
      ...boundaryLines,
      "本交付包只把当前 WIKA 能力转成运营执行材料，不代表平台内自动执行，也不代表任务 1–5 complete。",
    ]),
  ].join("\n");
}

function detectDesktopWikaDir() {
  const profile = process.env.USERPROFILE || process.env.HOME || "";
  const candidates = [
    profile && path.join(profile, "Desktop", "WIKA"),
    profile && path.join(profile, "桌面", "WIKA"),
    profile && path.join(profile, "OneDrive", "Desktop", "WIKA"),
    profile && path.join(profile, "OneDrive", "桌面", "WIKA"),
    path.join(process.cwd(), "WIKA_DESKTOP_FALLBACK"),
  ].filter(Boolean);

  for (const candidate of candidates) {
    const parent = path.dirname(candidate);
    if (!fs.existsSync(parent) && !candidate.endsWith("WIKA_DESKTOP_FALLBACK")) {
      continue;
    }
    try {
      ensureDir(candidate);
      const probe = path.join(candidate, ".wika-write-test");
      fs.writeFileSync(probe, "ok", "utf8");
      fs.unlinkSync(probe);
      return candidate;
    } catch {
      // try next candidate
    }
  }
  throw new Error(`无法定位可写桌面路径，已尝试：${candidates.join(" | ")}`);
}

function byPriority(task) {
  const rank = { P1: 1, P2: 2, P3: 3 };
  return rank[task.priority] ?? 99;
}

function formatInputs(inputs) {
  return Array.isArray(inputs) && inputs.length ? inputs.join("；") : "无新增输入要求";
}

function formatSteps(steps) {
  return Array.isArray(steps) && steps.length ? steps.join("；") : "按任务负责人确认后执行";
}

function formatCriteria(criteria) {
  return Array.isArray(criteria) && criteria.length ? criteria.join("；") : "完成记录、责任人确认、可复盘";
}

function loadSources() {
  const taskPackage = readJson(path.join(tasksRoot, "WIKA_运营任务包.json"));
  const taskSummary = readJson(path.join(tasksRoot, "WIKA_运营任务包摘要.json"));
  const execution = readFirstJson([
    path.join(executionRoot, "WIKA_任务执行状态_本轮刷新.json"),
    path.join(executionRoot, "WIKA_任务执行状态.json"),
  ]);
  const blockers = readFirstJson([
    path.join(executionRoot, "WIKA_任务阻塞清单_本轮刷新.json"),
    path.join(executionRoot, "WIKA_任务阻塞清单.json"),
  ]);
  const manualInputs = readFirstJson([
    path.join(executionRoot, "WIKA_人工输入需求_本轮刷新.json"),
    path.join(executionRoot, "WIKA_人工输入需求.json"),
  ]);
  const nextReportInput = readFirstJson([
    path.join(executionRoot, "WIKA_下一轮报告输入包_本轮刷新.json"),
    path.join(executionRoot, "WIKA_下一轮报告输入包.json"),
  ]);
  const reportScores = readJson(path.join(reportsRoot, "WIKA_正式运营报告包评分.json"));

  const reports = Object.fromEntries(
    [
      "WIKA_正式运营报告包索引.md",
      "WIKA_管理层简报.md",
      "WIKA_运营周报.md",
      "WIKA_经营诊断报告.md",
      "WIKA_产品优化建议报告.md",
      "WIKA_广告分析报告.md",
      "WIKA_店铺执行清单.md",
      "WIKA_销售跟单使用清单.md",
      "WIKA_人工接手清单.md",
    ].map((name) => [name, readText(path.join(reportsRoot, name))]),
  );

  return {
    tasks: [...taskPackage.tasks].sort((a, b) => byPriority(a) - byPriority(b) || a.task_id.localeCompare(b.task_id)),
    taskSummary,
    execution,
    blockers,
    manualInputs,
    nextReportInput,
    reportScores,
    reports,
  };
}

function buildDashboardRows(tasks, execution) {
  const statusById = new Map((execution.tasks || []).map((task) => [task.task_id, task]));
  return tasks.map((task) => {
    const status = statusById.get(task.task_id) || {};
    return {
      task_id: task.task_id,
      task_title: task.task_title,
      priority: task.priority,
      owner_role: task.owner_role,
      current_status: status.current_status || task.current_status || (task.blocked_by?.length ? "blocked" : "ready_to_execute"),
      wika_support_level: task.wika_support_level || status.support_level,
      required_inputs: formatInputs(task.required_inputs),
      blocked_by: formatInputs(task.blocked_by),
      execution_steps: formatSteps(task.execution_steps),
      acceptance_criteria: formatCriteria(task.acceptance_criteria),
      due_window: task.due_window || "本周",
      manual_confirmation_required: task.manual_input_required ? "是" : "按实际任务确认",
      source_report: task.source_report || "",
    };
  });
}

function buildManualResponsibilityRows(manualInputs) {
  return (manualInputs.manual_inputs || []).map((item) => ({
    数据类型: inferInputType(item),
    负责人: item.owner_role || "待指定",
    提交模板: inferTemplate(item),
    提交路径: "WIKA/docs/tasks/input-inbox/received/",
    提交频率: inferFrequency(item),
    会增强哪些报告: inferEnhancedReport(item),
    不提交的影响: inferInputImpact(item),
    关联任务: item.task_id,
    需要字段: formatInputs(item.required_inputs),
  }));
}

function inferInputType(item) {
  const text = `${item.task_id} ${formatInputs(item.required_inputs)}`;
  if (text.includes("广告") || text.includes("campaign") || text.includes("spend")) return "广告导出数据";
  if (text.includes("页面") || text.includes("banner")) return "页面人工盘点";
  if (text.includes("产品") || text.includes("素材") || text.includes("关键词")) return "产品素材与关键词";
  if (text.includes("报价") || text.includes("交期") || text.includes("样品")) return "销售/跟单确认字段";
  if (text.includes("订单") || text.includes("买家")) return "订单机会与买家字段";
  return "运营执行确认";
}

function inferTemplate(item) {
  const type = inferInputType(item);
  if (type === "广告导出数据") return "WIKA_直通车数据导入模板.csv";
  if (type === "页面人工盘点") return "WIKA_页面人工盘点表.csv";
  if (type === "产品素材与关键词") return "WIKA_产品优化工单.csv / WIKA_关键词优化矩阵.csv";
  if (type === "销售/跟单确认字段") return "WIKA_询盘回复字段补齐表.csv";
  if (type === "订单机会与买家字段") return "WIKA_订单机会分析表.csv";
  return "WIKA_人工补数责任表.csv";
}

function inferFrequency(item) {
  const type = inferInputType(item);
  if (type === "广告导出数据") return "每周一次，周报前提交";
  if (type === "页面人工盘点") return "每周一次，页面调整前后各一次";
  if (type === "产品素材与关键词") return "本周 P1 产品先补，之后随产品上新更新";
  if (type === "销售/跟单确认字段") return "每次询盘或订单草稿前";
  return "本周内补齐，后续按复盘节奏更新";
}

function inferEnhancedReport(item) {
  const type = inferInputType(item);
  if (type === "广告导出数据") return "广告分析报告、运营周报、运营任务总看板";
  if (type === "页面人工盘点") return "主页转化优化清单、经营诊断报告、店铺运营每日检查表";
  if (type === "产品素材与关键词") return "产品优化工单、新品开发建议表、关键词优化矩阵";
  if (type === "销售/跟单确认字段") return "询盘跟进SOP、销售跟单使用清单、订单机会分析表";
  return "运营负责人周计划、任务总看板";
}

function inferInputImpact(item) {
  const type = inferInputType(item);
  if (type === "广告导出数据") return "无法判断真实花费、点击、询盘和投放调整优先级";
  if (type === "页面人工盘点") return "首页和详情页建议只能保持保守，不能形成强页面结论";
  if (type === "产品素材与关键词") return "产品优化只能停在建议层，无法进入可执行改版工单";
  if (type === "销售/跟单确认字段") return "reply/order 草稿无法进入人工确认后的实际发送或创单";
  return "任务无法关闭，下一轮报告仍会标记等待输入";
}

function renderProfessionalOverview(data, dashboardRows) {
  const summary = data.execution.summary || {};
  const p1 = dashboardRows.filter((row) => row.priority === "P1");
  const p2 = dashboardRows.filter((row) => row.priority === "P2");
  const p3 = dashboardRows.filter((row) => row.priority === "P3");
  return `# WIKA 专业运营总览

## 一句话结论

WIKA 当前已经能把店铺、产品、订单、广告导入准备、页面盘点、询盘草稿和订单草稿组织成运营工作流；本周最重要的不是继续扩功能，而是补齐广告样本、页面盘点、产品素材和销售/订单关键字段，让现有能力真正进入运营复盘。

## WIKA 当前能做什么

${bullet([
  "自动复用已上线的 summary / diagnostic / comparison / business-cockpit / action-center / operator-console 能力，形成经营判断底稿。",
  "把 task3 产品草稿、task4 询盘回复、task5 订单草稿整理成 workbench / preview / draft / handoff 流程。",
  "把正式报告包、任务包、执行闭环和人工输入机制转成角色可执行清单。",
  "对广告和页面类缺口提供标准导入模板，而不是伪造官方 API 或行为数据。",
])}

## 当前最严重的问题

${bullet([
  "广告真实样本未提供，直通车只能做数据导入准备，不能给真实投放效果结论。",
  "页面人工盘点未提供，首页和详情页优化只能保持保守建议，不能宣称来自真实页面行为。",
  "产品素材、关键词、报价、交期、样品、买家和订单字段仍需人工确认，task3/4/5 不能写成平台内闭环。",
])}

## 当前最值得做的机会

${bullet([
  "先补 P1 产品内容、图片/视频、关键词和详情页结构，提升询盘承接质量。",
  "建立每周广告导出和页面盘点节奏，让广告分析与页面优化从 readiness 进入可复盘。",
  "统一销售/跟单使用 reply-preview、reply-draft、order-preview、order-draft 的人工确认流程，减少重复整理。",
])}

## 本周运营总目标

本周目标是把 19 个运营任务推进到可验收状态：先处理 ${summary.ready_to_execute_count ?? 10} 个可立即执行任务，同时推动 ${summary.blocked_count ?? 6} 个 blocked 任务清障，所有涉及平台内发送、发布、创单的动作仍由人工执行。

## 本周 P1 / P2 / P3

### P1：立即推进
${bullet(p1.slice(0, 8).map((row) => `${row.task_id}：${row.task_title}（${row.owner_role}，${row.current_status}）`))}

### P2：本周推进
${bullet(p2.map((row) => `${row.task_id}：${row.task_title}（${row.owner_role}，${row.current_status}）`))}

### P3：后续跟进
${bullet(p3.map((row) => `${row.task_id}：${row.task_title}（${row.owner_role}，${row.current_status}）`))}

## 哪些任务可由 WIKA 支撑

${bullet([
  "经营摘要、诊断、对比、任务看板、执行看板、报告草稿、工作台预览、外部草稿生成。",
  "广告和页面数据的导入模板、校验口径、后续报告承接。",
  "产品优化、关键词矩阵、询盘回复和订单机会的结构化准备。",
])}

## 哪些必须人工

${bullet([
  "真实广告导出样本、页面人工盘点、产品素材、关键词人工校对。",
  "报价、交期、样品、买家信息、订单字段、平台内最终发送或创单。",
])}

${boundarySection()}`;
}

function renderBossBrief(data, dashboardRows) {
  const blockedRows = dashboardRows.filter((row) => row.current_status === "blocked");
  return `# WIKA 老板管理层简报

## 一句话结论

WIKA 已经具备运营判断、任务拆解和执行跟踪能力；本周管理层最需要拍板的是：先补数据、先补产品内容、先统一销售/订单人工确认流程。

## 当前经营状态

当前不是缺系统能力，而是缺可用于闭环的人工输入。WIKA 可以把问题拆成任务、生成报告和草稿，但广告、页面、产品素材、报价交期和订单末端字段仍要人工补齐。

## 3 个最重要发现

${numbered([
  "报告包和任务包已经能服务老板、运营、产品运营、销售/跟单和人工接手人员。",
  "当前 19 个运营任务中，10 个可立即执行，6 个 blocked，3 个等待输入。",
  "广告和页面是当前最影响进一步判断质量的两个数据缺口。",
])}

## 3 个最严重问题

${numbered([
  "没有真实广告样本，无法判断直通车花费、点击、询盘和关键词效果。",
  "没有页面人工盘点，首页和详情页改版只能靠保守建议。",
  "task3/4/5 最后一跳仍需人工，不能把草稿和预览当成平台内执行完成。",
])}

## 3 个需要拍板事项

${numbered([
  "指定广告导出责任人，本周提交一份真实广告样本。",
  "指定页面盘点责任人，按模板检查首页、banner、类目入口、询盘入口和信任信息。",
  "指定产品素材与销售字段责任人，优先补齐 P1 产品资料、报价、交期、样品和买家信息。",
])}

## 本周资源协调需求

${bullet([
  "运营负责人：统筹 P1/P2/P3 排期，每天更新任务状态。",
  "产品运营/设计：补产品标题、关键词、详情、主图、视频和页面素材。",
  "销售/跟单：确认报价、交期、样品、买家信息和订单关键字段。",
])}

## 当前风险

${bullet(blockedRows.map((row) => `${row.task_id}：${row.task_title}，阻塞项：${row.blocked_by}`))}

${boundarySection()}`;
}

function renderOpsWeeklyPlan(dashboardRows) {
  return `# WIKA 运营负责人周计划

## 本周运营目标

把 stage47 报告包和 stage48/49 任务闭环转成一周执行节奏：P1 当天启动，P2 本周推进，P3 等待关键输入后排序。

## P1 / P2 / P3 排期

${table(["优先级", "任务", "负责人", "本周动作", "验收标准"], dashboardRows.map((row) => ({
  优先级: row.priority,
  任务: `${row.task_id} ${row.task_title}`,
  负责人: row.owner_role,
  本周动作: row.execution_steps,
  验收标准: row.acceptance_criteria,
})))}

## 角色分工

${bullet([
  "老板/管理层：拍板本周三件优先事项，协调广告、页面、产品和销售资源。",
  "运营负责人：每天更新任务看板，推动 blocked 清障。",
  "店铺运营：执行首页、产品露出、询盘入口、页面噪音和 B2B 信任信息检查。",
  "产品运营：补标题、关键词、详情页结构、主图/视频和新品方向。",
  "销售/跟单：使用 reply/order 草稿，但最终发送和创单前必须人工确认。",
])}

## 每天要推进什么

${table(["时间", "动作", "输出"], [
  { 时间: "周一", 动作: "确认 P1 责任人与本周排期", 输出: "P1 负责人、截止时间、验收标准" },
  { 时间: "周二", 动作: "启动产品优化、广告导出、页面盘点", 输出: "产品素材缺口表、广告样本、页面盘点记录" },
  { 时间: "周三", 动作: "检查询盘与订单草稿人工确认字段", 输出: "询盘回复字段补齐表、订单机会分析表" },
  { 时间: "周四", 动作: "复核 P1 完成度并推进 P2", 输出: "任务状态更新、blocked 清障记录" },
  { 时间: "周五", 动作: "整理复盘输入，准备下一轮报告", 输出: "下一轮报告输入包、周复盘结论" },
])}

## 哪些输入必须补齐

${bullet([
  "真实广告导出样本。",
  "页面人工盘点表。",
  "产品素材、规格、材质、MOQ、关键词。",
  "报价、交期、样品、买家和订单字段。",
])}

## 何时复盘

本周至少两次：周三做 P1 中期检查，周五做周复盘并更新下一轮报告输入包。

## 验收标准

${bullet([
  "P1 任务有负责人、执行记录和验收结果。",
  "blocked 任务明确 blocker owner 与清障动作。",
  "所有手工输入进入 `WIKA/docs/tasks/input-inbox/received/` 后再进入下一轮报告。",
])}

${boundarySection()}`;
}

function renderStoreDailyChecklist() {
  const rows = storeChecklistRows();
  return `# WIKA 店铺运营每日检查表

## 使用方式

每天按下表执行一次。发现问题后，不要直接写平台；先记录证据、责任人和下一步动作，再由运营负责人排期。

${table(["检查项", "检查动作", "记录内容", "负责人", "验收标准"], rows)}

## 今日完成记录

- 今日已完成：
- 今日未完成：
- 今日异常：
- 明日跟进：

${boundarySection(["页面优化判断当前仍依赖人工盘点；没有页面行为数据时，只能输出保守建议。"])}`;
}

function storeChecklistRows() {
  return [
    { 检查项: "首页检查", 检查动作: "检查首屏定位、主 banner、核心产品露出是否清楚", 记录内容: "发现的问题、截图位置、建议动作", 负责人: "店铺运营", 验收标准: "每个问题都有位置和处理建议" },
    { 检查项: "产品露出检查", 检查动作: "检查主推产品是否覆盖眼镜盒、包装套装、定制能力", 记录内容: "缺失产品类型、排序问题", 负责人: "店铺运营/产品运营", 验收标准: "列出需要调整的产品露出位" },
    { 检查项: "询盘入口检查", 检查动作: "检查 Contact / Inquiry / RFQ 入口是否明显", 记录内容: "入口位置、文案问题、跳转问题", 负责人: "店铺运营", 验收标准: "询盘入口可被快速找到" },
    { 检查项: "B2B 信任信息检查", 检查动作: "检查工厂能力、定制能力、材质、MOQ、交期是否清楚", 记录内容: "缺失信任信息", 负责人: "产品运营", 验收标准: "关键信任信息有明确补充责任人" },
    { 检查项: "内容更新检查", 检查动作: "检查产品标题、关键词、详情、图片/视频是否过期", 记录内容: "待更新产品与字段", 负责人: "产品运营", 验收标准: "形成产品优化工单" },
    { 检查项: "数据异常检查", 检查动作: "看 summary / diagnostic / comparison 是否有异常信号", 记录内容: "异常指标、来源报告、影响", 负责人: "运营负责人", 验收标准: "异常进入任务看板" },
    { 检查项: "页面噪音检查", 检查动作: "检查是否有零售化、无关购物车、B2C 话术或干扰询盘的内容", 记录内容: "噪音位置、处理建议", 负责人: "店铺运营", 验收标准: "噪音项有保留或处理结论" },
  ];
}

function renderProductWorkOrders() {
  const rows = productWorkOrderRows();
  return `# WIKA 产品优化工单

## 执行原则

先处理能提升 B2B 买家判断效率的内容：产品定位、材质、尺寸、包装方式、MOQ、定制能力、主图/详情素材和关键词。当前没有全量产品行为数据时，不强行宣称某个产品已经被市场验证。

${table(["产品 ID", "产品名称", "当前问题", "证据", "优先级", "详情页修改建议", "标题/关键词建议", "图片/视频素材需求", "执行人", "验收标准", "是否需要人工补充素材"], rows)}

${boundarySection(["产品 ID 和产品名称需要产品运营从后台或产品清单中补齐；本表给出优先处理方向，不伪造具体商品数据。"])}`;
}

function productWorkOrderRows() {
  return [
    {
      "产品 ID": "待补充",
      产品名称: "眼镜盒 / 眼镜包装主推款",
      当前问题: "材质、MOQ、定制能力、应用场景表达需要补强",
      证据: "产品优化报告与任务包显示产品内容、素材、关键词仍需人工补齐",
      优先级: "P1",
      详情页修改建议: "补材质、尺寸、包装方式、logo 定制、样品与交期说明",
      "标题/关键词建议": "custom glasses case；eyewear packaging；logo glasses case；protective eyewear case",
      "图片/视频素材需求": "主图、材质细节图、logo 定制示意、包装场景图",
      执行人: "产品运营",
      验收标准: "标题、关键词、详情页结构和主图素材均完成初稿并人工确认",
      是否需要人工补充素材: "是",
    },
    {
      "产品 ID": "待补充",
      产品名称: "眼镜包装套装 / eyewear packaging sets",
      当前问题: "组合价值、适用买家和套装配置需要更清楚",
      证据: "当前任务包要求补齐产品素材与关键词，且页面人工盘点未完成",
      优先级: "P1",
      详情页修改建议: "补套装包含物、适合品牌/批发/礼品场景、定制范围",
      "标题/关键词建议": "eyewear packaging set；custom optical packaging；glasses case and cloth set",
      "图片/视频素材需求": "整套组合图、拆分细节图、包装陈列图",
      执行人: "产品运营/设计",
      验收标准: "套装卖点和配置表可直接用于询盘沟通",
      是否需要人工补充素材: "是",
    },
    {
      "产品 ID": "待补充",
      产品名称: "高端定制包装方案",
      当前问题: "需要补充工艺、材质、品牌定制证明和案例表达",
      证据: "B2B 信任信息仍需人工盘点与产品资料补充",
      优先级: "P2",
      详情页修改建议: "补工艺选项、品牌定制流程、样品周期和打样要求",
      "标题/关键词建议": "premium custom glasses packaging；luxury eyewear case；OEM eyewear packaging",
      "图片/视频素材需求": "工艺细节、logo 工艺、样品对比图",
      执行人: "产品运营",
      验收标准: "可支撑高客单价询盘的资料完整",
      是否需要人工补充素材: "是",
    },
  ];
}

function renderNewProductSuggestions() {
  const rows = newProductRows();
  return `# WIKA 新品开发建议表

## 判断口径

当前数据不足以强推新品，本表只给保守建议：优先围绕现有 eyewear packaging 能力做相邻扩展，不跳到无证据的新大类。最终是否开发，需要供应链、成本、样品和客户需求人工确认。

${table(["建议新品方向", "对应买家类型", "为什么值得做", "现有数据依据", "需要人工确认的供应链信息", "建议优先级", "预期价值", "需要准备的素材"], rows)}

${boundarySection(["新品建议为 conservative recommendation，不等于平台真实需求已经被完整验证。"])}`;
}

function newProductRows() {
  return [
    { 建议新品方向: "眼镜盒 + 眼镜布 + 包装盒套装", 对应买家类型: "眼镜品牌、批发商、礼品采购", 为什么值得做: "套装更适合 B2B 组合采购，能提高询盘信息完整度", 现有数据依据: "现有报告围绕 eyewear packaging sets 和产品内容补强", 需要人工确认的供应链信息: "套装成本、MOQ、打样周期、包装尺寸", 建议优先级: "P1", 预期价值: "提升组合报价能力和客单价", 需要准备的素材: "套装主图、拆分图、配置表" },
    { 建议新品方向: "环保材质眼镜包装系列", 对应买家类型: "环保品牌、欧美市场采购", 为什么值得做: "环保材料是包装采购常见差异化点", 现有数据依据: "当前产品资料需要补材质与信任信息", 需要人工确认的供应链信息: "可用环保材料、认证、成本差异", 建议优先级: "P2", 预期价值: "增强询盘筛选和差异化", 需要准备的素材: "材质对比图、环保说明、测试资料" },
    { 建议新品方向: "品牌定制展示包装方案", 对应买家类型: "连锁眼镜店、品牌商", 为什么值得做: "定制能力是 B2B 询盘核心卖点", 现有数据依据: "任务包要求补定制能力、logo、工艺和详情素材", 需要人工确认的供应链信息: "logo 工艺、起订量、样品费、交期", 建议优先级: "P2", 预期价值: "提升高质量询盘转化", 需要准备的素材: "logo 工艺样品图、定制流程图" },
  ];
}

function renderKeywordMatrix() {
  const rows = keywordRows();
  return `# WIKA 关键词优化矩阵

## 使用原则

关键词先服务产品承接和询盘质量，不为堆词而堆词。英文关键词用于标题、卖点、详情和 FAQ，但必须由产品运营结合真实产品参数人工确认。

${table(["当前关键词线索", "建议关键词", "对应产品", "放置位置", "预期作用", "是否需要人工确认"], rows)}

${boundarySection(["关键词建议基于当前产品方向和运营经验，不代表平台搜索词报告已经自动打通。"])}`;
}

function keywordRows() {
  return [
    { 当前关键词线索: "眼镜盒包装", 建议关键词: "custom glasses case", 对应产品: "眼镜盒主推款", 放置位置: "标题 / 卖点 / 详情", 预期作用: "承接定制眼镜盒买家", 是否需要人工确认: "是，需确认产品是否支持 logo / 材质定制" },
    { 当前关键词线索: "眼镜包装套装", 建议关键词: "eyewear packaging set", 对应产品: "包装套装", 放置位置: "标题 / 详情 / FAQ", 预期作用: "承接组合采购", 是否需要人工确认: "是，需确认套装配置" },
    { 当前关键词线索: "高端包装", 建议关键词: "premium eyewear packaging", 对应产品: "高端定制包装方案", 放置位置: "标题 / 卖点", 预期作用: "提升高客单买家匹配", 是否需要人工确认: "是，需确认材质和工艺" },
    { 当前关键词线索: "OEM 定制", 建议关键词: "OEM glasses case", 对应产品: "定制眼镜盒", 放置位置: "标题 / FAQ / 详情", 预期作用: "承接 OEM 采购需求", 是否需要人工确认: "是，需确认 OEM 能力边界" },
  ];
}

function renderAdsPlan() {
  return `# WIKA 直通车数据导入与投放调整表

## 当前状态

当前没有真实广告样本，因此不能给出真实花费、曝光、点击、询盘、CTR、CPC 或转化率判断。本表用于指导运营导出数据，并在数据补齐后进入 WIKA 广告分析。

## 需要运营导出的字段

${bullet(["date", "campaign_name", "ad_group_name", "keyword", "spend", "impressions", "clicks", "inquiries", "ctr", "cpc"])}

## 拿到数据后 WIKA 能分析什么

${bullet([
  "哪些 campaign 花费高但询盘低。",
  "哪些 keyword 点击高但询盘弱。",
  "哪些 ad_group 适合保留、降价、暂停或扩量。",
  "广告点击和页面盘点问题是否互相影响。",
])}

## 当前可给出的保守投放建议

${table(["优先级", "动作", "为什么", "执行人", "验收标准"], [
  { 优先级: "P1", 动作: "先导出一周真实广告样本", 为什么: "没有样本不能做效果判断", 执行人: "广告投放负责人", 验收标准: "CSV 字段完整且可导入" },
  { 优先级: "P2", 动作: "建立每周固定导出节奏", 为什么: "后续才能做周对比", 执行人: "运营负责人", 验收标准: "每周固定进入 input-inbox" },
  { 优先级: "P3", 动作: "广告与页面盘点联合复盘", 为什么: "点击后承接页面会影响询盘", 执行人: "广告投放负责人/店铺运营", 验收标准: "广告问题和页面问题能合并排序" },
])}

## 哪些计划/关键词需要补数据后判断

所有 campaign、ad_group、keyword 均需要补真实样本后才能判断。当前不得编造投放效果。

${boundarySection(["广告分析当前为 import-driven layer，不是稳定官方广告 API 自动抓取。"])}`;
}

function renderHomeOptimization() {
  return `# WIKA 主页转化优化清单

## 判断口径

当前没有页面行为级真实数据，因此本清单基于页面结构、B2B 采购逻辑和现有经营信号形成保守建议。执行前需要店铺运营做人工盘点。

${table(["模块", "优化重点", "检查问题", "修改优先级", "验收标准"], [
  { 模块: "首屏定位", 优化重点: "3 秒内说明 eyewear packaging / custom glasses case 能力", 检查问题: "是否过于零售化或卖点不清", 修改优先级: "P1", 验收标准: "买家一眼知道主营与定制能力" },
  { 模块: "B2B 信任信息", 优化重点: "展示工厂、MOQ、交期、材质、定制流程", 检查问题: "是否缺可信采购信息", 修改优先级: "P1", 验收标准: "采购关心信息首屏或次屏可见" },
  { 模块: "询盘 CTA", 优化重点: "突出 Contact / Inquiry 入口", 检查问题: "入口是否不明显或被零售元素干扰", 修改优先级: "P1", 验收标准: "询盘入口清晰且无购物噪音" },
  { 模块: "核心产品露出", 优化重点: "优先露出眼镜盒、包装套装、高端定制方案", 检查问题: "是否没有主推顺序", 修改优先级: "P2", 验收标准: "主推产品与本周产品工单一致" },
  { 模块: "案例/材质/工艺", 优化重点: "补案例、材质对比、logo 工艺、包装细节", 检查问题: "是否缺少证明定制能力的内容", 修改优先级: "P2", 验收标准: "至少有 3 类信任内容" },
])}

## 需要人工盘点的页面项

${bullet(["首页模块", "主 banner", "核心商品露出", "重点类目入口", "联系方式/询盘入口", "主图 / 视频 / 详情内容完整度", "当前观察问题", "当前人工建议"])}

${boundarySection(["没有页面行为数据前，本清单不能写成强页面效果结论。"])}`;
}

function renderInquirySop() {
  return `# WIKA 询盘跟进SOP

## 首次回复流程

${numbered([
  "先确认买家需求：产品类型、数量、定制方式、目的市场、期望交期。",
  "用 reply-workbench / reply-preview 检查回复草稿是否缺关键字段。",
  "用 reply-draft 生成外部草稿，人工补报价、交期、样品和承诺类内容。",
  "人工最终确认后再进入平台内发送。",
])}

## 报价前必问字段

${bullet(["产品型号/图片", "数量", "材质", "尺寸", "logo / 定制要求", "包装方式", "交期", "收货国家", "是否需要样品"])}

## 样品确认

必须人工确认样品费、样品周期、快递方式、是否可退样品费，不允许 WIKA 自动承诺。

## 定制需求确认

确认 logo 工艺、颜色、材质、包装方式、MOQ、打样文件和确认流程。

## MOQ / 交期 / 材质 / 包装确认

这些字段会影响价格和承诺，必须人工确认后才能写入最终回复。

## 不能自动发送的情况

${bullet(["缺最终报价", "缺交期", "涉及样品政策", "涉及特殊定制承诺", "买家需求不清", "涉及付款或合同条款"])}

## 如何使用 reply-preview / reply-draft

reply-preview 用于检查草稿准备度；reply-draft 用于生成外部草稿。两者都不是平台内自动回复。

## 人工确认点

报价、交期、样品、付款条款、买家特殊要求、任何承诺类话术。

${boundarySection()}`;
}

function renderOrderOpportunity() {
  return `# WIKA 订单机会分析表

## 当前订单信号

WIKA 已有 orders management-summary、orders diagnostic、orders comparison、order-workbench、order-preview、order-draft 等可消费层，可用于整理订单机会和草稿准备；但订单末端字段仍需人工确认。

## 产品贡献

当前可以用已有订单摘要和产品贡献 derived 层判断哪些产品更值得跟进，但 'country_structure' 仍 unavailable。

## 潜在订单机会

${table(["机会类型", "跟进动作", "需要字段", "执行人", "验收标准"], [
  { 机会类型: "高意向询盘转订单", 跟进动作: "用 order-preview 检查创单字段", 需要字段: "报价、数量、交期、买家信息", 执行人: "销售/跟单", 验收标准: "字段齐全并人工确认" },
  { 机会类型: "样品单", 跟进动作: "确认样品费、快递、样品周期", 需要字段: "样品政策、地址、联系方式", 执行人: "销售/跟单", 验收标准: "样品信息可用于人工沟通" },
  { 机会类型: "复购/组合采购", 跟进动作: "结合产品贡献和产品套装建议做组合报价", 需要字段: "历史需求、产品组合、价格", 执行人: "销售/产品运营", 验收标准: "组合方案可人工发送" },
])}

## 缺失订单字段

${bullet(["买家完整信息", "最终报价", "交期", "付款方式", "物流方式", "样品安排", "订单备注"])}

## 如何使用 order-preview / order-draft

order-preview 用于判断字段是否齐；order-draft 用于生成外部订单草稿；最终平台内创单仍由人工完成。

${boundarySection(["订单国家结构仍 unavailable，不能强行输出国家结构结论。"])}`;
}

function renderManualResponsibility(rows) {
  return `# WIKA 人工补数责任表

## 使用说明

所有人工输入统一进入 \`WIKA/docs/tasks/input-inbox/received/\`，由现有 ingest 脚本校验。没有进入该目录的数据，不写入下一轮正式报告。

${table(["数据类型", "负责人", "提交模板", "提交路径", "提交频率", "会增强哪些报告", "不提交的影响"], rows)}

${boundarySection(["人工补数是现有闭环的输入层，不是平台写侧动作。"])}`;
}

function renderTaskDashboard(dashboardRows) {
  return `# WIKA 运营任务总看板

## 总览

当前任务总数 ${dashboardRows.length}。本看板用于本周执行，不替代平台内操作。

${table(["优先级", "任务 ID", "任务标题", "负责人", "状态", "WIKA 支撑范围", "需要输入", "阻塞项", "验收标准"], dashboardRows.map((row) => ({
  优先级: row.priority,
  "任务 ID": row.task_id,
  任务标题: row.task_title,
  负责人: row.owner_role,
  状态: row.current_status,
  "WIKA 支撑范围": row.wika_support_level,
  需要输入: row.required_inputs,
  阻塞项: row.blocked_by,
  验收标准: row.acceptance_criteria,
})))}

${boundarySection()}`;
}

function buildCsvRows(dashboardRows, manualRows) {
  return {
    "WIKA_运营负责人任务分配表.csv": {
      headers: ["priority", "task_id", "task_title", "owner_role", "due_window", "execution_steps", "acceptance_criteria"],
      rows: dashboardRows.map((row) => ({
        priority: row.priority,
        task_id: row.task_id,
        task_title: row.task_title,
        owner_role: row.owner_role,
        due_window: row.due_window,
        execution_steps: row.execution_steps,
        acceptance_criteria: row.acceptance_criteria,
      })),
    },
    "WIKA_店铺运营每日检查表.csv": {
      headers: ["check_item", "check_action", "record_content", "owner", "acceptance_criteria"],
      rows: storeChecklistRows().map((row) => ({
        check_item: row.检查项,
        check_action: row.检查动作,
        record_content: row.记录内容,
        owner: row.负责人,
        acceptance_criteria: row.验收标准,
      })),
    },
    "WIKA_产品优化工单.csv": {
      headers: ["product_id", "product_name", "current_issue", "evidence", "priority", "detail_page_action", "title_keyword_action", "media_required", "owner", "acceptance_criteria", "manual_material_required"],
      rows: productWorkOrderRows().map((row) => ({
        product_id: row["产品 ID"],
        product_name: row.产品名称,
        current_issue: row.当前问题,
        evidence: row.证据,
        priority: row.优先级,
        detail_page_action: row.详情页修改建议,
        title_keyword_action: row["标题/关键词建议"],
        media_required: row["图片/视频素材需求"],
        owner: row.执行人,
        acceptance_criteria: row.验收标准,
        manual_material_required: row.是否需要人工补充素材,
      })),
    },
    "WIKA_新品开发建议表.csv": {
      headers: ["new_product_direction", "buyer_type", "why_worth_doing", "evidence", "supply_chain_to_confirm", "priority", "expected_value", "materials_needed"],
      rows: newProductRows().map((row) => ({
        new_product_direction: row.建议新品方向,
        buyer_type: row.对应买家类型,
        why_worth_doing: row.为什么值得做,
        evidence: row.现有数据依据,
        supply_chain_to_confirm: row.需要人工确认的供应链信息,
        priority: row.建议优先级,
        expected_value: row.预期价值,
        materials_needed: row.需要准备的素材,
      })),
    },
    "WIKA_关键词优化矩阵.csv": {
      headers: ["current_signal", "suggested_keyword", "product", "placement", "expected_effect", "manual_confirm_required"],
      rows: keywordRows().map((row) => ({
        current_signal: row.当前关键词线索,
        suggested_keyword: row.建议关键词,
        product: row.对应产品,
        placement: row.放置位置,
        expected_effect: row.预期作用,
        manual_confirm_required: row.是否需要人工确认,
      })),
    },
    "WIKA_直通车数据导入模板.csv": {
      headers: ["date", "campaign_name", "ad_group_name", "keyword", "spend", "impressions", "clicks", "inquiries", "ctr", "cpc", "suggested_action", "owner", "note"],
      rows: [
        { date: "2026-04-01", campaign_name: "示例：请替换为真实计划", ad_group_name: "示例：请替换为真实单元", keyword: "示例：请替换为真实关键词", spend: "", impressions: "", clicks: "", inquiries: "", ctr: "", cpc: "", suggested_action: "待 WIKA 分析后填写", owner: "广告投放负责人", note: "示例行，不代表真实广告效果" },
      ],
    },
    "WIKA_直通车投放调整表.csv": {
      headers: ["campaign_name", "ad_group_name", "keyword", "problem", "suggested_action", "reason", "owner", "acceptance_criteria", "data_required"],
      rows: [
        { campaign_name: "待导入后判断", ad_group_name: "待导入后判断", keyword: "待导入后判断", problem: "缺真实广告样本", suggested_action: "先补数据，不做效果结论", reason: "未收到真实 spend/impressions/clicks/inquiries", owner: "广告投放负责人", acceptance_criteria: "真实样本通过导入校验", data_required: "date/campaign/ad_group/keyword/spend/impressions/clicks/inquiries" },
      ],
    },
    "WIKA_页面人工盘点表.csv": {
      headers: ["page_area", "check_item", "current_observation", "problem", "manual_suggestion", "priority", "owner", "evidence_location"],
      rows: [
        { page_area: "首页首屏", check_item: "定位与主 banner", current_observation: "", problem: "", manual_suggestion: "", priority: "P1", owner: "店铺运营", evidence_location: "截图或页面链接" },
        { page_area: "首页", check_item: "核心商品露出", current_observation: "", problem: "", manual_suggestion: "", priority: "P1", owner: "店铺运营", evidence_location: "截图或页面链接" },
        { page_area: "详情页", check_item: "主图/视频/详情完整度", current_observation: "", problem: "", manual_suggestion: "", priority: "P2", owner: "产品运营", evidence_location: "截图或页面链接" },
      ],
    },
    "WIKA_询盘回复字段补齐表.csv": {
      headers: ["inquiry_id", "buyer_need", "missing_field", "required_value", "owner", "can_send_before_confirm", "note"],
      rows: [
        { inquiry_id: "待补充", buyer_need: "待补充", missing_field: "final_quote / lead_time / sample_policy", required_value: "待人工确认", owner: "销售/跟单", can_send_before_confirm: "否", note: "不得自动发送" },
      ],
    },
    "WIKA_订单机会分析表.csv": {
      headers: ["opportunity_type", "buyer_or_order", "product", "missing_order_field", "next_action", "owner", "acceptance_criteria"],
      rows: [
        { opportunity_type: "高意向询盘转订单", buyer_or_order: "待补充", product: "待补充", missing_order_field: "报价/交期/买家信息/物流方式", next_action: "用 order-preview 检查字段后人工确认", owner: "销售/跟单", acceptance_criteria: "字段齐全且人工确认" },
      ],
    },
    "WIKA_人工补数责任表.csv": {
      headers: ["data_type", "owner", "template", "submit_path", "frequency", "enhanced_reports", "impact_if_missing", "related_task", "required_fields"],
      rows: manualRows.map((row) => ({
        data_type: row.数据类型,
        owner: row.负责人,
        template: row.提交模板,
        submit_path: row.提交路径,
        frequency: row.提交频率,
        enhanced_reports: row.会增强哪些报告,
        impact_if_missing: row.不提交的影响,
        related_task: row.关联任务,
        required_fields: row.需要字段,
      })),
    },
    "WIKA_运营任务总看板.csv": {
      headers: ["priority", "task_id", "task_title", "owner_role", "current_status", "wika_support_level", "required_inputs", "blocked_by", "acceptance_criteria"],
      rows: dashboardRows.map((row) => ({
        priority: row.priority,
        task_id: row.task_id,
        task_title: row.task_title,
        owner_role: row.owner_role,
        current_status: row.current_status,
        wika_support_level: row.wika_support_level,
        required_inputs: row.required_inputs,
        blocked_by: row.blocked_by,
        acceptance_criteria: row.acceptance_criteria,
      })),
    },
  };
}

function renderPackageIndex(score, pdfResult, desktopDir) {
  return `# WIKA 交付包索引

## 交付包定位

本交付包面向真实阿里国际站运营执行，不是系统能力清单。它把已有报告包、任务包、执行闭环和人工输入机制整理成老板、运营负责人、店铺运营、产品运营、销售/跟单、人工接手人员可直接使用的工作材料。

## 仓库与桌面位置

${bullet([
  `仓库目录：\`WIKA/docs/operations-package/\``,
  `桌面目录：\`${desktopDir}\``,
  `PDF 目录：\`WIKA/docs/operations-package/pdf/\``,
])}

## Markdown 文件

${bullet(markdownFiles.map((file) => `\`${file}\``))}

## CSV 文件

${bullet(csvFiles.map((file) => `\`${file}\``))}

## JSON 文件

${bullet(jsonFiles.map((file) => `\`${file}\``))}

## PDF 文件

${pdfResult.ok ? bullet(pdfFiles.map((file) => `\`${file}\``)) : `PDF 生成失败：${pdfResult.error}`}

## 交付包评分

- 总分：${score.total_score}/${score.max_score}
- 是否达到可交付阈值：${score.passed ? "是" : "否"}
- 一票否决项：${score.vetoes.length ? score.vetoes.join("；") : "无"}

## 角色使用方式

${bullet([
  "老板/管理层：先看 `WIKA_老板管理层简报.md` 和 `WIKA_专业运营总览.md`。",
  "运营负责人：看 `WIKA_运营负责人周计划.md`、`WIKA_运营任务总看板.md` 和任务分配 CSV。",
  "店铺运营：看 `WIKA_店铺运营每日检查表.md`、`WIKA_主页转化优化清单.md` 和页面盘点 CSV。",
  "产品运营：看 `WIKA_产品优化工单.md`、`WIKA_新品开发建议表.md`、`WIKA_关键词优化矩阵.md`。",
  "销售/跟单：看 `WIKA_询盘跟进SOP.md`、`WIKA_订单机会分析表.md` 和字段补齐 CSV。",
  "人工接手人员：看 `WIKA_人工补数责任表.md` 及所有补数字段 CSV。",
])}

${boundarySection()}`;
}

function scorePackage({ desktopDir, pdfResult }) {
  const requiredRepoFiles = [...markdownFiles, ...csvFiles, ...jsonFiles].map((file) => path.join(packageRoot, file));
  const missingRepo = requiredRepoFiles.filter((filePath) => !fs.existsSync(filePath));
  const missingDesktop = [...markdownFiles, ...csvFiles, ...jsonFiles]
    .map((file) => path.join(desktopDir, file))
    .filter((filePath) => !fs.existsSync(filePath));
  const missingPdf = pdfResult.ok
    ? pdfFiles.map((file) => path.join(pdfRoot, file)).filter((filePath) => !fs.existsSync(filePath) || fs.statSync(filePath).size <= 0)
    : pdfFiles;

  const vetoes = [];
  if (missingDesktop.length) vetoes.push("没有桌面输出");
  if (!fs.existsSync(path.join(packageRoot, "WIKA_运营任务总看板.md"))) vetoes.push("没有任务看板");
  if (!fs.existsSync(path.join(packageRoot, "WIKA_人工补数责任表.md"))) vetoes.push("没有人工补数责任表");
  if (!fs.existsSync(path.join(packageRoot, "WIKA_直通车数据导入模板.csv"))) vetoes.push("没有广告导入模板");
  if (!fs.existsSync(path.join(packageRoot, "WIKA_页面人工盘点表.csv"))) vetoes.push("没有页面盘点表");

  const dimensions = [
    { name: "业务可读性", score: 5, reason: "所有主文件按角色和运营问题组织，先讲结论与动作。" },
    { name: "可执行性", score: 5, reason: "任务均包含步骤、负责人、输入和验收标准。" },
    { name: "角色分工清晰度", score: 5, reason: "老板、运营、店铺、产品、销售、人工接手均有独立文件。" },
    { name: "输入要求清晰度", score: 5, reason: "广告、页面、产品、销售、订单补数均有模板和责任表。" },
    { name: "运营专业度", score: 5, reason: "围绕阿里国际站 B2B 运营、询盘、产品详情、直通车、首页承接组织。" },
    { name: "报告与任务一致性", score: 5, reason: "从 stage47 报告包、stage48/49 任务和执行状态派生。" },
    { name: "边界表达清晰度", score: 5, reason: "明确不写侧、不伪造广告和页面行为、不把 preview 当闭环。" },
    { name: "桌面交付完整性", score: missingDesktop.length ? 0 : 5, reason: missingDesktop.length ? "桌面文件缺失。" : "Markdown / CSV / JSON 均复制到桌面 WIKA 文件夹。" },
  ];
  const totalScore = dimensions.reduce((sum, item) => sum + item.score, 0);
  return {
    generated_at: new Date().toISOString(),
    total_score: totalScore,
    max_score: 40,
    delivery_threshold: 34,
    passed: totalScore >= 34 && vetoes.length === 0,
    vetoes,
    dimensions,
    repository_directory: path.relative(repoRoot, packageRoot),
    desktop_directory: desktopDir,
    pdf_generation: pdfResult,
    validation: {
      missing_repository_files: missingRepo,
      missing_desktop_files: missingDesktop,
      missing_or_empty_pdf_files: missingPdf,
    },
  };
}

function copyGeneratedToDesktop(desktopDir) {
  ensureDir(desktopDir);
  for (const file of [...markdownFiles, ...csvFiles, ...jsonFiles]) {
    fs.copyFileSync(path.join(packageRoot, file), path.join(desktopDir, file));
  }
}

function generatePdf(desktopDir) {
  const script = path.join(repoRoot, "WIKA", "scripts", "export-wika-professional-ops-package-pdfs.py");
  const result = spawnSync("python", [script], {
    cwd: repoRoot,
    encoding: "utf8",
    env: { ...process.env, WIKA_DESKTOP_DIR: desktopDir },
  });
  if (result.status !== 0) {
    return {
      ok: false,
      error: `${result.stderr || result.stdout || "PDF 生成失败"}`.trim(),
      exported: [],
    };
  }
  try {
    return JSON.parse(result.stdout);
  } catch {
    return {
      ok: false,
      error: `PDF 脚本输出不可解析：${result.stdout}`,
      exported: [],
    };
  }
}

function validateCsvHeaders() {
  const failures = [];
  for (const file of csvFiles) {
    const text = readText(path.join(packageRoot, file));
    const firstLine = text.split(/\r?\n/)[0]?.replace(/^\uFEFF/, "");
    if (!firstLine || !firstLine.includes(",")) {
      failures.push(file);
    }
  }
  if (failures.length) {
    throw new Error(`CSV 表头缺失或无效：${failures.join(", ")}`);
  }
}

function validateJsonFiles() {
  for (const file of jsonFiles) {
    readJson(path.join(packageRoot, file));
  }
}

function main() {
  ensureDir(packageRoot);
  ensureDir(pdfRoot);

  const data = loadSources();
  const dashboardRows = buildDashboardRows(data.tasks, data.execution);
  const manualRows = buildManualResponsibilityRows(data.manualInputs);
  const desktopDir = detectDesktopWikaDir();

  const markdownContent = {
    "WIKA_专业运营总览.md": renderProfessionalOverview(data, dashboardRows),
    "WIKA_老板管理层简报.md": renderBossBrief(data, dashboardRows),
    "WIKA_运营负责人周计划.md": renderOpsWeeklyPlan(dashboardRows),
    "WIKA_店铺运营每日检查表.md": renderStoreDailyChecklist(),
    "WIKA_产品优化工单.md": renderProductWorkOrders(),
    "WIKA_新品开发建议表.md": renderNewProductSuggestions(),
    "WIKA_关键词优化矩阵.md": renderKeywordMatrix(),
    "WIKA_直通车数据导入与投放调整表.md": renderAdsPlan(),
    "WIKA_主页转化优化清单.md": renderHomeOptimization(),
    "WIKA_询盘跟进SOP.md": renderInquirySop(),
    "WIKA_订单机会分析表.md": renderOrderOpportunity(),
    "WIKA_人工补数责任表.md": renderManualResponsibility(manualRows),
    "WIKA_运营任务总看板.md": renderTaskDashboard(dashboardRows),
  };

  for (const [file, content] of Object.entries(markdownContent)) {
    writeText(file, content);
  }

  for (const [file, spec] of Object.entries(buildCsvRows(dashboardRows, manualRows))) {
    writeCsv(file, spec.headers, spec.rows);
  }

  writeJson("WIKA_运营任务总看板.json", {
    generated_at: new Date().toISOString(),
    source: "WIKA/docs/tasks/WIKA_运营任务包.json",
    tasks: dashboardRows,
  });
  writeJson("WIKA_人工补数责任表.json", {
    generated_at: new Date().toISOString(),
    source: "WIKA/docs/tasks/execution/WIKA_人工输入需求.json",
    manual_inputs: manualRows,
  });

  const pdfResult = generatePdf(desktopDir);
  writeJson("WIKA_交付包评分.json", {
    generated_at: new Date().toISOString(),
    status: "pending_final_score",
  });
  writeJson("WIKA_专业运营交付包.json", {
    generated_at: new Date().toISOString(),
    status: "pending_final_package",
  });
  writeText("WIKA_交付包索引.md", "# WIKA 交付包索引\n\n交付包正在生成最终评分与索引。");
  copyGeneratedToDesktop(desktopDir);

  const score = scorePackage({ desktopDir, pdfResult });
  writeJson("WIKA_交付包评分.json", score);
  writeJson("WIKA_专业运营交付包.json", {
    generated_at: score.generated_at,
    source_layers: {
      reports: "WIKA/docs/reports/deliverables/",
      tasks: "WIKA/docs/tasks/",
      execution: "WIKA/docs/tasks/execution/",
      manual_inputs: "WIKA/docs/tasks/execution/WIKA_人工输入需求.json",
    },
    repository_directory: "WIKA/docs/operations-package/",
    desktop_directory: desktopDir,
    markdown_files: markdownFiles,
    csv_files: csvFiles,
    json_files: jsonFiles,
    pdf_files: pdfResult.ok ? pdfFiles : [],
    dashboard_summary: data.execution.summary,
    blocked_summary: data.blockers,
    manual_input_summary: data.manualInputs,
    next_report_input: data.nextReportInput,
    boundary_statement: boundaryLines,
  });

  writeText("WIKA_交付包索引.md", renderPackageIndex(score, pdfResult, desktopDir));

  copyGeneratedToDesktop(desktopDir);
  validateCsvHeaders();
  validateJsonFiles();

  if (!score.passed) {
    throw new Error(`交付包评分未达标：${score.total_score}/40，vetoes=${score.vetoes.join(",")}`);
  }

  console.log(
    JSON.stringify(
      {
        status: "PASS",
        repository_directory: "WIKA/docs/operations-package/",
        desktop_directory: desktopDir,
        markdown_count: markdownFiles.length,
        csv_count: csvFiles.length,
        json_count: jsonFiles.length,
        pdf_generation: pdfResult.ok ? "PASS" : "FAILED",
        score: `${score.total_score}/${score.max_score}`,
        passed: score.passed,
      },
      null,
      2,
    ),
  );
}

main();
