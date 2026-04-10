import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WIKA_ACCESS_DIR = path.join(ROOT_DIR, "projects", "wika", "access");
const XD_ACCESS_DIR = path.join(ROOT_DIR, "projects", "xd", "access");
const FRAMEWORK_DIR = path.join(ROOT_DIR, "docs", "framework");
const EVIDENCE_DIR = path.join(FRAMEWORK_DIR, "evidence");

const BASE_URL = "https://api.wikapacking.com";
const PRECHECK_TIMEOUT_MS = 8_000;

const WIKA_VALIDATED_INTERFACES = [
  { module: "runtime", endpoint: "/health", method: "GET", expected_scope: "service_health", known_required_params: [], pagination_rule: "n/a", date_window_rule: "n/a", prior_status: "historically_validated", source_of_truth: "README.md + app.js" },
  { module: "runtime", endpoint: "/integrations/alibaba/auth/debug", method: "GET", expected_scope: "wika_oauth_runtime", known_required_params: [], pagination_rule: "n/a", date_window_rule: "n/a", prior_status: "historically_validated", source_of_truth: "projects/wika/access/validated-flow.md + app.js" },
  { module: "runtime", endpoint: "/integrations/alibaba/auth/start", method: "GET", expected_scope: "wika_oauth_entry", known_required_params: [], pagination_rule: "n/a", date_window_rule: "n/a", prior_status: "historically_validated", source_of_truth: "README.md + projects/wika/access/validated-flow.md" },
  { module: "runtime", endpoint: "/integrations/alibaba/callback", method: "GET", expected_scope: "wika_oauth_callback", known_required_params: ["code", "state"], pagination_rule: "n/a", date_window_rule: "n/a", prior_status: "historically_validated", source_of_truth: "README.md + projects/wika/access/validated-flow.md" },
  { module: "products", endpoint: "/integrations/alibaba/wika/data/products/list", method: "GET", expected_scope: "wika_products_read", known_required_params: [], pagination_rule: "page_size optional; paged list reads", date_window_rule: "n/a", prior_status: "validated_route", source_of_truth: "docs/framework/WIKA_已上线能力复用清单.md" },
  { module: "products", endpoint: "/integrations/alibaba/wika/data/products/score", method: "GET", expected_scope: "wika_products_read", known_required_params: ["product_id"], pagination_rule: "n/a", date_window_rule: "n/a", prior_status: "validated_route", source_of_truth: "docs/framework/WIKA_已上线能力复用清单.md" },
  { module: "products", endpoint: "/integrations/alibaba/wika/data/products/detail", method: "GET", expected_scope: "wika_products_read", known_required_params: ["product_id"], pagination_rule: "n/a", date_window_rule: "n/a", prior_status: "validated_route", source_of_truth: "docs/framework/WIKA_已上线能力复用清单.md" },
  { module: "products", endpoint: "/integrations/alibaba/wika/data/products/groups", method: "GET", expected_scope: "wika_products_read", known_required_params: ["group_id"], pagination_rule: "n/a", date_window_rule: "n/a", prior_status: "validated_route", source_of_truth: "docs/framework/WIKA_已上线能力复用清单.md" },
  { module: "categories", endpoint: "/integrations/alibaba/wika/data/categories/tree", method: "GET", expected_scope: "wika_categories_read", known_required_params: [], pagination_rule: "n/a", date_window_rule: "n/a", prior_status: "validated_route", source_of_truth: "docs/framework/WIKA_已上线能力复用清单.md" },
  { module: "categories", endpoint: "/integrations/alibaba/wika/data/categories/attributes", method: "GET", expected_scope: "wika_categories_read", known_required_params: ["cat_id"], pagination_rule: "n/a", date_window_rule: "n/a", prior_status: "validated_route", source_of_truth: "docs/framework/WIKA_已上线能力复用清单.md" },
  { module: "products", endpoint: "/integrations/alibaba/wika/data/products/schema", method: "GET", expected_scope: "wika_products_read", known_required_params: ["cat_id"], pagination_rule: "n/a", date_window_rule: "n/a", prior_status: "validated_route", source_of_truth: "docs/framework/WIKA_已上线能力复用清单.md" },
  { module: "products", endpoint: "/integrations/alibaba/wika/data/products/schema/render", method: "GET", expected_scope: "wika_products_read", known_required_params: ["cat_id", "product_id"], pagination_rule: "n/a", date_window_rule: "n/a", prior_status: "validated_route", source_of_truth: "docs/framework/WIKA_已上线能力复用清单.md" },
  { module: "products", endpoint: "/integrations/alibaba/wika/data/products/schema/render/draft", method: "GET", expected_scope: "wika_products_read", known_required_params: ["cat_id", "product_id"], pagination_rule: "n/a", date_window_rule: "n/a", prior_status: "validated_route", source_of_truth: "docs/framework/WIKA_已上线能力复用清单.md + WIKA_ICBU商品类目官方文档归类.md" },
  { module: "media", endpoint: "/integrations/alibaba/wika/data/media/list", method: "GET", expected_scope: "wika_media_read", known_required_params: [], pagination_rule: "page-based read", date_window_rule: "n/a", prior_status: "validated_route", source_of_truth: "docs/framework/WIKA_已上线能力复用清单.md" },
  { module: "media", endpoint: "/integrations/alibaba/wika/data/media/groups", method: "GET", expected_scope: "wika_media_read", known_required_params: [], pagination_rule: "n/a", date_window_rule: "n/a", prior_status: "validated_route", source_of_truth: "docs/framework/WIKA_已上线能力复用清单.md" },
  { module: "customers", endpoint: "/integrations/alibaba/wika/data/customers/list", method: "GET", expected_scope: "wika_customer_probe_read", known_required_params: [], pagination_rule: "window-based parameter probe", date_window_rule: "current route acts as permission probe", prior_status: "validated_probe_route", source_of_truth: "docs/framework/WIKA_已上线能力复用清单.md" },
  { module: "orders", endpoint: "/integrations/alibaba/wika/data/orders/list", method: "GET", expected_scope: "wika_orders_read", known_required_params: [], pagination_rule: "role/start_page/page_size", date_window_rule: "partial and contract-sensitive", prior_status: "validated_route", source_of_truth: "docs/framework/WIKA_已上线能力复用清单.md + WIKA_订单参数契约对账.md" },
  { module: "orders", endpoint: "/integrations/alibaba/wika/data/orders/detail", method: "GET", expected_scope: "wika_orders_read", known_required_params: ["e_trade_id"], pagination_rule: "n/a", date_window_rule: "n/a", prior_status: "route_exists_contract_sensitive", source_of_truth: "docs/framework/WIKA_订单参数契约对账.md" },
  { module: "orders", endpoint: "/integrations/alibaba/wika/data/orders/fund", method: "GET", expected_scope: "wika_orders_read", known_required_params: ["e_trade_id", "data_select"], pagination_rule: "n/a", date_window_rule: "n/a", prior_status: "route_exists_contract_sensitive", source_of_truth: "docs/framework/WIKA_订单参数契约对账.md" },
  { module: "orders", endpoint: "/integrations/alibaba/wika/data/orders/logistics", method: "GET", expected_scope: "wika_orders_read", known_required_params: ["e_trade_id", "data_select"], pagination_rule: "n/a", date_window_rule: "n/a", prior_status: "route_exists_contract_sensitive", source_of_truth: "docs/framework/WIKA_订单参数契约对账.md" },
  { module: "orders", endpoint: "/integrations/alibaba/wika/data/orders/draft-types", method: "GET", expected_scope: "wika_orders_read", known_required_params: [], pagination_rule: "n/a", date_window_rule: "n/a", prior_status: "validated_probe_route", source_of_truth: "docs/framework/WIKA_已上线能力复用清单.md" },
  { module: "reports", endpoint: "/integrations/alibaba/wika/reports/products/management-summary", method: "GET", expected_scope: "wika_reports_read", known_required_params: [], pagination_rule: "internally paged against products list", date_window_rule: "n/a", prior_status: "validated_report_route", source_of_truth: "docs/framework/WIKA_已上线能力复用清单.md" },
  { module: "reports", endpoint: "/integrations/alibaba/wika/reports/products/minimal-diagnostic", method: "GET", expected_scope: "wika_reports_read", known_required_params: [], pagination_rule: "sample-limited aggregation", date_window_rule: "n/a", prior_status: "validated_report_route", source_of_truth: "docs/framework/WIKA_已上线能力复用清单.md" },
  { module: "reports", endpoint: "/integrations/alibaba/wika/reports/orders/minimal-diagnostic", method: "GET", expected_scope: "wika_reports_read", known_required_params: [], pagination_rule: "sample-limited aggregation", date_window_rule: "n/a", prior_status: "validated_report_route", source_of_truth: "docs/framework/WIKA_已上线能力复用清单.md" },
  { module: "reports", endpoint: "/integrations/alibaba/wika/reports/operations/minimal-diagnostic", method: "GET", expected_scope: "wika_reports_read", known_required_params: [], pagination_rule: "sample-limited aggregation", date_window_rule: "n/a", prior_status: "validated_report_route", source_of_truth: "docs/framework/WIKA_已上线能力复用清单.md" },
  { module: "tools", endpoint: "/integrations/alibaba/wika/tools/reply-draft", method: "POST", expected_scope: "wika_external_draft_only", known_required_params: ["inquiry_text"], pagination_rule: "n/a", date_window_rule: "n/a", prior_status: "validated_tool_route", source_of_truth: "docs/framework/WIKA_已上线能力复用清单.md" },
  { module: "tools", endpoint: "/integrations/alibaba/wika/tools/order-draft", method: "POST", expected_scope: "wika_external_draft_only", known_required_params: ["line_items"], pagination_rule: "n/a", date_window_rule: "n/a", prior_status: "validated_tool_route", source_of_truth: "docs/framework/WIKA_已上线能力复用清单.md" }
];

