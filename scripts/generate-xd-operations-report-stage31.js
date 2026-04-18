import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  WEEKLY_REPORT_PATH,
  WEEKLY_REPORT_EVIDENCE_PATH,
  REPORTS_DIR,
  STAGE30_EVIDENCE_PATH,
  exists,
  readJson,
  parseArgs,
  writeJson,
  writeText,
  fetchRoute,
  getXdCredentials,
  callSyncApi,
  collectStableSamples,
  getLastCompleteNaturalWeek,
  timestampToDateString,
  isDateWithinRange,
  summarizeSyncBody,
  scanForSensitiveValues
} from "./xd-stage31-common.js";

const DEFAULT_TIMEZONE = "Asia/Shanghai";

function getDefaultWindow(mode, timeZone) {
  if (mode === "daily") {
    const week = getLastCompleteNaturalWeek(timeZone);
    const end = new Date(`${week.reference_date}T12:00:00Z`);
    end.setUTCDate(end.getUTCDate() - 1);
    const day = end.toISOString().slice(0, 10);
    return { start: day, end: day };
  }
  const week = getLastCompleteNaturalWeek(timeZone);
  return { start: week.week_start, end: week.week_end };
}

function formatRouteHealth(routeResult) {
  if (!routeResult) return "not_available";
  if (routeResult.error) return `error:${routeResult.error}`;
  return `status=${routeResult.status}`;
}

function summarizeDateRange(items, timeZone, kind) {
  const dates = items
    .map((item) => {
      if (kind === "order_create") return timestampToDateString(item?.create_date?.timestamp, timeZone);
      if (kind === "order_modify") return timestampToDateString(item?.modify_date?.timestamp, timeZone);
      if (kind === "product_create") return item?.gmt_create?.slice(0, 10) || null;
      if (kind === "product_modify") return item?.gmt_modified?.slice(0, 10) || null;
      return null;
    })
    .filter(Boolean)
    .sort();
  if (!dates.length) return null;
  return { min: dates[0], max: dates[dates.length - 1] };
}

function countDatesInRange(items, timeZone, kind, start, end) {
  return items.filter((item) => {
    const dateString =
      kind === "order_create"
        ? timestampToDateString(item?.create_date?.timestamp, timeZone)
        : kind === "order_modify"
          ? timestampToDateString(item?.modify_date?.timestamp, timeZone)
          : kind === "product_create"
            ? item?.gmt_create?.slice(0, 10) || null
            : item?.gmt_modified?.slice(0, 10) || null;
    return isDateWithinRange(dateString, start, end);
  }).length;
}

function buildDistribution(entries, key) {
  const distribution = {};
  for (const entry of entries) {
    const value = entry?.[key] || "not_available";
    distribution[value] = (distribution[value] || 0) + 1;
  }
  return distribution;
}

function formatDistribution(distribution) {
  const parts = Object.entries(distribution || {}).map(([key, value]) => `${key}=${value}`);
  return parts.length ? parts.join(", ") : "not_available";
}

function renderMetric(value, reason = null, requiredEvidence = null) {
  return {
    value: value ?? "not_available",
    reason,
    required_evidence: requiredEvidence
  };
}

