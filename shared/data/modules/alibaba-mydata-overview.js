import { AlibabaTopApiError } from "../clients/alibaba-top-client.js";
import {
  callAlibabaSyncApi,
  resolveAlibabaSyncEndpoint
} from "../clients/alibaba-sync-client.js";

export const MYDATA_OVERVIEW_METHODS = Object.freeze({
  date: "alibaba.mydata.overview.date.get",
  industry: "alibaba.mydata.overview.industry.get",
  indicatorBasic: "alibaba.mydata.overview.indicator.basic.get"
});

export const MYDATA_OVERVIEW_OFFICIAL_FIELDS = Object.freeze([
  "visitor",
  "imps",
  "clk",
  "clk_rate",
  "fb",
  "reply"
]);

export const MYDATA_OVERVIEW_UNAVAILABLE_DIMENSIONS = Object.freeze([
  "traffic_source",
  "country_source",
  "quick_reply_rate"
]);

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

function collectValuesByKey(node, targetKey, collector = []) {
  if (Array.isArray(node)) {
    for (const item of node) {
      collectValuesByKey(item, targetKey, collector);
    }
    return collector;
  }

  if (!node || typeof node !== "object") {
    return collector;
  }

  for (const [key, value] of Object.entries(node)) {
    if (key === targetKey) {
      collector.push(value);
    }
    collectValuesByKey(value, targetKey, collector);
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

function toBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y"].includes(normalized)) {
      return true;
    }
    if (["false", "0", "no", "n"].includes(normalized)) {
      return false;
    }
  }

  return null;
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

function normalizeDateRangeInput(dateRange = {}) {
  const startDate = String(
    dateRange?.start_date ?? dateRange?.startDate ?? ""
  ).trim();
  const endDate = String(dateRange?.end_date ?? dateRange?.endDate ?? "").trim();

  if (!startDate || !endDate) {
    throw buildMissingParameterError(
      "Mydata overview requires date range start_date and end_date",
      ["start_date", "end_date"]
    );
  }

  return {
    start_date: startDate,
    end_date: endDate
  };
}

