import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const BASE_URL = "https://api.wikapacking.com";
const EVIDENCE_PATH = path.join(ROOT, "docs", "framework", "evidence", "stage27-xd-route-binding.json");
const STAGE26_EVIDENCE_PATH = path.join(ROOT, "docs", "framework", "evidence", "stage26-xd-full-parity.json");
const ROUTE_DEFINITIONS = [
  {
    name: "products/detail",
    module: "products",
    buildPath: ({ productId }) =>
      `/integrations/alibaba/xd/data/products/detail?product_id=${encodeURIComponent(productId)}`,
    expectedFieldKey: "product_field_keys"
  },
  {
    name: "products/groups",
    module: "products",
    buildPath: ({ groupId }) =>
      `/integrations/alibaba/xd/data/products/groups?group_id=${encodeURIComponent(groupId)}`,
    expectedFieldKey: "product_group_field_keys"
  },
  {
    name: "products/score",
    module: "products",
    buildPath: ({ productId }) =>
      `/integrations/alibaba/xd/data/products/score?product_id=${encodeURIComponent(productId)}`,
    expectedFieldKey: "result_field_keys"
  },
  {
    name: "orders/fund",
    module: "orders",
    buildPath: ({ tradeId }) =>
      `/integrations/alibaba/xd/data/orders/fund?e_trade_id=${encodeURIComponent(tradeId)}&data_select=${encodeURIComponent("fund_serviceFee,fund_fundPay")}`,
    expectedFieldKey: "value_field_keys"
  },
  {
    name: "orders/logistics",
    module: "orders",
    buildPath: ({ tradeId }) =>
      `/integrations/alibaba/xd/data/orders/logistics?e_trade_id=${encodeURIComponent(tradeId)}&data_select=${encodeURIComponent("logistic_order")}`,
    expectedFieldKey: "value_field_keys"
  }
];
const CANARIES = [
  "/health",
  "/integrations/alibaba/xd/auth/debug",
  "/integrations/alibaba/xd/data/products/list?page_size=1",
  "/integrations/alibaba/xd/data/orders/list?page_size=1"
];
const RESPONSE_META_KEYS = new Set([
  "ok",
  "module",
  "account",
  "read_only",
  "verification_status",
  "evidence_level",
  "source",
  "request",
  "request_meta",
  "response_meta",
  "verified_fields",
  "warnings",
  "raw_root_key",
  "data_scope"
]);

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeJson(filePath, value) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function mask(value, keepStart = 3, keepEnd = 3) {
  if (value === null || value === undefined || value === "") return null;
  const text = String(value);
  if (text.length <= keepStart + keepEnd) return "***";
  return `${text.slice(0, keepStart)}***${text.slice(-keepEnd)}`;
}

function sanitize(node) {
  if (Array.isArray(node)) return node.slice(0, 5).map((item) => sanitize(item));
  if (!node || typeof node !== "object") return node;
  const out = {};
  for (const [key, value] of Object.entries(node)) {
    if (/(token|secret|sign|authorization|cookie|client_id|client_secret)/i.test(key)) {
      out[key] = "***";
    } else if (/(trade_id|e_trade_id|product_id|group_id|cat_id|category_id)/i.test(key)) {
      out[key] = typeof value === "object" ? sanitize(value) : mask(value);
    } else {
      out[key] = sanitize(value);
    }
  }
  return out;
}

async function fetchRoute(pathname) {
  const started = Date.now();
  const response = await fetch(`${BASE_URL}${pathname}`);
  const text = await response.text();
  const isJson = (response.headers.get("content-type") || "").includes("json");
  return {
    path: pathname,
    status: response.status,
    elapsed_ms: Date.now() - started,
    is_json: isJson,
    body: isJson ? JSON.parse(text) : null,
    text: isJson ? null : text.slice(0, 240)
  };
}

