import {
  WIKA_EXTERNAL_DRAFT_REVIEW_VERSION,
  WIKA_EXTERNAL_WORKFLOW_TEMPLATE_CHANGELOG,
  getWikaWorkflowProfileDefinition
} from "./alibaba-external-workflow-governance.js";
import {
  WIKA_WORKFLOW_BLOCKER_TAXONOMY_VERSION,
  getWikaWorkflowBlockerDefinition
} from "./alibaba-external-workflow-taxonomy.js";

const REVIEW_DIMENSIONS = [
  "structure_completeness",
  "blocker_consistency",
  "minimum_package_readiness",
  "handoff_clarity",
  "manual_completion_readiness",
  "externally_usable_boundary",
  "source_traceability"
];

const PRIORITY_ORDER = {
  high: 0,
  medium: 1,
  low: 2
};

function isNonEmptyArray(value) {
  return Array.isArray(value) && value.length > 0;
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function ensureObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function buildCheck(code, passed, summary, details = {}) {
  return {
    code,
    passed,
    summary,
    details
  };
}

function getRequiredTopLevelFields(workflowKind) {
  if (workflowKind === "reply") {
    return [
      "workflow_profile",
      "template_version",
      "input_summary",
      "available_context",
      "missing_context",
      "hard_blockers",
      "soft_blockers",
      "assumptions",
      "follow_up_questions",
      "handoff_fields",
      "handoff_checklist",
      "manual_completion_sop",
      "minimum_reply_package",
      "alert_payload",
      "workflow_meta"
    ];
  }

  return [
    "workflow_profile",
    "template_version",
    "input_summary",
    "available_context",
    "missing_context",
    "hard_blockers",
    "soft_blockers",
    "assumptions",
    "required_manual_fields",
    "required_manual_field_details",
    "follow_up_questions",
    "handoff_fields",
    "handoff_checklist",
    "manual_completion_sop",
    "alert_payload",
    "workflow_meta",
    "order_draft_package"
  ];
}

function evaluateStructureCompleteness(workflowKind, payload) {
  const missingFields = getRequiredTopLevelFields(workflowKind).filter(
    (field) => !(field in payload)
  );

  return buildCheck(
    "structure_completeness",
    missingFields.length === 0,
    missingFields.length === 0
      ? "核心输出结构完整。"
      : `缺少核心字段：${missingFields.join(", ")}`,
    { missing_fields: missingFields }
  );
}

function evaluateBlockerConsistency(payload) {
  const blockers = [
    ...toArray(payload.hard_blockers),
    ...toArray(payload.soft_blockers)
  ];

  const inconsistent = blockers.filter((blocker) => {
    const taxonomy = getWikaWorkflowBlockerDefinition(blocker.blocker_code);
    return (
      !hasText(blocker.blocker_code) ||
      !hasText(blocker.blocker_reason) ||
      !hasText(blocker.blocker_next_action) ||
      blocker.blocker_level !== taxonomy.level
    );
  });

  return buildCheck(
    "blocker_consistency",
    inconsistent.length === 0,
    inconsistent.length === 0
      ? "blocker taxonomy 与输出字段保持一致。"
      : `发现 ${inconsistent.length} 个 blocker 缺少一致的 code / level / next_action。`,
    {
      inconsistent_blockers: inconsistent.map((item) => ({
        blocker_code: item.blocker_code ?? null,
        blocker_level: item.blocker_level ?? null
      })),
      taxonomy_version: WIKA_WORKFLOW_BLOCKER_TAXONOMY_VERSION
    }
  );
}

function evaluateMinimumPackageReadiness(workflowKind, payload) {
  if (workflowKind === "reply") {
    const packageInfo = ensureObject(payload.minimum_reply_package);
    const passed =
      typeof packageInfo.ready_for_human_edit === "boolean" &&
      typeof packageInfo.must_handoff_before_any_send === "boolean";

    return buildCheck(
      "minimum_package_readiness",
      passed,
      passed
        ? "已提供最小可回复包判断。"
        : "缺少 minimum_reply_package 或其核心布尔判断。",
      {
        ready_for_human_edit: packageInfo.ready_for_human_edit ?? null,
        must_handoff_before_any_send:
          packageInfo.must_handoff_before_any_send ?? null
      }
    );
  }

  const requiredManualFields = toArray(payload.required_manual_fields);
  const details = toArray(payload.required_manual_field_details);
  const passed = Array.isArray(payload.required_manual_fields) && details.length >= requiredManualFields.length;

  return buildCheck(
    "minimum_package_readiness",
    passed,
    passed
      ? "已提供最小可补单包判断。"
      : "required_manual_fields 与 required_manual_field_details 不完整。",
    {
      required_manual_fields_count: requiredManualFields.length,
      required_manual_field_details_count: details.length
    }
  );
}

function evaluateHandoffClarity(payload) {
  const checklist = toArray(payload.handoff_checklist);
  const fields = toArray(payload.handoff_fields);
  const passed =
    checklist.length > 0 &&
    fields.length > 0 &&
    checklist.every((item) => hasText(item.code) && hasText(item.label));

  return buildCheck(
    "handoff_clarity",
    passed,
    passed
      ? "handoff checklist 与 handoff fields 已可直接交接。"
      : "handoff checklist 或 handoff fields 仍不足以支撑人工直接接手。",
    {
      checklist_count: checklist.length,
      handoff_field_count: fields.length
    }
  );
}

function evaluateManualCompletionReadiness(payload) {
  const sop = ensureObject(payload.manual_completion_sop);
  const sections = toArray(sop.sections);
  const passed =
    sections.length > 0 &&
    sections.every(
      (section) =>
        hasText(section.section_code) &&
        hasText(section.title) &&
        hasText(section.owner)
    );

  return buildCheck(
    "manual_completion_readiness",
    passed,
    passed
      ? "manual completion SOP 已具备可执行 section。"
      : "manual completion SOP 缺少可执行 section 定义。",
    { section_count: sections.length }
  );
}

function evaluateExternallyUsableBoundary(payload) {
  const warnings = toArray(payload.warnings);
  const sop = ensureObject(payload.manual_completion_sop);
  const externalBoundary = ensureObject(sop.external_boundary);
  const passed =
    hasText(externalBoundary.reason) ||
    warnings.some(
      (warning) =>
        typeof warning === "string" &&
        warning.toLowerCase().includes("external")
    );

  return buildCheck(
    "externally_usable_boundary",
    passed,
    passed
      ? "外部可用边界声明清晰。"
      : "缺少“仅外部草稿”边界声明。",
    {
      platform_reply_available:
        externalBoundary.platform_reply_available ?? null,
      platform_order_available:
        externalBoundary.platform_order_available ?? null,
      boundary_reason: externalBoundary.reason ?? null
    }
  );
}

function evaluateSourceTraceability(payload) {
  const handoffFields = toArray(payload.handoff_fields);
  const invalid = handoffFields.filter(
    (field) =>
      !hasText(field.field) ||
      !hasText(field.source) ||
      !hasText(field.confidence) ||
      !hasText(field.missing_reason)
  );

  return buildCheck(
    "source_traceability",
    invalid.length === 0 && handoffFields.length > 0,
    invalid.length === 0 && handoffFields.length > 0
      ? "handoff fields 已具备字段级来源、置信度和缺失原因。"
      : "handoff fields 缺少字段级来源、置信度或缺失原因。",
    {
      handoff_field_count: handoffFields.length,
      invalid_field_count: invalid.length
    }
  );
}

function buildReadinessLevel(payload, checks) {
  const structurePassed = checks.find(
    (item) => item.code === "structure_completeness"
  )?.passed;
  const boundaryPassed = checks.find(
    (item) => item.code === "externally_usable_boundary"
  )?.passed;
  const draftUsableExternally = Boolean(payload.draft_usable_externally);
  const handoffMandatory =
    Boolean(payload?.workflow_meta?.handoff_required) ||
    toArray(payload.hard_blockers).some((item) => item.handoff_mandatory);
  const hardCount = toArray(payload.hard_blockers).length;
  const softCount = toArray(payload.soft_blockers).length;

  if (!structurePassed || !boundaryPassed || !draftUsableExternally) {
    return "not_ready";
  }

  if (handoffMandatory || hardCount > 0) {
    return "handoff_required";
  }

  if (softCount > 0) {
    return "externally_usable_with_review";
  }

  return "externally_usable";
}

function buildRecommendedNextAction(payload, readinessLevel) {
  if (readinessLevel === "not_ready") {
    return "先补齐 hard blocker、边界声明或最小可用包，再交给人工处理。";
  }

  if (readinessLevel === "handoff_required") {
    return "先按 handoff checklist 补齐关键字段，再由人工审核后使用外部草稿。";
  }

  if (readinessLevel === "externally_usable_with_review") {
    return "草稿可外部使用，但仍建议人工复核 soft blocker、假设项和 follow-up questions。";
  }

  return "草稿已达到外部可用边界，可直接作为人工处理底稿继续推进。";
}

function buildReviewFindings(checks) {
  return checks.map((check) => ({
    code: check.code,
    status: check.passed ? "pass" : "fail",
    summary: check.summary,
    details: check.details
  }));
}

function sortQuestions(questionDetails = []) {
  return [...questionDetails].sort((left, right) => {
    const leftRank = PRIORITY_ORDER[left.priority] ?? 99;
    const rightRank = PRIORITY_ORDER[right.priority] ?? 99;
    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    return (left.sequence ?? 0) - (right.sequence ?? 0);
  });
}

function buildBlockerActionList(blockers = []) {
  return blockers.map((blocker) => ({
    blocker_code: blocker.blocker_code,
    blocker_level: blocker.blocker_level,
    blocker_reason: blocker.blocker_reason,
    blocker_next_action: blocker.blocker_next_action,
    draft_can_still_be_produced:
      blocker.draft_can_still_be_produced ?? true,
    handoff_mandatory: blocker.handoff_mandatory ?? false
  }));
}

function buildSectionMapping(requiredManualFieldDetails = []) {
  const grouped = new Map();

  for (const detail of requiredManualFieldDetails) {
    const section = detail.template_section || "manual_review";
    if (!grouped.has(section)) {
      grouped.set(section, []);
    }

    grouped.get(section).push({
      field: detail.field,
      who_should_fill: detail.who_should_fill,
      collection_hint: detail.collection_hint
    });
  }

  return [...grouped.entries()].map(([section, fields]) => ({
    section,
    fields
  }));
}

export function buildWikaExternalDraftReview(workflowKind, payload) {
  const safePayload = ensureObject(payload);
  const checks = [
    evaluateStructureCompleteness(workflowKind, safePayload),
    evaluateBlockerConsistency(safePayload),
    evaluateMinimumPackageReadiness(workflowKind, safePayload),
    evaluateHandoffClarity(safePayload),
    evaluateManualCompletionReadiness(safePayload),
    evaluateExternallyUsableBoundary(safePayload),
    evaluateSourceTraceability(safePayload)
  ];

  const readinessLevel = buildReadinessLevel(safePayload, checks);
  const passedChecks = checks.filter((item) => item.passed).map((item) => item.code);
  const failedChecks = checks.filter((item) => !item.passed).map((item) => item.code);

  return {
    review_profile: `${workflowKind}_external_draft_review`,
    review_version: WIKA_EXTERNAL_DRAFT_REVIEW_VERSION,
    workflow_profile: safePayload.workflow_profile ?? null,
    workflow_profile_definition: getWikaWorkflowProfileDefinition(
      workflowKind,
      safePayload.workflow_profile
    ),
    template_version: safePayload.template_version ?? null,
    template_changelog_entry:
      WIKA_EXTERNAL_WORKFLOW_TEMPLATE_CHANGELOG.find(
        (entry) => entry.version === safePayload.template_version
      ) || null,
    blocker_taxonomy_version: WIKA_WORKFLOW_BLOCKER_TAXONOMY_VERSION,
    readiness_level: readinessLevel,
    passed_checks: passedChecks,
    failed_checks: failedChecks,
    review_findings: buildReviewFindings(checks),
    recommended_next_action: buildRecommendedNextAction(
      safePayload,
      readinessLevel
    ),
    handoff_mandatory:
      Boolean(safePayload?.workflow_meta?.handoff_required) ||
      toArray(safePayload.hard_blockers).some((item) => item.handoff_mandatory),
    draft_usable_externally: Boolean(safePayload.draft_usable_externally),
    hard_blockers_count: toArray(safePayload.hard_blockers).length,
    soft_blockers_count: toArray(safePayload.soft_blockers).length
  };
}

export function buildWikaReplyHandoffPack(payload, review) {
  const safePayload = ensureObject(payload);
  const safeReview = ensureObject(review);
  const questionDetails = sortQuestions(
    toArray(safePayload.follow_up_question_details)
  );

  return {
    export_type: "reply_handoff_pack",
    export_format: "json",
    workflow_profile: safePayload.workflow_profile ?? null,
    template_version: safePayload.template_version ?? null,
    review_profile: safeReview.review_profile ?? null,
    review_version: safeReview.review_version ?? null,
    readiness_level: safeReview.readiness_level ?? null,
    input_summary: safePayload.input_summary ?? {},
    minimum_reply_package: safePayload.minimum_reply_package ?? {},
    prioritized_follow_up_questions: questionDetails,
    hard_blockers: buildBlockerActionList(safePayload.hard_blockers),
    soft_blockers: buildBlockerActionList(safePayload.soft_blockers),
    handoff_checklist: toArray(safePayload.handoff_checklist),
    handoff_fields: toArray(safePayload.handoff_fields),
    manual_completion_sop: safePayload.manual_completion_sop ?? {},
    draft_text: ensureObject(safePayload.reply_draft),
    draft_guidance: {
      assumptions: toArray(safePayload.assumptions),
      escalation_recommendation: safePayload.escalation_recommendation ?? {},
      alert_payload: safePayload.alert_payload ?? {}
    },
    externally_usable_boundary_statement:
      safePayload?.manual_completion_sop?.external_boundary?.reason ||
      "当前仅能作为外部回复草稿使用，不代表平台内已回复。",
    draft_usable_externally: Boolean(safePayload.draft_usable_externally),
    handoff_required:
      Boolean(safePayload?.workflow_meta?.handoff_required) ||
      Boolean(safeReview.handoff_mandatory)
  };
}

export function buildWikaOrderHandoffPack(payload, review) {
  const safePayload = ensureObject(payload);
  const safeReview = ensureObject(review);
  const requiredManualFieldDetails = toArray(
    safePayload.required_manual_field_details
  );

  return {
    export_type: "order_handoff_pack",
    export_format: "json",
    workflow_profile: safePayload.workflow_profile ?? null,
    template_version: safePayload.template_version ?? null,
    review_profile: safeReview.review_profile ?? null,
    review_version: safeReview.review_version ?? null,
    readiness_level: safeReview.readiness_level ?? null,
    input_summary: safePayload.input_summary ?? {},
    required_manual_fields: toArray(safePayload.required_manual_fields),
    required_manual_field_details: requiredManualFieldDetails,
    section_mapping: buildSectionMapping(requiredManualFieldDetails),
    commercial_risk_summary: {
      escalation_recommendation: safePayload.escalation_recommendation ?? {},
      hard_blockers: buildBlockerActionList(safePayload.hard_blockers),
      soft_blockers: buildBlockerActionList(safePayload.soft_blockers)
    },
    handoff_checklist: toArray(safePayload.handoff_checklist),
    handoff_fields: toArray(safePayload.handoff_fields),
    manual_completion_sop: safePayload.manual_completion_sop ?? {},
    follow_up_questions: sortQuestions(
      toArray(safePayload.follow_up_question_details)
    ),
    order_draft_package: safePayload.order_draft_package ?? {},
    externally_usable_boundary_statement:
      safePayload?.manual_completion_sop?.external_boundary?.reason ||
      "当前仅能作为外部订单草稿使用，不代表平台内已创单。",
    draft_usable_externally: Boolean(safePayload.draft_usable_externally),
    handoff_required:
      Boolean(safePayload?.workflow_meta?.handoff_required) ||
      Boolean(safeReview.handoff_mandatory)
  };
}

function renderChecklistMarkdown(checklist = []) {
  if (!isNonEmptyArray(checklist)) {
    return "- 无\n";
  }

  return checklist
    .map(
      (item) =>
        `- [${item.done ? "x" : " "}] ${item.label}（${item.code}）：${item.reason}`
    )
    .join("\n");
}

function renderBlockerMarkdown(blockers = []) {
  if (!isNonEmptyArray(blockers)) {
    return "- 无\n";
  }

  return blockers
    .map(
      (item) =>
        `- \`${item.blocker_code}\`：${item.blocker_reason}；下一步：${item.blocker_next_action}`
    )
    .join("\n");
}

function renderQuestionMarkdown(questions = []) {
  if (!isNonEmptyArray(questions)) {
    return "- 无\n";
  }

  return questions
    .map(
      (item) =>
        `- [${item.priority}] ${item.question}（${item.blocker_code} / ${item.required_field}）`
    )
    .join("\n");
}

function renderFieldMarkdown(fields = []) {
  if (!isNonEmptyArray(fields)) {
    return "- 无\n";
  }

  return fields
    .map(
      (item) =>
        `- \`${item.field}\`：${item.label}；补充人：${item.who_should_fill || "sales"}；提示：${item.collection_hint || item.blocker_next_action || "请人工补充"}`
    )
    .join("\n");
}

export function renderWikaReplyHandoffPackMarkdown(pack) {
  return `# WIKA 外部回复交接包

- workflow_profile: \`${pack.workflow_profile}\`
- template_version: \`${pack.template_version}\`
- review_version: \`${pack.review_version}\`
- readiness_level: \`${pack.readiness_level}\`
- handoff_required: \`${pack.handoff_required}\`
- draft_usable_externally: \`${pack.draft_usable_externally}\`

## Input Summary
\`\`\`json
${JSON.stringify(pack.input_summary, null, 2)}
\`\`\`

## Minimum Reply Package
\`\`\`json
${JSON.stringify(pack.minimum_reply_package, null, 2)}
\`\`\`

## Prioritized Follow-up Questions
${renderQuestionMarkdown(pack.prioritized_follow_up_questions)}

## Hard Blockers
${renderBlockerMarkdown(pack.hard_blockers)}

## Soft Blockers
${renderBlockerMarkdown(pack.soft_blockers)}

## Handoff Checklist
${renderChecklistMarkdown(pack.handoff_checklist)}

## Handoff Fields
${renderFieldMarkdown(pack.handoff_fields)}

## Boundary
${pack.externally_usable_boundary_statement}

## Draft Text / Guidance
\`\`\`json
${JSON.stringify(
    {
      draft_text: pack.draft_text,
      draft_guidance: pack.draft_guidance
    },
    null,
    2
  )}
\`\`\`
`;
}

export function renderWikaOrderHandoffPackMarkdown(pack) {
  return `# WIKA 外部订单交接包

- workflow_profile: \`${pack.workflow_profile}\`
- template_version: \`${pack.template_version}\`
- review_version: \`${pack.review_version}\`
- readiness_level: \`${pack.readiness_level}\`
- handoff_required: \`${pack.handoff_required}\`
- draft_usable_externally: \`${pack.draft_usable_externally}\`

## Input Summary
\`\`\`json
${JSON.stringify(pack.input_summary, null, 2)}
\`\`\`

## Required Manual Fields
${renderFieldMarkdown(pack.required_manual_field_details)}

## Section Mapping
\`\`\`json
${JSON.stringify(pack.section_mapping, null, 2)}
\`\`\`

## Follow-up Questions
${renderQuestionMarkdown(pack.follow_up_questions)}

## Commercial Risk Summary
\`\`\`json
${JSON.stringify(pack.commercial_risk_summary, null, 2)}
\`\`\`

## Handoff Checklist
${renderChecklistMarkdown(pack.handoff_checklist)}

## Handoff Fields
${renderFieldMarkdown(pack.handoff_fields)}

## Manual Completion SOP
\`\`\`json
${JSON.stringify(pack.manual_completion_sop, null, 2)}
\`\`\`

## Boundary
${pack.externally_usable_boundary_statement}
`;
}

export { REVIEW_DIMENSIONS };
