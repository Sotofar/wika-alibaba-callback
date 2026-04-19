import {
  normalizeAction,
  prioritizeActions,
  prioritizeFindings,
  prioritizeProblems
} from "./report-prioritizer.js"
import { scoreReport } from "./report-scoring.js"

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
    const label = shortName(item.product_name ?? item.subject ?? item.product_id ?? "未知商品", 42)
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
    const elapsed = item.elapsed_ms !== null && item.elapsed_ms !== undefined ? `${item.elapsed_ms}ms` : "no-timer"
    return `${item.method} ${item.path} -> ${item.status ?? "failed"}（${item.route_state}；${elapsed}；${item.note ?? "no-note"}）`
  })
}

function buildRouteHealth(routeUsage = []) {
  const fullSuccess = routeUsage.filter((item) => item.route_state === "full_success")
  const degraded = routeUsage.filter((item) => item.route_state === "degraded")
  const failed = routeUsage.filter((item) => item.route_state === "failed")

  const coreAnalyticNames = [
    "operationsManagementSummary",
    "productsManagementSummary",
    "ordersManagementSummary",
    "operationsMinimalDiagnostic",
    "productsMinimalDiagnostic",
    "ordersMinimalDiagnostic",
    "operationsComparisonSummary",
    "productsComparisonSummary",
    "ordersComparisonSummary"
  ]

  const coreFullSuccessCount = routeUsage.filter(
    (item) => coreAnalyticNames.includes(item.name) && item.route_state === "full_success"
  ).length

  const lines = [
    `本次 live 读取中，full_success route 共 ${fullSuccess.length} 条，degraded route 共 ${degraded.length} 条，failed route 共 ${failed.length} 条。`
  ]

  if (degraded.length > 0) {
    lines.push(
      `降级参与的 route：${joinList(
        degraded.map((item) => `${item.path}${item.degraded_reason ? `（${item.degraded_reason}）` : ""}`),
        "无"
      )}。`
    )
  } else {
    lines.push("本次用于报告的高层 route 未发现 degraded 参与。")
  }

  if (failed.length > 0) {
    lines.push(
      `失败 route：${joinList(
        failed.map((item) => `${item.path}${item.note ? `（${item.note}）` : ""}`),
        "无"
      )}。`
    )
  } else {
    lines.push("本次未发现影响报告成立的 failed route。")
  }

  lines.push("核心事实优先回退到 management-summary、minimal-diagnostic、comparison、各 task workbench 等底层稳定 route。")

  return {
    full_success_count: fullSuccess.length,
    degraded_count: degraded.length,
    failed_count: failed.length,
    core_full_success_count: coreFullSuccessCount,
    degraded_routes: degraded.map((item) => item.path),
    failed_routes: failed.map((item) => item.path),
    summary_lines: lines
  }
}

function buildInputStatus(localAssets = {}) {
  const inputEvidence = localAssets.stage45_input_evidence ?? {}
  const templates = inputEvidence.templates ?? {}
  const adsReady = Boolean(templates.ads_csv && templates.ads_json)
  const pageReady = Boolean(templates.page_audit_csv && templates.page_audit_json)

  return [
    adsReady
      ? "广告输入层已产品化：CSV 与 JSON 双模板可用，当前定位仍是 import-driven，不是假装 official ads api 已打通。"
      : "广告输入层当前仍未形成完整正式模板。若无稳定官方入口，广告建议只能停在输入就绪度层。",
    pageReady
      ? "页面人工盘点层已产品化：可把首页模块、banner、核心商品露出、询盘入口、主图和详情问题标准化输入。"
      : "页面人工盘点层模板仍不足，页面优化建议目前只能停在更保守的经验层。",
    "广告 / 页面输入层当前只是把外部样本标准化，不会冒充真实平台行为数据。",
    "一旦补入真实广告样本或人工盘点表，WIKA 可以在现有诊断层之上给出更强的投放和页面优化建议。"
  ]
}

function buildReplacementAssessment() {
  return [
    "WIKA 当前已经能完全自动完成：底层 summary、diagnostic、comparison，以及 business-cockpit 这一层的读取、汇总和排序。",
    "能自动完成大部分但仍需人工确认：product-draft-preview、reply-preview、order-preview，以及 reply / order 外部草稿包；action-center、task-workbench、operator-console 只在 live 稳定时用于排序辅助，若出现 degraded / timeout，必须回退到底层稳定 route。",
    "只能做到准备层 / 交接层：task3 商品准备、task4 回复上下文整理、task5 订单条款整理。",
    "当前完全不能替代：平台内发布、平台内回复、平台内创单，以及 unavailable 维度对应的判断。"
  ]
}

