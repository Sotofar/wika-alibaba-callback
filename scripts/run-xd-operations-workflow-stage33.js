import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  ROOT,
  REPORTS_DIR,
  MONITORING_RUNS_DIR,
  WEEKLY_REPORT_PATH,
  WEEKLY_REPORT_EVIDENCE_PATH,
  parseArgs,
  writeJson,
  writeText,
  getLastCompleteNaturalWeek,
  scanForSensitiveValues
} from "./xd-stage31-common.js";
import { buildOperationsReport } from "./generate-xd-operations-report-stage31.js";
import { runCriticalRouteChecks } from "./check-xd-critical-routes-stage31.js";

const DEFAULT_TIMEZONE = "Asia/Shanghai";
const DEFAULT_OUTPUT_DIR = path.join(ROOT, "Ali-WIKA", "projects", "xd", "access", "operations", "runs");

function getDefaultDailyDate(timeZone = DEFAULT_TIMEZONE) {
  const week = getLastCompleteNaturalWeek(timeZone);
  const anchor = new Date(`${week.reference_date}T12:00:00Z`);
  anchor.setUTCDate(anchor.getUTCDate() - 1);
  return anchor.toISOString().slice(0, 10);
}

function resolveOutputDir(value) {
  if (!value) return DEFAULT_OUTPUT_DIR;
  return path.isAbsolute(value) ? value : path.join(ROOT, value);
}

function resolveWindows({ mode, date, weekStart, weekEnd, timeZone }) {
  const weeklyDefaults = getLastCompleteNaturalWeek(timeZone);
  return {
    dailyDate: date || getDefaultDailyDate(timeZone),
    weekStart: weekStart || weeklyDefaults.week_start,
    weekEnd: weekEnd || weeklyDefaults.week_end,
    mode
  };
}

function getWorkflowBaseName({ mode, dailyDate, weekStart, weekEnd }) {
  if (mode === "daily") return `xd_operations_workflow_daily_${dailyDate}`;
  if (mode === "weekly") return `xd_operations_workflow_weekly_${weekStart}_${weekEnd}`;
  return `xd_operations_workflow_both_${dailyDate}_${weekStart}_${weekEnd}`;
}

function getMonitoringBaseName({ mode, dailyDate, weekStart, weekEnd }) {
  if (mode === "daily") return `xd_critical_routes_stage33_daily_${dailyDate}`;
  if (mode === "weekly") return `xd_critical_routes_stage33_weekly_${weekStart}_${weekEnd}`;
  return `xd_critical_routes_stage33_both_${dailyDate}_${weekStart}_${weekEnd}`;
}

function renderMonitoringMarkdown(payload) {
  return [
    "# XD 关键 route 巡检结果（Stage33 Workflow）",
    "",
    `生成时间：${payload.generated_at}`,
    `overall_status=${payload.overall_status}`,
    "",
    "| name | target | expected | actual | classification | elapsed_ms | next_action |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...payload.checks.map(
      (item) =>
        `| ${item.name} | ${item.route_or_method} | ${item.expected_status} | ${item.actual_status} | ${item.classification} | ${item.elapsed_ms} | ${item.next_action} |`
    ),
    ""
  ].join("\n");
}

function getDailyReportPaths(date) {
  const markdownPath = path.join(REPORTS_DIR, `xd_daily_report_${date}.md`);
  return {
    markdownPath,
    jsonPath: markdownPath.replace(/\.md$/i, ".json")
  };
}

function getWeeklyReportPaths(start, end) {
  const windowMarkdownPath = path.join(REPORTS_DIR, `xd_weekly_report_${start}_${end}.md`);
  return {
    canonicalMarkdownPath: WEEKLY_REPORT_PATH,
    canonicalJsonPath: WEEKLY_REPORT_EVIDENCE_PATH,
    windowMarkdownPath,
    windowJsonPath: windowMarkdownPath.replace(/\.md$/i, ".json")
  };
}

function writeDailyReportBundle(bundle) {
  const paths = getDailyReportPaths(bundle.report.time_window.start);
  writeText(paths.markdownPath, `${bundle.markdown}\n`);
  writeJson(paths.jsonPath, bundle.report);
  return paths;
}

function writeWeeklyReportBundle(bundle) {
  const paths = getWeeklyReportPaths(bundle.report.time_window.start, bundle.report.time_window.end);
  writeText(paths.canonicalMarkdownPath, `${bundle.markdown}\n`);
  writeJson(paths.canonicalJsonPath, bundle.report);
  writeText(paths.windowMarkdownPath, `${bundle.markdown}\n`);
  writeJson(paths.windowJsonPath, bundle.report);
  return paths;
}

