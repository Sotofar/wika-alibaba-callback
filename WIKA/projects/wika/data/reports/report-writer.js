import {
  normalizeAction,
  prioritizeActions,
  prioritizeFindings,
  prioritizeProblems
} from "./report-prioritizer.js"

function get(node, path, fallback = null) {
  const value = path.split(".").reduce((acc, key) => acc?.[key], node)
  return value === undefined ? fallback : value
}

function toNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function formatNumber(value, digits = 2, fallback = "当前不可得") {
  const number = toNumber(value)
  if (number === null) {
    return fallback
  }

  if (Number.isInteger(number)) {
    return String(number)
  }

  return number.toFixed(digits).replace(/0+$/, "").replace(/\.$/, "")
}

function formatPercent(value, digits = 2, fallback = "当前不可得") {
  const number = toNumber(value)
  if (number === null) {
    return fallback
  }

  if (Math.abs(number) <= 1) {
    return `${(number * 100).toFixed(digits).replace(/0+$/, "").replace(/\.$/, "")}%`
  }

  return `${number.toFixed(digits).replace(/0+$/, "").replace(/\.$/, "")}%`
}

function unique(values = []) {
  return [...new Set(values.map((item) => String(item ?? "").trim()).filter(Boolean))]
}

function joinList(values = [], fallback = "无") {
  const items = unique(values)
  return items.length > 0 ? items.join("、") : fallback
}

function shortName(value, max = 36) {
  const text = String(value ?? "")
  if (text.length <= max) {
    return text
  }

  return `${text.slice(0, max - 1)}…`
}

function topProducts(rows = [], valueKey = "metric_value") {
  if (!Array.isArray(rows) || rows.length === 0) {
    return []
  }

  return rows.slice(0, 3).map((item) => {
    const label = shortName(item.product_name ?? item.product_id ?? "未知商品", 42)
    const metric = item[valueKey] ?? item.order_count ?? item.count ?? item.quantity_sum
    return `${label}（${valueKey}=${formatNumber(metric)}）`
  })
}

function collectUnavailable(data = {}) {
  return unique([
    ...(get(data, "operationsManagementSummary.unavailable_dimensions", []) ?? []),
    ...(get(data, "productsManagementSummary.unavailable_dimensions", []) ?? []),
    ...(get(data, "ordersManagementSummary.unavailable_dimensions", []) ?? []),
    ...(get(data, "businessCockpit.cross_section_gaps.combined_unavailable_dimensions", []) ?? [])
  ])
}

function collectSourceLines(routeUsage = []) {
  return routeUsage.map((item) => {
    const sourceTag = item.source === "fallback" ? "fallback" : "live"
    return `${item.method} ${item.path} -> ${item.status}${item.note ? `（${item.note}；${sourceTag}）` : `（${sourceTag}）`}`
  })
}

