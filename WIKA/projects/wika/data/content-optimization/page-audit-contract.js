function toTrimmedString(value) {
  if (value === null || value === undefined) {
    return ""
  }

  return String(value).trim()
}

function normalizeDate(rawValue) {
  const text = toTrimmedString(rawValue)
  if (!text) {
    return null
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text
  }

  const parsed = new Date(text)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed.toISOString().slice(0, 10)
}

function parseCsvLine(line) {
  const cells = []
  let current = ""
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const next = line[index + 1]

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        current += "\""
        index += 1
        continue
      }

      inQuotes = !inQuotes
      continue
    }

    if (char === "," && !inQuotes) {
      cells.push(current)
      current = ""
      continue
    }

    current += char
  }

  cells.push(current)
  return cells
}

function normalizeFlag(value) {
  const text = toTrimmedString(value).toUpperCase()
  if (!text) {
    return null
  }

  if (["YES", "NO", "PARTIAL", "UNKNOWN"].includes(text)) {
    return text
  }

  return "UNKNOWN"
}

function normalizePriority(value) {
  const text = toTrimmedString(value).toUpperCase()
  if (["P0", "P1", "P2"].includes(text)) {
    return text
  }

  return "P2"
}

function countBy(values = []) {
  return values.reduce((accumulator, value) => {
    const key = String(value ?? "").trim() || "UNKNOWN"
    accumulator[key] = (accumulator[key] ?? 0) + 1
    return accumulator
  }, {})
}

export const PAGE_AUDIT_REQUIRED_FIELDS = Object.freeze([
  "audit_date",
  "page_type",
  "page_url",
  "module_name",
  "observed_issue",
  "manual_recommendation",
  "priority"
])

export const PAGE_AUDIT_OPTIONAL_FIELDS = Object.freeze([
  "module_position",
  "homepage_module",
  "banner_status",
  "core_product_exposure",
  "category_entry_status",
  "contact_entry_status",
  "inquiry_entry_status",
  "main_image_status",
  "video_status",
  "detail_content_status",
  "owner",
  "evidence_link",
  "notes"
])

export const PAGE_AUDIT_TEMPLATE_COLUMNS = Object.freeze([
  "audit_date",
  "page_type",
  "page_url",
  "module_name",
  "module_position",
  "homepage_module",
  "banner_status",
  "core_product_exposure",
  "category_entry_status",
  "contact_entry_status",
  "inquiry_entry_status",
  "main_image_status",
  "video_status",
  "detail_content_status",
  "observed_issue",
  "manual_recommendation",
  "priority",
  "owner",
  "evidence_link",
  "notes"
])

export const PAGE_AUDIT_FIELD_DESCRIPTIONS = Object.freeze({
  audit_date: "盘点日期，系统会标准化到 YYYY-MM-DD。",
  page_type: "页面类型，建议使用 homepage / product_detail / landing_page / category_page / other。",
  page_url: "盘点页面 URL。",
  module_name: "模块名称。",
  module_position: "模块位置或序号。",
  homepage_module: "是否属于首页模块，建议填 YES / NO。",
  banner_status: "主 banner 状态。",
  core_product_exposure: "是否有核心商品露出。",
  category_entry_status: "重点类目入口状态。",
  contact_entry_status: "联系方式入口状态。",
  inquiry_entry_status: "询盘入口状态。",
  main_image_status: "主图完整度与质量状态。",
  video_status: "视频状态。",
  detail_content_status: "详情内容状态。",
  observed_issue: "当前人工观察到的问题。",
  manual_recommendation: "当前人工建议动作。",
  priority: "建议优先级，P0 / P1 / P2。",
  owner: "建议负责人。",
  evidence_link: "截图或录屏链接。",
  notes: "补充说明。"
})

export function parsePageAuditCsvText(csvText = "") {
  const normalized = String(csvText ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) {
    return []
  }

  const headers = parseCsvLine(lines[0]).map((header) => toTrimmedString(header))
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line)
    const row = {}
    headers.forEach((header, index) => {
      row[header] = values[index] ?? ""
    })
    return row
  })
}

export function parsePageAuditJsonText(jsonText = "") {
  const trimmed = String(jsonText ?? "").trim()
  if (!trimmed) {
    return []
  }

  const parsed = JSON.parse(trimmed)
  if (Array.isArray(parsed)) {
    return parsed
  }

  if (parsed && typeof parsed === "object" && Array.isArray(parsed.rows)) {
    return parsed.rows
  }

  throw new Error("page audit json import must be an array or an object with rows")
}

