import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildOperatorConsole } from "../projects/wika/data/cockpit/operator-console.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..", "..");
const WIKA_DIR = path.join(ROOT_DIR, "WIKA");
const DOCS_DIR = path.join(WIKA_DIR, "docs", "framework");
const EVIDENCE_DIR = path.join(DOCS_DIR, "evidence");
const PRODUCTION_BASE_URL = "https://api.wikapacking.com";
const POST_DEPLOY_MODE = process.argv.includes("--post-deploy");

const FILES = POST_DEPLOY_MODE
  ? {
      summary: path.join(EVIDENCE_DIR, "wika-stage31-post-deploy-summary.json"),
      operatorConsole: path.join(
        EVIDENCE_DIR,
        "wika_operator_console_post_deploy.json"
      )
    }
  : {
      summary: path.join(
        EVIDENCE_DIR,
        "wika-stage31-operator-console-summary.json"
      ),
      operatorConsole: path.join(EVIDENCE_DIR, "wika_operator_console.json")
    };

const BASELINE_ROUTES = {
  health: "/health",
  authDebug: "/integrations/alibaba/auth/debug",
  businessCockpit: "/integrations/alibaba/wika/reports/business-cockpit",
  actionCenter: "/integrations/alibaba/wika/reports/action-center",
  taskWorkbench: "/integrations/alibaba/wika/workbench/task-workbench"
};

const STAGE31_ROUTE = "/integrations/alibaba/wika/reports/operator-console";

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

function sanitizeNode(node) {
  if (Array.isArray(node)) {
    return node.slice(0, 20).map((item) => sanitizeNode(item));
  }

  if (!node || typeof node !== "object") {
    return node;
  }

  const output = {};
  for (const [key, value] of Object.entries(node)) {
    if (
      /(token|secret|sign|authorization|cookie|app_key|client_id|client_secret)/i.test(
        key
      )
    ) {
      output[key] = "***";
      continue;
    }

    if (
      /(trade_id|e_trade_id|phone|mobile|email|address|member|account)/i.test(key) &&
      (typeof value === "string" || typeof value === "number")
    ) {
      output[key] = "***";
      continue;
    }

    output[key] = sanitizeNode(value);
  }

  return output;
}

async function fetchJson(pathname, options = {}) {
  const startedAt = Date.now();
  const url = pathname.startsWith("http")
    ? pathname
    : `${PRODUCTION_BASE_URL}${pathname}`;
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      ...(options.headers ?? {})
    },
    ...options
  });
  const text = await response.text();
  let body = null;

  try {
    body = JSON.parse(text);
  } catch {
    body = null;
  }

  return {
    status: response.status,
    elapsed_ms: Date.now() - startedAt,
    is_json: body !== null,
    body,
    text
  };
}