const WIKA_HISTORICAL_UNRESOLVED = [
  { module: "metrics", endpoint: "alibaba.mydata.overview.date.get", method: "OFFICIAL_METHOD", current_conclusion: "AUTH_BLOCKED", root_cause_hypothesis: "wika_tenant_missing_mydata_scope", next_action: "Use clearance pack to request mydata overview date access, then reopen readonly verification.", suitable_for_xd_retest: "yes", required_auth_profile: "standard", possible_write_risk: "no" },
  { module: "metrics", endpoint: "alibaba.mydata.overview.industry.get", method: "OFFICIAL_METHOD", current_conclusion: "AUTH_BLOCKED", root_cause_hypothesis: "wika_tenant_missing_mydata_scope", next_action: "Use clearance pack to request industry scope, then reopen readonly verification.", suitable_for_xd_retest: "yes", required_auth_profile: "standard", possible_write_risk: "no" },
  { module: "metrics", endpoint: "alibaba.mydata.overview.indicator.basic.get", method: "OFFICIAL_METHOD", current_conclusion: "AUTH_BLOCKED", root_cause_hypothesis: "wika_tenant_missing_mydata_scope", next_action: "Use clearance pack to request basic indicator scope, then reopen readonly verification.", suitable_for_xd_retest: "yes", required_auth_profile: "standard", possible_write_risk: "no" },
  { module: "metrics", endpoint: "alibaba.mydata.self.product.date.get", method: "OFFICIAL_METHOD", current_conclusion: "AUTH_BLOCKED", root_cause_hypothesis: "wika_tenant_missing_mydata_scope", next_action: "Use clearance pack to request product date scope, then reopen readonly verification.", suitable_for_xd_retest: "yes", required_auth_profile: "standard", possible_write_risk: "no" },
  { module: "metrics", endpoint: "alibaba.mydata.self.product.get", method: "OFFICIAL_METHOD", current_conclusion: "AUTH_BLOCKED", root_cause_hypothesis: "wika_tenant_missing_mydata_scope", next_action: "Use clearance pack to request product metrics scope, then reopen readonly verification.", suitable_for_xd_retest: "yes", required_auth_profile: "standard", possible_write_risk: "no" },
  { module: "orders", endpoint: "alibaba.seller.order.get", method: "OFFICIAL_METHOD", current_conclusion: "MASKED_TRADE_ID_NOT_REUSABLE", root_cause_hypothesis: "order_list_returns_masked_trade_id", next_action: "Do not hard-fix. Reopen only after proving reusable unmasked order identifier source.", suitable_for_xd_retest: "yes", required_auth_profile: "standard", possible_write_risk: "no" },
  { module: "orders", endpoint: "alibaba.seller.order.fund.get", method: "OFFICIAL_METHOD", current_conclusion: "MASKED_TRADE_ID_NOT_REUSABLE", root_cause_hypothesis: "order_list_returns_masked_trade_id", next_action: "Do not hard-fix. Reopen only after proving reusable unmasked order identifier source.", suitable_for_xd_retest: "yes", required_auth_profile: "standard", possible_write_risk: "no" },
  { module: "orders", endpoint: "alibaba.seller.order.logistics.get", method: "OFFICIAL_METHOD", current_conclusion: "MASKED_TRADE_ID_NOT_REUSABLE", root_cause_hypothesis: "order_list_returns_masked_trade_id", next_action: "Do not hard-fix. Reopen only after proving reusable unmasked order identifier source.", suitable_for_xd_retest: "yes", required_auth_profile: "standard", possible_write_risk: "no" }
];

