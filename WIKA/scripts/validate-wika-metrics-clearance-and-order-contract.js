import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FRAMEWORK_DIR = path.join(ROOT_DIR, "docs", "framework");
const EVIDENCE_DIR = path.join(FRAMEWORK_DIR, "evidence");

const STAGE17_SUMMARY_PATH = path.join(
  EVIDENCE_DIR,
  "wika-metrics-candidates-summary.json"
);
const STAGE18_SUMMARY_PATH = path.join(
  EVIDENCE_DIR,
  "wika-metrics-clearance-and-order-contract-summary.json"
);
const ORDER_TREND_SAMPLE_PATH = path.join(
  EVIDENCE_DIR,
  "wika-order-trend-partial-derived-sample.json"
);
const CLEARANCE_DOC_PATH = path.join(
  FRAMEWORK_DIR,
  "WIKA_经营数据权限清障包.md"
);
const ORDER_CONTRACT_DOC_PATH = path.join(
  FRAMEWORK_DIR,
  "WIKA_订单参数契约对账.md"
);
const CANDIDATE_DOC_PATH = path.join(
  FRAMEWORK_DIR,
  "WIKA_经营数据候选接口验证.md"
);
const FIELD_MATRIX_DOC_PATH = path.join(
  FRAMEWORK_DIR,
  "WIKA_经营数据字段覆盖矩阵.md"
);

const ORDER_ROUTE_DEFINITIONS = Object.freeze([
  {
    route_name: "/integrations/alibaba/wika/data/orders/list",
    downstream_method: "alibaba.seller.order.list",
    source_file: "shared/data/modules/alibaba-official-orders.js",
    route_file: "app.js",
    expected_params: [
      "role",
      "start_page",
      "page_size",
      "status",
      "sales_man_login_id"
    ],
    identifier_shape: "N/A; list returns masked trade_id in current tenant",
    identifier_source: "response_meta + items[].trade_id",
    stage17_validation_input:
      "param_trade_ecology_order_list_query.role/start_page/page_size; recent_window also tried create_date_start/create_date_end",
    mismatch_finding: "SCRIPT_PARAM_NAME_MISMATCH",
    current_conclusion: "READ_ONLY_ROUTE_CONFIRMED_WORKING",
    next_action:
      "Keep list as confirmed working readonly route; if date-window contract is needed later, reopen only with explicit official parameter evidence."
  },
  {
    route_name: "/integrations/alibaba/wika/data/orders/detail",
    downstream_method: "alibaba.seller.order.get",
    source_file: "shared/data/modules/alibaba-official-orders.js",
    route_file: "app.js",
    expected_params: ["e_trade_id"],
    identifier_shape:
      "Unmasked reusable e_trade_id expected; current public list only exposes masked trade_id",
    identifier_source: "External query param only; no internal remapping in current route",
    stage17_validation_input:
      "e_trade_id sourced from stage-17 order.list items[].trade_id (masked values like 21***54)",
    mismatch_finding: "SCRIPT_ID_SOURCE_MISMATCH",
    current_conclusion: "MASKED_TRADE_ID_NOT_REUSABLE",
    next_action:
      "Do not hard-fix route. Reopen only after proving a reusable unmasked order identifier source inside current readonly chain or after official contract clarification."
  },
  {
    route_name: "/integrations/alibaba/wika/data/orders/fund",
    downstream_method: "alibaba.seller.order.fund.get",
    source_file: "shared/data/modules/alibaba-official-extensions.js",
    route_file: "app.js",
    expected_params: ["e_trade_id", "data_select"],
    identifier_shape:
      "Unmasked reusable e_trade_id expected; current public list only exposes masked trade_id",
    identifier_source: "External query param only; no internal remapping in current route",
    stage17_validation_input:
      "e_trade_id sourced from stage-17 order.list items[].trade_id + data_select=fund_serviceFee,fund_fundPay,fund_refund",
    mismatch_finding: "SCRIPT_ID_SOURCE_MISMATCH",
    current_conclusion: "MASKED_TRADE_ID_NOT_REUSABLE",
    next_action:
      "Hold current route as contract-unresolved for public chaining. Reopen only after a reusable order identifier source is evidenced."
  },
  {
    route_name: "/integrations/alibaba/wika/data/orders/logistics",
    downstream_method: "alibaba.seller.order.logistics.get",
    source_file: "shared/data/modules/alibaba-official-extensions.js",
    route_file: "app.js",
    expected_params: ["e_trade_id", "data_select"],
    identifier_shape:
      "Unmasked reusable e_trade_id expected; current public list only exposes masked trade_id",
    identifier_source: "External query param only; no internal remapping in current route",
    stage17_validation_input:
      "e_trade_id sourced from stage-17 order.list items[].trade_id + data_select=logistic_order",
    mismatch_finding: "SCRIPT_ID_SOURCE_MISMATCH",
    current_conclusion: "MASKED_TRADE_ID_NOT_REUSABLE",
    next_action:
      "Hold current route as contract-unresolved for public chaining. Reopen only after a reusable order identifier source is evidenced."
  }
]);

