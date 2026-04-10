import {
  fetchAlibabaOfficialOrderList
} from "./alibaba-official-orders.js";
import {
  fetchAlibabaOfficialOrderFund,
  fetchAlibabaOfficialOrderLogistics,
  fetchAlibabaOfficialProductDetail,
  fetchAlibabaOfficialProductScore
} from "./alibaba-official-extensions.js";
import {
  buildProductManagementSummary,
  fetchWikaProductList
} from "../../../projects/wika/data/products/module.js";
import {
  fetchWikaOperationsTrafficSummary,
  MYDATA_OVERVIEW_UNAVAILABLE_DIMENSIONS
} from "./alibaba-mydata-overview.js";
import {
  fetchWikaProductPerformanceSummary,
  MYDATA_PRODUCT_UNAVAILABLE_DIMENSIONS
} from "./alibaba-mydata-product-performance.js";

function toPositiveInteger(value, fallbackValue, maxValue = Number.POSITIVE_INFINITY) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallbackValue;
  }

  return Math.min(parsed, maxValue);
}

function toNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function safeArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && typeof value === "object") {
    return [value];
  }

  return [];
}

function summarizeDateWindow(dateValues = []) {
  const timestamps = dateValues
    .map((value) => Date.parse(String(value ?? "")))
    .filter((value) => Number.isFinite(value))
    .sort((left, right) => left - right);

  if (timestamps.length === 0) {
    return {
      start: null,
      end: null
    };
  }

  return {
    start: new Date(timestamps[0]).toISOString(),
    end: new Date(timestamps[timestamps.length - 1]).toISOString()
  };
}

function getAgeInDays(value) {
  const timestamp = Date.parse(String(value ?? ""));
  if (!Number.isFinite(timestamp)) {
    return null;
  }

  return Math.floor((Date.now() - timestamp) / (24 * 60 * 60 * 1000));
}

function countBy(items = [], resolver) {
  const output = {};

  for (const item of items) {
    const key = resolver(item);
    const normalizedKey =
      key === undefined || key === null || key === "" ? "UNKNOWN" : String(key);
    output[normalizedKey] = (output[normalizedKey] ?? 0) + 1;
  }

  return output;
}

function sortCountsDescending(counts = {}) {
  return Object.entries(counts)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([key, count]) => ({
      key,
      count
    }));
}

function extractProblemEntries(problemMap) {
  if (!problemMap) {
    return [];
  }

  if (Array.isArray(problemMap)) {
    return problemMap.flatMap((item) => extractProblemEntries(item));
  }

  if (typeof problemMap === "string") {
    const trimmed = problemMap.trim();
    if (!trimmed) {
      return [];
    }

    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        return extractProblemEntries(JSON.parse(trimmed));
      } catch {
        return [trimmed];
      }
    }

    return [trimmed];
  }

  if (typeof problemMap === "object") {
    if (
      Object.prototype.hasOwnProperty.call(problemMap, "extendProblemMap") ||
      Object.prototype.hasOwnProperty.call(problemMap, "errorReasonList")
    ) {
      const collected = [];
      const extendProblemMap = problemMap.extendProblemMap;
      if (extendProblemMap && typeof extendProblemMap === "object") {
        for (const [key, value] of Object.entries(extendProblemMap)) {
          if (value === true) {
            collected.push(key);
          }
        }
      }

      const errorReasonList = safeArray(problemMap.errorReasonList);
      for (const item of errorReasonList) {
        collected.push(...extractProblemEntries(item));
      }

      for (const [key, value] of Object.entries(problemMap)) {
        if (!/^errorReason.+Map$/.test(key) || !value || typeof value !== "object") {
          continue;
        }

        const nestedKeys = Object.keys(value).filter(Boolean);
        if (nestedKeys.length > 0) {
          collected.push(...nestedKeys);
        }
      }

      return collected;
    }

    return Object.entries(problemMap).flatMap(([key, value]) => {
      if (typeof value === "boolean") {
        return value ? [key] : [];
      }

      if (typeof value === "string" && value.trim()) {
        return [key, value.trim()];
      }

      if (typeof value === "number") {
        return value > 0 ? [key] : [];
      }

      if (Array.isArray(value)) {
        return value.flatMap((entry) => extractProblemEntries(entry));
      }

      if (value && typeof value === "object") {
        return extractProblemEntries(value);
      }

      return [];
    });
  }

  return [];
}

