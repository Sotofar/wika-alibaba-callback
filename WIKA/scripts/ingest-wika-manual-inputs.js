#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const inboxRoot = path.join(repoRoot, "WIKA", "docs", "tasks", "input-inbox");
const receivedRoot = path.join(inboxRoot, "received");
const processedRoot = path.join(inboxRoot, "processed");
const rejectedRoot = path.join(inboxRoot, "rejected");
const resultPath = path.join(inboxRoot, "WIKA_人工输入验收结果.json");
const normalizedPath = path.join(inboxRoot, "WIKA_人工输入标准化结果.json");
const summaryPath = path.join(inboxRoot, "WIKA_人工输入验收摘要.md");

const SUPPORTED_EXTENSIONS = new Set([".json", ".csv", ".md", ".txt"]);

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeText(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, value, "utf8");
}

function listInputFiles() {
  ensureDir(receivedRoot);
  return fs.readdirSync(receivedRoot)
    .filter((name) => !name.startsWith("."))
    .map((name) => path.join(receivedRoot, name))
    .filter((filePath) => fs.statSync(filePath).isFile());
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return { valid: false, reason: "CSV 缺少表头或数据行" };
  const headers = lines[0].split(",").map((item) => item.trim()).filter(Boolean);
  if (!headers.length) return { valid: false, reason: "CSV 表头为空" };
  return { valid: true, headers, row_count: lines.length - 1 };
}

function inferInputArea(fileName, text) {
  const lower = `${fileName}\n${text.slice(0, 2000)}`.toLowerCase();
  if (/ad|ads|campaign|keyword|spend|广告|直通车|花费/.test(lower)) return "ads";
  if (/page|banner|module|页面|首页|盘点/.test(lower)) return "page_audit";
  if (/product|material|keyword|image|video|产品|素材|关键词|图片|视频/.test(lower)) return "product_material";
  if (/reply|sales|quote|lead_time|销售|跟单|报价|交期/.test(lower)) return "sales_followup";
  if (/order|payment|shipment|buyer|订单|付款|物流|买家/.test(lower)) return "order_fields";
  return "general_manual_input";
}

function validateInputFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const fileName = path.basename(filePath);
  if (!SUPPORTED_EXTENSIONS.has(ext)) {
    return { accepted: false, reason: `不支持的文件类型：${ext || "无扩展名"}` };
  }

  const text = fs.readFileSync(filePath, "utf8");
  if (!text.trim()) return { accepted: false, reason: "文件为空" };

  if (ext === ".json") {
    try {
      JSON.parse(text);
    } catch (error) {
      return { accepted: false, reason: `JSON 解析失败：${error.message}` };
    }
  }

  if (ext === ".csv") {
    const csv = parseCsv(text);
    if (!csv.valid) return { accepted: false, reason: csv.reason };
  }

  return {
    accepted: true,
    reason: "基础格式验收通过",
    input_area: inferInputArea(fileName, text),
    size_bytes: Buffer.byteLength(text, "utf8")
  };
}

function moveInput(filePath, targetRoot, generatedAt) {
  const safeStamp = generatedAt.replace(/[:.]/g, "-");
  const targetPath = path.join(targetRoot, `${safeStamp}__${path.basename(filePath)}`);
  fs.renameSync(filePath, targetPath);
  return path.relative(repoRoot, targetPath).replace(/\\/g, "/");
}

function renderSummary(result) {
  const accepted = result.files.filter((item) => item.accepted);
  const rejected = result.files.filter((item) => !item.accepted);
  return `# WIKA 人工输入验收摘要

- 本轮输入状态：\`${result.input_status}\`
- 待验收文件数：${result.received_count}
- 通过文件数：${result.accepted_count}
- 拒绝文件数：${result.rejected_count}
- 是否调用外部 API：否
- 是否触发平台写侧：否

## 通过文件
${accepted.length ? accepted.map((item) => `- ${item.original_file} -> ${item.stored_as}（${item.input_area}）`).join("\n") : "- 无"}

## 拒绝文件
${rejected.length ? rejected.map((item) => `- ${item.original_file}：${item.reason}`).join("\n") : "- 无"}

## 边界声明
- not task 1 complete
- not task 2 complete
- not task 3 complete
- not task 4 complete
- not task 5 complete
- task 6 excluded
- no write action attempted
- WIKA-only thread for business work
- XD untouched in business execution
- not full business cockpit
`;
}

function main() {
  ensureDir(receivedRoot);
  ensureDir(processedRoot);
  ensureDir(rejectedRoot);

  const generatedAt = new Date().toISOString();
  const files = listInputFiles();
  const entries = files.map((filePath) => {
    const validation = validateInputFile(filePath);
    const storedAs = validation.accepted
      ? moveInput(filePath, processedRoot, generatedAt)
      : moveInput(filePath, rejectedRoot, generatedAt);
    return {
      original_file: path.relative(repoRoot, filePath).replace(/\\/g, "/"),
      stored_as: storedAs,
      accepted: validation.accepted,
      reason: validation.reason,
      input_area: validation.input_area ?? "unknown",
      size_bytes: validation.size_bytes ?? fs.statSync(path.join(repoRoot, storedAs)).size
    };
  });

  const result = {
    generated_at: generatedAt,
    input_status: entries.length ? "INPUT_RECEIVED" : "NO_INPUT_RECEIVED",
    received_count: entries.length,
    accepted_count: entries.filter((item) => item.accepted).length,
    rejected_count: entries.filter((item) => !item.accepted).length,
    files: entries,
    no_external_api_called: true,
    no_business_write_action: true,
    no_fake_data_generated: true
  };

  const normalized = {
    generated_at: generatedAt,
    input_status: result.input_status,
    accepted_inputs: entries.filter((item) => item.accepted),
    rejected_inputs: entries.filter((item) => !item.accepted),
    standardization_note: result.input_status === "NO_INPUT_RECEIVED"
      ? "本轮没有人工输入，后续刷新只能保持既有任务状态。"
      : "通过验收的文件已进入 processed，可供任务状态刷新和下一轮报告输入包使用。"
  };

  writeJson(resultPath, result);
  writeJson(normalizedPath, normalized);
  writeText(summaryPath, renderSummary(result));

  console.log(JSON.stringify({
    status: "PASS",
    input_status: result.input_status,
    received_count: result.received_count,
    accepted_count: result.accepted_count,
    rejected_count: result.rejected_count,
    result_path: path.relative(repoRoot, resultPath).replace(/\\/g, "/"),
    normalized_path: path.relative(repoRoot, normalizedPath).replace(/\\/g, "/")
  }, null, 2));
}

main();
