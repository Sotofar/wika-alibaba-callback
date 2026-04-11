import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const PRODUCTION_BASE_URL = "https://api.wikapacking.com";
const SYNC_URL = "https://open-api.alibaba.com/sync";
const RAILWAY_TOKEN_PATH = path.join(os.tmpdir(), "railway-cli-token.txt");
const PROJECT_ID = "7cc408fd-c2a3-403c-9b4e-adaa72a9a712";
const ENVIRONMENT_ID = "4afccea8-ada6-42d5-9bd7-0f73cca404dc";
const SERVICE_ID = "d7abfb5c-25c6-478c-a51a-69d85151127a";
const GRAPHQL_URL = "https://backboard.railway.com/graphql/v2";

const SUMMARY_JSON_PATH = path.join(
  ROOT_DIR,
  "docs",
  "framework",
  "evidence",
  "stage23-xd-direct-method-closure.json"
);
const MYDATA_PERMISSION_MATRIX_PATH = path.join(
  ROOT_DIR,
  "projects",
  "xd",
  "access",
  "mydata_permission_matrix.csv"
);
const MYDATA_PERMISSION_GAP_MD_PATH = path.join(
  ROOT_DIR,
  "projects",
  "xd",
  "access",
  "mydata_permission_gap_stage23.md"
);
const INDICATOR_CONTRACT_MD_PATH = path.join(
  ROOT_DIR,
  "projects",
  "xd",
  "access",
  "indicator_basic_contract_stage23.md"
);

const MYDATA_METHODS = [
  {
    apiName: "alibaba.mydata.overview.date.get",
    expectedScope: "xd_mydata_read",
    intendedUse: "店铺级日期窗口发现",
    targetFields: ["start_date", "end_date"],
    buildParams: () => ({})
  },
  {
    apiName: "alibaba.mydata.overview.industry.get",
    expectedScope: "xd_mydata_read",
    intendedUse: "店铺级行业上下文发现",
    targetFields: ["industry_id", "industry_desc", "main_category"],
    buildParams: ({ dateRange }) => ({
      date_range: dateRange
    })
  },
  {
    apiName: "alibaba.mydata.self.product.date.get",
    expectedScope: "xd_mydata_read",
    intendedUse: "产品级表现日期窗口发现",
    targetFields: ["start_date", "end_date"],
    buildParams: () => ({
      statistics_type: "day"
    })
  },
  {
    apiName: "alibaba.mydata.self.product.get",
    expectedScope: "xd_mydata_read",
    intendedUse: "产品级表现指标读取",
    targetFields: [
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
    buildParams: ({ dateRange, productNumericId }) => ({
      statistics_type: "day",
      stat_date: dateRange.end_date,
      product_ids: productNumericId
    })
  }
];

const INDICATOR_ATTEMPTS = [
  {
    attemptName: "date_range_only",
    buildParams: ({ dateRange }) => ({
      date_range: dateRange
    })
  },
  {
    attemptName: "date_range_with_all_industry",
    buildParams: ({ dateRange }) => ({
      date_range: dateRange,
      industry: {
        industry_id: 111,
        industry_desc: "All",
        main_category: true
      }
    })
  }
];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeText(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
}

function writeJson(filePath, value) {
  writeText(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function csvEscape(value) {
  const raw =
    value === undefined || value === null
      ? ""
      : typeof value === "string"
        ? value
        : JSON.stringify(value);
  return `"${String(raw).replace(/"/g, '""')}"`;
}

function toCsv(headers, rows) {
  return `${[
    headers.map((header) => csvEscape(header)).join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))
  ].join("\n")}\n`;
}

function maskValue(value, keepStart = 3, keepEnd = 3) {
  if (value === undefined || value === null) {
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
    return node.slice(0, 10).map((item) => sanitizeNode(item));
  }
  if (!node || typeof node !== "object") {
    return node;
  }
  const out = {};
  for (const [key, value] of Object.entries(node)) {
    if (/(token|secret|sign|authorization|cookie)/i.test(key)) {
      out[key] = "***";
      continue;
    }
    if (/(trade_id|e_trade_id|product_id|id)/i.test(key) && value !== null && value !== undefined) {
      out[key] = typeof value === "number" ? value : maskValue(value);
      continue;
    }
    out[key] = sanitizeNode(value);
  }
  return out;
}

function summarizeJsonShape(jsonBody) {
  if (!jsonBody || typeof jsonBody !== "object") {
    return null;
  }
  const topKeys = Object.keys(jsonBody).slice(0, 12);
  const errorResponse = jsonBody.error_response
    ? {
        code: jsonBody.error_response.code ?? null,
        sub_code: jsonBody.error_response.sub_code ?? null,
        msg: jsonBody.error_response.msg ?? null,
        sub_msg: jsonBody.error_response.sub_msg ?? null
      }
    : null;
  return sanitizeNode({
    top_keys: topKeys,
    error_response: errorResponse
  });
}

function summarizeErrorMessage(errorResponse = {}) {
  return (
    errorResponse.sub_msg ||
    errorResponse.msg ||
    errorResponse.message ||
    errorResponse.code ||
    null
  );
}

function signSha256(apiName, params, appSecret) {
  const keys = Object.keys(params)
    .filter((key) => key !== "sign")
    .sort((left, right) =>
      Buffer.from(left, "utf8").compare(Buffer.from(right, "utf8"))
    );
  let payload = apiName;
  for (const key of keys) {
    const value = params[key];
    if (value === undefined || value === null || value === "") {
      continue;
    }
    payload += `${key}${value}`;
  }
  return crypto
    .createHmac("sha256", appSecret)
    .update(payload, "utf8")
    .digest("hex")
    .toUpperCase();
}

function serializeValue(value) {
  if (value === undefined || value === null || value === "") {
    return "";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

function readRailwayToken() {
  if (!fs.existsSync(RAILWAY_TOKEN_PATH)) {
    throw new Error(`Missing Railway token file: ${RAILWAY_TOKEN_PATH}`);
  }
  return fs.readFileSync(RAILWAY_TOKEN_PATH, "utf8").trim();
}

async function queryRailwayVariables(token) {
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      query:
        "query($projectId:String!,$environmentId:String!,$serviceId:String!){ variables(projectId:$projectId,environmentId:$environmentId,serviceId:$serviceId) }",
      variables: {
        projectId: PROJECT_ID,
        environmentId: ENVIRONMENT_ID,
        serviceId: SERVICE_ID
      }
    }),
    signal: AbortSignal.timeout(20000)
  });
  const payload = await response.json();
  if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
    throw new Error(JSON.stringify(payload.errors));
  }
  return payload?.data?.variables ?? {};
}

