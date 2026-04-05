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

function buildProductAvailableSignals(productSignals, sampleConfig) {
  return [
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
      notes: `当前产品快照按 page_size=${sampleConfig.product_page_size} 采样。`
    },
    {
      module: "products",
      source_route: "/integrations/alibaba/wika/data/products/score",
      fields: ["result.final_score", "result.boutique_tag", "result.problem_map"],
      sample_size: productSignals.sample_size.score_count,
      notes: `质量分与问题分布按前 ${sampleConfig.product_score_limit} 个产品采样。`
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
      notes: `内容完整度按前 ${sampleConfig.product_detail_limit} 个产品采样。`
    }
  ];
}

function buildOrderAvailableSignals(orderSignals, sampleConfig) {
  return [
    {
      module: "orders",
      source_route: "/integrations/alibaba/wika/data/orders/list",
      fields: ["items.trade_id", "items.create_date", "items.modify_date"],
      sample_size: orderSignals.sample_size.order_list_count,
      notes: `订单执行信号按前 ${sampleConfig.order_page_size} 条订单采样。`
    },
    {
      module: "orders",
      source_route: "/integrations/alibaba/wika/data/orders/fund",
      fields: ["value.fund_pay_list", "value.service_fee"],
      sample_size: orderSignals.sample_size.fund_count,
      notes: `资金可见信号按前 ${sampleConfig.order_sample_limit} 条订单采样。`
    },
    {
      module: "orders",
      source_route: "/integrations/alibaba/wika/data/orders/logistics",
      fields: ["value.logistic_status", "value.shipping_order_list"],
      sample_size: orderSignals.sample_size.logistics_count,
      notes: `物流状态按前 ${sampleConfig.order_sample_limit} 条订单采样。`
    }
  ];
}

function buildProductDiagnosticFindings(productSignals) {
  return [
    {
      area: "products",
      strength: "strong",
      finding:
        productSignals.problem_map_top.length > 0
          ? "样本产品的质量分与问题映射可直接支持质量修复优先级判断。"
          : "样本产品质量分可读，但当前采样里没有稳定浮出的高频 problem_map 问题。",
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
      finding: "样本产品的详情完整度与修改时间信号可直接从 detail 字段判断。",
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
      finding: "样本产品的分组与类目结构分布可直接从主数据快照判断。",
      basis_fields: ["group_name", "category_id", "display", "status"],
      evidence: {
        group_coverage_top: productSignals.structure_hints.group_coverage_top,
        category_coverage_top: productSignals.structure_hints.category_coverage_top,
        ungrouped_count: productSignals.structure_hints.ungrouped_count
      }
    }
  ];
}

function buildOrderDiagnosticFindings(orderSignals) {
  return [
    {
      area: "orders",
      strength: "strong",
      finding: "当前订单层可以做执行状态观察，但不能替代完整经营趋势分析。",
      basis_fields: ["value.logistic_status", "value.shipping_order_list", "value.service_fee"],
      evidence: {
        logistics_status_distribution: orderSignals.logistics_status_distribution,
        fund_visibility: orderSignals.fund_visibility,
        execution_risks: orderSignals.execution_risks
      }
    }
  ];
}

function buildProductRecommendations(productSignals) {
  const immediateActions = [];
  const needsMoreDataActions = [];

  if (productSignals.content_completeness.missing_description_count > 0) {
    immediateActions.push({
      strength: "strong",
      theme: "补详情",
      reason: "样本产品存在 description 缺失，当前可直接从真实 detail 字段确认。",
      evidence: {
        missing_description_count:
          productSignals.content_completeness.missing_description_count
      }
    });
  }

  if (productSignals.content_completeness.missing_keywords_count > 0) {
    immediateActions.push({
      strength: "strong",
      theme: "补关键词",
      reason: "样本产品存在 keywords 缺失，说明搜索承接基础信息不完整。",
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
      theme: "优先修复低质量分产品",
      reason:
        "样本产品质量分与 problem_map 已可直读，应优先处理低分或高频问题项对应的内容/结构缺口。",
      evidence: {
        low_score_count: productSignals.quality_score.low_score_count,
        top_problem_map: productSignals.problem_map_top.slice(0, 5)
      }
    });
  }

  if (productSignals.structure_hints.ungrouped_count > 0) {
    immediateActions.push({
      strength: "strong",
      theme: "补分组结构",
      reason: "样本产品存在未分组项，当前可直接从主数据快照判断结构管理存在缺口。",
      evidence: {
        ungrouped_count: productSignals.structure_hints.ungrouped_count
      }
    });
  }

  if (safeArray(productSignals.recency_hints.stale_over_90_days).length > 0) {
    immediateActions.push({
      strength: "strong",
      theme: "优先更新长期未改产品",
      reason: "样本产品里已能看见超过 90 天未更新的条目，当前可直接从 gmt_modified 判断。",
      evidence: {
        stale_over_90_days: safeArray(productSignals.recency_hints.stale_over_90_days).slice(0, 5)
      }
    });
  }

  needsMoreDataActions.push({
    strength: "weak",
    theme: "等待产品表现数据后再做增长判断",
    reason:
      "当前没有曝光、点击、CTR、关键词来源、询盘来源、国家来源，因此不能对产品流量效率下完整结论。",
    blocker_keys: [
      "exposure",
      "click",
      "ctr",
      "keyword_source",
      "inquiry_source",
      "country_source"
    ]
  });

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
      theme: "持续跟进未发货订单",
      reason: "当前样本订单的主要物流状态仍是未发货，应优先人工推进履约节点。",
      evidence: {
        undelivered_count: undelivered.count,
        logistics_status_distribution: logisticsStatuses.slice(0, 5)
      }
    });
  }

  if (orderSignals.execution_risks.length > 0) {
    immediateActions.push({
      strength: "strong",
      theme: "人工关注订单执行风险",
      reason: "部分订单在物流状态或运单信息上存在缺失信号，应优先人工跟进。",
      evidence: {
        execution_risks: orderSignals.execution_risks.slice(0, 5)
      }
    });
  }

  needsMoreDataActions.push({
    strength: "weak",
    theme: "等待更多订单数据后再做经营趋势判断",
    reason:
      "当前订单层只覆盖执行信号与可见费用字段，不足以支撑完整的金额趋势、国家结构和产品贡献分析。",
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
      blocker: "产品表现指标缺失",
      missing_metrics: ["曝光", "点击", "CTR", "关键词来源", "询盘来源", "国家来源"],
      impact: "当前产品子诊断只能覆盖质量、内容完整度与结构问题，不能完成流量效率分析。"
    }
  ];
}

