function formatPercent(value) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return null;
  }

  return `${(Number(value) * 100).toFixed(2)}%`;
}

function renderList(items) {
  return items.map((item) => `- ${item}`).join("\n");
}

function toNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function average(items, fieldName) {
  const values = items
    .map((item) => toNumber(item[fieldName]))
    .filter((value) => value !== null);

  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildProductLine(item) {
  return `${item.product_name}（ID: ${item.product_id}）：detail_uv ${item.detail_uv ?? "未接入"}，business_rate ${item.business_rate_label ?? "未接入"}，order_uv ${item.order_uv ?? 0}`;
}

function buildCountryLine(item) {
  return `${item.country_name ?? item.country_code}：订单 ${item.order_count ?? 0}，订单金额 ${item.total_amount ?? 0}`;
}

function buildMarketLine(item) {
  return `${item.country_name ?? item.country_code}：访客 ${item.visitor_count ?? 0}，占比 ${formatPercent(item.visitor_share) ?? "未接入"}`;
}

function buildMarketChangeLine(item) {
  const prefix = (item.share_change_pp ?? 0) > 0 ? "+" : "";
  return `${item.country_name ?? item.country_code}：当前占比 ${formatPercent(item.current_visitor_share) ?? "未接入"}，对比 ${item.baseline_period ?? "基线"} 变化 ${prefix}${item.share_change_pp ?? 0} 个百分点`;
}

function buildContributionLine(item) {
  return `${item.product_name}：涉及订单 ${item.order_count ?? 0}，数量 ${item.quantity_total ?? 0}，估算金额 ${item.estimated_amount_total ?? 0}`;
}

function normalizeUnifiedProductForReport(item = {}) {
  return {
    product_id: item.product_id ?? null,
    product_name: item.product_name ?? null,
    group_name: item.group_name ?? null,
    status: item.status ?? null,
    display: item.display ?? null,
    detail_uv: item.detail_uv ?? null,
    business_uv: item.business_uv ?? null,
    business_rate: item.business_rate ?? null,
    business_rate_label: formatPercent(item.business_rate),
    order_uv: item.order_uv ?? null,
    price: item.price ?? null,
    min_order_quantity_display: item.min_order_quantity_display ?? null,
    match_status: item.match_status ?? null,
    data_sources: item.field_sources ?? {}
  };
}

function getHighTrafficLowBusinessProducts(items = []) {
  const trafficAverage = average(items, "detail_uv");
  const businessAverage = average(items, "business_rate");

  if (trafficAverage === null || businessAverage === null) {
    return [];
  }

  return [...items]
    .filter(
      (item) =>
        (item.detail_uv ?? 0) >= trafficAverage &&
        (item.business_rate ?? 0) < businessAverage
    )
    .sort((left, right) => (right.detail_uv ?? 0) - (left.detail_uv ?? 0))
    .slice(0, 10)
    .map(normalizeUnifiedProductForReport);
}

function getOrderSignalProducts(items = []) {
  return [...items]
    .filter((item) => (item.order_uv ?? 0) > 0)
    .sort((left, right) => (right.order_uv ?? 0) - (left.order_uv ?? 0))
    .slice(0, 10)
    .map(normalizeUnifiedProductForReport);
}

function getTopTrafficProducts(items = []) {
  return [...items]
    .filter((item) => (item.detail_uv ?? 0) > 0)
    .sort((left, right) => (right.detail_uv ?? 0) - (left.detail_uv ?? 0))
    .slice(0, 10)
    .map(normalizeUnifiedProductForReport);
}

function sumShares(items = [], limit = 3) {
  return Number(
    items
      .slice(0, limit)
      .reduce((sum, item) => sum + (item.visitor_share ?? 0), 0)
      .toFixed(4)
  );
}

function inferMarketConcentrationRisk(top1Share) {
  if (top1Share === null || top1Share === undefined) {
    return "unknown";
  }

  if (top1Share >= 0.4) {
    return "high";
  }

  if (top1Share >= 0.25) {
    return "medium";
  }

  return "low";
}

export function buildWikaProductReport({
  period = "30d",
  unifiedProductResult,
  unifiedProductSummary,
  unifiedProductRecommendations
}) {
  const items = Array.isArray(unifiedProductResult?.items)
    ? unifiedProductResult.items
    : [];

  const topTrafficProducts = getTopTrafficProducts(items);
  const highTrafficLowBusinessProducts = getHighTrafficLowBusinessProducts(items);
  const orderSignalProducts = getOrderSignalProducts(items);

  return {
    reportType: "product_report",
    account: "wika",
    period,
    dataStatus: "verified_a_master_plus_b_performance_partial_unified",
    coverage: {
      official_total_item:
        unifiedProductResult?.official_result?.total_item ?? null,
      official_returned_item_count:
        unifiedProductResult?.official_result?.returned_item_count ?? null,
      performance_item_count:
        unifiedProductResult?.performance_result?.item_count ?? null,
      performance_period:
        unifiedProductResult?.performance_result?.period ?? null,
      merged_item_count: unifiedProductSummary?.snapshot?.merged_item_count ?? null,
      matched_count: unifiedProductSummary?.snapshot?.matched_count ?? null,
      official_only_count:
        unifiedProductSummary?.snapshot?.official_only_count ?? null,
      performance_only_count:
        unifiedProductSummary?.snapshot?.performance_only_count ?? null,
      products_with_traffic_count:
        unifiedProductSummary?.snapshot?.products_with_traffic_count ?? null,
      products_with_order_signal_count:
        unifiedProductSummary?.snapshot?.products_with_order_signal_count ?? null
    },
    sourceScope: {
      master_data_owner: "A official_api",
      performance_data_owner: "B page_request",
      official_endpoint: unifiedProductResult?.sources?.[0]?.notes ?? null,
      performance_endpoint: unifiedProductResult?.sources?.[1]?.notes ?? null
    },
    topTrafficProducts,
    highTrafficLowBusinessProducts,
    orderSignalProducts,
    focusOptimizationList: highTrafficLowBusinessProducts.slice(0, 5),
    actionsReady: (unifiedProductRecommendations?.actions_ready ?? []).map(
      (item) => item.action
    ),
    actionsNeedMoreData: (
      unifiedProductRecommendations?.actions_need_more_data ?? []
    ).map((item) => item.action),
    limitations: unifiedProductSummary?.limitations ?? []
  };
}

export function renderWikaProductReportMarkdown(report) {
  return [
    `# WIKA 产品报告（${report.period}）`,
    "",
    "## 数据覆盖",
    renderList([
      `A 主数据总量：${report.coverage.official_total_item ?? "未接入"}`,
      `A 当前返回条数：${report.coverage.official_returned_item_count ?? "未接入"}`,
      `B 表现池条数：${report.coverage.performance_item_count ?? "未接入"}`,
      `B 表现周期：${report.coverage.performance_period ?? "未接入"}`,
      `统一视图条数：${report.coverage.merged_item_count ?? "未接入"}`,
      `已匹配条数：${report.coverage.matched_count ?? "未接入"}`,
      `仅 A 条数：${report.coverage.official_only_count ?? "未接入"}`,
      `仅 B 条数：${report.coverage.performance_only_count ?? "未接入"}`
    ]),
    "",
    "## 高流量产品",
    report.topTrafficProducts.length
      ? renderList(report.topTrafficProducts.map(buildProductLine))
      : "- 未接入",
    "",
    "## 高流量低商机率产品",
    report.highTrafficLowBusinessProducts.length
      ? renderList(report.highTrafficLowBusinessProducts.map(buildProductLine))
      : "- 未接入",
    "",
    "## 有订单信号产品",
    report.orderSignalProducts.length
      ? renderList(report.orderSignalProducts.map(buildProductLine))
      : "- 未接入",
    "",
    "## 重点优化清单",
    report.focusOptimizationList.length
      ? renderList(report.focusOptimizationList.map(buildProductLine))
      : "- 未接入",
    "",
    "## 可立即执行",
    report.actionsReady.length ? renderList(report.actionsReady) : "- 暂无",
    "",
    "## 需要补更多数据后再执行",
    report.actionsNeedMoreData.length
      ? renderList(report.actionsNeedMoreData)
      : "- 暂无",
    "",
    "## 当前口径说明",
    report.limitations.length ? renderList(report.limitations) : "- 暂无"
  ].join("\n");
}

export function buildWikaOrderReport({
  period = "30d",
  orderResult,
  orderSummary
}) {
  return {
    reportType: "order_report",
    account: "wika",
    period,
    dataStatus: "verified_order_summary_trends_plus_paged_pool",
    summaryCurrent: {
      period: orderSummary?.snapshot?.period ?? null,
      summary_scope: orderResult?.summary?.summary_scope ?? null,
      stat_date: orderSummary?.snapshot?.stat_date ?? null,
      stat_date_range: orderSummary?.snapshot?.stat_date_range ?? null,
      created_order_count: orderSummary?.snapshot?.created_order_count ?? null,
      successful_order_count:
        orderSummary?.snapshot?.successful_order_count ?? null,
      received_order_amount:
        orderSummary?.snapshot?.received_order_amount ?? null,
      real_received_order_amount:
        orderSummary?.snapshot?.real_received_order_amount ?? null,
      refund_order_rate: formatPercent(
        orderSummary?.snapshot?.refund_order_rate ?? null
      ),
      create_to_success_rate: formatPercent(
        orderSummary?.snapshot?.create_to_success_rate ?? null
      ),
      successful_buyer_count:
        orderSummary?.snapshot?.successful_buyer_count ?? null
    },
    comparison: orderSummary?.comparison ?? null,
    trend: orderSummary?.trend_highlights ?? null,
    snapshotCoverage: orderSummary?.order_list_snapshot
      ? {
          snapshot_scope: orderSummary.order_list_snapshot.snapshot_scope,
          current_page: orderSummary.order_list_snapshot.current_page,
          page_size: orderSummary.order_list_snapshot.page_size,
          returned_item_count:
            orderSummary.order_list_snapshot.returned_item_count,
          total_record: orderSummary.order_list_snapshot.total_record,
          total_page: orderSummary.order_list_snapshot.total_page,
          pages_fetched: orderSummary.order_list_snapshot.pages_fetched,
          fully_covered: orderSummary.order_list_snapshot.fully_covered,
          amount_breakdown:
            orderSummary.order_list_snapshot.amount_breakdown ?? null,
          order_status_distribution:
            orderSummary.order_list_snapshot.order_status_distribution ?? [],
          shipping_type_distribution:
            orderSummary.order_list_snapshot.shipping_type_distribution ?? []
        }
      : {},
    buyerCountryDistribution:
      orderSummary?.order_list_snapshot?.buyer_country_distribution ?? [],
    shippingCountryDistribution:
      orderSummary?.order_list_snapshot?.shipping_country_distribution ?? [],
    productContributionTop:
      orderSummary?.order_list_snapshot?.top_product_contribution ?? [],
    actionsReady: orderSummary?.next_actions ?? [],
    actionsNeedMoreData: orderSummary?.next_actions_need_more_data ?? [],
    limitations: orderResult?.limitations ?? []
  };
}

export function renderWikaOrderReportMarkdown(report) {
  return [
    `# WIKA 订单报告（${report.period}）`,
    "",
    "## 订单汇总",
    renderList([
      `周期：${report.summaryCurrent.period ?? "未接入"}`,
      `摘要口径：${report.summaryCurrent.summary_scope ?? "未接入"}`,
      `统计日期：${report.summaryCurrent.stat_date ?? "未接入"}`,
      `创建订单数：${report.summaryCurrent.created_order_count ?? "未接入"}`,
      `成功订单数：${report.summaryCurrent.successful_order_count ?? "未接入"}`,
      `实收相关金额：${report.summaryCurrent.received_order_amount ?? "未接入"}`,
      `实收金额（real）：${report.summaryCurrent.real_received_order_amount ?? "未接入"}`,
      `成功买家数：${report.summaryCurrent.successful_buyer_count ?? "未接入"}`,
      `退款订单率：${report.summaryCurrent.refund_order_rate ?? "未接入"}`,
      `创建转成功率：${report.summaryCurrent.create_to_success_rate ?? "未接入"}`
    ]),
    "",
    "## 订单趋势",
    report.trend
      ? renderList([
          `趋势点数：${report.trend.trend_points_count ?? "未接入"}`,
          `最早日期：${report.trend.earliest_trend_date ?? "未接入"}`,
          `最新日期：${report.trend.latest_trend_date ?? "未接入"}`,
          `峰值金额日：${report.trend.peak_received_amount_day?.stat_date ?? "未接入"} / ${report.trend.peak_received_amount_day?.received_order_amount ?? "未接入"}`
        ])
      : "- 未接入",
    "",
    "## 订单池覆盖",
    report.snapshotCoverage?.returned_item_count
      ? renderList([
          `快照口径：${report.snapshotCoverage.snapshot_scope ?? "未接入"}`,
          `页大小：${report.snapshotCoverage.page_size ?? "未接入"}`,
          `已抓页数：${report.snapshotCoverage.pages_fetched ?? "未接入"}`,
          `是否覆盖完成：${report.snapshotCoverage.fully_covered === true ? "是" : "否"}`,
          `已读订单数：${report.snapshotCoverage.returned_item_count ?? "未接入"}`,
          `总记录数：${report.snapshotCoverage.total_record ?? "未接入"}`,
          `总页数：${report.snapshotCoverage.total_page ?? "未接入"}`
        ])
      : "- 未接入",
    "",
    "## 金额口径拆分（订单池）",
    report.snapshotCoverage?.amount_breakdown
      ? renderList([
          `订单总金额：${report.snapshotCoverage.amount_breakdown.total_amount ?? "未接入"}`,
          `商品小计：${report.snapshotCoverage.amount_breakdown.item_subtotal_amount ?? "未接入"}`,
          `运费金额：${report.snapshotCoverage.amount_breakdown.shipping_fee_amount ?? "未接入"}`,
          `含税总金额：${report.snapshotCoverage.amount_breakdown.total_with_tax_amount ?? "未接入"}`,
          `产品金额合计：${report.snapshotCoverage.amount_breakdown.product_total_amount ?? "未接入"}`
        ])
      : "- 未接入",
    "",
    "## 订单状态分布",
    report.snapshotCoverage?.order_status_distribution?.length
      ? renderList(
          report.snapshotCoverage.order_status_distribution.map(
            (item) => `${item.label ?? item.code}：订单 ${item.order_count ?? 0}`
          )
        )
      : "- 未接入",
    "",
    "## 发货方式分布",
    report.snapshotCoverage?.shipping_type_distribution?.length
      ? renderList(
          report.snapshotCoverage.shipping_type_distribution.map(
            (item) => `${item.label ?? item.code}：订单 ${item.order_count ?? 0}`
          )
        )
      : "- 未接入",
    "",
    "## 买家国家/地区分布",
    report.buyerCountryDistribution.length
      ? renderList(report.buyerCountryDistribution.map(buildCountryLine))
      : "- 未接入",
    "",
    "## 发货国家/地区分布",
    report.shippingCountryDistribution.length
      ? renderList(report.shippingCountryDistribution.map(buildCountryLine))
      : "- 未接入",
    "",
    "## 产品贡献",
    report.productContributionTop.length
      ? renderList(report.productContributionTop.map(buildContributionLine))
      : "- 未接入",
    "",
    "## 可立即执行",
    report.actionsReady.length ? renderList(report.actionsReady) : "- 暂无",
    "",
    "## 需要补更多数据后再执行",
    report.actionsNeedMoreData.length
      ? renderList(report.actionsNeedMoreData)
      : "- 暂无",
    "",
    "## 当前口径说明",
    report.limitations.length ? renderList(report.limitations) : "- 暂无"
  ].join("\n");
}

export function buildWikaTrafficMarketReport({
  period = "30d",
  overviewResult,
  overviewSummary
}) {
  const keyMarkets = Array.isArray(overviewResult?.key_market_distribution)
    ? overviewResult.key_market_distribution.slice(0, 10)
    : [];
  const marketChanges = Array.isArray(overviewResult?.market_structure_changes)
    ? overviewResult.market_structure_changes.slice(0, 10)
    : [];
  const top1Share = keyMarkets[0]?.visitor_share ?? null;
  const top3Share = keyMarkets.length ? sumShares(keyMarkets, 3) : null;

  return {
    reportType: "traffic_market_report",
    account: "wika",
    period,
    dataStatus: "verified_overview_plus_market_profile",
    overviewSnapshot: {
      snapshot_date: overviewResult?.snapshot?.snapshot_date ?? null,
      snapshot_range: overviewResult?.snapshot?.snapshot_range ?? null,
      total_impressions: overviewResult?.snapshot?.total_impressions ?? null,
      total_clicks: overviewResult?.snapshot?.total_clicks ?? null,
      click_through_rate: formatPercent(
        overviewResult?.snapshot?.click_through_rate ?? null
      ),
      store_uv: overviewResult?.snapshot?.store_uv ?? null,
      daily_inquiries: overviewResult?.snapshot?.daily_inquiries ?? null,
      inquiry_rate_by_uv: formatPercent(
        overviewResult?.snapshot?.inquiry_rate_by_uv ?? null
      ),
      order_count: overviewResult?.snapshot?.order_count ?? null,
      order_amount: overviewResult?.snapshot?.order_amount ?? null
    },
    trafficSourceHighlights: overviewSummary?.traffic_source_highlights ?? [],
    marketProfile: {
      profile_period: overviewResult?.market_profile_period ?? null,
      baseline_period: overviewResult?.market_profile_baseline_period ?? null,
      buyer_total_visitor_count:
        overviewResult?.buyer_total_visitor_count ?? null
    },
    visitorCountryDistribution: keyMarkets,
    marketStructureChanges: marketChanges,
    marketConcentration: {
      top1_country: keyMarkets[0]?.country_name ?? keyMarkets[0]?.country_code ?? null,
      top1_share: top1Share,
      top3_share: top3Share,
      risk_level: inferMarketConcentrationRisk(top1Share)
    },
    actionsReady: overviewSummary?.next_actions ?? [],
    actionsNeedMoreData: [
      "customerProfile 的 extraInfo 当前仅保留原始值，时间粒度和语义仍需后续继续核对。"
    ],
    limitations: overviewResult?.limitations ?? []
  };
}

export function renderWikaTrafficMarketReportMarkdown(report) {
  return [
    `# WIKA 流量与市场报告（${report.period}）`,
    "",
    "## 概览核心指标",
    renderList([
      `快照日期：${report.overviewSnapshot.snapshot_date ?? "未接入"}`,
      `快照范围：${report.overviewSnapshot.snapshot_range ?? "未接入"}`,
      `曝光：${report.overviewSnapshot.total_impressions ?? "未接入"}`,
      `点击：${report.overviewSnapshot.total_clicks ?? "未接入"}`,
      `点击率：${report.overviewSnapshot.click_through_rate ?? "未接入"}`,
      `访客：${report.overviewSnapshot.store_uv ?? "未接入"}`,
      `商机相关 UV：${report.overviewSnapshot.daily_inquiries ?? "未接入"}`,
      `UV 商机率：${report.overviewSnapshot.inquiry_rate_by_uv ?? "未接入"}`,
      `概览订单数：${report.overviewSnapshot.order_count ?? "未接入"}`,
      `概览订单金额：${report.overviewSnapshot.order_amount ?? "未接入"}`
    ]),
    "",
    "## 主要流量来源",
    report.trafficSourceHighlights.length
      ? renderList(
          report.trafficSourceHighlights.map(
            (item) =>
              `${item.channel_type}：访客 ${item.detail_uv ?? 0}，TM UV ${item.tm_uv ?? 0}，商机相关 UV ${item.fb_uv ?? 0}，商机率 ${item.visitor_to_fb_rate ?? "未接入"}`
          )
        )
      : "- 未接入",
    "",
    "## 访客国家/地区分布",
    report.visitorCountryDistribution.length
      ? renderList(report.visitorCountryDistribution.map(buildMarketLine))
      : "- 未接入",
    "",
    "## 市场结构变化",
    report.marketStructureChanges.length
      ? renderList(report.marketStructureChanges.map(buildMarketChangeLine))
      : "- 未接入",
    "",
    "## 市场集中度风险",
    renderList([
      `Top1 市场：${report.marketConcentration.top1_country ?? "未接入"}`,
      `Top1 占比：${formatPercent(report.marketConcentration.top1_share) ?? "未接入"}`,
      `Top3 占比：${formatPercent(report.marketConcentration.top3_share) ?? "未接入"}`,
      `风险等级：${report.marketConcentration.risk_level ?? "unknown"}`
    ]),
    "",
    "## 可立即执行",
    report.actionsReady.length ? renderList(report.actionsReady) : "- 暂无",
    "",
    "## 需要补更多数据后再执行",
    report.actionsNeedMoreData.length
      ? renderList(report.actionsNeedMoreData)
      : "- 暂无",
    "",
    "## 当前口径说明",
    report.limitations.length ? renderList(report.limitations) : "- 暂无"
  ].join("\n");
}
