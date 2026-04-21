#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');

const requiredFiles = [
  'WIKA/docs/reports/deliverables/distribution/stage50_execution/WIKA_正式分发执行台账_STAGE50.csv',
  'WIKA/docs/reports/deliverables/distribution/stage50_execution/WIKA_正式分发执行说明_STAGE50.md',
  'WIKA/docs/reports/deliverables/feedback/stage50_tracking/WIKA_反馈回收台账_STAGE50.csv',
  'WIKA/docs/reports/deliverables/feedback/stage50_tracking/WIKA_反馈处理说明_STAGE50.md',
  'WIKA/docs/reports/deliverables/handoff/stage50_intake_tracking/WIKA_人工补数接收台账_STAGE50.csv',
  'WIKA/docs/reports/deliverables/handoff/stage50_intake_tracking/WIKA_人工补数验收规则_STAGE50.md',
  'WIKA/docs/reports/deliverables/evidence/WIKA_stage50_pre_distribution_check.json',
  'WIKA/docs/reports/deliverables/evidence/WIKA_stage50_untracked_inventory.json',
  'WIKA/docs/reports/deliverables/evidence/WIKA_正式运营报告包_STAGE50证据.json',
  'WIKA/docs/reports/deliverables/runtime/WIKA_stage50_untracked_worktree_note.md'
];

const messageFiles = [
  'WIKA/docs/reports/deliverables/distribution/stage50_messages/WIKA_老板管理层待发送消息_STAGE50.md',
  'WIKA/docs/reports/deliverables/distribution/stage50_messages/WIKA_运营负责人待发送消息_STAGE50.md',
  'WIKA/docs/reports/deliverables/distribution/stage50_messages/WIKA_店铺运营待发送消息_STAGE50.md',
  'WIKA/docs/reports/deliverables/distribution/stage50_messages/WIKA_产品运营待发送消息_STAGE50.md',
  'WIKA/docs/reports/deliverables/distribution/stage50_messages/WIKA_销售跟单待发送消息_STAGE50.md',
  'WIKA/docs/reports/deliverables/distribution/stage50_messages/WIKA_人工接手待发送消息_STAGE50.md'
];

const scanRoots = [
  'WIKA/docs/reports/deliverables/distribution/stage50_execution',
  'WIKA/docs/reports/deliverables/distribution/stage50_messages',
  'WIKA/docs/reports/deliverables/feedback/stage50_tracking',
  'WIKA/docs/reports/deliverables/handoff/stage50_intake_tracking',
  'WIKA/docs/reports/deliverables/evidence/WIKA_stage50_pre_distribution_check.json',
  'WIKA/docs/reports/deliverables/evidence/WIKA_stage50_untracked_inventory.json',
  'WIKA/docs/reports/deliverables/evidence/WIKA_正式运营报告包_STAGE50证据.json',
  'WIKA/docs/reports/deliverables/runtime/WIKA_stage50_untracked_worktree_note.md'
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
  const entries = [];
  for (const name of fs.readdirSync(absolute)) {
    const child = path.join(relativePath, name).replace(/\\/g, '/');
    const childStat = fs.statSync(fullPath(child));
    if (childStat.isDirectory()) entries.push(...listFiles(child));
    else entries.push(child);
  }
  return entries;
}

for (const file of [...requiredFiles, ...messageFiles]) {
  assert(fs.existsSync(fullPath(file)), `missing required file: ${file}`);
}

const executionLedger = readText('WIKA/docs/reports/deliverables/distribution/stage50_execution/WIKA_正式分发执行台账_STAGE50.csv');
const executionInstruction = readText('WIKA/docs/reports/deliverables/distribution/stage50_execution/WIKA_正式分发执行说明_STAGE50.md');
const feedbackLedger = readText('WIKA/docs/reports/deliverables/feedback/stage50_tracking/WIKA_反馈回收台账_STAGE50.csv');
const intakeLedger = readText('WIKA/docs/reports/deliverables/handoff/stage50_intake_tracking/WIKA_人工补数接收台账_STAGE50.csv');
const preCheck = readJson('WIKA/docs/reports/deliverables/evidence/WIKA_stage50_pre_distribution_check.json');
const inventory = readJson('WIKA/docs/reports/deliverables/evidence/WIKA_stage50_untracked_inventory.json');
const evidence = readJson('WIKA/docs/reports/deliverables/evidence/WIKA_正式运营报告包_STAGE50证据.json');

