#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');

const requiredFiles = [
  'WIKA/docs/reports/deliverables/distribution/stage52_reception/WIKA_分发接收状态审计_STAGE52.md',
  'WIKA/docs/reports/deliverables/distribution/stage52_reception/WIKA_角色发送状态_STAGE52.csv',
  'WIKA/docs/reports/deliverables/feedback/stage52_feedback_triage_result.json',
  'WIKA/docs/reports/deliverables/feedback/WIKA_反馈triage摘要_STAGE52.md',
  'WIKA/docs/reports/deliverables/handoff/stage52_manual_intake_validation_result.json',
  'WIKA/docs/reports/deliverables/handoff/WIKA_人工补数验收摘要_STAGE52.md',
  'WIKA/docs/reports/deliverables/distribution/stage52_followup/WIKA_联系人补齐催收话术_STAGE52.md',
  'WIKA/docs/reports/deliverables/distribution/stage52_followup/WIKA_反馈催收话术_STAGE52.md',
  'WIKA/docs/reports/deliverables/distribution/stage52_followup/WIKA_人工补数催收话术_STAGE52.md',
  'WIKA/docs/reports/deliverables/distribution/stage52_followup/WIKA_下一步人工动作清单_STAGE52.md',
  'WIKA/docs/reports/deliverables/feedback/WIKA_报告改版条件判断_STAGE52.md',
  'WIKA/docs/reports/deliverables/feedback/WIKA_下一版改版Backlog_STAGE52.csv',
  'WIKA/docs/reports/deliverables/evidence/WIKA_stage52_untracked_inventory.json',
  'WIKA/docs/reports/deliverables/evidence/WIKA_正式运营报告包_STAGE52证据.json'
];

const scanRoots = [
  'WIKA/docs/reports/deliverables/distribution/stage52_reception',
  'WIKA/docs/reports/deliverables/distribution/stage52_followup',
  'WIKA/docs/reports/deliverables/feedback/WIKA_反馈triage摘要_STAGE52.md',
  'WIKA/docs/reports/deliverables/feedback/WIKA_报告改版条件判断_STAGE52.md',
  'WIKA/docs/reports/deliverables/feedback/WIKA_下一版改版Backlog_STAGE52.csv',
  'WIKA/docs/reports/deliverables/handoff/WIKA_人工补数验收摘要_STAGE52.md',
  'WIKA/docs/reports/deliverables/evidence/WIKA_stage52_untracked_inventory.json',
  'WIKA/docs/reports/deliverables/evidence/WIKA_正式运营报告包_STAGE52证据.json'
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
  if (fs.statSync(absolute).isFile()) return [relativePath];
  return fs.readdirSync(absolute).flatMap((name) => {
    const child = path.join(relativePath, name).replace(/\\/g, '/');
    return fs.statSync(fullPath(child)).isDirectory() ? listFiles(child) : [child];
  });
}

for (const file of requiredFiles) {
  assert(fs.existsSync(fullPath(file)), `missing required file: ${file}`);
}

const feedback = readJson('WIKA/docs/reports/deliverables/feedback/stage52_feedback_triage_result.json');
const intake = readJson('WIKA/docs/reports/deliverables/handoff/stage52_manual_intake_validation_result.json');
const evidence = readJson('WIKA/docs/reports/deliverables/evidence/WIKA_正式运营报告包_STAGE52证据.json');
const inventory = readJson('WIKA/docs/reports/deliverables/evidence/WIKA_stage52_untracked_inventory.json');
const roleStatus = readText('WIKA/docs/reports/deliverables/distribution/stage52_reception/WIKA_角色发送状态_STAGE52.csv');
const backlog = readText('WIKA/docs/reports/deliverables/feedback/WIKA_下一版改版Backlog_STAGE52.csv');

assert(feedback.feedback_count === 0, 'stage52 should not claim real feedback');
assert(feedback.example_row_count === 1, 'stage52 should preserve one example feedback row');
assert(intake.received_count === 0, 'stage52 should not claim received manual input');
assert(intake.waiting_owner_count === 5, 'stage52 should keep five waiting manual input areas');
assert(evidence.real_feedback_count === 0, 'evidence must show zero real feedback');
assert(evidence.real_manual_input_count === 0, 'evidence must show zero real manual input');
assert(evidence.revision_readiness === 'NOT_READY', 'revision readiness must be NOT_READY');
assert(evidence.should_modify_reports_now === false, 'reports must not be modified now');
assert(evidence.actual_messages_sent === false, 'stage52 must not send real messages');
assert(evidence.business_write_actions_attempted === false, 'stage52 must not attempt write actions');
assert(Array.isArray(inventory.non_stage52_untracked_paths), 'inventory must record non-stage52 untracked paths');

for (const role of ['boss_management', 'ops_lead', 'store_operator', 'product_operator', 'sales_followup', 'human_handoff']) {
  assert(roleStatus.includes(role), `role status missing ${role}`);
}

assert(backlog.includes('NOT_READY') || backlog.includes('waiting_item'), 'backlog must contain waiting/preparation items only when not ready');

const secretPattern = /(refresh[_-]?token|access[_-]?token|secret|cookie)\s*[:=]\s*["']?[A-Za-z0-9_\-./+=]{12,}/i;
const forbiddenClaims = [
  { name: 'positive task complete claim', pattern: /task\s*[1-5]\s*(?:is\s*)?complete/i },
  { name: 'true task completion flag', pattern: /task[1-5]_complete["']?\s*:\s*true/i },
  { name: 'positive feedback received claim', pattern: /(真实反馈|反馈).*(已收到|已回收|received)/i },
  { name: 'positive manual input completed claim', pattern: /(人工补数|补数).*(已补齐|已完成|已经补齐|已收到|received)/i },
  { name: 'positive degraded eliminated claim', pattern: /(degraded|降级).*(完全消除|已完全消除)/i }
];

function isNegativeBoundaryLine(line) {
  return /(^|[\s"'])(not|no|never|do not|does not|without|zero)\b/i.test(line)
    || /不|未|不能|不得|不要|禁止|没有|尚未|不是|缺|等待|催收|0/.test(line)
    || (/要求/.test(line) && /(完全消除|已完全消除|已补齐|已经补齐|已收到)/.test(line));
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
  scanned_files: scannedFiles.length,
  real_feedback_count: evidence.real_feedback_count,
  real_manual_input_count: evidence.real_manual_input_count,
  revision_readiness: evidence.revision_readiness,
  should_modify_reports_now: evidence.should_modify_reports_now
}, null, 2));
