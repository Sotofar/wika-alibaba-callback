import { AlibabaTopApiError } from "../clients/alibaba-top-client.js";
import {
  callAlibabaSyncApi,
  resolveAlibabaSyncEndpoint
} from "../clients/alibaba-sync-client.js";

export const OFFICIAL_PRODUCT_SCHEMA_VERIFIED_FIELDS = Object.freeze([
  "data",
  "message",
  "msg_code",
  "biz_success",
  "trace_id"
]);

export const OFFICIAL_PRODUCT_SCHEMA_RENDER_VERIFIED_FIELDS = Object.freeze([
  "data",
  "message",
  "msg_code",
  "biz_success",
  "trace_id"
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

function buildWarnings() {
  return [
    "原始路由，仅做最小清洗；返回的 data 为 schema XML 文本，不等于产品写入闭环已完成。"
  ];
}

function uniqueStrings(values = []) {
  return [...new Set(values.filter(Boolean).map((value) => String(value).trim()))];
}

function extractSchemaFieldIds(xml = "") {
  return uniqueStrings(
    [...String(xml).matchAll(/<field\b[^>]*\bid="([^"]+)"/g)].map(
      (match) => match[1]
    )
  );
}

function extractRequiredFieldIds(xml = "") {
  return uniqueStrings(
    [
      ...String(xml).matchAll(
        /<field\b[^>]*\bid="([^"]+)"[\s\S]{0,1200}?<rule name="requiredRule"/g
      )
    ].map((match) => match[1])
  );
}

export function summarizeAlibabaSchemaXml(xml = "") {
  const normalizedXml = String(xml ?? "");
  const fieldIds = extractSchemaFieldIds(normalizedXml);
  const requiredFieldIds = extractRequiredFieldIds(normalizedXml);

  return {
    xml_length: normalizedXml.length,
    field_count: fieldIds.length,
    required_field_count: requiredFieldIds.length,
    field_ids_preview: fieldIds.slice(0, 30),
    required_field_ids_preview: requiredFieldIds.slice(0, 20),
    field_ids: fieldIds,
    required_field_ids: requiredFieldIds
  };
}

function buildResponseMeta(payload, schemaSummary, extra = {}) {
  return {
    request_id: payload?.request_id ?? null,
    trace_id: payload?.trace_id ?? payload?._trace_id_ ?? null,
    biz_success:
      typeof payload?.biz_success === "boolean" ? payload.biz_success : null,
    msg_code: payload?.msg_code ?? null,
    message: payload?.message ?? null,
    schema_xml_length: schemaSummary.xml_length,
    schema_field_count: schemaSummary.field_count,
    required_field_count: schemaSummary.required_field_count,
    schema_field_ids_preview: schemaSummary.field_ids_preview,
    required_field_ids_preview: schemaSummary.required_field_ids_preview,
    ...extra
  };
}

export async function fetchAlibabaOfficialProductSchema(
  {
    account,
    appKey,
    appSecret,
    accessToken,
    endpointUrl
  },
  query = {}
) {
  const catId = Number.parseInt(String(query.cat_id ?? ""), 10);
  if (!Number.isFinite(catId)) {
    throw buildMissingParameterError("Product schema requires cat_id", [
      "cat_id"
    ]);
  }

  const language = String(query.language || "en_US").trim() || "en_US";
  const effectiveEndpointUrl = resolveAlibabaSyncEndpoint(endpointUrl);
  const response = await callAlibabaSyncApi({
    apiName: "alibaba.icbu.product.schema.get",
    appKey,
    appSecret,
    accessToken,
    endpointUrl: effectiveEndpointUrl,
    businessParams: {
      param_product_top_publish_request: {
        cat_id: catId,
        language
      }
    }
  });

  const payload = response.payload ?? {};
  const schemaXml = String(payload.data ?? "");
  const schemaSummary = summarizeAlibabaSchemaXml(schemaXml);

  return {
    account,
    module: "products",
    read_only: true,
    verification_status: "已验证可读",
    evidence_level: "L1",
    data_scope: "raw_product_schema",
    source: buildOfficialSource(
      "alibaba.icbu.product.schema.get",
      effectiveEndpointUrl
    ),
    request_meta: {
      cat_id: catId,
      language
    },
    response_meta: buildResponseMeta(payload, schemaSummary),
    verified_fields: OFFICIAL_PRODUCT_SCHEMA_VERIFIED_FIELDS,
    warnings: buildWarnings(),
    raw_root_key: response.rootKey,
    data: schemaXml
  };
}

export async function fetchAlibabaOfficialProductSchemaRender(
  {
    account,
    appKey,
    appSecret,
    accessToken,
    endpointUrl
  },
  query = {}
) {
  const catId = Number.parseInt(String(query.cat_id ?? ""), 10);
  const productId = Number.parseInt(String(query.product_id ?? ""), 10);
  const missingKeys = [];

  if (!Number.isFinite(catId)) {
    missingKeys.push("cat_id");
  }

  if (!Number.isFinite(productId)) {
    missingKeys.push("product_id");
  }

  if (missingKeys.length > 0) {
    throw buildMissingParameterError(
      "Product schema render requires cat_id and product_id",
      missingKeys
    );
  }

  const language = String(query.language || "en_US").trim() || "en_US";
  const effectiveEndpointUrl = resolveAlibabaSyncEndpoint(endpointUrl);
  const response = await callAlibabaSyncApi({
    apiName: "alibaba.icbu.product.schema.render",
    appKey,
    appSecret,
    accessToken,
    endpointUrl: effectiveEndpointUrl,
    businessParams: {
      param_product_top_publish_request: {
        cat_id: catId,
        language,
        product_id: productId
      }
    }
  });

  const payload = response.payload ?? {};
  const schemaXml = String(payload.data ?? "");
  const schemaSummary = summarizeAlibabaSchemaXml(schemaXml);

  return {
    account,
    module: "products",
    read_only: true,
    verification_status: "已验证可读",
    evidence_level: "L1",
    data_scope: "raw_product_schema_render",
    source: buildOfficialSource(
      "alibaba.icbu.product.schema.render",
      effectiveEndpointUrl
    ),
    request_meta: {
      cat_id: catId,
      product_id: productId,
      language
    },
    response_meta: buildResponseMeta(payload, schemaSummary),
    verified_fields: OFFICIAL_PRODUCT_SCHEMA_RENDER_VERIFIED_FIELDS,
    warnings: buildWarnings(),
    raw_root_key: response.rootKey,
    data: schemaXml
  };
}

