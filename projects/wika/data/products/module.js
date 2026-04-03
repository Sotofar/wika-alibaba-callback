import {
  AlibabaTopApiError,
  DEFAULT_ALIBABA_TOP_API_URL
} from "../../../../shared/data/clients/alibaba-top-client.js";
import {
  createSourceDescriptor,
  DATA_QUALITY_STATUS
} from "../../../../shared/data/clients/source-status.js";
import { fetchAlibabaSellerPageJson } from "../../../../shared/data/clients/alibaba-seller-page-client.js";
import { signAlibabaRequest } from "../../../../src/alibaba/sign.js";

const PRODUCT_PERFORMANCE_URL =
  "https://mydata.alibaba.com/self/.json?action=OneAction&iName=customerAdviser/prodList";
const DEFAULT_ALIBABA_SYNC_API_URL = "https://open-api.alibaba.com/sync";

const OFFICIAL_PRODUCT_FIELDS = Object.freeze([
  "current_page",
  "page_size",
  "total_item",
  "products.group_id",
  "products.group_name",
  "products.id",
  "products.keywords",
  "products.main_image.images",
  "products.status",
  "products.subject",
  "products.product_type",
  "products.language",
  "products.display",
  "products.owner_member_display_name",
  "products.category_id",
  "products.is_specific",
  "products.is_rts",
  "products.pc_detail_url",
  "products.gmt_create",
  "products.gmt_modified",
  "products.product_id"
]);

const PAGE_PRODUCT_FIELDS = Object.freeze([
  "product_id",
  "product_name",
  "detail_uv",
  "business_uv",
  "business_rate",
  "message_uv",
  "order_uv",
  "price",
  "price_range",
  "min_order_quantity",
  "detail_url",
  "is_showcase",
  "promotion_status_code"
]);

const UNIFIED_PRODUCT_FIELDS = Object.freeze([
  "join_key",
  "match_status",
  "product_id",
  "official_product_id",
  "product_name",
  "group_id",
  "group_name",
  "status",
  "display",
  "language",
  "category_id",
  "product_type",
  "keywords",
  "main_image_urls",
  "image_url",
  "owner_member_display_name",
  "pc_detail_url",
  "detail_url",
  "gmt_create",
  "gmt_modified",
  "red_model",
  "detail_uv",
  "business_uv",
  "business_rate",
  "message_uv",
  "order_uv",
  "market_contact_uv",
  "price",
  "price_range",
  "price_unit",
  "min_order_quantity",
  "min_order_quantity_display",
  "is_showcase",
  "promotion_status_code"
]);

const PRODUCT_PERIODS = Object.freeze(new Set(["7d", "30d", "90d"]));

function toPositiveInteger(value, fallbackValue) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallbackValue;
  }

  return parsed;
}

