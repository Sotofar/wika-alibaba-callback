import {
  ADS_IMPORT_OPTIONAL_FIELDS,
  ADS_IMPORT_REQUIRED_FIELDS,
  ADS_IMPORT_SCHEMA,
  ADS_IMPORT_TEMPLATE_COLUMNS
} from "./schema.js"
import { buildAdsImportSummary, parseAdsCsvText } from "./normalizer.js"
import {
  buildAdsActionCenterReport,
  buildAdsComparisonReport,
  buildAdsDiagnosticReport,
  buildAdsSummaryReport
} from "./diagnostics.js"

export const ADS_IMPORT_ALLOWED_SOURCE_TYPES = Object.freeze([
  "alibaba_ads_export",
  "manual_sheet",
  "third_party_rollup",
  "sanitized_history_sample"
])

export const ADS_IMPORT_FIELD_DESCRIPTIONS = Object.freeze({
  date: "导出日期，系统会标准化到 YYYY-MM-DD。",
  campaign_name: "计划名称；campaign_name 与 campaign_id 至少需要一个。",
  campaign_id: "计划 ID；campaign_name 与 campaign_id 至少需要一个。",
  ad_group_name: "单元名称，建议尽量提供。",
  ad_group_id: "单元 ID，建议尽量提供。",
  keyword: "关键词级输入；没有关键词维度时可留空。",
  spend: "广告花费，数值型，必填。",
  impressions: "曝光量，数值型，必填。",
  clicks: "点击量，数值型，必填。",
  inquiries: "询盘量，若缺失会降低建议强度。",
  ctr: "点击率；缺失时按 clicks / impressions 保守计算。",
  cpc: "单次点击成本；缺失时按 spend / clicks 保守计算。",
  conversion: "可得的转化率字段；当前不强制。",
  inquiry_rate: "询盘率；缺失时按 inquiries / clicks 保守计算。",
  budget: "预算，只参与只读分析。",
  bid: "出价，只参与只读分析。",
  region: "地域维度，若导出可得建议提供。",
  device: "设备维度，若导出可得建议提供。",
  currency: "币种，建议显式填写。",
  source_file: "原始来源文件名或来源标记，用于追溯。"
})

const DEFAULT_COMPARISON_WINDOWS = Object.freeze({
  current: {
    start: "2026-04-06",
    end: "2026-04-12"
  },
  previous: {
    start: "2026-03-30",
    end: "2026-04-05"
  }
})

export function buildAdsImportContract() {
  return {
    report_name: "ads_import_contract",
    generated_at: new Date().toISOString(),
    schema_version: ADS_IMPORT_SCHEMA.schema_version,
    required_fields: [...ADS_IMPORT_REQUIRED_FIELDS],
    optional_fields: [...ADS_IMPORT_OPTIONAL_FIELDS],
    template_columns: [...ADS_IMPORT_TEMPLATE_COLUMNS],
    field_descriptions: ADS_IMPORT_FIELD_DESCRIPTIONS,
    allowed_source_types: [...ADS_IMPORT_ALLOWED_SOURCE_TYPES],
    analysis_entrypoints: {
      ads_summary: "buildAdsSummaryReport",
      ads_comparison: "buildAdsComparisonReport",
      ads_diagnostic: "buildAdsDiagnosticReport",
      ads_action_center: "buildAdsActionCenterReport"
    },
    enhancement_scope: {
      strengthened_capabilities: [
        "ads_spend_change_analysis",
        "ads_click_and_inquiry_efficiency_analysis",
        "campaign_and_keyword_prioritization",
        "ads_action_center_prioritized_actions"
      ],
      unchanged_capabilities: [
        "operations_management_summary",
        "products_management_summary",
        "orders_management_summary",
        "business_cockpit",
        "action_center",
        "operator_console",
        "content_optimization_layer"
      ]
    },
    boundary_statement: {
      import_driven_only: true,
      not_official_ads_api: true,
      no_platform_write_action_attempted: true
    }
  }
}

export function buildAdsImportProductizationSummary({
  csvText = "",
  sourceType = "manual_import",
  comparisonWindows = DEFAULT_COMPARISON_WINDOWS
} = {}) {
  const rows = csvText ? parseAdsCsvText(csvText) : []
  const importSummary = buildAdsImportSummary(rows, {
    source_type: sourceType
  })

  const analysisOutputs =
    rows.length > 0
      ? {
          ads_summary: buildAdsSummaryReport(rows, {
            source_type: sourceType
          }),
          ads_comparison: buildAdsComparisonReport(rows, comparisonWindows, {
            source_type: sourceType
          }),
          ads_diagnostic: buildAdsDiagnosticReport(rows, comparisonWindows, {
            source_type: sourceType
          }),
          ads_action_center: buildAdsActionCenterReport(rows, comparisonWindows, {
            source_type: sourceType
          })
        }
      : null

  return {
    report_name: "ads_input_productization_summary",
    generated_at: new Date().toISOString(),
    current_status:
      rows.length > 0 ? "IMPORT_READY_WITH_SAMPLE" : "IMPORT_READY_WAITING_REAL_EXPORT",
    source_type: sourceType,
    contract: buildAdsImportContract(),
    template_validation: {
      ok: importSummary.ok,
      row_count: importSummary.row_count,
      normalized_row_count: importSummary.normalized_row_count,
      errors: importSummary.errors,
      warnings: importSummary.warnings,
      metric_totals: importSummary.summary?.metric_totals ?? null
    },
    analysis_outputs: analysisOutputs,
    capabilities_enhanced_when_input_arrives: [
      "ads_summary",
      "ads_comparison",
      "ads_diagnostic",
      "ads_action_center"
    ],
    capabilities_still_not_solved_by_ads_input: [
      "official_ads_api_route",
      "campaign_writeback",
      "budget_mutation",
      "bid_mutation"
    ],
    boundary_statement: {
      import_driven_only: true,
      not_official_ads_api: true,
      no_platform_write_action_attempted: true
    }
  }
}