function getRefreshUrl(vars, prefix) {
  return String(
    vars[`${prefix}_REFRESH_TOKEN_URL`] ||
      String(vars[`${prefix}_TOKEN_URL`] || "").replace(
        "/auth/token/create",
        "/auth/token/refresh"
      )
  ).trim();
}

async function refreshAccessToken({
  appKey,
  appSecret,
  refreshToken,
  refreshUrl,
  partnerId
}) {
  const params = {
    app_key: appKey,
    sign_method: "sha256",
    timestamp: String(Date.now()),
    refresh_token: refreshToken
  };
  if (partnerId) {
    params.partner_id = partnerId;
  }
  params.sign = signSha256("/auth/token/refresh", params, appSecret);
  const response = await fetch(refreshUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
      Accept: "application/json"
    },
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(20000)
  });
  const payload = await response.json();
  if (String(payload?.code ?? "0") !== "0") {
    throw new Error(JSON.stringify(payload));
  }
  return payload.access_token;
}

async function fetchJsonRoute(pathname) {
  const started = Date.now();
  try {
    const response = await fetch(`${PRODUCTION_BASE_URL}${pathname}`, {
      signal: AbortSignal.timeout(20000)
    });
    const text = await response.text();
    let jsonBody = null;
    try {
      jsonBody = JSON.parse(text);
    } catch {}
    return {
      ok: response.ok,
      statusCode: response.status,
      elapsedMs: Date.now() - started,
      jsonBody,
      text
    };
  } catch (error) {
    return {
      ok: false,
      statusCode: null,
      elapsedMs: Date.now() - started,
      error: {
        name: error instanceof Error ? error.name : "UnknownError",
        message: error instanceof Error ? error.message : String(error)
      }
    };
  }
}

