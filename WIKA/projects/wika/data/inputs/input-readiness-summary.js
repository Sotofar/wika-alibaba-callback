import {
  buildAdsImportProductizationSummary
} from "../ads/import-contract.js"
import {
  buildPageAuditInputSummary,
  parsePageAuditCsvText
} from "../content-optimization/page-audit-contract.js"

export const WIKA_AUTO_FETCH_LAYER = Object.freeze({
  current_status: "AUTO_FETCH_READY",
  stable_routes: [
    "/integrations/alibaba/wika/reports/operations/management-summary",
    "/integrations/alibaba/wika/reports/products/management-summary",
    "/integrations/alibaba/wika/reports/orders/management-summary",
    "/integrations/alibaba/wika/reports/operations/minimal-diagnostic",
    "/integrations/alibaba/wika/reports/products/minimal-diagnostic",
    "/integrations/alibaba/wika/reports/orders/minimal-diagnostic",
    "/integrations/alibaba/wika/reports/operations/comparison-summary",
    "/integrations/alibaba/wika/reports/products/comparison-summary",
    "/integrations/alibaba/wika/reports/orders/comparison-summary",
    "/integrations/alibaba/wika/reports/business-cockpit",
    "/integrations/alibaba/wika/reports/action-center",
    "/integrations/alibaba/wika/reports/operator-console"
  ],
  unavailable_dimensions: [
    "traffic_source",
    "country_source",
    "quick_reply_rate",
    "access_source",
    "inquiry_source",
    "period_over_period_change",
    "country_structure"
  ]
})

export function buildInputReadinessSummary({
  adsCsvText = "",
  pageAuditCsvText = ""
} = {}) {
  const pageAuditRows = pageAuditCsvText
    ? parsePageAuditCsvText(pageAuditCsvText)
    : []

  const adsImportLayer = buildAdsImportProductizationSummary({
    csvText: adsCsvText,
    sourceType: "manual_import"
  })
  const pageAuditLayer = buildPageAuditInputSummary(pageAuditRows)

  return {
    report_name: "input_readiness_summary",
    generated_at: new Date().toISOString(),
    auto_fetch_layer: WIKA_AUTO_FETCH_LAYER,
    ads_import_layer: adsImportLayer,
    page_audit_layer: pageAuditLayer,
    capability_enhancement_map: {
      ads_input_enhances: [
        "ads_summary",
        "ads_comparison",
        "ads_diagnostic",
        "ads_action_center"
      ],
      page_audit_enhances: [
        "content_optimization_layer",
        "homepage_optimization_suggestions",
        "media_optimization_suggestions",
        "operator_console_manual_followup"
      ],
      still_unavailable_without_new_sources: [
        "official_ads_api_route",
        "page_clickstream",
        "page_heatmap",
        "traffic_source",
        "country_source",
        "country_structure"
      ]
    },
    boundary_statement: {
      auto_fetch_first_import_fallback: true,
      ads_layer_is_import_driven: true,
      page_audit_is_manual_input_layer: true,
      not_official_behavior_data: true,
      no_write_action_attempted: true
    }
  }
}