const roles = ['boss_management', 'ops_lead', 'store_operator', 'product_operator', 'sales_followup', 'human_handoff'];
for (const role of roles) {
  assert(executionLedger.includes(role), `execution ledger missing role: ${role}`);
}

const executionStatusText = `${executionLedger}\n${executionInstruction}`;
for (const status of ['WAITING_FOR_RECIPIENT', 'SENT_BY_HUMAN', 'FEEDBACK_PENDING', 'FEEDBACK_RECEIVED', 'BLOCKED_BY_MISSING_OWNER']) {
  assert(executionStatusText.includes(status), `execution instruction/ledger missing status vocabulary: ${status}`);
}

for (const feedbackType of ['content_clarity', 'business_action', 'manual_input_needed', 'new_data_source_needed', 'format_request', 'not_actionable', 'unsafe_or_out_of_scope']) {
  assert(feedbackLedger.includes(feedbackType), `feedback ledger missing feedback_type: ${feedbackType}`);
}

for (const status of ['WAITING_OWNER', 'NOT_CHECKED']) {
  assert(intakeLedger.includes(status), `manual intake ledger missing status: ${status}`);
}

assert(preCheck.overall_status === 'DEGRADED', 'pre-distribution raw check should preserve DEGRADED raw status');
assert(Array.isArray(preCheck.degraded_reasons), 'pre-distribution check missing degraded_reasons');
assert(evidence.pre_distribution_check_status === 'DEGRADED_ACCEPTED', 'stage50 evidence must classify pre-distribution check as DEGRADED_ACCEPTED');
assert(evidence.actual_messages_sent === false, 'stage50 must not send real messages');
assert(evidence.actual_emails_sent === false, 'stage50 must not send real emails');
assert(evidence.business_write_actions_attempted === false, 'stage50 must not attempt business write actions');
assert(evidence.pdf_regenerated === false, 'stage50 must not regenerate PDFs');
assert(evidence.xd_touched === false, 'stage50 must not touch XD');
assert(Array.isArray(evidence.roles_waiting_for_recipient) && evidence.roles_waiting_for_recipient.length === 6, 'all six roles should wait for real recipients');
assert(Array.isArray(inventory.non_stage50_untracked_paths), 'untracked inventory missing non_stage50_untracked_paths');

const secretPattern = /(refresh[_-]?token|access[_-]?token|secret|cookie)\s*[:=]\s*["']?[A-Za-z0-9_\-./+=]{12,}/i;
const forbiddenClaims = [
  { name: 'positive task complete claim', pattern: /task\s*[1-5]\s*(?:is\s*)?complete/i },
  { name: 'true task completion flag', pattern: /task[1-5]_complete["']?\s*:\s*true/i },
  { name: 'positive manual input completed claim', pattern: /人工补数.*(已补齐|已完成|已经补齐)/ },
  { name: 'positive degraded eliminated claim', pattern: /(degraded|降级).*(完全消除|已完全消除)/ }
];

function isNegativeBoundaryLine(line) {
  return /(^|[\s"'])(not|no|never|do not|does not|without)\b/i.test(line)
    || /不|未|不能|不得|不要|禁止|没有|不应|不应该/.test(line)
    || (/要求/.test(line) && /(完全消除|已完全消除|已补齐|已经补齐)/.test(line));
}

const scannedFiles = [...new Set(scanRoots.flatMap(listFiles))];
for (const file of scannedFiles) {
  const text = readText(file);
  assert(!secretPattern.test(text), `possible plain secret in ${file}`);
  for (const line of text.split(/\r?\n/)) {
    if (isNegativeBoundaryLine(line)) continue;
    for (const { name, pattern } of forbiddenClaims) {
      assert(!pattern.test(line), `forbidden positive claim found in ${file}: ${name}`);
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
  message_files_checked: messageFiles.length,
  scanned_files: scannedFiles.length,
  pre_distribution_check_status: evidence.pre_distribution_check_status,
  actual_messages_sent: evidence.actual_messages_sent,
  non_stage50_untracked_paths: inventory.non_stage50_untracked_paths.length
}, null, 2));
