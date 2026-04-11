import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..", "..");
const WIKA_DIR = path.join(ROOT_DIR, "WIKA");
const DOCS_DIR = path.join(WIKA_DIR, "docs", "framework");
const EVIDENCE_DIR = path.join(DOCS_DIR, "evidence");
const BASE_URL = "https://api.wikapacking.com";

const SUMMARY_PATH = path.join(
  EVIDENCE_DIR,
  "wika-stage26-doc-anchoring-summary.json"
);
const MATRIX_PATH = path.join(
  EVIDENCE_DIR,
  "wika-stage26-direct-candidate-matrix.json"
);
const DOC_PATH = path.join(
  DOCS_DIR,
  "WIKA_阶段26_剩余缺口官方文档定锚.md"
);

const ROUTES = {
  health: "/health",
  authDebug: "/integrations/alibaba/auth/debug",
  operationsManagementSummary: "/integrations/alibaba/wika/reports/operations/management-summary",
  productsManagementSummary: "/integrations/alibaba/wika/reports/products/management-summary",
  ordersManagementSummary: "/integrations/alibaba/wika/reports/orders/management-summary"
};

const DOC_CANDIDATES = {
  tradeDecode: {
    method: "alibaba.seller.trade.decode",
    doc_url:
      "https://open.alibaba.com/doc/api.htm#/api?path=alibaba.seller.trade.decode&methodType=GET/POST",
    intended_dimensions: ["country_structure"],
    direct_relevance: "weak",
    target_field_status: "文档页面 URL 可达，但当前仓内没有稳定字段说明摘录可证明直接返回国家结构",
    parameter_contract_status: "当前仓内没有稳定参数契约摘录，不能安全进入 runtime"
  },
  keywordDate: {
    method: "alibaba.mydata.self.keyword.date.get",
    doc_url:
      "https://open.alibaba.com/doc/api.htm#/api?path=alibaba.mydata.self.keyword.date.get&methodType=GET/POST",
    intended_dimensions: ["access_source"],
    direct_relevance: "weak",
    target_field_status: "更接近关键词时间窗口，不等于当前产品访问来源入口",
    parameter_contract_status: "当前仓内没有稳定参数契约摘录，不能安全进入 runtime"
  },
  keywordWeek: {
    method: "alibaba.mydata.self.keyword.effect.week.get",
    doc_url:
      "https://open.alibaba.com/doc/api.htm#/api?path=alibaba.mydata.self.keyword.effect.week.get&methodType=GET/POST",
    intended_dimensions: ["period_over_period_change"],
    direct_relevance: "weak",
    target_field_status: "更接近关键词周效果，不等于当前产品近周期变化的直接官方字段",
    parameter_contract_status: "当前仓内没有稳定参数契约摘录，不能安全进入 runtime"
  },
  keywordMonth: {
    method: "alibaba.mydata.self.keyword.effect.month.get",
    doc_url:
      "https://open.alibaba.com/doc/api.htm#/api?path=alibaba.mydata.self.keyword.effect.month.get&methodType=GET/POST",
    intended_dimensions: ["period_over_period_change"],
    direct_relevance: "weak",
    target_field_status: "更接近关键词月效果，不等于当前产品近周期变化的直接官方字段",
    parameter_contract_status: "当前仓内没有稳定参数契约摘录，不能安全进入 runtime"
  }
};

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeText(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, value, "utf8");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
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

