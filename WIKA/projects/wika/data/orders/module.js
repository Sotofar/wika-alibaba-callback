import {
  createSourceDescriptor,
  DATA_QUALITY_STATUS
} from "../../../../shared/data/clients/source-status.js";
import {
  DEFAULT_ALIBABA_SELLER_APP_LOG_PATH,
  DEFAULT_ALIBABA_SELLER_USER_AGENT,
  fetchAlibabaSellerPageJson,
  loadAlibabaSellerCookiesFromAppLog
} from "../../../../shared/data/clients/alibaba-seller-page-client.js";

const ORDER_URLS = Object.freeze({
  summary:
    "https://mydata.alibaba.com/self/.json?action=OneAction&iName=vip/trade/getTradeSummary",
  trends:
    "https://mydata.alibaba.com/self/.json?action=OneAction&iName=vip/trade/getTradeTrends",
  list: "https://biz.alibaba.com/list/ajax/ta/mainv2.json"
});

const ORDER_REFERERS = Object.freeze({
  analysis: "https://data.alibaba.com/transaction/analysis",
  list: "https://biz.alibaba.com/ta/list/scene/mainList.htm"
});

const ORDER_PERIODS = Object.freeze(new Set(["7d", "30d", "90d"]));

const VERIFIED_ORDER_FIELDS = Object.freeze([
  "summary.period",
  "summary.current.stat_date",
  "summary.current.stat_date_range",
  "summary.current.created_order_count",
  "summary.current.created_order_amount",
  "summary.current.successful_order_count",
  "summary.current.successful_order_amount",
  "summary.current.received_order_count",
  "summary.current.received_order_amount",
  "summary.current.real_received_order_amount",
  "summary.current.refund_order_count",
  "summary.current.refund_order_rate",
  "summary.current.issue_order_count",
  "summary.current.issue_order_rate",
  "summary.current.successful_buyer_count",
  "summary.current.buyer_amount_metric",
  "summary.previous.stat_date",
  "summary.previous.created_order_count",
  "summary.previous.successful_order_count",
  "summary.previous.received_order_amount",
  "trends.stat_date",
  "trends.stat_date_range",
  "trends.created_order_count",
  "trends.successful_order_count",
  "trends.received_order_amount",
  "trends.real_received_order_amount",
  "trends.refund_order_count",
  "trends.refund_order_rate",
  "trends.successful_buyer_count",
  "order_list_snapshot.pagination.total_record",
  "order_list_snapshot.pagination.total_page",
  "order_list_snapshot.pagination.pages_fetched",
  "order_list_snapshot.pagination.fully_covered",
  "order_list_snapshot.items.order_id",
  "order_list_snapshot.items.order_create_time",
  "order_list_snapshot.items.buyer_country_code",
  "order_list_snapshot.items.buyer_country_name",
  "order_list_snapshot.items.shipping_country_code",
  "order_list_snapshot.items.shipping_country_name",
  "order_list_snapshot.items.order_status_name",
  "order_list_snapshot.items.order_status_display_name",
  "order_list_snapshot.items.shipping_type_code",
  "order_list_snapshot.items.shipping_type_label",
  "order_list_snapshot.items.available_action_names",
  "order_list_snapshot.items.currency",
  "order_list_snapshot.items.total_amount",
  "order_list_snapshot.items.advance_amount",
  "order_list_snapshot.items.shipping_fee_amount",
  "order_list_snapshot.items.item_subtotal_amount",
  "order_list_snapshot.items.shipping_fee_before_discount_amount",
  "order_list_snapshot.items.subtotal_amount",
  "order_list_snapshot.items.total_with_tax_amount",
  "order_list_snapshot.items.shipping_assurance_fee_amount",
  "order_list_snapshot.items.product_count",
  "order_list_snapshot.items.product_total_quantity",
  "order_list_snapshot.items.product_total_amount",
  "order_list_snapshot.items.products.product_id",
  "order_list_snapshot.items.products.product_name",
  "order_list_snapshot.items.products.quantity",
  "order_list_snapshot.items.products.unit_price"
]);

function resolveOrderPeriod(period = "30d") {
  if (ORDER_PERIODS.has(period)) {
    return period;
  }

  return "30d";
}

function toNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function roundNumber(value, digits = 4) {
  const parsed = toNumber(value);
  if (parsed === null) {
    return null;
  }

  return Number(parsed.toFixed(digits));
}

function formatPercent(value) {
  const parsed = toNumber(value);
  if (parsed === null) {
    return null;
  }

  return `${(parsed * 100).toFixed(2)}%`;
}

function safeDivide(numerator, denominator, digits = 4) {
  const left = toNumber(numerator);
  const right = toNumber(denominator);

  if (left === null || right === null || right === 0) {
    return null;
  }

  return Number((left / right).toFixed(digits));
}

