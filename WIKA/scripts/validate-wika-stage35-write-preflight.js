import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildStage34WriteBoundaryMatrix,
  buildStage35WriteBoundaryPreflight
} from "../projects/wika/data/write-boundary/write-boundary-candidates.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..", "..");
const EVIDENCE_DIR = path.join(ROOT_DIR, "WIKA", "docs", "framework", "evidence");
const STAGE34_PATH = path.join(EVIDENCE_DIR, "wika-stage34-write-boundary-matrix.json");
const STAGE35_PATH = path.join(EVIDENCE_DIR, "wika-stage35-write-boundary-preflight.json");

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  if (!fs.existsSync(STAGE34_PATH)) {
    writeJson(STAGE34_PATH, buildStage34WriteBoundaryMatrix());
  }

  const stage34 = readJson(STAGE34_PATH);
  const stage35 = buildStage35WriteBoundaryPreflight();

  assert(stage35.stage === "stage35_write_boundary_preflight", "stage mismatch");
  assert(
    stage35.matrix_reference.direct_candidate_count ===
      stage34.summary.direct_candidate_count,
    "stage34 reference mismatch"
  );
  assert(
    stage35.summary.runtime_ready_candidate_count === 0,
    "stage35 should stay blocked before runtime"
  );
  assert(
    stage35.task_results.task4.primary_status === "DOC_INSUFFICIENT",
    "task4 should remain doc-insufficient"
  );
  assert(
    stage35.direct_candidate_results.every((item) => item.runtime_test_ready === false),
    "no direct candidate should become runtime-ready"
  );
  assert(
    stage35.direct_candidate_results.some(
      (item) =>
        item.method_name === "alibaba.icbu.photobank.upload" &&
        item.preflight_primary_status === "NO_ROLLBACK_PATH"
    ),
    "photobank upload classification mismatch"
  );
  assert(
    stage35.direct_candidate_results.some(
      (item) =>
        item.method_name === "alibaba.trade.order.create" &&
        item.preflight_primary_status === "NO_ROLLBACK_PATH"
    ),
    "order create classification mismatch"
  );

  writeJson(STAGE35_PATH, stage35);

  console.log(
    JSON.stringify(
      {
        ok: true,
        stage: stage35.stage,
        output_path: STAGE35_PATH,
        runtime_ready_candidate_count: stage35.summary.runtime_ready_candidate_count,
        task_statuses: {
          task3: stage35.task_results.task3.primary_status,
          task4: stage35.task_results.task4.primary_status,
          task5: stage35.task_results.task5.primary_status
        }
      },
      null,
      2
    )
  );
}

main();