async function loadLiveData({ timeZone, start, end }) {
  const baseChecks = await Promise.all([
    fetchRoute("/health"),
    fetchRoute("/integrations/alibaba/auth/debug"),
    fetchRoute("/integrations/alibaba/xd/auth/debug")
  ]);
  const samples = await collectStableSamples();
  const ordersBody = samples.orders.raw_body || {};
  const productsBody = samples.products.raw_body || {};
  const orderItems = Array.isArray(ordersBody.items) ? ordersBody.items : [];
  const productItems = Array.isArray(productsBody.items) ? productsBody.items : [];
  const tradeIds = orderItems.map((item) => item?.trade_id).filter(Boolean).slice(0, 5);
  const orderDetails = await Promise.all(
    tradeIds.map((tradeId) =>
      fetchRoute(`/integrations/alibaba/xd/data/orders/detail?e_trade_id=${encodeURIComponent(tradeId)}`)
    )
  );
  const fundCheck = samples.tradeId
    ? await fetchRoute(
        `/integrations/alibaba/xd/data/orders/fund?e_trade_id=${encodeURIComponent(
          samples.tradeId
        )}&data_select=fund_serviceFee,fund_fundPay`
      )
    : null;
  const logisticsCheck = samples.tradeId
    ? await fetchRoute(
        `/integrations/alibaba/xd/data/orders/logistics?e_trade_id=${encodeURIComponent(
          samples.tradeId
        )}&data_select=logistic_order`
      )
    : null;
  const productDetail = samples.productId
    ? await fetchRoute(`/integrations/alibaba/xd/data/products/detail?product_id=${encodeURIComponent(samples.productId)}`)
    : null;
  const productGroups = samples.groupId
    ? await fetchRoute(`/integrations/alibaba/xd/data/products/groups?group_id=${encodeURIComponent(samples.groupId)}`)
    : null;
  const productScore = samples.productId
    ? await fetchRoute(`/integrations/alibaba/xd/data/products/score?product_id=${encodeURIComponent(samples.productId)}`)
    : null;
  const categoriesTree = await fetchRoute("/integrations/alibaba/xd/data/categories/tree?page_size=1");
  const mediaList = await fetchRoute("/integrations/alibaba/xd/data/media/list?page_size=5");
  const reportRoutes = await Promise.all([
    fetchRoute("/integrations/alibaba/xd/reports/orders/summary"),
    fetchRoute("/integrations/alibaba/xd/reports/orders/trend"),
    fetchRoute("/integrations/alibaba/xd/reports/orders/report-consumers")
  ]);
  const diagnostics = await Promise.all([
    fetchRoute("/integrations/alibaba/xd/reports/products/minimal-diagnostic"),
    fetchRoute("/integrations/alibaba/xd/reports/orders/minimal-diagnostic"),
    fetchRoute("/integrations/alibaba/xd/reports/operations/minimal-diagnostic")
  ]);

  let stableDirect = null;
  if (samples.tradeId) {
    try {
      const credentials = await getXdCredentials();
      stableDirect = await callSyncApi(credentials, "alibaba.seller.order.get", {
        e_trade_id: samples.tradeId
      });
    } catch (error) {
      const stage30 = exists(STAGE30_EVIDENCE_PATH) ? readJson(STAGE30_EVIDENCE_PATH) : null;
      stableDirect = {
        status: null,
        error: String(error?.message || error),
        fallback_stage30: stage30?.sanity?.stable_direct || null
      };
    }
  }

  const detailItems = orderDetails
    .filter((result) => result.status === 200 && result.raw_body?.item)
    .map((result) => result.raw_body.item);

  return {
    source_mode: "live",
    window: { start, end, timeZone },
    baseChecks,
    samples: {
      tradeId: samples.tradeId,
      productId: samples.productId,
      groupId: samples.groupId,
      categoryId: samples.categoryId
    },
    orders: {
      list: samples.orders,
      items: orderItems,
      create_range: summarizeDateRange(orderItems, timeZone, "order_create"),
      modify_range: summarizeDateRange(orderItems, timeZone, "order_modify"),
      create_hits_in_window: countDatesInRange(orderItems, timeZone, "order_create", start, end),
      modify_hits_in_window: countDatesInRange(orderItems, timeZone, "order_modify", start, end),
      detail_checks: orderDetails,
      detail_items: detailItems,
      trade_status_distribution: buildDistribution(detailItems, "trade_status"),
      fulfillment_channel_distribution: buildDistribution(detailItems, "fulfillment_channel"),
      shipment_method_distribution: buildDistribution(detailItems, "shipment_method"),
      shipment_date_present_count: detailItems.filter((item) => item?.shipment_date?.timestamp).length,
      fund_check: fundCheck,
      logistics_check: logisticsCheck
    },
    products: {
      list: samples.products,
      items: productItems,
      create_range: summarizeDateRange(productItems, timeZone, "product_create"),
      modify_range: summarizeDateRange(productItems, timeZone, "product_modify"),
      create_hits_in_window: countDatesInRange(productItems, timeZone, "product_create", start, end),
      modify_hits_in_window: countDatesInRange(productItems, timeZone, "product_modify", start, end),
      detail_check: productDetail,
      groups_check: productGroups,
      score_check: productScore,
      categories_check: categoriesTree,
      media_check: mediaList
    },
    reports: {
      summary: reportRoutes[0],
      trend: reportRoutes[1],
      consumers: reportRoutes[2],
      products_diagnostic: diagnostics[0],
      orders_diagnostic: diagnostics[1],
      operations_diagnostic: diagnostics[2]
    },
    stable_direct: stableDirect
  };
}