function toOptionalNumber(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatPercent(value) {
  const parsed = toNumber(value);
  if (parsed === null) {
    return null;
  }

  return `${(parsed * 100).toFixed(2)}%`;
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

function firstNonEmpty(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return null;
}

function pickBusinessParams(query = {}) {
  const currentPage = toPositiveInteger(query.current_page, 1);
  const pageSize = Math.min(toPositiveInteger(query.page_size, 10), 30);

  return {
    current_page: currentPage,
    page_size: pageSize,
    language: String(query.language || "ENGLISH").toUpperCase(),
    category_id: toOptionalNumber(query.category_id),
    subject: query.subject ? String(query.subject).trim() : undefined,
    group_id1: toOptionalNumber(query.group_id1),
    group_id2: toOptionalNumber(query.group_id2),
    group_id3: toOptionalNumber(query.group_id3),
    id: toOptionalNumber(query.id),
    gmt_modified_from: query.gmt_modified_from
      ? String(query.gmt_modified_from)
      : undefined,
    gmt_modified_to: query.gmt_modified_to
      ? String(query.gmt_modified_to)
      : undefined
  };
}

function normalizeOfficialProductItem(item = {}) {
  return {
    group_id: item.group_id ?? null,
    group_name: item.group_name ?? null,
    id: item.id ?? null,
    keywords: Array.isArray(item.keywords) ? item.keywords : [],
    main_image_urls: Array.isArray(item.main_image?.images)
      ? item.main_image.images
      : [],
    status: item.status ?? null,
    subject: item.subject ?? null,
    product_type: item.product_type ?? null,
    language: item.language ?? null,
    display: item.display ?? null,
    owner_member_display_name: item.owner_member_display_name ?? null,
    category_id: item.category_id ?? null,
    is_specific: item.is_specific ?? null,
    is_rts: item.is_rts ?? null,
    pc_detail_url: item.pc_detail_url ?? null,
    smart_edit: item.smart_edit ?? null,
    gmt_create: item.gmt_create ?? null,
    gmt_modified: item.gmt_modified ?? null,
    red_model: item.red_model ?? null,
    product_id: item.product_id ?? null
  };
}

function normalizePageProductItem(item = {}) {
  return {
    product_id: item.prodId ?? null,
    product_name: item.prodName ?? null,
    detail_uv: toNumber(item.detailUv),
    business_uv: toNumber(item.busUv),
    business_rate: toNumber(item.busRate),
    message_uv: toNumber(item.tmUv),
    order_uv: toNumber(item.ordUv),
    market_contact_uv: toNumber(item.mcUv),
    price: item.price ?? null,
    price_range: item.priceRange ?? null,
    price_unit: item.priceUnit ?? null,
    min_order_quantity: item.minOrderQuantity ?? null,
    min_order_quantity_display: item.minOrdQtyStr ?? null,
    detail_url: item.detailUrl ?? null,
    image_url: item.prodImage ?? null,
    is_showcase: item.isShowcase ?? null,
    is_platform_new_product: item.isPlatformNewProd ?? null,
    promotion_status_code: item.prodPromotionStatusCode ?? null
  };
}

function getDateAgeInDays(isoLikeValue) {
  if (!isoLikeValue) {
    return null;
  }

  const timestamp = Date.parse(String(isoLikeValue));
  if (!Number.isFinite(timestamp)) {
    return null;
  }

  return Math.floor((Date.now() - timestamp) / (24 * 60 * 60 * 1000));
}

function mapProductsForFocusList(items = [], limit = 5) {
  return [...items]
    .sort((left, right) => {
      const leftTime = Date.parse(left.gmt_modified || 0);
      const rightTime = Date.parse(right.gmt_modified || 0);
      return rightTime - leftTime;
    })
    .slice(0, limit)
    .map((item) => ({
      id: item.id,
      subject: item.subject,
      group_name: item.group_name,
      status: item.status,
      display: item.display,
      gmt_modified: item.gmt_modified
    }));
}

function resolveProductWindow(windowValue = "30d") {
  if (PRODUCT_PERIODS.has(windowValue)) {
    return windowValue;
  }

  return "30d";
}

function buildPageProductUrl({
  window = "30d",
  pageNo = 1,
  pageSize = 20
} = {}) {
  const url = new URL(PRODUCT_PERFORMANCE_URL);
  url.searchParams.set("action", "OneAction");
  url.searchParams.set("iName", "customerAdviser/prodList");
  url.searchParams.set("byrGroup", "custbank");
  url.searchParams.set("nd", resolveProductWindow(window));
  url.searchParams.set("byrGrowthLevel", "TOTAL");
  url.searchParams.set("isDistinctCrossDay", "Y");
  url.searchParams.set("isRfqSubscribe", "false");
  url.searchParams.set("pageNO", String(pageNo));
  url.searchParams.set("pageSize", String(pageSize));
  return url.toString();
}

function getProductFieldSemantics() {
  return {
    detail_uv:
      "页面原始字段 detailUv，对应当前产品在该时间窗内的详情流量/详情访客指标。",
    business_uv:
      "页面原始字段 busUv。当前保留“商机相关 UV”的原始口径，不直接改写为询盘数。",
    business_rate:
      "页面原始字段 busRate。当前保留“商机率”的原始口径，不直接改写成询盘率。",
    message_uv: "页面原始字段 tmUv，对应 TM 相关 UV 指标。",
    order_uv:
      "页面原始字段 ordUv，表示订单相关 UV 指标，不直接改写成订单数。"
  };
}

function deduplicateProducts(items) {
  const seen = new Map();

  for (const item of items) {
    if (!item.product_id) {
      continue;
    }

    if (!seen.has(item.product_id)) {
      seen.set(item.product_id, item);
    }
  }

  return [...seen.values()];
}

function normalizeJoinKey(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return String(value);
}

function getOfficialCanonicalJoinKey(item = {}) {
  const safeItem = item ?? {};

  return (
    normalizeJoinKey(safeItem.id) ??
    normalizeJoinKey(safeItem.product_id) ??
    null
  );
}

function getOfficialJoinKeys(item = {}) {
  const safeItem = item ?? {};

  return [
    normalizeJoinKey(safeItem.id),
    normalizeJoinKey(safeItem.product_id)
  ].filter(Boolean);
}

function getPerformanceJoinKeys(item = {}) {
  const safeItem = item ?? {};
  return [normalizeJoinKey(safeItem.product_id)].filter(Boolean);
}

function createUnifiedProductItem({ officialItem = null, performanceItem = null } = {}) {
  const joinKey =
    getOfficialJoinKeys(officialItem)[0] ??
    getPerformanceJoinKeys(performanceItem)[0] ??
    null;

  return {
    join_key: joinKey,
    match_status:
      officialItem && performanceItem
        ? "matched"
        : officialItem
          ? "official_only"
          : "performance_only",
    has_official_data: Boolean(officialItem),
    has_performance_data: Boolean(performanceItem),
    product_id: firstNonEmpty(officialItem?.id, performanceItem?.product_id),
    official_product_id: officialItem?.product_id ?? null,
    product_name: firstNonEmpty(officialItem?.subject, performanceItem?.product_name),
    product_name_from_page: performanceItem?.product_name ?? null,
    group_id: officialItem?.group_id ?? null,
    group_name: officialItem?.group_name ?? null,
    status: officialItem?.status ?? null,
    display: officialItem?.display ?? null,
    language: officialItem?.language ?? null,
    category_id: officialItem?.category_id ?? null,
    product_type: officialItem?.product_type ?? null,
    keywords: Array.isArray(officialItem?.keywords) ? officialItem.keywords : [],
    main_image_urls: Array.isArray(officialItem?.main_image_urls)
      ? officialItem.main_image_urls
      : [],
    image_url: firstNonEmpty(
      performanceItem?.image_url,
      Array.isArray(officialItem?.main_image_urls) ? officialItem.main_image_urls[0] : null
    ),
    owner_member_display_name: officialItem?.owner_member_display_name ?? null,
    pc_detail_url: officialItem?.pc_detail_url ?? null,
    detail_url: firstNonEmpty(performanceItem?.detail_url, officialItem?.pc_detail_url),
    gmt_create: officialItem?.gmt_create ?? null,
    gmt_modified: officialItem?.gmt_modified ?? null,
    is_specific: officialItem?.is_specific ?? null,
    is_rts: officialItem?.is_rts ?? null,
    smart_edit: officialItem?.smart_edit ?? null,
    red_model: officialItem?.red_model ?? null,
    detail_uv: performanceItem?.detail_uv ?? null,
    business_uv: performanceItem?.business_uv ?? null,
    business_rate: performanceItem?.business_rate ?? null,
    message_uv: performanceItem?.message_uv ?? null,
    order_uv: performanceItem?.order_uv ?? null,
    market_contact_uv: performanceItem?.market_contact_uv ?? null,
    price: performanceItem?.price ?? null,
    price_range: performanceItem?.price_range ?? null,
    price_unit: performanceItem?.price_unit ?? null,
    min_order_quantity: performanceItem?.min_order_quantity ?? null,
    min_order_quantity_display: performanceItem?.min_order_quantity_display ?? null,
    is_showcase: performanceItem?.is_showcase ?? null,
    is_platform_new_product: performanceItem?.is_platform_new_product ?? null,
    promotion_status_code: performanceItem?.promotion_status_code ?? null,
    field_sources: {
      product_name: officialItem?.subject ? "official_api.subject" : "page_request.product_name",
      detail_url: performanceItem?.detail_url
        ? "page_request.detail_url"
        : officialItem?.pc_detail_url
          ? "official_api.pc_detail_url"
          : null,
      image_url: performanceItem?.image_url
        ? "page_request.image_url"
        : Array.isArray(officialItem?.main_image_urls) && officialItem.main_image_urls[0]
          ? "official_api.main_image_urls[0]"
          : null,
      detail_uv: performanceItem ? "page_request.detail_uv" : null,
      business_uv: performanceItem ? "page_request.business_uv" : null,
      business_rate: performanceItem ? "page_request.business_rate" : null,
      order_uv: performanceItem ? "page_request.order_uv" : null
    }
  };
}

function sortUnifiedProducts(items = []) {
  return [...items].sort((left, right) => {
    const rightTraffic = right.detail_uv ?? -1;
    const leftTraffic = left.detail_uv ?? -1;

    if (rightTraffic !== leftTraffic) {
      return rightTraffic - leftTraffic;
    }

    const rightUpdated = Date.parse(right.gmt_modified || 0);
    const leftUpdated = Date.parse(left.gmt_modified || 0);

    return rightUpdated - leftUpdated;
  });
}

function resolveOfficialProductEndpoint(endpointUrl) {
  if (!endpointUrl || endpointUrl === DEFAULT_ALIBABA_TOP_API_URL) {
    return DEFAULT_ALIBABA_SYNC_API_URL;
  }

  return endpointUrl;
}

function serializeSyncValue(value) {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

async function parseSyncResponse(response) {
  const rawText = await response.text();

  try {
    return {
      rawText,
      json: JSON.parse(rawText)
    };
  } catch {
    return {
      rawText,
      json: null
    };
  }
}

async function callAlibabaProductSyncApi({
  appKey,
  appSecret,
  accessToken,
  endpointUrl,
  businessParams = {},
  timeoutMs = 15_000
}) {
  const requestParams = {
    method: "alibaba.icbu.product.list",
    app_key: appKey,
    access_token: accessToken,
    sign_method: "sha256",
    timestamp: String(Date.now())
  };

  for (const [key, value] of Object.entries(businessParams)) {
    const serializedValue = serializeSyncValue(value);
    if (serializedValue !== "") {
      requestParams[key] = serializedValue;
    }
  }

  requestParams.sign = signAlibabaRequest({
    apiName: "",
    params: requestParams,
    appSecret
  });

  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
      Accept: "application/json"
    },
    body: JSON.stringify(requestParams)
  };

  if (globalThis.AbortSignal?.timeout) {
    requestOptions.signal = AbortSignal.timeout(timeoutMs);
  }

  const response = await fetch(endpointUrl, requestOptions);
  const parsed = await parseSyncResponse(response);

  if (!response.ok) {
    throw new AlibabaTopApiError("Alibaba sync API request failed", {
      apiName: "alibaba.icbu.product.list",
      endpointUrl,
      status: response.status,
      rawText: parsed.rawText
    });
  }

  if (!parsed.json || typeof parsed.json !== "object") {
    throw new AlibabaTopApiError("Alibaba sync API returned non-JSON data", {
      apiName: "alibaba.icbu.product.list",
      endpointUrl,
      rawText: parsed.rawText
    });
  }

  if (parsed.json.error_response) {
    throw new AlibabaTopApiError("TOP API returned error_response", {
      apiName: "alibaba.icbu.product.list",
      endpointUrl,
      errorResponse: parsed.json.error_response
    });
  }

  return {
    rootKey: "alibaba_icbu_product_list_response",
    payload: parsed.json.alibaba_icbu_product_list_response ?? parsed.json,
    raw: parsed.json
  };
}

export async function fetchWikaProductList(
  {
    appKey,
    appSecret,
    accessToken,
    partnerId,
    endpointUrl = DEFAULT_ALIBABA_TOP_API_URL
  },
  query = {}
) {
  const businessParams = pickBusinessParams(query);
  const effectiveEndpointUrl = resolveOfficialProductEndpoint(endpointUrl);
  const response = await callAlibabaProductSyncApi({
    appKey,
    appSecret,
    accessToken,
    endpointUrl: effectiveEndpointUrl,
    businessParams
  });

  const payload = response.payload ?? {};
  const rawProducts = Array.isArray(payload.products?.alibaba_product_brief_response)
    ? payload.products.alibaba_product_brief_response
    : [];
  const normalizedProducts = rawProducts.map(normalizeOfficialProductItem);

  return {
    module: "products",
    account: "wika",
    read_only: true,
    verification_status: DATA_QUALITY_STATUS.VERIFIED,
    evidence_level: "L1",
    source: {
      type: "official_api",
      api_name: "alibaba.icbu.product.list",
      endpoint_url: effectiveEndpointUrl,
      request_method: "POST",
      depends_on_current_token: true,
      requires_browser_session: false,
      auth_parameter: "access_token",
      sign_method: "sha256"
    },
    request: businessParams,
    response_meta: {
      current_page: payload.current_page ?? businessParams.current_page,
      page_size: payload.page_size ?? businessParams.page_size,
      total_item: payload.total_item ?? normalizedProducts.length
    },
    verified_fields: OFFICIAL_PRODUCT_FIELDS,
    items: normalizedProducts,
    raw_root_key: response.rootKey
  };
}

async function fetchWikaProductPerformancePage({
  logPath,
  window = "30d",
  pageNo = 1,
  pageSize = 20
} = {}) {
  const url = buildPageProductUrl({
    window,
    pageNo,
    pageSize
  });

  const response = await fetchAlibabaSellerPageJson(url, {
    logPath,
    referer: "https://data.alibaba.com/product/overview"
  });

  const payload = response.json;
  if (Number(payload.code) !== 0) {
    throw new Error(`Product performance page returned code ${payload.code}`);
  }

  const rawItems = Array.isArray(payload.data?.data) ? payload.data.data : [];

  return {
    request_url: response.url,
    page_no: pageNo,
    requested_page_size: pageSize,
    returned_count: rawItems.length,
    items: rawItems.map(normalizePageProductItem)
  };
}

export async function fetchWikaProductPerformanceList({
  logPath,
  window = "30d",
  requestedPageSize = 100,
  maxPages = 3
} = {}) {
  const normalizedWindow = resolveProductWindow(window);
  const pages = [];

  for (let pageNo = 1; pageNo <= maxPages; pageNo += 1) {
    const pageResult = await fetchWikaProductPerformancePage({
      logPath,
      window: normalizedWindow,
      pageNo,
      pageSize: requestedPageSize
    });

    pages.push(pageResult);
    if (pageResult.returned_count === 0) {
      break;
    }
  }

  const allItems = deduplicateProducts(pages.flatMap((page) => page.items));
  const averageDetailUv = average(allItems, "detail_uv");
  const averageBusinessRate = average(allItems, "business_rate");
  const firstPage = pages[0] ?? null;
  const secondPage = pages[1] ?? null;

  return {
    module: "products",
    account: "wika",
    period: normalizedWindow,
    read_only: true,
    verification_status: DATA_QUALITY_STATUS.VERIFIED,
    evidence_level: "L2",
    source: {
      type: "page_request",
      page_name: "产品表现 / 顾问产品列表",
      request_method: "GET",
      depends_on_current_token: false,
      requires_browser_session: true
    },
    request: {
      window: normalizedWindow,
      requested_page_size: requestedPageSize,
      max_pages_attempted: maxPages
    },
    verified_fields: PAGE_PRODUCT_FIELDS,
    field_semantics: getProductFieldSemantics(),
    items: allItems,
    stats: {
      item_count: allItems.length,
      average_detail_uv: averageDetailUv,
      average_business_rate: averageBusinessRate
    },
    pagination: {
      page_results: pages.map((page) => ({
        page_no: page.page_no,
        returned_count: page.returned_count,
        request_url: page.request_url
      })),
      effective_page_size:
        firstPage && firstPage.returned_count > 0 ? firstPage.returned_count : 0,
      second_page_has_data: (secondPage?.returned_count ?? 0) > 0,
      coverage_status:
        (secondPage?.returned_count ?? 0) > 0
          ? "分页可继续扩展"
          : "当前仅验证到单页样本池，未发现后续分页数据",
      notes: [
        "已验证 nd=7d、30d、90d 均有真实返回。",
        "pageNO=2 当前返回 0 条，暂未证明该接口覆盖全店所有产品。",
        "pageSize 从 20 提高到 50 或 100，当前仍只返回 20 条。"
      ]
    }
  };
}

export async function fetchWikaOfficialProductCatalog(
  officialConfig,
  query = {},
  {
    maxPages,
    stopWhenMatchedIds = []
  } = {}
) {
  const requestedPageSize = toPositiveInteger(query.page_size, 30);
  const pageSize = Math.min(requestedPageSize, 30);
  const targetMatchedIds = new Set(
    stopWhenMatchedIds.map((item) => normalizeJoinKey(item)).filter(Boolean)
  );
  const items = [];
  const pageResults = [];
  const seenCanonicalKeys = new Set();
  let totalItemFromApi = null;

  let currentPage = toPositiveInteger(query.current_page, 1);
  let totalPages = 1;

  while (currentPage <= totalPages) {
    const pageResult = await fetchWikaProductList(officialConfig, {
      ...query,
      current_page: currentPage,
      page_size: pageSize
    });

    const pageItems = Array.isArray(pageResult.items) ? pageResult.items : [];

    for (const item of pageItems) {
      const canonicalKey = getOfficialCanonicalJoinKey(item);
      if (!canonicalKey || seenCanonicalKeys.has(canonicalKey)) {
        continue;
      }

      seenCanonicalKeys.add(canonicalKey);
      items.push(item);
    }

    pageResults.push({
      current_page: pageResult.response_meta?.current_page ?? currentPage,
      page_size: pageResult.response_meta?.page_size ?? pageSize,
      returned_item_count: pageItems.length
    });

    totalItemFromApi = pageResult.response_meta?.total_item ?? totalItemFromApi;
    const totalItem = totalItemFromApi ?? items.length;
    totalPages = Math.max(1, Math.ceil(totalItem / pageSize));

    if (maxPages && currentPage >= maxPages) {
      break;
    }

    if (targetMatchedIds.size > 0) {
      const matchedIds = new Set(
        items.map((item) => getOfficialCanonicalJoinKey(item)).filter(Boolean)
      );
      const allMatched = [...targetMatchedIds].every((id) => matchedIds.has(id));

      if (allMatched) {
        break;
      }
    }

    currentPage += 1;
  }

  return {
    module: "products",
    account: "wika",
    read_only: true,
    verification_status: DATA_QUALITY_STATUS.VERIFIED,
    evidence_level: "L1",
    source: {
      type: "official_api",
      api_name: "alibaba.icbu.product.list",
      endpoint_url: resolveOfficialProductEndpoint(officialConfig?.endpointUrl),
      request_method: "POST",
      depends_on_current_token: true,
      requires_browser_session: false,
      auth_parameter: "access_token",
      sign_method: "sha256"
    },
    request: {
      ...pickBusinessParams(query),
      page_size: pageSize
    },
    response_meta: {
      current_page: 1,
      page_size: pageSize,
      total_item: totalItemFromApi ?? items.length,
      page_results: pageResults,
      pages_fetched: pageResults.length,
      fully_covered:
        pageResults.length ===
        Math.max(1, Math.ceil((totalItemFromApi ?? items.length) / pageSize))
    },
    verified_fields: OFFICIAL_PRODUCT_FIELDS,
    items,
    raw_root_key: "alibaba_icbu_product_list_response"
  };
}

export async function fetchWikaUnifiedProductView({
  officialConfig,
  officialQuery = {},
  performanceLogPath,
  performanceWindow = "30d",
  performanceRequestedPageSize = 100,
  performanceMaxPages = 3,
  officialCatalogMaxPages,
  officialResult,
  performanceResult
} = {}) {
  const resolvedPerformanceResult =
    performanceResult ??
    (await fetchWikaProductPerformanceList({
      logPath: performanceLogPath,
      window: performanceWindow,
      requestedPageSize: performanceRequestedPageSize,
      maxPages: performanceMaxPages
    }));
  const performanceJoinIds = Array.isArray(resolvedPerformanceResult?.items)
    ? resolvedPerformanceResult.items
        .map((item) => normalizeJoinKey(item.product_id))
        .filter(Boolean)
    : [];
  const resolvedOfficialResult =
    officialResult ??
    (officialConfig
      ? await fetchWikaOfficialProductCatalog(officialConfig, officialQuery, {
          maxPages: officialCatalogMaxPages,
          stopWhenMatchedIds: performanceJoinIds
        })
      : null);

  const officialItems = Array.isArray(resolvedOfficialResult?.items)
    ? resolvedOfficialResult.items
    : [];
  const performanceItems = Array.isArray(resolvedPerformanceResult?.items)
    ? resolvedPerformanceResult.items
    : [];

  const officialByCanonicalKey = new Map();
  const officialAliasToCanonicalKey = new Map();
  const performanceByCanonicalKey = new Map();

  for (const item of officialItems) {
    const canonicalKey = getOfficialCanonicalJoinKey(item);
    if (!canonicalKey) {
      continue;
    }

    if (!officialByCanonicalKey.has(canonicalKey)) {
      officialByCanonicalKey.set(canonicalKey, item);
    }

    for (const joinKey of getOfficialJoinKeys(item)) {
      if (!officialAliasToCanonicalKey.has(joinKey)) {
        officialAliasToCanonicalKey.set(joinKey, canonicalKey);
      }
    }
  }

  for (const item of performanceItems) {
    for (const joinKey of getPerformanceJoinKeys(item)) {
      const canonicalKey =
        officialAliasToCanonicalKey.get(joinKey) ?? normalizeJoinKey(joinKey);

      if (canonicalKey && !performanceByCanonicalKey.has(canonicalKey)) {
        performanceByCanonicalKey.set(canonicalKey, item);
      }
    }
  }

  const allJoinKeys = new Set([
    ...officialByCanonicalKey.keys(),
    ...performanceByCanonicalKey.keys()
  ]);

  const mergedItems = sortUnifiedProducts(
    [...allJoinKeys].map((joinKey) =>
      createUnifiedProductItem({
        officialItem: officialByCanonicalKey.get(joinKey) ?? null,
        performanceItem: performanceByCanonicalKey.get(joinKey) ?? null
      })
    )
  );

  const matchedCount = mergedItems.filter(
    (item) => item.match_status === "matched"
  ).length;
  const officialOnlyCount = mergedItems.filter(
    (item) => item.match_status === "official_only"
  ).length;
  const performanceOnlyCount = mergedItems.filter(
    (item) => item.match_status === "performance_only"
  ).length;

  return {
    module: "products",
    account: "wika",
    view_type: "unified_product_view",
    read_only: true,
    verification_status: DATA_QUALITY_STATUS.VERIFIED,
    evidence_level: "A:L1 + B:L2",
    sources: [
      createSourceDescriptor({
        module: "products",
        sourceType: "official_api",
        status: resolvedOfficialResult?.verification_status ?? DATA_QUALITY_STATUS.VERIFIED,
        verifiedFields: OFFICIAL_PRODUCT_FIELDS,
        pendingFields: [],
        notes: "A 主数据来源：alibaba.icbu.product.list"
      }),
      createSourceDescriptor({
        module: "products",
        sourceType: "page_request",
        status: resolvedPerformanceResult?.verification_status ?? DATA_QUALITY_STATUS.VERIFIED,
        verifiedFields: PAGE_PRODUCT_FIELDS,
        pendingFields: [],
        notes: "B 表现数据来源：customerAdviser/prodList"
      })
    ],
    verified_fields: UNIFIED_PRODUCT_FIELDS,
    field_semantics: {
      ...getProductFieldSemantics(),
      join_key:
        "统一合并键。当前优先使用 A 主数据中的 id，对应 B 表现数据中的 product_id。",
      product_id:
        "统一视图中的产品主键。当前优先取 A 的 id；A 缺失时退回 B 的 product_id。",
      official_product_id:
        "A 官方接口返回的 product_id 字段，保留原始语义，不用于主合并键。"
    },
    merge_rules: {
      primary_join_rule: "A.id <-> B.product_id",
      fallback_join_rule: "A.product_id <-> B.product_id",
      master_data_owner: "A official_api",
      performance_data_owner: "B page_request"
    },
    official_result: {
      total_item: resolvedOfficialResult?.response_meta?.total_item ?? officialItems.length,
      returned_item_count: officialItems.length,
      current_page: resolvedOfficialResult?.response_meta?.current_page ?? null,
      page_size: resolvedOfficialResult?.response_meta?.page_size ?? null
    },
    performance_result: {
      period: resolvedPerformanceResult?.period ?? performanceWindow,
      item_count: performanceItems.length,
      coverage_status: resolvedPerformanceResult?.pagination?.coverage_status ?? null,
      second_page_has_data:
        resolvedPerformanceResult?.pagination?.second_page_has_data ?? false
    },
    coverage: {
      merged_item_count: mergedItems.length,
      matched_count: matchedCount,
      official_only_count: officialOnlyCount,
      performance_only_count: performanceOnlyCount
    },
    items: mergedItems
  };
}

export function buildProductManagementSummary(productResult) {
  const items = Array.isArray(productResult?.items) ? productResult.items : [];
  const totalItem =
    productResult?.response_meta?.total_item ?? productResult?.items?.length ?? 0;
  const onlineItems = items.filter((item) => item.display === "Y");
  const offlineItems = items.filter((item) => item.display === "N");
  const approvedItems = items.filter((item) => item.status === "approved");
  const ungroupedItems = items.filter((item) => !item.group_name);
  const staleItems = items.filter((item) => {
    const ageInDays = getDateAgeInDays(item.gmt_modified);
    return ageInDays !== null && ageInDays >= 90;
  });

  return {
    module: "products",
    account: "wika",
    report_type: "management_summary",
    reporting_basis: "Official product list snapshot",
    snapshot: {
      total_item: totalItem,
      returned_item_count: items.length,
      current_page: productResult?.response_meta?.current_page ?? null,
      page_size: productResult?.response_meta?.page_size ?? null,
      online_count: onlineItems.length,
      offline_count: offlineItems.length,
      approved_count: approvedItems.length,
      ungrouped_count: ungroupedItems.length,
      stale_over_90_days_count: staleItems.length
    },
    focus_products: mapProductsForFocusList(items),
    limitations: [
      "This summary is based on alibaba.icbu.product.list and does not include performance fields such as impressions or clicks.",
      "If total_item is larger than returned_item_count, you still need pagination to cover the full catalog."
    ]
  };
}

export function buildUnifiedProductManagementSummary(unifiedProductResult) {
  const items = Array.isArray(unifiedProductResult?.items)
    ? unifiedProductResult.items
    : [];
  const matchedItems = items.filter((item) => item.match_status === "matched");
  const onlineItems = items.filter((item) => item.display === "Y");
  const approvedItems = items.filter((item) => item.status === "approved");
  const productsWithTraffic = items.filter((item) => (item.detail_uv ?? 0) > 0);
  const productsWithOrderSignal = items.filter((item) => (item.order_uv ?? 0) > 0);

  const focusProducts = sortUnifiedProducts(items).slice(0, 5).map((item) => ({
    product_id: item.product_id,
    product_name: item.product_name,
    group_name: item.group_name,
    status: item.status,
    display: item.display,
    detail_uv: item.detail_uv,
    business_rate: formatPercent(item.business_rate),
    order_uv: item.order_uv,
    match_status: item.match_status
  }));

  return {
    module: "products",
    account: "wika",
    report_type: "unified_management_summary",
    reporting_basis: "A official master data + B page performance data",
    snapshot: {
      official_total_item: unifiedProductResult?.official_result?.total_item ?? null,
      official_returned_item_count:
        unifiedProductResult?.official_result?.returned_item_count ?? null,
      performance_item_count:
        unifiedProductResult?.performance_result?.item_count ?? null,
      performance_period: unifiedProductResult?.performance_result?.period ?? null,
      merged_item_count: items.length,
      matched_count: unifiedProductResult?.coverage?.matched_count ?? matchedItems.length,
      official_only_count:
        unifiedProductResult?.coverage?.official_only_count ?? null,
      performance_only_count:
        unifiedProductResult?.coverage?.performance_only_count ?? null,
      online_count: onlineItems.length,
      approved_count: approvedItems.length,
      products_with_traffic_count: productsWithTraffic.length,
      products_with_order_signal_count: productsWithOrderSignal.length
    },
    focus_products: focusProducts,
    limitations: [
      "A 负责产品主数据，B 负责产品表现数据；统一视图并不改变这两个数据源的职责边界。",
      "当前 B 表现数据仍更接近重点产品池，不应直接当成全店全量表现报表。"
    ]
  };
}

export function buildProductPerformanceSummary(productResult) {
  const items = Array.isArray(productResult?.items) ? productResult.items : [];
  const averageDetailUv = average(items, "detail_uv");
  const averageBusinessRate = average(items, "business_rate");

  const topTrafficProducts = [...items]
    .sort((left, right) => (right.detail_uv ?? 0) - (left.detail_uv ?? 0))
    .slice(0, 5);

  const highBusinessRateProducts = items
    .filter((item) => (item.detail_uv ?? 0) >= 20)
    .sort((left, right) => (right.business_rate ?? 0) - (left.business_rate ?? 0))
    .slice(0, 5);

  const highTrafficLowBusinessProducts = items
    .filter((item) => {
      if (averageDetailUv === null || averageBusinessRate === null) {
        return false;
      }

      return (
        (item.detail_uv ?? 0) >= averageDetailUv &&
        (item.business_rate ?? 0) < averageBusinessRate
      );
    })
    .sort((left, right) => (right.detail_uv ?? 0) - (left.detail_uv ?? 0))
    .slice(0, 5);

  return {
    module: "products",
    account: "wika",
    report_type: "page_performance_summary",
    reporting_basis: "Verified seller page request",
    snapshot: {
      period: productResult?.period ?? null,
      item_count: items.length,
      average_detail_uv: averageDetailUv,
      average_business_rate: averageBusinessRate
    },
    top_traffic_products: topTrafficProducts.map((item) => ({
      product_id: item.product_id,
      product_name: item.product_name,
      detail_uv: item.detail_uv,
      business_uv: item.business_uv,
      business_rate: formatPercent(item.business_rate),
      order_uv: item.order_uv
    })),
    high_business_rate_products: highBusinessRateProducts.map((item) => ({
      product_id: item.product_id,
      product_name: item.product_name,
      detail_uv: item.detail_uv,
      business_rate: formatPercent(item.business_rate),
      order_uv: item.order_uv
    })),
    high_traffic_low_business_products: highTrafficLowBusinessProducts.map(
      (item) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        detail_uv: item.detail_uv,
        business_rate: formatPercent(item.business_rate),
        order_uv: item.order_uv
      })
    ),
    limitations: [
      "The current page request is verified and stable, but the endpoint may still represent a top-product pool rather than the full catalog.",
      "business_uv and business_rate are kept aligned to the original page fields and are not renamed to inquiries."
    ]
  };
}