function summarizeMonitoring(payload, outputBase) {
  const counts = payload.checks.reduce((acc, item) => {
    acc[item.classification] = (acc[item.classification] || 0) + 1;
    return acc;
  }, {});
  return {
    status: payload.overall_status === "FAIL" ? "failed" : "ok",
    overall_status: payload.overall_status,
    safe_scope_complete: payload.safe_scope_complete ?? null,
    checks_total: payload.checks.length,
    classification_counts: counts,
    output_markdown_path: `${outputBase}.md`,
    output_json_path: `${outputBase}.json`
  };
}

function summarizeReportBundle(bundle, mode, paths) {
  return {
    status: "ok",
    mode,
    source_mode: bundle.report.source_mode,
    time_window: bundle.report.time_window,
    output_markdown_path: mode === "daily" ? paths.markdownPath : paths.canonicalMarkdownPath,
    output_json_path: mode === "daily" ? paths.jsonPath : paths.canonicalJsonPath,
    window_output_markdown_path: mode === "weekly" ? paths.windowMarkdownPath : null,
    window_output_json_path: mode === "weekly" ? paths.windowJsonPath : null,
    visible_order_count_current_page: bundle.report.orders?.visible_order_count_current_page?.value ?? "not_available",
    total_order_count_signal: bundle.report.orders?.total_order_count_from_current_page_response?.value ?? "not_available",
    visible_product_count_current_page: bundle.report.products?.visible_product_count_current_page?.value ?? "not_available",
    total_product_count_signal: bundle.report.products?.total_product_count_from_current_page_response?.value ?? "not_available",
    route_gap_count: bundle.report.capability_state?.route_gap_count ?? "not_available",
    candidate_unresolved_count: bundle.report.capability_state?.candidate_unresolved_count ?? "not_available"
  };
}

function buildStepFailure(name, error) {
  return {
    status: "failed",
    name,
    error: String(error?.message || error)
  };
}

function buildNextAction(summary) {
  if (summary.monitoring?.overall_status === "FAIL") {
    return "先修复 /health 或 auth/debug 相关异常，再恢复日报 / 周报生产。";
  }
  if (summary.daily?.status === "failed" || summary.weekly?.status === "failed") {
    return "保留已经成功的监控结果，拆分执行 stage31 报告脚本定位失败步骤。";
  }
  if (summary.monitoring?.overall_status === "DEGRADED") {
    return "维持降级输出，明确不可讲指标，并优先排查退化 route。";
  }
  return "维持每日巡检 + 日报、每周周报 + 老板摘要的固定节奏。";
}

function renderWorkflowMarkdown(summary) {
  const lines = [
    "# XD 运营工作流结果 Stage33",
    "",
    `生成时间：${summary.generated_at}`,
    `mode=${summary.mode}`,
    `dry_run=${summary.dry_run}`,
    `overall_status=${summary.overall_status}`,
    "",
    "## 1. Monitoring",
    `- overall_status：${summary.monitoring?.overall_status || "not_available"}`,
    `- checks_total：${summary.monitoring?.checks_total ?? "not_available"}`,
    `- output_json：${summary.monitoring?.output_json_path || "not_available"}`,
    `- output_markdown：${summary.monitoring?.output_markdown_path || "not_available"}`,
    ""
  ];

  if (summary.daily) {
    lines.push("## 2. Daily Report");
    if (summary.daily.status === "failed") {
      lines.push(`- status：failed`);
      lines.push(`- error：${summary.daily.error}`);
    } else {
      lines.push(`- time_window：${summary.daily.time_window.start} -> ${summary.daily.time_window.end}`);
      lines.push(`- source_mode：${summary.daily.source_mode}`);
      lines.push(`- visible_order_count_current_page：${summary.daily.visible_order_count_current_page}`);
      lines.push(`- visible_product_count_current_page：${summary.daily.visible_product_count_current_page}`);
      lines.push(`- output_json：${summary.daily.output_json_path}`);
      lines.push(`- output_markdown：${summary.daily.output_markdown_path}`);
    }
    lines.push("");
  }

  if (summary.weekly) {
    lines.push("## 3. Weekly Report");
    if (summary.weekly.status === "failed") {
      lines.push(`- status：failed`);
      lines.push(`- error：${summary.weekly.error}`);
    } else {
      lines.push(`- time_window：${summary.weekly.time_window.start} -> ${summary.weekly.time_window.end}`);
      lines.push(`- source_mode：${summary.weekly.source_mode}`);
      lines.push(`- visible_order_count_current_page：${summary.weekly.visible_order_count_current_page}`);
      lines.push(`- visible_product_count_current_page：${summary.weekly.visible_product_count_current_page}`);
      lines.push(`- output_json：${summary.weekly.output_json_path}`);
      lines.push(`- output_markdown：${summary.weekly.output_markdown_path}`);
    }
    lines.push("");
  }

  lines.push("## 4. Boundaries");
  for (const line of summary.boundaries) lines.push(`- ${line}`);
  lines.push("");
  lines.push("## 5. Next Action");
  lines.push(`- ${summary.next_action}`);
  lines.push("");
  return lines.join("\n");
}