function pickActionCandidates(data = {}) {
  const candidates = []
  const operatorConsole = data.operatorConsole ?? {}
  const actionCenter = data.actionCenter ?? {}

  const actionArrays = [
    get(operatorConsole, "next_best_actions", []),
    get(actionCenter, "prioritized_actions", []),
    get(data, "productsMinimalDiagnostic.recommendations", []),
    get(data, "ordersMinimalDiagnostic.recommendations", []),
    get(data, "operationsMinimalDiagnostic.recommendations", [])
  ]

  actionArrays.forEach((items) => {
    if (!Array.isArray(items)) {
      return
    }

    items.forEach((item) => {
      candidates.push(normalizeAction(item, {
        owner: "运营",
        wika_support: "已能给出问题、证据、优先级与人工接手前的准备层。"
      }))
    })
  })

  candidates.push(
    normalizeAction({
      priority: "P1",
      action: "先补 task3 所需的 schema 必填字段、分类属性和媒体素材",
      why: "这是 task3、task4、task5 三层输入质量的共同源头，当前也是最明确的系统阻塞。",
      expected_benefit: "先提升产品准备质量，再减少 reply/order 外部草稿缺字段。",
      owner: "运营负责人 + 商品维护同事",
      wika_support: "product-draft-workbench 和 product-draft-preview 已能输出缺失字段、风险和推荐下一步。",
      severity: "high",
      impact_score: 5
    }),
    normalizeAction({
      priority: "P1",
      action: "把 reply-preview 暴露出的 final_quote、lead_time、mockup_assets 缺口变成销售跟进清单",
      why: "当前 task4 不缺草稿能力，缺的是最后一跳的商业信息确认。",
      expected_benefit: "减少销售来回补信息，提高外部回复草稿可用度。",
      owner: "销售",
      wika_support: "reply-preview 和 reply-draft 已能输出 missing_context、hard_blockers 和 handoff 字段。",
      severity: "high",
      impact_score: 4
    }),
    normalizeAction({
      priority: "P2",
      action: "针对高优先产品先做详情、关键词和主图补强",
      why: "当前产品层最明确的问题不是没有商品，而是内容完整度和关键词准备不足。",
      expected_benefit: "提高流量承接质量，减少“有流量、没询盘”的情况。",
      owner: "运营",
      wika_support: "products/minimal-diagnostic、content optimization layer 和 action-center 已能输出整改方向。",
      severity: "medium",
      impact_score: 4
    }),
    normalizeAction({
      priority: "P2",
      action: "把 order-workbench / order-preview 里的必填条款变成订单交接检查表",
      why: "当前 task5 已有草稿包，但 buyer、价格、付款和交期仍依赖人工确认。",
      expected_benefit: "减少跟单阶段的缺项和反复确认。",
      owner: "销售 / 跟单",
      wika_support: "order-workbench、order-preview、order-draft 已能输出 required_manual_fields 和质量门槛。",
      severity: "medium",
      impact_score: 3
    }),
    normalizeAction({
      priority: "P3",
      action: "建立 operator-console 周复盘机制，统一看经营态势、优先动作和跨层阻塞",
      why: "当前系统已经具备多层消费能力，真正缺的是固定使用节奏。",
      expected_benefit: "让 summary、diagnostic、comparison、workbench 和 preview 形成稳定例行机制。",
      owner: "管理层 + 运营负责人",
      wika_support: "business-cockpit、action-center、operator-console 已能形成统一消费视图。",
      severity: "low",
      impact_score: 2
    })
  )

  return candidates.filter(Boolean)
}

function buildFindings(facts = {}) {
  return prioritizeFindings([
    {
      title: "店铺层仍能稳定读取活跃度与点击相关指标",
      evidence: `当前 official confirmed 店铺字段为 ${joinList(facts.storeOfficialFields)}，comparison 仍可给出上一可比窗口变化。`,
      impact: "当前优先级更应该放在承接质量和内容准备，而不是先假设店铺流量塌陷。",
      severity: "high",
      impact_score: 4
    },
    {
      title: "产品层主要短板是内容完整度和关键词准备，而不是单纯没有商品",
      evidence: `missing_description_count=${formatNumber(facts.productMissingDescription)}，missing_keywords_count=${formatNumber(facts.productMissingKeywords)}，low_score_count=${formatNumber(facts.productLowScore)}。`,
      impact: "如果不先补内容质量，流量增长也未必转成询盘和订单。",
      severity: "high",
      impact_score: 5
    },
    {
      title: "订单层已经形成可用的 conservative derived summary",
      evidence: `formal_summary、product_contribution、trend_signal 已成立，country_structure 仍 unavailable。`,
      impact: "已经能支撑履约、回款和主力产品贡献判断，但还不能做国家结构判断。",
      severity: "medium",
      impact_score: 3
    },
    {
      title: "task3/4/5 当前最强的是准备层、预览层和交接层，不是平台内执行层",
      evidence: "product-draft-workbench / reply-workbench / order-workbench 和对应 preview、draft route 均已在线可用。",
      impact: "WIKA 已能大量替代整理、汇总和预览工作，但最终发布、回复和创单仍需人工接手。",
      severity: "medium",
      impact_score: 4
    }
  ])
}

function buildProblems(facts = {}) {
  return prioritizeProblems([
    {
      title: "来源与国家维度仍不可见",
      why: `当前仍缺 ${joinList(facts.unavailableDimensions.filter((item) => item.includes("source") || item.includes("country") || item.includes("quick_reply_rate")))}。`,
      consequence: "经营判断仍只能停在整体变好 / 变坏，不能进入来源归因和国家策略。",
      severity: "high",
      impact_score: 5
    },
    {
      title: "高流量商品的内容与结构短板仍未收口",
      why: "商品详情、关键词和 score 缺口会直接影响询盘承接和 task3 输入质量。",
      consequence: "会继续出现“有流量、没转化”的经营噪音。",
      severity: "high",
      impact_score: 5
    },
    {
      title: "订单层国家结构仍 unavailable",
      why: "现有 orders/list、orders/detail、orders/fund、orders/logistics 都没有稳定国家结构字段可汇总。",
      consequence: "无法做跨国家订单结构判断，也无法判断订单增长来自哪些市场。",
      severity: "medium",
      impact_score: 3
    },
    {
      title: "task3/4/5 仍不是平台内闭环",
      why: "低风险写侧边界尚未被证明，task3/4/5 仍停留在 preview、draft 和 handoff 层。",
      consequence: "业务方仍需要人工完成最后一跳，不能误以为系统已经能自动执行。",
      severity: "medium",
      impact_score: 4
    }
  ])
}

