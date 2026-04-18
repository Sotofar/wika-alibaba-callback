import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  MONITORING_RUNS_DIR,
  STAGE30_EVIDENCE_PATH,
  parseArgs,
  writeJson,
  writeText,
  readJson,
  fetchRoute,
  getXdCredentials,
  callSyncApi,
  collectStableSamples,
  summarizeRouteBody,
  summarizeSyncBody,
  topError,
  scanForSensitiveValues
} from "./xd-stage31-common.js";

const DEFAULT_TIMEOUT = 20000;
const REPORT_ROUTE_SKIP_REASON =
  "当前 production 未绑定 report route，stage31 以文件化报告资产替代，不在本轮回头扩 route。";

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function classifyRouteResult(result, { expectedKeys = [], allowNoData = true, skipOn404 = false } = {}) {
  if (result?.error === "timeout") return "FAIL_TIMEOUT";
  if (result?.error) return "UNKNOWN";
  if (result?.status === 401 || result?.status === 403) return "FAIL_AUTH";
  if (skipOn404 && result?.status === 404) return "SKIPPED_BY_SAFETY";
  if (result?.status !== 200) return "FAIL_ROUTE";
  const body = result.raw_body || {};
  const summary = summarizeRouteBody(body);
  const hasExpectedKeys = expectedKeys.length ? expectedKeys.every((key) => key in body || key in (body.item || body.value || body.product || body.product_group || {})) : true;
  if (!hasExpectedKeys) return "FAIL_SHAPE";
  if (!summary.meaningful) return allowNoData ? "PASS_NO_DATA" : "FAIL_SHAPE";
  return "PASS";
}

function classifyDirectResult(result, apiName) {
  if (result?.error === "timeout") return "FAIL_TIMEOUT";
  if (result?.error) return "UNKNOWN";
  if (result?.status === 401 || result?.status === 403) return "FAIL_AUTH";
  if (result?.status !== 200) return "FAIL_ROUTE";
  const error = topError(result.raw_body);
  if (error) {
    const raw = `${error.code || ""} ${error.sub_code || ""} ${error.msg || ""}`.toLowerCase();
    if (raw.includes("permission") || raw.includes("insufficient") || raw.includes("unauthorized")) return "FAIL_AUTH";
    return "FAIL_SHAPE";
  }
  const summary = summarizeSyncBody(apiName, result.raw_body);
  return summary?.meaningful ? "PASS" : "PASS_NO_DATA";
}

function buildCheckItem(result) {
  return {
    name: result.name,
    route_or_method: result.route_or_method,
    expected_status: result.expected_status,
    actual_status: result.actual_status,
    classification: result.classification,
    elapsed_ms: result.elapsed_ms,
    evidence_summary: result.evidence_summary,
    next_action: result.next_action
  };
}

function summarizeForHumans(result) {
  if (result.classification === "PASS") return "200 + shape ok";
  if (result.classification === "PASS_NO_DATA") return "200 + no data payload";
  if (result.classification === "SKIPPED_BY_SAFETY") return REPORT_ROUTE_SKIP_REASON;
  if (result.error) return result.error;
  if (result.text) return result.text;
  if (result.body) return JSON.stringify(result.body).slice(0, 240);
  return "not_available";
}

function buildMarkdown(payload) {
  return [
    "# XD 关键 route 巡检结果",
    "",
    `生成时间：${payload.generated_at}`,
    `overall_status=${payload.overall_status}`,
    "",
    "| name | target | expected | actual | classification | elapsed_ms | next_action |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...payload.checks.map(
      (item) =>
        `| ${item.name} | ${item.route_or_method} | ${item.expected_status} | ${item.actual_status} | ${item.classification} | ${item.elapsed_ms} | ${item.next_action} |`
    ),
    ""
  ].join("\n");
}

