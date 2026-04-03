import { AlibabaTopApiError } from "../clients/alibaba-top-client.js";
import {
  callAlibabaSyncApi,
  resolveAlibabaSyncEndpoint
} from "../clients/alibaba-sync-client.js";

export const OFFICIAL_ORDER_LIST_VERIFIED_FIELDS = Object.freeze([
  "response_meta.total_count",
  "response_meta.returned_item_count",
  "response_meta.start_page",
  "response_meta.page_size",
  "items.trade_id",
  "items.create_date.timestamp",
  "items.create_date.format_date",
  "items.modify_date.timestamp",
  "items.modify_date.format_date"
]);

export const OFFICIAL_ORDER_DETAIL_VERIFIED_FIELDS = Object.freeze([
  "item.trade_id",
  "item.create_date.timestamp",
  "item.create_date.format_date",
  "item.modify_date.timestamp",
  "item.modify_date.format_date",
  "item.trade_status",
  "item.fulfillment_channel",
  "item.shipment_method",
  "item.shipment_date",
  "item.buyer.full_name",
  "item.buyer.immutable_eid",
  "item.buyer.e_account_id",
  "item.export_service_type",
  "item.amount.amount",
  "item.amount.currency",
  "item.shipment_fee.amount",
  "item.product_total_amount.amount",
  "item.order_products"
]);

function toPositiveInteger(value, fallbackValue, maxValue = Number.POSITIVE_INFINITY) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallbackValue;
  }

  return Math.min(parsed, maxValue);
}

function toNonNegativeInteger(value, fallbackValue) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallbackValue;
  }

  return parsed;
}

function normalizeSyncDateValue(value) {
  if (!value || typeof value !== "object") {
    return {
      timestamp: null,
      format_date: null
    };
  }

  const timestamp = Number(value.timestamp);

  return {
    timestamp: Number.isFinite(timestamp) ? timestamp : null,
    format_date: value.format_date ?? null
  };
}

function normalizeSyncMoneyValue(value) {
  if (!value || typeof value !== "object") {
    return {
      amount: null,
      currency: null
    };
  }

  return {
    amount: value.amount ?? null,
    currency: value.currency ?? null
  };
}

function buildOfficialOrderListQuery(query = {}) {
  return {
    param_trade_ecology_order_list_query: {
      role: String(query.role || "seller"),
      start_page: toNonNegativeInteger(query.start_page, 0),
      page_size: toPositiveInteger(query.page_size, 20, 50),
      status: query.status ? String(query.status).trim() : undefined,
      sales_man_login_id: query.sales_man_login_id
        ? String(query.sales_man_login_id).trim()
        : undefined
    }
  };
}

function normalizeOfficialOrderListItem(item = {}) {
  return {
    trade_id: item.trade_id ?? null,
    create_date: normalizeSyncDateValue(item.create_date),
    modify_date: normalizeSyncDateValue(item.modify_date)
  };
}

function normalizeOfficialOrderDetail(item = {}, requestedTradeId = null) {
  const rawProducts = item.order_products?.trade_ecology_order_product;
  const orderProducts = Array.isArray(rawProducts)
    ? rawProducts
    : rawProducts
      ? [rawProducts]
      : [];

  return {
    trade_id: item.trade_id ?? requestedTradeId ?? null,
    create_date: normalizeSyncDateValue(item.create_date),
    modify_date: normalizeSyncDateValue(item.modify_date),
    trade_status: item.trade_status ?? null,
    fulfillment_channel: item.fulfillment_channel ?? null,
    shipment_method: item.shipment_method ?? null,
    shipment_date: normalizeSyncDateValue(item.shipment_date),
    export_service_type: item.export_service_type ?? null,
    buyer: {
      full_name: item.buyer?.full_name ?? null,
      immutable_eid: item.buyer?.immutable_eid ?? null,
      e_account_id: item.buyer?.e_account_id ?? null
    },
    amount: normalizeSyncMoneyValue(
      item.total_amount ??
        item.order_amount ??
        item.pay_amount ??
        item.inspection_service_amount
    ),
    product_total_amount: normalizeSyncMoneyValue(item.product_total_amount),
    shipment_fee: normalizeSyncMoneyValue(item.shipment_fee),
    advance_amount: normalizeSyncMoneyValue(item.advance_amount),
    discount_amount: normalizeSyncMoneyValue(item.discount_amount),
    product_count: orderProducts.length,
    order_products: orderProducts.slice(0, 20).map((product) => ({
      product_id: product.product_id ?? null,
      name: product.name ?? null,
      quantity: product.quantity ?? null,
      unit: product.unit ?? null,
      unit_price: normalizeSyncMoneyValue(product.unit_price),
      product_image: product.product_image ?? null
    })),
    available_field_keys:
      item && typeof item === "object" ? Object.keys(item).sort() : []
  };
}

