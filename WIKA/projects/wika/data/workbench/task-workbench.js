import { buildProductDraftWorkbench } from "./product-draft-workbench.js";
import { buildReplyWorkbench } from "./reply-workbench.js";
import { buildOrderWorkbench } from "./order-workbench.js";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function unique(values = []) {
  return [...new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))];
}

export async function buildTaskWorkbench(clientConfig, query = {}, preloaded = {}) {
  // Pace heavyweight read-side builders to avoid transient upstream ApiCallLimit bursts.
  const task3Summary =
    preloaded.task3Summary ?? (await buildProductDraftWorkbench(clientConfig, query));
  if (!preloaded.task3Summary && !preloaded.task4Summary) {
    await sleep(1200);
  }

  const task4Summary =
    preloaded.task4Summary ?? (await buildReplyWorkbench(clientConfig, query));
  if (!preloaded.task4Summary && !preloaded.task5Summary) {
    await sleep(1200);
  }

  const task5Summary =
    preloaded.task5Summary ?? (await buildOrderWorkbench(clientConfig, query));

  return {
    report_name: "task_workbench",
    generated_at: new Date().toISOString(),
    task3_summary: task3Summary,
    task4_summary: task4Summary,
    task5_summary: task5Summary,
    shared_blockers: unique([
      ...(task3Summary.blocking_risks ?? []),
      ...(task4Summary.blocker_taxonomy_summary?.hard_blocker_codes ?? []),
      ...(task4Summary.blocker_taxonomy_summary?.soft_blocker_codes ?? []),
      ...(task5Summary.blocker_taxonomy_summary?.hard_blocker_codes ?? []),
      ...(task5Summary.blocker_taxonomy_summary?.soft_blocker_codes ?? [])
    ]),
    shared_handoff_rules: [
      "All task3/4/5 workbenches only produce external drafts or safe draft preparation outputs and do not trigger platform write actions.",
      "If a hard blocker exists, key manual fields are missing, or low-risk boundaries are unproven, the workflow must hand off to manual review.",
      "Task 6 notification provider and real delivery capability are out of scope for this round."
    ],
    boundary_statement: {
      task3_safe_draft_only: true,
      task4_external_reply_only: true,
      task5_external_order_only: true,
      task3_task4_task5_workbench_only: true,
      not_platform_internal_execution: true,
      task6_excluded: true,
      no_write_action_attempted: true
    }
  };
}
