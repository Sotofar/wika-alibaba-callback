import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..", "..");
const DELIVERABLE_DIR = path.join(ROOT_DIR, "WIKA", "docs", "reports", "deliverables");

const OUTBOX_FILES = [
  "WIKA_老板管理层分发包_STAGE49.md",
  "WIKA_运营负责人分发包_STAGE49.md",
  "WIKA_店铺运营分发包_STAGE49.md",
  "WIKA_产品运营分发包_STAGE49.md",
  "WIKA_销售跟单分发包_STAGE49.md",
  "WIKA_人工接手分发包_STAGE49.md"
].map((file) => path.join(DELIVERABLE_DIR, "distribution", "stage49_outbox", file));

const FEEDBACK_FILES = [
  path.join(DELIVERABLE_DIR, "feedback", "WIKA_业务试用反馈表_STAGE49.md"),
  path.join(DELIVERABLE_DIR, "feedback", "WIKA_角色反馈问题清单_STAGE49.csv"),
  path.join(DELIVERABLE_DIR, "feedback", "WIKA_反馈回收与改进规则_STAGE49.md")
];

const INTAKE_FILES = [
  "WIKA_广告数据补充模板_STAGE49.csv",
  "WIKA_页面盘点补充模板_STAGE49.csv",
  "WIKA_产品素材补充模板_STAGE49.csv",
  "WIKA_销售跟单补充模板_STAGE49.csv",
  "WIKA_订单末端确认模板_STAGE49.csv",
  "WIKA_人工补数回收说明_STAGE49.md"
].map((file) => path.join(DELIVERABLE_DIR, "handoff", "stage49_intake", file));

const REQUIRED_FILES = [
  path.join(DELIVERABLE_DIR, "distribution", "WIKA_分发执行总索引_STAGE49.md"),
  path.join(DELIVERABLE_DIR, "evidence", "WIKA_stage49_rerun_rehearsal.json"),
  path.join(DELIVERABLE_DIR, "evidence", "WIKA_正式运营报告包_STAGE49证据.json"),
  ...OUTBOX_FILES,
  ...FEEDBACK_FILES,
  ...INTAKE_FILES
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
}

function assertExists(filePath) {
  assert(fs.existsSync(filePath), `Missing required file: ${filePath}`);
}

function readJson(filePath) {
  assertExists(filePath);
  return JSON.parse(readText(filePath));
}

function assertNoPlainSecrets(filePath) {
  const text = readText(filePath);
  const riskyPatterns = [
    /access[_-]?token\s*[:=]\s*['"]?[A-Za-z0-9._-]{16,}/i,
    /refresh[_-]?token\s*[:=]\s*['"]?[A-Za-z0-9._-]{16,}/i,
    /client[_-]?secret\s*[:=]\s*['"]?[A-Za-z0-9._-]{16,}/i,
    /cookie\s*[:=]\s*['"]?[A-Za-z0-9._=;-]{24,}/i
  ];
  for (const pattern of riskyPatterns) assert(!pattern.test(text), `Potential plain secret found in ${filePath}`);
}

function assertNoFalseClaims(filePath) {
  const lines = readText(filePath).split(/\r?\n/);
  lines.forEach((line, index) => {
    const lower = line.toLowerCase();
    const negative = /(not|不是|未|不应|不能|不得|没有|不把)/i.test(line);
    const groupedTaskRange = /task1-5|task1~5/i.test(line);
    const riskyTask = /task\s*[1-5].*complete/.test(lower) && !negative && !groupedTaskRange;
    const riskyFilled = /(已补齐|已经补齐|已全部补齐)/.test(line) && !negative;
    const riskyDegradedEliminated = /(degraded.*完全消除|完全消除.*degraded|degraded.*已消除)/i.test(line) && !negative;
    assert(!riskyTask, `False task completion claim in ${filePath}:${index + 1}`);
    assert(!riskyFilled, `Manual input falsely marked filled in ${filePath}:${index + 1}`);
    assert(!riskyDegradedEliminated, `Degraded route falsely marked eliminated in ${filePath}:${index + 1}`);
  });
}

function assertCsvHeaders() {
  const intakeDir = path.join(DELIVERABLE_DIR, "handoff", "stage49_intake");
  const csvFiles = fs.readdirSync(intakeDir).filter((file) => file.endsWith(".csv"));
  for (const file of csvFiles) {
    const filePath = path.join(intakeDir, file);
    const header = readText(filePath).split(/\r?\n/)[0];
    for (const required of ["owner", "due_date", "source_file_or_link", "confidence", "notes", "codex_next_action", "example_value", "field_notes"]) {
      assert(header.includes(required), `${file} missing required column: ${required}`);
    }
  }
}

function main() {
  for (const filePath of REQUIRED_FILES) assertExists(filePath);
  const evidence = readJson(path.join(DELIVERABLE_DIR, "evidence", "WIKA_正式运营报告包_STAGE49证据.json"));
  const rehearsal = readJson(path.join(DELIVERABLE_DIR, "evidence", "WIKA_stage49_rerun_rehearsal.json"));

  assert(evidence.stage48_baseline_confirmed === true, "stage48 baseline not confirmed.");
  assert(evidence.distribution_outbox_created === true, "distribution outbox not confirmed.");
  assert(evidence.outbox_role_count === 6, "outbox role count must be 6.");
  assert(evidence.feedback_pack_created === true, "feedback pack not confirmed.");
  assert(evidence.manual_intake_template_count === 5, "manual intake template count must be 5.");
  assert(evidence.rerun_rehearsal_status === "DEGRADED_ACCEPTED", "rerun rehearsal must be DEGRADED_ACCEPTED.");
  assert(rehearsal.overall_status === "DEGRADED", "stage49 rehearsal raw status should be DEGRADED before accepted classification.");
  assert(Array.isArray(evidence.accepted_degraded_routes) && evidence.accepted_degraded_routes.length === 3, "accepted degraded route count must be 3.");

  for (const filePath of REQUIRED_FILES.filter((file) => /\.(md|csv|json)$/i.test(file))) {
    assertNoPlainSecrets(filePath);
    assertNoFalseClaims(filePath);
  }
  assertCsvHeaders();

  console.log(JSON.stringify({
    stage: "stage49-wika-business-distribution-and-manual-input-intake",
    validation: "PASS",
    outbox_files: OUTBOX_FILES.length,
    feedback_files: FEEDBACK_FILES.length,
    intake_templates: 5,
    rerun_rehearsal_status: evidence.rerun_rehearsal_status
  }, null, 2));
}

main();

