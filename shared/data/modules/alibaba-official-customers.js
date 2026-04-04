import { callAlibabaSyncApi, resolveAlibabaSyncEndpoint } from "../clients/alibaba-sync-client.js";

export const OFFICIAL_CUSTOMER_LIST_VERIFIED_FIELDS = Object.freeze([
  "data_list.customer_open_dto[].customer_id",
  "data_list.customer_open_dto[].customer_phase",
  "data_list.customer_open_dto[].company_name",
  "data_list.customer_open_dto[].source_list",
  "data_list.customer_open_dto[].growth_level",
  "data_list.customer_open_dto[].contact_open_co_list.contact_open_co[].reference_id",
  "total"
]);

function buildMissingParameterError(message, missingKeys) {
  const error = new Error(message);
  error.missingKeys = missingKeys;
  return error;
}

function normalizeInteger(value, fallbackValue = null) {
  if (value === undefined || value === null || value === "") {
    return fallbackValue;
  }

  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed)) {
    return fallbackValue;
  }

  return parsed;
}

function normalizeCustomerItems(payload = {}) {
  const rawItems = payload.data_list?.customer_open_dto;

  if (Array.isArray(rawItems)) {
    return rawItems;
  }

  if (rawItems && typeof rawItems === "object") {
    return [rawItems];
  }

  return [];
}

export async function fetchAlibabaOfficialCustomerList(
  {
    account,
    appKey,
    appSecret,
    accessToken,
    endpointUrl
  },
  query = {}
) {
  const customerIdBegin = String(query.customer_id_begin ?? "").trim();
  if (!customerIdBegin) {
    throw buildMissingParameterError("Customer list requires customer_id_begin", [
      "customer_id_begin"
    ]);
  }

  const pageSize = normalizeInteger(query.page_size, null);
  const startTime = String(query.start_time ?? "").trim();
  const endTime = String(query.end_time ?? "").trim();
  const lastSyncEndTime = String(query.last_sync_end_time ?? "").trim();
  const effectiveEndpointUrl = resolveAlibabaSyncEndpoint(endpointUrl);
  const response = await callAlibabaSyncApi({
    apiName: "alibaba.seller.customer.batch.get",
    appKey,
    appSecret,
    accessToken,
    endpointUrl: effectiveEndpointUrl,
    businessParams: {
      customer_id_begin: customerIdBegin,
      page_size: pageSize,
      start_time: startTime || undefined,
      end_time: endTime || undefined,
      last_sync_end_time: lastSyncEndTime || undefined
    }
  });

  const payload = response.payload ?? {};
  const items = normalizeCustomerItems(payload);

  return {
    account,
    module: "customers",
    read_only: true,
    verification_status: "已过授权层，待权限放开或实读验证",
    evidence_level: "L0.5",
    data_scope: "raw_customer_list",
    source: {
      type: "official_api",
      api_name: "alibaba.seller.customer.batch.get",
      endpoint_url: effectiveEndpointUrl,
      auth_parameter: "access_token",
      sign_method: "sha256"
    },
    request_meta: {
      customer_id_begin: customerIdBegin,
      page_size: pageSize,
      start_time: startTime || null,
      end_time: endTime || null,
      last_sync_end_time: lastSyncEndTime || null
    },
    response_meta: {
      request_id: payload.request_id ?? null,
      trace_id: payload.trace_id ?? payload._trace_id_ ?? null,
      returned_item_count: items.length,
      total: payload.total ?? null
    },
    verified_fields: OFFICIAL_CUSTOMER_LIST_VERIFIED_FIELDS,
    warnings: [
      "当前路由只证明 customers list 可走 production 认证闭环，并不等于当前权限已放开或客户数据已可稳定读取。"
    ],
    raw_root_key: response.rootKey,
    data_list: payload.data_list ?? null,
    total: payload.total ?? null,
    items
  };
}