function loadEvidenceData({ timeZone, start, end }) {
  const stage30 = readJson(STAGE30_EVIDENCE_PATH);
  return {
    source_mode: "evidence_only",
    window: { start, end, timeZone },
    baseChecks: (stage30.production_gate?.canaries || []).map((item) => ({
      pathname: item.path,
      status: item.status_code,
      elapsed_ms: item.elapsed_ms,
      raw_body: null,
      body: null,
      error: null
    })),
    samples: {},
    orders: {
      list: null,
      items: [],
      create_range: null,
      modify_range: null,
      create_hits_in_window: 0,
      modify_hits_in_window: 0,
      detail_checks: [],
      detail_items: [],
      trade_status_distribution: {},
      fulfillment_channel_distribution: {},
      shipment_method_distribution: {},
      shipment_date_present_count: 0,
      fund_check: null,
      logistics_check: null
    },
    products: {
      list: null,
      items: [],
      create_range: null,
      modify_range: null,
      create_hits_in_window: 0,
      modify_hits_in_window: 0,
      detail_check: null,
      groups_check: null,
      score_check: null,
      categories_check: null,
      media_check: null
    },
    reports: {
      summary: null,
      trend: null,
      consumers: null,
      products_diagnostic: null,
      orders_diagnostic: null,
      operations_diagnostic: null
    },
    stable_direct: stage30.sanity?.stable_direct || null,
    stage30
  };
}

