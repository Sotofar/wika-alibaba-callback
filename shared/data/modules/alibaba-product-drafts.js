import { buildWikaHumanHandoffArtifact } from "./alibaba-write-guardrails.js";
import { summarizeAlibabaSchemaXml } from "./alibaba-official-product-schema.js";

const NON_FILLABLE_SCHEMA_FIELD_IDS = new Set(["infos", "sys_infos"]);

function normalizeString(value) {
  return String(value ?? "").trim();
}

function uniqueList(values = []) {
  const normalized = values
    .map((value) => normalizeString(value))
    .filter(Boolean);

  return [...new Set(normalized)];
}

function buildTitle({
  baseName,
  material,
  positioning,
  keywordHints = []
}) {
  const parts = uniqueList([baseName, material, positioning, ...keywordHints]).slice(0, 6);
  return parts.join(" ").slice(0, 128);
}

function buildHighlights({
  sellingPoints = [],
  categoryName = "",
  moq = "",
  leadTime = ""
}) {
  const base = uniqueList(sellingPoints).slice(0, 5);
  const context = [];

  if (categoryName) {
    context.push(`${categoryName} category aligned`);
  }

  if (moq) {
    context.push(`MOQ reference: ${moq}`);
  }

  if (leadTime) {
    context.push(`Lead time reference: ${leadTime}`);
  }

  return uniqueList([...base, ...context]).slice(0, 6);
}

function buildDescription({
  title,
  highlights = [],
  application = "",
  customization = "",
  packagingNotes = ""
}) {
  const blocks = [];

  if (title) {
    blocks.push(`<p><strong>${title}</strong></p>`);
  }

  if (highlights.length > 0) {
    const listItems = highlights.map((item) => `<li>${item}</li>`).join("");
    blocks.push(`<ul>${listItems}</ul>`);
  }

  if (application) {
    blocks.push(`<p>Application: ${application}</p>`);
  }

  if (customization) {
    blocks.push(`<p>Customization: ${customization}</p>`);
  }

  if (packagingNotes) {
    blocks.push(`<p>Packaging notes: ${packagingNotes}</p>`);
  }

  return blocks.join("");
}

function buildGroupPlan(input = {}) {
  const groupIds = [
    Number(input.first_group_id),
    Number(input.second_group_id),
    Number(input.third_group_id)
  ].filter(Number.isFinite);

  if (groupIds.length === 0) {
    return null;
  }

  return {
    first_group_id: groupIds[0] ?? null,
    second_group_id: groupIds[1] ?? null,
    third_group_id: groupIds[2] ?? null
  };
}

function buildSchemaAwareFieldMappings({
  title,
  keywords,
  descriptionHtml,
  attributeInputs,
  assetPaths,
  moq,
  groupPlan,
  schemaFieldIds = []
}) {
  const knownSchemaFields = new Set(schemaFieldIds);
  const includeWhenUnknown = knownSchemaFields.size === 0;

  const mappings = [
    {
      schema_field_id: "productTitle",
      source_key: "title",
      ready: Boolean(title),
      available_in_schema:
        includeWhenUnknown || knownSchemaFields.has("productTitle"),
      value_preview: title || null
    },
    {
      schema_field_id: "productKeywords",
      source_key: "keywords",
      ready: Array.isArray(keywords) && keywords.length > 0,
      available_in_schema:
        includeWhenUnknown || knownSchemaFields.has("productKeywords"),
      value_preview: Array.isArray(keywords) ? keywords.slice(0, 3) : []
    },
    {
      schema_field_id: "productDescType",
      source_key: "description_mode",
      ready: Boolean(descriptionHtml),
      available_in_schema:
        includeWhenUnknown || knownSchemaFields.has("productDescType"),
      value_preview: descriptionHtml ? 2 : null
    },
    {
      schema_field_id: "superText",
      source_key: "description_html",
      ready: Boolean(descriptionHtml),
      available_in_schema:
        includeWhenUnknown || knownSchemaFields.has("superText"),
      value_preview: descriptionHtml ? descriptionHtml.slice(0, 120) : null
    },
    {
      schema_field_id: "icbuCatProp",
      source_key: "attribute_plan",
      ready: Array.isArray(attributeInputs) && attributeInputs.length > 0,
      available_in_schema:
        includeWhenUnknown || knownSchemaFields.has("icbuCatProp"),
      value_preview: Array.isArray(attributeInputs)
        ? attributeInputs.slice(0, 5)
        : []
    },
    {
      schema_field_id: "scImages",
      source_key: "media_plan",
      ready: Array.isArray(assetPaths) && assetPaths.length > 0,
      available_in_schema:
        includeWhenUnknown || knownSchemaFields.has("scImages"),
      value_preview: Array.isArray(assetPaths) ? assetPaths.slice(0, 5) : []
    },
    {
      schema_field_id: "minOrderQuantity",
      source_key: "moq",
      ready: Boolean(normalizeString(moq)),
      available_in_schema:
        includeWhenUnknown || knownSchemaFields.has("minOrderQuantity"),
      value_preview: normalizeString(moq) || null
    },
    {
      schema_field_id: "productGroup",
      source_key: "group_plan",
      ready: Boolean(groupPlan),
      available_in_schema:
        includeWhenUnknown || knownSchemaFields.has("productGroup"),
      value_preview: groupPlan
    }
  ];

  return mappings.filter((entry) => entry.available_in_schema);
}

