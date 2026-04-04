import { AlibabaTopApiError } from "../clients/alibaba-top-client.js";
import {
  callAlibabaSyncApi,
  resolveAlibabaSyncEndpoint
} from "../clients/alibaba-sync-client.js";

export const OFFICIAL_PRODUCT_SCORE_VERIFIED_FIELDS = Object.freeze([
  "result.boutique_tag",
  "result.final_score",
  "result.problem_map"
]);

export const OFFICIAL_PRODUCT_DETAIL_VERIFIED_FIELDS = Object.freeze([
  "product.product_id",
  "product.subject",
  "product.category_id",
  "product.description",
  "product.keywords",
  "product.pc_detail_url",
  "product.gmt_create",
  "product.gmt_modified"
]);

export const OFFICIAL_PRODUCT_GROUP_VERIFIED_FIELDS = Object.freeze([
  "product_group.group_id",
  "product_group.group_name",
  "product_group.parent_id",
  "product_group.children_group",
  "product_group.children_id_list"
]);

export const OFFICIAL_ORDER_FUND_VERIFIED_FIELDS = Object.freeze([
  "value.fund_pay_list",
  "value.service_fee"
]);

export const OFFICIAL_ORDER_LOGISTICS_VERIFIED_FIELDS = Object.freeze([
  "value.logistic_status",
  "value.shipping_order_list"
]);

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

function buildWarnings() {
  return ["原始路由，仅做最小清洗；不等于经营层 summary 聚合。"];
}

export async function fetchAlibabaOfficialProductScore(
  {
    account,
    appKey,
    appSecret,
    accessToken,
    endpointUrl
  },
  query = {}
) {
  const productId = String(query.product_id ?? "").trim();
  if (!productId) {
    throw buildMissingParameterError("Product score requires product_id", [
      "product_id"
    ]);
  }

  const effectiveEndpointUrl = resolveAlibabaSyncEndpoint(endpointUrl);
  const response = await callAlibabaSyncApi({
    apiName: "alibaba.icbu.product.score.get",
    appKey,
    appSecret,
    accessToken,
    endpointUrl: effectiveEndpointUrl,
    businessParams: {
      product_id: productId
    }
  });

  const payload = response.payload ?? {};
  if (payload.success === false) {
    throw new AlibabaTopApiError("Alibaba product score returned business failure", {
      apiName: "alibaba.icbu.product.score.get",
      endpointUrl: effectiveEndpointUrl,
      errorResponse: {
        code: payload.error_code ?? null,
        sub_code: null,
        msg: payload.error_message ?? "Alibaba product score business failure",
        sub_msg: null
      },
      payload
    });
  }

  const result = payload.result ?? null;

  return {
    account,
    module: "products",
    read_only: true,
    verification_status: "已验证可读",
    evidence_level: "L1",
    data_scope: "raw_score",
    source: buildOfficialSource(
      "alibaba.icbu.product.score.get",
      effectiveEndpointUrl
    ),
    request_meta: {
      product_id: productId
    },
    response_meta: buildResponseMeta(payload, {
      result_field_keys:
        result && typeof result === "object" ? Object.keys(result).sort() : []
    }),
    verified_fields: OFFICIAL_PRODUCT_SCORE_VERIFIED_FIELDS,
    warnings: buildWarnings(),
    raw_root_key: response.rootKey,
    result
  };
}

export async function fetchAlibabaOfficialProductDetail(
  {
    account,
    appKey,
    appSecret,
    accessToken,
    endpointUrl
  },
  query = {}
) {
  const productId = String(query.product_id ?? "").trim();
  if (!productId) {
    throw buildMissingParameterError("Product detail requires product_id", [
      "product_id"
    ]);
  }

  const language = String(query.language || "ENGLISH").trim().toUpperCase();
  const effectiveEndpointUrl = resolveAlibabaSyncEndpoint(endpointUrl);
  const response = await callAlibabaSyncApi({
    apiName: "alibaba.icbu.product.get",
    appKey,
    appSecret,
    accessToken,
    endpointUrl: effectiveEndpointUrl,
    businessParams: {
      product_id: productId,
      language
    }
  });

  const payload = response.payload ?? {};
  if (payload.success === false) {
    throw new AlibabaTopApiError("Alibaba product detail returned business failure", {
      apiName: "alibaba.icbu.product.get",
      endpointUrl: effectiveEndpointUrl,
      errorResponse: {
        code: payload.error_code ?? null,
        sub_code: null,
        msg: payload.error_message ?? "Alibaba product detail business failure",
        sub_msg: null
      },
      payload
    });
  }

  const product = payload.product ?? null;

  return {
    account,
    module: "products",
    read_only: true,
    verification_status: "已验证可读",
    evidence_level: "L1",
    data_scope: "raw_detail",
    source: buildOfficialSource(
      "alibaba.icbu.product.get",
      effectiveEndpointUrl
    ),
    request_meta: {
      product_id: productId,
      language
    },
    response_meta: buildResponseMeta(payload, {
      product_field_keys:
        product && typeof product === "object" ? Object.keys(product).sort() : []
    }),
    verified_fields: OFFICIAL_PRODUCT_DETAIL_VERIFIED_FIELDS,
    warnings: buildWarnings(),
    raw_root_key: response.rootKey,
    product
  };
}