function buildOrderMissingDataBlockers() {
  return [
    {
      blocker: "订单经营层趋势缺失",
      missing_metrics: ["金额趋势", "国家结构", "产品贡献"],
      impact: "当前订单子诊断更适合做执行风险提示，不适合下完整经营趋势结论。"
    }
  ];
}

function buildOperationsMissingDataBlockers() {
  return [
    {
      blocker: "店铺经营指标缺失",
      missing_metrics: [
        "UV",
        "PV",
        "曝光",
        "点击",
        "CTR",
        "流量来源",
        "国家来源",
        "询盘表现"
      ],
      impact:
        "当前不能完成完整经营分析，只能形成产品质量与订单执行层的最小诊断。"
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

function buildWikaProductMinimalDiagnosticReport(productSignals, sampleConfig, generatedAt) {
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
    available_signals: buildProductAvailableSignals(productSignals, sampleConfig),
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
    diagnostic_findings: buildProductDiagnosticFindings(productSignals),
    recommendations: buildProductRecommendations(productSignals),
    missing_data_blockers: buildProductMissingDataBlockers(),
    management_summary: productSignals.summary,
    limitations: [
      "当前产品子诊断严格基于已上线真实读侧，不包含曝光、点击、CTR、来源和询盘表现。",
      "当前输出属于最小产品诊断层，不等于完整经营驾驶舱。"
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
      "当前订单子诊断只覆盖执行信号与可见资金字段，不包含完整金额趋势、国家结构和产品贡献。",
      "当前输出属于最小订单诊断层，不等于完整经营驾驶舱。"
    ]
  };
}

export function buildWikaMinimalDiagnosticScope(sampleConfig = {}) {
  return {
    can_answer: [
      "当前样本产品的质量分分布、精品标签覆盖与高频问题项",
      "当前样本产品的标题/详情/关键词完整度与更新时间老化情况",
      "当前样本产品的分组与类目结构提示",
      "当前样本订单的物流状态摘要与可见资金字段信号",
      "哪些产品需要优先补详情、补关键词、补结构",
      "哪些订单执行环节需要人工重点关注"
    ],
    cannot_answer: [
      "全店 UV / PV / 曝光 / 点击 / CTR",
      "流量来源、关键词来源、国家来源",
      "询盘表现、响应率、快速回复率",
      "完整订单经营趋势、国家结构、产品贡献",
      "完整经营驾驶舱级别的增长判断"
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

  return buildWikaProductMinimalDiagnosticReport(
    productSignals,
    sampleConfig,
    generatedAt
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

  const productReport = buildWikaProductMinimalDiagnosticReport(
    productSignals,
    productSampleConfig,
    generatedAt
  );
  const orderReport = buildWikaOrderMinimalDiagnosticReport(
    orderSignals,
    orderSampleConfig,
    generatedAt
  );
  const sampleConfig = {
    ...productSampleConfig,
    ...orderSampleConfig
  };

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
    available_signals: [
      ...productReport.available_signals,
      ...orderReport.available_signals
    ],
    diagnostic_findings: [
      ...productReport.diagnostic_findings,
      ...orderReport.diagnostic_findings
    ],
    recommendations: buildOperationsRecommendations(productSignals, orderSignals),
    missing_data_blockers: buildOperationsMissingDataBlockers(),
    scope_definition: buildWikaMinimalDiagnosticScope(sampleConfig),
    product_diagnostic: productSignals,
    order_diagnostic: orderSignals,
    limitations: [
      "当前诊断严格基于已上线真实读侧能力，不包含 mydata / overview / self.product 指标。",
      "当前输出属于最小经营诊断层，不等于完整经营驾驶舱。"
    ]
  };
}
