import { pathToFileURL } from "node:url";
import { runCriticalRouteChecks } from "./check-xd-critical-routes-stage31.js";
import { scanForSensitiveValues } from "./xd-stage31-common.js";

const ALLOWED = new Set([
  "PASS",
  "PASS_NO_DATA",
  "FAIL_ROUTE",
  "FAIL_AUTH",
  "FAIL_TIMEOUT",
  "FAIL_SHAPE",
  "SKIPPED_BY_SAFETY",
  "UNKNOWN"
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export async function validateCriticalRoutesStage31() {
  const payload = await runCriticalRouteChecks({ dryRun: true });
  assert(payload.dry_run === true, "Dry-run payload must set dry_run=true.");
  assert(Array.isArray(payload.checks) && payload.checks.length >= 10, "Dry-run payload must include planned checks.");
  for (const item of payload.checks) {
    assert(ALLOWED.has(item.classification), `Unexpected classification: ${item.classification}`);
    assert(item.name, "Missing check name.");
    assert(item.route_or_method, "Missing route_or_method.");
    assert(item.expected_status, "Missing expected_status.");
    assert(item.actual_status, "Missing actual_status.");
    assert(item.next_action, "Missing next_action.");
  }
  assert(!scanForSensitiveValues(JSON.stringify(payload)), "Dry-run payload contains sensitive value pattern.");
  return {
    status: "ok",
    overall_status: payload.overall_status,
    planned_checks: payload.checks.length
  };
}

async function main() {
  const result = await validateCriticalRoutesStage31();
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error?.stack || String(error));
    process.exitCode = 1;
  });
}
