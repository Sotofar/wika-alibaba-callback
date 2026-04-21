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
    else if (item.startsWith('--input=')) args.input = item.slice('--input='.length);
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
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
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
  if (!lines.length) return [];
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
}

function countBy(rows, field) {
  return rows.reduce((acc, row) => {
    const key = row[field] || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

const args = parseArgs(process.argv.slice(2));
const inputPath = resolveRepoPath(args.input);
const outputPath = resolveRepoPath(args.output);

let rows = [];
let inputStatus = 'INPUT_NOT_FOUND_EMPTY_SUMMARY';
if (inputPath && fs.existsSync(inputPath)) {
  rows = parseCsv(fs.readFileSync(inputPath, 'utf8'));
  inputStatus = 'INPUT_PARSED';
}

const realRows = rows.filter((row) => !/^EXAMPLE/i.test(row.feedback_id || '') && row.status !== 'EXAMPLE');
const exampleRows = rows.filter((row) => /^EXAMPLE/i.test(row.feedback_id || '') || row.status === 'EXAMPLE');

const summary = {
  stage: 'stage51-wika-distribution-dispatch-and-feedback-intake-automation',
  dry_run: args.dryRun,
  input_status: inputStatus,
  feedback_count: realRows.length,
  example_row_count: exampleRows.length,
  by_role: countBy(realRows, 'role'),
  by_type: countBy(realRows, 'feedback_type'),
  actionable_count: realRows.filter((row) => row.feedback_type === 'business_action' || row.requires_report_change === 'true').length,
  requires_manual_input_count: realRows.filter((row) => row.requires_manual_input === 'true').length,
  requires_new_data_source_count: realRows.filter((row) => row.requires_new_data_source === 'true').length,
  unsafe_or_out_of_scope_count: realRows.filter((row) => row.feedback_type === 'unsafe_or_out_of_scope' || row.unsafe_or_out_of_scope === 'true').length,
  example_classification_supported: exampleRows.length > 0,
  recommended_next_stage: realRows.length > 0 ? 'stage52_feedback_triage_and_report_revision' : 'WAIT_FOR_REAL_FEEDBACK',
  no_external_api_called: true,
  no_message_sent: true,
  no_business_write_action: true
};

if (outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
}

console.log(JSON.stringify(summary, null, 2));
