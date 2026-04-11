import { createEmptyManagementReport } from "../../../../shared/data/report-templates/report-shapes.js";

function formatPercent(value) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return null;
  }

  return `${(Number(value) * 100).toFixed(2)}%`;
}

function pickActionBucket(recommendation) {
  if (!recommendation || typeof recommendation !== "object") {
    return "actionsNeedMoreData";
  }

  if (
    [
      "coverage_limit",
      "data_expansion",
      "official_only_gap",
      "performance_only_gap"
    ].includes(recommendation.type)
  ) {
    return "actionsNeedMoreData";
  }

  return "actionsReady";
}

function renderList(items) {
  return items.map((item) => `- ${item}`).join("\n");
}

function buildCountryLine(item) {
  return `${item.country_name ?? item.country_code}：订单 ${item.order_count ?? 0}，订单金额 ${item.total_amount ?? 0}`;
}

function buildProductContributionLine(item) {
  return `${item.product_name}：涉及订单 ${item.order_count ?? 0}，数量 ${item.quantity_total ?? 0}，估算金额 ${item.estimated_amount_total ?? 0}`;
}

function buildVisitorCountryLine(item) {
  return `${item.country_name ?? item.country_code}：访客 ${item.visitor_count ?? 0}，占比 ${formatPercent(item.visitor_share) ?? "未接入"}`;
}

function buildMarketStructureLine(item) {
  const changePrefix = (item.share_change_pp ?? 0) > 0 ? "+" : "";

  return `${item.country_name ?? item.country_code}：当前访客 ${item.current_visitor_count ?? 0}，当前占比 ${formatPercent(item.current_visitor_share) ?? "未接入"}，对比 ${item.baseline_period ?? "基线"} 变化 ${changePrefix}${item.share_change_pp ?? 0} 个百分点`;
}

