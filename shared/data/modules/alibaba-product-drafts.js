import { buildWikaHumanHandoffArtifact } from "./alibaba-write-guardrails.js";

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

export function buildWikaProductDraft(input = {}) {
  const categoryId = Number.parseInt(String(input.category_id ?? ""), 10);
  const categoryName = normalizeString(input.category_name);
  const assetPaths = uniqueList(input.asset_paths);
  const attributeInputs = Array.isArray(input.attributes) ? input.attributes : [];
  const requiredAttributeIds = Array.isArray(input.required_attribute_ids)
    ? input.required_attribute_ids.map((value) => Number(value)).filter(Number.isFinite)
    : [];
  const populatedAttributeIds = attributeInputs
    .map((item) => Number(item?.attr_id))
    .filter(Number.isFinite);
  const missingRequiredAttributeIds = requiredAttributeIds.filter(
    (attrId) => !populatedAttributeIds.includes(attrId)
  );

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
  const description_html = buildDescription({
    title,
    highlights,
    application: input.application,
    customization: input.customization,
    packagingNotes: input.packaging_notes
  });

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
    triggerCodes.push("live_product_publish");

    handoff = buildWikaHumanHandoffArtifact({
      action: "build_product_draft",
      blockerCategory,
      triggerCodes,
      inputSummary: {
        category_id: Number.isFinite(categoryId) ? categoryId : null,
        asset_paths_count: assetPaths.length,
        missing_required_attribute_ids: missingRequiredAttributeIds
      },
      evidence: {
        missing_requirements: missingRequirements,
        required_attribute_ids: requiredAttributeIds,
        populated_attribute_ids: populatedAttributeIds
      },
      nextAction: "先补齐类目必填属性与素材，再进入人工确认是否继续写侧验证。"
    });
  }

  return {
    ok: missingRequirements.length === 0,
    account: "wika",
    stage: "product_draft_only",
    write_mode: "draft_only",
    ready_for_publish: false,
    title,
    highlights,
    description_html,
    keywords,
    payload_draft: {
      target_api_family: [
        "alibaba.icbu.product.add",
        "alibaba.icbu.product.schema.add"
      ],
      category_context: {
        category_id: Number.isFinite(categoryId) ? categoryId : null,
        category_name: categoryName || null
      },
      text_fields: {
        title,
        keywords,
        description_html
      },
      attribute_plan: attributeInputs,
      media_plan: assetPaths,
      missing_required_attribute_ids: missingRequiredAttributeIds
    },
    missing_requirements: missingRequirements,
    warnings,
    handoff
  };
}