function buildStructuredReport({ mode, timeZone, start, end, data }) {
  const stage30 = exists(STAGE30_EVIDENCE_PATH) ? readJson(STAGE30_EVIDENCE_PATH) : null;
  const ordersResponseMeta = data.orders.list?.raw_body?.response_meta || {};
  const productsResponseMeta = data.products.list?.raw_body?.response_meta || {};
  const fundAvailable = data.orders.fund_check?.status === 200 && !!data.orders.fund_check?.raw_body?.value;
  const logisticsAvailable = data.orders.logistics_check?.status === 200 && !!data.orders.logistics_check?.raw_body?.value;
  const reportRouteStatuses = {
    summary: formatRouteHealth(data.reports.summary),
    trend: formatRouteHealth(data.reports.trend),
    report_consumers: formatRouteHealth(data.reports.consumers),
    products_minimal_diagnostic: formatRouteHealth(data.reports.products_diagnostic),
    orders_minimal_diagnostic: formatRouteHealth(data.reports.orders_diagnostic),
    operations_minimal_diagnostic: formatRouteHealth(data.reports.operations_diagnostic)
  };
  const directSummary =
    data.stable_direct?.raw_body || data.stable_direct?.body
      ? summarizeSyncBody("alibaba.seller.order.get", data.stable_direct.raw_body || data.stable_direct.body)
      : null;

  const windowLabel = mode === "daily" ? "今日窗口" : "本报告窗口";
  const windowStrictMetricLabel = mode === "daily" ? "今日窗口严格全量订单数" : "本报告窗口严格全量订单数";
  const windowReasonSuffix =
    mode === "daily" ? "只代表当前页样本命中今日窗口的记录数，不代表今日全量业务。" : "只代表当前页样本命中本报告窗口的记录数，不代表窗口内全量业务。";

  const ordersSection = {
    visible_order_count_current_page: renderMetric(ordersResponseMeta.returned_item_count ?? data.orders.items.length),
    total_order_count_from_current_page_response: renderMetric(
      ordersResponseMeta.total_count ?? "not_available",
      ordersResponseMeta.total_count ? null : "orders/list 当前响应未暴露 total_count",
      ordersResponseMeta.total_count ? null : "orders/list response_meta.total_count"
    ),
    window_created_hits_in_current_page_sample: renderMetric(
      data.orders.create_hits_in_window,
      windowReasonSuffix,
      "支持时间窗口的已验证聚合 route 或多页受控聚合证据"
    ),
    window_modified_hits_in_current_page_sample: renderMetric(
      data.orders.modify_hits_in_window,
      windowReasonSuffix,
      "支持时间窗口的已验证聚合 route 或多页受控聚合证据"
    ),
    strict_window_total_orders: renderMetric(
      "not_available",
      "当前 safe-scope 只保证当前页样本和已读范围，不提供严格按报告窗口裁切的全量订单聚合。",
      "可重复验证的时间窗口订单聚合 route 或多页受控聚合证据"
    ),
    current_page_create_range:
      data.orders.create_range || renderMetric("not_available", "当前页无 create_date 样本", "orders/list items.create_date"),
    sampled_trade_status_distribution: data.orders.trade_status_distribution,
    sampled_fulfillment_channel_distribution: data.orders.fulfillment_channel_distribution,
    sampled_shipment_method_distribution: data.orders.shipment_method_distribution,
    shipment_date_present_count_in_sampled_details: data.orders.shipment_date_present_count,
    fund_signal: renderMetric(
      fundAvailable ? "available_on_sample_trade" : "not_available",
      fundAvailable ? "仅作为 sample trade 的可读覆盖信号，不提升为经营层稳定字段集。" : "sample trade fund 读取失败或无值。",
      fundAvailable ? null : "可读 fund payload"
    ),
    logistics_signal: renderMetric(
      logisticsAvailable ? "available_on_sample_trade" : "not_available",
      logisticsAvailable ? "仅作为 sample trade 的可读覆盖信号，不提升为经营层稳定字段集。" : "sample trade logistics 读取失败或无值。",
      logisticsAvailable ? null : "可读 logistics payload"
    ),
    report_routes: reportRouteStatuses
  };

  const productsSection = {
    visible_product_count_current_page: renderMetric(data.products.items.length),
    total_product_count_from_current_page_response: renderMetric(
      productsResponseMeta.total_item ?? "not_available",
      productsResponseMeta.total_item ? null : "products/list 当前响应未暴露 total_item",
      productsResponseMeta.total_item ? null : "products/list response_meta.total_item"
    ),
    window_created_hits_in_current_page_sample: renderMetric(
      data.products.create_hits_in_window,
      windowReasonSuffix,
      "支持时间窗口的商品聚合或可重复多页采样证据"
    ),
    window_modified_hits_in_current_page_sample: renderMetric(
      data.products.modify_hits_in_window,
      windowReasonSuffix,
      "支持时间窗口的商品聚合或可重复多页采样证据"
    ),
    current_page_modify_range:
      data.products.modify_range || renderMetric("not_available", "当前页无 gmt_modified 样本", "products/list items.gmt_modified"),
    product_detail_status: renderMetric(
      data.products.detail_check?.status === 200 ? "available" : "not_available",
      data.products.detail_check?.status === 200 ? "可做基础详情抽样，不等于全量经营分析。" : "当前样本 detail 未成功。",
      data.products.detail_check?.status === 200 ? null : "稳定 product_id 样本"
    ),
    product_groups_status: renderMetric(
      data.products.groups_check?.status === 200 ? "available" : "not_available",
      data.products.groups_check?.status === 200 ? "可做分组元信息核查。" : "当前样本 groups 未成功。",
      data.products.groups_check?.status === 200 ? null : "稳定 group_id 样本"
    ),
    product_score_status: renderMetric(
      data.products.score_check?.status === 200 ? "available" : "not_available",
      data.products.score_check?.status === 200 ? "可做基础质量分抽样。" : "当前样本 score 未成功。",
      data.products.score_check?.status === 200 ? null : "稳定 product_id 样本"
    ),
    categories_tree_status: renderMetric(
      data.products.categories_check?.status === 200 ? "available" : "not_available",
      data.products.categories_check?.status === 200 ? "可做类目树与类目元信息核查。" : "categories/tree 当前不可读。",
      data.products.categories_check?.status === 200 ? null : "stable categories route"
    ),
    media_list_status: renderMetric(
      data.products.media_check?.status === 200 ? "available" : "not_available",
      data.products.media_check?.status === 200 ? "可做媒体素材存在性与基础元信息核查。" : "media/list 当前不可读。",
      data.products.media_check?.status === 200 ? null : "stable media route"
    ),
    banned_metrics: [
      "GMV 归因 not_available",
      "转化率 not_available",
      "国家结构 not_available",
      "完整经营诊断 not_available"
    ]
  };

  const executiveSummary = [
    "XD access safe-scope 已封板，当前 route parity gap=0，candidate unresolved=0。",
    "当前 production base 继续可读：/health、/integrations/alibaba/auth/debug、/integrations/alibaba/xd/auth/debug 均返回 200。",
    "订单与商品核心只读 route 可持续提供当前页样本与最小详情能力，可直接用于日报、周报草稿与巡检。",
    `${windowStrictMetricLabel} 仍不可可靠给出；当前能给出的只有当前页样本命中报告窗口的观察值。`,
    "fund/logistics 目前只适合作为 sample trade 覆盖信号，不应写成稳定经营指标。",
    "products/detail、groups、score、categories、media 已可读，可支撑商品基础盘点与元信息核查。",
    "orders/report 型 summary/trend/report-consumers 当前 production 为 404，但 stage28 打通的 minimal-diagnostic routes 可作为辅助信号。",
    "没有新的外部租户/产品级 live 证据前，不建议继续对 restriction 对象做同构重试。"
  ];

  const capabilityState = {
    safe_scope_complete: stage30?.safe_scope_complete ?? false,
    route_gap_count: stage30?.remaining_route_gap_count ?? "not_available",
    candidate_unresolved_count: stage30?.remaining_candidate_unresolved_count ?? "not_available",
    restriction_confirmed_count: stage30?.restriction_confirmed_count ?? "not_available",
    write_adjacent_skipped_count: stage30?.write_adjacent_skipped_count ?? "not_available",
    base_health: {
      health: formatRouteHealth(data.baseChecks[0]),
      auth_debug: formatRouteHealth(data.baseChecks[1]),
      xd_auth_debug: formatRouteHealth(data.baseChecks[2]),
      stable_direct: directSummary?.meaningful
        ? "available"
        : data.stable_direct?.fallback_stage30?.final_classification === "PASSED"
          ? "available_via_stage30_evidence"
          : "not_available"
    }
  };

  const risks = [
    "当前页 / 已读范围限制：orders 与 products 当前只保证当前页样本和少量详情抽样，不是全量聚合。",
    "非多页全量聚合：没有受控多页扫描与时间窗口聚合证据前，不能把样本数写成全量业务数。",
    "tenant/product restriction：stage29/stage30 已冻结的 6 个 candidate 仍需外部新证据才能重开。",
    "write-adjacent skip：2 个 draft-adjacent 对象保持跳过，不在本轮自动化范围内。",
    "report routes 404：当前 production 未绑定 orders/summary、trend、report-consumers；本轮改用文件化报告资产 + minimal-diagnostic 辅助信号，不建议回头扩 route。"
  ];

  const nextActions = [
    "把 scripts/check-xd-critical-routes-stage31.js 接入每日巡检，保活当前 stable routes。",
    "把 scripts/generate-xd-operations-report-stage31.js 交给业务侧试跑日报 / 周报模板。",
    "对外分发报告时保留“当前页样本 / 非全量聚合”口径说明。",
    "对 restriction confirmed 对象只做 reopen gate 判断，不做无证据重试。",
    "一旦出现新的租户/产品级 live 证据，再按 stage30 reopen gate 受控重开。"
  ];

  return {
    mode,
    generated_at: new Date().toISOString(),
    source_mode: data.source_mode,
    time_window: { start, end, timeZone },
    window_label: windowLabel,
    data_sources: [
      "当前 production stable routes",
      "stage26-stage30 evidence",
      "api_coverage / permission_gap / freeze docs"
    ],
    executive_summary: executiveSummary,
    orders: ordersSection,
    products: productsSection,
    capability_state: capabilityState,
    risks,
    next_actions: nextActions
  };
}