export function renderWikaManagementSummaryMarkdown(report) {
  const sections = [
    `# WIKA 经营简报（${report.period}）`,
    "",
    "## 本周期概览",
    renderList([
      `数据状态：${report.dataStatus}`,
      `曝光：${report.overview.totalImpressions ?? "未接入"}`,
      `点击：${report.overview.totalClicks ?? "未接入"}`,
      `点击率：${report.overview.clickThroughRate ?? "未接入"}`,
      `访客：${report.overview.storeUv ?? "未接入"}`,
      `商机相关 UV：${report.overview.dailyInquiries ?? "未接入"}`,
      `UV 商机率：${report.overview.inquiryRateByUv ?? "未接入"}`,
      `概览订单数：${report.overview.orderCount ?? "未接入"}`,
      `概览订单金额：${report.overview.orderAmount ?? "未接入"}`
    ]),
    "",
    "## 访客国家/地区分布",
    report.overviewMarket?.keyMarketDistribution?.length
      ? renderList(report.overviewMarket.keyMarketDistribution.map(buildVisitorCountryLine))
      : "- 未接入",
    "",
    "## 市场结构变化",
    report.overviewMarket?.marketStructureChanges?.length
      ? renderList(report.overviewMarket.marketStructureChanges.map(buildMarketStructureLine))
      : "- 未接入",
    "",
    "## 订单经营摘要",
    report.orderHighlights?.current?.receivedOrderAmount === undefined
      ? "- 未接入"
      : renderList([
          `周期：${report.orderHighlights.current.period ?? "未接入"}`,
          `摘要口径：${report.orderHighlights.current.summaryScope ?? "未接入"}`,
          `实收相关金额：${report.orderHighlights.current.receivedOrderAmount ?? "未接入"}`,
          `成功订单数：${report.orderHighlights.current.successfulOrderCount ?? "未接入"}`,
          `创建订单数：${report.orderHighlights.current.createdOrderCount ?? "未接入"}`,
          `成功买家数：${report.orderHighlights.current.successfulBuyerCount ?? "未接入"}`,
          `退款订单率：${report.orderHighlights.current.refundOrderRate ?? "未接入"}`,
          `订单转成功率：${report.orderHighlights.current.createToSuccessRate ?? "未接入"}`
        ]),
    "",
    "## 订单分页池覆盖",
    !report.orderHighlights?.snapshotCoverage?.returnedItemCount
      ? "- 未接入"
      : renderList([
          `覆盖口径：${report.orderHighlights.snapshotCoverage.snapshotScope ?? "未接入"}`,
          `起始页：${report.orderHighlights.snapshotCoverage.currentPage ?? "未接入"}`,
          `页大小：${report.orderHighlights.snapshotCoverage.pageSize ?? "未接入"}`,
          `已拉取页数：${report.orderHighlights.snapshotCoverage.pagesFetched ?? "未接入"}`,
          `是否覆盖全部分页：${report.orderHighlights.snapshotCoverage.fullyCovered === true ? "是" : "否"}`,
          `已读取订单数：${report.orderHighlights.snapshotCoverage.returnedItemCount ?? "未接入"}`,
          `列表总记录数：${report.orderHighlights.snapshotCoverage.totalRecord ?? "未接入"}`,
          `列表总页数：${report.orderHighlights.snapshotCoverage.totalPage ?? "未接入"}`
        ]),
    "",
    "## 买家国家/地区分布",
    report.orderHighlights?.buyerCountryDistribution?.length
      ? renderList(report.orderHighlights.buyerCountryDistribution.map(buildCountryLine))
      : "- 未接入",
    "",
    "## 发货国家/地区分布",
    report.orderHighlights?.shippingCountryDistribution?.length
      ? renderList(report.orderHighlights.shippingCountryDistribution.map(buildCountryLine))
      : "- 未接入",
    "",
    "## 订单产品贡献",
    report.orderHighlights?.productContributionTop?.length
      ? renderList(report.orderHighlights.productContributionTop.map(buildProductContributionLine))
      : "- 未接入",
    "",
    "## 主要流量来源",
    report.trafficSourceHighlights.length === 0
      ? "- 未接入"
      : renderList(
          report.trafficSourceHighlights.map(
            (item) =>
              `${item.channelType}：访客 ${item.detailUv ?? 0}，TM UV ${item.tmUv ?? 0}，商机相关 UV ${item.fbUv ?? 0}，商机率 ${item.visitorToFbRate ?? "未接入"}`
          )
        ),
    "",
    "## 重点增长点",
    report.growthPoints.length === 0 ? "- 暂无" : renderList(report.growthPoints),
    "",
    "## 当前问题",
    report.issues.length === 0 ? "- 暂无" : renderList(report.issues),
    "",
    "## 重点产品",
    report.productHighlights.topTraffic.length === 0
      ? "- 未接入"
      : renderList(
          report.productHighlights.topTraffic.map(
            (item) =>
              `${item.productName}（ID: ${item.productId}）：detail_uv ${item.detailUv ?? 0}，business_rate ${item.businessRate ?? "未接入"}，order_uv ${item.orderUv ?? 0}`
          )
        ),
    "",
    "## 可以立即执行",
    report.actionsReady.length === 0 ? "- 暂无" : renderList(report.actionsReady),
    "",
    "## 需要补更多数据后再执行",
    report.actionsNeedMoreData.length === 0
      ? "- 暂无"
      : renderList(report.actionsNeedMoreData)
  ];

  return sections.join("\n");
}

