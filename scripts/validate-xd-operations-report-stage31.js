import { pathToFileURL } from "node:url";
import { buildOperationsReport } from "./generate-xd-operations-report-stage31.js";
import {
  WEEKLY_REPORT_PATH,
  WEEKLY_REPORT_EVIDENCE_PATH,
  exists,
  readJson,
  readText,
  scanForSensitiveValues
} from "./xd-stage31-common.js";

const REQUIRED_SECTIONS = [
  "# 1. 报告范围",
  "# 2. 执行摘要",
  "# 3. 订单运营摘要",
  "# 4. 商品与内容摘要",
  "# 5. 运行与能力状态",
  "# 6. 风险与限制",
  "# 7. 下周建议动作"
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export async function validateOperationsReportStage31() {
  const probe = await buildOperationsReport({
    mode: "weekly",
    timeZone: "Asia/Shanghai",
    start: "2026-04-06",
    end: "2026-04-12",
    fromEvidence: true
  });
  for (const section of REQUIRED_SECTIONS) {
    assert(probe.markdown.includes(section), `Missing required section: ${section}`);
  }
  assert(probe.report.orders, "Missing orders section in structured report.");
  assert(probe.report.products, "Missing products section in structured report.");
  assert(probe.report.capability_state, "Missing capability_state section in structured report.");
  assert(!scanForSensitiveValues(probe.markdown), "Sensitive value pattern detected in markdown probe.");
  assert(!scanForSensitiveValues(JSON.stringify(probe.report)), "Sensitive value pattern detected in JSON probe.");

  assert(exists(WEEKLY_REPORT_PATH), `Missing weekly report markdown: ${WEEKLY_REPORT_PATH}`);
  assert(exists(WEEKLY_REPORT_EVIDENCE_PATH), `Missing weekly report evidence: ${WEEKLY_REPORT_EVIDENCE_PATH}`);

  const markdown = readText(WEEKLY_REPORT_PATH);
  const reportJson = readJson(WEEKLY_REPORT_EVIDENCE_PATH);
  for (const section of REQUIRED_SECTIONS) {
    assert(markdown.includes(section), `Generated markdown missing required section: ${section}`);
  }
  assert(reportJson.time_window?.start, "Generated JSON missing time_window.start.");
  assert(reportJson.time_window?.end, "Generated JSON missing time_window.end.");
  assert(Array.isArray(reportJson.executive_summary), "Generated JSON missing executive_summary array.");
  assert(!/GMV[:：]\s*\d/i.test(markdown), "Generated markdown contains claimed GMV value.");
  assert(!/转化率[:：]\s*\d/i.test(markdown), "Generated markdown contains claimed conversion rate.");
  assert(!/国家结构[:：]\s*\d/i.test(markdown), "Generated markdown contains claimed country mix.");
  assert(!scanForSensitiveValues(markdown), "Generated markdown contains sensitive value pattern.");
  assert(!scanForSensitiveValues(JSON.stringify(reportJson)), "Generated JSON contains sensitive value pattern.");

  return {
    status: "ok",
    markdown_path: WEEKLY_REPORT_PATH,
    json_path: WEEKLY_REPORT_EVIDENCE_PATH,
    section_count: REQUIRED_SECTIONS.length
  };
}

async function main() {
  const result = await validateOperationsReportStage31();
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error?.stack || String(error));
    process.exitCode = 1;
  });
}