function getError(body) {
  if (!body || typeof body !== "object") return null;
  if (body.top_error) {
    return {
      error_category: body.error_category || null,
      code: body.top_error.code || null,
      sub_code: body.top_error.sub_code || null,
      msg: body.top_error.msg || null
    };
  }
  if (body.error_response) {
    return {
      error_category: null,
      code: body.error_response.code || null,
      sub_code: body.error_response.sub_code || null,
      msg: body.error_response.msg || null
    };
  }
  return null;
}

function hasNestedData(node) {
  if (Array.isArray(node)) return node.some((item) => hasNestedData(item));
  if (!node || typeof node !== "object") return node !== null && node !== undefined && node !== "";
  return Object.entries(node).some(([key, value]) => !RESPONSE_META_KEYS.has(key) && hasNestedData(value));
}

function classifySuccessfulRoute(body, expectedFieldKey) {
  const fieldKeys = body?.response_meta?.[expectedFieldKey];
  if (Array.isArray(fieldKeys) && fieldKeys.length > 0) return "ROUTE_BOUND_AND_PASSED";
  if (Array.isArray(body?.verified_fields) && body.verified_fields.length > 0) return "ROUTE_BOUND_AND_PASSED";
  if (hasNestedData(body)) return "ROUTE_BOUND_AND_PASSED";
  return "ROUTE_BOUND_NO_DATA";
}

function classifyRouteResponse(response, expectedFieldKey) {
  if (response.status === 404) return "DOC_MISMATCH";
  if (response.status >= 200 && response.status < 300 && response.body?.ok === true) {
    return classifySuccessfulRoute(response.body, expectedFieldKey);
  }
  const error = getError(response.body);
  if (error?.error_category === "parameter_error") return "PARAM_CONTRACT_MISSING";
  if (error?.error_category === "permission_error") return "TENANT_OR_PRODUCT_RESTRICTION";
  const raw = `${error?.code || ""} ${error?.sub_code || ""} ${error?.msg || ""}`.toLowerCase();
  if (raw.includes("missing") || raw.includes("parameter")) return "PARAM_CONTRACT_MISSING";
  if (raw.includes("permission") || raw.includes("insufficient") || raw.includes("unauthorized")) {
    return "TENANT_OR_PRODUCT_RESTRICTION";
  }
  return "UNKNOWN";
}

function summarizeRoute(response, expectedFieldKey) {
  if (!response.is_json) {
    return {
      content_type: "text",
      text: response.text
    };
  }
  const body = response.body || {};
  return sanitize({
    top_keys: Object.keys(body).slice(0, 20),
    response_meta_keys: Object.keys(body.response_meta || {}).slice(0, 20),
    expected_field_key: expectedFieldKey,
    expected_field_count: Array.isArray(body?.response_meta?.[expectedFieldKey])
      ? body.response_meta[expectedFieldKey].length
      : 0,
    verified_field_count: Array.isArray(body.verified_fields) ? body.verified_fields.length : 0,
    error_category: body.error_category || null,
    top_error: body.top_error || null
  });
}

function fallbackSamples() {
  if (!fs.existsSync(STAGE26_EVIDENCE_PATH)) return null;
  const evidence = readJson(STAGE26_EVIDENCE_PATH);
  const samples = evidence?.samples;
  if (!samples?.productId || !samples?.groupId || !samples?.tradeId) return null;
  return {
    productId: samples.productId,
    groupId: samples.groupId,
    tradeId: samples.tradeId,
    source: "stage26_evidence_fallback"
  };
}

async function loadSamples() {
  const [productList, orderList] = await Promise.all([
    fetchRoute("/integrations/alibaba/xd/data/products/list?page_size=1"),
    fetchRoute("/integrations/alibaba/xd/data/orders/list?page_size=1")
  ]);
  const productItem = Array.isArray(productList.body?.items) ? productList.body.items[0] : null;
  const orderItem = Array.isArray(orderList.body?.items) ? orderList.body.items[0] : null;
  if (productItem?.product_id && productItem?.group_id && (orderItem?.trade_id || orderItem?.e_trade_id)) {
    return {
      productId: productItem.product_id,
      groupId: productItem.group_id,
      tradeId: orderItem.trade_id || orderItem.e_trade_id,
      source: "live_list_samples",
      canary_products: productList,
      canary_orders: orderList
    };
  }
  const fallback = fallbackSamples();
  if (fallback) {
    return {
      ...fallback,
      canary_products: productList,
      canary_orders: orderList
    };
  }
  throw new Error("unable to derive stage27 samples from current XD list routes");
}