export async function runCriticalRouteChecks(options = {}) {
  const dryRun = Boolean(options.dryRun);
  const timeoutMs = Number(options.timeoutMs || DEFAULT_TIMEOUT);
  const stage30 = readJson(STAGE30_EVIDENCE_PATH);
  const checks = [];

  const addDryRun = (name, target, expectedStatus, nextAction) => {
    checks.push(
      buildCheckItem({
        name,
        route_or_method: target,
        expected_status: expectedStatus,
        actual_status: "dry_run",
        classification: "SKIPPED_BY_SAFETY",
        elapsed_ms: 0,
        evidence_summary: "dry-run: 未执行 live 调用。",
        next_action: nextAction
      })
    );
  };

  if (dryRun) {
    [
      ["health", "/health"],
      ["auth-debug", "/integrations/alibaba/auth/debug"],
      ["xd-auth-debug", "/integrations/alibaba/xd/auth/debug"],
      ["orders-list", "/integrations/alibaba/xd/data/orders/list?page_size=1"],
      ["orders-detail", "/integrations/alibaba/xd/data/orders/detail?e_trade_id=<sample>"],
      ["products-list", "/integrations/alibaba/xd/data/products/list?page_size=1"],
      ["products-detail", "/integrations/alibaba/xd/data/products/detail?product_id=<sample>"],
      ["products-groups", "/integrations/alibaba/xd/data/products/groups?group_id=<sample>"],
      ["products-score", "/integrations/alibaba/xd/data/products/score?product_id=<sample>"],
      ["categories-tree", "/integrations/alibaba/xd/data/categories/tree?page_size=1"],
      ["media-list", "/integrations/alibaba/xd/data/media/list?page_size=1"],
      ["orders-summary-report", "/integrations/alibaba/xd/reports/orders/summary"],
      ["orders-trend-report", "/integrations/alibaba/xd/reports/orders/trend"],
      ["orders-report-consumers", "/integrations/alibaba/xd/reports/orders/report-consumers"],
      ["products-minimal-diagnostic", "/integrations/alibaba/xd/reports/products/minimal-diagnostic"],
      ["orders-minimal-diagnostic", "/integrations/alibaba/xd/reports/orders/minimal-diagnostic"],
      ["operations-minimal-diagnostic", "/integrations/alibaba/xd/reports/operations/minimal-diagnostic"],
      ["stable-direct", "alibaba.seller.order.get"]
    ].forEach(([name, target]) =>
      addDryRun(name, target, "200", name.startsWith("orders-") && target.includes("/reports/") ? "保持文件化报告替代方案。" : "按 stage31 监控流程执行 live 校验。")
    );
    return {
      generated_at: new Date().toISOString(),
      dry_run: true,
      overall_status: "PASS",
      checks
    };
  }

  const samples = await collectStableSamples(timeoutMs);
  const baseRouteSpecs = [
    { name: "health", path: "/health", expected: 200, keys: [] },
    { name: "auth-debug", path: "/integrations/alibaba/auth/debug", expected: 200, keys: [] },
    { name: "xd-auth-debug", path: "/integrations/alibaba/xd/auth/debug", expected: 200, keys: [] },
    {
      name: "orders-list",
      path: "/integrations/alibaba/xd/data/orders/list?page_size=1",
      expected: 200,
      keys: ["response_meta", "items"]
    },
    {
      name: "orders-detail",
      path: samples.tradeId ? `/integrations/alibaba/xd/data/orders/detail?e_trade_id=${encodeURIComponent(samples.tradeId)}` : null,
      expected: 200,
      keys: ["item"]
    },
    {
      name: "products-list",
      path: "/integrations/alibaba/xd/data/products/list?page_size=1",
      expected: 200,
      keys: ["response_meta", "items"]
    },
    {
      name: "products-detail",
      path: samples.productId
        ? `/integrations/alibaba/xd/data/products/detail?product_id=${encodeURIComponent(samples.productId)}`
        : null,
      expected: 200,
      keys: ["product"]
    },
    {
      name: "products-groups",
      path: samples.groupId
        ? `/integrations/alibaba/xd/data/products/groups?group_id=${encodeURIComponent(samples.groupId)}`
        : null,
      expected: 200,
      keys: ["product_group"]
    },
    {
      name: "products-score",
      path: samples.productId
        ? `/integrations/alibaba/xd/data/products/score?product_id=${encodeURIComponent(samples.productId)}`
        : null,
      expected: 200,
      keys: ["result"]
    },
    {
      name: "categories-tree",
      path: "/integrations/alibaba/xd/data/categories/tree?page_size=1",
      expected: 200,
      keys: ["category"]
    },
    {
      name: "media-list",
      path: "/integrations/alibaba/xd/data/media/list?page_size=1",
      expected: 200,
      keys: ["items"]
    },
    {
      name: "orders-summary-report",
      path: "/integrations/alibaba/xd/reports/orders/summary",
      expected: 200,
      keys: [],
      skipOn404: true
    },
    {
      name: "orders-trend-report",
      path: "/integrations/alibaba/xd/reports/orders/trend",
      expected: 200,
      keys: [],
      skipOn404: true
    },
    {
      name: "orders-report-consumers",
      path: "/integrations/alibaba/xd/reports/orders/report-consumers",
      expected: 200,
      keys: [],
      skipOn404: true
    },
    {
      name: "products-minimal-diagnostic",
      path: "/integrations/alibaba/xd/reports/products/minimal-diagnostic",
      expected: 200,
      keys: ["report_type"]
    },
    {
      name: "orders-minimal-diagnostic",
      path: "/integrations/alibaba/xd/reports/orders/minimal-diagnostic",
      expected: 200,
      keys: ["report_type"]
    },
    {
      name: "operations-minimal-diagnostic",
      path: "/integrations/alibaba/xd/reports/operations/minimal-diagnostic",
      expected: 200,
      keys: ["report_type"]
    }
  ];

  for (const spec of baseRouteSpecs) {
    if (!spec.path) {
      checks.push(
        buildCheckItem({
          name: spec.name,
          route_or_method: spec.name.includes("products") ? "sample id missing" : "sample trade missing",
          expected_status: String(spec.expected),
          actual_status: "not_executed",
          classification: "SKIPPED_BY_SAFETY",
          elapsed_ms: 0,
          evidence_summary: "当前缺稳定样本 ID；未执行此项。",
          next_action: "先恢复上游 stable list route 样本。"
        })
      );
      continue;
    }
    const result = await fetchRoute(spec.path, { timeoutMs });
    const classification = classifyRouteResult(result, {
      expectedKeys: spec.keys,
      skipOn404: spec.skipOn404
    });
    checks.push(
      buildCheckItem({
        name: spec.name,
        route_or_method: spec.path,
        expected_status: String(spec.expected),
        actual_status: result.status ?? result.error ?? "unknown",
        classification,
        elapsed_ms: result.elapsed_ms ?? 0,
        evidence_summary:
          classification === "SKIPPED_BY_SAFETY" ? REPORT_ROUTE_SKIP_REASON : summarizeForHumans(result),
        next_action:
          classification === "PASS" || classification === "PASS_NO_DATA"
            ? "保持每日巡检。"
            : classification === "SKIPPED_BY_SAFETY"
              ? "维持文件化报告替代，不在 stage31 回头扩 route。"
              : "检查 production route 与当前 token/runtime。"
      })
    );
  }

  let directResult = null;
  if (samples.tradeId) {
    try {
      const credentials = await getXdCredentials();
      directResult = await callSyncApi(credentials, "alibaba.seller.order.get", {
        e_trade_id: samples.tradeId
      });
      const classification = classifyDirectResult(directResult, "alibaba.seller.order.get");
      checks.push(
        buildCheckItem({
          name: "stable-direct",
          route_or_method: "alibaba.seller.order.get",
          expected_status: "200",
          actual_status: directResult.status ?? directResult.error ?? "unknown",
          classification,
          elapsed_ms: directResult.elapsed_ms ?? 0,
          evidence_summary:
            classification === "PASS" || classification === "PASS_NO_DATA"
              ? `sync 200，summary=${JSON.stringify(summarizeSyncBody("alibaba.seller.order.get", directResult.raw_body))}`
              : summarizeForHumans(directResult),
          next_action:
            classification === "PASS" || classification === "PASS_NO_DATA"
              ? "继续作为 sanity control。"
              : "检查 XD runtime token 与 stable trade sample。"
        })
      );
    } catch (error) {
      const fallback = stage30.sanity?.stable_direct || null;
      checks.push(
        buildCheckItem({
          name: "stable-direct",
          route_or_method: "alibaba.seller.order.get",
          expected_status: "200",
          actual_status: "credentials_unavailable",
          classification: fallback?.final_classification === "PASSED" ? "SKIPPED_BY_SAFETY" : "FAIL_AUTH",
          elapsed_ms: 0,
          evidence_summary:
            fallback?.final_classification === "PASSED"
              ? `local credentials unavailable; fallback stage30 stable_direct=${fallback.final_classification}`
              : String(error?.message || error).slice(0, 240),
          next_action:
            fallback?.final_classification === "PASSED"
              ? "当前先沿用 stage30 已验证 direct-method 证据，不在 stage31 额外解阻本地 token。"
              : "检查 Railway 变量与 XD refresh 链。"
        })
      );
    }
  }

  const failureCount = checks.filter((item) => item.classification.startsWith("FAIL")).length;
  const unknownCount = checks.filter((item) => item.classification === "UNKNOWN").length;
  const overallStatus =
    failureCount === 0 && unknownCount === 0
      ? "PASS"
      : checks.some((item) => item.name === "health" && item.classification.startsWith("FAIL"))
        ? "FAIL"
        : "DEGRADED";

  const payload = {
    generated_at: new Date().toISOString(),
    dry_run: false,
    overall_status: overallStatus,
    safe_scope_complete: stage30.safe_scope_complete,
    samples: {
      trade_id_present: Boolean(samples.tradeId),
      product_id_present: Boolean(samples.productId),
      group_id_present: Boolean(samples.groupId)
    },
    checks
  };
  const serialized = JSON.stringify(payload);
  if (scanForSensitiveValues(serialized)) {
    throw new Error("Sensitive value pattern detected in monitoring output.");
  }
  return payload;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const payload = await runCriticalRouteChecks({
    dryRun: Boolean(args["dry-run"]),
    timeoutMs: args.timeout
  });
  const stamp = nowStamp();
  const outputBase =
    args.output ||
    path.join(MONITORING_RUNS_DIR, `xd_critical_routes_stage31_${args["dry-run"] ? "dry_run" : stamp}`);
  const wantsJson = Boolean(args.json) || !args.markdown;
  const wantsMarkdown = Boolean(args.markdown) || !args.json;
  if (!args["dry-run"]) {
    if (wantsJson) writeJson(outputBase.endsWith(".json") ? outputBase : `${outputBase}.json`, payload);
    if (wantsMarkdown) writeText(outputBase.endsWith(".md") ? outputBase : `${outputBase}.md`, `${buildMarkdown(payload)}\n`);
  }
  console.log(JSON.stringify(payload, null, 2));
  return payload;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error?.stack || String(error));
    process.exitCode = 1;
  });
}
