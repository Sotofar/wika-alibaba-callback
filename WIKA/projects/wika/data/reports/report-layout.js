function section(title, lines = []) {
  const content = lines.filter(Boolean)
  if (content.length === 0) {
    return []
  }

  return [`## ${title}`, "", ...content, ""]
}

function bullets(items = []) {
  return items.filter(Boolean).map((item) => `- ${item}`)
}

function flattenActions(actions = {}) {
  return ["P1", "P2", "P3"].flatMap((priority) => actions[priority] ?? [])
}

function renderFindings(items = [], prefix) {
  const lines = []
  items.forEach((item, index) => {
    lines.push(`### ${prefix} ${index + 1}`)
    lines.push(`- ${prefix === "发现" ? "发现" : "问题"}：${item.title}`)
    if (prefix === "发现") {
      lines.push(`- 证据：${item.evidence}`)
      lines.push(`- 影响：${item.impact}`)
    } else {
      lines.push(`- 为什么重要：${item.why}`)
      lines.push(`- 如果不处理会怎样：${item.consequence}`)
    }
    lines.push("")
  })
  return lines
}

function renderActions(actions = {}) {
  const lines = []
  ;["P1", "P2", "P3"].forEach((priority) => {
    const title =
      priority === "P1" ? "P1：立即做" : priority === "P2" ? "P2：本周做" : "P3：后续跟进"
    lines.push(`### ${title}`)
    const items = actions[priority] ?? []
    if (items.length === 0) {
      lines.push("- 当前无该优先级动作。")
      lines.push("")
      return
    }

    items.forEach((item) => {
      lines.push(`- 做什么：${item.action}`)
      lines.push(`- 为什么：${item.why}`)
      lines.push(`- 预期收益：${item.expected_benefit}`)
      lines.push(`- 需要谁执行：${item.owner}`)
      lines.push(`- WIKA 当前能支持到什么程度：${item.wika_support}`)
      lines.push("")
    })
  })

  return lines
}

function renderBlindSpots(items = []) {
  return items.map((item) => `- ${item.dimension}：${item.impact}`)
}

function renderBoundary(boundary = {}) {
  return [
    `- official confirmed：${boundary.official_confirmed.join("；")}`,
    `- derived：${boundary.derived_layers.join("；")}`,
    `- unavailable：${boundary.unavailable_dimensions.join("；")}`,
    ...bullets(boundary.notes)
  ]
}

function renderScore(score = {}) {
  const lines = [
    `- 总分：${score.total_score}/${score.max_score}`,
    `- 可交付阈值：${score.delivery_threshold}/${score.max_score}`,
    `- 是否通过：${score.pass ? "通过" : "未通过"}`
  ]

  if ((score.veto_errors ?? []).length > 0) {
    lines.push(`- 一票否决项：${score.veto_errors.join("；")}`)
  } else {
    lines.push("- 一票否决项：无")
  }

  lines.push("")
  lines.push("### 分项得分")
  ;(score.dimensions ?? []).forEach((item) => {
    lines.push(`- ${item.name}：${item.score}/5。${item.reason}`)
  })

  return lines
}

export function renderOpsReportMarkdown(report = {}) {
  const lines = [
    `# ${report.title}`,
    "",
    `生成时间：${report.generated_at}`,
    `模板：${report.template_reference}`,
    ""
  ]

  lines.push(...section("执行摘要", bullets(report.executive_summary)))
  lines.push(...section("核心发现", renderFindings(report.core_findings, "发现")))
  lines.push(...section("关键问题", renderFindings(report.key_problems, "问题")))
  lines.push(...section("优先行动", renderActions(report.prioritized_actions)))
  lines.push(...section("店铺级诊断", bullets(report.store_diagnosis)))
  lines.push(...section("产品级诊断", bullets(report.product_diagnosis)))
  lines.push(...section("订单级诊断", bullets(report.order_diagnosis)))
  lines.push(...section("跨层综合判断", bullets(report.cross_layer_judgement)))
  lines.push(...section("任务 3 现状评估", bullets(report.task3_assessment)))
  lines.push(...section("任务 4 现状评估", bullets(report.task4_assessment)))
  lines.push(...section("任务 5 现状评估", bullets(report.task5_assessment)))
  lines.push(...section("WIKA 当前能替代多少工作", bullets(report.replacement_assessment)))
  lines.push(...section("数据盲区", renderBlindSpots(report.blind_spots)))
  lines.push(...section("边界声明", renderBoundary(report.boundary_statement)))
  lines.push(...section("自评分", renderScore(report.self_score)))
  lines.push(...section("数据源清单", bullets(report.data_sources)))

  return `${lines.join("\n").trim()}\n`
}

export function renderOpsReportSummaryMarkdown(report = {}) {
  const lines = [
    `# ${report.title}摘要`,
    "",
    `生成时间：${report.generated_at}`,
    ""
  ]

  lines.push(...section("给管理层的 5 句话", bullets(report.executive_summary.slice(0, 5))))
  lines.push(...section("最重要的 3 个发现", report.core_findings.slice(0, 3).map((item) => `- ${item.title}`)))
  lines.push(
    ...section(
      "最应该先做的 3 个动作",
      flattenActions(report.prioritized_actions)
        .slice(0, 3)
        .map((item) => `- ${item.action}`)
    )
  )
  lines.push(...section("当前关键盲区", renderBlindSpots(report.blind_spots.slice(0, 5))))
  lines.push(...section("当前边界", renderBoundary(report.boundary_statement)))
  lines.push(...section("自评分", [
    `- 总分：${report.self_score.total_score}/${report.self_score.max_score}`,
    `- 是否通过：${report.self_score.pass ? "通过" : "未通过"}`
  ]))

  return `${lines.join("\n").trim()}\n`
}