async function probeDocUrl(candidate) {
  try {
    const response = await fetch(candidate.doc_url);
    return {
      method: candidate.method,
      doc_url: candidate.doc_url,
      doc_page_http_status: response.status,
      reachable: response.ok
    };
  } catch (error) {
    return {
      method: candidate.method,
      doc_url: candidate.doc_url,
      doc_page_http_status: "FETCH_ERROR",
      reachable: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function buildGapRecord(auditItem, options = {}) {
  return {
    target_dimension: auditItem.dimension,
    current_status: auditItem.classification,
    existing_route_coverage: auditItem.route_exposed
      ? "现有 live route 已显式暴露"
      : auditItem.unavailable_in_live_routes
        ? "现有 live route 显式列为 unavailable"
        : "现有 live route 未暴露",
    existing_helper_coverage: auditItem.helper_hidden
      ? "helper 或 route 内部提示存在相关字段，但 public 输出未暴露"
      : "当前 helper 未持有可安全暴露字段",
    existing_raw_response_coverage: auditItem.raw_response_present
      ? "current official raw response 已出现相关字段"
      : "current official raw response 未出现相关字段",
    official_doc_candidate_methods: options.candidates ?? [],
    candidate_strength: options.candidate_strength ?? "none",
    why_directly_relevant: options.why_directly_relevant,
    runtime_test_ready: options.runtime_test_ready ? "yes" : "no",
    why_not_ready: options.why_not_ready ?? null
  };
}

function buildMarkdown(summary, matrix) {
  const lines = [];

  lines.push("# WIKA 阶段 26 剩余缺口官方文档定锚");
  lines.push("");
  lines.push(`- 生成时间：${summary.generated_at}`);
  lines.push(`- 生产基线：${summary.base_url}`);
  lines.push("- 线程范围：WIKA-only");
  lines.push("- 本轮没有新增写动作，没有推进 XD。");
  lines.push("");
  lines.push("## stage24 / stage25 基线确认");
  lines.push("");
  for (const item of summary.baseline_routes) {
    lines.push(`- \`${item.route}\` -> \`${item.status}\``);
  }
  lines.push("");
  lines.push("## 剩余缺口 -> 候选方法映射");
  lines.push("");
  lines.push("| target_dimension | current_status | existing_route_coverage | existing_helper_coverage | existing_raw_response_coverage | candidate_strength | runtime_test_ready | why_not_ready |");
  lines.push("| --- | --- | --- | --- | --- | --- | --- | --- |");
  for (const item of matrix.dimension_matrix) {
    lines.push(
      `| \`${item.target_dimension}\` | \`${item.current_status}\` | ${item.existing_route_coverage} | ${item.existing_helper_coverage} | ${item.existing_raw_response_coverage} | \`${item.candidate_strength}\` | \`${item.runtime_test_ready}\` | ${item.why_not_ready ?? "-"} |`
    );
  }
  lines.push("");
  lines.push("## direct candidate 结论");
  lines.push("");
  if (matrix.direct_candidates.length === 0) {
    lines.push("- 本轮 direct candidate：无。");
    lines.push("- 原因：当前仓内与官方页面可达性复核后，没有候选同时满足“官方 URL + 目标字段说明 + 稳定参数契约 + 与当前缺口直接相关”这 4 个前置条件。");
  } else {
    for (const item of matrix.direct_candidates) {
      lines.push(`- \`${item.method}\``);
    }
  }
  lines.push("");
  lines.push("## 已定锚但不进入 runtime 的背景候选");
  lines.push("");
  for (const item of matrix.background_candidates) {
    lines.push(`### \`${item.method}\``);
    lines.push(`- doc_url: ${item.doc_url}`);
    lines.push(`- doc_page_http_status: \`${item.doc_page_http_status}\``);
    lines.push(`- intended_dimensions: ${item.intended_dimensions.join(" / ")}`);
    lines.push(`- direct_relevance: \`${item.direct_relevance}\``);
    lines.push(`- target_field_status: ${item.target_field_status}`);
    lines.push(`- parameter_contract_status: ${item.parameter_contract_status}`);
    lines.push("");
  }
  lines.push("## 本轮结论");
  lines.push("");
  lines.push("- 本轮主要完成官方文档定锚与验证前置包。");
  lines.push("- 本轮不进入 runtime 验证。");
  lines.push("- 本轮不扩 live routes。");
  lines.push("- 店铺级仍缺：`traffic_source / country_source / quick_reply_rate`。");
  lines.push("- 产品级仍缺：`access_source / inquiry_source / country_source / period_over_period_change`。");
  lines.push("- 订单级仍缺：`country_structure`。");
  lines.push("");
  lines.push("## 当前边界");
  lines.push("");
  lines.push("- not task 1 complete");
  lines.push("- not task 2 complete");
  lines.push("- no write action attempted");
  lines.push("- WIKA-only thread for business work");
  lines.push("- XD untouched in business execution");
  lines.push("- not full business cockpit");
  lines.push("");

  return `${lines.join("\n")}\n`;
}

async function run() {
  const stage25Summary = readJson(
    path.join(EVIDENCE_DIR, "wika-stage25-gap-compression-summary.json")
  );
  const stage25Audit = readJson(
    path.join(EVIDENCE_DIR, "wika-stage25-existing-field-exhaustion.json")
  );

  const baselineResponses = [];
  for (const route of Object.values(ROUTES)) {
    baselineResponses.push(await fetchJson(route));
  }

  for (const response of baselineResponses) {
    assert(response.status === 200, `baseline route failed: ${response.route}`);
    if (response.route !== "/health") {
      assert(response.is_json, `baseline route did not return JSON: ${response.route}`);
    }
  }

  const docProbeResults = [];
  for (const candidate of Object.values(DOC_CANDIDATES)) {
    docProbeResults.push(await probeDocUrl(candidate));
  }

  const storeAudits = stage25Summary.existing_field_exhaustion.store;
  const productAudits = stage25Summary.existing_field_exhaustion.product;
  const orderAudits = stage25Summary.existing_field_exhaustion.order;

  const dimensionMatrix = [
    buildGapRecord(storeAudits.find((item) => item.dimension === "traffic_source"), {
      candidates: [],
      candidate_strength: "none",
      why_directly_relevant: "当前仓内没有官方 direct candidate 能直接指向店铺 traffic_source",
      runtime_test_ready: false,
      why_not_ready: "未找到同时满足 doc URL、目标字段说明和参数契约的 direct candidate"
    }),
    buildGapRecord(storeAudits.find((item) => item.dimension === "country_source"), {
      candidates: [],
      candidate_strength: "none",
      why_directly_relevant: "当前仓内没有官方 direct candidate 能直接指向店铺 country_source",
      runtime_test_ready: false,
      why_not_ready: "未找到同时满足 doc URL、目标字段说明和参数契约的 direct candidate"
    }),
    buildGapRecord(storeAudits.find((item) => item.dimension === "quick_reply_rate"), {
      candidates: [],
      candidate_strength: "none",
      why_directly_relevant: "当前仓内没有官方 direct candidate 能直接指向店铺 quick_reply_rate",
      runtime_test_ready: false,
      why_not_ready: "未找到同时满足 doc URL、目标字段说明和参数契约的 direct candidate"
    }),
    buildGapRecord(productAudits.find((item) => item.dimension === "access_source"), {
      candidates: [DOC_CANDIDATES.keywordDate.method],
      candidate_strength: "weak",
      why_directly_relevant: "现有 doc-found 里只有关键词时间窗口与 access_source 边界勉强相邻，但并不直达当前产品访问来源",
      runtime_test_ready: false,
      why_not_ready: "候选更偏关键词窗口，不具备当前产品 access_source 的直接字段说明和稳定参数契约"
    }),
    buildGapRecord(productAudits.find((item) => item.dimension === "inquiry_source"), {
      candidates: [],
      candidate_strength: "none",
      why_directly_relevant: "当前仓内没有官方 direct candidate 能直接指向产品 inquiry_source",
      runtime_test_ready: false,
      why_not_ready: "未找到直接相关的官方文档方法"
    }),
    buildGapRecord(productAudits.find((item) => item.dimension === "country_source"), {
      candidates: [],
      candidate_strength: "none",
      why_directly_relevant: "当前仓内没有官方 direct candidate 能直接指向产品 country_source",
      runtime_test_ready: false,
      why_not_ready: "未找到直接相关的官方文档方法"
    }),
    buildGapRecord(productAudits.find((item) => item.dimension === "period_over_period_change"), {
      candidates: [DOC_CANDIDATES.keywordWeek.method, DOC_CANDIDATES.keywordMonth.method],
      candidate_strength: "weak",
      why_directly_relevant: "关键词周/月效果方法与“变化”语义接近，但不是当前产品 period_over_period_change 的直接字段入口",
      runtime_test_ready: false,
      why_not_ready: "当前只有关键词效果方向的 doc-found 记录，缺少产品级变化字段的直接说明与稳定参数契约"
    }),
    buildGapRecord(orderAudits.find((item) => item.dimension === "country_structure"), {
      candidates: [DOC_CANDIDATES.tradeDecode.method],
      candidate_strength: "weak",
      why_directly_relevant: "trade.decode 只可能帮助 identifier contract，对国家结构不是直接报表入口",
      runtime_test_ready: false,
      why_not_ready: "当前只拿到文档页面 URL，可证明候选存在，但不能证明它直接返回国家结构或具有安全可测契约"
    })
  ];

  const backgroundCandidates = Object.values(DOC_CANDIDATES).map((candidate) => ({
    ...candidate,
    ...docProbeResults.find((item) => item.method === candidate.method)
  }));

  const summary = {
    stage: "stage26_doc_anchoring_and_validation_preflight",
    generated_at: new Date().toISOString(),
    base_url: BASE_URL,
    stage25_pushed_commit: "c4e8848b89eeb71dad04899342c63b1ccf0436ed",
    baseline_routes: baselineResponses.map((item) => ({
      route: item.route,
      status: item.status,
      is_json: item.is_json
    })),
    remaining_gap_summary: {
      store: ["traffic_source", "country_source", "quick_reply_rate"],
      product: [
        "access_source",
        "inquiry_source",
        "country_source",
        "period_over_period_change"
      ],
      order: ["country_structure"]
    },
    direct_candidates: [],
    runtime_candidates_ready: [],
    runtime_performed: false,
    runtime_skip_reason:
      "当前 direct candidate 为空；现有 doc-found 候选虽可补到 doc_url，但仍缺目标字段说明与稳定参数契约，不满足 runtime 前置条件。",
    live_routes_expanded: false,
    stage25_existing_summary_reference: {
      summary_file: "WIKA/docs/framework/evidence/wika-stage25-gap-compression-summary.json",
      audit_file: "WIKA/docs/framework/evidence/wika-stage25-existing-field-exhaustion.json"
    },
    boundary_statement: {
      not_task_1_complete: true,
      not_task_2_complete: true,
      no_write_action_attempted: true,
      wika_only_thread_for_business_work: true,
      xd_untouched_in_business_execution: true,
      not_full_business_cockpit: true
    }
  };

  const matrix = {
    dimension_matrix: dimensionMatrix,
    direct_candidates: [],
    background_candidates: backgroundCandidates,
    official_doc_anchor_complete_for_runtime: false,
    runtime_candidates_ready: []
  };

  writeJson(SUMMARY_PATH, summary);
  writeJson(MATRIX_PATH, matrix);
  writeText(DOC_PATH, buildMarkdown(summary, matrix));

  console.log(JSON.stringify({ summary, matrix }, null, 2));
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