function buildBlindSpots(facts = {}) {
  return [
    {
      dimension: "店铺来源与国家维度",
      impact: "当前没有 `traffic_source`、`country_source`、`quick_reply_rate`，因此不能做渠道归因、国家归因和完整回复效率判断。"
    },
    {
      dimension: "产品来源与完整周期变化",
      impact: "当前没有 `access_source`、`inquiry_source`、`country_source`、`period_over_period_change`，因此产品层来源分析和完整周期判断仍受限。"
    },
    {
      dimension: "订单国家结构",
      impact: "`country_structure` 仍 unavailable，因此订单层只能做 conservative summary，不能做国家结构判断。"
    },
    {
      dimension: "平台内执行闭环",
      impact: "task3/4/5 仍没有低风险写侧边界证明，当前所有结论都只能停留在消费层、准备层和人工接手层。"
    }
  ]
}

function buildBoundaryStatement(facts = {}) {
  return {
    official_confirmed: [
      `店铺级 official fields：${joinList(facts.storeOfficialFields)}`,
      `产品级 official fields：${joinList(facts.productOfficialFields)}`,
      "订单级官方原始只读基础来自 orders/list、orders/detail、orders/fund、orders/logistics"
    ],
    derived_layers: [
      "store / product / order comparison",
      "formal_summary / product_contribution / trend_signal",
      "business-cockpit / action-center / operator-console",
      "task3/4/5 workbench / preview / draft package"
    ],
    unavailable_dimensions: facts.unavailableDimensions,
    notes: [
      "当前不是完整经营驾驶舱。",
      "task3 / task4 / task5 当前仍不是平台内闭环。",
      "task6 excluded。",
      "no write action attempted。"
    ]
  }
}

function buildScore(report = {}) {
  const vetoErrors = []
  if ((report.executive_summary ?? []).length === 0) {
    vetoErrors.push("没有执行摘要")
  }
  if (
    (report.prioritized_actions?.P1 ?? []).length === 0 &&
    (report.prioritized_actions?.P2 ?? []).length === 0 &&
    (report.prioritized_actions?.P3 ?? []).length === 0
  ) {
    vetoErrors.push("没有优先行动")
  }
  if ((report.blind_spots ?? []).length === 0) {
    vetoErrors.push("没有盲区说明")
  }

  const dimensions = [
    {
      name: "结论清晰度",
      score: report.executive_summary.length >= 4 ? 5 : 4,
      reason: "执行摘要先写结论，并明确当前最严重问题、优先动作与盲区。"
    },
    {
      name: "数据有效性",
      score: report.route_success_count >= 12 ? 5 : 4,
      reason: "核心生产只读链路成功数足够，正文结论均可追溯到当前 route 与证据。"
    },
    {
      name: "判断可信度",
      score: 5,
      reason: "判断严格区分 official、derived 与 unavailable，没有把 derived 当 official。"
    },
    {
      name: "建议可执行性",
      score: 5,
      reason: "每条优先行动都明确写了做什么、为什么、预期收益、执行人和 WIKA 支持范围。"
    },
    {
      name: "优先级明确性",
      score:
        report.prioritized_actions.P1.length > 0 &&
        report.prioritized_actions.P2.length > 0 &&
        report.prioritized_actions.P3.length > 0
          ? 5
          : 4,
      reason: "动作已按 P1 / P2 / P3 分层，不再是无顺序的数据堆砌。"
    },
    {
      name: "对业务方可读性",
      score: 5,
      reason: "正文先讲结论、问题和动作，再补证据与边界，适合老板、运营和销售直接阅读。"
    },
    {
      name: "盲区表达完整性",
      score: 5,
      reason: "关键盲区单独成章，并明确它们对判断的影响。"
    },
    {
      name: "排版清晰度",
      score: 5,
      reason: "统一按执行摘要、发现、问题、行动、盲区、边界和自评输出，适合开会使用。"
    }
  ]

  const totalScore = dimensions.reduce((sum, item) => sum + item.score, 0)
  const deliveryThreshold = 32

  return {
    total_score: totalScore,
    max_score: 40,
    delivery_threshold: deliveryThreshold,
    veto_errors: vetoErrors,
    pass: vetoErrors.length === 0 && totalScore >= deliveryThreshold,
    dimensions
  }
}