function countByClassification(routeResults) {
  return routeResults.reduce((acc, item) => {
    acc[item.classification] = (acc[item.classification] || 0) + 1;
    return acc;
  }, {});
}

async function main() {
  const currentHead = execSync("git rev-parse HEAD", { cwd: ROOT, encoding: "utf8" }).trim();
  const canaries = await Promise.all(CANARIES.map((pathname) => fetchRoute(pathname)));
  const blockedCanary = canaries.find((item) => item.status !== 200);
  if (blockedCanary) {
    const blockedEvidence = {
      evaluated_at: new Date().toISOString(),
      current_head: currentHead,
      base_url: BASE_URL,
      production_gate: {
        status: "BLOCKED_ENV",
        canaries: canaries.map((item) => ({
          path: item.path,
          status: item.status,
          elapsed_ms: item.elapsed_ms,
          summary: summarizeRoute(item, null)
        }))
      },
      routes: [],
      regression: [],
      counts: { BLOCKED_ENV: ROUTE_DEFINITIONS.length }
    };
    writeJson(EVIDENCE_PATH, blockedEvidence);
    console.log(JSON.stringify(blockedEvidence, null, 2));
    return;
  }

  const samples = await loadSamples();
  const routeResults = [];
  for (const definition of ROUTE_DEFINITIONS) {
    const response = await fetchRoute(definition.buildPath(samples));
    routeResults.push({
      name: definition.name,
      module: definition.module,
      path: response.path,
      status_code: response.status,
      elapsed_ms: response.elapsed_ms,
      classification: classifyRouteResponse(response, definition.expectedFieldKey),
      summary: summarizeRoute(response, definition.expectedFieldKey)
    });
  }

  const passingRoutes = routeResults.filter((item) => item.classification === "ROUTE_BOUND_AND_PASSED");
  const regression = [];
  for (const route of passingRoutes) {
    const definition = ROUTE_DEFINITIONS.find((item) => item.name === route.name);
    const replay = await fetchRoute(definition.buildPath(samples));
    regression.push({
      name: route.name,
      path: replay.path,
      status_code: replay.status,
      elapsed_ms: replay.elapsed_ms,
      classification: classifyRouteResponse(replay, definition.expectedFieldKey),
      summary: summarizeRoute(replay, definition.expectedFieldKey)
    });
  }

  const sanityControl = await fetchRoute("/integrations/alibaba/xd/data/orders/list?page_size=1");
  const evidence = {
    evaluated_at: new Date().toISOString(),
    current_head: currentHead,
    base_url: BASE_URL,
    production_gate: {
      status: "PASS_BASE",
      canaries: canaries.map((item) => ({
        path: item.path,
        status: item.status,
        elapsed_ms: item.elapsed_ms
      }))
    },
    samples: sanitize({
      productId: samples.productId,
      groupId: samples.groupId,
      tradeId: samples.tradeId,
      source: samples.source
    }),
    routes: routeResults,
    regression,
    sanity_control: {
      path: sanityControl.path,
      status_code: sanityControl.status,
      elapsed_ms: sanityControl.elapsed_ms,
      classification:
        sanityControl.status === 200 && Array.isArray(sanityControl.body?.items) && sanityControl.body.items.length > 0
          ? "RECONFIRMED_XD_CONTROL"
          : "UNKNOWN",
      summary: summarizeRoute(sanityControl, "items")
    },
    counts: countByClassification(routeResults)
  };

  writeJson(EVIDENCE_PATH, evidence);
  console.log(JSON.stringify(evidence, null, 2));
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        stage: "stage27",
        error: error instanceof Error ? error.message : String(error)
      },
      null,
      2
    )
  );
  process.exitCode = 1;
});