function pickActionCandidates(data = {}, routeUsage = [], localAssets = {}) {
  const candidates = []
  const routeStateByName = Object.fromEntries(routeUsage.map((item) => [item.name, item.route_state]))

  if (routeStateByName.actionCenter === "full_success") {
    const prioritized = get(data, "actionCenter.prioritized_actions", [])
    if (Array.isArray(prioritized)) {
      prioritized.forEach((item) => {
        candidates.push(
          normalizeAction(item, {
            owner: "运营",
            manual_confirmation_required: "需要",
            handoff_mode: "由运营根据动作清单排期执行。",
            wika_support: "已能输出排序后的动作提示，但仍需人工确认。"
          })
        )
      })
    }
  }

  if (routeStateByName.operatorConsole === "full_success") {
    const nextBestActions = get(data, "operatorConsole.next_best_actions", [])
    if (Array.isArray(nextBestActions)) {
      nextBestActions.forEach((item) => {
        candidates.push(
          normalizeAction(item, {
            owner: "运营负责人",
            manual_confirmation_required: "需要",
            handoff_mode: "由管理层或运营负责人决定是否进入执行排期。",
            wika_support: "已能输出统一控制台层的下一步动作建议。"
          })
        )
      })
    }
  }

  candidates.push(
    normalizeAction({
      priority: "P1",
      action: "先补 task3 所需的 schema 必填字段、分类属性和媒体素材",
      why: "这是 task3、task4、task5 三层输入质量的共同源头，也是当前最明确的经营阻塞。",
      expected_benefit: "先提升商品准备质量，再减少 reply / order 草稿缺字段。",
      owner: "运营负责人 + 商品维护同事",
      wika_support: "product-draft-workbench 和 product-draft-preview 已能输出缺失字段、阻塞项和推荐下一步。",
      manual_confirmation_required: "需要",
      handoff_mode: "人工补齐字段与媒体后，再回到 workbench / preview 复核。",
      severity: "high",
      impact_score: 5
    }),
    normalizeAction({
      priority: "P1",
      action: "把 reply-preview 暴露出的 final_quote、lead_time、mockup_assets 缺口变成销售跟进清单",
      why: "当前 task4 不缺草稿能力，缺的是报价、交期和样稿上下文。",
      expected_benefit: "减少销售来回补信息，提高外部回复草稿可用度。",
      owner: "销售",
      wika_support: "reply-preview 和 reply-draft 已能输出 missing_context、hard_blockers 和 handoff 字段。",
      manual_confirmation_required: "必须",
      handoff_mode: "由销售补齐报价、交期和素材后再出最终回复。",
      severity: "high",
      impact_score: 4
    }),
    normalizeAction({
      priority: "P2",
      action: "针对高优先商品先做详情、关键词和主图补强",
      why: "当前产品层最明确的问题不是没有商品，而是内容完整度和关键词准备不足。",
      expected_benefit: "提高流量承接质量，减少“有流量、没转化”的情况。",
      owner: "产品运营",
      wika_support: "products/minimal-diagnostic、content optimization layer 和 action-center 已能输出整改方向。",
      manual_confirmation_required: "需要",
      handoff_mode: "由产品运营按优先级逐个商品整改。",
      severity: "high",
      impact_score: 4
    }),
    normalizeAction({
      priority: "P2",
      action: "把 order-workbench / order-preview 里的必填条款变成订单交接检查表",
      why: "当前 task5 已有草稿包，但 buyer、价格、付款和交期仍依赖人工确认。",
      expected_benefit: "减少跟单阶段的缺项和反复确认。",
      owner: "销售 / 跟单",
      wika_support: "order-workbench、order-preview、order-draft 已能输出 required_manual_fields 和质量门槛。",
      manual_confirmation_required: "必须",
      handoff_mode: "由销售 / 跟单按检查表逐项补齐后执行。",
      severity: "medium",
      impact_score: 4
    }),
    normalizeAction({
      priority: "P3",
      action: "按广告导入模板补入一周真实广告样本",
      why: "广告分析层已经产品化，但没有真实样本时只能停在输入 readiness，不足以形成稳定投放结论。",
      expected_benefit: "一旦有真实样本，就能快速进入广告诊断和投放建议层。",
      owner: "运营负责人",
      wika_support: "广告 CSV / JSON 模板、字段契约和导入说明已经齐全。",
      manual_confirmation_required: "需要",
      handoff_mode: "由运营导出或整理样本后导入标准模板。",
      severity: "medium",
      impact_score: 3
    }),
    normalizeAction({
      priority: "P3",
      action: "做一次首页和重点商品页人工盘点，并按模板录入",
      why: "当前页面级真实行为数据不可得，页面建议要从保守推断升级，需要人工盘点输入支撑。",
      expected_benefit: "让页面优化建议从经验层升级为“数据 + 盘点”的组合判断。",
      owner: "店铺运营",
      wika_support: "页面人工盘点模板和页面优化建议层已经准备好。",
      manual_confirmation_required: "必须",
      handoff_mode: "由店铺运营现场盘点后录入标准模板。",
      severity: "medium",
      impact_score: 3
    }),
    normalizeAction({
      priority: "P3",
      action: "建立 operator-console 周复盘机制，固定用同一套报告和动作清单开会",
      why: "当前系统已经具备多层消费能力，真正缺的是固定使用节奏。",
      expected_benefit: "让 summary、diagnostic、comparison、workbench 和 preview 形成稳定例行机制。",
      owner: "管理层 + 运营负责人",
      wika_support: "business-cockpit、action-center、operator-console 已能形成统一消费视图。",
      manual_confirmation_required: "需要",
      handoff_mode: "由管理层拍板周会节奏，运营负责人维护动作清单。",
      severity: "low",
      impact_score: 2
    })
  )

  return candidates.filter(Boolean)
}

