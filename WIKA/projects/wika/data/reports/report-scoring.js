function joinText(values = []) {
  return values.filter(Boolean).join("\n")
}

function flattenActions(actions = {}) {
  return ["P1", "P2", "P3"].flatMap((priority) => actions[priority] ?? [])
}

function hasText(value) {
  return typeof value === "string" && value.trim() !== ""
}

function rawDumpDetected(report = {}) {
  const samples = [
    ...(report.executive_summary ?? []),
    ...(report.store_diagnosis ?? []),
    ...(report.product_diagnosis ?? []),
    ...(report.order_diagnosis ?? []),
    ...(report.route_health_summary ?? [])
  ]

  return samples.some((item) => /^\s*[{[]/.test(item) || /"\w+"\s*:/.test(item))
}

function derivedInOfficial(boundary = {}) {
  const joined = joinText(boundary.official_confirmed ?? [])
  return /(comparison|formal_summary|product_contribution|trend_signal|workbench|preview|action-center|operator-console|business-cockpit)/i.test(
    joined
  )
}

function degradedNotDisclosed(report = {}) {
  const degradedCount = report.route_health?.degraded_count ?? 0
  if (degradedCount === 0) {
    return false
  }

  const summaryText = joinText([
    ...(report.route_health_summary ?? []),
    ...(report.boundary_statement?.notes ?? []),
    report.boundary_statement?.degraded_route_participation ?? ""
  ])

  return !/degraded|降级/.test(summaryText)
}

function automationOverclaim(report = {}) {
  const degradedOrFailedRoutes = [
    ...(report.route_health?.degraded_routes ?? []),
    ...(report.route_health?.failed_routes ?? [])
  ]

  if (degradedOrFailedRoutes.length === 0) {
    return false
  }

  return (report.replacement_assessment ?? []).some((line) => {
    if (!/完全自动|瀹屽叏鑷姩/i.test(line)) {
      return false
    }

    return degradedOrFailedRoutes.some((route) => {
      const routeTail = route.split("/").pop() ?? route
      return /(action-center|operator-console|task-workbench)/i.test(route) && line.includes(routeTail)
    })
  })
}

function manualHandoffMissing(report = {}) {
  const actionItems = flattenActions(report.prioritized_actions)
  if (actionItems.length === 0) {
    return true
  }

  return actionItems.some(
    (item) => !hasText(item.owner) || !hasText(item.manual_confirmation_required) || !hasText(item.wika_support)
  )
}

function scoreByRange(value, ranges) {
  for (const [condition, score] of ranges) {
    if (condition(value)) {
      return score
    }
  }
  return 0
}

export function scoreReport(report = {}) {
  const vetoErrors = []

  if ((report.executive_summary ?? []).length === 0) {
    vetoErrors.push("没有执行摘要")
  }
  if ((report.core_findings ?? []).length === 0) {
    vetoErrors.push("没有核心发现")
  }
  if ((report.blind_spots ?? []).length === 0) {
    vetoErrors.push("没有盲区说明")
  }
  if ((report.boundary_statement?.notes ?? []).length === 0) {
    vetoErrors.push("没有边界声明")
  }
  if (flattenActions(report.prioritized_actions).length === 0) {
    vetoErrors.push("没有优先行动")
  }
  if (manualHandoffMissing(report)) {
    vetoErrors.push("没有人工接手说明")
  }
  if (derivedInOfficial(report.boundary_statement)) {
    vetoErrors.push("把 derived 当 official")
  }
  if (degradedNotDisclosed(report)) {
    vetoErrors.push("把 degraded route 写成 full success")
  }
  if (rawDumpDetected(report)) {
    vetoErrors.push("整篇像 JSON dump")
  }

  if (automationOverclaim(report)) {
    vetoErrors.push("把 degraded / failed 的高层聚合 route 写成完全自动")
  }

  const routeHealth = report.route_health ?? {}
  const actions = flattenActions(report.prioritized_actions)

  const dimensions = [
    {
      name: "结论清晰度",
      score:
        (report.executive_summary ?? []).length >= 4 &&
        (report.core_findings ?? []).length >= 3 &&
        (report.key_problems ?? []).length >= 3
          ? 5
          : 4,
      reason: "执行摘要、核心发现和关键问题已形成结论先行结构。"
    },
    {
      name: "数据有效性",
      score:
        (routeHealth.core_full_success_count ?? 0) >= 8
          ? routeHealth.degraded_count > 0 || routeHealth.failed_count > 0
            ? 4
            : 5
          : 3,
      reason:
        (routeHealth.degraded_count ?? 0) > 0
          ? "底层稳定 route 足够，但存在降级 route，因此按降级参与而非完整成功处理。"
          : "核心事实均来自稳定 route，且数据来源可回溯。"
    },
    {
      name: "判断可信度",
      score:
        (report.blind_spots ?? []).length >= 3 &&
        hasText(report.boundary_statement?.degraded_route_participation ?? "")
          ? 5
          : 4,
      reason: "判断严格区分 official、derived、unavailable 与 degraded 参与边界。"
    },
    {
      name: "建议可执行性",
      score: actions.every((item) => hasText(item.action) && hasText(item.owner) && hasText(item.manual_confirmation_required)) ? 5 : 3,
      reason: "每条动作都写了执行人、预期收益、WIKA 支撑范围和人工确认要求。"
    },
    {
      name: "优先级明确性",
      score:
        ["P1", "P2", "P3"].every((priority) => (report.prioritized_actions?.[priority] ?? []).length > 0)
          ? 5
          : 4,
      reason: "动作已按 P1 / P2 / P3 排序，并能和问题闭环。"
    },
    {
      name: "对业务方可读性",
      score: rawDumpDetected(report) ? 2 : 5,
      reason: "正文先讲问题和动作，再讲证据与边界，不再像技术日志。"
    },
    {
      name: "盲区表达完整性",
      score:
        (report.blind_spots ?? []).every((item) => hasText(item.dimension) && hasText(item.impact)) ? 5 : 3,
      reason: "盲区不仅列出字段，还说明了它限制了哪些判断。"
    },
    {
      name: "排版清晰度",
      score:
        scoreByRange((report.section_order ?? []).length, [
          [(value) => value >= 10, 5],
          [(value) => value >= 8, 4]
        ]) || 3,
      reason: "章节顺序固定，适合开会和业务阅读。"
    }
  ]

  const totalScore = dimensions.reduce((sum, item) => sum + item.score, 0)
  const deliveryThreshold = 34

  return {
    total_score: totalScore,
    max_score: 40,
    delivery_threshold: deliveryThreshold,
    veto_errors: vetoErrors,
    pass: vetoErrors.length === 0 && totalScore >= deliveryThreshold,
    dimensions
  }
}