async function callSyncApi({
  apiName,
  appKey,
  appSecret,
  accessToken,
  businessParams
}) {
  const params = {
    method: apiName,
    app_key: appKey,
    access_token: accessToken,
    sign_method: "sha256",
    timestamp: String(Date.now())
  };
  for (const [key, value] of Object.entries(businessParams ?? {})) {
    const serialized = serializeValue(value);
    if (serialized !== "") {
      params[key] = serialized;
    }
  }
  params.sign = signSha256("", params, appSecret);
  const started = Date.now();
  const response = await fetch(SYNC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
      Accept: "application/json"
    },
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(20000)
  });
  const text = await response.text();
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {}
  return {
    statusCode: response.status,
    elapsedMs: Date.now() - started,
    body,
    text
  };
}

function buildDateRange() {
  const now = new Date();
  const endDate = new Date(now.getTime() - 86400000);
  const startDate = new Date(now.getTime() - 30 * 86400000);
  return {
    start_date: startDate.toISOString().slice(0, 10),
    end_date: endDate.toISOString().slice(0, 10)
  };
}

function buildSentinelStatus(response, kind) {
  if (!response.ok) {
    return "BLOCKED_ENV";
  }
  if (kind === "health") {
    return response.statusCode === 200 && String(response.text || "").trim() === "ok"
      ? "PASS_BASE"
      : "BLOCKED_ENV";
  }
  return response.statusCode === 200 ? "PASS_BASE" : "BLOCKED_ENV";
}

function rootCauseForPermissionMethod(response) {
  if (!response || response.statusCode === null) {
    return "BLOCKED_ENV";
  }
  const errorResponse = response.body?.error_response;
  const raw = `${errorResponse?.code ?? ""} ${errorResponse?.sub_code ?? ""} ${errorResponse?.msg ?? ""} ${errorResponse?.sub_msg ?? ""}`.toLowerCase();
  if (raw.includes("insufficientpermission") || raw.includes("permission")) {
    return "PERMISSION_GAP_CONFIRMED";
  }
  if (raw.includes("missingparameter") || raw.includes("invalid") || raw.includes("parameter")) {
    return "DOC_SCOPE_MISMATCH";
  }
  return "UNKNOWN";
}

function classifyIndicatorResponse(response) {
  if (!response || response.statusCode === null) {
    return "BLOCKED_ENV";
  }
  const errorResponse = response.body?.error_response;
  if (!errorResponse) {
    return response.statusCode === 200 ? "PASSED_STANDARD" : "UNKNOWN";
  }
  const raw = `${errorResponse?.code ?? ""} ${errorResponse?.sub_code ?? ""} ${errorResponse?.msg ?? ""} ${errorResponse?.sub_msg ?? ""}`.toLowerCase();
  if (raw.includes("insufficientpermission") || raw.includes("permission")) {
    return "PERMISSION_DENIED";
  }
  if (raw.includes("missingparameter")) {
    return "STILL_PARAM_MISSING";
  }
  if (raw.includes("invalid") || raw.includes("parameter")) {
    return "PARAM_CONTRACT_CONFIRMED";
  }
  return "UNKNOWN";
}

function summarizeDirectMethodResult({
  platform,
  method,
  authProfile,
  expectedScope,
  paramSummary,
  response,
  finalClassification,
  rootCauseHypothesis,
  nextAction
}) {
  return sanitizeNode({
    platform,
    method,
    auth_profile: authProfile,
    expected_scope: expectedScope,
    param_summary: paramSummary,
    status_code: response?.statusCode ?? null,
    error_code:
      response?.body?.error_response?.sub_code ||
      response?.body?.error_response?.code ||
      null,
    error_message_summary: summarizeErrorMessage(response?.body?.error_response || {}),
    response_shape_summary: summarizeJsonShape(response?.body) || String(response?.text || "").slice(0, 120),
    elapsed_ms: response?.elapsedMs ?? null,
    final_classification: finalClassification,
    root_cause_hypothesis: rootCauseHypothesis,
    next_action: nextAction
  });
}

