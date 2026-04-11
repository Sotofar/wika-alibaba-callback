import {
  fetchAlibabaOfficialOrderDetail,
  fetchAlibabaOfficialOrderList
} from "./alibaba-official-orders.js";
import {
  fetchAlibabaOfficialOrderFund,
  fetchAlibabaOfficialOrderLogistics
} from "./alibaba-official-extensions.js";

export const ORDER_MANAGEMENT_UNAVAILABLE_DIMENSIONS = Object.freeze([
  "country_structure"
]);

function safeArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && typeof value === "object") {
    return [value];
  }

  return [];
}

function toNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toPositiveInteger(value, fallbackValue, maxValue = Number.POSITIVE_INFINITY) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallbackValue;
  }

  return Math.min(parsed, maxValue);
}

function safeTrimmedString(value) {
  return String(value ?? "").trim();
}

function sortCountsDescending(counts = {}) {
  return Object.entries(counts)
    .map(([key, count]) => ({ key, count }))
    .sort((left, right) => right.count - left.count || left.key.localeCompare(right.key));
}

function countBy(items, resolver) {
  const counts = {};
  for (const item of safeArray(items)) {
    const key = safeTrimmedString(resolver(item)) || "UNKNOWN";
    counts[key] = (counts[key] ?? 0) + 1;
  }

  return counts;
}

function normalizeDateWindow(value) {
  const startDate = safeTrimmedString(value?.start_date || value?.startDate);
  const endDate = safeTrimmedString(value?.end_date || value?.endDate);
  if (!startDate && !endDate) {
    return null;
  }

  return {
    start_date: startDate || null,
    end_date: endDate || null
  };
}

function buildDateWindowFromDates(values = []) {
  const normalized = safeArray(values)
    .map((item) => {
      const timestamp = Number(item?.timestamp);
      if (Number.isFinite(timestamp) && timestamp > 0) {
        return {
          timestamp,
          iso_date: new Date(timestamp).toISOString().slice(0, 10),
          format_date: item?.format_date ?? null
        };
      }

      const text = safeTrimmedString(item?.format_date ?? item);
      if (!text) {
        return null;
      }

      return {
        timestamp: null,
        iso_date: text,
        format_date: text
      };
    })
    .filter(Boolean)
    .sort((left, right) => {
      if (left.timestamp !== null && right.timestamp !== null) {
        return left.timestamp - right.timestamp;
      }

      return String(left.iso_date).localeCompare(String(right.iso_date));
    });

  if (normalized.length === 0) {
    return null;
  }

  return {
    start_date: normalized[0].iso_date,
    end_date: normalized[normalized.length - 1].iso_date,
    observed_point_count: normalized.length
  };
}

function collectMoneyBuckets(values = []) {
  const buckets = new Map();
  for (const value of safeArray(values)) {
    const amount = toNumber(value?.amount);
    const currency = safeTrimmedString(value?.currency) || "UNKNOWN";
    if (!Number.isFinite(amount)) {
      continue;
    }

    buckets.set(currency, (buckets.get(currency) ?? 0) + amount);
  }

  return [...buckets.entries()]
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([currency, amount]) => ({
      currency,
      amount: Number(amount.toFixed(4))
    }));
}

function flattenFundPayItems(value = {}) {
  return safeArray(value?.fund_pay_list?.fund_pay);
}

function flattenLogisticsShippingOrders(value = {}) {
  return safeArray(value?.shipping_order_list?.shippingorderlist);
}

function normalizeLogisticsStatus(value = {}) {
  const primary = safeTrimmedString(value?.logistic_status);
  if (primary) {
    return primary;
  }

  const nested = flattenLogisticsShippingOrders(value)
    .map((item) => safeTrimmedString(item?.status ?? item?.logistic_status))
    .find(Boolean);

  return nested || "UNKNOWN";
}

function parseTradeIds(query = {}) {
  return [...new Set(
    safeTrimmedString(query.trade_ids ?? query.tradeIds)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  )];
}

function buildNestedErrorSummary(error, tradeId, sourceRoute) {
  return {
    trade_id: tradeId,
    source_route: sourceRoute,
    error_message: error instanceof Error ? error.message : String(error),
    error_code:
      error?.errorResponse?.code ??
      error?.details?.error_code ??
      error?.details?.sub_code ??
      null
  };
}

