import {
  buildAdsImportSummary,
  buildAdsWindowComparison,
  normalizeAdsImportRows
} from "./normalizer.js"

function roundMetric(value, digits = 4) {
  if (!Number.isFinite(value)) {
    return null
  }

  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function aggregateBy(rows = [], keySelector) {
  const map = new Map()
  rows.forEach((row) => {
    const key = keySelector(row)
    if (!key) {
      return
    }

    if (!map.has(key)) {
      map.set(key, {
        key,
        spend: 0,
        impressions: 0,
        clicks: 0,
        inquiries: 0,
        row_count: 0
      })
    }

    const entry = map.get(key)
    entry.spend += row.spend ?? 0
    entry.impressions += row.impressions ?? 0
    entry.clicks += row.clicks ?? 0
    entry.inquiries += row.inquiries ?? 0
    entry.row_count += 1
  })

  return [...map.values()].map((entry) => ({
    ...entry,
    ctr: roundMetric(entry.impressions > 0 ? entry.clicks / entry.impressions : null, 6),
    cpc: roundMetric(entry.clicks > 0 ? entry.spend / entry.clicks : null, 6),
    inquiry_rate: roundMetric(entry.clicks > 0 ? entry.inquiries / entry.clicks : null, 6),
    cost_per_inquiry: roundMetric(
      entry.inquiries > 0 ? entry.spend / entry.inquiries : null,
      6
    )
  }))
}

function sortDescending(rows = [], metric) {
  return [...rows].sort((left, right) => (right?.[metric] ?? 0) - (left?.[metric] ?? 0))
}

function sortAscending(rows = [], metric) {
  return [...rows].sort((left, right) => (left?.[metric] ?? 0) - (right?.[metric] ?? 0))
}

function detectTrendDirection(comparison = {}) {
  const inquiryDelta = comparison.metric_deltas?.inquiries?.delta_value ?? null
  const ctrDelta = comparison.metric_deltas?.ctr?.delta_value ?? null
  const cpcDelta = comparison.metric_deltas?.cpc?.delta_value ?? null

  if ((inquiryDelta ?? 0) > 0 && (ctrDelta ?? 0) >= 0 && (cpcDelta ?? 0) <= 0) {
    return "improving"
  }

  if ((inquiryDelta ?? 0) < 0 && (ctrDelta ?? 0) < 0 && (cpcDelta ?? 0) > 0) {
    return "deteriorating"
  }

  return "mixed"
}

function buildFindings(summary, comparison, campaignTable, keywordTable) {
  const findings = []
  const totals = summary.summary?.metric_totals ?? {}

  if ((totals.impressions ?? 0) > 0 && (totals.clicks ?? 0) === 0) {
    findings.push({
      severity: "high",
      code: "NO_CLICK_FROM_IMPRESSIONS",
      message: "广告已有曝光但没有点击，优先检查主图、标题与关键词匹配。"
    })
  }

  if ((totals.clicks ?? 0) > 0 && (totals.inquiries ?? 0) === 0) {
    findings.push({
      severity: "high",
      code: "NO_INQUIRY_FROM_CLICKS",
      message: "广告已有点击但没有询盘，需优先排查落地页承接与商品内容说服力。"
    })
  }

  if ((totals.clicks ?? 0) > 0 && (totals.inquiry_rate ?? 0) !== null && totals.inquiry_rate < 0.02) {
    findings.push({
      severity: "medium",
      code: "LOW_INQUIRY_EFFICIENCY",
      message: "当前询盘率偏低，建议先做关键词收缩与详情页承接优化。"
    })
  }

  const lowestInquiryKeywords = sortAscending(
    keywordTable.filter((row) => (row.clicks ?? 0) >= 5),
    "inquiry_rate"
  ).slice(0, 3)
  if (lowestInquiryKeywords.length > 0) {
    findings.push({
      severity: "medium",
      code: "KEYWORD_EFFICIENCY_GAP",
      message: "存在高点击低询盘关键词，建议先降本或暂停低效率词。",
      evidence: lowestInquiryKeywords.map((row) => ({
        keyword: row.key,
        clicks: row.clicks,
        inquiries: row.inquiries,
        inquiry_rate: row.inquiry_rate
      }))
    })
  }

  const spendHeavyCampaigns = sortDescending(campaignTable, "spend").slice(0, 3)
  if (spendHeavyCampaigns.length > 0) {
    findings.push({
      severity: "info",
      code: "SPEND_CONCENTRATION",
      message: "当前花费集中在少数计划，建议逐个核查其点击质量与询盘承接。",
      evidence: spendHeavyCampaigns.map((row) => ({
        campaign: row.key,
        spend: roundMetric(row.spend, 2),
        clicks: row.clicks,
        inquiries: row.inquiries
      }))
    })
  }

  findings.push({
    severity: "info",
    code: "TREND_DIRECTION",
    message: `当前广告总体变化方向为 ${detectTrendDirection(comparison)}。`
  })

  return findings
}

function buildRecommendations(summary, comparison, keywordTable) {
  const recommendations = []
  const totals = summary.summary?.metric_totals ?? {}

  if ((totals.clicks ?? 0) > 0 && (totals.inquiries ?? 0) === 0) {
    recommendations.push({
      priority: "P0",
      action: "先把点击高但无询盘的主投商品转入详情与询盘承接整改清单。",
      basis: "广告点击已产生，但当前询盘为 0。"
    })
  }

  const bestKeywords = sortDescending(keywordTable, "inquiry_rate")
    .filter((row) => (row.inquiries ?? 0) > 0)
    .slice(0, 5)
  if (bestKeywords.length > 0) {
    recommendations.push({
      priority: "P1",
      action: "对高询盘率关键词做扩量观察，必要时单独拆组。",
      basis: "已识别出可复用的高询盘关键词。",
      evidence: bestKeywords.map((row) => ({
        keyword: row.key,
        inquiry_rate: row.inquiry_rate,
        inquiries: row.inquiries
      }))
    })
  }

  const costlyKeywords = sortDescending(
    keywordTable.filter((row) => (row.clicks ?? 0) >= 5),
    "cost_per_inquiry"
  )
    .filter((row) => Number.isFinite(row.cost_per_inquiry))
    .slice(0, 5)
  if (costlyKeywords.length > 0) {
    recommendations.push({
      priority: "P1",
      action: "对高成本关键词做降价、暂停或转内容整改。",
      basis: "存在成本偏高的关键词。",
      evidence: costlyKeywords.map((row) => ({
        keyword: row.key,
        cost_per_inquiry: row.cost_per_inquiry,
        spend: row.spend,
        inquiries: row.inquiries
      }))
    })
  }

  const inquiryDelta = comparison.metric_deltas?.inquiries?.delta_value ?? null
  if ((inquiryDelta ?? 0) < 0) {
    recommendations.push({
      priority: "P0",
      action: "本周期询盘下滑，先查主投计划与落地商品的素材、关键词与详情承接是否同步退化。",
      basis: "comparison 中 inquiries 出现负向 delta。"
    })
  }

  if (recommendations.length === 0) {
    recommendations.push({
      priority: "P2",
      action: "当前导入数据规模有限，先持续补齐广告导出，再做更细粒度预算与词包决策。",
      basis: "广告导入层已成立，但当前样本不足以支持更强动作。"
    })
  }

  return recommendations
}

export function buildAdsSummaryReport(inputRows = [], options = {}) {
  const summary = buildAdsImportSummary(inputRows, options)
  const campaigns = aggregateBy(summary.rows, (row) => row.campaign_key)
  const adGroups = aggregateBy(summary.rows, (row) => row.ad_group_key)
  const keywords = aggregateBy(summary.rows, (row) => row.keyword_key)

  return {
    report_name: "ads_summary",
    generated_at: new Date().toISOString(),
    source_type: summary.source_type,
    import_contract: {
      schema_version: summary.schema_version,
      row_count: summary.row_count,
      normalized_row_count: summary.normalized_row_count,
      error_count: summary.errors.length,
      warning_count: summary.warnings.length
    },
    summary: summary.summary,
    campaign_breakdown: sortDescending(campaigns, "spend").slice(0, 10),
    ad_group_breakdown: sortDescending(adGroups, "spend").slice(0, 10),
    keyword_breakdown: sortDescending(keywords, "clicks").slice(0, 10),
    unavailable_dimensions: [
      ...summary.unavailable_dimensions,
      "official_budget_status",
      "official_bid_history",
      "official_region_delivery_status"
    ],
    boundary_statement: {
      ...summary.boundary_statement,
      import_analysis_only: true,
      not_platform_ad_mutation: true
    }
  }
}

export function buildAdsComparisonReport(inputRows = [], windows = {}, options = {}) {
  const comparison = buildAdsWindowComparison(inputRows, windows, options)
  return {
    report_name: "ads_comparison",
    generated_at: new Date().toISOString(),
    comparison_basis: {
      current_window: windows.current ?? null,
      previous_window: windows.previous ?? null,
      source_type: options.source_type ?? "manual_import"
    },
    current_window: comparison.current_window,
    previous_window: comparison.previous_window,
    derived_comparison: {
      trend_direction: detectTrendDirection(comparison),
      metric_deltas: comparison.metric_deltas
    },
    unavailable_dimensions: comparison.unavailable_dimensions,
    boundary_statement: {
      ...comparison.boundary_statement,
      comparison_layer_is_derived: true,
      imported_ads_data_only: true
    }
  }
}

export function buildAdsDiagnosticReport(inputRows = [], windows = {}, options = {}) {
  const normalized = normalizeAdsImportRows(inputRows, options)
  const summary = buildAdsSummaryReport(normalized.rows, options)
  const comparison = buildAdsComparisonReport(normalized.rows, windows, options)
  const campaigns = aggregateBy(normalized.rows, (row) => row.campaign_key)
  const keywords = aggregateBy(normalized.rows, (row) => row.keyword_key)

  return {
    report_name: "ads_diagnostic",
    generated_at: new Date().toISOString(),
    official_inputs: {
      source_type: "manual_import",
      imported_fields: [
        "date",
        "campaign_name/campaign_id",
        "ad_group_name/ad_group_id",
        "keyword",
        "spend",
        "impressions",
        "clicks",
        "inquiries"
      ]
    },
    summary,
    comparison,
    diagnostic_findings: buildFindings(summary, comparison.derived_comparison, campaigns, keywords),
    recommendations: buildRecommendations(
      summary,
      comparison.derived_comparison,
      keywords
    ),
    unavailable_dimensions: summary.unavailable_dimensions,
    boundary_statement: {
      manual_import_only: true,
      imported_ads_data_only: true,
      recommendations_are_derived: true,
      not_official_ads_api: true,
      no_platform_write_action_attempted: true
    }
  }
}

export function buildAdsActionCenterReport(inputRows = [], windows = {}, options = {}) {
  const diagnostic = buildAdsDiagnosticReport(inputRows, windows, options)

  return {
    report_name: "ads_action_center",
    generated_at: new Date().toISOString(),
    summary_snapshot: diagnostic.summary.summary,
    comparison_snapshot: diagnostic.comparison.derived_comparison,
    prioritized_actions: diagnostic.recommendations.slice(0, 5),
    shared_blockers: [
      "manual_import_required",
      "official_ads_api_unavailable_or_unconfirmed",
      "budget_bid_mutation_not_supported"
    ],
    unavailable_dimensions: diagnostic.unavailable_dimensions,
    boundary_statement: {
      imported_ads_data_only: true,
      action_center_only: true,
      not_platform_execution: true,
      no_platform_write_action_attempted: true
    }
  }
}
