import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildStage34WriteBoundaryMatrix
} from "../projects/wika/data/write-boundary/write-boundary-candidates.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..", "..");
const EVIDENCE_PATH = path.join(
  ROOT_DIR,
  "WIKA",
  "docs",
  "framework",
  "evidence",
  "wika-stage34-write-boundary-matrix.json"
);

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function validateCandidate(candidate) {
  const requiredFields = [
    "task_id",
    "method_name",
    "doc_url",
    "intended_write_action",
    "auth_requirement",
    "package_or_scope_requirement",
    "parameter_contract_status",
    "sandbox_or_test_scope_available",
    "draft_mode_available",
    "readback_available",
    "cleanup_or_rollback_available",
    "runtime_test_ready",
    "risk_level",
    "why_directly_relevant",
    "why_not_ready"
  ];

  for (const key of requiredFields) {
    assert(
      Object.prototype.hasOwnProperty.call(candidate, key),
      `candidate missing ${key}: ${candidate.method_name ?? "unknown"}`
    );
  }
}

function main() {
  const matrix = buildStage34WriteBoundaryMatrix();

  assert(matrix.stage === "stage34_write_boundary_candidate_matrix", "stage mismatch");
  assert(matrix.tasks.task3.direct_candidate_count === 3, "task3 candidate count mismatch");
  assert(matrix.tasks.task4.direct_candidate_count === 0, "task4 candidate count mismatch");
  assert(matrix.tasks.task5.direct_candidate_count === 1, "task5 candidate count mismatch");
  assert(matrix.summary.direct_candidate_count === 4, "direct candidate total mismatch");
  assert(
    matrix.summary.runtime_ready_candidate_count === 0,
    "stage34 should not mark any runtime-ready candidate"
  );

  for (const task of Object.values(matrix.tasks)) {
    for (const candidate of task.candidates) {
      validateCandidate(candidate);
    }
  }

  writeJson(EVIDENCE_PATH, matrix);

  console.log(
    JSON.stringify(
      {
        ok: true,
        stage: matrix.stage,
        output_path: EVIDENCE_PATH,
        task_candidate_counts: {
          task3: matrix.tasks.task3.direct_candidate_count,
          task4: matrix.tasks.task4.direct_candidate_count,
          task5: matrix.tasks.task5.direct_candidate_count
        },
        runtime_ready_candidate_count: matrix.summary.runtime_ready_candidate_count
      },
      null,
      2
    )
  );
}

main();
