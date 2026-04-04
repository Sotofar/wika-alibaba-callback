import { AlibabaTopApiError } from "../clients/alibaba-top-client.js";
import {
  callAlibabaSyncApi,
  resolveAlibabaSyncEndpoint
} from "../clients/alibaba-sync-client.js";

function buildMissingParameterError(message, missingKeys) {
  const error = new Error(message);
  error.missingKeys = missingKeys;
  return error;
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

export const OFFICIAL_ORDER_DRAFT_TYPE_VERIFIED_FIELDS = Object.freeze([
  "types"
]);

export async function fetchAlibabaOfficialOrderDraftTypes(
  {
    account,
    appKey,
    appSecret,
    accessToken,
    endpointUrl
  }
) {
  const effectiveEndpointUrl = resolveAlibabaSyncEndpoint(endpointUrl);
  const response = await callAlibabaSyncApi({
    apiName: "alibaba.seller.trade.query.drafttype",
    appKey,
    appSecret,
    accessToken,
    endpointUrl: effectiveEndpointUrl,
    businessParams: {}
  });

  const payload = response.payload ?? {};
  const rawTypes = payload.types?.string ?? payload.types ?? [];
  const types = Array.isArray(rawTypes)
    ? rawTypes
    : rawTypes
      ? [rawTypes]
      : [];

  return {
    account,
    module: "orders",
    read_only: true,
    verification_status: "已验证可读",
    evidence_level: "L1",
    data_scope: "raw_draft_type_permissions",
    source: buildOfficialSource(
      "alibaba.seller.trade.query.drafttype",
      effectiveEndpointUrl
    ),
    request_meta: {},
    response_meta: buildResponseMeta(payload, {
      returned_type_count: types.length
    }),
    verified_fields: OFFICIAL_ORDER_DRAFT_TYPE_VERIFIED_FIELDS,
    warnings: ["原始只读权限探针，不等于平台内订单草稿已可安全创建。"],
    raw_root_key: response.rootKey,
    types
  };
}

export async function probeAlibabaOfficialOrderCreate(
  {
    account,
    appKey,
    appSecret,
    accessToken,
    endpointUrl
  },
  query = {}
) {
  const effectiveEndpointUrl = resolveAlibabaSyncEndpoint(endpointUrl);
  const payloadCandidate =
    query.param_order_create && typeof query.param_order_create === "object"
      ? query.param_order_create
      : {};

  const response = await callAlibabaSyncApi({
    apiName: "alibaba.trade.order.create",
    appKey,
    appSecret,
    accessToken,
    endpointUrl: effectiveEndpointUrl,
    businessParams: {
      param_order_create: payloadCandidate
    }
  });

  const payload = response.payload ?? {};
  if (payload.success === false) {
    throw new AlibabaTopApiError("Alibaba trade order create returned business failure", {
      apiName: "alibaba.trade.order.create",
      endpointUrl: effectiveEndpointUrl,
      errorResponse: {
        code: payload.error_code ?? null,
        sub_code: null,
        msg: payload.error_message ?? "Alibaba trade order create business failure",
        sub_msg: null
      },
      payload
    });
  }

  return {
    account,
    module: "orders",
    read_only: false,
    verification_status: "边界待确认",
    evidence_level: "L0",
    data_scope: "create_boundary_probe",
    source: buildOfficialSource(
      "alibaba.trade.order.create",
      effectiveEndpointUrl
    ),
    request_meta: {
      param_order_create_keys:
        payloadCandidate && typeof payloadCandidate === "object"
          ? Object.keys(payloadCandidate).sort()
          : []
    },
    response_meta: buildResponseMeta(payload, {
      response_field_keys:
        payload && typeof payload === "object" ? Object.keys(payload).sort() : []
    }),
    warnings: [
      "该结果仅用于订单入口边界验证，不代表允许真实创单。",
      "create 家族默认不路由化，除非能证明非成交、可回滚、无副作用。"
    ],
    raw_root_key: response.rootKey,
    payload
  };
}
