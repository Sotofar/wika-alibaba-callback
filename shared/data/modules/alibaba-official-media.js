import { AlibabaTopApiError } from "../clients/alibaba-top-client.js";
import {
  callAlibabaSyncApi,
  resolveAlibabaSyncEndpoint
} from "../clients/alibaba-sync-client.js";

export const OFFICIAL_MEDIA_LIST_VERIFIED_FIELDS = Object.freeze([
  "pagination_query_list.list[].id",
  "pagination_query_list.list[].url",
  "pagination_query_list.list[].file_name",
  "pagination_query_list.list[].group_id",
  "pagination_query_list.list[].reference_count"
]);

export const OFFICIAL_MEDIA_GROUPS_VERIFIED_FIELDS = Object.freeze([
  "groups[].id",
  "groups[].name",
  "groups[].level1",
  "groups[].level2",
  "groups[].level3"
]);

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

function buildWarnings(type) {
  const common = [
    "原始只读路由，仅做最小清洗；不等于已证明 media 写侧低风险边界成立。"
  ];

  if (type === "list") {
    return [
      ...common,
      "当前能力只证明图片银行素材可查询，不等于允许真实上传或自动引用。"
    ];
  }

  return [
    ...common,
    "当前能力只证明图片银行分组信息可查询，不等于已证明存在安全的分组操作或清理闭环。"
  ];
}

function buildResponseMeta(payload, extra = {}) {
  return {
    request_id: payload?.request_id ?? null,
    trace_id: payload?.trace_id ?? payload?._trace_id_ ?? null,
    errorcode: payload?.errorcode ?? null,
    errormsg: payload?.errormsg ?? null,
    ...extra
  };
}

function normalizeInteger(value, fallbackValue = null) {
  if (value === undefined || value === null || value === "") {
    return fallbackValue;
  }

  const normalized = Number.parseInt(String(value), 10);
  if (!Number.isFinite(normalized)) {
    return fallbackValue;
  }

  return normalized;
}

function normalizePhotobankItems(paginationQueryList) {
  const rawList = paginationQueryList?.list;

  if (Array.isArray(rawList)) {
    return rawList;
  }

  if (Array.isArray(rawList?.photobank_image_do)) {
    return rawList.photobank_image_do;
  }

  if (rawList?.photobank_image_do && typeof rawList.photobank_image_do === "object") {
    return [rawList.photobank_image_do];
  }

  if (rawList && typeof rawList === "object") {
    return [rawList];
  }

  return [];
}

function normalizePhotobankGroups(groups) {
  if (Array.isArray(groups)) {
    return groups;
  }

  if (Array.isArray(groups?.photo_album_group)) {
    return groups.photo_album_group;
  }

  if (groups?.photo_album_group && typeof groups.photo_album_group === "object") {
    return [groups.photo_album_group];
  }

  if (groups && typeof groups === "object") {
    return [groups];
  }

  return [];
}

function throwPhotobankBusinessError(apiName, endpointUrl, payload) {
  throw new AlibabaTopApiError(`${apiName} returned business failure`, {
    apiName,
    endpointUrl,
    errorResponse: {
      code: payload?.errorcode ?? null,
      sub_code: payload?.errorcode ?? null,
      msg: payload?.errormsg ?? `${apiName} business failure`,
      sub_msg: payload?.errormsg ?? null
    },
    payload
  });
}

export async function fetchAlibabaOfficialMediaList(
  {
    account,
    appKey,
    appSecret,
    accessToken,
    endpointUrl
  },
  query = {}
) {
  const currentPage = normalizeInteger(query.current_page, 1);
  const pageSize = normalizeInteger(query.page_size, 20);
  const groupId = String(query.group_id ?? "").trim();
  const locationType = String(query.location_type ?? "ALL_GROUP").trim() || "ALL_GROUP";
  const extraContext = String(query.extra_context ?? "").trim();
  const effectiveEndpointUrl = resolveAlibabaSyncEndpoint(endpointUrl);

  const response = await callAlibabaSyncApi({
    apiName: "alibaba.icbu.photobank.list",
    appKey,
    appSecret,
    accessToken,
    endpointUrl: effectiveEndpointUrl,
    businessParams: {
      current_page: currentPage,
      page_size: pageSize,
      location_type: locationType,
      group_id: groupId || undefined,
      extra_context: extraContext || undefined
    }
  });

  const payload = response.payload ?? {};
  const paginationQueryList = payload.pagination_query_list ?? null;
  if (!paginationQueryList && (payload.errorcode || payload.errormsg)) {
    throwPhotobankBusinessError(
      "alibaba.icbu.photobank.list",
      effectiveEndpointUrl,
      payload
    );
  }

  const items = normalizePhotobankItems(paginationQueryList);

  return {
    account,
    module: "media",
    read_only: true,
    verification_status: "已验证可读",
    evidence_level: "L1",
    data_scope: "raw_photobank_list",
    source: buildOfficialSource(
      "alibaba.icbu.photobank.list",
      effectiveEndpointUrl
    ),
    request_meta: {
      current_page: currentPage,
      page_size: pageSize,
      location_type: locationType,
      group_id: groupId || null
    },
    response_meta: buildResponseMeta(payload, {
      returned_item_count: items.length,
      item_field_keys:
        items[0] && typeof items[0] === "object"
          ? Object.keys(items[0]).sort()
          : []
    }),
    verified_fields: OFFICIAL_MEDIA_LIST_VERIFIED_FIELDS,
    warnings: buildWarnings("list"),
    raw_root_key: response.rootKey,
    pagination_query_list: paginationQueryList,
    items
  };
}

export async function fetchAlibabaOfficialMediaGroups(
  {
    account,
    appKey,
    appSecret,
    accessToken,
    endpointUrl
  },
  query = {}
) {
  const groupId = normalizeInteger(query.id, null);
  const extraContext = String(query.extra_context ?? "").trim();
  const effectiveEndpointUrl = resolveAlibabaSyncEndpoint(endpointUrl);

  const response = await callAlibabaSyncApi({
    apiName: "alibaba.icbu.photobank.group.list",
    appKey,
    appSecret,
    accessToken,
    endpointUrl: effectiveEndpointUrl,
    businessParams: {
      id: groupId,
      extra_context: extraContext || undefined
    }
  });

  const payload = response.payload ?? {};
  if (!payload.groups && (payload.errorcode || payload.errormsg)) {
    throwPhotobankBusinessError(
      "alibaba.icbu.photobank.group.list",
      effectiveEndpointUrl,
      payload
    );
  }

  const groups = normalizePhotobankGroups(payload.groups);

  return {
    account,
    module: "media",
    read_only: true,
    verification_status: "已验证可读",
    evidence_level: "L1",
    data_scope: "raw_photobank_groups",
    source: buildOfficialSource(
      "alibaba.icbu.photobank.group.list",
      effectiveEndpointUrl
    ),
    request_meta: {
      id: groupId,
      extra_context: extraContext || null
    },
    response_meta: buildResponseMeta(payload, {
      returned_group_count: groups.length,
      group_field_keys:
        groups[0] && typeof groups[0] === "object"
          ? Object.keys(groups[0]).sort()
          : []
    }),
    verified_fields: OFFICIAL_MEDIA_GROUPS_VERIFIED_FIELDS,
    warnings: buildWarnings("groups"),
    raw_root_key: response.rootKey,
    groups
  };
}