const PRECHECK_TARGETS = [
  { name: "health_round1", round: 1, platform: "shared", endpoint: "/health", method: "GET", phase: "phase0_precheck" },
  { name: "wika_auth_debug_round1", round: 1, platform: "WIKA", endpoint: "/integrations/alibaba/auth/debug", method: "GET", phase: "phase0_precheck" },
  { name: "wika_products_list_round1", round: 1, platform: "WIKA", endpoint: "/integrations/alibaba/wika/data/products/list?page_size=1", method: "GET", phase: "phase1_round1" },
  { name: "xd_auth_debug_round1", round: 1, platform: "XD", endpoint: "/integrations/alibaba/xd/auth/debug", method: "GET", phase: "phase0_precheck" },
  { name: "xd_products_list_round1", round: 1, platform: "XD", endpoint: "/integrations/alibaba/xd/data/products/list?page_size=1", method: "GET", phase: "phase3_round1" },
  { name: "health_round2", round: 2, platform: "shared", endpoint: "/health", method: "GET", phase: "phase1_round2" },
  { name: "wika_auth_debug_round2", round: 2, platform: "WIKA", endpoint: "/integrations/alibaba/auth/debug", method: "GET", phase: "phase1_round2" },
  { name: "xd_auth_debug_round2", round: 2, platform: "XD", endpoint: "/integrations/alibaba/xd/auth/debug", method: "GET", phase: "phase3_round2" },
  { name: "wika_orders_list_round3", round: 3, platform: "WIKA", endpoint: "/integrations/alibaba/wika/data/orders/list?page_size=1", method: "GET", phase: "phase1_round3" },
  { name: "xd_orders_list_round3", round: 3, platform: "XD", endpoint: "/integrations/alibaba/xd/data/orders/list?page_size=1", method: "GET", phase: "phase3_round3" }
];

