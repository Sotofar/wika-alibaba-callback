import { AlibabaTopApiError } from "../clients/alibaba-top-client.js";
import {
  callAlibabaSyncApi,
  resolveAlibabaSyncEndpoint
} from "../clients/alibaba-sync-client.js";

export const OFFICIAL_CATEGORY_TREE_VERIFIED_FIELDS = Object.freeze([
  "category.category_id",
  "category.name",
  "category.level",
  "category.leaf_category",
  "category.child_ids.number"
]);

export const OFFICIAL_CATEGORY_ATTRIBUTES_VERIFIED_FIELDS = Object.freeze([
  "attr_result_list.attribute[].attr_id",
  "attr_result_list.attribute[].en_name",
  "attr_result_list.attribute[].required",
  "attr_result_list.attribute[].show_type",
  "attributes.attribute[].attr_id",
  "attributes.attribute[].input_type",
  "attributes.attribute[].attribute_values.attribute_value"
]);

function buildMissingParameterError(message, missingKeys) {
  const error = new Error(message);
  error.missingKeys = missingKeys;
  return error;
}

function buildWarnings() {
  return [
    "原始支持路由，仅做最小清洗；不等于产品写入闭环已完成。"
  ];
}

function buildOfficialSource(apiName, endpointUrl, extra = {}) {
  return {
    type: "official_api",
    api_name: apiName,
    endpoint_url: endpointUrl,
    auth_parameter: "access_token",
    sign_method: "sha256",
    ...extra
  };
}

function buildResponseMeta(payload, extra = {}) {
  return {
    request_id: payload?.request_id ?? null,
    trace_id: payload?._trace_id_ ?? null,
    ...extra
  };
}

function normalizeCatId(value, fallbackValue = null) {
  const normalized = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(normalized) || normalized < 0) {
    return fallbackValue;
  }

  return normalized;
}

export async function fetchAlibabaOfficialCategoryTree(
  {
    account,
    appKey,
    appSecret,
    accessToken,
    endpointUrl
  },
  query = {}
) {
  const catId = normalizeCatId(query.cat_id, 0);
  const effectiveEndpointUrl = resolveAlibabaSyncEndpoint(endpointUrl);
  const response = await callAlibabaSyncApi({
    apiName: "alibaba.icbu.category.get.new",
    appKey,
    appSecret,
    accessToken,
    endpointUrl: effectiveEndpointUrl,
    businessParams: {
      cat_id: catId
    }
  });

  const payload = response.payload ?? {};
  if (payload.success === false) {
    throw new AlibabaTopApiError("Alibaba category tree returned business failure", {
      apiName: "alibaba.icbu.category.get.new",
      endpointUrl: effectiveEndpointUrl,
      errorResponse: {
        code: payload.error_code ?? null,
        sub_code: null,
        msg: payload.error_message ?? "Alibaba category tree business failure",
        sub_msg: null
      },
      payload
    });
  }

  const category = payload.category ?? null;

  return {
    account,
    module: "categories",
    read_only: true,
    verification_status: "已验证可读",
    evidence_level: "L1",
    data_scope: "raw_category_tree",
    source: buildOfficialSource(
      "alibaba.icbu.category.get.new",
      effectiveEndpointUrl
    ),
    request_meta: {
      cat_id: catId
    },
    response_meta: buildResponseMeta(payload, {
      category_field_keys:
        category && typeof category === "object" ? Object.keys(category).sort() : []
    }),
    verified_fields: OFFICIAL_CATEGORY_TREE_VERIFIED_FIELDS,
    warnings: buildWarnings(),
    raw_root_key: response.rootKey,
    category
  };
}

export async function fetchAlibabaOfficialCategoryAttributes(
  {
    account,
    appKey,
    appSecret,
    accessToken,
    endpointUrl
  },
  query = {}
) {
  const catId = normalizeCatId(query.cat_id, null);
  if (!Number.isFinite(catId)) {
    throw buildMissingParameterError("Category attributes requires cat_id", [
      "cat_id"
    ]);
  }

  const effectiveEndpointUrl = resolveAlibabaSyncEndpoint(endpointUrl);
  const attrResponse = await callAlibabaSyncApi({
    apiName: "alibaba.icbu.category.attr.get",
    appKey,
    appSecret,
    accessToken,
    endpointUrl: effectiveEndpointUrl,
    businessParams: {
      attribute_request: {
        cat_id: catId
      }
    }
  });
  const attributeResponse = await callAlibabaSyncApi({
    apiName: "alibaba.icbu.category.attribute.get",
    appKey,
    appSecret,
    accessToken,
    endpointUrl: effectiveEndpointUrl,
    businessParams: {
      cat_id: catId
    }
  });

  const attrPayload = attrResponse.payload ?? {};
  const attributePayload = attributeResponse.payload ?? {};

  const attrResultList = attrPayload.result_list ?? null;
  const attributes = attributePayload.attributes ?? null;

  return {
    account,
    module: "categories",
    read_only: true,
    verification_status: "已验证可读",
    evidence_level: "L1",
    data_scope: "raw_category_attributes",
    source: buildOfficialSource(
      "alibaba.icbu.category.attr.get",
      effectiveEndpointUrl,
      {
        companion_api_name: "alibaba.icbu.category.attribute.get"
      }
    ),
    request_meta: {
      cat_id: catId
    },
    response_meta: {
      attr_get: buildResponseMeta(attrPayload, {
        field_keys:
          attrResultList && typeof attrResultList === "object"
            ? Object.keys(attrResultList).sort()
            : []
      }),
      attribute_get: buildResponseMeta(attributePayload, {
        field_keys:
          attributes && typeof attributes === "object"
            ? Object.keys(attributes).sort()
            : []
      })
    },
    verified_fields: OFFICIAL_CATEGORY_ATTRIBUTES_VERIFIED_FIELDS,
    warnings: buildWarnings(),
    raw_root_keys: {
      attr_get: attrResponse.rootKey,
      attribute_get: attributeResponse.rootKey
    },
    attr_result_list: attrResultList,
    attributes
  };
}