const MYDATA_METHODS = Object.freeze([
  {
    api_name: "alibaba.mydata.overview.date.get",
    intended_business_use: "店铺级经营日期窗口发现，给后续 overview 指标查询提供真实可用日期范围",
    target_fields: ["start_date", "end_date"],
    affected_tasks: ["任务1", "任务2"],
    why_it_matters:
      "没有 date range，就无法对店铺级 visitor/imps/click/fb/reply 口径做稳定调用与复验。",
    permission_ask:
      "Please grant the current WIKA app tenant access to alibaba.mydata.overview.date.get for the current ICBU seller account so we can discover valid overview date windows in production.",
    access_granted_evidence:
      "真实返回 start_date / end_date 范围，且不再出现 InsufficientPermission。",
    reopen_after_grant: [
      "/integrations/alibaba/wika/data/store/overview-basic",
      "/integrations/alibaba/wika/reports/operations/minimal-diagnostic"
    ]
  },
  {
    api_name: "alibaba.mydata.overview.industry.get",
    intended_business_use: "店铺级行业/主营维度发现，给 overview 指标查询提供真实 industry context",
    target_fields: ["industry_id", "industry_desc", "main_category"],
    affected_tasks: ["任务1", "任务2"],
    why_it_matters:
      "没有 industry 维度，就无法稳定构造店铺级 overview 指标查询的真实业务参数。",
    permission_ask:
      "Please grant the current WIKA app tenant access to alibaba.mydata.overview.industry.get for the current ICBU seller account so we can discover valid industry context in production.",
    access_granted_evidence:
      "真实返回 industry_id / industry_desc / main_category，且不再出现 InsufficientPermission。",
    reopen_after_grant: [
      "/integrations/alibaba/wika/data/store/overview-basic",
      "/integrations/alibaba/wika/reports/operations/minimal-diagnostic"
    ]
  },
  {
    api_name: "alibaba.mydata.overview.indicator.basic.get",
    intended_business_use: "店铺级经营基础指标读取",
    target_fields: ["visitor", "imps", "clk", "clk_rate", "fb", "reply"],
    affected_tasks: ["任务1", "任务2"],
    why_it_matters:
      "这是当前最直接的店铺级 UV / 曝光 / 点击 / 询盘 / 回复相关公开候选入口；若无权限，任务 1/2 无法获得店铺级经营指标。",
    permission_ask:
      "Please grant the current WIKA app tenant access to alibaba.mydata.overview.indicator.basic.get for the current ICBU seller account so we can read store-level visitor / imps / click / feedback / reply metrics in production.",
    access_granted_evidence:
      "真实返回 visitor / imps / clk / clk_rate / fb / reply 任一字段，且不再出现 InsufficientPermission。",
    reopen_after_grant: [
      "/integrations/alibaba/wika/data/store/overview-basic",
      "/integrations/alibaba/wika/reports/operations/minimal-diagnostic"
    ]
  },
  {
    api_name: "alibaba.mydata.self.product.date.get",
    intended_business_use: "产品级表现日期窗口发现，给 self.product 指标查询提供真实统计周期",
    target_fields: ["start_date", "end_date"],
    affected_tasks: ["任务1", "任务2"],
    why_it_matters:
      "没有产品级 date range，就无法稳定调用曝光、点击、访客、询盘等产品表现指标。",
    permission_ask:
      "Please grant the current WIKA app tenant access to alibaba.mydata.self.product.date.get for the current ICBU seller account so we can discover valid product-performance date windows in production.",
    access_granted_evidence:
      "真实返回 start_date / end_date 范围，且不再出现 InsufficientPermission。",
    reopen_after_grant: [
      "/integrations/alibaba/wika/data/products/performance-by-date",
      "/integrations/alibaba/wika/reports/products/minimal-diagnostic"
    ]
  },
  {
    api_name: "alibaba.mydata.self.product.get",
    intended_business_use: "产品级表现指标读取",
    target_fields: [
      "click",
      "impression",
      "visitor",
      "fb",
      "order",
      "bookmark",
      "compare",
      "share",
      "keyword_effects"
    ],
    affected_tasks: ["任务1", "任务2"],
    why_it_matters:
      "这是当前最直接的产品级曝光、点击、访客、询盘、关键词效果公开候选入口；若无权限，任务 1/2 无法获得产品表现层。",
    permission_ask:
      "Please grant the current WIKA app tenant access to alibaba.mydata.self.product.get for the current ICBU seller account so we can read product-level performance metrics in production.",
    access_granted_evidence:
      "真实返回 click / impression / visitor / fb / order / bookmark / compare / share / keyword_effects 任一字段，且不再出现 InsufficientPermission。",
    reopen_after_grant: [
      "/integrations/alibaba/wika/data/products/performance",
      "/integrations/alibaba/wika/reports/products/minimal-diagnostic"
    ]
  }
]);

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeText(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, value, "utf8");
}

