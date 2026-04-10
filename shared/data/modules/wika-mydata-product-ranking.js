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

function sumMetric(items, metricName) {
  return safeArray(items).reduce((sum, item) => {
    const value = toNumber(item?.official_metrics?.[metricName]);
    return sum + (value ?? 0);
  }, 0);
}

function buildDerivedCtr(click, impression) {
  if (!Number.isFinite(click) || !Number.isFinite(impression) || impression <= 0) {
    return {
      value: null,
      derived: true,
      formula: "click / impression",
      note: "当前样本缺少 click 或 impression，或 impression <= 0，无法稳定派生 CTR。"
    };
  }

  return {
    value: Number((click / impression).toFixed(4)),
    derived: true,
    formula: "click / impression",
    note: "由 official fields click 与 impression 保守派生。"
  };
}

function sortItemsByMetric(items, metricName) {
  return [...safeArray(items)].sort((left, right) => {
    const rightValue = toNumber(right?.official_metrics?.[metricName]) ?? -1;
    const leftValue = toNumber(left?.official_metrics?.[metricName]) ?? -1;
    if (rightValue !== leftValue) {
      return rightValue - leftValue;
    }

    const rightImpression = toNumber(right?.official_metrics?.impression) ?? -1;
    const leftImpression = toNumber(left?.official_metrics?.impression) ?? -1;
    return rightImpression - leftImpression;
  });
}

export function buildAggregateOfficialMetrics(items = []) {
  return {
    click: sumMetric(items, "click"),
    impression: sumMetric(items, "impression"),
    visitor: sumMetric(items, "visitor"),
    fb: sumMetric(items, "fb"),
    order: sumMetric(items, "order"),
    bookmark: sumMetric(items, "bookmark"),
    compare: sumMetric(items, "compare"),
    share: sumMetric(items, "share")
  };
}

export function buildAggregateDerivedMetrics(aggregateOfficialMetrics = {}) {
  return {
    ctr_from_click_over_impression: buildDerivedCtr(
      toNumber(aggregateOfficialMetrics.click),
      toNumber(aggregateOfficialMetrics.impression)
    )
  };
}

export function buildTopProductsByMetric(items = [], metricName, limit = 5) {
  return sortItemsByMetric(items, metricName)
    .filter((item) => (toNumber(item?.official_metrics?.[metricName]) ?? 0) > 0)
    .slice(0, limit)
    .map((item) => ({
      product_id: item.product_id ?? null,
      product_name: item.product_name ?? null,
      metric_name: metricName,
      metric_value: toNumber(item?.official_metrics?.[metricName]),
      official_metrics: {
        impression: toNumber(item?.official_metrics?.impression),
        click: toNumber(item?.official_metrics?.click),
        visitor: toNumber(item?.official_metrics?.visitor),
        fb: toNumber(item?.official_metrics?.fb),
        order: toNumber(item?.official_metrics?.order)
      },
      derived_metrics: {
        ctr_from_click_over_impression:
          item?.derived_metrics?.ctr_from_click_over_impression ?? null
      }
    }));
}

export function buildKeywordSignalSummary(items = []) {
  const visibleItems = safeArray(items).filter((item) => {
    const keywordEffects = item?.official_metrics?.keyword_effects;
    return keywordEffects && typeof keywordEffects === "object";
  });

  const keywordKeysCount = {};
  for (const item of visibleItems) {
    for (const key of Object.keys(item?.official_metrics?.keyword_effects ?? {})) {
      keywordKeysCount[key] = (keywordKeysCount[key] ?? 0) + 1;
    }
  }

  const topKeywordEffectKeys = Object.entries(keywordKeysCount)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 10)
    .map(([key, count]) => ({
      key,
      count
    }));

  return {
    products_with_keyword_effects: visibleItems.length,
    top_keyword_effect_keys: topKeywordEffectKeys,
    sample_products: visibleItems.slice(0, 5).map((item) => ({
      product_id: item.product_id ?? null,
      product_name: item.product_name ?? null,
      keyword_effect_keys: Object.keys(item?.official_metrics?.keyword_effects ?? {})
    }))
  };
}