export async function fetchAlibabaOfficialOrderList(
  {
    account,
    appKey,
    appSecret,
    accessToken,
    endpointUrl
  },
  query = {}
) {
  const businessParams = buildOfficialOrderListQuery(query);
  const effectiveEndpointUrl = resolveAlibabaSyncEndpoint(endpointUrl);
  const response = await callAlibabaSyncApi({
    apiName: "alibaba.seller.order.list",
    appKey,
    appSecret,
    accessToken,
    endpointUrl: effectiveEndpointUrl,
    businessParams
  });

  const payload = response.payload ?? {};
  const result = payload.result ?? {};
  if (result.success === false) {
    throw new AlibabaTopApiError("Alibaba order list returned business failure", {
      apiName: "alibaba.seller.order.list",
      endpointUrl: effectiveEndpointUrl,
      errorResponse: {
        code: result.error_code ?? null,
        sub_code: null,
        msg: result.error_message ?? "Alibaba order list business failure",
        sub_msg: null
      },
      payload
    });
  }

  const value = result.value ?? {};
  const rawItems = value.order_list?.trade_ecology_order;
  const normalizedItems = (Array.isArray(rawItems)
    ? rawItems
    : rawItems
      ? [rawItems]
      : []
  ).map(normalizeOfficialOrderListItem);

  return {
    account,
    module: "orders",
    read_only: true,
    verification_status: "已验证可读",
    evidence_level: "L1",
    data_scope: "minimal_list",
    source: {
      type: "official_api",
      api_name: "alibaba.seller.order.list",
      endpoint_url: effectiveEndpointUrl,
      auth_parameter: "access_token",
      sign_method: "sha256"
    },
    request_meta: {
      role: businessParams.param_trade_ecology_order_list_query.role,
      start_page: businessParams.param_trade_ecology_order_list_query.start_page,
      page_size: businessParams.param_trade_ecology_order_list_query.page_size,
      status:
        businessParams.param_trade_ecology_order_list_query.status ?? null,
      sales_man_login_id:
        businessParams.param_trade_ecology_order_list_query.sales_man_login_id ??
        null
    },
    response_meta: {
      total_count: value.total_count ?? null,
      returned_item_count: normalizedItems.length,
      start_page: businessParams.param_trade_ecology_order_list_query.start_page,
      page_size: businessParams.param_trade_ecology_order_list_query.page_size,
      request_id: payload.request_id ?? null,
      trace_id: payload._trace_id_ ?? null,
      success: result.success ?? null
    },
    verified_fields: OFFICIAL_ORDER_LIST_VERIFIED_FIELDS,
    warnings: [],
    raw_root_key: response.rootKey,
    items: normalizedItems
  };
}

export async function fetchAlibabaOfficialOrderDetail(
  {
    account,
    appKey,
    appSecret,
    accessToken,
    endpointUrl
  },
  query = {}
) {
  const tradeId = String(query.e_trade_id ?? "").trim();
  if (!tradeId) {
    const error = new Error("Orders detail requires e_trade_id");
    error.missingKeys = ["e_trade_id"];
    throw error;
  }

  const effectiveEndpointUrl = resolveAlibabaSyncEndpoint(endpointUrl);
  const response = await callAlibabaSyncApi({
    apiName: "alibaba.seller.order.get",
    appKey,
    appSecret,
    accessToken,
    endpointUrl: effectiveEndpointUrl,
    businessParams: {
      e_trade_id: tradeId
    }
  });

  const payload = response.payload ?? {};
  const detailValue = payload.value ?? {};

  return {
    account,
    module: "orders",
    read_only: true,
    verification_status: "已验证可读",
    evidence_level: "L1",
    data_scope: "minimal_detail",
    source: {
      type: "official_api",
      api_name: "alibaba.seller.order.get",
      endpoint_url: effectiveEndpointUrl,
      auth_parameter: "access_token",
      sign_method: "sha256"
    },
    request_meta: {
      e_trade_id: tradeId
    },
    response_meta: {
      request_id: payload.request_id ?? null,
      trace_id: payload._trace_id_ ?? null,
      e_trade_id: tradeId
    },
    verified_fields: OFFICIAL_ORDER_DETAIL_VERIFIED_FIELDS,
    warnings: [],
    raw_root_key: response.rootKey,
    item: normalizeOfficialOrderDetail(detailValue, tradeId)
  };
}