async function fetchObservedOrders(clientConfig, query = {}) {
  const requestedTradeIds = parseTradeIds(query);
  const pageLimit = toPositiveInteger(
    query.pageLimit ?? query.page_limit ?? query.order_sample_limit,
    requestedTradeIds.length || 3,
    10
  );
  const orderPageSize = toPositiveInteger(
    query.order_page_size ?? query.page_size,
    Math.max(pageLimit, 5),
    20
  );
  const requestedDateWindow = normalizeDateWindow(query);

  let listResult = null;
  let observedTradeIds = requestedTradeIds.slice(0, pageLimit);

  if (observedTradeIds.length === 0) {
    listResult = await fetchAlibabaOfficialOrderList(
      {
        account: "wika",
        ...clientConfig
      },
      {
        start_page: 0,
        page_size: orderPageSize,
        role: "seller"
      }
    );

    observedTradeIds = safeArray(listResult.items)
      .map((item) => safeTrimmedString(item?.trade_id))
      .filter(Boolean)
      .slice(0, pageLimit);
  }

  const nestedErrors = [];

  const detailResults = await Promise.all(
    observedTradeIds.map(async (tradeId) => {
      try {
        return await fetchAlibabaOfficialOrderDetail(
          {
            account: "wika",
            ...clientConfig
          },
          {
            e_trade_id: tradeId
          }
        );
      } catch (error) {
        nestedErrors.push(buildNestedErrorSummary(error, tradeId, "/integrations/alibaba/wika/data/orders/detail"));
        return null;
      }
    })
  );

  const fundResults = await Promise.all(
    observedTradeIds.map(async (tradeId) => {
      try {
        return await fetchAlibabaOfficialOrderFund(
          {
            account: "wika",
            ...clientConfig
          },
          {
            e_trade_id: tradeId,
            data_select: "fund_serviceFee,fund_fundPay,fund_refund"
          }
        );
      } catch (error) {
        nestedErrors.push(buildNestedErrorSummary(error, tradeId, "/integrations/alibaba/wika/data/orders/fund"));
        return null;
      }
    })
  );

  const logisticsResults = await Promise.all(
    observedTradeIds.map(async (tradeId) => {
      try {
        return await fetchAlibabaOfficialOrderLogistics(
          {
            account: "wika",
            ...clientConfig
          },
          {
            e_trade_id: tradeId,
            data_select: "logistic_order"
          }
        );
      } catch (error) {
        nestedErrors.push(buildNestedErrorSummary(error, tradeId, "/integrations/alibaba/wika/data/orders/logistics"));
        return null;
      }
    })
  );

  return {
    page_limit: pageLimit,
    order_page_size: orderPageSize,
    requested_date_window: requestedDateWindow,
    listResult,
    observed_trade_ids: observedTradeIds,
    detailResults: detailResults.filter(Boolean),
    fundResults: fundResults.filter(Boolean),
    logisticsResults: logisticsResults.filter(Boolean),
    nestedErrors
  };
}

function buildFundSignalsSummary(fundResults = []) {
  const successful = safeArray(fundResults);
  if (successful.length === 0) {
    return null;
  }

  const payItems = successful.flatMap((item) => flattenFundPayItems(item?.value));
  const payStatusDistribution = sortCountsDescending(
    countBy(payItems, (item) => item?.pay_status)
  );
  const payMethodDistribution = sortCountsDescending(
    countBy(payItems, (item) => item?.pay_method)
  );

  return {
    derived: true,
    observed_fund_trade_count: successful.length,
    service_fee_by_currency: collectMoneyBuckets(
      successful.map((item) => item?.value?.service_fee)
    ),
    pay_status_distribution: payStatusDistribution,
    pay_method_distribution: payMethodDistribution
  };
}

function buildLogisticsSignalsSummary(logisticsResults = []) {
  const successful = safeArray(logisticsResults);
  if (successful.length === 0) {
    return null;
  }

  return {
    derived: true,
    observed_logistics_trade_count: successful.length,
    logistic_status_distribution: sortCountsDescending(
      countBy(successful, (item) => normalizeLogisticsStatus(item?.value))
    ),
    agreed_shipment_date_window: buildDateWindowFromDates(
      successful.map((item) => item?.value?.agreed_shipment_date)
    ),
    missing_shipping_order_count: successful.filter(
      (item) => flattenLogisticsShippingOrders(item?.value).length === 0
    ).length
  };
}