function findMethodResult(stage17Summary, apiName) {
  const fromFlatList =
    stage17Summary.method_results.find((item) => item.api_name === apiName) ?? null;
  if (fromFlatList) {
    return fromFlatList;
  }

  return (
    stage17Summary.store_level?.methods?.[apiName] ??
    stage17Summary.product_level?.methods?.[apiName] ??
    stage17Summary.order_level?.methods?.[apiName] ??
    null
  );
}

function findLineNumber(text, needle) {
  const lines = text.split(/\r?\n/u);
  const index = lines.findIndex((line) => line.includes(needle));
  return index >= 0 ? index + 1 : null;
}

function findLineNumberAfter(text, needle, afterLine = 0) {
  const lines = text.split(/\r?\n/u);
  const index = lines.findIndex(
    (line, lineIndex) => lineIndex + 1 > afterLine && line.includes(needle)
  );
  return index >= 0 ? index + 1 : null;
}

function buildMydataClearance(stage17Summary) {
  return MYDATA_METHODS.map((definition) => {
    const methodResult = findMethodResult(stage17Summary, definition.api_name);
    const bestAttempt = methodResult?.best_attempt ?? null;
    const errorResponse = bestAttempt?.error_response ?? null;
    return {
      official_method_name: definition.api_name,
      intended_business_use: definition.intended_business_use,
      target_fields: definition.target_fields,
      stage17_observed_result: bestAttempt?.classification ?? "AUTH_BLOCKED",
      observed_error_code: errorResponse?.code ?? null,
      observed_error_message:
        errorResponse?.msg ?? errorResponse?.sub_msg ?? "InsufficientPermission",
      current_classification: "AUTH_BLOCKED",
      affected_tasks: definition.affected_tasks,
      why_this_method_matters: definition.why_it_matters,
      minimal_permission_scope_ask_wording: definition.permission_ask,
      evidence_of_access_granted: definition.access_granted_evidence,
      route_or_report_to_reopen_after_access: definition.reopen_after_grant,
      evidence_file: methodResult?.evidence_file_name ?? null,
      status_after_pack: "ACCESS_REOPEN_READY"
    };
  });
}