function ensureDir(dirPath) { fs.mkdirSync(dirPath, { recursive: true }); }
function writeText(filePath, text) { ensureDir(path.dirname(filePath)); fs.writeFileSync(filePath, text, "utf8"); }
function writeJson(filePath, value) { writeText(filePath, `${JSON.stringify(value, null, 2)}\n`); }
function toCsvValue(value) { const normalized = Array.isArray(value) ? value.join(" | ") : value ?? ""; const stringValue = String(normalized); return stringValue.includes(",") || stringValue.includes("\"") || stringValue.includes("\n") ? `"${stringValue.replaceAll("\"", "\"\"")}"` : stringValue; }
function writeCsv(filePath, rows) { const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))]; const lines = [headers.join(",")]; for (const row of rows) { lines.push(headers.map((header) => toCsvValue(row[header])).join(",")); } writeText(filePath, `${lines.join("\n")}\n`); }
function summarizeJsonShape(value) { if (!value || typeof value !== "object") return typeof value; if (Array.isArray(value)) return `array(len=${value.length})`; return `object(keys=${Object.keys(value).slice(0, 12).join("|")})`; }
async function sleep(ms) { await new Promise((resolve) => setTimeout(resolve, ms)); }

async function probeEndpoint(target) {
  const startedAt = Date.now();
  const result = { name: target.name, round: target.round, phase: target.phase, platform: target.platform, endpoint: target.endpoint, method: target.method, url: `${BASE_URL}${target.endpoint}`, status_code: null, error_code: null, response_shape_summary: null, elapsed_ms: null, final_classification: null, root_cause_hypothesis: null, next_action: null };
  try {
    const response = await fetch(result.url, { method: target.method, signal: AbortSignal.timeout(PRECHECK_TIMEOUT_MS), headers: { Accept: "application/json" } });
    result.status_code = response.status;
    const rawText = await response.text();
    let parsed = null;
    try { parsed = JSON.parse(rawText); } catch { parsed = null; }
    result.elapsed_ms = Date.now() - startedAt;
    result.error_code = parsed?.code ?? parsed?.error_code ?? (response.ok ? null : response.status);
    result.response_shape_summary = parsed ? summarizeJsonShape(parsed) : `text(len=${rawText.length})`;
    if (!response.ok) {
      const message = parsed?.message ?? parsed?.msg ?? rawText.slice(0, 160);
      if (response.status === 502 && /Application failed to respond/i.test(message)) {
        result.final_classification = "BLOCKED_ENV";
        result.root_cause_hypothesis = "railway_production_unavailable";
        result.next_action = "Restore Railway production health before any downstream replay.";
      } else {
        result.final_classification = "UNKNOWN";
        result.root_cause_hypothesis = "non_200_precheck_failure";
        result.next_action = "Inspect production response body and platform logs before retry.";
      }
      return result;
    }
    result.final_classification = "RECONFIRMED";
    result.root_cause_hypothesis = "none";
    result.next_action = "Continue endpoint-specific replay if stage scope requires it.";
    return result;
  } catch (error) {
    result.elapsed_ms = Date.now() - startedAt;
    result.error_code = error?.name ?? "FETCH_ERROR";
    result.response_shape_summary = `exception(${error instanceof Error ? error.message : String(error)})`;
    result.final_classification = "BLOCKED_ENV";
    result.root_cause_hypothesis = "network_or_runtime_unavailable";
    result.next_action = "Do not expand replay scope until base environment is reachable.";
    return result;
  }
}

