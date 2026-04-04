import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildWikaProductDraft } from "../shared/data/modules/alibaba-product-drafts.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");
const PRODUCTION_BASE_URL = "https://api.wikapacking.com";
const OUTPUT_PATH = path.join(
  PROJECT_ROOT,
  "docs",
  "framework",
  "WIKA_产品草稿链路样例.json"
);

async function fetchJson(pathname) {
  const response = await fetch(`${PRODUCTION_BASE_URL}${pathname}`);
  const text = await response.text();
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("json")) {
    throw new Error(`Expected JSON from ${pathname}, got ${contentType}`);
  }

  return JSON.parse(text);
}

function buildAttributeInputs(attributesPayload) {
  const attributes = attributesPayload?.attr_result_list?.attribute;
  const list = Array.isArray(attributes)
    ? attributes
    : attributes
      ? [attributes]
      : [];

  return list
    .filter((item) => item?.required === true || String(item?.required) === "true")
    .slice(0, 8)
    .map((item, index) => ({
      attr_id: Number(item?.attr_id),
      attr_name: item?.en_name ?? item?.attribute_name ?? `attribute_${index + 1}`,
      value_name: `TEST_ONLY_VALUE_${index + 1}`
    }));
}

function summarizeAttributes(attributesPayload) {
  const attributes = attributesPayload?.attr_result_list?.attribute;
  const list = Array.isArray(attributes)
    ? attributes
    : attributes
      ? [attributes]
      : [];

  const required = list.filter(
    (item) => item?.required === true || String(item?.required) === "true"
  );

  return {
    total_attributes: list.length,
    required_attribute_ids: required
      .map((item) => Number(item?.attr_id))
      .filter(Number.isFinite),
    required_attribute_names: required
      .map((item) => item?.en_name ?? item?.attribute_name ?? null)
      .filter(Boolean)
  };
}

