import { buildWikaProductDraft } from "../../../../../shared/data/modules/alibaba-product-drafts.js";
import {
  fetchAlibabaOfficialCategoryAttributes,
  fetchAlibabaOfficialCategoryTree
} from "../../../../../shared/data/modules/alibaba-official-category-support.js";
import {
  fetchAlibabaOfficialProductSchema,
  fetchAlibabaOfficialProductSchemaRender,
  fetchAlibabaOfficialProductSchemaRenderDraft
} from "../../../../../shared/data/modules/alibaba-official-product-schema.js";
import {
  fetchAlibabaOfficialMediaGroups,
  fetchAlibabaOfficialMediaList
} from "../../../../../shared/data/modules/alibaba-official-media.js";
import {
  fetchAlibabaOfficialProductDetail,
  fetchAlibabaOfficialProductGroups,
  fetchAlibabaOfficialProductScore
} from "../../../../../shared/data/modules/alibaba-official-extensions.js";
import { fetchWikaProductList } from "../products/module.js";

function normalizeString(value) {
  return String(value ?? "").trim();
}

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
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapAttributeDefinitions(attributePayload = {}) {
  return safeArray(attributePayload?.attr_result_list?.attribute).map((item) => ({
    attr_id: toNumber(item?.attr_id),
    required: item?.required === true || String(item?.required) === "true",
    en_name: normalizeString(item?.en_name) || null
  }));
}

async function readOptional(reader) {
  try {
    return {
      ok: true,
      value: await reader()
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      error_code:
        error?.errorResponse?.code ??
        error?.details?.error_code ??
        error?.details?.sub_code ??
        null
    };
  }
}

function normalizeReadResult(preloadedResult) {
  if (preloadedResult === undefined) {
    return undefined;
  }

  if (
    preloadedResult &&
    typeof preloadedResult === "object" &&
    ("value" in preloadedResult || "error" in preloadedResult)
  ) {
    return preloadedResult;
  }

  if (preloadedResult?.ok === false) {
    return {
      ok: false,
      error: preloadedResult.error ?? "preloaded_error",
      error_code: preloadedResult.error_code ?? null
    };
  }

  return {
    ok: true,
    value: preloadedResult
  };
}

