import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildBlockerList,
  buildExecutionStatuses,
  buildManualInputRequirements,
  buildNextReportInputPackage,
  summarizeExecution,
} from "../projects/wika/data/tasks/task-status-updater.js";
import {
  renderBlockedDashboard,
  renderDailyTemplate,
  renderEvidenceTemplate,
  renderExecutionDashboard,
  renderExecutionLoopGuide,
  renderInputChecklist,
  renderP1Dashboard,
  renderRoleDashboard,
  renderWeeklyPlan,
  renderWeeklyReviewTemplate,
  scoreExecutionLoop,
} from "../projects/wika/data/tasks/task-execution-writer.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");
const tasksRoot = path.join(repoRoot, "WIKA", "docs", "tasks");
const executionRoot = path.join(tasksRoot, "execution");
const inputsRoot = path.join(tasksRoot, "inputs");
const sourceTaskPackage = path.join(tasksRoot, "WIKA_运营任务包.json");

function parseArgs(argv) {
  const args = {
    manualInputPath: path.join(executionRoot, "manual-task-status-input.example.json"),
    useManualInput: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--manual-input" && argv[index + 1]) {
      args.manualInputPath = path.resolve(repoRoot, argv[index + 1]);
      args.useManualInput = true;
      index += 1;
    } else if (arg.startsWith("--manual-input=")) {
      args.manualInputPath = path.resolve(repoRoot, arg.slice("--manual-input=".length));
      args.useManualInput = true;
    }
  }
  return args;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeText(filePath, text) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, text, "utf8");
}