function buildFieldCoverageIncrement() {
  return {
    public_official_entry_exists_but_auth_blocked: {
      store_level: [
        "UV(visitor)",
        "PV/imps",
        "点击(clk)",
        "CTR(clk_rate)",
        "询盘表现(fb)",
        "响应相关(reply)"
      ],
      product_level: [
        "曝光(impression)",
        "点击(click)",
        "访客(visitor)",
        "询盘(fb)",
        "订单(order)",
        "bookmark",
        "compare",
        "share",
        "关键词来源(keyword_effects)"
      ]
    },
    not_found_in_current_response_or_not_yet_evidenced: {
      store_level: ["流量来源", "国家来源", "快速回复率"],
      product_level: ["访问来源", "询盘来源", "国家来源", "近周期变化"],
      order_level: ["正式汇总", "国家结构", "产品贡献"]
    },
    only_derivable_from_existing_order_apis: {
      order_level: ["订单趋势（仅基于 order.list.create_date）"]
    }
  };
}

function normalizeDateLabel(formatDate) {
  if (!formatDate) {
    return null;
  }

  const raw = String(formatDate);
  const matched = raw.match(/^([A-Z][a-z]{2})\.\s(\d{1,2}),\s(\d{4})/u);
  if (!matched) {
    return raw;
  }

  const monthMap = {
    Jan: "01",
    Feb: "02",
    Mar: "03",
    Apr: "04",
    May: "05",
    Jun: "06",
    Jul: "07",
    Aug: "08",
    Sep: "09",
    Oct: "10",
    Nov: "11",
    Dec: "12"
  };

  const month = monthMap[matched[1]];
  const day = String(matched[2]).padStart(2, "0");
  if (!month) {
    return raw;
  }

  return `${matched[3]}-${month}-${day}`;
}

function buildOrderTrendPartialSample(stage17Summary) {
  const orderList = findMethodResult(stage17Summary, "alibaba.seller.order.list");
  const items = orderList?.real_extracted?.[0]?.items ?? [];
  const trendMap = new Map();
  for (const item of items) {
    const label = normalizeDateLabel(item?.create_date?.format_date);
    if (!label) {
      continue;
    }
    trendMap.set(label, (trendMap.get(label) ?? 0) + 1);
  }
  const trend = [...trendMap.entries()].map(([date_label, order_count]) => ({
    date_label,
    order_count
  }));
  return {
    signal_type: "partial_derived_signal",
    derived_from: "alibaba.seller.order.list.create_date",
    statement:
      "当前仅证明订单创建量趋势可由现有官方交易 list 接口部分派生，不能扩写成完整订单经营汇总。",
    sample_size: items.length,
    trend
  };
}