export async function loadProductDraftWorkbenchContext(
  clientConfig,
  query = {},
  preloaded = {}
) {
  const requestedProductId = normalizeString(query.product_id);
  const listResult =
    preloaded.listResult ??
    (await fetchWikaProductList(clientConfig, {
      id: requestedProductId || undefined,
      page_size: requestedProductId ? 1 : 5
    }));
  const listItem = safeArray(listResult.items)[0] ?? null;
  const productId =
    requestedProductId || normalizeString(listItem?.id ?? listItem?.product_id);

  const detailRead =
    normalizeReadResult(preloaded.detailRead) ??
    (productId
      ? await readOptional(() =>
          fetchAlibabaOfficialProductDetail(clientConfig, { product_id: productId })
        )
      : { ok: false, error: "missing_product_id", error_code: null });
  const detailProduct = detailRead.value?.product ?? {};
  const categoryId =
    toNumber(query.category_id) ??
    toNumber(detailProduct?.category_id) ??
    toNumber(listItem?.category_id);
  const categoryName =
    normalizeString(query.category_name) ||
    normalizeString(detailProduct?.category_name) ||
    null;

  const [
    scoreRead,
    groupRead,
    categoryTreeRead,
    attributesRead,
    schemaRead,
    renderRead,
    draftRenderRead,
    mediaListRead,
    mediaGroupsRead
  ] = await Promise.all([
    normalizeReadResult(preloaded.scoreRead) ??
      (productId
        ? readOptional(() =>
            fetchAlibabaOfficialProductScore(clientConfig, { product_id: productId })
          )
        : Promise.resolve({
            ok: false,
            error: "missing_product_id",
            error_code: null
          })),
    normalizeReadResult(preloaded.groupRead) ??
      (normalizeString(listItem?.group_id)
        ? readOptional(() =>
            fetchAlibabaOfficialProductGroups(clientConfig, {
              group_id: listItem.group_id
            })
          )
        : Promise.resolve({
            ok: false,
            error: "missing_group_id",
            error_code: null
          })),
    normalizeReadResult(preloaded.categoryTreeRead) ??
      (Number.isFinite(categoryId)
        ? readOptional(() =>
            fetchAlibabaOfficialCategoryTree(clientConfig, { cat_id: categoryId })
          )
        : Promise.resolve({
            ok: false,
            error: "missing_category_id",
            error_code: null
          })),
    normalizeReadResult(preloaded.attributesRead) ??
      (Number.isFinite(categoryId)
        ? readOptional(() =>
            fetchAlibabaOfficialCategoryAttributes(clientConfig, { cat_id: categoryId })
          )
        : Promise.resolve({
            ok: false,
            error: "missing_category_id",
            error_code: null
          })),
    normalizeReadResult(preloaded.schemaRead) ??
      (Number.isFinite(categoryId)
        ? readOptional(() =>
            fetchAlibabaOfficialProductSchema(clientConfig, { cat_id: categoryId })
          )
        : Promise.resolve({
            ok: false,
            error: "missing_category_id",
            error_code: null
          })),
    normalizeReadResult(preloaded.renderRead) ??
      (Number.isFinite(categoryId) && productId
        ? readOptional(() =>
            fetchAlibabaOfficialProductSchemaRender(clientConfig, {
              cat_id: categoryId,
              product_id: productId
            })
          )
        : Promise.resolve({
            ok: false,
            error: "missing_render_context",
            error_code: null
          })),
    normalizeReadResult(preloaded.draftRenderRead) ??
      (Number.isFinite(categoryId) && productId
        ? readOptional(() =>
            fetchAlibabaOfficialProductSchemaRenderDraft(clientConfig, {
              cat_id: categoryId,
              product_id: productId
            })
          )
        : Promise.resolve({
            ok: false,
            error: "missing_render_context",
            error_code: null
          })),
    normalizeReadResult(preloaded.mediaListRead) ??
      readOptional(() =>
        fetchAlibabaOfficialMediaList(clientConfig, {
          page_size: 5
        })
      ),
    normalizeReadResult(preloaded.mediaGroupsRead) ??
      readOptional(() => fetchAlibabaOfficialMediaGroups(clientConfig, {}))
  ]);

  const assetCandidates = [
    normalizeString(detailProduct?.main_image?.image_url),
    ...safeArray(mediaListRead.value?.items)
      .map((item) => normalizeString(item?.url))
      .filter(Boolean)
  ].filter(Boolean);

  const attributeDefinitions = mapAttributeDefinitions(attributesRead.value);
  const productDraft = buildWikaProductDraft({
    category_id: categoryId,
    category_name:
      categoryName ||
      normalizeString(categoryTreeRead.value?.category?.name) ||
      null,
    base_name:
      normalizeString(query.base_name) ||
      normalizeString(detailProduct?.subject) ||
      normalizeString(listItem?.subject) ||
      null,
    material: normalizeString(query.material) || null,
    positioning: normalizeString(query.positioning) || null,
    keyword_hints:
      Array.isArray(detailProduct?.keywords) && detailProduct.keywords.length > 0
        ? detailProduct.keywords.slice(0, 6)
        : [],
    asset_paths: assetCandidates.slice(0, 5),
    attributes: [],
    attribute_definitions: attributeDefinitions,
    schema_xml: schemaRead.value?.data ?? "",
    render_xml: renderRead.value?.data ?? "",
    first_group_id: normalizeString(listItem?.group_id) || null
  });

  const blockingRisks = [];
  if (!productId) {
    blockingRisks.push("missing_sample_product_context");
  }
  if (!Number.isFinite(categoryId)) {
    blockingRisks.push("missing_category_id");
  }
  if (productDraft.missing_requirements.includes("asset_paths")) {
    blockingRisks.push("media_not_ready");
  }
  if (productDraft.missing_requirements.includes("schema_required_fields")) {
    blockingRisks.push("schema_required_fields_unfilled");
  }

  return {
    query,
    requestedProductId,
    listResult,
    listItem,
    productId,
    categoryId,
    categoryName,
    detailRead,
    detailProduct,
    scoreRead,
    groupRead,
    categoryTreeRead,
    attributesRead,
    schemaRead,
    renderRead,
    draftRenderRead,
    mediaListRead,
    mediaGroupsRead,
    assetCandidates,
    attributeDefinitions,
    productDraft,
    blockingRisks
  };
}