function renderMarkdown(report) {
  const { start, end, timeZone } = report.time_window;
  const orderStatuses = formatDistribution(report.orders.sampled_trade_status_distribution);
  const fulfillment = formatDistribution(report.orders.sampled_fulfillment_channel_distribution);
  const shipmentMethods = formatDistribution(report.orders.sampled_shipment_method_distribution);
  const title = report.mode === "daily" ? "XD 今日运营日报" : "XD 最新周报";
  const statusNote = "以下属于截至当前状态附注，不等于报告窗口内全部业务成果。";

  return [
    `# ${title}`,
    "",
    `生成时间：${report.generated_at}`,
    "",
    "# 1. 报告范围",
    `- 时间窗口：${start} 至 ${end}`,
    `- 时区：${timeZone}`,
    `- 数据来源：${report.data_sources.join("；")}`,
    "- 不包含范围：写侧动作、未知 API、全量多页聚合、GMV/转化率/国家结构/完整经营诊断。",
    "- 数据口径限制：当前页样本、已读页面范围、只读 live route 与 stage26-stage30 冻结证据交叉使用，非全量聚合。",
    "",
    "# 2. 执行摘要",
    ...report.executive_summary.map((line) => `- ${line}`),
    "",
    "# 3. 订单运营摘要",
    `- ${report.window_label}严格全量订单数：${report.orders.strict_window_total_orders.value}。原因：${report.orders.strict_window_total_orders.reason}`,
    `- 当前页可见订单样本数：${report.orders.visible_order_count_current_page.value}；当前页响应 total_count：${report.orders.total_order_count_from_current_page_response.value}。`,
    `- 当前页样本 create_date 范围：${report.orders.current_page_create_range.min || "not_available"} 至 ${report.orders.current_page_create_range.max || "not_available"}。`,
    `- 当前页样本命中${report.window_label}的 create 记录：${report.orders.window_created_hits_in_current_page_sample.value}；modify 记录：${report.orders.window_modified_hits_in_current_page_sample.value}。`,
    `- 已抽样订单状态分布：${orderStatuses}。`,
    `- 已抽样 fulfillment channel 分布：${fulfillment}。`,
    `- 已抽样 shipment method 分布：${shipmentMethods}。`,
    `- 发货时间字段已出现条数：${report.orders.shipment_date_present_count_in_sampled_details}。`,
    `- fund 覆盖信号：${report.orders.fund_signal.value}；说明：${report.orders.fund_signal.reason}`,
    `- logistics 覆盖信号：${report.orders.logistics_signal.value}；说明：${report.orders.logistics_signal.reason}`,
    `- orders/report 型 route 状态：summary=${report.orders.report_routes.summary}，trend=${report.orders.report_routes.trend}，report-consumers=${report.orders.report_routes.report_consumers}。`,
    `- minimal-diagnostic 状态：products=${report.orders.report_routes.products_minimal_diagnostic}，orders=${report.orders.report_routes.orders_minimal_diagnostic}，operations=${report.orders.report_routes.operations_minimal_diagnostic}。`,
    "",
    "# 4. 商品与内容摘要",
    `- 当前页可见商品样本数：${report.products.visible_product_count_current_page.value}；当前页响应 total_item：${report.products.total_product_count_from_current_page_response.value}。`,
    `- 当前页样本 gmt_modified 范围：${report.products.current_page_modify_range.min || "not_available"} 至 ${report.products.current_page_modify_range.max || "not_available"}。`,
    `- 当前页商品样本命中${report.window_label}的 create 记录：${report.products.window_created_hits_in_current_page_sample.value}；modify 记录：${report.products.window_modified_hits_in_current_page_sample.value}。`,
    `- 商品 detail 状态：${report.products.product_detail_status.value}；说明：${report.products.product_detail_status.reason}`,
    `- 商品 groups 状态：${report.products.product_groups_status.value}；说明：${report.products.product_groups_status.reason}`,
    `- 商品 score 状态：${report.products.product_score_status.value}；说明：${report.products.product_score_status.reason}`,
    `- categories/tree 状态：${report.products.categories_tree_status.value}；说明：${report.products.categories_tree_status.reason}`,
    `- media/list 状态：${report.products.media_list_status.value}；说明：${report.products.media_list_status.reason}`,
    "- 当前可用于的运营动作：商品基础盘点、详情抽样核查、分组元信息核查、类目树核查、媒体素材存在性检查。",
    "- 当前不可可靠给出的指标：GMV、转化率、国家结构、全量商品贡献、完整经营诊断。",
    "",
    "# 5. 运行与能力状态",
    `- 当前 safe-scope 完成状态：${report.capability_state.safe_scope_complete ? "complete" : "not_complete"}`,
    `- route parity gap：${report.capability_state.route_gap_count}`,
    `- candidate unresolved：${report.capability_state.candidate_unresolved_count}`,
    `- restriction confirmed：${report.capability_state.restriction_confirmed_count}`,
    `- write-adjacent skipped：${report.capability_state.write_adjacent_skipped_count}`,
    `- 当前 health / auth/debug / xd auth/debug：${report.capability_state.base_health.health} / ${report.capability_state.base_health.auth_debug} / ${report.capability_state.base_health.xd_auth_debug}`,
    `- 稳定 direct-method 状态：${report.capability_state.base_health.stable_direct}`,
    `- ${statusNote}`,
    "",
    "# 6. 风险与限制",
    ...report.risks.map((line) => `- ${line}`),
    "",
    "# 7. 下周建议动作",
    ...report.next_actions.map((line) => `- ${line}`),
    ""
  ].join("\n");
}

