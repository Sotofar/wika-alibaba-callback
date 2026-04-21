#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');

const requiredFiles = [
  'WIKA/docs/reports/deliverables/distribution/stage51_dispatch/WIKA_收件人登记表_STAGE51.csv',
  'WIKA/docs/reports/deliverables/distribution/stage51_dispatch/WIKA_正式发送排期_STAGE51.csv',
  'WIKA/docs/reports/deliverables/distribution/stage51_dispatch/WIKA_发送前检查清单_STAGE51.md',
  'WIKA/docs/reports/deliverables/distribution/WIKA_人工分发操作Runbook_STAGE51.md',
  'WIKA/docs/reports/deliverables/feedback/stage51_feedback_automation/WIKA_反馈录入模板_STAGE51.csv',
  'WIKA/docs/reports/deliverables/feedback/stage51_feedback_automation/WIKA_反馈triage规则_STAGE51.md',
  'WIKA/docs/reports/deliverables/feedback/stage51_feedback_automation/WIKA_反馈triage结果_STAGE51.json',
  'WIKA/docs/reports/deliverables/handoff/stage51_intake_automation/WIKA_补数文件登记表_STAGE51.csv',
  'WIKA/docs/reports/deliverables/handoff/stage51_intake_automation/WIKA_补数验收规则_STAGE51.md',
  'WIKA/docs/reports/deliverables/handoff/stage51_intake_automation/WIKA_补数验收结果_STAGE51.json',
  'WIKA/docs/reports/deliverables/evidence/WIKA_stage51_distribution_readiness_check.json',
  'WIKA/docs/reports/deliverables/evidence/WIKA_stage51_untracked_inventory.json',
  'WIKA/docs/reports/deliverables/evidence/WIKA_正式运营报告包_STAGE51证据.json',
  'WIKA/scripts/triage-wika-feedback-stage51.js',
  'WIKA/scripts/validate-wika-manual-intake-stage51.js'
];

const finalMessages = [
  'WIKA/docs/reports/deliverables/distribution/stage51_final_messages/WIKA_老板管理层最终发送消息_STAGE51.md',
  'WIKA/docs/reports/deliverables/distribution/stage51_final_messages/WIKA_运营负责人最终发送消息_STAGE51.md',
  'WIKA/docs/reports/deliverables/distribution/stage51_final_messages/WIKA_店铺运营最终发送消息_STAGE51.md',
  'WIKA/docs/reports/deliverables/distribution/stage51_final_messages/WIKA_产品运营最终发送消息_STAGE51.md',
  'WIKA/docs/reports/deliverables/distribution/stage51_final_messages/WIKA_销售跟单最终发送消息_STAGE51.md',
  'WIKA/docs/reports/deliverables/distribution/stage51_final_messages/WIKA_人工接手最终发送消息_STAGE51.md'
];

const scanRoots = [
  'WIKA/docs/reports/deliverables/distribution/stage51_dispatch',
  'WIKA/docs/reports/deliverables/distribution/stage51_final_messages',
  'WIKA/docs/reports/deliverables/distribution/WIKA_人工分发操作Runbook_STAGE51.md',
  'WIKA/docs/reports/deliverables/feedback/stage51_feedback_automation',
  'WIKA/docs/reports/deliverables/handoff/stage51_intake_automation',
  'WIKA/docs/reports/deliverables/evidence/WIKA_stage51_distribution_readiness_check.json',
  'WIKA/docs/reports/deliverables/evidence/WIKA_stage51_untracked_inventory.json',
  'WIKA/docs/reports/deliverables/evidence/WIKA_正式运营报告包_STAGE51证据.json',
  'WIKA/scripts/triage-wika-feedback-stage51.js',
  'WIKA/scripts/validate-wika-manual-intake-stage51.js'
];

const failures = [];

