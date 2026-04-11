import {
  createSourceDescriptor,
  DATA_QUALITY_STATUS
} from "../../../../shared/data/clients/source-status.js";
import { fetchAlibabaSellerPageJson } from "../../../../shared/data/clients/alibaba-seller-page-client.js";

const OVERVIEW_URLS = Object.freeze({
  homepageCards: "https://i.alibaba.com/ajax/homepageAiModuleQuerySummary.do",
  shopSummary:
    "https://mydata.alibaba.com/self/.json?action=OneAction&iName=vip/home/custom/getShopSummary",
  realtimeTrend:
    "https://hz-mydata.alibaba.com/self/.json?action=OneAction&iName=mobile/realTime/trends&isVip=true",
  trafficSourceSummary:
    "https://mydata.alibaba.com/self/.json?action=OneAction&iName=vip/channel/summary&isVip=true",
  customerProfile:
    "https://mydata.alibaba.com/self/.json?action=OneAction&iName=customerAdviser/customerProfile"
});

const PERIOD_CONFIGS = Object.freeze({
  "7d": {
    label: "近7天"
  },
  "30d": {
    label: "近30天"
  },
  "90d": {
    label: "近90天"
  }
});

const TRAFFIC_SOURCE_TREND_INDICATOR = "shop_uv";
const DEFAULT_PERIOD = "30d";
const MARKET_PROFILE_REFERER =
  "https://data.alibaba.com/marketing/insight?isNewPage=true";

const VERIFIED_FIELD_SET = Object.freeze([
  "cards.pending_inquiries_to_reply",
  "cards.pending_rfq_count",
  "cards.pending_order_count",
  "cards.pending_activity_count",
  "snapshot.snapshot_date",
  "snapshot.snapshot_range",
  "snapshot.total_impressions",
  "snapshot.total_clicks",
  "snapshot.click_through_rate",
  "snapshot.store_uv",
  "snapshot.store_pv",
  "snapshot.daily_inquiries",
  "snapshot.inquiry_rate_by_uv",
  "snapshot.order_count",
  "snapshot.order_amount",
  "snapshot.search_impressions",
  "snapshot.search_clicks",
  "snapshot.natural_impressions",
  "snapshot.natural_clicks",
  "snapshot.paid_impressions",
  "snapshot.paid_clicks",
  "snapshot.message_uv",
  "snapshot.buyer_uv",
  "snapshot.reply_rate",
  "snapshot.reply_within_5min_rate_30d",
  "snapshot.average_reply_time_hours",
  "traffic_sources.channel_type",
  "traffic_sources.detail_uv",
  "traffic_sources.fb_uv",
  "traffic_sources.tm_uv",
  "traffic_sources.visitor_to_fb_rate",
  "realtime_hourly.hour",
  "realtime_hourly.total_impressions",
  "realtime_hourly.total_clicks",
  "realtime_hourly.visit_uv",
  "realtime_hourly.tm_uv",
  "realtime_hourly.fb_uv",
  "realtime_hourly.search_impressions",
  "realtime_hourly.search_clicks",
  "visitor_country_distribution.country_code",
  "visitor_country_distribution.country_name",
  "visitor_country_distribution.visitor_count",
  "visitor_country_distribution.visitor_share",
  "visitor_country_distribution.extra_info_raw",
  "key_market_distribution.country_code",
  "key_market_distribution.country_name",
  "key_market_distribution.visitor_count",
  "key_market_distribution.visitor_share",
  "market_structure_changes.country_code",
  "market_structure_changes.current_visitor_count",
  "market_structure_changes.current_visitor_share",
  "market_structure_changes.baseline_visitor_count",
  "market_structure_changes.baseline_visitor_share",
  "market_structure_changes.share_change_pp"
]);

const COUNTRY_NAME_OVERRIDES = Object.freeze({
  UK: "United Kingdom"
});

function resolvePeriod(period = DEFAULT_PERIOD) {
  return PERIOD_CONFIGS[period] ? period : DEFAULT_PERIOD;
}

function resolvePeriodLabel(period = DEFAULT_PERIOD) {
  return PERIOD_CONFIGS[resolvePeriod(period)].label;
}

function resolveMarketProfilePeriod(period = DEFAULT_PERIOD) {
  const normalizedPeriod = resolvePeriod(period);
  if (normalizedPeriod === "7d" || normalizedPeriod === "30d") {
    return normalizedPeriod;
  }

  return "30d";
}