function buildOrderContractAudit(stage17Summary) {
  const ordersSource = fs.readFileSync(
    path.join(ROOT_DIR, "shared", "data", "modules", "alibaba-official-orders.js"),
    "utf8"
  );
  const extensionsSource = fs.readFileSync(
    path.join(
      ROOT_DIR,
      "shared",
      "data",
      "modules",
      "alibaba-official-extensions.js"
    ),
    "utf8"
  );
  const appSource = fs.readFileSync(path.join(ROOT_DIR, "app.js"), "utf8");
  const stage17ScriptSource = fs.readFileSync(
    path.join(ROOT_DIR, "scripts", "validate-wika-metrics-candidates.js"),
    "utf8"
  );

  return ORDER_ROUTE_DEFINITIONS.map((definition) => {
    const sourceText =
      definition.source_file.includes("extensions") ? extensionsSource : ordersSource;
    const methodLine = findLineNumber(
      sourceText,
      `apiName: "${definition.downstream_method}"`
    );
    const identifierLine =
      definition.expected_params.includes("e_trade_id")
        ? findLineNumberAfter(
            sourceText,
            "const tradeId = String(query.e_trade_id ?? \"\").trim();",
            methodLine ?? 0
          )
        : findLineNumber(sourceText, "param_trade_ecology_order_list_query:");
    const routeLine = findLineNumber(appSource, definition.route_name);
    const stage17InputLine =
      definition.route_name === "/integrations/alibaba/wika/data/orders/list"
        ? findLineNumber(stage17ScriptSource, "create_date_start:")
        : findLineNumber(stage17ScriptSource, "e_trade_id: tradeId");
    const methodResult = findMethodResult(stage17Summary, definition.downstream_method);
    return {
      route_name: definition.route_name,
      downstream_alibaba_method: definition.downstream_method,
      expected_params: definition.expected_params,
      identifier_shape: definition.identifier_shape,
      identifier_source: definition.identifier_source,
      source_file: definition.source_file,
      route_file: definition.route_file,
      source_line_hints: {
        route_line: routeLine,
        method_line: methodLine,
        identifier_line: identifierLine,
        stage17_input_line: stage17InputLine
      },
      stage17_validation_input: definition.stage17_validation_input,
      mismatch_finding: definition.mismatch_finding,
      current_conclusion: definition.current_conclusion,
      next_action: definition.next_action,
      stage17_best_attempt: methodResult?.best_attempt?.attempt_name ?? null,
      stage17_error: methodResult?.best_attempt?.error_response ?? null
    };
  });
}

function buildClearanceMarkdown(clearanceItems) {
  const lines = [
    "# WIKA_经营数据权限清障包",
    "",
    "更新时间：2026-04-05",
    "",
    "本包只用于对外说明当前 `mydata` 权限阻塞现状、最小权限申请口径，以及 access grant 之后应如何复验。",
    "",
    "## 当前总论",
    "",
    "- 本轮没有新增任何 Alibaba API 验证，只复用阶段 17 现有 evidence 做权限清障收口。",
    "- 当前 5 个 `mydata` 相关官方方法在当前 `WIKA` tenant 下统一落到 `AUTH_BLOCKED`。",
    "- 当前可直接对外输出的结论不是“接口不存在”，而是“公开官方方法存在，但当前租户无访问权限”。",
    "- 当前清障包状态：`ACCESS_REOPEN_READY`。",
    ""
  ];

  for (const item of clearanceItems) {
    lines.push(`## ${item.official_method_name}`);
    lines.push("");
    lines.push(`1. official method name: \`${item.official_method_name}\``);
    lines.push(`2. intended business use: ${item.intended_business_use}`);
    lines.push(`3. target fields: ${item.target_fields.map((field) => `\`${field}\``).join("、")}`);
    lines.push(`4. stage-17 observed result: \`${item.stage17_observed_result}\``);
    lines.push(
      `5. observed error code / message: \`${item.observed_error_code ?? "-"} / ${item.observed_error_message}\``
    );
    lines.push(`6. current classification: \`${item.current_classification}\``);
    lines.push(`7. affected tasks: ${item.affected_tasks.join("、")}`);
    lines.push(`8. why this method matters to WIKA: ${item.why_this_method_matters}`);
    lines.push(
      `9. minimal permission/scope ask wording: ${item.minimal_permission_scope_ask_wording}`
    );
    lines.push(
      `10. what evidence would count as “access granted”: ${item.evidence_of_access_granted}`
    );
    lines.push(
      `11. what route/report would be reopened after access grant: ${item.route_or_report_to_reopen_after_access
        .map((value) => `\`${value}\``)
        .join("、")}`
    );
    lines.push(
      `- evidence file: \`WIKA/docs/framework/evidence/${item.evidence_file}\``
    );
    lines.push("");
  }

  lines.push("## 边界说明");
  lines.push("");
  lines.push("- 本清障包不是“权限已解决”，只是一份可直接对外申请的权限阻塞说明。");
  lines.push("- 当前不是 task 1 complete，也不是 task 2 complete。");
  lines.push("- 当前没有推进任何平台内写动作，也没有形成平台内闭环。");
  return `${lines.join("\n")}\n`;
}