function buildTrendSignal(listResult = null, detailResults = []) {
  const listItems = safeArray(listResult?.items);
  const dateBuckets = new Map();

  for (const item of (listItems.length > 0 ? listItems : detailResults.map((result) => ({ item: result?.item })))) {
    const source = item?.create_date ?? item?.item?.create_date;
    const timestamp = Number(source?.timestamp);
    const dateKey = Number.isFinite(timestamp) && timestamp > 0
      ? new Date(timestamp).toISOString().slice(0, 10)
      : safeTrimmedString(source?.format_date);
    if (!dateKey) {
      continue;
    }

    dateBuckets.set(dateKey, (dateBuckets.get(dateKey) ?? 0) + 1);
  }

  const byDay = [...dateBuckets.entries()]
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([date, order_count]) => ({ date, order_count }));

  if (byDay.length === 0) {
    return null;
  }

  return {
    derived: true,
    basis: "orders/list.create_date sampled window",
    observed_point_count: byDay.length,
    by_day: byDay,
    note: "Current trend signal is derived from the sampled orders/list create_date window, not from an unrestricted full-history order report."
  };
}

function buildProductContribution(detailResults = []) {
  const contributionMap = new Map();

  for (const detailResult of safeArray(detailResults)) {
    const tradeId = safeTrimmedString(detailResult?.item?.trade_id);
    const seenInTrade = new Set();

    for (const product of safeArray(detailResult?.item?.order_products)) {
      const productId = safeTrimmedString(product?.product_id);
      if (!productId) {
        continue;
      }

      const quantity = toNumber(product?.quantity) ?? 0;
      const unitPrice = toNumber(product?.unit_price?.amount);
      const unitCurrency = safeTrimmedString(product?.unit_price?.currency) || "UNKNOWN";
      const estimatedAmount = Number.isFinite(unitPrice) ? unitPrice * quantity : null;
      const current = contributionMap.get(productId) ?? {
        product_id: productId,
        product_name: product?.name ?? null,
        order_count: 0,
        quantity_sum: 0,
        estimated_amount_buckets: new Map()
      };

      if (!seenInTrade.has(productId)) {
        current.order_count += 1;
        seenInTrade.add(productId);
      }

      current.quantity_sum += quantity;

      if (Number.isFinite(estimatedAmount)) {
        current.estimated_amount_buckets.set(
          unitCurrency,
          (current.estimated_amount_buckets.get(unitCurrency) ?? 0) + estimatedAmount
        );
      }

      contributionMap.set(productId, current);
    }
  }

  const normalized = [...contributionMap.values()].map((item) => ({
    product_id: item.product_id,
    product_name: item.product_name,
    order_count: item.order_count,
    quantity_sum: Number(item.quantity_sum.toFixed(4)),
    estimated_amount_by_currency: [...item.estimated_amount_buckets.entries()]
      .sort((left, right) => left[0].localeCompare(right[0]))
      .map(([currency, amount]) => ({
        currency,
        amount: Number(amount.toFixed(4))
      }))
  }));

  const byOrderCount = [...normalized]
    .sort((left, right) => {
      if (right.order_count !== left.order_count) {
        return right.order_count - left.order_count;
      }
      return right.quantity_sum - left.quantity_sum;
    })
    .slice(0, 5);

  const byQuantity = [...normalized]
    .sort((left, right) => {
      if (right.quantity_sum !== left.quantity_sum) {
        return right.quantity_sum - left.quantity_sum;
      }
      return right.order_count - left.order_count;
    })
    .slice(0, 5);

  return {
    derived: true,
    contribution_basis: {
      occurrence_based: true,
      quantity_based: true,
      amount_based_support: "estimated_from_quantity_times_unit_price_when_available"
    },
    observed_trade_ids_count: safeArray(detailResults).length,
    top_products_by_order_count: byOrderCount,
    top_products_by_quantity: byQuantity
  };
}