export function buildProductRecommendations(productResult) {
  const items = Array.isArray(productResult?.items) ? productResult.items : [];
  const recommendations = [];

  const averageDetailUv = average(items, "detail_uv");
  const averageBusinessRate = average(items, "business_rate");

  const highTrafficLowBusinessProducts = items.filter((item) => {
    if (averageDetailUv === null || averageBusinessRate === null) {
      return false;
    }

    return (
      (item.detail_uv ?? 0) >= averageDetailUv &&
      (item.business_rate ?? 0) < averageBusinessRate
    );
  });

  if (highTrafficLowBusinessProducts.length > 0) {
    recommendations.push({
      type: "product_conversion",
      priority: "high",
      action:
        "优先处理高流量低商机率产品，先优化主图、详情页信任信息、MOQ 说明和询盘入口。",
      evidence: highTrafficLowBusinessProducts.slice(0, 5).map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        detail_uv: item.detail_uv,
        business_rate: formatPercent(item.business_rate)
      }))
    });
  }

  const highBusinessRateLowTrafficProducts = items.filter((item) => {
    if (averageDetailUv === null || averageBusinessRate === null) {
      return false;
    }

    return (
      (item.detail_uv ?? 0) < averageDetailUv &&
      (item.business_rate ?? 0) > averageBusinessRate
    );
  });

  if (highBusinessRateLowTrafficProducts.length > 0) {
    recommendations.push({
      type: "traffic_expansion",
      priority: "medium",
      action:
        "对低流量高商机率产品增加搜索入口和重点曝光，优先补关键词和橱窗位。",
      evidence: highBusinessRateLowTrafficProducts.slice(0, 5).map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        detail_uv: item.detail_uv,
        business_rate: formatPercent(item.business_rate)
      }))
    });
  }

  const orderDrivenProducts = items
    .filter((item) => (item.order_uv ?? 0) > 0)
    .sort((left, right) => (right.order_uv ?? 0) - (left.order_uv ?? 0));

  if (orderDrivenProducts.length > 0) {
    recommendations.push({
      type: "hero_products",
      priority: "high",
      action:
        "把已有 order_uv 的产品作为重点成交款维护，优先保障搜索入口、详情页承接和价格带稳定。",
      evidence: orderDrivenProducts.slice(0, 5).map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        order_uv: item.order_uv,
        detail_uv: item.detail_uv
      }))
    });
  }

  if (!productResult?.pagination?.second_page_has_data) {
    recommendations.push({
      type: "coverage_limit",
      priority: "medium",
      action:
        "当前产品表现接口只验证到单页 20 条样本池，适合做重点产品运营，不适合直接当成全店全量产品报表。",
      evidence: {
        coverage_status: productResult?.pagination?.coverage_status ?? null,
        effective_page_size: productResult?.pagination?.effective_page_size ?? null
      }
    });
  }

  if (recommendations.length === 0 && items.length > 0) {
    recommendations.push({
      type: "data_expansion",
      priority: "medium",
      action:
        "当前已拿到真实产品表现字段，下一步应继续扩接更多分页或补充其他产品分析接口，验证是否能覆盖更完整产品池。",
      evidence: {
        item_count: items.length
      }
    });
  }

  return recommendations;
}