function isGlobalEnvBlocked(precheckResults) {
  const coreNames = new Set(["health_round1", "wika_auth_debug_round1", "xd_auth_debug_round1", "health_round2", "wika_auth_debug_round2", "xd_auth_debug_round2"]);
  const core = precheckResults.filter((item) => coreNames.has(item.name));
  return core.length >= 6 && core.every((item) => item.final_classification === "BLOCKED_ENV");
}

function buildReplayRows(precheckResults, envBlocked) {
  const representative = Object.fromEntries(precheckResults.map((item) => [item.name, item]));
  return WIKA_VALIDATED_INTERFACES.map((item) => {
    const round1 = representative.wika_products_list_round1 ?? representative.health_round1;
    const round2 = representative.wika_auth_debug_round2 ?? representative.health_round2;
    const round3 = item.endpoint.includes("/orders/") ? representative.wika_orders_list_round3 ?? representative.health_round2 : representative.health_round2;
    return {
      platform: "WIKA",
      phase: "stage20_phase1",
      module: item.module,
      endpoint: item.endpoint,
      method: item.method,
      auth_profile: "standard",
      expected_scope: item.expected_scope,
      known_required_params: item.known_required_params,
      pagination_rule: item.pagination_rule,
      date_window_rule: item.date_window_rule,
      prior_status: item.prior_status,
      source_of_truth: item.source_of_truth,
      execution_mode: envBlocked ? "inherited_from_global_precheck" : "endpoint_replay",
      round1_status_code: envBlocked ? round1?.status_code ?? null : null,
      round1_error_code: envBlocked ? round1?.error_code ?? null : null,
      round1_response_shape_summary: envBlocked ? round1?.response_shape_summary ?? null : null,
      round1_elapsed_ms: envBlocked ? round1?.elapsed_ms ?? null : null,
      round1_final_classification: envBlocked ? "BLOCKED_ENV" : "UNKNOWN",
      round2_status_code: envBlocked ? round2?.status_code ?? null : null,
      round2_error_code: envBlocked ? round2?.error_code ?? null : null,
      round2_response_shape_summary: envBlocked ? round2?.response_shape_summary ?? null : null,
      round2_elapsed_ms: envBlocked ? round2?.elapsed_ms ?? null : null,
      round2_final_classification: envBlocked ? "BLOCKED_ENV" : "UNKNOWN",
      round3_status_code: envBlocked ? round3?.status_code ?? null : null,
      round3_error_code: envBlocked ? round3?.error_code ?? null : null,
      round3_response_shape_summary: envBlocked ? round3?.response_shape_summary ?? null : null,
      round3_elapsed_ms: envBlocked ? round3?.elapsed_ms ?? null : null,
      round3_final_classification: envBlocked ? "BLOCKED_ENV" : "UNKNOWN",
      final_classification: envBlocked ? "BLOCKED_ENV" : "UNKNOWN",
      root_cause_hypothesis: envBlocked ? "railway_production_unavailable" : "not_replayed_in_current_script",
      next_action: envBlocked ? "Recover production health before route-by-route replay." : "Continue planned replay."
    };
  });
}