export function buildWikaManagementSummaryReport({
  period = "30d",
  overviewResult,
  overviewSummary,
  orderResult,
  orderSummary,
  productUnifiedSummary,
  productUnifiedRecommendations,
  productPerformanceSummary,
  productRecommendations = []
}) {
  const report = createEmptyManagementReport({
    account: "wika",
    period
  });

  report.dataStatus = productUnifiedSummary
    ? "verified_overview_orders_plus_unified_products"
    : "verified_page_request_data";

  report.overview = {
    snapshotDate: overviewResult?.snapshot?.snapshot_date ?? null,
    totalImpressions: overviewResult?.snapshot?.total_impressions ?? null,
    totalClicks: overviewResult?.snapshot?.total_clicks ?? null,
    clickThroughRate: formatPercent(
      overviewResult?.snapshot?.click_through_rate ?? null
    ),
    storeUv: overviewResult?.snapshot?.store_uv ?? null,
    dailyInquiries: overviewResult?.snapshot?.daily_inquiries ?? null,
    inquiryRateByUv: formatPercent(
      overviewResult?.snapshot?.inquiry_rate_by_uv ?? null
    ),
    orderCount: overviewResult?.snapshot?.order_count ?? null,
    orderAmount: overviewResult?.snapshot?.order_amount ?? null
  };

  report.overviewMarket = {
    profilePeriod: overviewResult?.market_profile_period ?? null,
    baselinePeriod: overviewResult?.market_profile_baseline_period ?? null,
    buyerTotalVisitorCount: overviewResult?.buyer_total_visitor_count ?? null,
    visitorCountryDistribution:
      overviewResult?.visitor_country_distribution ?? [],
    keyMarketDistribution: overviewResult?.key_market_distribution?.slice(0, 5) ?? [],
    marketStructureChanges:
      overviewResult?.market_structure_changes?.slice(0, 5) ?? []
  };

  report.orderHighlights = {
    current: orderSummary
      ? {
          period: orderSummary.snapshot.period,
          summaryScope: orderResult?.summary?.summary_scope ?? null,
          statDate: orderSummary.snapshot.stat_date,
          statDateRange: orderSummary.snapshot.stat_date_range,
          createdOrderCount: orderSummary.snapshot.created_order_count,
          successfulOrderCount: orderSummary.snapshot.successful_order_count,
          receivedOrderAmount: orderSummary.snapshot.received_order_amount,
          realReceivedOrderAmount:
            orderSummary.snapshot.real_received_order_amount,
          successfulBuyerCount: orderSummary.snapshot.successful_buyer_count,
          refundOrderRate: formatPercent(orderSummary.snapshot.refund_order_rate),
          createToSuccessRate: formatPercent(
            orderSummary.snapshot.create_to_success_rate
          )
        }
      : {},
    comparison: orderSummary?.comparison
      ? {
          statDate: orderSummary.comparison.stat_date,
          createdOrderCount: orderSummary.comparison.created_order_count,
          successfulOrderCount: orderSummary.comparison.successful_order_count,
          receivedOrderAmount: orderSummary.comparison.received_order_amount,
          successfulBuyerCount: orderSummary.comparison.successful_buyer_count
        }
      : null,
    trend: orderSummary?.trend_highlights
      ? {
          trendPointsCount: orderSummary.trend_highlights.trend_points_count,
          latestTrendDate: orderSummary.trend_highlights.latest_trend_date,
          earliestTrendDate: orderSummary.trend_highlights.earliest_trend_date,
          peakReceivedAmountDay:
            orderSummary.trend_highlights.peak_received_amount_day
        }
      : {},
    snapshotCoverage: orderSummary?.order_list_snapshot
      ? {
          snapshotScope: orderSummary.order_list_snapshot.snapshot_scope,
          currentPage: orderSummary.order_list_snapshot.current_page,
          pageSize: orderSummary.order_list_snapshot.page_size,
          returnedItemCount:
            orderSummary.order_list_snapshot.returned_item_count,
          totalRecord: orderSummary.order_list_snapshot.total_record,
          totalPage: orderSummary.order_list_snapshot.total_page,
          pagesFetched: orderSummary.order_list_snapshot.pages_fetched,
          fullyCovered: orderSummary.order_list_snapshot.fully_covered
        }
      : {},
    buyerCountryDistribution:
      orderSummary?.order_list_snapshot?.buyer_country_distribution ?? [],
    shippingCountryDistribution:
      orderSummary?.order_list_snapshot?.shipping_country_distribution ?? [],
    productContributionTop:
      orderSummary?.order_list_snapshot?.top_product_contribution ?? []
  };

  report.trafficSourceHighlights = [
    ...(overviewResult?.traffic_sources ?? []).slice(0, 5).map((item) => ({
      channelType: item.channel_type,
      detailUv: item.detail_uv,
      fbUv: item.fb_uv,
      tmUv: item.tm_uv,
      visitorToFbRate: formatPercent(item.visitor_to_fb_rate)
    }))
  ];

  report.growthPoints = [
    ...(overviewSummary?.growth_points ?? []),
    ...(orderSummary?.growth_points ?? [])
  ];
  report.issues = [
    ...(overviewSummary?.issues ?? []),
    ...(orderSummary?.issues ?? [])
  ];

  if (productUnifiedSummary) {
    report.productHighlights = {
      topTraffic: [...(productUnifiedSummary.focus_products ?? [])].map((item) => ({
        productId: item.product_id,
        productName: item.product_name,
        detailUv: item.detail_uv,
        businessRate: item.business_rate,
        orderUv: item.order_uv
      })),
      highBusinessRate: [...(productUnifiedSummary.focus_products ?? [])]
        .filter((item) => item.business_rate)
        .map((item) => ({
          productId: item.product_id,
          productName: item.product_name,
          detailUv: item.detail_uv,
          businessRate: item.business_rate,
          orderUv: item.order_uv
        })),
      highTrafficLowBusiness: [...(productUnifiedSummary.focus_products ?? [])]
        .filter((item) => item.detail_uv && item.business_rate)
        .map((item) => ({
          productId: item.product_id,
          productName: item.product_name,
          detailUv: item.detail_uv,
          businessRate: item.business_rate,
          orderUv: item.order_uv
        }))
    };
  } else {
    report.productHighlights = {
      topTraffic: [
        ...(productPerformanceSummary?.top_traffic_products ?? []).map((item) => ({
          productId: item.product_id,
          productName: item.product_name,
          detailUv: item.detail_uv,
          businessRate: item.business_rate,
          orderUv: item.order_uv
        }))
      ],
      highBusinessRate: [
        ...(productPerformanceSummary?.high_business_rate_products ?? []).map(
          (item) => ({
            productId: item.product_id,
            productName: item.product_name,
            detailUv: item.detail_uv,
            businessRate: item.business_rate,
            orderUv: item.order_uv
          })
        )
      ],
      highTrafficLowBusiness: [
        ...(productPerformanceSummary?.high_traffic_low_business_products ?? []).map(
          (item) => ({
            productId: item.product_id,
            productName: item.product_name,
            detailUv: item.detail_uv,
            businessRate: item.business_rate,
            orderUv: item.order_uv
          })
        )
      ]
    };
  }

  const overviewMarketHighlights = report.overviewMarket.keyMarketDistribution.length
    ? report.overviewMarket.keyMarketDistribution.map((item) => ({
        title: `${item.country_name ?? item.country_code} 访客市场`,
        detail: `当前周期访客 ${item.visitor_count ?? 0}，占买家访客 ${formatPercent(item.visitor_share) ?? "未接入"}。`
      }))
    : [];

  const fallbackOrderMarketHighlights =
    report.orderHighlights.shippingCountryDistribution.length
      ? report.orderHighlights.shippingCountryDistribution.map((item) => ({
          title: `${item.country_name ?? item.country_code} 订单国家/地区池`,
          detail:
            report.orderHighlights.snapshotCoverage.fullyCovered === true
              ? `当前已基于分页订单池统计该国家/地区，订单 ${item.order_count}，订单金额 ${item.total_amount ?? 0}。`
              : `当前仅基于部分分页池统计该国家/地区，订单 ${item.order_count}，订单金额 ${item.total_amount ?? 0}。`
        }))
      : [];

  report.marketHighlights =
    overviewMarketHighlights.length > 0
      ? overviewMarketHighlights
      : fallbackOrderMarketHighlights.length > 0
        ? fallbackOrderMarketHighlights
        : [
            {
              title: "国家与市场维度暂未稳定接入",
              detail:
                "当前已接入流量来源、产品主数据/表现和订单 summary/trend，但完整国家与市场结构仍需继续补字段。"
            }
          ];

  const classifiedRecommendations = [
    ...(overviewSummary?.next_actions ?? []).map((action) => ({
      type: "overview_action",
      action
    })),
    ...(orderSummary?.next_actions ?? []).map((action) => ({
      type: "order_action",
      action
    })),
    ...((productUnifiedRecommendations?.actions_ready ?? []).map((item) => ({
      type: item.type,
      action: item.action
    }))),
    ...productRecommendations
  ];

  for (const recommendation of classifiedRecommendations) {
    const bucket = pickActionBucket(recommendation);
    report[bucket].push(recommendation.action);
  }

  report.actionsNeedMoreData.push(
    ...(orderSummary?.next_actions_need_more_data ?? [])
  );

  if (report.actionsNeedMoreData.length === 0) {
    if ((productUnifiedRecommendations?.actions_need_more_data ?? []).length > 0) {
      report.actionsNeedMoreData.push(
        ...productUnifiedRecommendations.actions_need_more_data.map(
          (item) => item.action
        )
      );
    } else {
      report.actionsNeedMoreData.push(
        "继续补接国家/市场与订单结构维度，再决定市场差异化投放和国家级产品布局。"
      );
    }
  }

  report.nextActions = [...report.actionsReady];

  return report;
}