function resolveMarketBaselinePeriod(period = DEFAULT_PERIOD) {
  const normalizedPeriod = resolvePeriod(period);
  if (normalizedPeriod === "7d") {
    return "30d";
  }

  if (normalizedPeriod === "30d") {
    return "90d";
  }

  return null;
}

function toNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseMetricValue(metric) {
  if (metric && typeof metric === "object" && "value" in metric) {
    return toNumber(metric.value);
  }

  return toNumber(metric);
}

function safeDivide(numerator, denominator, digits = 4) {
  const left = toNumber(numerator);
  const right = toNumber(denominator);
  if (left === null || right === null || right === 0) {
    return null;
  }

  return Number((left / right).toFixed(digits));
}

function formatPercent(value) {
  const parsed = toNumber(value);
  if (parsed === null) {
    return null;
  }

  return `${(parsed * 100).toFixed(2)}%`;
}

function ensureJsonSuccess(payload, sourceName) {
  if (!payload || typeof payload !== "object") {
    throw new Error(`${sourceName} returned an empty payload`);
  }

  if ("result" in payload && payload.result !== "success") {
    throw new Error(`${sourceName} did not return success result`);
  }

  if ("code" in payload && Number(payload.code) !== 0) {
    throw new Error(
      `${sourceName} returned code ${payload.code}: ${payload.message ?? "unknown error"}`
    );
  }
}

function buildShopSummaryUrl(period) {
  const url = new URL(OVERVIEW_URLS.shopSummary);
  url.searchParams.set("action", "OneAction");
  url.searchParams.set("iName", "vip/home/custom/getShopSummary");
  url.searchParams.set("simpleStat", "true");
  url.searchParams.set("nd", resolvePeriod(period));
  url.searchParams.set("isVip", "true");
  return url.toString();
}

function buildMarketProfileUrl(period) {
  const url = new URL(OVERVIEW_URLS.customerProfile);
  url.searchParams.set("action", "OneAction");
  url.searchParams.set("iName", "customerAdviser/customerProfile");
  url.searchParams.set("byrGroup", "custbank");
  url.searchParams.set("nd", period);
  url.searchParams.set("byrGrowthLevel", "TOTAL");
  url.searchParams.set("isDistinctCrossDay", "Y");
  url.searchParams.set("isRfqSubscribe", "false");
  return url.toString();
}

function normalizeCards(payload) {
  ensureJsonSuccess(payload, "homepageAiModuleQuerySummary");
  const items = Array.isArray(payload.data) ? payload.data : [];

  const cardMap = new Map(items.map((item) => [item.id, item]));
  const getValue = (id) => toNumber(cardMap.get(id)?.data?.value) ?? 0;

  return {
    raw_items: items,
    pending_inquiries_to_reply: getValue("fb"),
    pending_rfq_count: getValue("rfq"),
    pending_order_count: getValue("order"),
    pending_activity_count: getValue("compaignSign"),
    pending_semi_managed_signups: getValue("semi")
  };
}

function normalizeShopSummary(payload, period) {
  ensureJsonSuccess(payload, "vip/home/custom/getShopSummary");
  const row = payload?.data?.returnValue?.[0] ?? {};

  const snapshot = {
    snapshot_date: row?.statDate?.value ?? row?.statDate ?? null,
    snapshot_range: row?.statDateRange ?? resolvePeriod(period),
    total_impressions: parseMetricValue(row.totalImpsCnt),
    total_clicks: parseMetricValue(row.totalClkCnt),
    store_uv: parseMetricValue(row.shopUv),
    store_pv: parseMetricValue(row.shopPv),
    daily_inquiries: parseMetricValue(row.fbUv),
    order_count: parseMetricValue(row.ordCnt),
    order_amount: parseMetricValue(row.ordAmt),
    search_impressions: parseMetricValue(row.searchImpls),
    search_clicks: parseMetricValue(row.searchClicks),
    natural_impressions: parseMetricValue(row.natureExposureCnt),
    natural_clicks: parseMetricValue(row.natureClickCnt),
    paid_impressions: parseMetricValue(row.p4pExposureCnt),
    paid_clicks: parseMetricValue(row.p4pClickCnt),
    message_uv: parseMetricValue(row.tmUv),
    buyer_uv: parseMetricValue(row.busByrCnt),
    reply_rate: parseMetricValue(row.replyRate),
    reply_within_5min_rate_30d: parseMetricValue(row.fst5minReplyRate30d),
    average_reply_time_hours: parseMetricValue(row.avgReplyTime),
    total_business_count: parseMetricValue(row.totalBusCnt)
  };

  snapshot.click_through_rate = safeDivide(
    snapshot.total_clicks,
    snapshot.total_impressions
  );
  snapshot.inquiry_rate_by_uv = safeDivide(
    snapshot.daily_inquiries,
    snapshot.store_uv
  );
  snapshot.search_click_through_rate = safeDivide(
    snapshot.search_clicks,
    snapshot.search_impressions
  );
  snapshot.natural_click_through_rate = safeDivide(
    snapshot.natural_clicks,
    snapshot.natural_impressions
  );
  snapshot.paid_click_through_rate = safeDivide(
    snapshot.paid_clicks,
    snapshot.paid_impressions
  );

  return {
    snapshot,
    raw_summary_fields: row
  };
}