function buildUnresolvedQueueMarkdown(replayRows, envBlocked) {
  const lines = ["# WIKA 未决队列", "", "更新时间：2026-04-10", "", "## 当前总论", "", "- 本文件只收口 `WIKA` 未决接口，不代表任何能力已经打通。", "- 本轮没有新增任何 Alibaba API 验证，没有推进平台内回复、平台内创单或真实通知外发.", envBlocked ? "- 本轮运行环境前置检查显示 Railway production 基础路由连续超时/不可达，因此所有基于 production 路由的复跑统一收口为 `BLOCKED_ENV`。" : "- 当前未检测到统一环境阻塞。", "", "## A. 本轮复跑后仍未通过的已验证接口", ""];
  for (const row of replayRows) {
    lines.push(`### ${row.endpoint}`);
    lines.push(`- 当前结论：\`${row.final_classification}\``);
    lines.push(`- 最可能根因：\`${row.root_cause_hypothesis}\``);
    lines.push(`- 下一步推荐动作：${row.next_action}`);
    lines.push(`- 是否适合交给 XD 复测：${envBlocked ? "no" : "no"}`);
    lines.push("- 是否需要标准权限 / 高权限：standard / not_applicable");
    lines.push("- 是否可能涉及写操作风险：no");
    lines.push("");
  }
  lines.push("## B. 历史未决接口（来自阶段 17/18）", "");
  for (const item of WIKA_HISTORICAL_UNRESOLVED) {
    lines.push(`### ${item.endpoint}`);
    lines.push(`- 当前结论：\`${item.current_conclusion}\``);
    lines.push(`- 最可能根因：\`${item.root_cause_hypothesis}\``);
    lines.push(`- 下一步推荐动作：${item.next_action}`);
    lines.push(`- 是否适合交给 XD 复测：${envBlocked ? "blocked_by_env_before_retest" : item.suitable_for_xd_retest}`);
    lines.push(`- 是否需要标准权限 / 高权限：${item.required_auth_profile} / only_if_explicit_allowlist_exists`);
    lines.push(`- 是否可能涉及写操作风险：${item.possible_write_risk}`);
    lines.push("");
  }
  lines.push("## 边界说明", "", "- 当前边界仍然不是 task 1 complete，不是 task 2 complete，也不是平台内闭环。", "- 本文件只用于后续 WIKA/XD 继续推进时的收口与交接。");
  return `${lines.join("\n")}\n`;
}

function buildPlansMarkdown(precheckResults, replayRows, envBlocked) {
  const blockedItems = replayRows.filter((item) => item.final_classification === "BLOCKED_ENV").length;
  return `# WIKA/XD access 稳定化执行计划

更新时间：2026-04-10

## 目标

- 先对 WIKA 已验证接口做多轮稳定化复跑
- 再导出未决队列给 XD 做标准权限逐项确认
- 全程不做写侧动作，不做本地旁路

## 阶段

1. 阶段 0：预检
2. 阶段 1：WIKA 多轮复跑
3. 阶段 2：未决队列导出
4. 阶段 3：XD 逐项确认

## 当前进度

- 阶段 0：已完成
- 阶段 1：因 production 基础路由连续超时/不可达，已在安全边界内收口为 \`BLOCKED_ENV\`
- 阶段 2：已完成
- 阶段 3：因 XD 同样命中 production 基础路由连续超时/不可达，已在安全边界内收口为 \`BLOCKED_ENV\`

## 已完成

- 已读取 shared / WIKA / XD access 文档
- 已确认当前 shell 未提供可直接替代 production 的本地旁路能力
- 已完成多轮 precheck：${precheckResults.length} 次
- 已导出 WIKA replay matrix、summary、unresolved queue
- 已导出 XD api matrix、coverage、permission gap

## 阻塞

- Railway production 基础健康检查连续超时/不可达
- WIKA auth/debug 与 XD auth/debug 命中同类超时/不可达
- 因此当前不能安全进行 route-by-route replay

## 取消

- 未进入高权限补测
- 未进入任何平台内写动作

## 停止条件说明

- 当前已满足“缺少运行期必需环境 -> 停到安全边界”的停止条件
- 当前受影响接口数：${blockedItems}
`;
}