function fullPath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function readText(relativePath) {
  return fs.readFileSync(fullPath(relativePath), 'utf8').replace(/^\uFEFF/, '');
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function listFiles(relativePath) {
  const absolute = fullPath(relativePath);
  if (!fs.existsSync(absolute)) return [];
  const stat = fs.statSync(absolute);
  if (stat.isFile()) return [relativePath];
  return fs.readdirSync(absolute).flatMap((name) => {
    const child = path.join(relativePath, name).replace(/\\/g, '/');
    return fs.statSync(fullPath(child)).isDirectory() ? listFiles(child) : [child];
  });
}

function runNode(args) {
  return execFileSync(process.execPath, args, { cwd: repoRoot, encoding: 'utf8' });
}

for (const file of [...requiredFiles, ...finalMessages]) {
  assert(fs.existsSync(fullPath(file)), `missing required file: ${file}`);
}

const recipientRegistry = readText('WIKA/docs/reports/deliverables/distribution/stage51_dispatch/WIKA_收件人登记表_STAGE51.csv');
const dispatchSchedule = readText('WIKA/docs/reports/deliverables/distribution/stage51_dispatch/WIKA_正式发送排期_STAGE51.csv');
const feedbackResult = readJson('WIKA/docs/reports/deliverables/feedback/stage51_feedback_automation/WIKA_反馈triage结果_STAGE51.json');
const intakeResult = readJson('WIKA/docs/reports/deliverables/handoff/stage51_intake_automation/WIKA_补数验收结果_STAGE51.json');
const readiness = readJson('WIKA/docs/reports/deliverables/evidence/WIKA_stage51_distribution_readiness_check.json');
const evidence = readJson('WIKA/docs/reports/deliverables/evidence/WIKA_正式运营报告包_STAGE51证据.json');

for (const role of ['boss_management', 'ops_lead', 'store_operator', 'product_operator', 'sales_followup', 'human_handoff']) {
  assert(recipientRegistry.includes(role), `recipient registry missing role: ${role}`);
  assert(dispatchSchedule.includes(role), `dispatch schedule missing role: ${role}`);
}

assert(feedbackResult.feedback_count === 0, 'feedback dry-run should have zero real feedback');
assert(feedbackResult.no_message_sent === true, 'feedback triage must not send messages');
assert(intakeResult.waiting_owner_count === 5, 'manual intake dry-run should keep five WAITING_OWNER rows');
assert(intakeResult.no_business_write_action === true, 'manual intake validation must not write business data');
assert(readiness.overall_status === 'DEGRADED', 'distribution readiness raw status should preserve DEGRADED');
assert(evidence.distribution_readiness_status === 'DEGRADED_ACCEPTED', 'stage51 evidence should classify readiness as DEGRADED_ACCEPTED');
assert(evidence.actual_messages_sent === false, 'stage51 must not send real messages');
assert(evidence.actual_emails_sent === false, 'stage51 must not send real emails');
assert(evidence.business_write_actions_attempted === false, 'stage51 must not attempt business write actions');
assert(evidence.pdf_regenerated === false, 'stage51 must not regenerate PDFs');
assert(evidence.xd_touched === false, 'stage51 must not touch XD');

runNode([
  'WIKA/scripts/triage-wika-feedback-stage51.js',
  '--dry-run',
  '--input=WIKA/docs/reports/deliverables/feedback/stage51_feedback_automation/WIKA_反馈录入模板_STAGE51.csv',
  '--output=WIKA/docs/reports/deliverables/feedback/stage51_feedback_automation/WIKA_反馈triage结果_STAGE51.json'
]);

runNode([
  'WIKA/scripts/validate-wika-manual-intake-stage51.js',
  '--dry-run',
  '--registry=WIKA/docs/reports/deliverables/handoff/stage51_intake_automation/WIKA_补数文件登记表_STAGE51.csv',
  '--output=WIKA/docs/reports/deliverables/handoff/stage51_intake_automation/WIKA_补数验收结果_STAGE51.json'
]);

const secretPattern = /(refresh[_-]?token|access[_-]?token|secret|cookie)\s*[:=]\s*["']?[A-Za-z0-9_\-./+=]{12,}/i;
const forbiddenClaims = [
  { name: 'positive task complete claim', pattern: /task\s*[1-5]\s*(?:is\s*)?complete/i },
  { name: 'true task completion flag', pattern: /task[1-5]_complete["']?\s*:\s*true/i },
  { name: 'positive manual input completed claim', pattern: /人工补数.*(已补齐|已完成|已经补齐)/ },
  { name: 'positive degraded eliminated claim', pattern: /(degraded|降级).*(完全消除|已完全消除)/ }
];

function isNegativeBoundaryLine(line) {
  return /(^|[\s"'])(not|no|never|do not|does not|without)\b/i.test(line)
    || /不|未|不能|不得|不要|禁止|没有|尚未|不是/.test(line)
    || (/要求/.test(line) && /(完全消除|已完全消除|已补齐|已经补齐)/.test(line));
}

const scannedFiles = [...new Set(scanRoots.flatMap(listFiles))];
for (const file of scannedFiles) {
  const text = readText(file);
  assert(!secretPattern.test(text), `possible plain secret in ${file}`);
  for (const line of text.split(/\r?\n/)) {
    if (isNegativeBoundaryLine(line)) continue;
    for (const { name, pattern } of forbiddenClaims) {
      assert(!pattern.test(line), `forbidden positive claim in ${file}: ${name}`);
    }
  }
}

if (failures.length) {
  console.error(JSON.stringify({ status: 'FAIL', failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  status: 'PASS',
  required_files_checked: requiredFiles.length,
  final_message_count: finalMessages.length,
  scanned_files: scannedFiles.length,
  feedback_triage_dry_run_status: evidence.feedback_triage_dry_run_status,
  manual_intake_dry_run_status: evidence.manual_intake_dry_run_status,
  distribution_readiness_status: evidence.distribution_readiness_status,
  actual_messages_sent: evidence.actual_messages_sent
}, null, 2));
