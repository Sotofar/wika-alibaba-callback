import {
  ADS_IMPORT_NUMERIC_FIELDS,
  ADS_IMPORT_REQUIRED_FIELDS,
  ADS_IMPORT_SCHEMA,
  ADS_IMPORT_TEMPLATE_COLUMNS
} from "./schema.js"

function roundMetric(value, digits = 4) {
  if (!Number.isFinite(value)) {
    return null
  }

  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function toTrimmedString(value) {
  if (value === null || value === undefined) {
    return ""
  }

  return String(value).trim()
}

function normalizeRateValue(rawValue) {
  const text = toTrimmedString(rawValue)
  if (!text) {
    return null
  }

  const percentLike = text.endsWith("%")
  const cleaned = text.replace(/[% ,]/g, "")
  const parsed = Number(cleaned)
  if (!Number.isFinite(parsed)) {
    return null
  }

  if (percentLike || parsed > 1) {
    return roundMetric(parsed / 100, 6)
  }

  return roundMetric(parsed, 6)
}

function toNumber(rawValue, fieldName) {
  if (rawValue === null || rawValue === undefined || rawValue === "") {
    return null
  }

  if (fieldName === "ctr" || fieldName === "inquiry_rate" || fieldName === "conversion") {
    return normalizeRateValue(rawValue)
  }

  const cleaned = toTrimmedString(rawValue).replace(/,/g, "")
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeDate(rawValue) {
  const text = toTrimmedString(rawValue)
  if (!text) {
    return null
  }

  const direct = /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null
  if (direct) {
    return direct
  }

  const parsed = new Date(text)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed.toISOString().slice(0, 10)
}

function divide(numerator, denominator) {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) {
    return null
  }

  return numerator / denominator
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

export function parseAdsCsvText(csvText = "") {
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

function aggregateTotals(rows = []) {
  return rows.reduce(
    (accumulator, row) => {
      accumulator.spend += row.spend ?? 0
      accumulator.impressions += row.impressions ?? 0
      accumulator.clicks += row.clicks ?? 0
      accumulator.inquiries += row.inquiries ?? 0
      return accumulator
    },
    {
      spend: 0,
      impressions: 0,
      clicks: 0,
      inquiries: 0
    }
  )
}

function buildDerivedTotals(totals) {
  return {
    ...totals,
    ctr: roundMetric(divide(totals.clicks, totals.impressions), 6),
    cpc: roundMetric(divide(totals.spend, totals.clicks), 6),
    inquiry_rate: roundMetric(divide(totals.inquiries, totals.clicks), 6),
    cost_per_inquiry: roundMetric(divide(totals.spend, totals.inquiries), 6)
  }
}

function unique(values = []) {
  return [...new Set(values.map((value) => toTrimmedString(value)).filter(Boolean))]
}

export function normalizeAdsImportRows(inputRows = [], options = {}) {
  const rows = Array.isArray(inputRows) ? inputRows : []
  const normalizedRows = []
  const errors = []
  const warnings = []

  rows.forEach((rawRow, rowIndex) => {
    const raw = rawRow && typeof rawRow === "object" ? rawRow : {}
    const normalized = {}

    for (const column of ADS_IMPORT_TEMPLATE_COLUMNS) {
      const rawValue = raw[column]
      if (column === "date") {
        normalized.date = normalizeDate(rawValue)
        continue
      }

      if (ADS_IMPORT_NUMERIC_FIELDS.includes(column)) {
        normalized[column] = toNumber(rawValue, column)
        continue
      }

      normalized[column] = toTrimmedString(rawValue) || null
    }

    const campaignIdentifier =
      normalized.campaign_id ?? normalized.campaign_name ?? null
    if (!campaignIdentifier) {
      errors.push({
        row_index: rowIndex,
        code: "MISSING_CAMPAIGN_IDENTIFIER",
        message: "campaign_name 或 campaign_id 至少需要一个"
      })
      return
    }

    for (const requiredField of ADS_IMPORT_REQUIRED_FIELDS) {
      const value = normalized[requiredField]
      if (value === null || value === undefined || value === "") {
        errors.push({
          row_index: rowIndex,
          code: `MISSING_${requiredField.toUpperCase()}`,
          message: `${requiredField} 缺失`
        })
      }
    }

    if (!normalized.date) {
      errors.push({
        row_index: rowIndex,
        code: "INVALID_DATE",
        message: "date 无法标准化到 YYYY-MM-DD"
      })
    }

    if ((normalized.impressions ?? 0) < 0 || (normalized.clicks ?? 0) < 0) {
      errors.push({
        row_index: rowIndex,
        code: "NEGATIVE_METRIC",
        message: "impressions 或 clicks 不能为负数"
      })
    }

    if ((normalized.clicks ?? 0) > (normalized.impressions ?? Number.MAX_SAFE_INTEGER)) {
      warnings.push({
        row_index: rowIndex,
        code: "CLICKS_EXCEED_IMPRESSIONS",
        message: "clicks 大于 impressions，请确认导出原始数据口径"
      })
    }

    normalized.ctr = roundMetric(
      normalized.ctr ?? divide(normalized.clicks, normalized.impressions),
      6
    )
    normalized.cpc = roundMetric(
      normalized.cpc ?? divide(normalized.spend, normalized.clicks),
      6
    )
    normalized.inquiry_rate = roundMetric(
      normalized.inquiry_rate ?? divide(normalized.inquiries, normalized.clicks),
      6
    )
    normalized.conversion = normalized.conversion ?? normalized.inquiry_rate
    normalized.cost_per_inquiry = roundMetric(
      divide(normalized.spend, normalized.inquiries),
      6
    )
    normalized.campaign_key = normalized.campaign_id ?? normalized.campaign_name
    normalized.ad_group_key = normalized.ad_group_id ?? normalized.ad_group_name ?? null
    normalized.keyword_key = normalized.keyword ?? null
    normalized.source_type = options.source_type ?? "manual_import"
    normalized.boundary_statement = {
      manual_import_only: true,
      not_official_ads_api: true,
      no_platform_write_action_attempted: true
    }

    normalizedRows.push(normalized)
  })

  const valid = errors.length === 0
  const totals = buildDerivedTotals(aggregateTotals(normalizedRows))

  return {
    ok: valid,
    schema_version: ADS_IMPORT_SCHEMA.schema_version,
    source_type: options.source_type ?? "manual_import",
    row_count: rows.length,
    normalized_row_count: normalizedRows.length,
    rows: normalizedRows,
    errors,
    warnings,
    summary: {
      campaign_count: unique(
        normalizedRows.map((row) => row.campaign_key).filter(Boolean)
      ).length,
      ad_group_count: unique(
        normalizedRows.map((row) => row.ad_group_key).filter(Boolean)
      ).length,
      keyword_count: unique(
        normalizedRows.map((row) => row.keyword_key).filter(Boolean)
      ).length,
      date_range:
        normalizedRows.length > 0
          ? {
              start: normalizedRows.map((row) => row.date).sort()[0],
              end: normalizedRows.map((row) => row.date).sort().slice(-1)[0]
            }
          : null,
      metric_totals: totals
    },
    derived_field_notes: [
      "ctr 在缺失时按 clicks / impressions 计算",
      "cpc 在缺失时按 spend / clicks 计算",
      "inquiry_rate 在缺失时按 inquiries / clicks 计算",
      "cost_per_inquiry 按 spend / inquiries 保守计算"
    ],
    unavailable_dimensions: [
      "official_ads_api_route",
      "campaign_writeback",
      "budget_mutation",
      "bid_mutation"
    ],
    boundary_statement: ADS_IMPORT_SCHEMA.boundary_statement
  }
}

export function buildAdsImportSummary(inputRows = [], options = {}) {
  const normalized = normalizeAdsImportRows(inputRows, options)
  return {
    report_name: "ads_import_summary",
    generated_at: new Date().toISOString(),
    ...normalized
  }
}

function rowWithinWindow(row, window) {
  if (!window?.start || !window?.end || !row?.date) {
    return false
  }

  return row.date >= window.start && row.date <= window.end
}

function summarizeWindow(rows = [], window = null) {
  const filtered = window ? rows.filter((row) => rowWithinWindow(row, window)) : rows
  return {
    row_count: filtered.length,
    metric_totals: buildDerivedTotals(aggregateTotals(filtered))
  }
}

function buildMetricDelta(currentValue, previousValue) {
  const deltaValue =
    Number.isFinite(currentValue) && Number.isFinite(previousValue)
      ? currentValue - previousValue
      : null
  const deltaRate =
    Number.isFinite(previousValue) && previousValue !== 0 && Number.isFinite(deltaValue)
      ? roundMetric(deltaValue / previousValue, 6)
      : null

  return {
    current: currentValue ?? null,
    previous: previousValue ?? null,
    delta_value: roundMetric(deltaValue ?? null, 6),
    delta_rate: deltaRate
  }
}

export function buildAdsWindowComparison(inputRows = [], windows = {}, options = {}) {
  const normalized = normalizeAdsImportRows(inputRows, options)
  const currentWindow = summarizeWindow(normalized.rows, windows.current)
  const previousWindow = summarizeWindow(normalized.rows, windows.previous)

  return {
    report_name: "ads_import_comparison",
    generated_at: new Date().toISOString(),
    current_window: windows.current ?? null,
    previous_window: windows.previous ?? null,
    current_summary: currentWindow,
    previous_summary: previousWindow,
    metric_deltas: {
      spend: buildMetricDelta(
        currentWindow.metric_totals.spend,
        previousWindow.metric_totals.spend
      ),
      impressions: buildMetricDelta(
        currentWindow.metric_totals.impressions,
        previousWindow.metric_totals.impressions
      ),
      clicks: buildMetricDelta(
        currentWindow.metric_totals.clicks,
        previousWindow.metric_totals.clicks
      ),
      inquiries: buildMetricDelta(
        currentWindow.metric_totals.inquiries,
        previousWindow.metric_totals.inquiries
      ),
      ctr: buildMetricDelta(
        currentWindow.metric_totals.ctr,
        previousWindow.metric_totals.ctr
      ),
      cpc: buildMetricDelta(
        currentWindow.metric_totals.cpc,
        previousWindow.metric_totals.cpc
      ),
      inquiry_rate: buildMetricDelta(
        currentWindow.metric_totals.inquiry_rate,
        previousWindow.metric_totals.inquiry_rate
      )
    },
    source_type: normalized.source_type,
    unavailable_dimensions: normalized.unavailable_dimensions,
    boundary_statement: normalized.boundary_statement
  }
}