function normalizeIndustryInput({
  industry = null,
  industryId = null,
  industryDesc = null,
  mainCategory = null
} = {}) {
  const candidate = industry && typeof industry === "object" ? industry : {};
  const normalized = {
    industry_id:
      candidate.industry_id ?? candidate.industryId ?? industryId ?? null,
    industry_desc:
      candidate.industry_desc ?? candidate.industryDesc ?? industryDesc ?? null,
    main_category:
      toBoolean(candidate.main_category ?? candidate.mainCategory ?? mainCategory) ??
      null
  };

  if (normalized.industry_id === null || normalized.industry_id === "") {
    throw buildMissingParameterError(
      "Mydata overview indicator requires industry_id",
      ["industry_id"]
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

function normalizeDateRanges(payload) {
  const ranges = collectObjects(
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
    ranges.filter((item) => item.start_date && item.end_date),
    (item) => `${item.start_date}:${item.end_date}`
  );
}

function normalizeIndustries(payload) {
  const industries = collectObjects(
    payload,
    (item) =>
      item &&
      typeof item === "object" &&
      ("industry_id" in item || "industry_desc" in item || "main_category" in item)
  ).map((item) => ({
    industry_id: item.industry_id ?? null,
    industry_desc: item.industry_desc ?? null,
    main_category: toBoolean(item.main_category)
  }));

  return deduplicateBy(
    industries.filter((item) => item.industry_id !== null),
    (item) => String(item.industry_id)
  );
}

function normalizeIndicatorBasic(payload) {
  const officialMetrics = {};
  for (const field of MYDATA_OVERVIEW_OFFICIAL_FIELDS) {
    const values = collectValuesByKey(payload, field);
    officialMetrics[field] = values.length > 0 ? values[0] : null;
  }

  const payloadKeys = [...collectAllKeys(payload)].sort();

  return {
    official_metrics: officialMetrics,
    confirmed_fields: MYDATA_OVERVIEW_OFFICIAL_FIELDS.filter(
      (field) => officialMetrics[field] !== null
    ),
    extra_fields: {
      source_related: payloadKeys.filter((key) => /source|traffic/i.test(key)),
      country_related: payloadKeys.filter((key) => /country|nation/i.test(key)),
      quick_reply_related: payloadKeys.filter((key) =>
        /quick|fast.*reply|reply_rate/i.test(key)
      )
    }
  };
}

function buildOverviewDerivedMetrics(officialMetrics = {}) {
  return {
    uv_candidate_from_visitor: {
      value: officialMetrics.visitor ?? null,
      derived_or_mapped: true,
      note: "UV ~= visitor (business-mapping pending)"
    },
    exposure_from_imps: {
      value: officialMetrics.imps ?? null,
      derived_or_mapped: true,
      note: "Use exposure/imps wording; do not assert PV confirmed"
    },
    ctr_candidate_from_clk_rate: {
      value: officialMetrics.clk_rate ?? null,
      derived_or_mapped: true,
      note: "Official clk_rate is preserved; downstream CTR interpretation remains conservative"
    },
    reply_related_metric_from_reply: {
      value: officialMetrics.reply ?? null,
      derived_or_mapped: true,
      note: "Use reply-related metric / recent first-reply-rate wording instead of broad response-rate"
    }
  };
}

function buildOverviewBoundaryStatement() {
  return {
    not_full_store_dashboard: true,
    official_mydata_subset_only: true,
    conservative_mapping_rules: [
      "Keep official field names: visitor / imps / clk / clk_rate / fb / reply",
      "UV ~= visitor (business-mapping pending)",
      "Use exposure/imps wording instead of asserting PV confirmed",
      "Use reply-related metric / recent first-reply-rate wording instead of broad response-rate"
    ]
  };
}

export function pickPrimaryOverviewDateRange(dateRanges = []) {
  return safeArray(dateRanges).find((item) => item?.start_date && item?.end_date) ?? null;
}

export function pickPrimaryOverviewIndustry(industries = []) {
  const normalized = safeArray(industries).filter((item) => item?.industry_id !== null);
  return normalized.find((item) => item.main_category === true) ?? normalized[0] ?? null;
}

export async function getOverviewDateRange(
  {
    account,
    appKey,
    appSecret,
    accessToken,
    endpointUrl
  },
  _query = {}
) {
  const effectiveEndpointUrl = resolveAlibabaSyncEndpoint(endpointUrl);
  const response = await callAlibabaSyncApi({
    apiName: MYDATA_OVERVIEW_METHODS.date,
    appKey,
    appSecret,
    accessToken,
    endpointUrl: effectiveEndpointUrl,
    businessParams: {}
  });

  const payload = response.payload ?? {};
  assertBusinessSuccess(MYDATA_OVERVIEW_METHODS.date, effectiveEndpointUrl, payload);
  const dateRanges = normalizeDateRanges(payload);

  return {
    account: account ?? "wika",
    module: "operations",
    read_only: true,
    source: buildOfficialSource(MYDATA_OVERVIEW_METHODS.date, effectiveEndpointUrl),
    data_scope: "overview_date_range",
    request_meta: {},
    response_meta: buildResponseMeta(payload, {
      returned_date_range_count: dateRanges.length
    }),
    verified_fields: ["date_ranges.start_date", "date_ranges.end_date"],
    raw_root_key: response.rootKey,
    date_ranges: dateRanges
  };
}

export async function getOverviewIndustries(
  {
    account,
    appKey,
    appSecret,
    accessToken,
    endpointUrl
  },
  { dateRange } = {}
) {
  const normalizedDateRange = normalizeDateRangeInput(dateRange);
  const effectiveEndpointUrl = resolveAlibabaSyncEndpoint(endpointUrl);
  const response = await callAlibabaSyncApi({
    apiName: MYDATA_OVERVIEW_METHODS.industry,
    appKey,
    appSecret,
    accessToken,
    endpointUrl: effectiveEndpointUrl,
    businessParams: {
      date_range: normalizedDateRange
    }
  });

  const payload = response.payload ?? {};
  assertBusinessSuccess(
    MYDATA_OVERVIEW_METHODS.industry,
    effectiveEndpointUrl,
    payload
  );
  const industries = normalizeIndustries(payload);

  return {
    account: account ?? "wika",
    module: "operations",
    read_only: true,
    source: buildOfficialSource(MYDATA_OVERVIEW_METHODS.industry, effectiveEndpointUrl),
    data_scope: "overview_industry",
    request_meta: {
      date_range: normalizedDateRange
    },
    response_meta: buildResponseMeta(payload, {
      returned_industry_count: industries.length
    }),
    verified_fields: ["industries.industry_id", "industries.industry_desc", "industries.main_category"],
    raw_root_key: response.rootKey,
    industries
  };
}

export async function getOverviewIndicatorBasic(
  {
    account,
    appKey,
    appSecret,
    accessToken,
    endpointUrl
  },
  {
    dateRange,
    industry = null,
    industryId = null,
    industryDesc = null,
    mainCategory = null
  } = {}
) {
  const normalizedDateRange = normalizeDateRangeInput(dateRange);
  const normalizedIndustry = normalizeIndustryInput({
    industry,
    industryId,
    industryDesc,
    mainCategory
  });
  const effectiveEndpointUrl = resolveAlibabaSyncEndpoint(endpointUrl);
  const response = await callAlibabaSyncApi({
    apiName: MYDATA_OVERVIEW_METHODS.indicatorBasic,
    appKey,
    appSecret,
    accessToken,
    endpointUrl: effectiveEndpointUrl,
    businessParams: {
      date_range: normalizedDateRange,
      industry: normalizedIndustry
    }
  });

  const payload = response.payload ?? {};
  assertBusinessSuccess(
    MYDATA_OVERVIEW_METHODS.indicatorBasic,
    effectiveEndpointUrl,
    payload
  );
  const normalized = normalizeIndicatorBasic(payload);

  return {
    account: account ?? "wika",
    module: "operations",
    read_only: true,
    source: buildOfficialSource(
      MYDATA_OVERVIEW_METHODS.indicatorBasic,
      effectiveEndpointUrl
    ),
    data_scope: "overview_indicator_basic",
    request_meta: {
      date_range: normalizedDateRange,
      industry: normalizedIndustry
    },
    response_meta: buildResponseMeta(payload, {
      confirmed_field_count: normalized.confirmed_fields.length
    }),
    verified_fields: MYDATA_OVERVIEW_OFFICIAL_FIELDS,
    raw_root_key: response.rootKey,
    official_metrics: normalized.official_metrics,
    confirmed_fields: normalized.confirmed_fields,
    extra_fields: normalized.extra_fields
  };
}

export async function fetchWikaOperationsTrafficSummary(clientConfig, query = {}) {
  const generatedAt = new Date().toISOString();
  const dateRangeResult = await getOverviewDateRange(clientConfig);
  const selectedDateRange =
    query.start_date && query.end_date
      ? normalizeDateRangeInput({
          start_date: query.start_date,
          end_date: query.end_date
        })
      : pickPrimaryOverviewDateRange(dateRangeResult.date_ranges);

  if (!selectedDateRange) {
    throw new AlibabaTopApiError("Wika operations traffic summary could not resolve date range", {
      apiName: MYDATA_OVERVIEW_METHODS.date,
      errorResponse: {
        code: null,
        sub_code: "missing_upstream_date_range",
        msg: "overview.date.get did not return a usable date range",
        sub_msg: null
      }
    });
  }

  const industriesResult = await getOverviewIndustries(clientConfig, {
    dateRange: selectedDateRange
  });
  const selectedIndustry =
    query.industry_id || query.industry_desc || query.main_category !== undefined
      ? normalizeIndustryInput({
          industryId: query.industry_id,
          industryDesc: query.industry_desc,
          mainCategory: query.main_category
        })
      : pickPrimaryOverviewIndustry(industriesResult.industries);

  if (!selectedIndustry) {
    throw new AlibabaTopApiError("Wika operations traffic summary could not resolve industry", {
      apiName: MYDATA_OVERVIEW_METHODS.industry,
      errorResponse: {
        code: null,
        sub_code: "missing_upstream_industry",
        msg: "overview.industry.get did not return a usable industry",
        sub_msg: null
      }
    });
  }

  const indicatorResult = await getOverviewIndicatorBasic(clientConfig, {
    dateRange: selectedDateRange,
    industry: selectedIndustry
  });

  return {
    ok: true,
    account: clientConfig.account ?? "wika",
    module: "operations",
    report_name: "traffic_summary",
    read_only: true,
    generated_at: generatedAt,
    source_methods: [
      MYDATA_OVERVIEW_METHODS.date,
      MYDATA_OVERVIEW_METHODS.industry,
      MYDATA_OVERVIEW_METHODS.indicatorBasic
    ],
    date_range: selectedDateRange,
    industry: selectedIndustry,
    official_metrics: indicatorResult.official_metrics,
    derived_metrics: buildOverviewDerivedMetrics(indicatorResult.official_metrics),
    unavailable_dimensions: [...MYDATA_OVERVIEW_UNAVAILABLE_DIMENSIONS],
    boundary_statement: buildOverviewBoundaryStatement(),
    data_validation: {
      confirmed_official_fields: [...indicatorResult.confirmed_fields],
      unavailable_dimensions: [...MYDATA_OVERVIEW_UNAVAILABLE_DIMENSIONS]
    },
    upstream_context: {
      available_date_range_count: dateRangeResult.response_meta.returned_date_range_count,
      available_industry_count: industriesResult.response_meta.returned_industry_count
    }
  };
}