export async function runXdOperationsWorkflow(options = {}) {
  const mode = options.mode || "both";
  const timeZone = options.timeZone || DEFAULT_TIMEZONE;
  const dryRun = Boolean(options.dryRun);
  const outputDir = resolveOutputDir(options.outputDir);
  const windows = resolveWindows({
    mode,
    date: options.date,
    weekStart: options.weekStart,
    weekEnd: options.weekEnd,
    timeZone
  });

  const monitoringBase = path.join(MONITORING_RUNS_DIR, getMonitoringBaseName(windows));
  const summaryBase = path.join(outputDir, getWorkflowBaseName(windows));

  const summary = {
    generated_at: new Date().toISOString(),
    mode,
    dry_run: dryRun,
    timeZone,
    output_markdown_path: `${summaryBase}.md`,
    output_json_path: `${summaryBase}.json`,
    monitoring: null,
    daily: null,
    weekly: null,
    boundaries: [
      "当前页样本不是全量。",
      "total_count / total_item 只是总量信号，不是严格窗口业务结果。",
      "fund/logistics 只是样本覆盖信号，不是稳定经营指标。",
      "不输出 GMV、转化率、国家结构、完整经营诊断。",
      "restriction 对象只能按 stage30 reopen gate 受控重开。"
    ],
    overall_status: "PASS",
    next_action: "待生成"
  };

  try {
    const monitoringPayload = await runCriticalRouteChecks({ dryRun });
    if (!dryRun) {
      writeJson(`${monitoringBase}.json`, monitoringPayload);
      writeText(`${monitoringBase}.md`, `${renderMonitoringMarkdown(monitoringPayload)}\n`);
    }
    summary.monitoring = summarizeMonitoring(monitoringPayload, monitoringBase);
  } catch (error) {
    summary.monitoring = buildStepFailure("monitoring", error);
  }

  if (mode === "daily" || mode === "both") {
    try {
      const bundle = await buildOperationsReport({
        mode: "daily",
        timeZone,
        start: windows.dailyDate,
        end: windows.dailyDate,
        fromEvidence: dryRun
      });
      const paths = dryRun
        ? getDailyReportPaths(bundle.report.time_window.start)
        : writeDailyReportBundle(bundle);
      summary.daily = summarizeReportBundle(bundle, "daily", paths);
    } catch (error) {
      summary.daily = buildStepFailure("daily", error);
    }
  }

  if (mode === "weekly" || mode === "both") {
    try {
      const bundle = await buildOperationsReport({
        mode: "weekly",
        timeZone,
        start: windows.weekStart,
        end: windows.weekEnd,
        fromEvidence: dryRun
      });
      const paths = dryRun
        ? getWeeklyReportPaths(bundle.report.time_window.start, bundle.report.time_window.end)
        : writeWeeklyReportBundle(bundle);
      summary.weekly = summarizeReportBundle(bundle, "weekly", paths);
    } catch (error) {
      summary.weekly = buildStepFailure("weekly", error);
    }
  }

  const monitorFail = summary.monitoring?.status === "failed" || summary.monitoring?.overall_status === "FAIL";
  const anyFailed = [summary.daily, summary.weekly].some((item) => item?.status === "failed");
  const degraded = summary.monitoring?.overall_status === "DEGRADED";
  summary.overall_status = monitorFail ? "FAIL" : anyFailed || degraded ? "DEGRADED" : "PASS";
  summary.next_action = buildNextAction(summary);

  const markdown = renderWorkflowMarkdown(summary);
  const serialized = JSON.stringify(summary);
  if (scanForSensitiveValues(serialized) || scanForSensitiveValues(markdown)) {
    throw new Error("Sensitive value pattern detected in stage33 workflow output.");
  }

  if (!dryRun) {
    writeJson(summary.output_json_path, summary);
    writeText(summary.output_markdown_path, `${markdown}\n`);
  }

  return summary;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const summary = await runXdOperationsWorkflow({
    mode: args.mode || "both",
    date: args.date,
    weekStart: args["week-start"],
    weekEnd: args["week-end"],
    timeZone: args.timezone || DEFAULT_TIMEZONE,
    dryRun: Boolean(args["dry-run"]),
    outputDir: args["output-dir"]
  });
  console.log(JSON.stringify(summary, null, 2));
  return summary;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error?.stack || String(error));
    process.exitCode = 1;
  });
}