function buildPermissionGapMarkdown(summary) {
  const lines = [
    "# Stage23 XD mydata 权限证据闭环",
    "",
    `- generated_at: ${summary.generated_at}`,
    `- elevated_allowed: ${summary.elevated.allowed ? "yes" : "no"}`,
    `- elevated_executed: ${summary.elevated.executed ? "yes" : "no"}`,
    "",
    "## 当前结论",
    "",
    "- 本轮只围绕 4 个 XD mydata direct-method 做标准权限证据闭环。",
    "- 本轮没有做新的 Alibaba API 扫描，没有做任何写动作。",
    summary.elevated.executed
      ? "- 本轮已执行受控 elevated confirm。"
      : `- 本轮未执行 elevated confirm：${summary.elevated.reason}`,
    "",
    "| method | standard result | root cause | strongest current conclusion | next action |",
    "| --- | --- | --- | --- | --- |"
  ];

  for (const item of summary.mydata_methods) {
    lines.push(
      `| ${item.api_name} | ${item.standard.final_classification} | ${item.root_cause} | ${item.strongest_conclusion} | ${item.next_action} |`
    );
  }

  lines.push("", "## 逐方法证据摘要", "");
  for (const item of summary.mydata_methods) {
    lines.push(`### ${item.api_name}`);
    lines.push(`- intended_use: ${item.intended_use}`);
    lines.push(`- target_fields: ${item.target_fields.join(", ")}`);
    lines.push(`- standard status: ${item.standard.status_code}`);
    lines.push(`- standard error: ${item.standard.error_code ?? "-"} / ${item.standard.error_message_summary ?? "-"}`);
    lines.push(`- auth_profile: ${item.standard.auth_profile}`);
    lines.push(`- current classification: ${item.root_cause}`);
    lines.push(`- strongest current conclusion: ${item.strongest_conclusion}`);
    lines.push(`- doc_scope_note: ${item.doc_scope_note}`);
    lines.push(`- tenant_or_product_note: ${item.tenant_or_product_note}`);
    if (summary.elevated.executed) {
      lines.push(`- elevated result: ${item.elevated?.final_classification ?? "-"}`);
    }
  }

  lines.push("", "## 边界说明", "");
  lines.push("- 本轮只是在收口 XD mydata 权限证据，不代表任务 1 / 2 已完成。");
  lines.push("- 本轮不是平台内闭环。");
  lines.push("- 本轮没有任何写动作。");

  return `${lines.join("\n")}\n`;
}

function buildIndicatorContractMarkdown(summary) {
  const lines = [
    "# Stage23 indicator.basic 参数契约闭环",
    "",
    `- generated_at: ${summary.generated_at}`,
    `- final_classification: ${summary.indicator.final_classification}`,
    "",
    "## 尝试矩阵",
    "",
    "| attempt | param summary | status | error_code | error_message | classification |",
    "| --- | --- | --- | --- | --- | --- |"
  ];

  for (const attempt of summary.indicator.attempts) {
    lines.push(
      `| ${attempt.attempt_name} | \`${JSON.stringify(attempt.param_summary)}\` | ${attempt.status_code ?? "-"} | ${attempt.error_code ?? "-"} | ${attempt.error_message_summary ?? "-"} | ${attempt.final_classification} |`
    );
  }

  lines.push("", "## 最终结论", "");
  lines.push(`- final_classification: ${summary.indicator.final_classification}`);
  lines.push(`- root_cause_hypothesis: ${summary.indicator.root_cause_hypothesis}`);
  lines.push(`- next_action: ${summary.indicator.next_action}`);
  lines.push(`- notes: ${summary.indicator.notes}`);
  lines.push("", "## 边界说明", "");
  lines.push("- 只有拿到真实权限错误证据，才把 indicator.basic 从参数问题改写为权限问题。");
  lines.push("- 本轮没有做任何写动作，也没有扩大到其他未知接口。");

  return `${lines.join("\n")}\n`;
}