export function buildPageAuditContract() {
  return {
    report_name: "page_audit_contract",
    generated_at: new Date().toISOString(),
    supported_input_formats: ["csv", "json"],
    required_fields: [...PAGE_AUDIT_REQUIRED_FIELDS],
    optional_fields: [...PAGE_AUDIT_OPTIONAL_FIELDS],
    template_columns: [...PAGE_AUDIT_TEMPLATE_COLUMNS],
    field_descriptions: PAGE_AUDIT_FIELD_DESCRIPTIONS,
    allowed_status_values: ["YES", "NO", "PARTIAL", "UNKNOWN"],
    enhancement_scope: {
      strengthened_capabilities: [
        "homepage_optimization_suggestions",
        "product_detail_optimization_suggestions",
        "media_optimization_suggestions",
        "manual_issue_tracking_for_operator_console"
      ],
      unchanged_capabilities: [
        "official_page_behavior_metrics",
        "heatmap",
        "page_clickstream"
      ]
    },
    boundary_statement: {
      manual_audit_only: true,
      not_official_behavior_data: true,
      conservative_recommendation_strengthened: true,
      no_write_action_attempted: true
    }
  }
}

export function normalizePageAuditRows(inputRows = []) {
  const rows = Array.isArray(inputRows) ? inputRows : []
  const normalizedRows = []
  const errors = []

  rows.forEach((rawRow, rowIndex) => {
    const raw = rawRow && typeof rawRow === "object" ? rawRow : {}
    const normalized = {
      audit_date: normalizeDate(raw.audit_date),
      page_type: toTrimmedString(raw.page_type).toLowerCase() || null,
      page_url: toTrimmedString(raw.page_url) || null,
      module_name: toTrimmedString(raw.module_name) || null,
      module_position: toTrimmedString(raw.module_position) || null,
      homepage_module: normalizeFlag(raw.homepage_module),
      banner_status: normalizeFlag(raw.banner_status),
      core_product_exposure: normalizeFlag(raw.core_product_exposure),
      category_entry_status: normalizeFlag(raw.category_entry_status),
      contact_entry_status: normalizeFlag(raw.contact_entry_status),
      inquiry_entry_status: normalizeFlag(raw.inquiry_entry_status),
      main_image_status: normalizeFlag(raw.main_image_status),
      video_status: normalizeFlag(raw.video_status),
      detail_content_status: normalizeFlag(raw.detail_content_status),
      observed_issue: toTrimmedString(raw.observed_issue) || null,
      manual_recommendation: toTrimmedString(raw.manual_recommendation) || null,
      priority: normalizePriority(raw.priority),
      owner: toTrimmedString(raw.owner) || null,
      evidence_link: toTrimmedString(raw.evidence_link) || null,
      notes: toTrimmedString(raw.notes) || null
    }

    for (const fieldName of PAGE_AUDIT_REQUIRED_FIELDS) {
      const value = normalized[fieldName]
      if (value === null || value === undefined || value === "") {
        errors.push({
          row_index: rowIndex,
          code: `MISSING_${fieldName.toUpperCase()}`,
          message: `${fieldName} 缺失`
        })
      }
    }

    if (!normalized.audit_date) {
      errors.push({
        row_index: rowIndex,
        code: "INVALID_AUDIT_DATE",
        message: "audit_date 无法标准化到 YYYY-MM-DD"
      })
    }

    normalizedRows.push(normalized)
  })

  return {
    ok: errors.length === 0,
    row_count: rows.length,
    normalized_row_count: normalizedRows.length,
    rows: normalizedRows,
    errors
  }
}

export function buildPageAuditInputSummary(inputRows = []) {
  const normalized = normalizePageAuditRows(inputRows)
  const rows = normalized.rows

  return {
    report_name: "page_audit_input_summary",
    generated_at: new Date().toISOString(),
    current_status:
      rows.length > 0
        ? "MANUAL_AUDIT_READY_WITH_SAMPLE"
        : "MANUAL_AUDIT_READY_WAITING_INPUT",
    contract: buildPageAuditContract(),
    row_count: normalized.row_count,
    normalized_row_count: normalized.normalized_row_count,
    errors: normalized.errors,
    summary: {
      page_type_breakdown: countBy(rows.map((row) => row.page_type)),
      priority_breakdown: countBy(rows.map((row) => row.priority)),
      homepage_module_rows: rows.filter((row) => row.homepage_module === "YES").length,
      contact_entry_missing_rows: rows.filter(
        (row) => row.contact_entry_status === "NO"
      ).length,
      inquiry_entry_missing_rows: rows.filter(
        (row) => row.inquiry_entry_status === "NO"
      ).length,
      incomplete_content_rows: rows.filter((row) =>
        ["NO", "PARTIAL"].includes(row.detail_content_status)
      ).length
    },
    capability_enhancement_map: [
      "content_optimization_layer",
      "homepage_optimization_suggestions",
      "media_optimization_suggestions",
      "operator_console_manual_followup"
    ],
    boundary_statement: buildPageAuditContract().boundary_statement
  }
}