export function buildWikaProductDraft(input = {}) {
  const categoryId = Number.parseInt(String(input.category_id ?? ""), 10);
  const categoryName = normalizeString(input.category_name);
  const assetPaths = uniqueList(input.asset_paths);
  const attributeInputs = Array.isArray(input.attributes) ? input.attributes : [];
  const attributeDefinitions = Array.isArray(input.attribute_definitions)
    ? input.attribute_definitions
    : [];
  const requiredAttributeIdsFromDefinitions = attributeDefinitions
    .filter((item) => item?.required === true || String(item?.required) === "true")
    .map((item) => Number(item?.attr_id))
    .filter(Number.isFinite);
  const requiredAttributeIds = Array.isArray(input.required_attribute_ids)
    ? input.required_attribute_ids.map((value) => Number(value)).filter(Number.isFinite)
    : requiredAttributeIdsFromDefinitions;
  const populatedAttributeIds = attributeInputs
    .map((item) => Number(item?.attr_id))
    .filter(Number.isFinite);
  const missingRequiredAttributeIds = requiredAttributeIds.filter(
    (attrId) => !populatedAttributeIds.includes(attrId)
  );
  const schemaXml = String(input.schema_xml ?? "");
  const renderXml = String(input.render_xml ?? "");
  const schemaSummary = summarizeAlibabaSchemaXml(schemaXml);
  const renderSummary = summarizeAlibabaSchemaXml(renderXml);
  const effectiveSchemaFieldIds =
    schemaSummary.field_ids.length > 0 ? schemaSummary.field_ids : renderSummary.field_ids;
  const effectiveRequiredFieldIds = [
    ...new Set([
      ...schemaSummary.required_field_ids,
      ...renderSummary.required_field_ids
    ])
  ].filter((fieldId) => !NON_FILLABLE_SCHEMA_FIELD_IDS.has(fieldId));
  const groupPlan = buildGroupPlan(input);

  const title = buildTitle({
    baseName: input.base_name,
    material: input.material,
    positioning: input.positioning,
    keywordHints: input.keyword_hints
  });
  const highlights = buildHighlights({
    sellingPoints: input.selling_points,
    categoryName,
    moq: input.moq,
    leadTime: input.lead_time
  });
  const keywords = uniqueList([
    ...(input.keyword_hints ?? []),
    ...(input.keywords ?? []),
    input.base_name,
    input.material,
    categoryName
  ]).slice(0, 12);
  const descriptionHtml = buildDescription({
    title,
    highlights,
    application: input.application,
    customization: input.customization,
    packagingNotes: input.packaging_notes
  });
  const schemaMappings = buildSchemaAwareFieldMappings({
    title,
    keywords,
    descriptionHtml,
    attributeInputs,
    assetPaths,
    moq: input.moq,
    groupPlan,
    schemaFieldIds: effectiveSchemaFieldIds
  });
  const satisfiedSchemaFieldIds = schemaMappings
    .filter((entry) => entry.ready)
    .map((entry) => entry.schema_field_id);
  const humanRequiredFields = effectiveRequiredFieldIds.filter(
    (fieldId) => !satisfiedSchemaFieldIds.includes(fieldId)
  );

  const missingRequirements = [];
  if (!Number.isFinite(categoryId)) {
    missingRequirements.push("category_id");
  }
  if (!title) {
    missingRequirements.push("title");
  }
  if (assetPaths.length === 0) {
    missingRequirements.push("asset_paths");
  }
  if (missingRequiredAttributeIds.length > 0) {
    missingRequirements.push("required_attributes");
  }
  if (humanRequiredFields.length > 0) {
    missingRequirements.push("schema_required_fields");
  }

  const warnings = [
    "该产物仅为产品草稿，不会触发真实发布。",
    "payload_draft 是结构化候选草稿，不代表官方最终可提交 payload。"
  ];

  let handoff = null;
  if (missingRequirements.length > 0) {
    const blockerCategory = assetPaths.length === 0
      ? "media_unavailable"
      : missingRequiredAttributeIds.length > 0
        ? "category_attribute_incomplete"
        : "manual_confirmation_required";

    const triggerCodes = [];
    if (assetPaths.length === 0) {
      triggerCodes.push("media_not_ready");
    }
    if (missingRequiredAttributeIds.length > 0 || !Number.isFinite(categoryId)) {
      triggerCodes.push("missing_category_or_attributes");
    }
    if (humanRequiredFields.length > 0) {
      triggerCodes.push("missing_required_product_information");
    }
    triggerCodes.push("live_product_publish");

    handoff = buildWikaHumanHandoffArtifact({
      action: "build_product_draft",
      blockerCategory,
      triggerCodes,
      inputSummary: {
        category_id: Number.isFinite(categoryId) ? categoryId : null,
        asset_paths_count: assetPaths.length,
        missing_required_attribute_ids: missingRequiredAttributeIds,
        missing_schema_field_count: humanRequiredFields.length
      },
      evidence: {
        missing_requirements: missingRequirements,
        required_attribute_ids: requiredAttributeIds,
        populated_attribute_ids: populatedAttributeIds,
        human_required_fields: humanRequiredFields
      },
      nextAction: "先补齐类目必填属性、schema 必填字段与素材，再进入人工确认是否继续写侧验证。"
    });
  }

  return {
    ok: missingRequirements.length === 0,
    account: "wika",
    stage: "product_draft_only",
    write_mode: "draft_only",
    ready_for_publish: false,
    schema_mode: effectiveSchemaFieldIds.length > 0 ? "schema_aware" : "basic_draft",
    title,
    highlights,
    description_html: descriptionHtml,
    keywords,
    schema_context: {
      category_id: Number.isFinite(categoryId) ? categoryId : null,
      schema_field_count: schemaSummary.field_count,
      render_field_count: renderSummary.field_count,
      required_field_ids: effectiveRequiredFieldIds,
      schema_field_ids_preview: effectiveSchemaFieldIds.slice(0, 30)
    },
    schema_aware_field_mapping: schemaMappings,
    human_required_fields: humanRequiredFields,
    payload_draft: {
      target_api_family: [
        "alibaba.icbu.product.add.draft",
        "alibaba.icbu.product.add",
        "alibaba.icbu.product.schema.add"
      ],
      category_context: {
        category_id: Number.isFinite(categoryId) ? categoryId : null,
        category_name: categoryName || null
      },
      schema_context: {
        schema_field_count: schemaSummary.field_count,
        render_field_count: renderSummary.field_count
      },
      text_fields: {
        title,
        keywords,
        description_html: descriptionHtml
      },
      schema_field_mapping: schemaMappings,
      attribute_plan: attributeInputs,
      media_plan: assetPaths,
      group_plan: groupPlan,
      missing_required_attribute_ids: missingRequiredAttributeIds
    },
    missing_requirements: missingRequirements,
    warnings,
    handoff
  };
}
