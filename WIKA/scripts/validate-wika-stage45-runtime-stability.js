import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..", "..");
const BASE_URL = "https://api.wikapacking.com";
const OUTPUT_PATH = path.join(
  ROOT_DIR,
  "WIKA",
  "docs",
  "framework",
  "evidence",
  "wika-stage45-runtime-stability-summary.json"
);

const ROUTES = [
  { key: "health", method: "GET", path: "/health", jsonRequired: false },
  {
    key: "auth_debug",
    method: "GET",
    path: "/integrations/alibaba/auth/debug",
    jsonRequired: true
  },
  {
    key: "action_center",
    method: "GET",
    path: "/integrations/alibaba/wika/reports/action-center",
    jsonRequired: true
  },
  {
    key: "operator_console",
    method: "GET",
    path: "/integrations/alibaba/wika/reports/operator-console",
    jsonRequired: true
  },
  {
    key: "task_workbench",
    method: "GET",
    path: "/integrations/alibaba/wika/workbench/task-workbench",
    jsonRequired: true
  },
  {
    key: "preview_center",
    method: "GET",
    path: "/integrations/alibaba/wika/workbench/preview-center",
    jsonRequired: true
  },
  {
    key: "business_cockpit",
    method: "GET",
    path: "/integrations/alibaba/wika/reports/business-cockpit",
    jsonRequired: true
  },
  {
    key: "operations_management_summary",
    method: "GET",
    path: "/integrations/alibaba/wika/reports/operations/management-summary",
    jsonRequired: true
  },
  {
    key: "products_management_summary",
    method: "GET",
    path: "/integrations/alibaba/wika/reports/products/management-summary",
    jsonRequired: true
  },
  {
    key: "orders_management_summary",
    method: "GET",
    path: "/integrations/alibaba/wika/reports/orders/management-summary",
    jsonRequired: true
  }
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function sanitize(node) {
  if (Array.isArray(node)) {
    return node.slice(0, 20).map((item) => sanitize(item));
  }

  if (!node || typeof node !== "object") {
    return node;
  }

  const output = {};
  for (const [key, value] of Object.entries(node)) {
    if (/(token|secret|sign|authorization|cookie|app_key|client_id|client_secret)/i.test(key)) {
      output[key] = "***";
      continue;
    }

    if (/(trade_id|e_trade_id|email|phone|address|member|buyer|account)/i.test(key)) {
      output[key] = "***";
      continue;
    }

    output[key] = sanitize(value);
  }

  return output;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stripEnvelope(body = {}) {
  if (!body || typeof body !== "object") {
    return body;
  }

  const cloned = { ...body };
  delete cloned.ok;
  delete cloned.account;
  delete cloned.module;
  delete cloned.read_only;
  return cloned;
}

async function fetchRoute(route) {
  const startedAt = Date.now();
  const response = await fetch(`${BASE_URL}${route.path}`, {
    method: route.method,
    headers: {
      accept: "application/json"
    },
    signal: AbortSignal.timeout(45000)
  });
  const text = await response.text();
  let body = null;

  try {
    body = JSON.parse(text);
  } catch {
    body = null;
  }

  const normalizedBody = sanitize(stripEnvelope(body));
  const degradedSections = Array.isArray(normalizedBody?.degraded_sections)
    ? normalizedBody.degraded_sections
    : [];
  const partialStatus = normalizedBody?.partial_status ?? null;

  return {
    method: route.method,
    path: route.path,
    status: response.status,
    elapsed_ms: Date.now() - startedAt,
    is_json: body !== null,
    top_level_keys:
      normalizedBody && typeof normalizedBody === "object"
        ? Object.keys(normalizedBody).slice(0, 30)
        : [],
    response_mode:
      partialStatus?.mode ??
      (degradedSections.length > 0 ? "degraded" : "full_success"),
    degraded_sections: degradedSections,
    boundary_statement_present: Boolean(normalizedBody?.boundary_statement),
    body: normalizedBody,
    text_preview: text.slice(0, 300)
  };
}

function isApiCallLimitResult(result = {}) {
  const topErrorCode =
    result.body?.top_error?.code ??
    result.body?.error_response?.code ??
    null;

  return topErrorCode === "ApiCallLimit" || /ApiCallLimit/i.test(result.text_preview ?? "");
}

async function fetchRouteWithPacedRetry(route) {
  const waitPlan = [0, 1800, 3200];
  let lastResult = null;

  for (const waitMs of waitPlan) {
    if (waitMs > 0) {
      await sleep(waitMs);
    }

    lastResult = await fetchRoute(route);
    if (
      lastResult.status === 200 ||
      !isApiCallLimitResult(lastResult)
    ) {
      return lastResult;
    }
  }

  return lastResult;
}

function assertRouteShape(result, route) {
  assert(result.status === 200, `${route.key} status != 200`);

  if (!route.jsonRequired) {
    return;
  }

  assert(result.is_json === true, `${route.key} did not return JSON`);
  if (route.key !== "auth_debug") {
    assert(result.boundary_statement_present === true, `${route.key} missing boundary_statement`);
  }

  const keys = result.top_level_keys;
  switch (route.key) {
    case "action_center":
      assert(keys.includes("business_cockpit_summary"), "action_center missing business_cockpit_summary");
      assert(keys.includes("prioritized_actions"), "action_center missing prioritized_actions");
      break;
    case "operator_console":
      assert(keys.includes("action_center_summary"), "operator_console missing action_center_summary");
      assert(keys.includes("next_best_actions"), "operator_console missing next_best_actions");
      break;
    case "task_workbench":
      assert(keys.includes("task3_summary"), "task_workbench missing task3_summary");
      assert(keys.includes("shared_handoff_rules"), "task_workbench missing shared_handoff_rules");
      break;
    case "preview_center":
      assert(keys.includes("task3_preview_summary"), "preview_center missing task3_preview_summary");
      assert(keys.includes("task4_preview_summary"), "preview_center missing task4_preview_summary");
      assert(keys.includes("task5_preview_summary"), "preview_center missing task5_preview_summary");
      assert(keys.includes("shared_readiness"), "preview_center missing shared_readiness");
      assert(keys.includes("shared_handoff_rules"), "preview_center missing shared_handoff_rules");
      break;
    case "business_cockpit":
      assert(keys.includes("task_coverage_summary"), "business_cockpit missing task_coverage_summary");
      break;
    case "operations_management_summary":
      assert(keys.includes("official_metrics"), "operations_management_summary missing official_metrics");
      break;
    case "products_management_summary":
      assert(keys.includes("aggregate_official_metrics"), "products_management_summary missing aggregate_official_metrics");
      break;
    case "orders_management_summary":
      assert(keys.includes("formal_summary"), "orders_management_summary missing formal_summary");
      break;
    default:
      break;
  }
}

const results = {};
for (const route of ROUTES) {
  results[route.key] = await fetchRouteWithPacedRetry(route);
  assertRouteShape(results[route.key], route);
}

const summary = {
  generated_at: new Date().toISOString(),
  stage: "stage45_runtime_stability",
  base_url: BASE_URL,
  routes: results,
  route_health_summary: Object.fromEntries(
    Object.entries(results).map(([key, value]) => [
      key,
      {
        path: value.path,
        status: value.status,
        elapsed_ms: value.elapsed_ms,
        response_mode: value.response_mode,
        degraded_sections: value.degraded_sections,
        boundary_statement_present: value.boundary_statement_present
      }
    ])
  )
};

writeJson(OUTPUT_PATH, summary);

console.log(
  JSON.stringify(
    {
      ok: true,
      evidence_path: OUTPUT_PATH,
      route_count: Object.keys(results).length
    },
    null,
    2
  )
);