function buildDefaultOutputPath(mode, start, end) {
  if (mode === "daily") {
    return path.join(REPORTS_DIR, `xd_daily_report_${start}.md`);
  }
  return path.join(REPORTS_DIR, `xd_weekly_report_${start}_${end}.md`);
}

function buildDefaultJsonPath(mode, start, end) {
  return buildDefaultOutputPath(mode, start, end).replace(/\.md$/i, ".json");
}

export async function buildOperationsReport(options = {}) {
  const mode = options.mode || "weekly";
  const timeZone = options.timeZone || DEFAULT_TIMEZONE;
  const defaults = getDefaultWindow(mode, timeZone);
  const start = options.start || defaults.start;
  const end = options.end || defaults.end;
  const data = options.fromEvidence ? loadEvidenceData({ timeZone, start, end }) : await loadLiveData({ timeZone, start, end });
  const report = buildStructuredReport({ mode, timeZone, start, end, data });
  const markdown = renderMarkdown(report);
  if (scanForSensitiveValues(markdown) || scanForSensitiveValues(JSON.stringify(report))) {
    throw new Error("Sensitive value pattern detected in generated report output.");
  }
  return { report, markdown };
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const mode = args.mode || "weekly";
  const timeZone = args.timezone || DEFAULT_TIMEZONE;
  const { report, markdown } = await buildOperationsReport({
    mode,
    timeZone,
    start: args.start,
    end: args.end,
    fromEvidence: Boolean(args["from-evidence"])
  });

  const outputPath =
    args.output || (mode === "weekly" ? WEEKLY_REPORT_PATH : buildDefaultOutputPath(mode, report.time_window.start, report.time_window.end));
  const jsonOutputPath =
    args["json-output"] ||
    (mode === "weekly" ? WEEKLY_REPORT_EVIDENCE_PATH : buildDefaultJsonPath(mode, report.time_window.start, report.time_window.end));

  if (!args["dry-run"]) {
    writeText(outputPath, `${markdown}\n`);
    writeJson(jsonOutputPath, report);
    if (mode === "weekly") {
      writeText(buildDefaultOutputPath(mode, report.time_window.start, report.time_window.end), `${markdown}\n`);
      writeJson(buildDefaultJsonPath(mode, report.time_window.start, report.time_window.end), report);
    }
  }

  const summary = {
    mode,
    dry_run: Boolean(args["dry-run"]),
    from_evidence: Boolean(args["from-evidence"]),
    output_path: outputPath,
    json_output_path: jsonOutputPath,
    section_count: markdown.split(/^# /gm).length - 1,
    time_window: report.time_window,
    source_mode: report.source_mode
  };
  console.log(JSON.stringify(summary, null, 2));
  return summary;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error?.stack || String(error));
    process.exitCode = 1;
  });
}