async function main() {
  const startCommit = process.env.STAGE23_START_COMMIT || null;
  const sentinel = {
    health: await fetchJsonRoute("/health"),
    authDebug: await fetchJsonRoute("/integrations/alibaba/auth/debug"),
    wikaProducts: await fetchJsonRoute("/integrations/alibaba/wika/data/products/list?page_size=1")
  };

  const sentinelStatus = [
    {
      route: "/health",
      status: buildSentinelStatus(sentinel.health, "health"),
      evidence: sentinel.health.statusCode
    },
    {
      route: "/integrations/alibaba/auth/debug",
      status: buildSentinelStatus(sentinel.authDebug, "json"),
      evidence: sentinel.authDebug.statusCode
    },
    {
      route: "/integrations/alibaba/wika/data/products/list?page_size=1",
      status: buildSentinelStatus(sentinel.wikaProducts, "json"),
      evidence: sentinel.wikaProducts.statusCode
    }
  ];
  const passBase = sentinelStatus.every((item) => item.status === "PASS_BASE");

  const summary = {
    generated_at: new Date().toISOString(),
    start_commit: startCommit,
    sentinel: sanitizeNode(sentinelStatus),
    pass_base: passBase,
    elevated: {
      allowed: process.env.XD_ELEVATED_ALLOWED === "1",
      executed: false,
      reason:
        process.env.XD_ELEVATED_ALLOWED === "1"
          ? null
          : "XD_ELEVATED_ALLOWED 未设置为 1，按约束不做 elevated confirm"
    },
    mydata_methods: [],
    indicator: {
      attempts: [],
      final_classification: passBase ? "UNKNOWN" : "BLOCKED_ENV",
      root_cause_hypothesis: passBase ? "not_run" : "base_smoke_failed",
      next_action: passBase ? "run_documented_param_sets" : "stop_direct_method_closure",
      notes: passBase
        ? "待执行"
        : "production base 未保持 PASS_BASE，已停止 direct-method 收口"
    },
    sanity_control: null
  };

  if (!passBase) {
    writeJson(SUMMARY_JSON_PATH, sanitizeNode(summary));
    writeText(
      MYDATA_PERMISSION_MATRIX_PATH,
      toCsv(
        [
          "method",
          "auth_profile",
          "request_shape_summary",
          "status_code",
          "error_code",
          "error_message_summary",
          "final_classification",
          "root_cause_hypothesis",
          "next_action"
        ],
        []
      )
    );
    writeText(MYDATA_PERMISSION_GAP_MD_PATH, buildPermissionGapMarkdown(summary));
    writeText(INDICATOR_CONTRACT_MD_PATH, buildIndicatorContractMarkdown(summary));
    console.log(JSON.stringify(sanitizeNode(summary), null, 2));
    return;
  }

  const railwayToken = readRailwayToken();
  const vars = await queryRailwayVariables(railwayToken);
  const xdRefreshUrl =
    getRefreshUrl(vars, "ALIBABA_XD") || getRefreshUrl(vars, "ALIBABA");
  const xdCredentials = {
    appKey: String(vars.ALIBABA_XD_CLIENT_ID || "").trim(),
    appSecret: String(vars.ALIBABA_XD_CLIENT_SECRET || "").trim(),
    refreshToken: String(vars.ALIBABA_XD_BOOTSTRAP_REFRESH_TOKEN || "").trim(),
    refreshUrl: xdRefreshUrl,
    partnerId: String(vars.ALIBABA_XD_PARTNER_ID || vars.ALIBABA_PARTNER_ID || "").trim()
  };
  const xdAccessToken = await refreshAccessToken(xdCredentials);
  const xdProducts = await fetchJsonRoute("/integrations/alibaba/xd/data/products/list?page_size=1");
  const xdOrders = await fetchJsonRoute("/integrations/alibaba/xd/data/orders/list?page_size=1");
  const productNumericId = xdProducts.jsonBody?.items?.[0]?.id ?? null;
  const tradeId = xdOrders.jsonBody?.items?.[0]?.trade_id ?? null;
  const dateRange = buildDateRange();

  for (const methodDef of MYDATA_METHODS) {
    const params = methodDef.buildParams({ dateRange, productNumericId });
    const response = await callSyncApi({
      apiName: methodDef.apiName,
      appKey: xdCredentials.appKey,
      appSecret: xdCredentials.appSecret,
      accessToken: xdAccessToken,
      businessParams: params
    });
    const rootCause = rootCauseForPermissionMethod(response);
    const standardResult = summarizeDirectMethodResult({
      platform: "XD",
      method: methodDef.apiName,
      authProfile: "standard",
      expectedScope: methodDef.expectedScope,
      paramSummary: params,
      response,
      finalClassification: rootCause,
      rootCauseHypothesis:
        rootCause === "PERMISSION_GAP_CONFIRMED"
          ? "标准权限下已到接口层且稳定返回 InsufficientPermission"
          : rootCause === "DOC_SCOPE_MISMATCH"
            ? "文档最小参数与当前错误层级不一致，需继续核对参数/范围"
            : rootCause === "BLOCKED_ENV"
              ? "当前 base smoke 失败"
              : "仍需额外证据",
      nextAction:
        rootCause === "PERMISSION_GAP_CONFIRMED"
          ? "保留在 permission gap，等待人工申请或后续受控 elevated"
          : rootCause === "DOC_SCOPE_MISMATCH"
            ? "核对文档参数与 scope 说明"
            : rootCause === "BLOCKED_ENV"
              ? "停止 direct-method 收口"
              : "保留在 unresolved queue"
    });

    const regressionResponse = await callSyncApi({
      apiName: methodDef.apiName,
      appKey: xdCredentials.appKey,
      appSecret: xdCredentials.appSecret,
      accessToken: xdAccessToken,
      businessParams: params
    });
    const regressionClassification = rootCauseForPermissionMethod(regressionResponse);

    summary.mydata_methods.push({
      api_name: methodDef.apiName,
      intended_use: methodDef.intendedUse,
      target_fields: methodDef.targetFields,
      standard: standardResult,
      regression: summarizeDirectMethodResult({
        platform: "XD",
        method: methodDef.apiName,
        authProfile: "standard",
        expectedScope: methodDef.expectedScope,
        paramSummary: params,
        response: regressionResponse,
        finalClassification: regressionClassification,
        rootCauseHypothesis: "最小回归确认",
        nextAction: "keep_stage23_closure"
      }),
      root_cause: rootCause,
      strongest_conclusion:
        rootCause === "PERMISSION_GAP_CONFIRMED"
          ? "标准权限接口层已确认权限缺口，但未做 elevated confirm"
          : rootCause === "DOC_SCOPE_MISMATCH"
            ? "当前更像文档/参数/范围不一致，不能直接写成权限已确认"
            : rootCause === "BLOCKED_ENV"
              ? "当前被环境阻塞"
              : "当前仍未知",
      doc_scope_note:
        methodDef.apiName.includes("self.product")
          ? "方法名与历史文档都指向 mydata/self.product 能力，当前请求已满足最小产品样本与统计周期。"
          : "方法名与历史文档都指向 mydata/overview 能力，当前请求已满足最小日期窗口或空参入口。",
      tenant_or_product_note:
        methodDef.apiName.includes("self.product")
          ? "当前已提供真实 XD 产品样本 ID；若仍是 InsufficientPermission，更像权限缺口而非 product_id 缺失。"
          : "当前未见 tenant/product 特有错误文案；显式错误仍是 InsufficientPermission。",
      next_action:
        rootCause === "PERMISSION_GAP_CONFIRMED"
          ? "如业务仍需要，申请对应 mydata 权限或在明确允许时做单次 elevated confirm"
          : rootCause === "DOC_SCOPE_MISMATCH"
            ? "继续核对 scope 与文档契约"
            : "保留未决"
    });
  }

  for (const attemptDef of INDICATOR_ATTEMPTS) {
    const params = attemptDef.buildParams({ dateRange });
    const response = await callSyncApi({
      apiName: "alibaba.mydata.overview.indicator.basic.get",
      appKey: xdCredentials.appKey,
      appSecret: xdCredentials.appSecret,
      accessToken: xdAccessToken,
      businessParams: params
    });
    const finalClassification = classifyIndicatorResponse(response);
    summary.indicator.attempts.push(
      {
        attempt_name: attemptDef.attemptName,
        ...summarizeDirectMethodResult({
          platform: "XD",
          method: "alibaba.mydata.overview.indicator.basic.get",
          authProfile: "standard",
          expectedScope: "xd_mydata_read",
          paramSummary: params,
        response,
        finalClassification,
        rootCauseHypothesis:
          finalClassification === "PERMISSION_DENIED"
            ? "补齐文档支持的 industry 后进入权限错误层级"
            : finalClassification === "STILL_PARAM_MISSING"
              ? "补齐 documented industry 后仍停在缺参层级"
              : finalClassification === "PARAM_CONTRACT_CONFIRMED"
                ? "参数层已进入新的错误层级，可确认契约仍需对齐"
                : finalClassification === "PASSED_STANDARD"
                  ? "标准权限直接通过"
                  : "仍需额外证据",
        nextAction:
          finalClassification === "PERMISSION_DENIED"
            ? "保留为权限问题，不再写成纯参数问题"
            : finalClassification === "STILL_PARAM_MISSING"
              ? "保持参数问题，不写成权限问题"
              : finalClassification === "PARAM_CONTRACT_CONFIRMED"
                ? "记录契约差异并停在参数层"
                : finalClassification === "PASSED_STANDARD"
                  ? "记录已通过"
                  : "保留未决"
        })
      }
    );
  }

  const finalIndicatorAttempt =
    summary.indicator.attempts.find((item) => item.final_classification === "PERMISSION_DENIED") ||
    summary.indicator.attempts.at(-1);
  const regressionIndicatorResponse = await callSyncApi({
    apiName: "alibaba.mydata.overview.indicator.basic.get",
    appKey: xdCredentials.appKey,
    appSecret: xdCredentials.appSecret,
    accessToken: xdAccessToken,
    businessParams: finalIndicatorAttempt?.param_summary || {}
  });
  const regressionIndicatorClassification = classifyIndicatorResponse(regressionIndicatorResponse);
  summary.indicator.regression = summarizeDirectMethodResult({
    platform: "XD",
    method: "alibaba.mydata.overview.indicator.basic.get",
    authProfile: "standard",
    expectedScope: "xd_mydata_read",
    paramSummary: finalIndicatorAttempt?.param_summary || {},
    response: regressionIndicatorResponse,
    finalClassification: regressionIndicatorClassification,
    rootCauseHypothesis: "最小回归确认",
    nextAction: "keep_stage23_closure"
  });
  summary.indicator.final_classification =
    finalIndicatorAttempt?.final_classification || "UNKNOWN";
  summary.indicator.root_cause_hypothesis =
    finalIndicatorAttempt?.root_cause_hypothesis || "无有效参数契约证据";
  summary.indicator.next_action =
    finalIndicatorAttempt?.next_action || "keep_in_unresolved_queue";
  summary.indicator.notes =
    summary.indicator.final_classification === "PERMISSION_DENIED"
      ? "说明 date_range + industry 已经过参数层，当前卡在权限层。"
      : summary.indicator.final_classification === "STILL_PARAM_MISSING"
        ? "当前仍停在缺参层，不能写成权限不足。"
        : summary.indicator.final_classification === "PARAM_CONTRACT_CONFIRMED"
          ? "当前能确认参数层仍有契约差异，但还没有权限证据。"
          : summary.indicator.final_classification === "PASSED_STANDARD"
            ? "当前标准权限已通过。"
            : "当前仍需补证据。";

  const sanityResponse = await callSyncApi({
    apiName: "alibaba.seller.order.get",
    appKey: xdCredentials.appKey,
    appSecret: xdCredentials.appSecret,
    accessToken: xdAccessToken,
    businessParams: {
      e_trade_id: tradeId
    }
  });
  const sanityClassification = sanityResponse.body?.error_response ? "UNKNOWN" : "PASSED";
  summary.sanity_control = summarizeDirectMethodResult({
    platform: "XD",
    method: "alibaba.seller.order.get",
    authProfile: "standard",
    expectedScope: "xd_orders_read",
    paramSummary: {
      e_trade_id: tradeId
    },
    response: sanityResponse,
    finalClassification: sanityClassification,
    rootCauseHypothesis:
      sanityClassification === "PASSED"
        ? "已通过的 seller.order 方法仍可作为 sanity control"
        : "sanity control unexpected",
    nextAction:
      sanityClassification === "PASSED"
        ? "keep_as_control"
        : "inspect_order_control"
  });

  writeJson(SUMMARY_JSON_PATH, sanitizeNode(summary));
  writeText(
    MYDATA_PERMISSION_MATRIX_PATH,
    toCsv(
      [
        "method",
        "auth_profile",
        "request_shape_summary",
        "status_code",
        "error_code",
        "error_message_summary",
        "final_classification",
        "root_cause_hypothesis",
        "next_action",
        "regression_classification",
        "elevated_allowed"
      ],
      summary.mydata_methods.map((item) => ({
        method: item.api_name,
        auth_profile: item.standard.auth_profile,
        request_shape_summary: item.standard.param_summary,
        status_code: item.standard.status_code,
        error_code: item.standard.error_code,
        error_message_summary: item.standard.error_message_summary,
        final_classification: item.root_cause,
        root_cause_hypothesis: item.standard.root_cause_hypothesis,
        next_action: item.next_action,
        regression_classification: item.regression.final_classification,
        elevated_allowed: summary.elevated.allowed ? "yes" : "no"
      }))
    )
  );
  writeText(MYDATA_PERMISSION_GAP_MD_PATH, buildPermissionGapMarkdown(summary));
  writeText(INDICATOR_CONTRACT_MD_PATH, buildIndicatorContractMarkdown(summary));

  console.log(JSON.stringify(sanitizeNode(summary), null, 2));
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        fatal: error instanceof Error ? error.message : String(error)
      },
      null,
      2
    )
  );
  process.exit(1);
});