function pickAuthDebugFields(body = {}) {
  const output = {};
  for (const [key, value] of Object.entries(body ?? {})) {
    if (/^(wika_|app_|session_|state_)/.test(key)) {
      output[key] = value;
    }
  }
  return output;
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

async function fetchRequiredRoute(pathname, label) {
  const response = await fetchJson(pathname);
  assert(
    response.status === 200 && response.is_json && response.body?.ok !== false,
    `${label} failed`
  );
  return response;
}

async function runOnlineBaseline() {
  const health = await fetchJson(BASELINE_ROUTES.health);
  assert(health.status === 200, "health failed");

  const authDebug = await fetchJson(BASELINE_ROUTES.authDebug);
  assert(authDebug.status === 200 && authDebug.is_json, "auth debug failed");

  const businessCockpit = await fetchRequiredRoute(
    BASELINE_ROUTES.businessCockpit,
    "business cockpit"
  );
  const actionCenter = await fetchRequiredRoute(
    BASELINE_ROUTES.actionCenter,
    "action center"
  );
  const taskWorkbench = await fetchRequiredRoute(
    BASELINE_ROUTES.taskWorkbench,
    "task workbench"
  );

  return {
    health: {
      status: health.status,
      elapsed_ms: health.elapsed_ms,
      body: health.text
    },
    auth_debug: {
      status: authDebug.status,
      elapsed_ms: authDebug.elapsed_ms,
      body: sanitizeNode(pickAuthDebugFields(authDebug.body))
    },
    stable_route_statuses: {
      businessCockpit: {
        route: BASELINE_ROUTES.businessCockpit,
        status: businessCockpit.status,
        elapsed_ms: businessCockpit.elapsed_ms
      },
      actionCenter: {
        route: BASELINE_ROUTES.actionCenter,
        status: actionCenter.status,
        elapsed_ms: actionCenter.elapsed_ms
      },
      taskWorkbench: {
        route: BASELINE_ROUTES.taskWorkbench,
        status: taskWorkbench.status,
        elapsed_ms: taskWorkbench.elapsed_ms
      }
    },
    preloaded: {
      businessCockpit: stripEnvelope(businessCockpit.body),
      actionCenter: stripEnvelope(actionCenter.body),
      taskWorkbench: stripEnvelope(taskWorkbench.body)
    }
  };
}

function validateOperatorConsoleShape(result) {
  assert(result.report_name === "operator_console", "report_name mismatch");
  assert(result.business_cockpit_summary, "business_cockpit_summary missing");
  assert(result.action_center_summary, "action_center_summary missing");
  assert(result.task3_summary, "task3_summary missing");
  assert(result.task4_summary, "task4_summary missing");
  assert(result.task5_summary, "task5_summary missing");
  assert(result.preview_readiness, "preview_readiness missing");
  assert(Array.isArray(result.shared_blockers), "shared_blockers missing");
  assert(Array.isArray(result.next_best_actions), "next_best_actions missing");
  assert(result.boundary_statement, "boundary_statement missing");
  assert(
    result.boundary_statement.current_official_mainline_plus_derived_layers_only ===
      true,
    "boundary current_official_mainline_plus_derived_layers_only missing"
  );
  assert(
    result.preview_readiness.task3_preview_available === true,
    "task3 preview readiness missing"
  );
  assert(
    result.preview_readiness.task4_preview_available === true,
    "task4 preview readiness missing"
  );
  assert(
    result.preview_readiness.task5_preview_available === true,
    "task5 preview readiness missing"
  );
}

async function runLocalContract() {
  const baseline = await runOnlineBaseline();
  const result = await buildOperatorConsole(
    { accessToken: "local-contract-not-used" },
    {},
    baseline.preloaded
  );
  validateOperatorConsoleShape(result);

  const summary = {
    stage: "stage31_local_contract",
    generated_at: new Date().toISOString(),
    base_url: PRODUCTION_BASE_URL,
    online_baseline: {
      health: baseline.health,
      auth_debug: baseline.auth_debug,
      stable_route_statuses: baseline.stable_route_statuses
    },
    local_contract: {
      next_best_action_count: result.next_best_actions.length,
      shared_blocker_count: result.shared_blockers.length,
      preview_entrypoint_count: Object.keys(result.preview_readiness.entrypoints ?? {})
        .length
    }
  };

  writeJson(FILES.operatorConsole, sanitizeNode(result));
  writeJson(FILES.summary, summary);
  return summary;
}

async function runPostDeploy() {
  const baseline = await runOnlineBaseline();
  const operatorConsole = await fetchRequiredRoute(STAGE31_ROUTE, "operator console");
  const operatorConsoleBody = stripEnvelope(operatorConsole.body);

  validateOperatorConsoleShape(operatorConsoleBody);

  const summary = {
    stage: "stage31_post_deploy",
    generated_at: new Date().toISOString(),
    base_url: PRODUCTION_BASE_URL,
    online_baseline: {
      health: baseline.health,
      auth_debug: baseline.auth_debug,
      stable_route_statuses: baseline.stable_route_statuses
    },
    production_smoke: {
      operatorConsole: {
        route: STAGE31_ROUTE,
        method: "GET",
        status: operatorConsole.status,
        elapsed_ms: operatorConsole.elapsed_ms
      }
    }
  };

  writeJson(FILES.operatorConsole, sanitizeNode(operatorConsoleBody));
  writeJson(FILES.summary, summary);
  return summary;
}

POST_DEPLOY_MODE ? await runPostDeploy() : await runLocalContract();

console.log(
  JSON.stringify(
    {
      ok: true,
      mode: POST_DEPLOY_MODE ? "post_deploy" : "local_contract",
      summary_path: FILES.summary
    },
    null,
    2
  )
);
