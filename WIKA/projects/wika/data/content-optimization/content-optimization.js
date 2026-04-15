function unique(values = []) {
  return [...new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))]
}

function takeArray(values, limit = 5) {
  return Array.isArray(values) ? values.slice(0, limit) : []
}

function normalizeRecommendation(item, fallbackDomain) {
  if (!item) {
    return null
  }

  if (typeof item === "string") {
    return {
      domain: fallbackDomain,
      suggestion: item
    }
  }

  return {
    domain: item.domain ?? fallbackDomain,
    priority: item.priority ?? null,
    suggestion: item.action ?? item.recommended_next_action ?? item.message ?? null,
    basis: item.basis ?? item.reason ?? null,
    evidence: item.evidence ?? null
  }
}

function buildHomepageSuggestions({ businessCockpit, operatorConsole }) {
  const actions = takeArray(operatorConsole?.next_best_actions, 3)
    .map((item) => normalizeRecommendation(item, "homepage"))
    .filter(Boolean)

  const crossGaps =
    businessCockpit?.cross_section_gaps?.combined_unavailable_dimensions ?? []
  if (crossGaps.includes("traffic_source") || crossGaps.includes("country_source")) {
    actions.push({
      domain: "homepage",
      priority: "P2",
      suggestion: "首页模块优化建议当前只能基于产品与经营表现做保守判断，无法按来源流量或国家来源精细化调优。",
      basis: "traffic_source / country_source 当前仍 unavailable。"
    })
  }

  return actions.slice(0, 5)
}

function buildProductDetailSuggestions({ productDiagnostic, productComparison }) {
  const detailSuggestions = []

  const recommendations = takeArray(productDiagnostic?.recommendations, 5)
    .map((item) => normalizeRecommendation(item, "product_detail"))
    .filter(Boolean)
  detailSuggestions.push(...recommendations)

  const topDecliners =
    productComparison?.derived_comparison?.top_decliners ??
    productComparison?.derived_comparison?.decliners ??
    []
  if (Array.isArray(topDecliners) && topDecliners.length > 0) {
    detailSuggestions.push({
      domain: "product_detail",
      priority: "P1",
      suggestion: "优先复盘下降最明显的产品详情结构、信任信息、MOQ 与报价承接。",
      basis: "comparison 已识别出下降样本产品。",
      evidence: topDecliners.slice(0, 3)
    })
  }

  return detailSuggestions.slice(0, 6)
}

function buildMediaSuggestions({ productSummary, productDiagnostic }) {
  const suggestions = []

  const findingTexts = takeArray(productDiagnostic?.diagnostic_findings, 6)
    .map((item) => item?.message ?? item?.finding ?? null)
    .filter(Boolean)

  if (findingTexts.length > 0) {
    suggestions.push({
      domain: "media",
      priority: "P1",
      suggestion: "主图、详情图与媒体素材优先跟随当前诊断问题清单整改，先处理高流量低反馈商品。",
      basis: "product diagnostic 已给出内容侧问题信号。",
      evidence: findingTexts.slice(0, 3)
    })
  }

  if (productSummary?.product_scope_truncated === true) {
    suggestions.push({
      domain: "media",
      priority: "P2",
      suggestion: "当前产品 summary 仍有 sample/cap 边界，媒体优化建议应先从已纳入样本的重点产品开始。",
      basis: "product_scope_truncated = true。"
    })
  }

  return suggestions.slice(0, 5)
}

function buildTitleKeywordSuggestions({ productSummary, productComparison }) {
  const suggestions = []

  const aggregateMetrics = productSummary?.aggregate_official_metrics ?? {}
  if (aggregateMetrics.keyword_effects !== undefined) {
    suggestions.push({
      domain: "title_keyword",
      priority: "P1",
      suggestion: "优先围绕已出现 keyword_effects 的商品补齐标题与关键词一致性，避免标题与投放词/成交词割裂。",
      basis: "当前 official product fields 中已确认存在 keyword_effects。"
    })
  }

  const topRisers =
    productComparison?.derived_comparison?.top_risers ??
    productComparison?.derived_comparison?.risers ??
    []
  if (Array.isArray(topRisers) && topRisers.length > 0) {
    suggestions.push({
      domain: "title_keyword",
      priority: "P2",
      suggestion: "对表现上升商品的标题关键词做保守复用，作为新品或长尾词扩展的候选方向。",
      basis: "comparison 已识别上升样本。",
      evidence: topRisers.slice(0, 3)
    })
  }

  return suggestions.slice(0, 5)
}

function buildNewProductSuggestions({ productSummary, businessCockpit }) {
  const suggestions = []

  const unavailable = unique([
    ...(productSummary?.unavailable_dimensions ?? []),
    ...(businessCockpit?.cross_section_gaps?.product?.unavailable_dimensions ?? [])
  ])

  suggestions.push({
    domain: "new_product_direction",
    priority: "P2",
    suggestion: "新品建议当前只能基于已上线商品表现、关键词信号与现有工作台 readiness 做保守扩展，不能伪装成完整选品模型。",
    basis: "当前没有新的选品专用 official field，必须沿用既有经营与内容信号。"
  })

  if (unavailable.includes("country_source")) {
    suggestions.push({
      domain: "new_product_direction",
      priority: "P2",
      suggestion: "由于缺少国家来源维度，新品方向建议暂时不能按国家市场精细拆分，只能做全局保守建议。",
      basis: "country_source unavailable。"
    })
  }

  return suggestions.slice(0, 4)
}

export function buildContentOptimizationLayer({
  productSummary = {},
  productDiagnostic = {},
  productComparison = {},
  businessCockpit = {},
  operatorConsole = {}
} = {}) {
  return {
    report_name: "content_optimization_layer",
    generated_at: new Date().toISOString(),
    homepage_optimization_suggestions: buildHomepageSuggestions({
      businessCockpit,
      operatorConsole
    }),
    product_detail_optimization_suggestions: buildProductDetailSuggestions({
      productDiagnostic,
      productComparison
    }),
    media_optimization_suggestions: buildMediaSuggestions({
      productSummary,
      productDiagnostic
    }),
    title_keyword_optimization_suggestions: buildTitleKeywordSuggestions({
      productSummary,
      productComparison
    }),
    new_product_direction_suggestions: buildNewProductSuggestions({
      productSummary,
      businessCockpit
    }),
    unavailable_dimensions: unique([
      ...(productSummary?.unavailable_dimensions ?? []),
      ...(businessCockpit?.cross_section_gaps?.combined_unavailable_dimensions ?? []),
      "page_heatmap",
      "page_clickstream",
      "homepage_module_ctr"
    ]),
    boundary_statement: {
      current_official_mainline_plus_derived_layers_only: true,
      recommendations_are_conservative: true,
      no_page_behavior_api_confirmed: true,
      manual_confirmation_still_required: true,
      no_write_action_attempted: true
    }
  }
}