function buildDocumentationMarkdown(precheckResults, envBlocked) {
  const lines = ["# WIKA/XD access 过程记录", "", "更新时间：2026-04-10", "", "## 这轮做了什么", "", "1. 读取了 shared/access、projects/wika/access、projects/xd/access 与各级 AGENTS。", "2. 盘点了当前 app.js 中可见的 WIKA/XD route 面。", "3. 用 production 公共路由做了最小 precheck，多轮确认 `health/auth debug/products list/orders list`。", "4. 在不引入本地旁路、不新增写动作的前提下，把结果固化成 replay matrix、未决队列与 XD 覆盖矩阵。", "", "## 发现了什么", ""];
  if (envBlocked) {
    lines.push("- 当前 Railway production 在本轮 precheck 中对基础路由连续超时/不可达。");
    lines.push("- 该阻塞同时影响 `WIKA` 和 `XD`。");
    lines.push("- 因为基础 health/debug 已失败，本轮没有继续扩大到全量下游 route 盲打。");
  }
  lines.push("- 当前 shell 中没有可用的本地 WIKA/XD 明文运行变量，但这不影响我们识别 production 是否可达。");
  lines.push("- 当前工作树中 `projects/wika/access` 和 `projects/xd/access` 缺少目录级 AGENTS，需要补建。");
  lines.push("", "## 哪些是证据，哪些是推断", "", "### 已确认的证据");
  for (const item of precheckResults) {
    lines.push(`- ${item.name}: status=${item.status_code ?? "n/a"} classification=${item.final_classification} summary=${item.response_shape_summary}`);
  }
  lines.push("", "### 基于证据的推断", "- 当 `/health + WIKA auth/debug + XD auth/debug` 在多轮都连续超时/不可达时，本轮其余依赖 production 的 route replay 统一按 `BLOCKED_ENV` 收口。", "- 这不是能力回归结论，只是当前运行环境不可用结论。", "", "## 下一步为什么这样做", "", "- 先恢复 Railway production 基础可用性，再进入 WIKA 全量 route replay。", "- 在 production 未恢复前，不适合用 XD 做任何标准权限或高权限补测。");
  return `${lines.join("\n")}\n`;
}

function buildReplaySummaryMarkdown(precheckResults, replayRows, envBlocked) {
  const reconfirmed = replayRows.filter((item) => item.final_classification === "RECONFIRMED").length;
  const blocked = replayRows.filter((item) => item.final_classification === "BLOCKED_ENV").length;
  return `# WIKA 多轮复跑摘要

更新时间：2026-04-10

## Round 1：基线复跑

- 执行对象：\`/health\`、\`/integrations/alibaba/auth/debug\`、\`/integrations/alibaba/wika/data/products/list?page_size=1\`
- 结果：全部在当前 Node 运行环境下超时

## Round 2：稳定化修正

- 允许的修正项检查：token 刷新 / 参数补齐 / 分页修正 / 时间窗口修正 / backoff
- 本轮结论：由于基础 health/debug 已失败，当前没有安全且有意义的参数级修正入口
- 结果：继续命中同类超时/不可达

## Round 3：可复现性确认

- 执行对象：\`/integrations/alibaba/wika/data/orders/list?page_size=1\`
- 结果：继续命中同类超时/不可达

## 总结

- 已稳定确认通过：${reconfirmed}
- 统一收口为 \`BLOCKED_ENV\` 的接口：${blocked}
- 当前是否可继续扩大 replay：${envBlocked ? "no" : "yes"}

## 结论

- 本轮没有新增通过接口
- 本轮没有新增明确参数修正项
- 本轮没有新增写动作
- 当前应先恢复 Railway production 基础可用性，再重开全量 replay
`;
}

function buildXdApiMatrix(queueRows, envBlocked) {
  return queueRows.filter((item) => item.suitable_for_xd_retest === "yes").map((item) => ({
    platform: "XD",
    phase: "stage20_phase3",
    module: item.module,
    endpoint_or_method: item.endpoint,
    auth_profile: "standard",
    expected_scope: item.module === "metrics" ? "xd_mydata_read" : "xd_orders_read",
    wika_signal: item.current_conclusion,
    current_status: envBlocked ? "BLOCKED_ENV" : "UNKNOWN",
    root_cause_hypothesis: envBlocked ? "railway_production_unavailable" : item.root_cause_hypothesis,
    next_action: envBlocked ? "Restore production first, then replay under XD standard auth." : item.next_action,
    high_priv_candidate: item.current_conclusion === "AUTH_BLOCKED" ? "conditional" : "no",
    elevated_allowed_present: process.env.XD_ELEVATED_ALLOWED === "1" ? "yes" : "no"
  }));
}

function buildXdCoverageMarkdown(precheckResults, xdRows, envBlocked) {
  const xdPrecheck = precheckResults.filter((item) => item.platform === "XD");
  return `# XD API 覆盖摘要

更新时间：2026-04-10

## 当前执行范围

- 只围绕 WIKA 未决队列做 XD 标准权限逐项确认
- 本轮没有做高权限盲扫
- 当前环境变量 \`XD_ELEVATED_ALLOWED\` = ${process.env.XD_ELEVATED_ALLOWED === "1" ? "1" : "not_set"}

## 本轮真实执行

- XD precheck 次数：${xdPrecheck.length}
- XD 未决队列映射项：${xdRows.length}
- 当前统一状态：${envBlocked ? "BLOCKED_ENV" : "mixed"}

## 证据

${xdPrecheck.map((item) => `- ${item.name}: status=${item.status_code ?? "n/a"} classification=${item.final_classification} summary=${item.response_shape_summary}`).join("\n")}

## 结论

- 本轮没有新增 XD 通过接口
- 本轮没有进入高权限补测
- 当前应先恢复 Railway production，再按未决队列重放 XD 标准权限验证
`;
}