function buildFindings(facts = {}) {
  return prioritizeFindings([
    {
      title: "店铺层当前没有出现“整体流量塌陷”的直接证据",
      evidence: `当前店铺仍能稳定读取 ${joinList(facts.storeOfficialFields)}，comparison 仍可输出可比窗口变化。`,
      impact: "当前优先级更应该放在承接质量和内容准备，而不是先假设整体流量已经失控。",
      severity: "high",
      impact_score: 4
    },
    {
      title: "产品层最明确的短板是内容完整度和关键词准备，而不是单纯没有商品",
      evidence: `missing_description_count=${formatNumber(facts.productMissingDescription)}，missing_keywords_count=${formatNumber(facts.productMissingKeywords)}，low_score_count=${formatNumber(facts.productLowScore)}。`,
      impact: "如果不先补内容质量，流量增长也未必转成询盘和订单。",
      severity: "high",
      impact_score: 5
    },
    {
      title: "订单层已经能做 conservative summary，但国家结构仍不可见",
      evidence: `formal_summary、product_contribution、trend_signal 已成立，country_structure 仍 unavailable。`,
      impact: "已经够做履约和主力商品判断，但还不能做国家市场判断。",
      severity: "medium",
      impact_score: 4
    },
    {
      title: "task3 / task4 / task5 当前最强的是准备层、预览层和交接层，不是平台内执行层",
      evidence: "product-draft-workbench、reply-workbench、order-workbench 及对应 preview / draft 路由均已在线可用。",
      impact: "WIKA 已能大幅替代整理、汇总和预览工作，但最终发布、回复和创单仍需人工接手。",
      severity: "medium",
      impact_score: 4
    },
    {
      title: "广告与页面层已经具备正式输入口，但仍依赖外部样本进入",
      evidence: facts.inputLayerSummary,
      impact: "这意味着广告和页面建议能力不再卡在“没有入口”，但当前仍不能伪装成自动抓取已完成。",
      severity: "medium",
      impact_score: 3
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
      title: "高价值商品的内容与结构短板仍未收口",
      why: "商品详情、关键词和 score 缺口会直接影响询盘承接和 task3 输入质量。",
      consequence: "会继续出现“有流量、没转化”的经营噪音。",
      severity: "high",
      impact_score: 5
    },
    {
      title: "task3 / task4 / task5 仍不是平台内闭环",
      why: "低风险写侧边界尚未被证明，task3/4/5 仍停留在 preview、draft 和 handoff 层。",
      consequence: "业务方仍需要人工完成最后一跳，不能误以为系统已经能自动执行。",
      severity: "medium",
      impact_score: 4
    },
    {
      title: "广告与页面优化仍依赖外部样本输入",
      why: "当前导入层已产品化，但没有真实样本时，广告诊断和页面优化只能停在 readiness 或 conservative recommendation。",
      consequence: "这些建议无法自然升级成更强的实际判断。",
      severity: "medium",
      impact_score: 3
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
      dimension: "广告与页面行为样本",
      impact: "广告和页面层已经有输入口，但若没有真实导出样本或人工盘点表，建议只能停在导入就绪度或保守建议层。"
    },
    {
      dimension: "平台内执行闭环",
      impact: "task3/4/5 仍没有低风险写侧边界证明，当前所有结论都只能停留在消费层、准备层和人工接手层。"
    }
  ]
}

function buildBoundaryStatement(facts = {}, routeHealth = {}) {
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
      "task3 / task4 / task5 workbench / preview / draft package",
      "广告与页面输入层上的诊断建议"
    ],
    unavailable_dimensions: facts.unavailableDimensions,
    degraded_route_participation:
      routeHealth.degraded_count > 0
        ? `本次检测到 degraded route：${joinList(routeHealth.degraded_routes)}；这些 route 只用于辅助排序或 readiness 提示，核心事实回退到底层稳定 route。`
        : "本次用于报告的 route 未发现 degraded 参与，正文事实均来自 live full_success。",
    notes: [
      "当前不是完整经营驾驶舱。",
      "task3 / task4 / task5 当前仍不是平台内闭环。",
      "task6 excluded。",
      "no write action attempted。"
    ]
  }
}