export async function buildProductDraftWorkbench(
  clientConfig,
  query = {},
  preloaded = {}
) {
  const context =
    preloaded.context ??
    (await loadProductDraftWorkbenchContext(clientConfig, query, preloaded));
  const {
    productId,
    categoryId,
    categoryName,
    listItem,
    detailRead,
    detailProduct,
    scoreRead,
    groupRead,
    categoryTreeRead,
    draftRenderRead,
    mediaListRead,
    mediaGroupsRead,
    assetCandidates,
    attributeDefinitions,
    productDraft,
    blockingRisks
  } = context;

  return {
    report_name: "product_draft_workbench",
    generated_at: new Date().toISOString(),
    product_context: {
      sample_source: "/integrations/alibaba/wika/data/products/detail",
      product_id: productId || null,
      subject:
        normalizeString(detailProduct?.subject) ||
        normalizeString(listItem?.subject) ||
        null,
      category_id: categoryId ?? null,
      group_id: normalizeString(listItem?.group_id) || null,
      group_name:
        normalizeString(listItem?.group_name) ||
        normalizeString(groupRead.value?.product_group?.group_name) ||
        null,
      score: scoreRead.value?.result?.final_score ?? null,
      boutique_tag: scoreRead.value?.result?.boutique_tag ?? null
    },
    schema_context: {
      category_tree_available: categoryTreeRead.ok,
      category_name:
        normalizeString(categoryTreeRead.value?.category?.name) ||
        categoryName ||
        null,
      attribute_definition_count: attributeDefinitions.length,
      required_attribute_count: attributeDefinitions.filter((item) => item.required).length,
      schema_field_count: productDraft.schema_context?.schema_field_count ?? null,
      render_field_count: productDraft.schema_context?.render_field_count ?? null,
      schema_mode: productDraft.schema_mode,
      render_draft_observability: {
        attempted: Number.isFinite(categoryId) && Boolean(productId),
        observable: draftRenderRead.ok,
        error_code: draftRenderRead.error_code ?? null,
        error_message: draftRenderRead.ok ? null : draftRenderRead.error ?? null
      }
    },
    media_context: {
      media_list_available: mediaListRead.ok,
      media_groups_available: mediaGroupsRead.ok,
      media_candidate_count: safeArray(mediaListRead.value?.items).length,
      media_group_count: safeArray(mediaGroupsRead.value?.groups).length,
      asset_candidate_count: assetCandidates.length,
      main_image_available: Boolean(normalizeString(detailProduct?.main_image?.image_url))
    },
    draft_readiness: {
      stage: productDraft.stage,
      schema_mode: productDraft.schema_mode,
      safe_draft_preparation_available: true,
      ready_for_publish: false,
      ready_for_safe_draft_candidate: productDraft.ok,
      missing_requirement_count: safeArray(productDraft.missing_requirements).length
    },
    required_manual_fields: {
      missing_requirements: productDraft.missing_requirements ?? [],
      human_required_fields: productDraft.human_required_fields ?? [],
      required_attribute_ids: productDraft.payload_draft?.missing_required_attribute_ids ?? []
    },
    blocking_risks: blockingRisks,
    recommended_next_action:
      blockingRisks.length > 0
        ? "Fill required category attributes, schema-required fields, and media candidates before handing the draft package to manual review. Do not enter platform publish."
        : "The current sample is ready for safe draft preparation. Continue with payload draft generation and manual review only.",
    boundary_statement: {
      safe_draft_preparation_only: true,
      not_platform_publish: true,
      not_write_side_closed_loop: true,
      render_draft_is_observability_only: true
    }
  };
}