function buildSummaryRecommendations(summary = {}) {
  const recommendations = [];
  const undelivered = safeArray(
    summary?.formal_summary?.logistics_signal_summary?.logistic_status_distribution
  ).find((item) => item.key === "UNDELIVERED");
  const unpay = safeArray(summary?.formal_summary?.trade_status_distribution).find(
    (item) => item.key === "unpay"
  );
  const topProduct = safeArray(summary?.product_contribution?.top_products_by_order_count)[0];

  if ((undelivered?.count ?? 0) > 0) {
    recommendations.push("Current sampled logistics statuses still include UNDELIVERED orders; follow up fulfillment timing before treating the window as closed.");
  }

  if ((unpay?.count ?? 0) > 0) {
    recommendations.push("Current sampled orders still include unpaid trades; separate paid vs unpaid signals when reading formal summary totals.");
  }

  if (topProduct && (topProduct.order_count ?? 0) >= 2) {
    recommendations.push("Current sampled product contribution shows repeated concentration in a small number of SKUs; keep using contribution_basis before extending to amount-driven ranking.");
  }

  if (summary?.source_limitations?.sample_based) {
    recommendations.push("Current order management summary is sampled/window-based; check page_limit and observed_trade_count before using it as a management headline.");
  }

  if (recommendations.length === 0) {
    recommendations.push("Current sampled order summary shows no immediate structural anomaly, but it still remains a conservative derived view rather than a full official order report.");
  }

  return recommendations;
}

export async function buildOrdersManagementSummary(clientConfig, query = {}) {
  const observed = await fetchObservedOrders(clientConfig, query);
  const detailItems = safeArray(observed.detailResults).map((item) => item?.item).filter(Boolean);
  const listItems = safeArray(observed.listResult?.items);

  const summary = {
    report_name: "orders_management_summary",
    generated_at: new Date().toISOString(),
    report_scope: {
      type: "derived_order_summary",
      derived: true,
      sample_based: true,
      official_report: false
    },
    source_routes: [
      "/integrations/alibaba/wika/data/orders/list",
      "/integrations/alibaba/wika/data/orders/detail",
      "/integrations/alibaba/wika/data/orders/fund",
      "/integrations/alibaba/wika/data/orders/logistics"
    ],
    source_limitations: {
      sample_based: true,
      page_limit: observed.page_limit,
      order_page_size: observed.order_page_size,
      requested_date_window: observed.requested_date_window,
      requested_date_window_applied: false,
      trade_ids_source:
        observed.observed_trade_ids.length > 0 && parseTradeIds(query).length > 0
          ? "explicit_trade_ids"
          : "orders_list_first_page",
      total_order_count_visible: observed.listResult?.response_meta?.total_count ?? null,
      nested_route_errors: observed.nestedErrors
    },
    date_window: {
      requested: observed.requested_date_window,
      observed_create_date_window: buildDateWindowFromDates(
        detailItems.length > 0
          ? detailItems.map((item) => item?.create_date)
          : listItems.map((item) => item?.create_date)
      ),
      applied: false
    },
    page_limit: observed.page_limit,
    sample_or_window_basis: {
      mode:
        parseTradeIds(query).length > 0
          ? "explicit_trade_ids_sample"
          : "orders_list_first_page_sample",
      observed_trade_ids_count: observed.observed_trade_ids.length,
      total_count_visible: observed.listResult?.response_meta?.total_count ?? null
    },
    formal_summary: {
      derived: true,
      total_order_count: observed.listResult?.response_meta?.total_count ?? null,
      observed_trade_count: detailItems.length,
      trade_status_distribution: sortCountsDescending(
        countBy(detailItems, (item) => item?.trade_status)
      ),
      total_amount_by_currency: collectMoneyBuckets(
        detailItems.map((item) => item?.amount)
      ),
      product_total_amount_by_currency: collectMoneyBuckets(
        detailItems.map((item) => item?.product_total_amount)
      ),
      shipment_fee_by_currency: collectMoneyBuckets(
        detailItems.map((item) => item?.shipment_fee)
      ),
      fund_signals_summary: buildFundSignalsSummary(observed.fundResults),
      logistics_signal_summary: buildLogisticsSignalsSummary(observed.logisticsResults)
    },
    product_contribution: buildProductContribution(observed.detailResults),
    trend_signal: buildTrendSignal(observed.listResult, observed.detailResults),
    unavailable_dimensions: [...ORDER_MANAGEMENT_UNAVAILABLE_DIMENSIONS],
    boundary_statement: {
      derived_from_existing_order_apis_only: true,
      not_full_order_cockpit: true,
      country_structure_unavailable_currently: true,
      sample_or_window_based: true
    }
  };

  return {
    ...summary,
    recommendations: buildSummaryRecommendations(summary)
  };
}