function normalizeTrafficSources(payload) {
  ensureJsonSuccess(payload, "vip/channel/summary");
  const rows = Array.isArray(payload.data) ? payload.data : [];

  return rows
    .map((row) => ({
      channel_type: row.channelType ?? null,
      channel_type_display: row.channelTypeDisplay ?? null,
      detail_uv: toNumber(row.detailUv),
      fb_uv: toNumber(row.fbUv),
      tm_uv: toNumber(row.tmUv),
      visitor_to_fb_rate: toNumber(row.uvAbRate),
      stat_date: row.statDate ?? null
    }))
    .sort((left, right) => (right.detail_uv ?? 0) - (left.detail_uv ?? 0));
}

function normalizeRealtime(payload) {
  ensureJsonSuccess(payload, "mobile/realTime/trends");
  const statResult = payload?.data?.statResult ?? payload?.data?.prevResult ?? {};
  const rows = Object.entries(statResult)
    .sort(([left], [right]) => Number(left) - Number(right))
    .map(([hour, row]) => ({
      hour: Number(hour),
      total_impressions: toNumber(row.totalExpTotal),
      total_clicks: toNumber(row.totalClkTotal),
      visit_uv: toNumber(row.visitUvTotal),
      tm_uv: toNumber(row.tmUvTotal),
      fb_uv: toNumber(row.fbUvTotal),
      search_impressions: toNumber(row.seExpTotal),
      search_clicks: toNumber(row.seClkTotal)
    }));

  const latest = rows.at(-1) ?? null;
  const peakExposure = [...rows].sort(
    (left, right) => (right.total_impressions ?? 0) - (left.total_impressions ?? 0)
  )[0] ?? null;
  const peakClick = [...rows].sort(
    (left, right) => (right.total_clicks ?? 0) - (left.total_clicks ?? 0)
  )[0] ?? null;

  return {
    realtime_hourly: rows,
    realtime_latest_cumulative: latest,
    realtime_peak_exposure_hour: peakExposure,
    realtime_peak_click_hour: peakClick
  };
}

function toCountryName(countryCode) {
  if (!countryCode) {
    return null;
  }

  const rawCode = String(countryCode).toUpperCase();
  if (COUNTRY_NAME_OVERRIDES[rawCode]) {
    return COUNTRY_NAME_OVERRIDES[rawCode];
  }

  const normalizedCode = rawCode === "UK" ? "GB" : rawCode;

  try {
    const displayNames = new Intl.DisplayNames(["en"], {
      type: "region"
    });
    return displayNames.of(normalizedCode) ?? rawCode;
  } catch {
    return rawCode;
  }
}

function parseExtraInfoSeries(value) {
  if (!value) {
    return [];
  }

  return String(value)
    .split(",")
    .map((item) => toNumber(item))
    .filter((item) => item !== null);
}

function normalizeCountryDistribution(rows, totalVisitors) {
  const visitorTotal = totalVisitors > 0 ? totalVisitors : 0;

  return rows
    .map((row) => {
      const visitorCount = toNumber(row.visitorCnt) ?? 0;
      return {
        country_code: row.dimVal ?? null,
        country_name: toCountryName(row.dimVal),
        visitor_count: visitorCount,
        visitor_share: visitorTotal > 0 ? Number((visitorCount / visitorTotal).toFixed(4)) : null,
        extra_info_raw: row.extraInfo ?? null,
        extra_info_series: parseExtraInfoSeries(row.extraInfo)
      };
    })
    .sort((left, right) => (right.visitor_count ?? 0) - (left.visitor_count ?? 0));
}

