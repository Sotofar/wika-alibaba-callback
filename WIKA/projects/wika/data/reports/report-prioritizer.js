const PRIORITY_ORDER = {
  P1: 3,
  P2: 2,
  P3: 1
}

const SEVERITY_ORDER = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  info: 0
}

function asText(value, fallback = "") {
  if (value === null || value === undefined) {
    return fallback
  }

  return String(value).trim() || fallback
}

function clampList(values = [], limit = 5) {
  return Array.isArray(values) ? values.filter(Boolean).slice(0, limit) : []
}

function normalizePriority(value, fallback = "P2") {
  const text = asText(value, fallback).toUpperCase()
  return PRIORITY_ORDER[text] ? text : fallback
}

function normalizeSeverity(value, fallback = "medium") {
  const text = asText(value, fallback).toLowerCase()
  return text in SEVERITY_ORDER ? text : fallback
}

function scoreItem(item = {}) {
  return (
    (item.priority ? PRIORITY_ORDER[item.priority] ?? 0 : 0) * 10 +
    (item.severity ? SEVERITY_ORDER[item.severity] ?? 0 : 0) * 5 +
    (Number.isFinite(item.impact_score) ? item.impact_score : 0)
  )
}

function dedupeByKey(items = []) {
  const seen = new Set()
  const output = []
  for (const item of items) {
    const key = asText(
      item.key ??
        item.action ??
        item.title ??
        item.finding ??
        `${item.priority}:${item.why ?? ""}:${item.owner ?? ""}`
    ).toLowerCase()

    if (!key || seen.has(key)) {
      continue
    }

    seen.add(key)
    output.push(item)
  }

  return output
}

export function normalizeFinding(candidate = {}) {
  if (!candidate) {
    return null
  }

  if (typeof candidate === "string") {
    return {
      title: candidate,
      evidence: "见当前 production 只读链路输出。",
      impact: "需要人工根据上下文确认优先级。",
      severity: "medium",
      impact_score: 1
    }
  }

  const title = asText(candidate.title ?? candidate.finding ?? candidate.message)
  if (!title) {
    return null
  }

  return {
    title,
    evidence: asText(candidate.evidence ?? candidate.basis ?? candidate.reason, "见当前 production 只读链路输出。"),
    impact: asText(candidate.impact ?? candidate.effect ?? candidate.consequence, "需要结合经营上下文继续判断。"),
    severity: normalizeSeverity(candidate.severity),
    impact_score: Number.isFinite(candidate.impact_score) ? candidate.impact_score : 1
  }
}

export function normalizeProblem(candidate = {}) {
  if (!candidate) {
    return null
  }

  if (typeof candidate === "string") {
    return {
      title: candidate,
      why: "当前问题已在多层输出中反复出现。",
      consequence: "若不处理，会继续拖累经营判断和执行效率。",
      severity: "medium",
      impact_score: 1
    }
  }

  const title = asText(candidate.title ?? candidate.problem ?? candidate.message)
  if (!title) {
    return null
  }

  return {
    title,
    why: asText(candidate.why ?? candidate.basis ?? candidate.reason, "该问题已影响当前经营判断。"),
    consequence: asText(
      candidate.consequence ?? candidate.impact ?? candidate.if_not_fixed,
      "若不处理，会继续拖累当前经营表现。"
    ),
    severity: normalizeSeverity(candidate.severity),
    impact_score: Number.isFinite(candidate.impact_score) ? candidate.impact_score : 1
  }
}

export function normalizeAction(candidate = {}, defaults = {}) {
  if (!candidate) {
    return null
  }

  if (typeof candidate === "string") {
    return {
      priority: defaults.priority ?? "P2",
      action: candidate,
      why: defaults.why ?? "当前多层输出都指向这一步。",
      expected_benefit: defaults.expected_benefit ?? "可先收口当前最直接的问题。",
      owner: defaults.owner ?? "运营",
      wika_support: defaults.wika_support ?? "已能输出相关问题、证据与人工接手清单。",
      severity: defaults.severity ?? "medium",
      impact_score: defaults.impact_score ?? 1
    }
  }

  const action = asText(candidate.action ?? candidate.title ?? candidate.message)
  if (!action) {
    return null
  }

  return {
    priority: normalizePriority(candidate.priority ?? defaults.priority),
    action,
    why: asText(candidate.why ?? candidate.basis ?? candidate.reason, defaults.why ?? "当前经营判断已给出该动作的直接依据。"),
    expected_benefit: asText(
      candidate.expected_benefit ?? candidate.benefit ?? candidate.impact,
      defaults.expected_benefit ?? "可改善当前优先级最高的问题。"
    ),
    owner: asText(candidate.owner ?? candidate.executor, defaults.owner ?? "运营"),
    wika_support: asText(
      candidate.wika_support ?? candidate.support_scope,
      defaults.wika_support ?? "已能提供证据、诊断与人工接手前的准备层。"
    ),
    severity: normalizeSeverity(candidate.severity ?? defaults.severity),
    impact_score: Number.isFinite(candidate.impact_score)
      ? candidate.impact_score
      : defaults.impact_score ?? 1
  }
}

export function prioritizeFindings(candidates = [], limit = 5) {
  return dedupeByKey(
    clampList(candidates, 20)
      .map((item) => normalizeFinding(item))
      .filter(Boolean)
      .sort((left, right) => scoreItem(right) - scoreItem(left))
  ).slice(0, limit)
}

export function prioritizeProblems(candidates = [], limit = 5) {
  return dedupeByKey(
    clampList(candidates, 20)
      .map((item) => normalizeProblem(item))
      .filter(Boolean)
      .sort((left, right) => scoreItem(right) - scoreItem(left))
  ).slice(0, limit)
}

export function prioritizeActions(candidates = [], options = {}) {
  const perBucket = options.perBucket ?? 3
  const normalized = dedupeByKey(
    clampList(candidates, 30)
      .map((item) => normalizeAction(item, options.defaults))
      .filter(Boolean)
      .sort((left, right) => scoreItem(right) - scoreItem(left))
  )

  const buckets = {
    P1: [],
    P2: [],
    P3: []
  }

  for (const item of normalized) {
    const bucket = item.priority ?? "P2"
    if (buckets[bucket].length >= perBucket) {
      continue
    }
    buckets[bucket].push(item)
  }

  return buckets
}