function writeJson(filePath, data) {
  writeText(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function loadManualInput(args) {
  if (!args.useManualInput) return {};
  if (!fs.existsSync(args.manualInputPath)) {
    throw new Error(`人工状态输入文件不存在: ${args.manualInputPath}`);
  }
  return readJson(args.manualInputPath);
}

function inputItemsByCategory(manualInputs, predicate) {
  return manualInputs.filter(predicate);
}

function generateManualStatusExample(tasks) {
  const firstTask = tasks.find((task) => task.priority === "P1");
  return {
    description: "复制本文件为 manual-task-status-input.json 后，可按任务 ID 覆盖默认状态。不要把平台内写动作写成已自动完成。",
    task_overrides: firstTask
      ? {
          [firstTask.task_id]: {
            current_status: "in_progress",
            status_reason: "示例：负责人已开始执行，等待证据回填。",
            actual_progress: ["示例：已完成第一步"],
            evidence_received: [],
            next_action: "示例：继续执行并补充证据位置。",
          },
        }
      : {},
  };
}

function generateArtifacts(args = parseArgs(process.argv.slice(2))) {
  if (!fs.existsSync(sourceTaskPackage)) {
    throw new Error(`缺少 stage48 任务包: ${sourceTaskPackage}`);
  }

  fs.mkdirSync(executionRoot, { recursive: true });
  fs.mkdirSync(inputsRoot, { recursive: true });

  const taskPackage = readJson(sourceTaskPackage);
  const tasks = taskPackage.tasks ?? [];
  const manualInput = loadManualInput(args);
  const generatedAt = new Date().toISOString();
  const statuses = buildExecutionStatuses(tasks, manualInput, generatedAt);
  const summary = summarizeExecution(statuses);
  const blockers = buildBlockerList(statuses);
  const manualInputs = buildManualInputRequirements(statuses);
  const nextReportInputPackage = buildNextReportInputPackage(statuses);
  const score = scoreExecutionLoop(statuses, {
    hasStatusModel: true,
    hasBlockedList: blockers.length > 0,
    hasManualInputs: manualInputs.length > 0,
    hasRoleViews: true,
    hasNextReportInputPackage: true,
    hasBoundaryStatements: true,
    blockedCount: blockers.length,
    manualInputCount: manualInputs.length,
  });

  const files = {
    executionDashboard: path.join(executionRoot, "WIKA_任务执行总看板.md"),
    p1Dashboard: path.join(executionRoot, "WIKA_P1任务执行看板.md"),
    blockedDashboard: path.join(executionRoot, "WIKA_blocked任务清障看板.md"),
    roleDashboard: path.join(executionRoot, "WIKA_按角色执行看板.md"),
    weeklyPlan: path.join(executionRoot, "WIKA_本周执行计划.md"),
    dailyTemplate: path.join(executionRoot, "WIKA_每日执行记录模板.md"),
    weeklyReviewTemplate: path.join(executionRoot, "WIKA_每周复盘记录模板.md"),
    evidenceTemplate: path.join(executionRoot, "WIKA_执行证据收集模板.md"),
    statusJson: path.join(executionRoot, "WIKA_任务执行状态.json"),
    blockedJson: path.join(executionRoot, "WIKA_任务阻塞清单.json"),
    manualInputsJson: path.join(executionRoot, "WIKA_人工输入需求.json"),
    nextReportInputJson: path.join(executionRoot, "WIKA_下一轮报告输入包.json"),
    scoreJson: path.join(executionRoot, "WIKA_任务执行闭环评分.json"),
    manualExampleJson: path.join(executionRoot, "manual-task-status-input.example.json"),
    executionLoopGuide: path.join(tasksRoot, "WIKA_运营任务执行闭环说明.md"),
    adsInputs: path.join(inputsRoot, "WIKA_广告数据回收清单.md"),
    pageInputs: path.join(inputsRoot, "WIKA_页面盘点回收清单.md"),
    productInputs: path.join(inputsRoot, "WIKA_产品素材回收清单.md"),
    salesInputs: path.join(inputsRoot, "WIKA_销售跟单信息回收清单.md"),
    orderInputs: path.join(inputsRoot, "WIKA_订单字段回收清单.md"),
    allInputs: path.join(inputsRoot, "WIKA_人工输入总清单.md"),
  };

  writeText(files.executionDashboard, renderExecutionDashboard(statuses, summary));
  writeText(files.p1Dashboard, renderP1Dashboard(statuses));
  writeText(files.blockedDashboard, renderBlockedDashboard(statuses));
  writeText(files.roleDashboard, renderRoleDashboard(statuses));
  writeText(files.weeklyPlan, renderWeeklyPlan(statuses));
  writeText(files.dailyTemplate, renderDailyTemplate(statuses));
  writeText(files.weeklyReviewTemplate, renderWeeklyReviewTemplate(statuses));
  writeText(files.evidenceTemplate, renderEvidenceTemplate());
  writeText(files.executionLoopGuide, renderExecutionLoopGuide(summary));

  writeText(
    files.adsInputs,
    renderInputChecklist(
      "WIKA 广告数据回收清单",
      inputItemsByCategory(manualInputs, (item) => item.task_id.startsWith("ADS-")),
      "用于回收真实广告导出样本，进入广告分析报告、运营周报和经营诊断报告。"
    )
  );
  writeText(
    files.pageInputs,
    renderInputChecklist(
      "WIKA 页面盘点回收清单",
      inputItemsByCategory(manualInputs, (item) => item.task_id.startsWith("PAGE-") || item.task_id.startsWith("STORE-")),
      "用于回收首页模块、banner、类目入口、询盘入口和页面问题记录。"
    )
  );
  writeText(
    files.productInputs,
    renderInputChecklist(
      "WIKA 产品素材回收清单",
      inputItemsByCategory(manualInputs, (item) => item.task_id.startsWith("PROD-")),
      "用于回收产品标题、关键词、详情、图片、视频、规格、材质和新品方向输入。"
    )
  );
  writeText(
    files.salesInputs,
    renderInputChecklist(
      "WIKA 销售跟单信息回收清单",
      inputItemsByCategory(manualInputs, (item) => item.task_id.startsWith("SALES-")),
      "用于回收 reply/order 草稿最终发送或创单前必须由人工确认的信息。"
    )
  );
  writeText(
    files.orderInputs,
    renderInputChecklist(
      "WIKA 订单字段回收清单",
      inputItemsByCategory(manualInputs, (item) => item.task_id.startsWith("HANDOFF-") || item.task_id.includes("ORDER")),
      "用于回收报价、交期、样品、买家信息和订单末端人工确认字段。"
    )
  );
  writeText(
    files.allInputs,
    renderInputChecklist(
      "WIKA 人工输入总清单",
      manualInputs,
      "本清单汇总所有需要人工补齐、确认或交接的输入，是下一轮报告质量提升的主要输入源。"
    )
  );

  writeJson(files.statusJson, { generated_at: generatedAt, source: "WIKA/docs/tasks/WIKA_运营任务包.json", summary, tasks: statuses });
  writeJson(files.blockedJson, { generated_at: generatedAt, count: blockers.length, blockers });
  writeJson(files.manualInputsJson, { generated_at: generatedAt, count: manualInputs.length, manual_inputs: manualInputs });
  writeJson(files.nextReportInputJson, { generated_at: generatedAt, ...nextReportInputPackage });
  writeJson(files.scoreJson, score);
  if (!fs.existsSync(files.manualExampleJson)) {
    writeJson(files.manualExampleJson, generateManualStatusExample(tasks));
  }

  return {
    generated_at: generatedAt,
    total_tasks: statuses.length,
    status_distribution: summary.status_distribution,
    blocked_count: blockers.length,
    manual_input_count: manualInputs.length,
    score: `${score.total_score}/${score.max_score}`,
    passed: score.passed,
    files: Object.fromEntries(Object.entries(files).map(([key, filePath]) => [key, path.relative(repoRoot, filePath)])),
  };
}

const result = generateArtifacts();
console.log(JSON.stringify(result, null, 2));