function normalizeCustomerProfile(payload, profilePeriod) {
  ensureJsonSuccess(payload, "customerAdviser/customerProfile");
  const countryRows = Array.isArray(payload?.data?.country) ? payload.data.country : [];
  const buyerTotalVisitorCount = countryRows.reduce(
    (sum, row) => sum + (toNumber(row.visitorCnt) ?? 0),
    0
  );
  const visitorCountryDistribution = normalizeCountryDistribution(
    countryRows,
    buyerTotalVisitorCount
  );

  return {
    period: profilePeriod,
    buyer_total_visitor_count: buyerTotalVisitorCount,
    visitor_country_distribution: visitorCountryDistribution,
    key_market_distribution: visitorCountryDistribution.slice(0, 10)
  };
}

function buildMarketStructureChanges(currentRows, baselineRows, baselinePeriod) {
  const baselineMap = new Map(
    (baselineRows ?? []).map((item) => [item.country_code, item])
  );
  const currentMap = new Map((currentRows ?? []).map((item) => [item.country_code, item]));
  const countryCodes = new Set([
    ...currentMap.keys(),
    ...baselineMap.keys()
  ]);

  return [...countryCodes]
    .map((countryCode) => {
      const currentRow = currentMap.get(countryCode) ?? null;
      const baselineRow = baselineMap.get(countryCode) ?? null;
      const currentShare = currentRow?.visitor_share ?? 0;
      const baselineShare = baselineRow?.visitor_share ?? 0;

      return {
        country_code: countryCode,
        country_name: currentRow?.country_name ?? baselineRow?.country_name ?? toCountryName(countryCode),
        current_visitor_count: currentRow?.visitor_count ?? 0,
        current_visitor_share: currentRow?.visitor_share ?? 0,
        baseline_visitor_count: baselineRow?.visitor_count ?? 0,
        baseline_visitor_share: baselineRow?.visitor_share ?? 0,
        baseline_period: baselinePeriod,
        share_change_pp: Number(((currentShare - baselineShare) * 100).toFixed(2))
      };
    })
    .sort((left, right) => Math.abs(right.share_change_pp) - Math.abs(left.share_change_pp));
}

