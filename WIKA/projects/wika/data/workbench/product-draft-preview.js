import { buildWikaProductDraft } from "../../../../../shared/data/modules/alibaba-product-drafts.js";
import { loadProductDraftWorkbenchContext } from "./product-draft-workbench.js";

function normalizeString(value) {
  return String(value ?? "").trim();
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => normalizeString(item)).filter(Boolean))];
  }

  if (typeof value === "string") {
    return [...new Set(value.split(/[;,]/).map((item) => normalizeString(item)).filter(Boolean))];
  }

  return [];
}

function normalizeAttributeInputs(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      ...item,
      attr_id: item.attr_id ?? item.attrId ?? null
    }))
    .filter((item) => item.attr_id !== null);
}

function unique(values = []) {
  return [...new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))];
}

function buildPreviewInputSummary(input, previewDraft, context) {
  const providedFields = [
    normalizeString(input.base_name) && "base_name",
    normalizeString(input.material) && "material",
    normalizeString(input.positioning) && "positioning",
    normalizeList(input.selling_points).length > 0 && "selling_points",
    normalizeList(input.keyword_hints).length > 0 && "keyword_hints",
    normalizeString(input.application) && "application",
    normalizeString(input.customization) && "customization",
    normalizeString(input.packaging_notes) && "packaging_notes",
    normalizeString(input.moq) && "moq",
    normalizeString(input.lead_time) && "lead_time",
    normalizeList(input.asset_paths).length > 0 && "asset_paths",
    normalizeAttributeInputs(input.attributes).length > 0 && "attributes"
  ].filter(Boolean);

  return {
    product_id: normalizeString(input.product_id) || context.productId || null,
    category_id: context.categoryId ?? null,
    category_name:
      normalizeString(input.category_name) ||
      context.categoryName ||
      normalizeString(context.categoryTreeRead?.value?.category?.name) ||
      null,
    provided_field_count: providedFields.length,
    provided_fields: providedFields,
    asset_path_count:
      normalizeList(input.asset_paths).length > 0
        ? normalizeList(input.asset_paths).length
        : context.assetCandidates.length,
    attribute_count:
      normalizeAttributeInputs(input.attributes).length > 0
        ? normalizeAttributeInputs(input.attributes).length
        : 0,
    schema_mode: previewDraft.schema_mode
  };
}

export async function buildProductDraftPreview(
  clientConfig,
  input = {},
  preloaded = {}
) {
  const context =
    preloaded.context ??
    (await loadProductDraftWorkbenchContext(clientConfig, input, preloaded));

  const previewInput = {
    category_id: context.categoryId,
    category_name:
      normalizeString(input.category_name) ||
      context.categoryName ||
      normalizeString(context.categoryTreeRead?.value?.category?.name) ||
      null,
    base_name:
      normalizeString(input.base_name) ||
      normalizeString(context.detailProduct?.subject) ||
      normalizeString(context.listItem?.subject) ||
      null,
    material: normalizeString(input.material) || null,
    positioning: normalizeString(input.positioning) || null,
    selling_points: normalizeList(input.selling_points),
    keyword_hints:
      normalizeList(input.keyword_hints).length > 0
        ? normalizeList(input.keyword_hints)
        : Array.isArray(context.detailProduct?.keywords)
          ? context.detailProduct.keywords.slice(0, 8)
          : [],
    application: normalizeString(input.application) || null,
    customization: normalizeString(input.customization) || null,
    packaging_notes: normalizeString(input.packaging_notes) || null,
    moq: normalizeString(input.moq) || null,
    lead_time: normalizeString(input.lead_time) || null,
    asset_paths:
      normalizeList(input.asset_paths).length > 0
        ? normalizeList(input.asset_paths)
        : context.assetCandidates,
    attributes: normalizeAttributeInputs(input.attributes),
    attribute_definitions: context.attributeDefinitions,
    schema_xml: context.schemaRead?.value?.data ?? "",
    render_xml: context.renderRead?.value?.data ?? "",
    first_group_id: normalizeString(context.listItem?.group_id) || null
  };

  const previewDraft =
    preloaded.previewDraft ?? buildWikaProductDraft(previewInput);
  const missingRequirements = Array.isArray(previewDraft.missing_requirements)
    ? previewDraft.missing_requirements
    : [];

  return {
    report_name: "product_draft_preview",
    generated_at: new Date().toISOString(),
    preview_input_summary: buildPreviewInputSummary(input, previewDraft, context),
    product_context: {
      product_id: context.productId || null,
      subject:
        normalizeString(context.detailProduct?.subject) ||
        normalizeString(context.listItem?.subject) ||
        null,
      category_id: context.categoryId ?? null,
      group_id: normalizeString(context.listItem?.group_id) || null,
      score: context.scoreRead?.value?.result?.final_score ?? null
    },
    context_snapshot: {
      schema_context: previewDraft.schema_context,
      media_candidate_count: context.assetCandidates.length,
      draft_render_observable: context.draftRenderRead?.ok === true
    },
    draft_preview: {
      stage: previewDraft.stage,
      schema_mode: previewDraft.schema_mode,
      title: previewDraft.title,
      highlights: previewDraft.highlights,
      description_html: previewDraft.description_html,
      keywords: previewDraft.keywords,
      schema_aware_field_mapping: previewDraft.schema_aware_field_mapping,
      payload_draft: previewDraft.payload_draft,
      warnings: previewDraft.warnings ?? [],
      draft_usable_for_manual_review: missingRequirements.length === 0
    },
    required_manual_fields: {
      missing_requirements: missingRequirements,
      human_required_fields: previewDraft.human_required_fields ?? [],
      missing_required_attribute_ids:
        previewDraft.payload_draft?.missing_required_attribute_ids ?? []
    },
    blocking_risks: unique([
      ...context.blockingRisks,
      ...missingRequirements.map((item) => `preview_${item}`)
    ]),
    recommended_next_action:
      missingRequirements.length > 0
        ? "Continue safe draft preparation only. Fill the remaining schema/media/manual fields before any manual draft handoff, and do not enter platform publish."
        : "The input-aware preview is complete enough for external manual review and safe draft preparation only. Do not treat it as platform publish readiness.",
    boundary_statement: {
      input_aware_preview_only: true,
      safe_draft_preparation_only: true,
      not_platform_publish: true,
      not_write_side_closed_loop: true,
      no_write_action_attempted: true
    }
  };
}
