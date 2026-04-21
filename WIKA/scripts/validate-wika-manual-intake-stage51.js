#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');

function parseArgs(argv) {
  const args = { dryRun: false };
  for (const item of argv) {
    if (item === '--dry-run') args.dryRun = true;
    else if (item.startsWith('--registry=')) args.registry = item.slice('--registry='.length);
    else if (item.startsWith('--output=')) args.output = item.slice('--output='.length);
  }
  return args;
}

function resolveRepoPath(filePath) {
  if (!filePath) return null;
  return path.isAbsolute(filePath) ? filePath : path.join(repoRoot, filePath);
}

function splitCsvLine(line) {
  const cells = [];
  let current = '';
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells;
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
  if (!lines.length) return { headers: [], rows: [] };
  const headers = splitCsvLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
  return { headers, rows };
}

function countBy(rows, field) {
  return rows.reduce((acc, row) => {
    const key = row[field] || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

const args = parseArgs(process.argv.slice(2));
const registryPath = resolveRepoPath(args.registry);
const outputPath = resolveRepoPath(args.output);

let headers = [];
let rows = [];
let registryStatus = 'REGISTRY_NOT_FOUND_EMPTY_SUMMARY';

if (registryPath && fs.existsSync(registryPath)) {
  const parsed = parseCsv(fs.readFileSync(registryPath, 'utf8'));
  headers = parsed.headers;
  rows = parsed.rows;
  registryStatus = 'REGISTRY_PARSED';
}

const requiredColumns = [
  'intake_id',
  'input_area',
  'source_owner',
  'expected_template',
  'received_file_or_link',
  'received_status',
  'quality_status',
  'codex_next_action',
  'target_report',
  'target_stage'
];

const missingColumns = requiredColumns.filter((column) => !headers.includes(column));
const receivedRows = rows.filter((row) => row.received_status === 'RECEIVED' || row.received_status === 'ACCEPTED');

const summary = {
  stage: 'stage51-wika-distribution-dispatch-and-feedback-intake-automation',
  dry_run: args.dryRun,
  registry_status: registryStatus,
  missing_required_columns: missingColumns,
  intake_count: rows.length,
  received_count: receivedRows.length,
  waiting_owner_count: rows.filter((row) => row.received_status === 'WAITING_OWNER').length,
  accepted_count: rows.filter((row) => row.received_status === 'ACCEPTED').length,
  needs_revision_count: rows.filter((row) => row.received_status === 'NEEDS_REVISION').length,
  by_input_area: countBy(rows, 'input_area'),
  next_action: receivedRows.length > 0 ? 'validate_received_files_before_stage52' : 'WAIT_FOR_MANUAL_INPUT_FILES',
  no_external_api_called: true,
  no_message_sent: true,
  no_business_write_action: true
};

if (outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
}

if (missingColumns.length) {
  console.error(JSON.stringify(summary, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(summary, null, 2));