export async function fetchWikaOverviewSnapshot({ logPath, period = DEFAULT_PERIOD } = {}) {
  const resolvedPeriod = resolvePeriod(period);
  const marketProfilePeriod = resolveMarketProfilePeriod(resolvedPeriod);
  const marketBaselinePeriod = resolveMarketBaselinePeriod(resolvedPeriod);

  const [
    cardsResponse,
    summaryResponse,
    realtimeResponse,
    trafficSourceResponse,
    marketCurrentResponse,
    marketBaselineResult
  ] = await Promise.all([
    fetchAlibabaSellerPageJson(OVERVIEW_URLS.homepageCards, {
      logPath,
      referer: "https://i.alibaba.com/"
    }),
    fetchAlibabaSellerPageJson(buildShopSummaryUrl(resolvedPeriod), {
      logPath,
      referer: MARKET_PROFILE_REFERER
    }),
    fetchAlibabaSellerPageJson(OVERVIEW_URLS.realtimeTrend, {
      logPath,
      referer: MARKET_PROFILE_REFERER
    }),
    fetchAlibabaSellerPageJson(OVERVIEW_URLS.trafficSourceSummary, {
      logPath,
      referer: MARKET_PROFILE_REFERER
    }),
    fetchAlibabaSellerPageJson(buildMarketProfileUrl(marketProfilePeriod), {
      logPath,
      referer: MARKET_PROFILE_REFERER
    }),
    marketBaselinePeriod
      ? fetchAlibabaSellerPageJson(buildMarketProfileUrl(marketBaselinePeriod), {
          logPath,
          referer: MARKET_PROFILE_REFERER
        }).catch(() => null)
      : Promise.resolve(null)
  ]);

  const cards = normalizeCards(cardsResponse.json);
  const summaryResult = normalizeShopSummary(summaryResponse.json, resolvedPeriod);
  const trafficSources = normalizeTrafficSources(trafficSourceResponse.json);
  const realtime = normalizeRealtime(realtimeResponse.json);
  const marketCurrent = normalizeCustomerProfile(
    marketCurrentResponse.json,
    marketProfilePeriod
  );
  const marketBaseline = marketBaselineResult
    ? normalizeCustomerProfile(marketBaselineResult.json, marketBaselinePeriod)
    : null;

  const marketStructureChanges = buildMarketStructureChanges(
    marketCurrent.key_market_distribution,
    marketBaseline?.key_market_distribution ?? [],
    marketBaseline?.period ?? null
  );

  return {
    module: "overview",
    account: "wika",
    period: resolvedPeriod,
    period_label: resolvePeriodLabel(resolvedPeriod),
    read_only: true,
    verification_status: DATA_QUALITY_STATUS.VERIFIED,
    evidence_level: "L2",
    source_priority_selected: "page_request",
    sources: [
      createSourceDescriptor({
        module: "overview",
        sourceType: "official_api",
        status: DATA_QUALITY_STATUS.INTERFACE_NOT_FOUND,
        pendingFields: ["overview", "market_distribution"],
        notes: "No verified official overview API is currently wired in this repository."
      }),
      createSourceDescriptor({
        module: "overview",
        sourceType: "page_request",
        status: DATA_QUALITY_STATUS.VERIFIED,
        verifiedFields: VERIFIED_FIELD_SET,
        notes: "Verified from logged-in seller page requests captured through AliWorkbench cookies."
      })
    ],
    source_requests: [
      {
        name: "homepage_cards",
        url: cardsResponse.url,
        request_method: "GET",
        depends_on_current_token: false,
        requires_browser_login_state: true
      },
      {
        name: "shop_summary",
        url: summaryResponse.url,
        request_method: "GET",
        depends_on_current_token: false,
        requires_browser_login_state: true
      },
      {
        name: "realtime_trends",
        url: realtimeResponse.url,
        request_method: "GET",
        depends_on_current_token: false,
        requires_browser_login_state: true
      },
      {
        name: "traffic_source_summary",
        url: trafficSourceResponse.url,
        request_method: "GET",
        depends_on_current_token: false,
        requires_browser_login_state: true
      },
      {
        name: "customer_profile_market",
        url: marketCurrentResponse.url,
        request_method: "GET",
        depends_on_current_token: false,
        requires_browser_login_state: true
      },
      ...(marketBaselineResult
        ? [
            {
              name: "customer_profile_market_baseline",
              url: marketBaselineResult.url,
              request_method: "GET",
              depends_on_current_token: false,
              requires_browser_login_state: true
            }
          ]
        : [])
    ],
    verified_fields: VERIFIED_FIELD_SET,
    field_semantics: {
      cards: {
        pending_inquiries_to_reply: "Homepage card count for inquiries waiting for reply.",
        pending_rfq_count: "Homepage card count for new RFQ opportunities."
      },
      traffic_sources: {
        detail_uv: "Original page field detailUv.",
        fb_uv: "Original page field fbUv. Kept as-is and not renamed to inquiry count.",
        tm_uv: "Original page field tmUv.",
        visitor_to_fb_rate: "Original page field uvAbRate."
      },
      markets: {
        visitor_count: "Original customerProfile field visitorCnt aggregated by country.",
        visitor_share: "Calculated as visitor_count / buyer_total_visitor_count for the selected period.",
        extra_info_raw: "Raw extraInfo string returned by customerProfile. Time granularity is not confirmed yet.",
        share_change_pp: "Difference in visitor share percentage points between current market profile period and the baseline period."
      }
    },
    cards,
    snapshot: summaryResult.snapshot,
    traffic_sources: trafficSources,
    traffic_source_trends: [],
    realtime_hourly: realtime.realtime_hourly,
    realtime_latest_cumulative: realtime.realtime_latest_cumulative,
    realtime_peak_exposure_hour: realtime.realtime_peak_exposure_hour,
    realtime_peak_click_hour: realtime.realtime_peak_click_hour,
    market_profile_period: marketCurrent.period,
    market_profile_baseline_period: marketBaseline?.period ?? null,
    buyer_total_visitor_count: marketCurrent.buyer_total_visitor_count,
    visitor_country_distribution: marketCurrent.visitor_country_distribution,
    key_market_distribution: marketCurrent.key_market_distribution,
    market_structure_changes: marketStructureChanges,
    raw_summary_fields: summaryResult.raw_summary_fields,
    limitations: [
      "Overview and market data are currently verified from logged-in seller page requests, not from an official overview API.",
      "traffic_source_trends has not been re-verified in this restored reader and is intentionally left empty.",
      "customerProfile extraInfo is preserved raw because its exact time granularity is not yet confirmed.",
      marketBaseline
        ? `Market structure change compares ${marketCurrent.period} against ${marketBaseline.period}.`
        : "Market structure change baseline is unavailable for the current period."
    ]
  };
}