export function buildReportModel(context = {}) {
  const data = context.data ?? {}
  const routeUsage = context.route_usage ?? []
  const unavailableDimensions = collectUnavailable(data)
  const storeOfficialFields = ["visitor", "imps", "clk", "clk_rate", "fb", "reply"]
  const productOfficialFields = [
    "click",
    "impression",
    "visitor",
    "fb",
    "order",
    "bookmark",
    "compare",
    "share",
    "keyword_effects"
  ]

  const facts = {
    unavailableDimensions,
    storeOfficialFields,
    productOfficialFields,
    productMissingDescription: get(
      data,
      "productsMinimalDiagnostic.content_completeness_findings.missing_description_count"
    ),
    productMissingKeywords: get(
      data,
      "productsMinimalDiagnostic.content_completeness_findings.missing_keywords_count"
    ),
    productLowScore: get(data, "productsMinimalDiagnostic.score_summary.quality_score.low_score_count")
  }

  const coreFindings = buildFindings(facts)
  const keyProblems = buildProblems(facts)
  const prioritizedActions = prioritizeActions(pickActionCandidates(data), { perBucket: 3 })
  const blindSpots = buildBlindSpots(facts)

  const report = {
    title: "WIKA 运营示范报告",
    generated_at: context.generated_at,
    template_reference: "WIKA_经营诊断报告模板.md",
    route_success_count: routeUsage.filter((item) => item.success).length,
    route_failure_count: routeUsage.filter((item) => !item.success).length,
    route_usage: routeUsage,
    executive_summary: [
      "当前最严重的问题不是“数据不够”，而是高流量商品没有稳定转成高质量承接和后续动作；因此报告的重点应该是先收敛问题和动作，而不是继续堆字段。",
      `店铺层当前仍能稳定读取 ${joinList(storeOfficialFields)}，说明整体经营信号可读，但来源和国家维度仍不可见。`,
      `产品层当前最明确的短板是内容完整度和关键词准备：missing_description_count=${formatNumber(facts.productMissingDescription)}，missing_keywords_count=${formatNumber(facts.productMissingKeywords)}，low_score_count=${formatNumber(facts.productLowScore)}。`,
      "订单层已经能给出 formal_summary、product_contribution、trend_signal，但 country_structure 仍 unavailable，因此只能做 conservative order judgement。",
      "task3 / task4 / task5 当前已经形成工作台、预览和外部草稿消费层，但最后一跳仍需人工接手，不是平台内闭环。"
    ],
    core_findings: coreFindings,
    key_problems: keyProblems,
    prioritized_actions: prioritizedActions,
    store_diagnosis: [
      `店铺层当前可读 official 指标：visitor=${formatNumber(get(data, "operationsManagementSummary.official_metrics.visitor"))}、imps=${formatNumber(get(data, "operationsManagementSummary.official_metrics.imps"))}、clk=${formatNumber(get(data, "operationsManagementSummary.official_metrics.clk"))}、clk_rate=${formatPercent(get(data, "operationsManagementSummary.official_metrics.clk_rate"))}、fb=${formatNumber(get(data, "operationsManagementSummary.official_metrics.fb"))}、reply=${formatPercent(get(data, "operationsManagementSummary.official_metrics.reply"))}。`,
      `店铺 comparison 当前仍能给出 visitor / imps / clk / fb / reply 的可比窗口变化，因此可以判断整体是稳、弱还是抬升，但不能判断具体来源归因。`,
      `当前店铺层最主要的判断限制仍是 ${joinList(get(data, "operationsManagementSummary.unavailable_dimensions", []))}。`,
      "因此，店铺层当前更适合回答“整体有没有变好”，不适合回答“哪类国家、渠道或回复效率在驱动变化”。"
    ],
    product_diagnosis: [
      `产品 summary 当前仍带 sample 边界：product_scope_limit=${formatNumber(get(data, "productsManagementSummary.product_scope_limit"))}，product_scope_truncated=${String(get(data, "productsManagementSummary.product_scope_truncated"))}。`,
      `产品聚合指标当前可读：click=${formatNumber(get(data, "productsManagementSummary.aggregate_official_metrics.click"))}、impression=${formatNumber(get(data, "productsManagementSummary.aggregate_official_metrics.impression"))}、visitor=${formatNumber(get(data, "productsManagementSummary.aggregate_official_metrics.visitor"))}、order=${formatNumber(get(data, "productsManagementSummary.aggregate_official_metrics.order"))}。`,
      `高优先样本商品可从 ranking section 中识别，例如：${joinList(topProducts(get(data, "productsManagementSummary.ranking_sections.top_products_by_impression", [])), "；")}。`,
      "产品层当前最主要问题仍是详情、关键词、score 与结构维护，而不是单纯没有商品。",
      `产品层最主要的 unavailable 维度仍是 ${joinList(get(data, "productsManagementSummary.unavailable_dimensions", []))}。`
    ],
    order_diagnosis: [
      `订单 formal_summary 当前可读 total_order_count=${formatNumber(get(data, "ordersManagementSummary.formal_summary.total_order_count"))}，observed_trade_count=${formatNumber(get(data, "ordersManagementSummary.formal_summary.observed_trade_count"))}。`,
      `订单 comparison 当前可读 observed_order_count_delta=${formatNumber(get(data, "ordersComparisonSummary.derived_comparison.observed_order_count_delta.delta_value"))}，可用于判断近期订单活跃度变化方向。`,
      `订单层已经能识别主力贡献商品，例如：${joinList(topProducts(get(data, "ordersManagementSummary.product_contribution.top_products_by_order_count", []), "order_count"), "；")}。`,
      "订单层当前已经够做履约和主力商品判断，但还不能做国家结构判断。",
      `订单层最主要的 unavailable 维度仍是 ${joinList(get(data, "ordersManagementSummary.unavailable_dimensions", []))}。`
    ],
    cross_layer_judgement: [
      "店铺层流量信号仍可读，但产品层内容和结构准备不足，说明问题更偏承接链，而不是完全没有流量。",
      "task3 的 schema、属性和媒体缺口会直接降低 task4 / task5 的输入质量，这是当前三层共振的关键阻塞。",
      "订单层已经能对履约和贡献做 conservative judgement，但来源和国家盲区仍阻止更细的经营判断。",
      `跨层最影响判断的盲区仍是 ${joinList(unavailableDimensions)}。`
    ],
    task3_assessment: [
      "WIKA 当前已经能在 task3 上提供 schema-aware 的安全草稿准备、缺字段识别、风险提示和人工交接前的完整准备层。",
      `当前 product-draft-workbench 的 ready_for_publish=${String(get(data, "productDraftWorkbench.draft_readiness.ready_for_publish"))}，说明系统已能判断是否具备发布前置条件，但不进入真实发布。`,
      `当前 task3 最需要人工补的仍是 ${joinList(get(data, "productDraftWorkbench.required_manual_fields.missing_requirements", []))}。`,
      "因此，task3 当前最大价值是显著减少人工整理时间，而不是替代平台内商品发布。"
    ],
    task4_assessment: [
      "WIKA 当前已经能在 task4 上提供 reply-workbench、reply-preview 和 reply-draft，帮助销售快速形成外部回复草稿。",
      `reply-preview 当前最关键的 missing_context 是 ${joinList(get(data, "replyPreview.missing_context", []))}。`,
      "因此，task4 当前最大价值是提前把缺失上下文和回复结构整理清楚，而不是直接平台内发送。"
    ],
    task5_assessment: [
      "WIKA 当前已经能在 task5 上提供 order-workbench、order-preview 和 order-draft，帮助跟单形成外部订单草稿。",
      `当前 task5 最需要人工确认的字段仍是 ${joinList(get(data, "orderWorkbench.required_manual_field_system.required_manual_fields", []))}。`,
      "因此，task5 当前最大价值是把订单输入、条款和交接资料整理标准化，而不是直接平台内创单。"
    ],
    replacement_assessment: [
      "能完全自动完成：summary、diagnostic、comparison、business-cockpit、action-center、operator-console、task-workbench 这一层的读取、汇总和排序。",
      "能自动完成大部分但仍需人工确认：product-draft-preview、reply-preview、order-preview，以及 reply/order 外部草稿包。",
      "只能做到准备层 / 交接层：task3 商品准备、task4 回复上下文整理、task5 订单条款整理。",
      "当前完全不能替代：平台内发布、平台内回复、平台内创单，以及 unavailable 维度对应的判断。"
    ],
    blind_spots: blindSpots,
    boundary_statement: buildBoundaryStatement(facts),
    data_sources: collectSourceLines(routeUsage)
  }

  report.self_score = buildScore(report)
  return report
}