export function buildReportModel(context = {}) {
  const data = context.data ?? {}
  const routeUsage = context.route_usage ?? []
  const localAssets = context.local_assets ?? {}
  const routeHealth = buildRouteHealth(routeUsage)

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
    productLowScore: get(data, "productsMinimalDiagnostic.score_summary.quality_score.low_score_count"),
    inputLayerSummary: buildInputStatus(localAssets).join(" ")
  }

  const coreFindings = buildFindings(facts)
  const keyProblems = buildProblems(facts)
  const prioritizedActions = prioritizeActions(pickActionCandidates(data, routeUsage, localAssets), { perBucket: 3 })
  const blindSpots = buildBlindSpots(facts)

  const report = {
    title: "WIKA 运营示范报告",
    generated_at: context.generated_at,
    template_reference: "WIKA_经营诊断报告模板.md",
    route_health: routeHealth,
    route_usage: routeUsage,
    route_success_count: routeUsage.filter((item) => item.route_state === "full_success").length,
    route_degraded_count: routeUsage.filter((item) => item.route_state === "degraded").length,
    route_failure_count: routeUsage.filter((item) => item.route_state === "failed").length,
    section_order: [
      "A. 执行摘要",
      "B. 核心发现",
      "C. 关键问题",
      "D. 优先行动",
      "E. 店铺诊断",
      "F. 产品诊断",
      "G. 订单诊断",
      "H. 广告 / 页面输入层状态",
      "I. 跨层综合判断",
      "J. 任务 3 现状评估",
      "K. 任务 4 现状评估",
      "L. 任务 5 现状评估",
      "M. 工作量替代评估",
      "N. 数据盲区",
      "O. 路由健康与证据约束",
      "P. 边界声明",
      "Q. 自评分",
      "R. 数据源清单"
    ],
    executive_summary: [
      "当前整体问题不在“没有数据”，而在“已有数据没有被收敛成更强的经营动作”；因此本报告先讲问题和动作，不再先堆字段。",
      `店铺层仍能稳定读取 ${joinList(storeOfficialFields)}，说明整体经营信号可读，但来源和国家维度仍不可见。`,
      `产品层当前最明确的短板是内容完整度和关键词准备：missing_description_count=${formatNumber(facts.productMissingDescription)}，missing_keywords_count=${formatNumber(facts.productMissingKeywords)}，low_score_count=${formatNumber(facts.productLowScore)}。`,
      "订单层已经能给出 formal_summary、product_contribution、trend_signal，但 country_structure 仍 unavailable，因此只能做保守订单判断。",
      "task3 / task4 / task5 当前已经形成工作台、预览和外部草稿消费层，但最后一跳仍需人工接手，不是平台内闭环。",
      routeHealth.degraded_count > 0
        ? `本次报告检测到 ${routeHealth.degraded_count} 条 degraded route，因此高层聚合结果只作为辅助排序，核心事实回退到底层稳定 route。`
        : "本次报告未检测到影响正文结论的 degraded route，核心事实均来自 live full_success。"
    ],
    core_findings: coreFindings,
    key_problems: keyProblems,
    prioritized_actions: prioritizedActions,
    store_diagnosis: [
      `店铺层当前可读 official 指标：visitor=${formatNumber(get(data, "operationsManagementSummary.official_metrics.visitor"))}、imps=${formatNumber(get(data, "operationsManagementSummary.official_metrics.imps"))}、clk=${formatNumber(get(data, "operationsManagementSummary.official_metrics.clk"))}、clk_rate=${formatPercent(get(data, "operationsManagementSummary.official_metrics.clk_rate"))}、fb=${formatNumber(get(data, "operationsManagementSummary.official_metrics.fb"))}、reply=${formatPercent(get(data, "operationsManagementSummary.official_metrics.reply"))}。`,
      "店铺层 comparison 仍可给出 visitor / imps / clk / fb / reply 的可比窗口变化，因此当前仍能判断整体是稳、弱还是抬升。",
      `当前店铺层最主要的判断限制仍是 ${joinList(get(data, "operationsManagementSummary.unavailable_dimensions", []))}。`,
      "因此，店铺层当前适合回答“整体有没有变好”，不适合回答“哪类国家、渠道或回复效率在驱动变化”。"
    ],
    product_diagnosis: [
      `产品 summary 当前仍带 sample 边界：product_scope_limit=${formatNumber(get(data, "productsManagementSummary.product_scope_limit"))}，product_scope_truncated=${String(get(data, "productsManagementSummary.product_scope_truncated"))}。`,
      `产品聚合指标当前可读：click=${formatNumber(get(data, "productsManagementSummary.aggregate_official_metrics.click"))}、impression=${formatNumber(get(data, "productsManagementSummary.aggregate_official_metrics.impression"))}、visitor=${formatNumber(get(data, "productsManagementSummary.aggregate_official_metrics.visitor"))}、order=${formatNumber(get(data, "productsManagementSummary.aggregate_official_metrics.order"))}。`,
      `当前可优先关注的样本商品例如：${joinList(topProducts(get(data, "productsManagementSummary.ranking_sections.top_products_by_impression", [])), "暂无稳定样本商品")}。`,
      "产品层当前最主要问题仍是详情、关键词、score 与结构维护，而不是单纯没有商品。",
      `产品层最主要的 unavailable 维度仍是 ${joinList(get(data, "productsManagementSummary.unavailable_dimensions", []))}。`
    ],
    order_diagnosis: [
      `订单 formal_summary 当前可读 total_order_count=${formatNumber(get(data, "ordersManagementSummary.formal_summary.total_order_count"))}，observed_trade_count=${formatNumber(get(data, "ordersManagementSummary.formal_summary.observed_trade_count"))}。`,
      `订单 comparison 当前可读 observed_order_count_delta=${formatNumber(get(data, "ordersComparisonSummary.derived_comparison.observed_order_count_delta.delta_value"))}，可用于判断近期订单活跃度变化方向。`,
      `订单层当前可识别的主力贡献商品例如：${joinList(topProducts(get(data, "ordersManagementSummary.product_contribution.top_products_by_order_count", []), "order_count"), "暂无稳定贡献样本。")}。`,
      "订单层当前已经够做履约和主力商品判断，但还不能做国家结构判断。",
      `订单层最主要的 unavailable 维度仍是 ${joinList(get(data, "ordersManagementSummary.unavailable_dimensions", []))}。`
    ],
    ads_and_page_input_status: buildInputStatus(localAssets),
    cross_layer_judgement: [
      "店铺层活跃度仍可读，但产品层内容和结构准备不足，说明当前问题更偏承接链，而不是完全没有流量。",
      "task3 的 schema、属性和媒体缺口，会直接降低 task4 / task5 的输入质量，这是当前三层共振的关键阻塞。",
      "订单层已经能对履约和贡献做保守判断，但来源和国家盲区仍阻止更细的经营归因。",
      `跨层最影响判断的盲区仍是 ${joinList(unavailableDimensions)}。`
    ],
    task3_assessment: [
      "WIKA 当前已经能在 task3 上提供 schema-aware 的安全草稿准备、缺字段识别、风险提示和人工交接前的准备层。",
      `当前 product-draft-workbench 的 ready_for_publish=${String(get(data, "productDraftWorkbench.draft_readiness.ready_for_publish"))}，说明系统已能判断是否具备发布前置条件，但不会进入真实发布。`,
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
      "能完全自动完成：summary、diagnostic、comparison、business-cockpit、action-center、operator-console 这一层的读取、汇总和排序。",
      "能自动完成大部分但仍需人工确认：product-draft-preview、reply-preview、order-preview，以及 reply / order 外部草稿包。",
      "只能做到准备层 / 交接层：task3 商品准备、task4 回复上下文整理、task5 订单条款整理。",
      "当前完全不能替代：平台内发布、平台内回复、平台内创单，以及 unavailable 维度对应的判断。"
    ],
    blind_spots: blindSpots,
    route_health_summary: routeHealth.summary_lines,
    boundary_statement: buildBoundaryStatement(facts, routeHealth),
    data_sources: collectSourceLines(routeUsage)
  }

  report.replacement_assessment = buildReplacementAssessment()
  report.self_score = scoreReport(report)
  return report
}