export function buildWikaOverviewManagementSummary(overviewResult) {
  const snapshot = overviewResult?.snapshot ?? {};
  const trafficSources = Array.isArray(overviewResult?.traffic_sources)
    ? overviewResult.traffic_sources
    : [];
  const keyMarkets = Array.isArray(overviewResult?.key_market_distribution)
    ? overviewResult.key_market_distribution.slice(0, 5)
    : [];
  const marketStructureChanges = Array.isArray(overviewResult?.market_structure_changes)
    ? overviewResult.market_structure_changes.slice(0, 5)
    : [];

  const topTrafficSource = trafficSources[0] ?? null;
  const topMarket = keyMarkets[0] ?? null;
  const risingMarket =
    marketStructureChanges.find(
      (item) =>
        (item.share_change_pp ?? 0) > 0.5 && (item.current_visitor_count ?? 0) >= 10
    ) ?? null;

  return {
    module: "overview",
    account: "wika",
    report_type: "management_summary",
    reporting_basis: "Verified seller page requests",
    overview: {
      date: snapshot.snapshot_date ?? null,
      total_impressions: snapshot.total_impressions ?? null,
      total_clicks: snapshot.total_clicks ?? null,
      click_through_rate: formatPercent(snapshot.click_through_rate),
      store_uv: snapshot.store_uv ?? null,
      daily_inquiries: snapshot.daily_inquiries ?? null,
      inquiry_rate_by_uv: formatPercent(snapshot.inquiry_rate_by_uv),
      order_count: snapshot.order_count ?? null,
      order_amount: snapshot.order_amount ?? null
    },
    growth_points: [
      snapshot.order_count
        ? `当前周期已有订单沉淀，订单数 ${snapshot.order_count}，订单金额 ${snapshot.order_amount ?? 0}。`
        : null,
      snapshot.reply_rate !== null && snapshot.reply_rate !== undefined
        ? `回复率保持在 ${formatPercent(snapshot.reply_rate)}，客服响应基础稳定。`
        : null,
      topTrafficSource
        ? `当前最大流量来源是 ${topTrafficSource.channel_type}，带来 ${topTrafficSource.detail_uv ?? 0} 个访客。`
        : null,
      topMarket
        ? `访客主要来自 ${topMarket.country_name ?? topMarket.country_code}，占买家访客 ${formatPercent(topMarket.visitor_share)}。`
        : null,
      risingMarket
        ? `${risingMarket.country_name ?? risingMarket.country_code} 的访客占比相较基线提升 ${risingMarket.share_change_pp.toFixed(2)} 个百分点。`
        : null
    ].filter(Boolean),
    issues: [
      topMarket && (topMarket.visitor_share ?? 0) >= 0.3
        ? `当前访客市场集中在 ${topMarket.country_name ?? topMarket.country_code}，需关注单一市场依赖风险。`
        : null,
      overviewResult?.limitations?.length
        ? "市场维度当前仍依赖页面接口，部分字段语义需要继续结合页面文案校验。"
        : "当前概览页未暴露明显异常，但仍需结合产品表现页继续定位问题来源。"
    ].filter(Boolean),
    next_actions: [
      topTrafficSource
        ? `先围绕 ${topTrafficSource.channel_type} 这个主要来源优化承接页，避免分散投入。`
        : null,
      topMarket && (topMarket.visitor_share ?? 0) >= 0.15
        ? `优先围绕 ${topMarket.country_name ?? topMarket.country_code} 优化重点产品承接页与市场文案。`
        : null,
      risingMarket
        ? `继续观察 ${risingMarket.country_name ?? risingMarket.country_code} 的市场增长，优先补齐适配产品和国家级表述。`
        : null
    ].filter(Boolean),
    traffic_source_highlights: trafficSources.slice(0, 5).map((item) => ({
      channel_type: item.channel_type,
      detail_uv: item.detail_uv,
      fb_uv: item.fb_uv,
      tm_uv: item.tm_uv,
      visitor_to_fb_rate: formatPercent(item.visitor_to_fb_rate)
    })),
    market_highlights: keyMarkets.map((item) => ({
      country_code: item.country_code,
      country_name: item.country_name,
      visitor_count: item.visitor_count,
      visitor_share: formatPercent(item.visitor_share)
    })),
    market_structure_highlights: marketStructureChanges.map((item) => ({
      country_code: item.country_code,
      country_name: item.country_name,
      current_visitor_count: item.current_visitor_count,
      current_visitor_share: formatPercent(item.current_visitor_share),
      baseline_period: item.baseline_period,
      share_change_pp: item.share_change_pp
    }))
  };
}