function buildOrderContractMarkdown(orderContractItems, trendSample) {
  const lines = [
    "# WIKA_订单参数契约对账",
    "",
    "更新时间：2026-04-05",
    "",
    "本文件只收口两件事：",
    "- 当前 `orders/list` 为什么能给出真实数据",
    "- 为什么阶段 17 里 `order.get / fund.get / logistics.get` 在 public list trade_id 链上统一落到参数拒绝",
    "",
    "## 当前总论",
    "",
    "- 本轮没有新增任何 Alibaba API 验证，只围绕阶段 17 已验证方法做复核与对账。",
    "- 当前可以确认：`/orders/list` 是当前唯一稳定成立的只读订单入口。",
    "- 当前也可以确认：阶段 17 所使用的 `items[].trade_id` 是遮罩值，不能直接当作 `e_trade_id` 复用到 detail / fund / logistics。",
    "- 当前仍不能确认现有 public 只读链路中存在可复用的未遮罩订单 identifier。",
    "",
    "## 参数契约矩阵",
    "",
    "| route name | downstream Alibaba method | expected params | identifier shape | identifier source | stage-17 validation input | mismatch finding | current conclusion | next action |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- |"
  ];

  for (const item of orderContractItems) {
    lines.push(
      `| ${item.route_name} | ${item.downstream_alibaba_method} | ${item.expected_params.join(", ")} | ${item.identifier_shape} | ${item.identifier_source} | ${item.stage17_validation_input} | ${item.mismatch_finding} | ${item.current_conclusion} | ${item.next_action} |`
    );
  }

  lines.push("", "## 逐路由对账结论", "");
  for (const item of orderContractItems) {
    lines.push(`### ${item.route_name}`);
    lines.push(`- downstream method: \`${item.downstream_alibaba_method}\``);
    lines.push(`- expected params: ${item.expected_params.map((value) => `\`${value}\``).join("、")}`);
    lines.push(`- identifier shape: ${item.identifier_shape}`);
    lines.push(`- identifier source: ${item.identifier_source}`);
    lines.push(`- stage-17 mismatch finding: \`${item.mismatch_finding}\``);
    lines.push(`- current conclusion: \`${item.current_conclusion}\``);
    lines.push(`- next action: ${item.next_action}`);
    lines.push(
      `- source line hints: route ${item.source_file.includes("extensions") ? item.route_file : item.route_file}:${
        item.source_line_hints.route_line ?? "-"
      }, method ${item.source_file}:${item.source_line_hints.method_line ?? "-"}, identifier ${item.source_file}:${item.source_line_hints.identifier_line ?? "-"}`
    );
    if (item.stage17_error) {
      lines.push(
        `- stage-17 observed error: \`${JSON.stringify(item.stage17_error)}\``
      );
    }
    lines.push("");
  }

  lines.push("## 现有正式只读路由为什么曾被标为“已上线能力”", "");
  lines.push("- 当前可确认的是：这些 route 已经注册、可接受 query、并沿 production `/sync` 主线调用官方 method。");
  lines.push("- 但 stage 18 对账后需要补一层边界：route existence 不等于当前 public 上游 identifier 契约已闭合。");
  lines.push("- 因此本轮之后，对 `/orders/detail`、`/orders/fund`、`/orders/logistics` 的更准确口径应是：");
  lines.push("  当前 route 已存在，但在仅依赖 `order.list` 返回的遮罩 `trade_id` 时，public chaining 仍未闭合。");
  lines.push("");
  lines.push("## 最小订单趋势派生证明", "");
  lines.push(`- signal_type: \`${trendSample.signal_type}\``);
  lines.push(`- derived_from: \`${trendSample.derived_from}\``);
  lines.push(`- statement: ${trendSample.statement}`);
  lines.push(`- sample_size: ${trendSample.sample_size}`);
  lines.push(`- evidence file: \`WIKA/docs/framework/evidence/${path.basename(ORDER_TREND_SAMPLE_PATH)}\``);
  lines.push(
    `- trend sample: \`${JSON.stringify(trendSample.trend.slice(0, 8))}\``
  );
  lines.push("");
  lines.push("## 边界说明", "");
  lines.push("- 当前不是 task 1 complete，也不是 task 2 complete。");
  lines.push("- 当前没有新增任何平台内写动作。");
  lines.push("- 当前不是平台内闭环，只是在收口参数契约歧义。");
  return `${lines.join("\n")}\n`;
}