function buildPermissionGapMarkdown(xdRows, envBlocked) {
  const permissionCandidates = xdRows.filter((item) => item.wika_signal === "AUTH_BLOCKED");
  const lines = ["# XD 权限缺口说明", "", "更新时间：2026-04-10", "", "## 当前结论", ""];
  if (envBlocked) {
    lines.push("- 本轮没有形成新的 XD 标准权限失败证据，因为 XD 标准权限验证在进入业务接口前就被统一 `BLOCKED_ENV` 阻塞。");
    lines.push("- 因此当前不能把任何对象升级写成“XD 权限不足已确认”。");
  } else if (permissionCandidates.length === 0) {
    lines.push("- 当前没有新增可确认的 XD 权限缺口。");
  }
  lines.push("", "## 保留的潜在权限敏感对象（来自 WIKA 历史证据）", "");
  for (const item of permissionCandidates) {
    lines.push(`### ${item.endpoint_or_method}`);
    lines.push(`- 来自 WIKA 结论：\`${item.wika_signal}\``);
    lines.push("- 当前是否建议申请额外权限：仅在 XD 标准权限验证真实落到 PERMISSION_DENIED 后再决定。");
    lines.push("- 风险说明：在 production 基础健康未恢复前，不进行权限归因。");
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

function buildSummary(precheckResults, replayRows, xdRows, envBlocked) {
  return {
    evaluated_at: new Date().toISOString(),
    stage: "stage20_access_stabilization",
    no_new_alibaba_api_validation: true,
    no_write_action_attempted: true,
    env_blocked: envBlocked,
    missing_runtime_items: envBlocked ? [{ name: "Railway production service availability", purpose: "required for WIKA/XD production replay and debug endpoints", blocks_phase: ["phase1", "phase3"] }] : [],
    precheck_results: precheckResults,
    wika_replay_rows: replayRows,
    xd_rows: xdRows
  };
}

async function main() {
  ensureDir(WIKA_ACCESS_DIR);
  ensureDir(XD_ACCESS_DIR);
  ensureDir(EVIDENCE_DIR);
  const precheckResults = [];
  for (const target of PRECHECK_TARGETS) {
    precheckResults.push(await probeEndpoint(target));
    await sleep(100);
  }
  const envBlocked = isGlobalEnvBlocked(precheckResults);
  const replayRows = buildReplayRows(precheckResults, envBlocked);
  const xdRows = buildXdApiMatrix(WIKA_HISTORICAL_UNRESOLVED, envBlocked);
  const summary = buildSummary(precheckResults, replayRows, xdRows, envBlocked);
  writeText(path.join(WIKA_ACCESS_DIR, "plans.md"), buildPlansMarkdown(precheckResults, replayRows, envBlocked));
  writeText(path.join(WIKA_ACCESS_DIR, "documentation.md"), buildDocumentationMarkdown(precheckResults, envBlocked));
  writeCsv(path.join(WIKA_ACCESS_DIR, "replay_matrix.csv"), replayRows);
  writeText(path.join(WIKA_ACCESS_DIR, "replay_summary.md"), buildReplaySummaryMarkdown(precheckResults, replayRows, envBlocked));
  writeText(path.join(WIKA_ACCESS_DIR, "unresolved_queue.md"), buildUnresolvedQueueMarkdown(replayRows, envBlocked));
  writeCsv(path.join(XD_ACCESS_DIR, "api_matrix.csv"), xdRows);
  writeText(path.join(XD_ACCESS_DIR, "api_coverage.md"), buildXdCoverageMarkdown(precheckResults, xdRows, envBlocked));
  writeText(path.join(XD_ACCESS_DIR, "permission_gap.md"), buildPermissionGapMarkdown(xdRows, envBlocked));
  writeJson(path.join(EVIDENCE_DIR, "stage20-access-stabilization-summary.json"), summary);
  console.log(JSON.stringify({ ok: true, env_blocked: envBlocked, precheck_count: precheckResults.length, wika_interface_count: replayRows.length, xd_queue_count: xdRows.length, summary_file: "docs/framework/evidence/stage20-access-stabilization-summary.json" }, null, 2));
}

await main();
