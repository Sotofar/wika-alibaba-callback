import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const EVIDENCE_DIR = path.join(ROOT_DIR, "docs", "framework", "evidence");
const BASE_URL = "https://api.wikapacking.com";

const ROUTES = {
  operationsManagement: "/integrations/alibaba/wika/reports/operations/management-summary",
  productsManagement: "/integrations/alibaba/wika/reports/products/management-summary",
  operationsDiagnostic: "/integrations/alibaba/wika/reports/operations/minimal-diagnostic",
  productsDiagnostic: "/integrations/alibaba/wika/reports/products/minimal-diagnostic"
};

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function maskValue(value, keepStart = 3, keepEnd = 3) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const text = String(value);
  if (text.length <= keepStart + keepEnd) {
    return "***";
  }

  return `${text.slice(0, keepStart)}***${text.slice(-keepEnd)}`;
}

function sanitizeNode(node) {
  if (Array.isArray(node)) {
    return node.slice(0, 20).map((item) => sanitizeNode(item));
  }

  if (!node || typeof node !== "object") {
    if (typeof node === "string" && /@/.test(node)) {
      return maskValue(node);
    }
    return node;
  }

  const output = {};
  for (const [key, value] of Object.entries(node)) {
    if (
      /(^token$|_token$|^secret$|_secret$|^sign$|_sign$|^authorization$|^cookie$|^app_key$|^client_id$|^client_secret$)/i.test(
        key
      )
    ) {
      output[key] = "***";
      continue;
    }

    if (
      /(trade_id|member|phone|mobile|email|address)/i.test(key) &&
      value !== undefined &&
      value !== null &&
      value !== "" &&
      (typeof value === "string" || typeof value === "number")
    ) {
      output[key] = maskValue(value);
      continue;
    }

    output[key] = sanitizeNode(value);
  }

  return output;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function fetchJson(route) {
  const startedAt = Date.now();
  const response = await fetch(`${BASE_URL}${route}`);
  const text = await response.text();
  let body = null;

  try {
    body = JSON.parse(text);
  } catch {
    body = null;
  }

  return {
    route,
    status: response.status,
    elapsed_ms: Date.now() - startedAt,
    is_json: body !== null,
    body,
    text
  };
}

function hasOwn(object, key) {
  return Boolean(object) && Object.prototype.hasOwnProperty.call(object, key);
}

function buildOperationsSummaryCheck(body) {
  return {
    report_name: body?.report_name === "operations_management_summary",
    source_methods: Array.isArray(body?.source_methods) && body.source_methods.length >= 3,
    official_fields: [
      "visitor",
      "imps",
      "clk",
      "clk_rate",
      "fb",
      "reply"
    ].every((key) => hasOwn(body?.official_metrics, key)),
    derived_fields: [
      "uv_candidate_from_visitor",
      "exposure_from_imps",
      "ctr_candidate_from_clk_rate",
      "reply_related_metric_from_reply"
    ].every((key) => hasOwn(body?.derived_metrics, key)),
    interpretation: hasOwn(body, "interpretation"),
    unavailable_dimensions: [
      "traffic_source",
      "country_source",
      "quick_reply_rate"
    ].every((value) => body?.unavailable_dimensions?.includes(value)),
    boundary_statement: hasOwn(body, "boundary_statement")
  };
}

function buildProductsSummaryCheck(body) {
  return {
    report_name: body?.report_name === "products_management_summary",
    statistics_type: typeof body?.statistics_type === "string",
    stat_date: typeof body?.stat_date === "string",
    sample_boundary: [
      "product_scope_basis",
      "product_scope_limit",
      "product_scope_truncated",
      "product_ids_used",
      "product_ids_used_count"
    ].every((key) => hasOwn(body, key)),
    aggregate_official_metrics: hasOwn(body, "aggregate_official_metrics"),
    ranking_sections: hasOwn(body, "ranking_sections"),
    keyword_signal_summary: hasOwn(body, "keyword_signal_summary"),
    unavailable_dimensions: [
      "access_source",
      "inquiry_source",
      "country_source",
      "period_over_period_change"
    ].every((value) => body?.unavailable_dimensions?.includes(value)),
    boundary_statement: hasOwn(body, "boundary_statement")
  };
}

function buildOperationsDiagnosticCheck(body) {
  return {
    traffic_performance_section: hasOwn(body, "traffic_performance_section"),
    signal_interpretation: hasOwn(body?.traffic_performance_section, "signal_interpretation"),
    recommendation_block: hasOwn(body?.traffic_performance_section, "recommendation_block"),
    unavailable_dimensions_echo: hasOwn(body?.traffic_performance_section, "unavailable_dimensions_echo"),
    confidence_hints: hasOwn(body?.traffic_performance_section, "confidence_hints"),
    official_derived_unavailable_layers:
      hasOwn(body?.traffic_performance_section, "official_metrics") &&
      hasOwn(body?.traffic_performance_section, "derived_metrics") &&
      hasOwn(body?.traffic_performance_section, "unavailable_dimensions")
  };
}

function buildProductsDiagnosticCheck(body) {
  const firstRankingItem =
    body?.performance_section?.ranking_interpretation?.top_products_by_impression?.[0] ?? null;

  return {
    performance_section: hasOwn(body, "performance_section"),
    ranking_interpretation: hasOwn(body?.performance_section, "ranking_interpretation"),
    keyword_signal_takeaways: hasOwn(body?.performance_section, "keyword_signal_takeaways"),
    recommendation_block: hasOwn(body?.performance_section, "recommendation_block"),
    unavailable_dimensions_echo: hasOwn(body?.performance_section, "unavailable_dimensions_echo"),
    confidence_hints: hasOwn(body?.performance_section, "confidence_hints"),
    official_derived_unavailable_layers:
      hasOwn(body?.performance_section, "unavailable_dimensions") &&
      hasOwn(firstRankingItem, "official_metrics") &&
      hasOwn(firstRankingItem, "derived_metrics")
  };
}

async function run() {
  const responses = {
    operationsManagement: await fetchJson(ROUTES.operationsManagement),
    productsManagement: await fetchJson(ROUTES.productsManagement),
    operationsDiagnostic: await fetchJson(ROUTES.operationsDiagnostic),
    productsDiagnostic: await fetchJson(ROUTES.productsDiagnostic)
  };

  for (const [key, response] of Object.entries(responses)) {
    assert(response.status === 200, `${key} HTTP status is not 200`);
    assert(response.is_json, `${key} did not return JSON`);
  }

  const operationsSummaryCheck = buildOperationsSummaryCheck(responses.operationsManagement.body);
  const productsSummaryCheck = buildProductsSummaryCheck(responses.productsManagement.body);
  const operationsDiagnosticCheck = buildOperationsDiagnosticCheck(responses.operationsDiagnostic.body);
  const productsDiagnosticCheck = buildProductsDiagnosticCheck(responses.productsDiagnostic.body);

  for (const [label, checks] of Object.entries({
    operationsSummaryCheck,
    productsSummaryCheck,
    operationsDiagnosticCheck,
    productsDiagnosticCheck
  })) {
    for (const [key, passed] of Object.entries(checks)) {
      assert(passed, `${label} failed on ${key}`);
    }
  }

  const summary = {
    stage: "stage21_post_deploy_lock",
    generated_at: new Date().toISOString(),
    base_url: BASE_URL,
    push_commit: "4814b97fa3dbd32b81d603eaf063a9f19dfaf76b",
    routes: {
      operations_management_summary: {
        route: ROUTES.operationsManagement,
        http_status: responses.operationsManagement.status,
        is_json: responses.operationsManagement.is_json,
        checks: operationsSummaryCheck
      },
      products_management_summary: {
        route: ROUTES.productsManagement,
        http_status: responses.productsManagement.status,
        is_json: responses.productsManagement.is_json,
        checks: productsSummaryCheck,
        sample_boundary: {
          product_scope_basis: responses.productsManagement.body.product_scope_basis,
          product_scope_limit: responses.productsManagement.body.product_scope_limit,
          product_scope_truncated: responses.productsManagement.body.product_scope_truncated,
          product_ids_used_count: responses.productsManagement.body.product_ids_used_count
        }
      },
      operations_minimal_diagnostic: {
        route: ROUTES.operationsDiagnostic,
        http_status: responses.operationsDiagnostic.status,
        is_json: responses.operationsDiagnostic.is_json,
        checks: operationsDiagnosticCheck
      },
      products_minimal_diagnostic: {
        route: ROUTES.productsDiagnostic,
        http_status: responses.productsDiagnostic.status,
        is_json: responses.productsDiagnostic.is_json,
        checks: productsDiagnosticCheck
      }
    },
    boundary_statement: {
      not_task_1_complete: true,
      not_task_2_complete: true,
      no_write_action_attempted: true,
      wika_only_thread: true,
      xd_untouched_in_this_round: true,
      not_full_business_cockpit: true
    }
  };

  writeJson(
    path.join(EVIDENCE_DIR, "wika-stage21-post-deploy-summary.json"),
    sanitizeNode(summary)
  );
  writeJson(
    path.join(EVIDENCE_DIR, "wika_operations_management_summary_post_deploy.json"),
    sanitizeNode(responses.operationsManagement.body)
  );
  writeJson(
    path.join(EVIDENCE_DIR, "wika_products_management_summary_post_deploy.json"),
    sanitizeNode(responses.productsManagement.body)
  );
  writeJson(
    path.join(EVIDENCE_DIR, "wika_operations_minimal_diagnostic_post_deploy.json"),
    sanitizeNode(responses.operationsDiagnostic.body)
  );
  writeJson(
    path.join(EVIDENCE_DIR, "wika_products_minimal_diagnostic_post_deploy.json"),
    sanitizeNode(responses.productsDiagnostic.body)
  );

  console.log(JSON.stringify(summary, null, 2));
}

run().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error)
      },
      null,
      2
    )
  );
  process.exitCode = 1;
});