export function buildUnifiedProductRecommendations(unifiedProductResult) {
  const items = Array.isArray(unifiedProductResult?.items)
    ? unifiedProductResult.items
    : [];
  const matchedItems = items.filter((item) => item.match_status === "matched");
  const averageDetailUv = average(matchedItems, "detail_uv");
  const averageBusinessRate = average(matchedItems, "business_rate");

  const actionsReady = [];
  const actionsNeedMoreData = [];

  const highTrafficLowBusinessProducts = matchedItems.filter((item) => {
    if (averageDetailUv === null || averageBusinessRate === null) {
      return false;
    }

    return (
      (item.detail_uv ?? 0) >= averageDetailUv &&
      (item.business_rate ?? 0) < averageBusinessRate
    );
  });

  if (highTrafficLowBusinessProducts.length > 0) {
    actionsReady.push({
      type: "product_conversion",
      priority: "high",
      action:
        "优先优化高流量低商机率产品的主图、标题、详情页信任信息和 MOQ 展示，先把现有流量转成更高商机率。",
      evidence: highTrafficLowBusinessProducts.slice(0, 5).map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        detail_uv: item.detail_uv,
        business_rate: formatPercent(item.business_rate),
        group_name: item.group_name
      }))
    });
  }

  const orderSignalProducts = matchedItems
    .filter((item) => (item.order_uv ?? 0) > 0)
    .sort((left, right) => (right.order_uv ?? 0) - (left.order_uv ?? 0));

  if (orderSignalProducts.length > 0) {
    actionsReady.push({
      type: "hero_products",
      priority: "high",
      action:
        "把已有 order_uv 的产品作为重点成交款持续维护曝光入口，并优先补齐详情页和组合报价承接。",
      evidence: orderSignalProducts.slice(0, 5).map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        order_uv: item.order_uv,
        detail_uv: item.detail_uv,
        group_name: item.group_name
      }))
    });
  }

  if ((unifiedProductResult?.coverage?.official_only_count ?? 0) > 0) {
    actionsNeedMoreData.push({
      type: "official_only_gap",
      priority: "medium",
      action:
        "当前有 A 主数据已返回、但未在 B 表现池中出现的产品，不能直接判断这些产品无流量，需要继续扩 B 覆盖范围或补更多分页。",
      evidence: {
        official_only_count: unifiedProductResult.coverage.official_only_count
      }
    });
  }

  if ((unifiedProductResult?.coverage?.performance_only_count ?? 0) > 0) {
    actionsNeedMoreData.push({
      type: "performance_only_gap",
      priority: "medium",
      action:
        "当前有 B 表现数据未成功映射到 A 主数据的产品，后续需继续检查 join 规则或补更多 A 返回页。",
      evidence: {
        performance_only_count: unifiedProductResult.coverage.performance_only_count
      }
    });
  }

  if (!unifiedProductResult?.performance_result?.second_page_has_data) {
    actionsNeedMoreData.push({
      type: "coverage_limit",
      priority: "medium",
      action:
        "B 表现数据当前仍更像重点产品池，适合做重点运营动作，不适合直接当成全店全量产品表现结论。",
      evidence: {
        coverage_status: unifiedProductResult?.performance_result?.coverage_status ?? null
      }
    });
  }

  return {
    actions_ready: actionsReady,
    actions_need_more_data: actionsNeedMoreData
  };
}