async function main() {
  const productList = await fetchJson(
    "/integrations/alibaba/wika/data/products/list?page_size=1"
  );
  const firstProduct = productList.items?.[0];
  if (!firstProduct?.id) {
    throw new Error("No WIKA product sample available");
  }

  const productDetail = await fetchJson(
    `/integrations/alibaba/wika/data/products/detail?product_id=${firstProduct.id}`
  );
  const categoryId = Number(productDetail?.product?.category_id);
  if (!Number.isFinite(categoryId)) {
    throw new Error("Product detail did not return category_id");
  }

  const [
    categoryTree,
    categoryAttributes,
    schemaResult,
    schemaRenderResult,
    schemaRenderDraftResult,
    mediaListResult,
    mediaGroupsResult
  ] =
    await Promise.all([
      fetchJson(`/integrations/alibaba/wika/data/categories/tree?cat_id=${categoryId}`),
      fetchJson(
        `/integrations/alibaba/wika/data/categories/attributes?cat_id=${categoryId}`
      ),
      fetchJson(`/integrations/alibaba/wika/data/products/schema?cat_id=${categoryId}`),
      fetchJson(
        `/integrations/alibaba/wika/data/products/schema/render?cat_id=${categoryId}&product_id=${firstProduct.id}`
      ),
      fetchJson(
        `/integrations/alibaba/wika/data/products/schema/render/draft?cat_id=${categoryId}&product_id=${firstProduct.id}`
      ),
      fetchJson(
        "/integrations/alibaba/wika/data/media/list?current_page=1&page_size=2&location_type=ALL_GROUP"
      ),
      fetchJson("/integrations/alibaba/wika/data/media/groups")
    ]);

  const attributeInputs = buildAttributeInputs(categoryAttributes);
  const draft = buildWikaProductDraft({
    category_id: categoryId,
    category_name: categoryTree?.category?.name ?? null,
    base_name: productDetail?.product?.subject ?? "TEST ONLY PRODUCT DRAFT",
    material: "PU Leather",
    positioning: "B2B Test Draft",
    asset_paths: [
      "TEST_DO_NOT_USE/main-image.jpg",
      "TEST_DO_NOT_USE/detail-image.jpg"
    ],
    keyword_hints: ["test draft", "do not publish", "sample payload"],
    keywords: ["test draft", "sample payload", "do not publish"],
    selling_points: [
      "Used only for schema-aware payload drafting",
      "No real product publish in this phase"
    ],
    application: "Internal payload validation only",
    customization: "Not for external customer use",
    packaging_notes: "Test placeholder only",
    moq: "500 pcs",
    lead_time: "15-20 days",
    attributes: attributeInputs,
    attribute_definitions:
      categoryAttributes?.attr_result_list?.attribute ?? [],
    schema_xml: schemaResult?.data ?? "",
    render_xml: schemaRenderResult?.data ?? ""
  });

  const sample = {
    account: "wika",
    stage: "phase5_observable_rollback_evidence",
    generated_at: new Date().toISOString(),
    input: {
      product_id_reference: Number(firstProduct.id),
      category_id: categoryId,
      category_name: categoryTree?.category?.name ?? null,
      base_name: productDetail?.product?.subject ?? null,
      asset_paths: [
        "TEST_DO_NOT_USE/main-image.jpg",
        "TEST_DO_NOT_USE/detail-image.jpg"
      ]
    },
    category_tree_excerpt: {
      category_id: categoryTree?.category?.category_id ?? null,
      name: categoryTree?.category?.name ?? null,
      level: categoryTree?.category?.level ?? null,
      leaf_category: categoryTree?.category?.leaf_category ?? null
    },
    category_attributes_excerpt: summarizeAttributes(categoryAttributes),
    schema_result_excerpt: {
      request_meta: schemaResult?.request_meta ?? null,
      response_meta: {
        schema_field_count: schemaResult?.response_meta?.schema_field_count ?? null,
        required_field_count:
          schemaResult?.response_meta?.required_field_count ?? null,
        required_field_ids_preview:
          schemaResult?.response_meta?.required_field_ids_preview ?? []
      }
    },
    schema_render_excerpt: {
      request_meta: schemaRenderResult?.request_meta ?? null,
      response_meta: {
        schema_field_count:
          schemaRenderResult?.response_meta?.schema_field_count ?? null,
        required_field_count:
          schemaRenderResult?.response_meta?.required_field_count ?? null,
        required_field_ids_preview:
          schemaRenderResult?.response_meta?.required_field_ids_preview ?? []
      }
    },
    media_observability_excerpt: {
      media_list: {
        request_meta: mediaListResult?.request_meta ?? null,
        response_meta: {
          returned_item_count:
            mediaListResult?.response_meta?.returned_item_count ?? null,
          item_field_keys:
            mediaListResult?.response_meta?.item_field_keys ?? []
        },
        sample_items: Array.isArray(mediaListResult?.items)
          ? mediaListResult.items.slice(0, 2).map((item) => ({
              id: item?.id ?? null,
              file_name: item?.file_name ?? null,
              reference_count: item?.reference_count ?? null,
              gmt_modified: item?.gmt_modified ?? null,
              url: item?.url ?? null
            }))
          : []
      },
      media_groups: {
        request_meta: mediaGroupsResult?.request_meta ?? null,
        response_meta: {
          returned_group_count:
            mediaGroupsResult?.response_meta?.returned_group_count ?? null,
          group_field_keys:
            mediaGroupsResult?.response_meta?.group_field_keys ?? []
        },
        sample_groups: Array.isArray(mediaGroupsResult?.groups)
          ? mediaGroupsResult.groups.slice(0, 3)
          : []
      }
    },
    draft_observability_excerpt: {
      request_meta: schemaRenderDraftResult?.request_meta ?? null,
      response_meta: {
        biz_success:
          schemaRenderDraftResult?.response_meta?.biz_success ?? null,
        msg_code: schemaRenderDraftResult?.response_meta?.msg_code ?? null,
        message: schemaRenderDraftResult?.response_meta?.message ?? null,
        schema_field_count:
          schemaRenderDraftResult?.response_meta?.schema_field_count ?? null,
        required_field_count:
          schemaRenderDraftResult?.response_meta?.required_field_count ?? null
      }
    },
    draft_output: {
      ...draft,
      fields_auto_generated: Object.keys(draft.auto_generated_fields ?? {}),
      fields_require_human_input: draft.human_required_fields ?? [],
      fields_blocked_by_write_boundary: draft.blocked_automation_fields ?? null,
      cannot_automate_yet: [
        "photobank real upload",
        "product.add.draft real create",
        "product.add real publish",
        "product.update real modify"
      ]
    }
  };

  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(sample, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ ok: true, output_path: OUTPUT_PATH }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
