import { AlibabaTopApiError } from "../clients/alibaba-top-client.js";
import {
  callAlibabaSyncApi,
  resolveAlibabaSyncEndpoint
} from "../clients/alibaba-sync-client.js";
import { fetchWikaProductList } from "../../../projects/wika/data/products/module.js";

export const MYDATA_PRODUCT_PERFORMANCE_METHODS = Object.freeze({
  date: "alibaba.mydata.self.product.date.get",
  performance: "alibaba.mydata.self.product.get"
});

export const MYDATA_PRODUCT_PERFORMANCE_OFFICIAL_FIELDS = Object.freeze([
  "click",
  "impression",
  "visitor",
  "fb",
  "order",
  "bookmark",
  "compare",
  "share",
  "keyword_effects"
]);

export const MYDATA_PRODUCT_UNAVAILABLE_DIMENSIONS = Object.freeze([
  "access_source",
  "inquiry_source",
  "country_source",
  "period_over_period_change"
]);

const VALID_STATISTICS_TYPES = new Set(["day", "week", "month"]);

function buildMissingParameterError(message, missingKeys) {
  const error = new Error(message);
  error.missingKeys = missingKeys;
  return error;
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

function collectObjects(node, predicate, collector = []) {
  if (Array.isArray(node)) {
    for (const item of node) {
      collectObjects(item, predicate, collector);
    }
    return collector;
  }

  if (!node || typeof node !== "object") {
    return collector;
  }

  if (predicate(node)) {
    collector.push(node);
  }

  for (const value of Object.values(node)) {
    collectObjects(value, predicate, collector);
  }

  return collector;
}

function collectAllKeys(node, collector = new Set()) {
  if (Array.isArray(node)) {
    for (const item of node) {
      collectAllKeys(item, collector);
    }
    return collector;
  }

  if (!node || typeof node !== "object") {
    return collector;
  }

  for (const [key, value] of Object.entries(node)) {
    collector.add(key);
    collectAllKeys(value, collector);
  }

  return collector;
}

function toNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildOfficialSource(apiName, endpointUrl) {
  return {
    type: "official_api",
    api_name: apiName,
    endpoint_url: endpointUrl,
    auth_parameter: "access_token",
    sign_method: "sha256"
  };
}

function buildResponseMeta(payload, extra = {}) {
  return {
    request_id: payload?.request_id ?? null,
    trace_id: payload?._trace_id_ ?? null,
    ...extra
  };
}

function extractBusinessFailure(payload) {
  if (payload?.success === false || payload?.biz_success === false) {
    return {
      code: payload?.error_code ?? payload?.code ?? null,
      sub_code: payload?.sub_code ?? null,
      msg: payload?.error_message ?? payload?.message ?? "Alibaba mydata business failure",
      sub_msg: payload?.sub_msg ?? null
    };
  }

  if (payload?.result?.success === false) {
    return {
      code: payload?.result?.error_code ?? null,
      sub_code: payload?.result?.sub_code ?? null,
      msg:
        payload?.result?.error_message ??
        payload?.result?.message ??
        "Alibaba mydata business failure",
      sub_msg: payload?.result?.sub_msg ?? null
    };
  }

  return null;
}

function assertBusinessSuccess(apiName, endpointUrl, payload) {
  const businessFailure = extractBusinessFailure(payload);
  if (!businessFailure) {
    return;
  }

  throw new AlibabaTopApiError("Alibaba mydata API returned business failure", {
    apiName,
    endpointUrl,
    errorResponse: businessFailure,
    payload
  });
}

function normalizeStatisticsType(statisticsType = "day") {
  const normalized = String(statisticsType || "day").trim().toLowerCase();
  if (VALID_STATISTICS_TYPES.has(normalized)) {
    return normalized;
  }

  throw buildMissingParameterError(
    "Product performance requires statistics_type in day/week/month",
    ["statistics_type"]
  );
}

function normalizeProductIds(productIds) {
  const rawValues = Array.isArray(productIds)
    ? productIds
    : typeof productIds === "string"
      ? productIds
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

  const normalized = [...new Set(rawValues.map((item) => String(item).trim()).filter((item) => /^\d+$/.test(item)))].slice(0, 20);

  if (normalized.length === 0) {
    throw buildMissingParameterError(
      "Product performance requires at least one numeric product_id",
      ["product_ids"]
    );
  }

  return normalized;
}

function deduplicateBy(items, keyBuilder) {
  const seen = new Set();
  const output = [];

  for (const item of items) {
    const key = keyBuilder(item);
    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(item);
  }

  return output;
}

function normalizeDateWindows(payload) {
  const dateWindows = collectObjects(
    payload,
    (item) =>
      item &&
      typeof item === "object" &&
      Object.prototype.hasOwnProperty.call(item, "start_date") &&
      Object.prototype.hasOwnProperty.call(item, "end_date")
  ).map((item) => ({
    start_date: item.start_date ?? null,
    end_date: item.end_date ?? null
  }));

  return deduplicateBy(
    dateWindows.filter((item) => item.start_date && item.end_date),
    (item) => `${item.start_date}:${item.end_date}`
  );
}

function normalizePerformanceRecords(payload) {
  const records = collectObjects(
    payload,
    (item) =>
      item &&
      typeof item === "object" &&
      ("click" in item ||
        "impression" in item ||
        "visitor" in item ||
        "fb" in item ||
        "order" in item ||
        "bookmark" in item ||
        "compare" in item ||
        "share" in item ||
        "keyword_effects" in item)
  ).map((item) => ({
    product_id: item.product_id ?? item.id ?? null,
    click: toNumber(item.click),
    impression: toNumber(item.impression),
    visitor: toNumber(item.visitor),
    fb: toNumber(item.fb),
    order: toNumber(item.order),
    bookmark: toNumber(item.bookmark),
    compare: toNumber(item.compare),
    share: toNumber(item.share),
    keyword_effects:
      item.keyword_effects && typeof item.keyword_effects === "object"
        ? item.keyword_effects
        : item.keyword_effects ?? null
  }));

  return deduplicateBy(
    records.filter((item) => item.product_id !== null),
    (item) => String(item.product_id)
  );
}

function buildDerivedCtr(item = {}) {
  if (!Number.isFinite(item.click) || !Number.isFinite(item.impression) || item.impression <= 0) {
    return {
      value: null,
      derived: true,
      formula: "click / impression",
      note: "Unavailable because click or impression is missing, non-numeric, or impression <= 0"
    };
  }

  return {
    value: Number((item.click / item.impression).toFixed(4)),
    derived: true,
    formula: "click / impression",
    note: "Derived from official fields click and impression"
  };
}

function buildBoundaryStatement() {
  return {
    not_full_product_performance_cockpit: true,
    official_mydata_subset_only: true,
    conservative_mapping_rules: [
      "Keep official field names: click / impression / visitor / fb / order / bookmark / compare / share / keyword_effects",
      "CTR is exposed only as a derived field from click and impression",
      "Unavailable dimensions remain explicit instead of inferred"
    ]
  };
}

async function pickDefaultProductIds(clientConfig, query = {}) {
  const upstreamPageSize = Math.min(
    Number.parseInt(String(query.product_page_size ?? ""), 10) || 20,
    30
  );
  const upstreamLimit = Math.min(
    Number.parseInt(String(query.product_id_limit ?? ""), 10) || 5,
    20
  );
  const listResult = await fetchWikaProductList(clientConfig, {
    page_size: upstreamPageSize
  });
  const numericProductIds = [
    ...new Set(
      safeArray(listResult.items)
        .map((item) => item?.id ?? item?.product_id ?? null)
        .map((value) => String(value ?? "").trim())
        .filter((value) => /^\d+$/.test(value))
    )
  ].slice(0, upstreamLimit);

  if (numericProductIds.length === 0) {
    throw new AlibabaTopApiError("Wika product performance summary could not resolve numeric product ids", {
      apiName: MYDATA_PRODUCT_PERFORMANCE_METHODS.performance,
      errorResponse: {
        code: null,
        sub_code: "upstream_product_ids_missing",
        msg: "products/list did not return usable numeric product ids",
        sub_msg: null
      }
    });
  }

  return {
    product_ids: numericProductIds,
    upstream_page_size: upstreamPageSize,
    upstream_limit: upstreamLimit,
    upstream_total_item: listResult.response_meta?.total_item ?? null
  };
}

export async function getSelfProductDateWindows(
  {
    account,
    appKey,
    appSecret,
    accessToken,
    endpointUrl
  },
  { statisticsType } = {}
) {
  const normalizedStatisticsType = normalizeStatisticsType(statisticsType);
  const effectiveEndpointUrl = resolveAlibabaSyncEndpoint(endpointUrl);
  const response = await callAlibabaSyncApi({
    apiName: MYDATA_PRODUCT_PERFORMANCE_METHODS.date,
    appKey,
    appSecret,
    accessToken,
    endpointUrl: effectiveEndpointUrl,
    businessParams: {
      statistics_type: normalizedStatisticsType
    }
  });

  const payload = response.payload ?? {};
  assertBusinessSuccess(
    MYDATA_PRODUCT_PERFORMANCE_METHODS.date,
    effectiveEndpointUrl,
    payload
  );
  const dateWindows = normalizeDateWindows(payload);

  return {
    account: account ?? "wika",
    module: "products",
    read_only: true,
    source: buildOfficialSource(MYDATA_PRODUCT_PERFORMANCE_METHODS.date, effectiveEndpointUrl),
    data_scope: "self_product_date_windows",
    request_meta: {
      statistics_type: normalizedStatisticsType
    },
    response_meta: buildResponseMeta(payload, {
      returned_window_count: dateWindows.length
    }),
    verified_fields: ["date_windows.start_date", "date_windows.end_date"],
    raw_root_key: response.rootKey,
    statistics_type: normalizedStatisticsType,
    date_windows: dateWindows
  };
}

export async function getSelfProductPerformance(
  {
    account,
    appKey,
    appSecret,
    accessToken,
    endpointUrl
  },
  { statisticsType, statDate, productIds } = {}
) {
  const normalizedStatisticsType = normalizeStatisticsType(statisticsType);
  const normalizedStatDate = String(statDate ?? "").trim();
  if (!normalizedStatDate) {
    throw buildMissingParameterError(
      "Product performance requires stat_date",
      ["stat_date"]
    );
  }
  const normalizedProductIds = normalizeProductIds(productIds);
  const effectiveEndpointUrl = resolveAlibabaSyncEndpoint(endpointUrl);
  const response = await callAlibabaSyncApi({
    apiName: MYDATA_PRODUCT_PERFORMANCE_METHODS.performance,
    appKey,
    appSecret,
    accessToken,
    endpointUrl: effectiveEndpointUrl,
    businessParams: {
      statistics_type: normalizedStatisticsType,
      stat_date: normalizedStatDate,
      product_ids: normalizedProductIds
    }
  });

  const payload = response.payload ?? {};
  assertBusinessSuccess(
    MYDATA_PRODUCT_PERFORMANCE_METHODS.performance,
    effectiveEndpointUrl,
    payload
  );
  const records = normalizePerformanceRecords(payload);
  const payloadKeys = [...collectAllKeys(payload)].sort();
  const confirmedFields = MYDATA_PRODUCT_PERFORMANCE_OFFICIAL_FIELDS.filter((field) =>
    records.some((item) => item[field] !== undefined && item[field] !== null)
  );

  return {
    account: account ?? "wika",
    module: "products",
    read_only: true,
    source: buildOfficialSource(
      MYDATA_PRODUCT_PERFORMANCE_METHODS.performance,
      effectiveEndpointUrl
    ),
    data_scope: "self_product_performance",
    request_meta: {
      statistics_type: normalizedStatisticsType,
      stat_date: normalizedStatDate,
      product_ids: normalizedProductIds
    },
    response_meta: buildResponseMeta(payload, {
      returned_item_count: records.length,
      confirmed_field_count: confirmedFields.length
    }),
    verified_fields: [...MYDATA_PRODUCT_PERFORMANCE_OFFICIAL_FIELDS],
    raw_root_key: response.rootKey,
    confirmed_fields: confirmedFields,
    items: records,
    extra_fields: {
      source_related: payloadKeys.filter((key) => /source|traffic/i.test(key)),
      country_related: payloadKeys.filter((key) => /country|nation/i.test(key)),
      trend_related: payloadKeys.filter((key) => /change|trend|period|mom|yoy/i.test(key))
    }
  };
}

export async function fetchWikaProductPerformanceSummary(clientConfig, query = {}) {
  const generatedAt = new Date().toISOString();
  const statisticsType = normalizeStatisticsType(query.statistics_type ?? "day");
  const dateWindowResult = await getSelfProductDateWindows(clientConfig, {
    statisticsType
  });
  const selectedWindow = safeArray(dateWindowResult.date_windows).find(
    (item) => item?.start_date && item?.end_date
  );
  const statDate = String(query.stat_date ?? selectedWindow?.end_date ?? "").trim();
  if (!statDate) {
    throw new AlibabaTopApiError("Wika product performance summary could not resolve stat_date", {
      apiName: MYDATA_PRODUCT_PERFORMANCE_METHODS.date,
      errorResponse: {
        code: null,
        sub_code: "missing_stat_date",
        msg: "self.product.date.get did not return a usable stat_date",
        sub_msg: null
      }
    });
  }

  const resolvedProductIds = query.product_ids
    ? {
        product_ids: normalizeProductIds(query.product_ids),
        upstream_page_size: null,
        upstream_limit: null,
        upstream_total_item: null
      }
    : await pickDefaultProductIds(clientConfig, query);

  const performanceResult = await getSelfProductPerformance(clientConfig, {
    statisticsType,
    statDate,
    productIds: resolvedProductIds.product_ids
  });

  const items = performanceResult.items.map((item) => ({
    product_id: item.product_id,
    official_metrics: {
      click: item.click,
      impression: item.impression,
      visitor: item.visitor,
      fb: item.fb,
      order: item.order,
      bookmark: item.bookmark,
      compare: item.compare,
      share: item.share,
      keyword_effects: item.keyword_effects
    },
    derived_metrics: {
      ctr_from_click_over_impression: buildDerivedCtr(item)
    }
  }));

  return {
    ok: true,
    account: clientConfig.account ?? "wika",
    module: "products",
    report_name: "performance_summary",
    read_only: true,
    generated_at: generatedAt,
    source_methods: [
      MYDATA_PRODUCT_PERFORMANCE_METHODS.date,
      MYDATA_PRODUCT_PERFORMANCE_METHODS.performance
    ],
    statistics_type: statisticsType,
    stat_date: statDate,
    product_ids: resolvedProductIds.product_ids,
    item_count: items.length,
    items,
    unavailable_dimensions: [...MYDATA_PRODUCT_UNAVAILABLE_DIMENSIONS],
    boundary_statement: buildBoundaryStatement(),
    data_validation: {
      confirmed_official_fields: [...performanceResult.confirmed_fields],
      unavailable_dimensions: [...MYDATA_PRODUCT_UNAVAILABLE_DIMENSIONS]
    },
    upstream_context: {
      date_window: selectedWindow ?? null,
      product_ids_source: query.product_ids
        ? "query.product_ids"
        : "/integrations/alibaba/wika/data/products/list",
      upstream_page_size: resolvedProductIds.upstream_page_size,
      upstream_total_item: resolvedProductIds.upstream_total_item
    }
  };
}