function buildOrderUrl(baseUrl, params) {
  const url = new URL(baseUrl);

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    url.searchParams.set(key, String(value));
  }

  return url.toString();
}

function buildCookieHeader(cookies) {
  return Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

function ensureSuccessResult(json, sourceName) {
  if (!json || typeof json !== "object") {
    throw new Error(`${sourceName} returned an empty response body`);
  }

  if ("result" in json && json.result !== "success") {
    throw new Error(`${sourceName} did not return success result`);
  }

  if ("code" in json && Number(json.code) !== 0) {
    throw new Error(`${sourceName} returned non-zero code: ${json.code}`);
  }
}

function extractMetricValue(metric) {
  if (metric && typeof metric === "object" && "value" in metric) {
    return toNumber(metric.value);
  }

  return toNumber(metric);
}

function extractMetricCycle(metric) {
  if (metric && typeof metric === "object" && "cycleCrc" in metric) {
    return roundNumber(metric.cycleCrc);
  }

  return null;
}

function extractMetricRivalAvg(metric) {
  if (metric && typeof metric === "object" && "rivalAvg" in metric) {
    return toNumber(metric.rivalAvg);
  }

  return null;
}

function normalizeOrderSummaryRow(row = {}) {
  return {
    stat_date:
      row.statDate && typeof row.statDate === "object"
        ? row.statDate.value ?? null
        : row.statDate ?? null,
    stat_date_range: row.statDateRange ?? null,
    created_order_count: extractMetricValue(row.crtOrdCnt),
    created_order_amount: extractMetricValue(row.crtOrdAmt),
    successful_order_count: extractMetricValue(row.sucOrdCnt),
    successful_order_amount: extractMetricValue(row.sucOrdAmt),
    received_order_count: extractMetricValue(row.rcvdOrdCnt),
    received_order_amount: extractMetricValue(row.rcvdOrdAmt),
    real_received_order_amount: extractMetricValue(row.realRcvdOrdAmt),
    refund_order_count: extractMetricValue(row.refundOrdCnt),
    refund_order_rate: extractMetricValue(row.refundOrdRate),
    issue_order_count: extractMetricValue(row.issueOrdCnt),
    issue_order_rate: extractMetricValue(row.issueOrdRate),
    successful_buyer_count: extractMetricValue(row.sucByrCnt),
    buyer_amount_metric: extractMetricValue(row.byrAmtCnt),
    judgment_order_count: extractMetricValue(row.judgOrdCnt),
    judgment_order_rate: extractMetricValue(row.judgOrdRate),
    cycle: {
      created_order_count: extractMetricCycle(row.crtOrdCnt),
      successful_order_count: extractMetricCycle(row.sucOrdCnt),
      received_order_amount: extractMetricCycle(row.rcvdOrdAmt),
      refund_order_rate: extractMetricCycle(row.refundOrdRate),
      successful_buyer_count: extractMetricCycle(row.sucByrCnt)
    },
    rival_average: {
      created_order_count: extractMetricRivalAvg(row.crtOrdCnt),
      successful_order_count: extractMetricRivalAvg(row.sucOrdCnt),
      received_order_amount: extractMetricRivalAvg(row.rcvdOrdAmt),
      successful_buyer_count: extractMetricRivalAvg(row.sucByrCnt)
    }
  };
}

function normalizeOrderTrendRow(row = {}) {
  return {
    stat_date: row.statDate ?? null,
    stat_date_range: row.statDateRange ?? null,
    created_order_count: toNumber(row.crtOrdCnt),
    created_order_amount: toNumber(row.crtOrdAmt),
    successful_order_count: toNumber(row.sucOrdCnt),
    successful_order_amount: toNumber(row.sucOrdAmt),
    received_order_count: toNumber(row.rcvdOrdCnt),
    received_order_amount: toNumber(row.rcvdOrdAmt),
    real_received_order_amount: toNumber(row.realRcvdOrdAmt),
    refund_order_count: toNumber(row.refundOrdCnt),
    refund_order_rate: toNumber(row.refundOrdRate),
    issue_order_count: toNumber(row.issueOrdCnt),
    issue_order_rate: toNumber(row.issueOrdRate),
    successful_buyer_count: toNumber(row.sucByrCnt),
    buyer_amount_metric: toNumber(row.byrAmtCnt)
  };
}

function inferSummaryScope(currentRow, requestedPeriod, rawRowCount) {
  if (!currentRow?.stat_date_range) {
    return "unknown";
  }

  const currentRange = String(currentRow.stat_date_range);
  const looksLikeSingleDay =
    !currentRange.includes("~") &&
    !currentRange.includes(",") &&
    !currentRange.includes("to");

  if (looksLikeSingleDay && rawRowCount >= 1) {
    return "current_snapshot";
  }

  return requestedPeriod;
}

function getOrderFieldSemantics() {
  return {
    buyer_amount_metric:
      "页面原始字段 byrAmtCnt，当前保留原始语义，不擅自改写为客单价。",
    successful_buyer_count:
      "页面原始字段 sucByrCnt，表示成功买家数相关指标。",
    real_received_order_amount:
      "页面原始字段 realRcvdOrdAmt，表示实收订单金额相关指标。",
    refund_order_rate:
      "页面原始字段 refundOrdRate，按页面返回保留为退款订单率。",
    order_status:
      "statusAction.status 来自订单列表页，当前可稳定读取，表示订单当前页面状态，而非完整履约节点。",
    shipping_type:
      "shipmentInfoView.shippingType 来自订单列表页，表示页面展示的物流方式/发货方式，不等同于发货状态。",
    available_action_names:
      "statusAction.actions[].name 来自订单列表页，仅表示当前可执行动作入口，不应直接改写成退款原因或异常原因。",
    buyer_country:
      "buyer.country 字段仅在部分订单列表记录中出现，不应与 shippingCountry 混用。",
    shipping_country:
      "shipmentInfoView.shippingCountry 来自订单列表页，当前可稳定读取，但语义是发货国家/地区，不等同于买家国家。",
    total_amount:
      "paymentInfo.totalAmount 来自订单列表页，表示订单页面展示的总金额口径。",
    item_subtotal_amount:
      "paymentInfo.itemSubtotalAmount 来自订单列表页，表示商品小计口径。",
    shipping_fee_amount:
      "paymentInfo.shippingFeeAmount 来自订单列表页，表示运费金额口径。",
    total_with_tax_amount:
      "paymentInfo.totalWithTaxAmount 来自订单列表页，表示含税总金额口径。"
  };
}

function decodeCookieValue(value) {
  if (!value) {
    return "";
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function extractCtoken(xmanUsTCookie) {
  if (!xmanUsTCookie) {
    return null;
  }

  const decoded = decodeCookieValue(xmanUsTCookie);

  return (
    decoded.match(/(?:^|&)ctoken=([^&]+)/)?.[1] ??
    xmanUsTCookie.match(/(?:^|&)ctoken=([^&]+)/)?.[1] ??
    null
  );
}

function maskIdentifier(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const raw = String(value);
  if (raw.length <= 4) {
    return "***";
  }

  return `${raw.slice(0, 2)}***${raw.slice(-2)}`;
}

function normalizeCountry(country = {}) {
  return {
    code: country?.simpleName ?? null,
    name: country?.name ?? null
  };
}

function normalizeMoney(money = {}) {
  return {
    amount: toNumber(money?.number),
    display: money?.numberStr ?? null
  };
}

function normalizeQuantity(quantity = {}) {
  return {
    amount: toNumber(quantity?.number),
    display: quantity?.numberStr ?? null
  };
}

function estimateLineAmount(unitPrice, quantity) {
  const price = toNumber(unitPrice?.number);
  const qty = toNumber(quantity?.number);

  if (price === null || qty === null) {
    return null;
  }

  return roundNumber(price * qty, 4);
}

function normalizeOrderListItem(row = {}) {
  const buyerCountry = normalizeCountry(row?.buyer?.country);
  const shippingCountry = normalizeCountry(row?.shipmentInfoView?.shippingCountry);
  const shippingType = row?.shipmentInfoView?.shippingType ?? {};
  const paymentTotal = normalizeMoney(row?.paymentInfo?.totalAmount);
  const advanceAmount = normalizeMoney(row?.paymentInfo?.advanceAmount);
  const shippingFeeAmount = normalizeMoney(row?.paymentInfo?.shippingFeeAmount);
  const itemSubtotal = normalizeMoney(row?.paymentInfo?.itemSubtotalAmount);
  const shippingFeeBeforeDiscountAmount = normalizeMoney(
    row?.paymentInfo?.shippingFeeBeforeDiscountAmount
  );
  const subtotalAmount = normalizeMoney(row?.paymentInfo?.subtotalAmount);
  const totalWithTaxAmount = normalizeMoney(row?.paymentInfo?.totalWithTaxAmount);
  const shippingAssuranceFeeAmount = normalizeMoney(
    row?.paymentInfo?.shippingAssuranceFeeAmount
  );
  const productTotalAmount = normalizeMoney(row?.productInfo?.productTotalAmount);
  const availableActions = Array.isArray(row?.statusAction?.actions)
    ? row.statusAction.actions
    : [];
  const products = Array.isArray(row?.productInfo?.products)
    ? row.productInfo.products.map((product) => ({
        product_id: product?.id ?? null,
        product_name: product?.name ?? null,
        quantity: normalizeQuantity(product?.quantity).amount,
        quantity_display: normalizeQuantity(product?.quantity).display,
        unit: product?.unit ?? null,
        unit_price: normalizeMoney(product?.unitPrice).amount,
        unit_price_display: normalizeMoney(product?.unitPrice).display,
        estimated_line_amount: estimateLineAmount(
          product?.unitPrice,
          product?.quantity
        ),
        image_url: product?.imageUrl ?? null
      }))
    : [];

  return {
    order_id: row?.baseInfo?.id ?? null,
    order_create_time: row?.baseInfo?.createTime ?? null,
    order_create_timestamp: row?.baseInfo?.createTimestamp ?? null,
    business_type: row?.baseInfo?.businessType ?? null,
    fulfillment_channel: row?.baseInfo?.fulfillmentChannel ?? null,
    fulfillment_channel_label:
      row?.baseInfo?.fulfillmentChannelText?.mcmsValue ??
      row?.baseInfo?.fulfillmentChannelText?.original ??
      null,
    merchandiser: row?.baseInfo?.merchandiser ?? null,
    buyer_account_id_masked: maskIdentifier(row?.buyer?.accountId),
    buyer_member_id_masked: maskIdentifier(row?.buyer?.aliMemberId),
    buyer_company_name: row?.buyer?.companyName ?? null,
    buyer_country_code: buyerCountry.code,
    buyer_country_name: buyerCountry.name,
    shipping_country_code: shippingCountry.code,
    shipping_country_name: shippingCountry.name,
    shipping_type_code: shippingType.original ?? null,
    shipping_type_label: shippingType.mcmsValue ?? shippingType.original ?? null,
    order_status_name: row?.statusAction?.status?.name ?? null,
    order_status_display_name: row?.statusAction?.status?.displayName ?? null,
    available_action_names: availableActions
      .map((action) => action?.name)
      .filter(Boolean),
    available_action_labels: availableActions
      .map((action) => action?.displayName)
      .filter(Boolean),
    detail_url: row?.statusAction?.detailUrl ?? null,
    currency: row?.paymentInfo?.currency ?? null,
    total_amount: paymentTotal.amount,
    total_amount_display: paymentTotal.display,
    advance_amount: advanceAmount.amount,
    advance_amount_display: advanceAmount.display,
    shipping_fee_amount: shippingFeeAmount.amount,
    shipping_fee_amount_display: shippingFeeAmount.display,
    item_subtotal_amount: itemSubtotal.amount,
    item_subtotal_amount_display: itemSubtotal.display,
    shipping_fee_before_discount_amount: shippingFeeBeforeDiscountAmount.amount,
    shipping_fee_before_discount_amount_display:
      shippingFeeBeforeDiscountAmount.display,
    subtotal_amount: subtotalAmount.amount,
    subtotal_amount_display: subtotalAmount.display,
    total_with_tax_amount: totalWithTaxAmount.amount,
    total_with_tax_amount_display: totalWithTaxAmount.display,
    shipping_assurance_fee_amount: shippingAssuranceFeeAmount.amount,
    shipping_assurance_fee_amount_display: shippingAssuranceFeeAmount.display,
    product_count: toNumber(row?.productInfo?.productCount),
    product_total_quantity: toNumber(row?.productInfo?.productTotalNum),
    product_total_amount: productTotalAmount.amount,
    product_total_amount_display: productTotalAmount.display,
    products
  };
}

function aggregateLabelDistribution(items, codeKey, labelKey) {
  const bucket = new Map();

  for (const item of items) {
    const code = item?.[codeKey];
    const label = item?.[labelKey];

    if (!code && !label) {
      continue;
    }

    const key = code || label;
    const existing = bucket.get(key) ?? {
      code: code ?? null,
      label: label ?? null,
      order_count: 0
    };

    existing.order_count += 1;
    bucket.set(key, existing);
  }

  return [...bucket.values()].sort((left, right) => {
    if (right.order_count !== left.order_count) {
      return right.order_count - left.order_count;
    }

    return String(left.label ?? left.code).localeCompare(
      String(right.label ?? right.code)
    );
  });
}

function aggregateAmountBreakdown(items) {
  const fields = [
    "total_amount",
    "advance_amount",
    "shipping_fee_amount",
    "item_subtotal_amount",
    "shipping_fee_before_discount_amount",
    "subtotal_amount",
    "total_with_tax_amount",
    "shipping_assurance_fee_amount",
    "product_total_amount"
  ];

  const totals = Object.fromEntries(fields.map((field) => [field, 0]));

  for (const item of items) {
    for (const field of fields) {
      totals[field] += item?.[field] ?? 0;
    }
  }

  return Object.fromEntries(
    Object.entries(totals).map(([key, value]) => [key, roundNumber(value, 2)])
  );
}

function createOrderListRequestPayload({ currentPage = 1, pageSize = 10 } = {}) {
  return {
    requests: {
      simpleFilter: "simpleFilter@all",
      orderStatus: null,
      tradeType: null,
      recentCreateTime: null,
      recentShipmentTime: null,
      createDateFilter: {
        from: null,
        to: null
      },
      shipmentTimeFilter: {
        from: null,
        to: null
      },
      orderAmountFilter: {
        from: null,
        to: null
      },
      operator: {
        loginId: null,
        accountId: null
      },
      currency: null,
      bizSource: null,
      buyerCountry: null,
      buyerShippingCountry: null,
      fulfillmentChannel: null,
      orderDraftRole: null,
      orderBy: null,
      acceptPoFilter: null,
      orderFinancingFilter: null,
      productTypeFilter: null,
      searchAliCarrierCode: false,
      pagination: {
        currentPage,
        pageSize
      }
    },
    pagination: {
      currentPage,
      pageSize
    },
    responseModel: "V2",
    requestEnvironment: {
      operator: {
        role: "seller"
      }
    }
  };
}

async function parseJsonResponse(response) {
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

async function fetchOrderListPage({
  cookieContext,
  currentPage,
  pageSize
}) {
  const tbToken = cookieContext.cookies._tb_token_;
  const ctoken = extractCtoken(cookieContext.cookies.xman_us_t);

  if (!tbToken || !ctoken) {
    throw new Error(
      "Order list page request is missing required page tokens (_tb_token_ or ctoken)."
    );
  }

  const payload = createOrderListRequestPayload({
    currentPage,
    pageSize
  });
  const requestUrl = buildOrderUrl(ORDER_URLS.list, {
    json: JSON.stringify(payload),
    _tb_token_: tbToken,
    ctoken
  });

  const response = await fetch(requestUrl, {
    method: "GET",
    headers: {
      Accept: "application/json, text/plain, */*",
      Referer: ORDER_REFERERS.list,
      "User-Agent": DEFAULT_ALIBABA_SELLER_USER_AGENT,
      Cookie: buildCookieHeader(cookieContext.cookies)
    }
  });

  const parsed = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(
      `Order list page request failed with status ${response.status}: ${parsed.rawText.slice(0, 300)}`
    );
  }

  if (!parsed.json || typeof parsed.json !== "object") {
    throw new Error("Order list page request returned non-JSON data.");
  }

  if (Number(parsed.json.code) !== 200) {
    throw new Error(
      `Order list page request returned non-success code ${parsed.json.code}.`
    );
  }

  const pageData = parsed.json?.data?.pageData ?? {};
  const rows = Array.isArray(pageData?.data) ? pageData.data : [];

  return {
    url: requestUrl,
    current_page: currentPage,
    page_size: pageSize,
    returned_item_count: rows.length,
    total_record: toNumber(pageData?.pagination?.totalRecord),
    total_page: toNumber(pageData?.pagination?.totalPage),
    rows
  };
}

async function fetchWikaOrderListSnapshot({
  logPath = DEFAULT_ALIBABA_SELLER_APP_LOG_PATH,
  currentPage = 1,
  pageSize = 50,
  maxPages
} = {}) {
  const cookieContext = loadAlibabaSellerCookiesFromAppLog({
    logPath
  });

  const firstPage = await fetchOrderListPage({
    cookieContext,
    currentPage,
    pageSize
  });

  const totalPage = firstPage.total_page ?? 1;
  const effectiveMaxPages =
    maxPages === undefined || maxPages === null
      ? totalPage
      : Math.min(totalPage, maxPages);

  const rows = [...firstPage.rows];
  const pageRequests = [
    {
      url: firstPage.url,
      current_page: firstPage.current_page,
      page_size: firstPage.page_size,
      returned_item_count: firstPage.returned_item_count
    }
  ];

  for (let page = currentPage + 1; page <= effectiveMaxPages; page += 1) {
    const nextPage = await fetchOrderListPage({
      cookieContext,
      currentPage: page,
      pageSize
    });

    rows.push(...nextPage.rows);
    pageRequests.push({
      url: nextPage.url,
      current_page: nextPage.current_page,
      page_size: nextPage.page_size,
      returned_item_count: nextPage.returned_item_count
    });
  }

  const fullyCovered = effectiveMaxPages === totalPage;

  return {
    snapshot_scope: fullyCovered ? "paged_pool_full" : "paged_pool_partial",
    request_payload: {
      start_page: currentPage,
      page_size: pageSize,
      requested_max_pages: maxPages ?? null
    },
    pagination: {
      current_page: currentPage,
      page_size: pageSize,
      returned_item_count: rows.length,
      total_record: firstPage.total_record,
      total_page: totalPage,
      pages_fetched: pageRequests.length,
      fully_covered: fullyCovered
    },
    source_request: {
      url: firstPage.url,
      request_method: "GET",
      depends_on_current_token: false,
      requires_browser_login_state: true,
      pages: pageRequests
    },
    items: rows.map(normalizeOrderListItem)
  };
}

function aggregateCountryDistribution(items, codeKey, nameKey) {
  const bucket = new Map();

  for (const item of items) {
    const countryCode = item?.[codeKey];
    const countryName = item?.[nameKey];

    if (!countryCode && !countryName) {
      continue;
    }

    const key = countryCode || countryName;
    const existing = bucket.get(key) ?? {
      country_code: countryCode ?? null,
      country_name: countryName ?? null,
      order_count: 0,
      total_amount: 0,
      product_total_amount: 0
    };

    existing.order_count += 1;
    existing.total_amount += item.total_amount ?? 0;
    existing.product_total_amount += item.product_total_amount ?? 0;
    bucket.set(key, existing);
  }

  return [...bucket.values()]
    .map((item) => ({
      ...item,
      total_amount: roundNumber(item.total_amount, 2),
      product_total_amount: roundNumber(item.product_total_amount, 2)
    }))
    .sort((left, right) => {
      if (right.order_count !== left.order_count) {
        return right.order_count - left.order_count;
      }

      return (right.total_amount ?? 0) - (left.total_amount ?? 0);
    });
}

function aggregateProductContribution(items) {
  const bucket = new Map();

  for (const order of items) {
    const uniqueProducts = new Set();

    for (const product of order.products ?? []) {
      const key = product.product_id ?? product.product_name ?? null;
      if (!key) {
        continue;
      }

      const existing = bucket.get(key) ?? {
        product_id: product.product_id ?? null,
        product_name: product.product_name ?? null,
        order_count: 0,
        quantity_total: 0,
        estimated_amount_total: 0
      };

      if (!uniqueProducts.has(key)) {
        existing.order_count += 1;
        uniqueProducts.add(key);
      }

      existing.quantity_total += product.quantity ?? 0;
      existing.estimated_amount_total += product.estimated_line_amount ?? 0;
      bucket.set(key, existing);
    }
  }

  return [...bucket.values()]
    .map((item) => ({
      ...item,
      quantity_total: roundNumber(item.quantity_total, 2),
      estimated_amount_total: roundNumber(item.estimated_amount_total, 2)
    }))
    .sort((left, right) => {
      if ((right.estimated_amount_total ?? 0) !== (left.estimated_amount_total ?? 0)) {
        return (right.estimated_amount_total ?? 0) - (left.estimated_amount_total ?? 0);
      }

      if ((right.order_count ?? 0) !== (left.order_count ?? 0)) {
        return (right.order_count ?? 0) - (left.order_count ?? 0);
      }

      return (right.quantity_total ?? 0) - (left.quantity_total ?? 0);
    });
}

export async function fetchWikaOrderSummaryAndTrends({
  logPath,
  period = "30d"
} = {}) {
  const normalizedPeriod = resolveOrderPeriod(period);
  const summaryUrl = buildOrderUrl(ORDER_URLS.summary, {
    nd: normalizedPeriod
  });
  const trendsUrl = buildOrderUrl(ORDER_URLS.trends, {
    nd: normalizedPeriod
  });

  const [summaryResponse, trendResponse, orderListSnapshot] = await Promise.all([
    fetchAlibabaSellerPageJson(summaryUrl, {
      logPath,
      referer: ORDER_REFERERS.analysis
    }),
    fetchAlibabaSellerPageJson(trendsUrl, {
      logPath,
      referer: ORDER_REFERERS.analysis
    }),
    fetchWikaOrderListSnapshot({
      logPath,
      currentPage: 1,
      pageSize: 50
    })
  ]);

  ensureSuccessResult(summaryResponse.json, "vip/trade/getTradeSummary");
  ensureSuccessResult(trendResponse.json, "vip/trade/getTradeTrends");

  const summaryRows = Array.isArray(summaryResponse.json.data)
    ? summaryResponse.json.data
    : [];
  const trendRows = Array.isArray(trendResponse.json.data)
    ? trendResponse.json.data
    : [];

  const currentSummary = normalizeOrderSummaryRow(summaryRows[0] ?? {});
  const previousSummary =
    summaryRows.length > 1 ? normalizeOrderSummaryRow(summaryRows[1] ?? {}) : null;
  const normalizedTrends = trendRows.map(normalizeOrderTrendRow);
  const summaryScope = inferSummaryScope(
    currentSummary,
    normalizedPeriod,
    summaryRows.length
  );

  return {
    module: "orders",
    account: "wika",
    period: normalizedPeriod,
    read_only: true,
    verification_status: DATA_QUALITY_STATUS.VERIFIED,
    evidence_level: "L2",
    source_priority_selected: "page_request",
    sources: [
      createSourceDescriptor({
        module: "orders",
        sourceType: "official_api",
        status: DATA_QUALITY_STATUS.INTERFACE_NOT_FOUND,
        pendingFields: [
          "order_list",
          "order_country_distribution",
          "order_product_contribution"
        ],
        notes: "Current repository does not include a verified official order API."
      }),
      createSourceDescriptor({
        module: "orders",
        sourceType: "page_request",
        status: DATA_QUALITY_STATUS.VERIFIED,
        verifiedFields: VERIFIED_ORDER_FIELDS,
        notes:
          "Verified from logged-in seller page requests captured through AliWorkbench cookies."
      })
    ],
    source_requests: [
      {
        name: "trade_summary",
        url: summaryResponse.url,
        request_method: "GET",
        depends_on_current_token: false,
        requires_browser_login_state: true
      },
      {
        name: "trade_trends",
        url: trendResponse.url,
        request_method: "GET",
        depends_on_current_token: false,
        requires_browser_login_state: true
      },
      orderListSnapshot.source_request
    ],
    verified_fields: VERIFIED_ORDER_FIELDS,
    field_semantics: getOrderFieldSemantics(),
    summary: {
      period: normalizedPeriod,
      summary_scope: summaryScope,
      current: currentSummary,
      previous: previousSummary,
      raw_row_count: summaryRows.length
    },
    trends: normalizedTrends,
    order_list_snapshot: orderListSnapshot,
    limitations: [
      "当前已验证订单 summary、trend 与订单列表首屏快照三条只读页面请求，可用于 P0 经营结果层分析。",
      summaryScope === "current_snapshot"
        ? "订单 summary 当前更接近交易分析页的当前快照，不应直接当成完整 7d/30d 聚合汇总。"
        : null,
      orderListSnapshot.pagination?.fully_covered
        ? "订单列表国家/产品贡献当前来自已分页读取的订单列表池，仍属于订单列表口径，不等同完整交易明细。"
        : "订单列表国家/产品贡献当前仅覆盖部分分页池，适合辅助报告，不应直接代表完整周期结构。",
      orderListSnapshot.items.some(
        (item) => !item.buyer_country_code && item.shipping_country_code
      )
        ? "buyer.country 在部分订单记录中为空；当前报告会将 buyer_country 与 shipping_country 分开呈现，避免口径混用。"
        : null,
      normalizedPeriod === "7d" && normalizedTrends.length > 7
        ? "nd=7d 的趋势接口当前返回超过 7 条记录，周期语义已实读但仍需后续结合页面文案进一步确认。"
        : null
    ].filter(Boolean)
  };
}

export function buildWikaOrderManagementSummary(orderResult) {
  const current = orderResult?.summary?.current ?? {};
  const previous = orderResult?.summary?.previous ?? null;
  const trends = Array.isArray(orderResult?.trends) ? orderResult.trends : [];
  const orderListSnapshot = orderResult?.order_list_snapshot ?? {
    pagination: {},
    items: []
  };
  const orderListItems = Array.isArray(orderListSnapshot.items)
    ? orderListSnapshot.items
    : [];

  const latestTrend = trends[0] ?? null;
  const earliestTrend = trends.at(-1) ?? null;
  const peakReceivedAmountDay =
    trends.length === 0
      ? null
      : trends.reduce((best, currentItem) =>
          (currentItem.received_order_amount ?? 0) >
          (best?.received_order_amount ?? 0)
            ? currentItem
            : best,
        null);

  const buyerCountryDistribution = aggregateCountryDistribution(
    orderListItems,
    "buyer_country_code",
    "buyer_country_name"
  ).slice(0, 5);
  const shippingCountryDistribution = aggregateCountryDistribution(
    orderListItems,
    "shipping_country_code",
    "shipping_country_name"
  ).slice(0, 5);
  const topProductContribution = aggregateProductContribution(orderListItems).slice(
    0,
    5
  );
  const orderStatusDistribution = aggregateLabelDistribution(
    orderListItems,
    "order_status_name",
    "order_status_display_name"
  ).slice(0, 8);
  const shippingTypeDistribution = aggregateLabelDistribution(
    orderListItems,
    "shipping_type_code",
    "shipping_type_label"
  ).slice(0, 8);
  const amountBreakdown = aggregateAmountBreakdown(orderListItems);

  return {
    module: "orders",
    account: "wika",
    report_type: "management_summary",
    reporting_basis: "Verified seller page requests",
    snapshot: {
      period: orderResult?.summary?.period ?? null,
      stat_date: current.stat_date ?? null,
      stat_date_range: current.stat_date_range ?? null,
      created_order_count: current.created_order_count ?? null,
      created_order_amount: current.created_order_amount ?? null,
      successful_order_count: current.successful_order_count ?? null,
      successful_order_amount: current.successful_order_amount ?? null,
      received_order_count: current.received_order_count ?? null,
      received_order_amount: current.received_order_amount ?? null,
      real_received_order_amount: current.real_received_order_amount ?? null,
      refund_order_count: current.refund_order_count ?? null,
      refund_order_rate: current.refund_order_rate ?? null,
      issue_order_count: current.issue_order_count ?? null,
      issue_order_rate: current.issue_order_rate ?? null,
      successful_buyer_count: current.successful_buyer_count ?? null,
      buyer_amount_metric: current.buyer_amount_metric ?? null,
      create_to_success_rate: safeDivide(
        current.successful_order_count,
        current.created_order_count
      ),
      receive_amount_per_success_buyer: safeDivide(
        current.received_order_amount,
        current.successful_buyer_count
      )
    },
    comparison: previous
      ? {
          stat_date: previous.stat_date ?? null,
          created_order_count: previous.created_order_count ?? null,
          successful_order_count: previous.successful_order_count ?? null,
          received_order_amount: previous.received_order_amount ?? null,
          successful_buyer_count: previous.successful_buyer_count ?? null
        }
      : null,
    trend_highlights: {
      trend_points_count: trends.length,
      latest_trend_date: latestTrend?.stat_date ?? null,
      earliest_trend_date: earliestTrend?.stat_date ?? null,
      peak_received_amount_day: peakReceivedAmountDay
        ? {
            stat_date: peakReceivedAmountDay.stat_date,
            received_order_amount: peakReceivedAmountDay.received_order_amount
          }
        : null
    },
    order_list_snapshot: {
      snapshot_scope: orderListSnapshot.snapshot_scope ?? "unknown",
      current_page: orderListSnapshot.pagination?.current_page ?? null,
      page_size: orderListSnapshot.pagination?.page_size ?? null,
      returned_item_count: orderListSnapshot.pagination?.returned_item_count ?? 0,
      total_record: orderListSnapshot.pagination?.total_record ?? null,
      total_page: orderListSnapshot.pagination?.total_page ?? null,
      pages_fetched: orderListSnapshot.pagination?.pages_fetched ?? null,
      fully_covered: orderListSnapshot.pagination?.fully_covered ?? false,
      amount_breakdown: amountBreakdown,
      order_status_distribution: orderStatusDistribution,
      shipping_type_distribution: shippingTypeDistribution,
      buyer_country_distribution: buyerCountryDistribution,
      shipping_country_distribution: shippingCountryDistribution,
      top_product_contribution: topProductContribution
    },
    growth_points: [
      current.received_order_amount !== null
        ? `当前周期实收相关金额 ${current.received_order_amount}，成功订单 ${current.successful_order_count ?? 0}。`
        : null,
      current.successful_buyer_count !== null
        ? `当前周期成功买家数 ${current.successful_buyer_count}，可用于判断订单客户基础是否在扩大。`
        : null,
      shippingCountryDistribution[0]
        ? `订单列表首屏快照中，发货国家/地区主要集中在 ${shippingCountryDistribution[0].country_name ?? shippingCountryDistribution[0].country_code}，当前快照订单数 ${shippingCountryDistribution[0].order_count}。`
        : null,
      topProductContribution[0]
        ? `订单列表首屏快照中，产品贡献最高的是 ${topProductContribution[0].product_name}，涉及订单 ${topProductContribution[0].order_count}。`
        : null
    ].filter(Boolean),
    issues: [
      (current.refund_order_rate ?? 0) > 0
        ? `当前周期退款订单率 ${formatPercent(current.refund_order_rate)}，需要继续复核订单质量与履约问题。`
        : null,
      (current.issue_order_rate ?? 0) > 0
        ? `当前周期异常订单率 ${formatPercent(current.issue_order_rate)}，订单交付链路需要重点复盘。`
        : null,
      orderListSnapshot.pagination?.fully_covered === false
        ? "订单国家/产品贡献当前只覆盖部分分页池，适合辅助判断，不适合直接替代完整周期结构。"
        : null
    ].filter(Boolean),
    next_actions: [
      current.created_order_count !== null &&
      current.successful_order_count !== null &&
      (current.successful_order_count ?? 0) < (current.created_order_count ?? 0)
        ? "新建订单数高于成功订单数，优先排查报价、支付、确认环节的流失点。"
        : null,
      (current.refund_order_count ?? 0) > 0
        ? "已出现退款订单，建议按产品/客户来源复盘退款原因，避免低质量订单继续扩大。"
        : null
    ].filter(Boolean),
    next_actions_need_more_data: [
      topProductContribution[0] && orderListSnapshot.pagination?.fully_covered === false
        ? `订单列表分页池显示 ${topProductContribution[0].product_name} 当前贡献最高，但仍需补齐全部分页后再决定是否作为重点成交款持续扩量。`
        : null,
      shippingCountryDistribution[0] && orderListSnapshot.pagination?.fully_covered === false
        ? `订单列表分页池显示发货国家/地区集中在 ${shippingCountryDistribution[0].country_name ?? shippingCountryDistribution[0].country_code}，建议补齐更多订单页数据后再决定是否做国家级产品布局。`
        : null
    ].filter(Boolean)
  };
}