function normalizeKeywords(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[;,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function summarizeScoreScale(scoreValues = []) {
  if (scoreValues.length === 0) {
    return {
      scale: null,
      low_score_threshold: null,
      low_score_count: 0
    };
  }

  const maxValue = Math.max(...scoreValues);
  if (maxValue <= 5.5) {
    const lowThreshold = 4.8;
    return {
      scale: "five_point",
      low_score_threshold: lowThreshold,
      low_score_count: scoreValues.filter((value) => value < lowThreshold).length
    };
  }

  const lowThreshold = 60;
  return {
    scale: "hundred_point",
    low_score_threshold: lowThreshold,
    low_score_count: scoreValues.filter((value) => value < lowThreshold).length
  };
}

function buildProductSignals(productListResult, productScores, productDetails) {
  const items = safeArray(productListResult?.items);
  const scoreItems = safeArray(productScores);
  const detailItems = safeArray(productDetails);
  const totalItem =
    productListResult?.response_meta?.total_item ?? items.length;

  const scoreValues = scoreItems
    .map((item) => toNumber(item?.result?.final_score))
    .filter((value) => value !== null);
  const scoreScale = summarizeScoreScale(scoreValues);
  const boutiqueTaggedCount = scoreItems.filter(
    (item) => Boolean(item?.result?.boutique_tag)
  ).length;
  const problemCounts = {};

  for (const scoreItem of scoreItems) {
    for (const entry of extractProblemEntries(scoreItem?.result?.problem_map)) {
      const key = String(entry).trim();
      if (!key) {
        continue;
      }

      problemCounts[key] = (problemCounts[key] ?? 0) + 1;
    }
  }

  const detailsById = new Map(
    detailItems.map((item) => [String(item?.request_meta?.product_id ?? ""), item?.product ?? {}])
  );

  let missingDescriptionCount = 0;
  let missingKeywordsCount = 0;
  let missingSubjectCount = 0;
  const staleProducts = [];
  let updatedWithin30DaysCount = 0;
  const modifiedDates = [];

  for (const item of detailItems) {
    const key = String(item?.request_meta?.product_id ?? item?.product?.product_id ?? "");
    const detail = detailsById.get(key) ?? {};
    const subject = String(detail.subject ?? item.subject ?? "").trim();
    const description = String(detail.description ?? "").trim();
    const keywords = normalizeKeywords(detail.keywords ?? item.keywords);
    const ageInDays = getAgeInDays(detail.gmt_modified ?? item.gmt_modified);
    const modifiedAt = detail.gmt_modified ?? item.gmt_modified ?? null;

    if (!subject) {
      missingSubjectCount += 1;
    }

    if (!description) {
      missingDescriptionCount += 1;
    }

    if (keywords.length === 0) {
      missingKeywordsCount += 1;
    }

    if (modifiedAt) {
      modifiedDates.push(modifiedAt);
    }

    if (ageInDays !== null && ageInDays <= 30) {
      updatedWithin30DaysCount += 1;
    }

    if (ageInDays !== null && ageInDays >= 90) {
      staleProducts.push({
        product_id: item.id ?? null,
        subject: subject || item.subject || null,
        gmt_modified: detail.gmt_modified ?? item.gmt_modified ?? null,
        age_in_days: ageInDays
      });
    }
  }

  const groupCoverage = sortCountsDescending(countBy(items, (item) => item.group_name));
  const categoryCoverage = sortCountsDescending(
    countBy(items, (item) => item.category_id)
  );
  return {
    summary: buildProductManagementSummary(productListResult),
    sample_size: {
      list_count: items.length,
      detail_count: detailItems.length,
      score_count: scoreItems.length,
      total_item: totalItem,
      completeness_evaluated_count: detailItems.length
    },
    quality_score: {
      available_count: scoreValues.length,
      average: scoreValues.length
        ? Number(
            (
              scoreValues.reduce((sum, value) => sum + value, 0) /
              scoreValues.length
            ).toFixed(2)
          )
        : null,
      min: scoreValues.length ? Math.min(...scoreValues) : null,
      max: scoreValues.length ? Math.max(...scoreValues) : null,
      scale: scoreScale.scale,
      low_score_threshold: scoreScale.low_score_threshold,
      low_score_count: scoreScale.low_score_count
    },
    boutique_tag: {
      tagged_count: boutiqueTaggedCount,
      untagged_count: Math.max(0, scoreItems.length - boutiqueTaggedCount)
    },
    problem_map_top: sortCountsDescending(problemCounts).slice(0, 10),
    content_completeness: {
      missing_subject_count: missingSubjectCount,
      missing_description_count: missingDescriptionCount,
      missing_keywords_count: missingKeywordsCount
    },
    recency_hints: {
      modified_time_window: summarizeDateWindow(modifiedDates),
      updated_within_30_days_count: updatedWithin30DaysCount,
      stale_over_90_days: staleProducts.slice(0, 10)
    },
    structure_hints: {
      ungrouped_count: items.filter((item) => !item.group_name).length,
      group_coverage_top: groupCoverage.slice(0, 10),
      category_coverage_top: categoryCoverage.slice(0, 10)
    }
  };
}

function normalizeLogisticsStatus(value, shippingOrderList = []) {
  const primary = String(value ?? "").trim();
  if (primary) {
    return primary;
  }

  const nested = safeArray(shippingOrderList)
    .map((item) => String(item?.status ?? item?.logistic_status ?? "").trim())
    .find(Boolean);

  return nested || "UNKNOWN";
}

function buildOrderSignals(orderListResult, fundResults, logisticsResults) {
  const items = safeArray(orderListResult?.items);
  const logisticsItems = safeArray(logisticsResults);
  const fundItems = safeArray(fundResults);
  const logisticsStatuses = countBy(logisticsItems, (item) =>
    normalizeLogisticsStatus(
      item?.value?.logistic_status,
      item?.value?.shipping_order_list
    )
  );

  const atRiskOrders = [];
  for (const logisticsItem of logisticsItems) {
    const status = normalizeLogisticsStatus(
      logisticsItem?.value?.logistic_status,
      logisticsItem?.value?.shipping_order_list
    );
    const shippingOrders = safeArray(logisticsItem?.value?.shipping_order_list);
    if (status === "UNKNOWN" || shippingOrders.length === 0) {
      atRiskOrders.push({
        e_trade_id: logisticsItem?.request_meta?.e_trade_id ?? null,
        logistic_status: status,
        shipping_order_count: shippingOrders.length
      });
    }
  }

  const fundVisibleCount = fundItems.filter(
    (item) => item?.value && typeof item.value === "object"
  ).length;
  const serviceFeeVisibleCount = fundItems.filter(
    (item) => item?.value?.service_fee !== undefined && item?.value?.service_fee !== null
  ).length;
  const fundPayVisibleCount = fundItems.filter(
    (item) => safeArray(item?.value?.fund_pay_list).length > 0
  ).length;

  return {
    sample_size: {
      order_list_count: items.length,
      fund_count: fundItems.length,
      logistics_count: logisticsItems.length,
      total_count: orderListResult?.response_meta?.total_count ?? null
    },
    time_window: summarizeDateWindow(items.map((item) => item?.create_date?.format_date)),
    logistics_status_distribution: sortCountsDescending(logisticsStatuses),
    fund_visibility: {
      fund_value_visible_count: fundVisibleCount,
      service_fee_visible_count: serviceFeeVisibleCount,
      fund_pay_list_visible_count: fundPayVisibleCount
    },
    execution_risks: atRiskOrders.slice(0, 10)
  };
}

function normalizeArrayValue(value) {
  return Array.isArray(value) ? value : [];
}

function buildTrafficPerformanceSection(trafficSummary) {
  if (!trafficSummary) {
    return {
      status: "unavailable",
      unavailable_dimensions: [...MYDATA_OVERVIEW_UNAVAILABLE_DIMENSIONS],
      boundary_statement: {
        not_full_store_dashboard: true,
        official_mydata_subset_only: true
      }
    };
  }

  const metrics = trafficSummary.official_metrics ?? {};
  const visitor = toNumber(metrics.visitor);
  const imps = toNumber(metrics.imps);
  const clk = toNumber(metrics.clk);
  const fb = toNumber(metrics.fb);
  const reply = toNumber(metrics.reply);
  const recommendations = [];
  const warnings = [];

  if (Number.isFinite(imps) && imps > 0 && Number.isFinite(clk) && clk === 0) {
    warnings.push("Exposure/imps is present while click stays at 0.");
    recommendations.push(
      "Review main image, title, and keyword relevance before scaling traffic."
    );
  }

  if (Number.isFinite(visitor) && visitor > 0 && Number.isFinite(fb) && fb === 0) {
    recommendations.push(
      "Visitor is present while fb stays at 0; review inquiry CTA and lead capture path."
    );
  }

  if (Number.isFinite(reply) && reply < 0.9) {
    warnings.push("Reply-related metric is below the recent baseline.");
  }

  if (Number.isFinite(imps) && Number.isFinite(clk) && imps < clk) {
    warnings.push("clk is greater than imps; review upstream metric consistency.");
  }

  return {
    status: "real_data_returned",
    source_route: "/integrations/alibaba/wika/reports/operations/traffic-summary",
    date_range: trafficSummary.date_range ?? null,
    industry: trafficSummary.industry ?? null,
    official_metrics: metrics,
    derived_metrics: trafficSummary.derived_metrics ?? {},
    traffic_signal_summary: {
      visitor,
      imps,
      clk,
      clk_rate: metrics.clk_rate ?? null
    },
    inquiry_reply_signal_summary: {
      fb,
      reply
    },
    basic_recommendations: recommendations,
    obvious_anomaly_warnings: warnings,
    unavailable_dimensions: normalizeArrayValue(trafficSummary.unavailable_dimensions),
    boundary_statement: trafficSummary.boundary_statement ?? {
      not_full_store_dashboard: true,
      official_mydata_subset_only: true
    }
  };
}

function buildProductPerformanceSection(performanceSummary) {
  if (!performanceSummary) {
    return {
      status: "unavailable",
      unavailable_dimensions: [...MYDATA_PRODUCT_UNAVAILABLE_DIMENSIONS],
      boundary_statement: {
        not_full_product_performance_cockpit: true,
        official_mydata_subset_only: true
      }
    };
  }

  const items = safeArray(performanceSummary.items);
  const engagementSummary = {
    products_with_impression: items.filter(
      (item) => toNumber(item?.official_metrics?.impression) > 0
    ).length,
    products_with_click: items.filter(
      (item) => toNumber(item?.official_metrics?.click) > 0
    ).length,
    products_with_visitor: items.filter(
      (item) => toNumber(item?.official_metrics?.visitor) > 0
    ).length,
    products_with_fb: items.filter(
      (item) => toNumber(item?.official_metrics?.fb) > 0
    ).length,
    products_with_order: items.filter(
      (item) => toNumber(item?.official_metrics?.order) > 0
    ).length,
    products_with_keyword_effects: items.filter((item) => {
      const keywordEffects = item?.official_metrics?.keyword_effects;
      return keywordEffects && Object.keys(keywordEffects).length > 0;
    }).length
  };

  const rankingPreview = [...items]
    .sort((left, right) => {
      const impressionDelta =
        (toNumber(right?.official_metrics?.impression) ?? -1) -
        (toNumber(left?.official_metrics?.impression) ?? -1);
      if (impressionDelta !== 0) {
        return impressionDelta;
      }

      return (
        (toNumber(right?.official_metrics?.click) ?? -1) -
        (toNumber(left?.official_metrics?.click) ?? -1)
      );
    })
    .slice(0, 5)
    .map((item) => ({
      product_id: item.product_id ?? null,
      impression: item?.official_metrics?.impression ?? null,
      click: item?.official_metrics?.click ?? null,
      visitor: item?.official_metrics?.visitor ?? null,
      fb: item?.official_metrics?.fb ?? null,
      order: item?.official_metrics?.order ?? null,
      ctr_from_click_over_impression:
        item?.derived_metrics?.ctr_from_click_over_impression ?? null
    }));

  const keywordSignalHints = items
    .filter((item) => {
      const keywordEffects = item?.official_metrics?.keyword_effects;
      return keywordEffects && Object.keys(keywordEffects).length > 0;
    })
    .slice(0, 5)
    .map((item) => ({
      product_id: item.product_id ?? null,
      keyword_effect_keys: Object.keys(item?.official_metrics?.keyword_effects ?? {})
    }));

  const warnings = [];
  if (engagementSummary.products_with_impression > 0 && engagementSummary.products_with_click === 0) {
    warnings.push("Impression is present while click stays at 0.");
  }
  if (engagementSummary.products_with_visitor > 0 && engagementSummary.products_with_fb === 0) {
    warnings.push("Visitor is present while fb stays at 0.");
  }
  if (engagementSummary.products_with_keyword_effects === 0) {
    warnings.push("No keyword_effects payload is visible in the current sample.");
  }

  const recommendations = [];
  if (engagementSummary.products_with_impression > 0 && engagementSummary.products_with_click === 0) {
    recommendations.push("Review top products with impression but no click.");
  }
  if (engagementSummary.products_with_visitor > 0 && engagementSummary.products_with_fb === 0) {
    recommendations.push("Review products with visitor but no fb for inquiry friction.");
  }

  return {
    status: "real_data_returned",
    source_route: "/integrations/alibaba/wika/reports/products/performance-summary",
    statistics_type: performanceSummary.statistics_type ?? null,
    stat_date: performanceSummary.stat_date ?? null,
    item_count: performanceSummary.item_count ?? items.length,
    engagement_summary: engagementSummary,
    ranking_preview: rankingPreview,
    keyword_signal_hints: {
      products_with_keyword_effects: engagementSummary.products_with_keyword_effects,
      sample_products: keywordSignalHints
    },
    basic_recommendations: recommendations,
    obvious_gap_warnings: warnings,
    unavailable_dimensions: normalizeArrayValue(performanceSummary.unavailable_dimensions),
    boundary_statement: performanceSummary.boundary_statement ?? {
      not_full_product_performance_cockpit: true,
      official_mydata_subset_only: true
    }
  };
}

function buildProductPerformanceFindings(performanceSummary) {
  if (!performanceSummary) {
    return [];
  }

  return [
    {
      area: "products",
      strength: "strong",
      finding:
        "Confirmed mydata product-performance subset exposes click / impression / visitor / fb / order / bookmark / compare / share / keyword_effects.",
      basis_fields: [
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
      evidence: {
        statistics_type: performanceSummary.statistics_type,
        stat_date: performanceSummary.stat_date,
        item_count: performanceSummary.item_count
      }
    },
    {
      area: "products",
      strength: "strong",
      finding:
        "Current performance section still lacks access_source / inquiry_source / country_source / period_over_period_change.",
      basis_fields: ["unavailable_dimensions"],
      evidence: {
        unavailable_dimensions: performanceSummary.unavailable_dimensions
      }
    }
  ];
}

function buildOperationsTrafficFindings(trafficSummary) {
  if (!trafficSummary) {
    return [];
  }

  return [
    {
      area: "operations",
      strength: "strong",
      finding:
        "Confirmed mydata store-level subset exposes visitor / imps / clk / clk_rate / fb / reply.",
      basis_fields: ["visitor", "imps", "clk", "clk_rate", "fb", "reply"],
      evidence: {
        date_range: trafficSummary.date_range,
        industry: trafficSummary.industry,
        official_metrics: trafficSummary.official_metrics
      }
    },
    {
      area: "operations",
      strength: "strong",
      finding:
        "Current traffic summary still lacks traffic_source / country_source / quick_reply_rate.",
      basis_fields: ["unavailable_dimensions"],
      evidence: {
        unavailable_dimensions: trafficSummary.unavailable_dimensions
      }
    }
  ];
}

function buildProductAvailableSignals(productSignals, sampleConfig, performanceSummary = null) {
  const signals = [
    {
      module: "products",
      source_route: "/integrations/alibaba/wika/data/products/list",
      fields: [
        "id",
        "subject",
        "group_name",
        "category_id",
        "status",
        "display",
        "gmt_modified"
      ],
      sample_size: productSignals.sample_size.list_count,
      notes: "Sampled from products/list with page_size=" + sampleConfig.product_page_size + "."
    },
    {
      module: "products",
      source_route: "/integrations/alibaba/wika/data/products/score",
      fields: ["result.final_score", "result.boutique_tag", "result.problem_map"],
      sample_size: productSignals.sample_size.score_count,
      notes: "Sampled from products/score with limit " + sampleConfig.product_score_limit + "."
    },
    {
      module: "products",
      source_route: "/integrations/alibaba/wika/data/products/detail",
      fields: [
        "product.subject",
        "product.description",
        "product.keywords",
        "product.gmt_modified"
      ],
      sample_size: productSignals.sample_size.detail_count,
      notes: "Sampled from products/detail with limit " + sampleConfig.product_detail_limit + "."
    }
  ];

  if (performanceSummary) {
    signals.push({
      module: "products",
      source_route: "/integrations/alibaba/wika/reports/products/performance-summary",
      fields: [
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
      sample_size: performanceSummary.item_count ?? 0,
      notes:
        "Live mydata subset with official field names preserved and derived/unavailable fields separated."
    });
  }

  return signals;
}

function buildOrderAvailableSignals(orderSignals, sampleConfig) {
  return [
    {
      module: "orders",
      source_route: "/integrations/alibaba/wika/data/orders/list",
      fields: ["items.trade_id", "items.create_date", "items.modify_date"],
      sample_size: orderSignals.sample_size.order_list_count,
      notes: `Sampled from the first ${sampleConfig.order_page_size} orders in orders/list.`
    },
    {
      module: "orders",
      source_route: "/integrations/alibaba/wika/data/orders/fund",
      fields: ["value.fund_pay_list", "value.service_fee"],
      sample_size: orderSignals.sample_size.fund_count,
      notes: `Sampled from the first ${sampleConfig.order_sample_limit} orders in orders/fund.`
    },
    {
      module: "orders",
      source_route: "/integrations/alibaba/wika/data/orders/logistics",
      fields: ["value.logistic_status", "value.shipping_order_list"],
      sample_size: orderSignals.sample_size.logistics_count,
      notes: `Sampled from the first ${sampleConfig.order_sample_limit} orders in orders/logistics.`
    }
  ];
}

function buildProductDiagnosticFindings(productSignals, performanceSummary = null) {
  const findings = [
    {
      area: "products",
      strength: "strong",
      finding:
        productSignals.problem_map_top.length > 0
          ? "problem_map identifies concrete quality gaps in the sampled products."
          : "Current sampled products show stable scores without top problem_map concentration.",
      basis_fields: ["result.final_score", "result.problem_map", "result.boutique_tag"],
      evidence: {
        quality_score: productSignals.quality_score,
        boutique_tag: productSignals.boutique_tag,
        problem_map_top: productSignals.problem_map_top
      }
    },
    {
      area: "products",
      strength: "strong",
      finding: "Product detail sampling exposes content completeness and recency signals.",
      basis_fields: [
        "product.subject",
        "product.description",
        "product.keywords",
        "product.gmt_modified"
      ],
      evidence: {
        content_completeness: productSignals.content_completeness,
        recency_hints: productSignals.recency_hints
      }
    },
    {
      area: "products",
      strength: "strong",
      finding: "Group/category sampling exposes structure coverage and ungrouped items.",
      basis_fields: ["group_name", "category_id", "display", "status"],
      evidence: {
        group_coverage_top: productSignals.structure_hints.group_coverage_top,
        category_coverage_top: productSignals.structure_hints.category_coverage_top,
        ungrouped_count: productSignals.structure_hints.ungrouped_count
      }
    }
  ];

  return findings.concat(buildProductPerformanceFindings(performanceSummary));
}

function buildOrderDiagnosticFindings(orderSignals) {
  return [
    {
      area: "orders",
      strength: "strong",
      finding: "Order logistics and fund sampling expose execution-stage operational risks.",
      basis_fields: ["value.logistic_status", "value.shipping_order_list", "value.service_fee"],
      evidence: {
        logistics_status_distribution: orderSignals.logistics_status_distribution,
        fund_visibility: orderSignals.fund_visibility,
        execution_risks: orderSignals.execution_risks
      }
    }
  ];
}

function buildProductRecommendations(productSignals, performanceSummary = null) {
  const immediateActions = [];
  const needsMoreDataActions = [];

  if (productSignals.content_completeness.missing_description_count > 0) {
    immediateActions.push({
      strength: "strong",
      theme: "content_completeness",
      reason: "Several sampled products are missing description, which weakens detail-page conversion.",
      evidence: {
        missing_description_count:
          productSignals.content_completeness.missing_description_count
      }
    });
  }

  if (productSignals.content_completeness.missing_keywords_count > 0) {
    immediateActions.push({
      strength: "strong",
      theme: "keyword_gap",
      reason: "Several sampled products are missing keywords, which limits discoverability.",
      evidence: {
        missing_keywords_count:
          productSignals.content_completeness.missing_keywords_count
      }
    });
  }

  if (
    productSignals.problem_map_top.length > 0 ||
    productSignals.quality_score.low_score_count > 0
  ) {
    immediateActions.push({
      strength: "strong",
      theme: "quality_gap",
      reason:
        "problem_map and low-score samples indicate structured quality issues that need cleanup.",
      evidence: {
        low_score_count: productSignals.quality_score.low_score_count,
        top_problem_map: productSignals.problem_map_top.slice(0, 5)
      }
    });
  }

  if (productSignals.structure_hints.ungrouped_count > 0) {
    immediateActions.push({
      strength: "strong",
      theme: "grouping_gap",
      reason: "Ungrouped products are still present and should be assigned to clearer catalog groups.",
      evidence: {
        ungrouped_count: productSignals.structure_hints.ungrouped_count
      }
    });
  }

  if (safeArray(productSignals.recency_hints.stale_over_90_days).length > 0) {
    immediateActions.push({
      strength: "strong",
      theme: "stale_content",
      reason: "Some sampled products have not been updated for more than 90 days based on gmt_modified.",
      evidence: {
        stale_over_90_days: safeArray(productSignals.recency_hints.stale_over_90_days).slice(
          0,
          5
        )
      }
    });
  }

  if (performanceSummary) {
    const performanceSection = buildProductPerformanceSection(performanceSummary);
    for (const recommendation of performanceSection.basic_recommendations ?? []) {
      immediateActions.push({
        strength: "strong",
        theme: "performance_followup",
        reason: recommendation,
        evidence: {
          statistics_type: performanceSummary.statistics_type,
          stat_date: performanceSummary.stat_date
        }
      });
    }

    needsMoreDataActions.push({
      strength: "weak",
      theme: "missing_dimensions",
      reason:
        "Current mydata performance subset still lacks access_source / inquiry_source / country_source / period_over_period_change.",
      blocker_keys: [
        "access_source",
        "inquiry_source",
        "country_source",
        "period_over_period_change"
      ]
    });
  } else {
    needsMoreDataActions.push({
      strength: "weak",
      theme: "mydata_subset_missing",
      reason:
        "Current product diagnostic does not yet include the mydata performance subset.",
      blocker_keys: [
        "click",
        "impression",
        "visitor",
        "fb",
        "order",
        "keyword_effects"
      ]
    });
  }

  return {
    immediate_actions: immediateActions,
    needs_more_data_actions: needsMoreDataActions
  };
}

function buildOrderRecommendations(orderSignals) {
  const immediateActions = [];
  const needsMoreDataActions = [];
  const logisticsStatuses = orderSignals.logistics_status_distribution;
  const undelivered = logisticsStatuses.find((item) => item.key === "UNDELIVERED");

  if ((undelivered?.count ?? 0) > 0) {
    immediateActions.push({
      strength: "strong",
      theme: "undelivered_risk",
      reason: "Undelivered logistics status is visible and needs manual follow-up.",
      evidence: {
        undelivered_count: undelivered.count,
        logistics_status_distribution: logisticsStatuses.slice(0, 5)
      }
    });
  }

  if (orderSignals.execution_risks.length > 0) {
    immediateActions.push({
      strength: "strong",
      theme: "execution_risk",
      reason: "Order execution risks are visible in the sampled logistics/fund signals.",
      evidence: {
        execution_risks: orderSignals.execution_risks.slice(0, 5)
      }
    });
  }

  needsMoreDataActions.push({
    strength: "weak",
    theme: "order_analytics_gap",
    reason:
      "Order trend, country structure, product contribution, and full amount series are still unavailable.",
    blocker_keys: [
      "order_trend",
      "country_structure",
      "product_contribution",
      "full_amount_series"
    ]
  });

  return {
    immediate_actions: immediateActions,
    needs_more_data_actions: needsMoreDataActions
  };
}

function buildProductMissingDataBlockers() {
  return [
    {
      blocker: "product_performance_dimensions_missing",
      missing_metrics: [
        "access_source",
        "inquiry_source",
        "country_source",
        "period_over_period_change"
      ],
      impact:
        "Current mydata performance subset does not expose access/inquiry/country source or period-over-period change."
    }
  ];
}

function buildOrderMissingDataBlockers() {
  return [
    {
      blocker: "order_analytics_dimensions_missing",
      missing_metrics: ["order_trend", "country_structure", "product_contribution"],
      impact: "Current order snapshot cannot support full trend, country-structure, or product-contribution analysis."
    }
  ];
}

function buildOperationsMissingDataBlockers() {
  return [
    {
      blocker: "operations_dimensions_missing",
      missing_metrics: ["traffic_source", "country_source", "quick_reply_rate"],
      impact:
        "Current operations summary uses a store-level mydata subset and still lacks traffic/country/quick-reply dimensions."
    },
    ...buildOrderMissingDataBlockers()
  ];
}

function buildOperationsRecommendations(productSignals, orderSignals) {
  const productRecommendations = buildProductRecommendations(productSignals);
  const orderRecommendations = buildOrderRecommendations(orderSignals);

  return {
    immediate_actions: [
      ...productRecommendations.immediate_actions,
      ...orderRecommendations.immediate_actions
    ],
    needs_more_data_actions: [
      ...productRecommendations.needs_more_data_actions,
      ...orderRecommendations.needs_more_data_actions
    ]
  };
}

function resolveProductDiagnosticSampleConfig(query = {}) {
  const productScoreLimit = toPositiveInteger(query.product_score_limit, 8, 10);
  return {
    product_page_size: toPositiveInteger(query.product_page_size, 20, 30),
    product_score_limit: productScoreLimit,
    product_detail_limit: toPositiveInteger(
      query.product_detail_limit,
      productScoreLimit,
      10
    )
  };
}

function resolveOrderDiagnosticSampleConfig(query = {}) {
  return {
    order_page_size: toPositiveInteger(query.order_page_size, 8, 10),
    order_sample_limit: toPositiveInteger(query.order_sample_limit, 5, 8)
  };
}

async function collectWikaProductDiagnosticData(clientConfig, query = {}) {
  const sampleConfig = resolveProductDiagnosticSampleConfig(query);
  const productListResult = await fetchWikaProductList(clientConfig, {
    page_size: sampleConfig.product_page_size
  });
  const productItems = safeArray(productListResult.items);
  const scoreTargets = productItems.slice(0, sampleConfig.product_score_limit);
  const detailTargets = productItems.slice(0, sampleConfig.product_detail_limit);

  const productScores = await Promise.all(
    scoreTargets.map((item) =>
      fetchAlibabaOfficialProductScore(
        {
          account: "wika",
          ...clientConfig
        },
        {
          product_id: item.id
        }
      )
    )
  );

  const productDetails = await Promise.all(
    detailTargets.map((item) =>
      fetchAlibabaOfficialProductDetail(
        {
          account: "wika",
          ...clientConfig
        },
        {
          product_id: item.id,
          language: item.language || "ENGLISH"
        }
      )
    )
  );

  return {
    sampleConfig,
    productSignals: buildProductSignals(
      productListResult,
      productScores,
      productDetails
    )
  };
}

async function collectWikaOrderDiagnosticData(clientConfig, query = {}) {
  const sampleConfig = resolveOrderDiagnosticSampleConfig(query);
  const orderListResult = await fetchAlibabaOfficialOrderList(
    {
      account: "wika",
      ...clientConfig
    },
    {
      start_page: 0,
      page_size: sampleConfig.order_page_size,
      role: "seller"
    }
  );

  const orderTargets = safeArray(orderListResult.items).slice(
    0,
    sampleConfig.order_sample_limit
  );

  const fundResults = await Promise.all(
    orderTargets.map((item) =>
      fetchAlibabaOfficialOrderFund(
        {
          account: "wika",
          ...clientConfig
        },
        {
          e_trade_id: item.trade_id
        }
      )
    )
  );

  const logisticsResults = await Promise.all(
    orderTargets.map((item) =>
      fetchAlibabaOfficialOrderLogistics(
        {
          account: "wika",
          ...clientConfig
        },
        {
          e_trade_id: item.trade_id
        }
      )
    )
  );

  return {
    sampleConfig,
    orderSignals: buildOrderSignals(
      orderListResult,
      fundResults,
      logisticsResults
    )
  };
}

function buildWikaProductMinimalDiagnosticReport(
  productSignals,
  sampleConfig,
  generatedAt,
  performanceSummary = null
) {
  const performanceSection = buildProductPerformanceSection(performanceSummary);

  return {
    ok: true,
    account: "wika",
    module: "products",
    report_type: "minimal_diagnostic",
    read_only: true,
    generated_at: generatedAt,
    data_scope: {
      mode: "sampled_snapshot",
      ...sampleConfig
    },
    sample_size: {
      product_snapshot_count: productSignals.sample_size.list_count,
      product_score_count: productSignals.sample_size.score_count,
      product_detail_count: productSignals.sample_size.detail_count,
      total_item: productSignals.sample_size.total_item
    },
    time_window: {
      type: "snapshot",
      product_modified_date_range: productSignals.recency_hints.modified_time_window
    },
    available_signals: buildProductAvailableSignals(
      productSignals,
      sampleConfig,
      performanceSummary
    ),
    score_summary: {
      quality_score: productSignals.quality_score,
      boutique_tag: productSignals.boutique_tag,
      problem_map_top: productSignals.problem_map_top
    },
    content_completeness_findings: {
      ...productSignals.content_completeness,
      ...productSignals.recency_hints
    },
    structure_findings: productSignals.structure_hints,
    performance_section: performanceSection,
    diagnostic_findings: buildProductDiagnosticFindings(
      productSignals,
      performanceSummary
    ),
    recommendations: buildProductRecommendations(productSignals, performanceSummary),
    missing_data_blockers: buildProductMissingDataBlockers(),
    management_summary: productSignals.summary,
    limitations: [
      "Current product diagnostic only includes the confirmed mydata performance subset; access_source / inquiry_source / country_source / period_over_period_change remain unavailable.",
      "This is not a full product performance cockpit."
    ]
  };
}

function buildWikaOrderMinimalDiagnosticReport(orderSignals, sampleConfig, generatedAt) {
  return {
    ok: true,
    account: "wika",
    module: "orders",
    report_type: "minimal_diagnostic",
    read_only: true,
    generated_at: generatedAt,
    data_scope: {
      mode: "sampled_snapshot",
      ...sampleConfig
    },
    sample_size: {
      order_snapshot_count: orderSignals.sample_size.order_list_count,
      order_fund_count: orderSignals.sample_size.fund_count,
      order_logistics_count: orderSignals.sample_size.logistics_count,
      total_count: orderSignals.sample_size.total_count
    },
    time_window: {
      type: "snapshot",
      orders_create_date_range: orderSignals.time_window
    },
    available_signals: buildOrderAvailableSignals(orderSignals, sampleConfig),
    logistics_summary: {
      distribution: orderSignals.logistics_status_distribution,
      at_risk_count: orderSignals.execution_risks.length
    },
    fund_signal_summary: orderSignals.fund_visibility,
    operational_risks: orderSignals.execution_risks,
    diagnostic_findings: buildOrderDiagnosticFindings(orderSignals),
    recommendations: buildOrderRecommendations(orderSignals),
    missing_data_blockers: buildOrderMissingDataBlockers(),
    limitations: [
      "Current order diagnostic is built from sampled order / fund / logistics reads and is not a full order dashboard.",
      "Trend, country structure, and product contribution remain unavailable."
    ]
  };
}

export function buildWikaMinimalDiagnosticScope(sampleConfig = {}) {
  return {
    can_answer: [
      "Store-level mydata subset: visitor / imps / clk / clk_rate / fb / reply.",
      "Product-level mydata subset: click / impression / visitor / fb / order / bookmark / compare / share / keyword_effects.",
      "Quality signals from product score problem_map and boutique_tag.",
      "Content completeness, recency, and grouping signals from sampled product detail/list data.",
      "Derived CTR from click / impression when both values exist."
    ],
    cannot_answer: [
      "traffic_source / country_source / quick_reply_rate",
      "access_source / inquiry_source / country_source / period_over_period_change",
      "Full order trend and country structure.",
      "Traffic source, inquiry source, and country source drill-down."
    ],
    sampling_boundary: {
      product_page_size: sampleConfig.product_page_size ?? null,
      product_score_limit: sampleConfig.product_score_limit ?? null,
      product_detail_limit: sampleConfig.product_detail_limit ?? null,
      order_page_size: sampleConfig.order_page_size ?? null,
      order_sample_limit: sampleConfig.order_sample_limit ?? null
    }
  };
}

export async function fetchWikaProductMinimalDiagnostic(clientConfig, query = {}) {
  const generatedAt = new Date().toISOString();
  const { sampleConfig, productSignals } = await collectWikaProductDiagnosticData(
    clientConfig,
    query
  );

  let performanceSummary = null;
  try {
    performanceSummary = await fetchWikaProductPerformanceSummary(clientConfig, query);
  } catch {
    performanceSummary = null;
  }

  return buildWikaProductMinimalDiagnosticReport(
    productSignals,
    sampleConfig,
    generatedAt,
    performanceSummary
  );
}

export async function fetchWikaOrderMinimalDiagnostic(clientConfig, query = {}) {
  const generatedAt = new Date().toISOString();
  const { sampleConfig, orderSignals } = await collectWikaOrderDiagnosticData(
    clientConfig,
    query
  );

  return buildWikaOrderMinimalDiagnosticReport(
    orderSignals,
    sampleConfig,
    generatedAt
  );
}

export async function fetchWikaMinimalDiagnostic(clientConfig, query = {}) {
  const generatedAt = new Date().toISOString();
  const { sampleConfig: productSampleConfig, productSignals } =
    await collectWikaProductDiagnosticData(clientConfig, query);
  const { sampleConfig: orderSampleConfig, orderSignals } =
    await collectWikaOrderDiagnosticData(clientConfig, query);

  let performanceSummary = null;
  let trafficSummary = null;

  try {
    performanceSummary = await fetchWikaProductPerformanceSummary(clientConfig, query);
  } catch {
    performanceSummary = null;
  }

  try {
    trafficSummary = await fetchWikaOperationsTrafficSummary(clientConfig, query);
  } catch {
    trafficSummary = null;
  }

  const productReport = buildWikaProductMinimalDiagnosticReport(
    productSignals,
    productSampleConfig,
    generatedAt,
    performanceSummary
  );
  const orderReport = buildWikaOrderMinimalDiagnosticReport(
    orderSignals,
    orderSampleConfig,
    generatedAt
  );
  const trafficSection = buildTrafficPerformanceSection(trafficSummary);
  const baseRecommendations = buildOperationsRecommendations(productSignals, orderSignals);
  const sampleConfig = {
    ...productSampleConfig,
    ...orderSampleConfig
  };
  const availableSignals = [
    ...productReport.available_signals,
    ...orderReport.available_signals
  ];

  if (trafficSummary) {
    availableSignals.push({
      module: "operations",
      source_route: "/integrations/alibaba/wika/reports/operations/traffic-summary",
      fields: ["visitor", "imps", "clk", "clk_rate", "fb", "reply"],
      sample_size: 1,
      notes:
        "Live mydata store subset with official field names preserved and derived/unavailable fields separated."
    });
  }

  return {
    ok: true,
    account: "wika",
    module: "operations",
    report_type: "minimal_diagnostic",
    read_only: true,
    generated_at: generatedAt,
    data_scope: {
      mode: "sampled_snapshot",
      ...sampleConfig
    },
    sample_size: {
      product_snapshot_count: productReport.sample_size.product_snapshot_count,
      product_score_count: productReport.sample_size.product_score_count,
      product_detail_count: productReport.sample_size.product_detail_count,
      order_snapshot_count: orderReport.sample_size.order_snapshot_count,
      order_fund_count: orderReport.sample_size.order_fund_count,
      order_logistics_count: orderReport.sample_size.order_logistics_count
    },
    time_window: {
      type: "snapshot",
      products_modified_date_range:
        productReport.time_window.product_modified_date_range,
      orders_create_date_range: orderReport.time_window.orders_create_date_range
    },
    available_signals: availableSignals,
    traffic_performance_section: trafficSection,
    diagnostic_findings: [
      ...productReport.diagnostic_findings,
      ...orderReport.diagnostic_findings,
      ...buildOperationsTrafficFindings(trafficSummary)
    ],
    recommendations: {
      immediate_actions: [
        ...baseRecommendations.immediate_actions,
        ...(trafficSection.basic_recommendations ?? []).map((item) => ({
          strength: "strong",
          theme: "traffic_followup",
          reason: item,
          evidence: {
            official_metrics: trafficSummary?.official_metrics ?? null
          }
        }))
      ],
      needs_more_data_actions: [
        ...baseRecommendations.needs_more_data_actions,
        {
          strength: "weak",
          theme: "operations_dimensions_missing",
          reason:
            "Current traffic summary uses a mydata store subset and still lacks traffic_source / country_source / quick_reply_rate; full operations diagnostics remains partial.",
          blocker_keys: [
            "traffic_source",
            "country_source",
            "quick_reply_rate",
            "order_summary"
          ]
        }
      ]
    },
    missing_data_blockers: [
      {
        blocker: "operations_dimensions_missing",
        missing_metrics: [
          "traffic_source",
          "country_source",
          "quick_reply_rate",
          "order_summary"
        ],
        impact:
          "Current operations summary uses a store-level mydata subset and still cannot answer full traffic source, country source, quick reply, or full order summary questions."
      },
      ...buildOrderMissingDataBlockers()
    ],
    scope_definition: buildWikaMinimalDiagnosticScope(sampleConfig),
    product_diagnostic: productSignals,
    order_diagnostic: orderSignals,
    limitations: [
      "Current operations diagnostic only includes the confirmed mydata store subset; traffic_source / country_source / quick_reply_rate remain unavailable.",
      "This is not a full business cockpit."
    ]
  };
}