export async function fetchAlibabaOfficialProductGroups(
  {
    account,
    appKey,
    appSecret,
    accessToken,
    endpointUrl
  },
  query = {}
) {
  const groupId = String(query.group_id ?? "").trim();
  if (!groupId) {
    throw buildMissingParameterError("Product groups requires group_id", [
      "group_id"
    ]);
  }

  const effectiveEndpointUrl = resolveAlibabaSyncEndpoint(endpointUrl);
  const response = await callAlibabaSyncApi({
    apiName: "alibaba.icbu.product.group.get",
    appKey,
    appSecret,
    accessToken,
    endpointUrl: effectiveEndpointUrl,
    businessParams: {
      group_id: groupId
    }
  });

  const payload = response.payload ?? {};
  if (payload.success === false) {
    throw new AlibabaTopApiError("Alibaba product groups returned business failure", {
      apiName: "alibaba.icbu.product.group.get",
      endpointUrl: effectiveEndpointUrl,
      errorResponse: {
        code: payload.error_code ?? null,
        sub_code: null,
        msg: payload.error_message ?? "Alibaba product groups business failure",
        sub_msg: null
      },
      payload
    });
  }

  const productGroup = payload.product_group ?? null;

  return {
    account,
    module: "products",
    read_only: true,
    verification_status: "已验证可读",
    evidence_level: "L1",
    data_scope: "raw_groups",
    source: buildOfficialSource(
      "alibaba.icbu.product.group.get",
      effectiveEndpointUrl
    ),
    request_meta: {
      group_id: groupId
    },
    response_meta: buildResponseMeta(payload, {
      product_group_field_keys:
        productGroup && typeof productGroup === "object"
          ? Object.keys(productGroup).sort()
          : []
    }),
    verified_fields: OFFICIAL_PRODUCT_GROUP_VERIFIED_FIELDS,
    warnings: buildWarnings(),
    raw_root_key: response.rootKey,
    product_group: productGroup
  };
}

export async function fetchAlibabaOfficialOrderFund(
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
    throw buildMissingParameterError("Order fund requires e_trade_id", [
      "e_trade_id"
    ]);
  }

  const dataSelect = String(
    query.data_select || "fund_serviceFee,fund_fundPay"
  ).trim();
  const effectiveEndpointUrl = resolveAlibabaSyncEndpoint(endpointUrl);
  const response = await callAlibabaSyncApi({
    apiName: "alibaba.seller.order.fund.get",
    appKey,
    appSecret,
    accessToken,
    endpointUrl: effectiveEndpointUrl,
    businessParams: {
      e_trade_id: tradeId,
      data_select: dataSelect
    }
  });

  const payload = response.payload ?? {};
  if (payload.success === false) {
    throw new AlibabaTopApiError("Alibaba order fund returned business failure", {
      apiName: "alibaba.seller.order.fund.get",
      endpointUrl: effectiveEndpointUrl,
      errorResponse: {
        code: payload.error_code ?? null,
        sub_code: null,
        msg: payload.error_message ?? "Alibaba order fund business failure",
        sub_msg: null
      },
      payload
    });
  }

  const value = payload.value ?? null;

  return {
    account,
    module: "orders",
    read_only: true,
    verification_status: "已验证可读",
    evidence_level: "L1",
    data_scope: "raw_fund",
    source: buildOfficialSource(
      "alibaba.seller.order.fund.get",
      effectiveEndpointUrl
    ),
    request_meta: {
      e_trade_id: tradeId,
      data_select: dataSelect
    },
    response_meta: buildResponseMeta(payload, {
      value_field_keys:
        value && typeof value === "object" ? Object.keys(value).sort() : []
    }),
    verified_fields: OFFICIAL_ORDER_FUND_VERIFIED_FIELDS,
    warnings: buildWarnings(),
    raw_root_key: response.rootKey,
    value
  };
}

export async function fetchAlibabaOfficialOrderLogistics(
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
    throw buildMissingParameterError("Order logistics requires e_trade_id", [
      "e_trade_id"
    ]);
  }

  const dataSelect = String(query.data_select || "logistic_order").trim();
  const effectiveEndpointUrl = resolveAlibabaSyncEndpoint(endpointUrl);
  const response = await callAlibabaSyncApi({
    apiName: "alibaba.seller.order.logistics.get",
    appKey,
    appSecret,
    accessToken,
    endpointUrl: effectiveEndpointUrl,
    businessParams: {
      e_trade_id: tradeId,
      data_select: dataSelect
    }
  });

  const payload = response.payload ?? {};
  if (payload.success === false) {
    throw new AlibabaTopApiError(
      "Alibaba order logistics returned business failure",
      {
        apiName: "alibaba.seller.order.logistics.get",
        endpointUrl: effectiveEndpointUrl,
        errorResponse: {
          code: payload.error_code ?? null,
          sub_code: null,
          msg:
            payload.error_message ?? "Alibaba order logistics business failure",
          sub_msg: null
        },
        payload
      }
    );
  }

  const value = payload.value ?? null;

  return {
    account,
    module: "orders",
    read_only: true,
    verification_status: "已验证可读",
    evidence_level: "L1",
    data_scope: "raw_logistics",
    source: buildOfficialSource(
      "alibaba.seller.order.logistics.get",
      effectiveEndpointUrl
    ),
    request_meta: {
      e_trade_id: tradeId,
      data_select: dataSelect
    },
    response_meta: buildResponseMeta(payload, {
      value_field_keys:
        value && typeof value === "object" ? Object.keys(value).sort() : []
    }),
    verified_fields: OFFICIAL_ORDER_LOGISTICS_VERIFIED_FIELDS,
    warnings: buildWarnings(),
    raw_root_key: response.rootKey,
    value
  };
}