function buildCandidateValidationMarkdown(stage17Summary, clearanceItems, orderContractItems) {
  const lines = [
    "# WIKA_经营数据候选接口验证",
    "",
    `- evaluated_at: ${new Date().toISOString()}`,
    "- route_line: Railway production -> /sync + access_token + sha256",
    "- scope: candidate validation + clearance packaging only",
    "",
    "## 阶段 17 原始分类结果",
    "",
    "| 方法 | 范围 | 最终分类 | 最佳尝试 | 证据文件 |",
    "| --- | --- | --- | --- | --- |"
  ];

  const seenApiNames = new Set();
  const orderedMethodResults = [
    ...stage17Summary.method_results,
    ...Object.values(stage17Summary.order_level?.methods ?? {}).filter(
      (item) => !stage17Summary.method_results.some((flat) => flat.api_name === item.api_name)
    )
  ];

  for (const method of orderedMethodResults) {
    if (seenApiNames.has(method.api_name)) {
      continue;
    }
    seenApiNames.add(method.api_name);
    const scope =
      method.scope ??
      (method.api_name.includes(".overview.")
        ? "store"
        : method.api_name.includes(".self.product")
          ? "product"
          : method.api_name.includes(".seller.order")
            ? "order"
            : "-");
    lines.push(
      `| ${method.api_name} | ${scope} | ${method.final_category} | ${method.best_attempt?.attempt_name ?? "-"} | ${method.evidence_file_name ?? "-"} |`
    );
  }

  lines.push("", "## 阶段 18 收口结论", "");
  lines.push("### `mydata` 权限清障");
  for (const item of clearanceItems) {
    lines.push(
      `- \`${item.official_method_name}\` -> \`${item.current_classification}\`，当前清障包状态 \`${item.status_after_pack}\``
    );
  }
  lines.push("");
  lines.push("### 订单参数契约");
  for (const item of orderContractItems) {
    lines.push(
      `- \`${item.route_name}\` -> mismatch=\`${item.mismatch_finding}\` / conclusion=\`${item.current_conclusion}\``
    );
  }
  lines.push("");
  lines.push("## 边界说明", "");
  lines.push("- 本轮没有新增任何 Alibaba API 验证。");
  lines.push("- 本轮没有推进平台内回复、平台内创单、真实通知外发。");
  lines.push("- 本轮只是在收口 `mydata` 权限清障与订单参数契约对账。");
  lines.push("- 当前边界仍然不是 task 1 complete，不是 task 2 complete，不是平台内闭环。");
  return `${lines.join("\n")}\n`;
}

function buildFieldCoverageMarkdown(increment) {
  const rows = [];
  const pushGroup = (bucketName, dimension, fields) => {
    for (const field of fields) {
      rows.push({
        bucket: bucketName,
        dimension,
        field
      });
    }
  };

  pushGroup(
    "public official entry exists but AUTH_BLOCKED in current tenant",
    "店铺级",
    increment.public_official_entry_exists_but_auth_blocked.store_level
  );
  pushGroup(
    "public official entry exists but AUTH_BLOCKED in current tenant",
    "产品级",
    increment.public_official_entry_exists_but_auth_blocked.product_level
  );
  pushGroup(
    "not found in current response / not yet evidenced",
    "店铺级",
    increment.not_found_in_current_response_or_not_yet_evidenced.store_level
  );
  pushGroup(
    "not found in current response / not yet evidenced",
    "产品级",
    increment.not_found_in_current_response_or_not_yet_evidenced.product_level
  );
  pushGroup(
    "not found in current response / not yet evidenced",
    "订单级",
    increment.not_found_in_current_response_or_not_yet_evidenced.order_level
  );
  pushGroup(
    "only derivable from existing order APIs",
    "订单级",
    increment.only_derivable_from_existing_order_apis.order_level
  );

  const lines = [
    "# WIKA_经营数据字段覆盖矩阵",
    "",
    "| 分类桶 | 维度 | 目标字段 |",
    "| --- | --- | --- |"
  ];

  for (const row of rows) {
    lines.push(`| ${row.bucket} | ${row.dimension} | ${row.field} |`);
  }

  lines.push("", "## 边界说明", "");
  lines.push("- 本轮没有新增任何 Alibaba API 验证。");
  lines.push("- `AUTH_BLOCKED` 只表示公开官方入口存在，但当前 tenant 没有权限。");
  lines.push("- `only derivable from existing order APIs` 当前只证明到订单趋势，不等于完整订单经营汇总。");
  return `${lines.join("\n")}\n`;
}

function main() {
  const stage17Summary = readJson(STAGE17_SUMMARY_PATH);
  const mydataClearance = buildMydataClearance(stage17Summary);
  const orderContractAudit = buildOrderContractAudit(stage17Summary);
  const fieldCoverageIncrement = buildFieldCoverageIncrement();
  const orderTrendPartialSample = buildOrderTrendPartialSample(stage17Summary);

  const summary = {
    evaluated_at: new Date().toISOString(),
    stage_scope: "stage18_clearance_and_order_contract_audit",
    stage17_summary_source: path.relative(ROOT_DIR, STAGE17_SUMMARY_PATH),
    no_new_alibaba_api_validation: true,
    no_write_action_attempted: true,
    mydata_clearance: mydataClearance,
    order_contract_audit: orderContractAudit,
    safe_readonly_param_fix_found: false,
    safe_readonly_param_fix_applied: false,
    partial_derived_signal: orderTrendPartialSample,
    field_coverage_increment: fieldCoverageIncrement
  };

  writeJson(STAGE18_SUMMARY_PATH, summary);
  writeJson(ORDER_TREND_SAMPLE_PATH, orderTrendPartialSample);
  writeText(CLEARANCE_DOC_PATH, buildClearanceMarkdown(mydataClearance));
  writeText(
    ORDER_CONTRACT_DOC_PATH,
    buildOrderContractMarkdown(orderContractAudit, orderTrendPartialSample)
  );
  writeText(
    CANDIDATE_DOC_PATH,
    buildCandidateValidationMarkdown(stage17Summary, mydataClearance, orderContractAudit)
  );
  writeText(FIELD_MATRIX_DOC_PATH, buildFieldCoverageMarkdown(fieldCoverageIncrement));

  console.log(
    JSON.stringify(
      {
        ok: true,
        summary_json: path.relative(ROOT_DIR, STAGE18_SUMMARY_PATH),
        clearance_doc: path.relative(ROOT_DIR, CLEARANCE_DOC_PATH),
        order_contract_doc: path.relative(ROOT_DIR, ORDER_CONTRACT_DOC_PATH),
        candidate_doc: path.relative(ROOT_DIR, CANDIDATE_DOC_PATH),
        matrix_doc: path.relative(ROOT_DIR, FIELD_MATRIX_DOC_PATH),
        safe_fix_found: false
      },
      null,
      2
    )
  );
}

main();
