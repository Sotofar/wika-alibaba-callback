const OFFICIAL_DOC_BASE =
  "https://open.alibaba.com/doc/api.htm#/api?path=";

function buildOfficialDocUrl(methodName) {
  return `${OFFICIAL_DOC_BASE}${methodName}&methodType=GET/POST`;
}

const TASK_METADATA = Object.freeze({
  task3: {
    task_id: "task3",
    task_name: "产品上新 / 详情写侧",
    current_layer:
      "safe draft preparation only; schema/media read-side and payload draft are stable",
    current_supporting_routes: [
      "/integrations/alibaba/wika/data/categories/tree",
      "/integrations/alibaba/wika/data/categories/attributes",
      "/integrations/alibaba/wika/data/products/schema",
      "/integrations/alibaba/wika/data/products/schema/render",
      "/integrations/alibaba/wika/data/products/schema/render/draft",
      "/integrations/alibaba/wika/data/media/list",
      "/integrations/alibaba/wika/data/media/groups",
      "/integrations/alibaba/wika/workbench/product-draft-workbench",
      "/integrations/alibaba/wika/workbench/product-draft-preview"
    ],
    evidence_refs: [
      "WIKA/docs/framework/WIKA_产品安全草稿链路说明.md",
      "WIKA/docs/framework/WIKA_低风险写侧边界验证.md",
      "WIKA/docs/framework/WIKA_可观测可回滚证据验证.md",
      "WIKA/docs/framework/WIKA_ICBU商品类目官方文档归类.md"
    ]
  },
  task4: {
    task_id: "task4",
    task_name: "平台内回复写侧",
    current_layer:
      "external reply draft workflow only; handoff pack and preview are stable",
    current_supporting_routes: [
      "/integrations/alibaba/wika/tools/reply-draft",
      "/integrations/alibaba/wika/workbench/reply-workbench",
      "/integrations/alibaba/wika/workbench/reply-preview"
    ],
    evidence_refs: [
      "WIKA/docs/framework/WIKA_任务3_4_5工作台说明.md",
      "WIKA/docs/framework/WIKA_外部草稿工作流说明.md",
      "WIKA/docs/framework/WIKA_低风险写侧边界验证.md"
    ]
  },
  task5: {
    task_id: "task5",
    task_name: "订单草稿 / 交易创建写侧",
    current_layer:
      "external order draft workflow only; platform create boundary remains unproven",
    current_supporting_routes: [
      "/integrations/alibaba/wika/data/orders/draft-types",
      "/integrations/alibaba/wika/tools/order-draft",
      "/integrations/alibaba/wika/workbench/order-workbench",
      "/integrations/alibaba/wika/workbench/order-preview"
    ],
    evidence_refs: [
      "WIKA/docs/framework/WIKA_订单草稿链路说明.md",
      "WIKA/docs/framework/WIKA_低风险写侧边界验证.md",
      "WIKA/docs/framework/WIKA_可观测可回滚证据验证.md",
      "WIKA/docs/framework/WIKA_订单入口候选清单.md"
    ]
  }
});

const DIRECT_CANDIDATES = Object.freeze([
  {
    task_id: "task3",
    method_name: "alibaba.icbu.photobank.upload",
    doc_url: buildOfficialDocUrl("alibaba.icbu.photobank.upload"),
    intended_write_action:
      "upload one photobank asset for later product image binding",
    auth_requirement:
      "production /sync + access_token + sha256 already reached business-parameter layer",
    package_or_scope_requirement:
      "ICBU 商品 / 图片银行写侧能力 on real seller media library",
    parameter_contract_status:
      "documented_minimum_keys_but_safe_test_payload_not_proven",
    sandbox_or_test_scope_available: "no",
    draft_mode_available: "no",
    readback_available: "yes_via_media_list_and_media_groups",
    cleanup_or_rollback_available: "no",
    runtime_test_ready: false,
    risk_level: "high",
    why_directly_relevant:
      "direct prerequisite for task3 real media write path",
    why_not_ready:
      "successful call creates real photobank asset; current chain cannot prove isolated test scope or cleanup/rollback.",
    readback_paths: [
      "/integrations/alibaba/wika/data/media/list",
      "/integrations/alibaba/wika/data/media/groups"
    ],
    supporting_methods: ["alibaba.icbu.photobank.list", "alibaba.icbu.photobank.group.list"],
    evidence_refs: [
      "WIKA/docs/framework/WIKA_低风险写侧边界验证.md",
      "WIKA/docs/framework/WIKA_可观测可回滚证据验证.md",
      "WIKA/docs/framework/WIKA_产品安全草稿链路说明.md"
    ]
  },
  {
    task_id: "task3",
    method_name: "alibaba.icbu.product.add.draft",
    doc_url: buildOfficialDocUrl("alibaba.icbu.product.add.draft"),
    intended_write_action: "create one real product draft object on seller account",
    auth_requirement:
      "production /sync + access_token + sha256 already reached business-parameter layer",
    package_or_scope_requirement:
      "ICBU 商品草稿写侧能力 on real seller catalog",
    parameter_contract_status:
      "documented_success_shape_but_safe_minimum_payload_not_proven",
    sandbox_or_test_scope_available: "no",
    draft_mode_available: "yes_but_not_safe_boundary_proven",
    readback_available: "partial_via_schema_render_draft_after_real_draft_id",
    cleanup_or_rollback_available: "no",
    runtime_test_ready: false,
    risk_level: "high",
    why_directly_relevant:
      "direct candidate for task3 platform-side draft creation",
    why_not_ready:
      "success creates real draft object; current chain lacks proven delete/manage/rollback path and isolated test scope.",
    readback_paths: ["/integrations/alibaba/wika/data/products/schema/render/draft"],
    supporting_methods: ["alibaba.icbu.product.schema.render.draft"],
    evidence_refs: [
      "WIKA/docs/framework/WIKA_低风险写侧边界验证.md",
      "WIKA/docs/framework/WIKA_可观测可回滚证据验证.md",
      "WIKA/docs/framework/WIKA_产品安全草稿链路说明.md"
    ]
  },
  {
    task_id: "task3",
    method_name: "alibaba.icbu.product.schema.add.draft",
    doc_url: buildOfficialDocUrl("alibaba.icbu.product.schema.add.draft"),
    intended_write_action:
      "publish one draft payload into platform-side formal draft/product path",
    auth_requirement:
      "official doc found in ICBU 商品 family; no safe production proof kept in current WIKA baseline",
    package_or_scope_requirement:
      "ICBU 商品 schema draft publish capability on real seller catalog",
    parameter_contract_status: "doc_found_but_runtime_contract_not_stable_enough",
    sandbox_or_test_scope_available: "no",
    draft_mode_available: "yes_but_publish_direction_increases_risk",
    readback_available: "no_stable_query_delete_manage_chain",
    cleanup_or_rollback_available: "no",
    runtime_test_ready: false,
    risk_level: "very_high",
    why_directly_relevant:
      "directly touches task3 draft-to-platform write path",
    why_not_ready:
      "method sits on draft publish direction instead of safe query/delete evidence; current repo has no stable parameter contract or rollback path for boundary proof.",
    readback_paths: [],
    supporting_methods: ["alibaba.icbu.product.schema.render.draft"],
    evidence_refs: [
      "WIKA/docs/framework/WIKA_ICBU商品类目官方文档归类.md",
      "WIKA/docs/framework/WIKA_产品安全草稿链路说明.md"
    ]
  },
  {
    task_id: "task5",
    method_name: "alibaba.trade.order.create",
    doc_url: buildOfficialDocUrl("alibaba.trade.order.create"),
    intended_write_action: "create one real platform trade order",
    auth_requirement:
      "production /sync + access_token + sha256 already reached business-parameter layer",
    package_or_scope_requirement:
      "international station trade create capability plus isolated buyer/order test scope",
    parameter_contract_status:
      "documented_but_safe_non_transactional_payload_not_proven",
    sandbox_or_test_scope_available: "no",
    draft_mode_available: "no_safe_draft_mode_proven",
    readback_available: "no_direct_safe_readback_for_created_trade",
    cleanup_or_rollback_available: "no",
    runtime_test_ready: false,
    risk_level: "very_high",
    why_directly_relevant:
      "direct write path for task5 platform order creation",
    why_not_ready:
      "current proof only reaches MissingParameter boundary; no disposable test scope, no rollback path, and no proof of non-transactional draft mode.",
    readback_paths: ["/integrations/alibaba/wika/data/orders/draft-types"],
    supporting_methods: ["alibaba.seller.trade.query.drafttype"],
    evidence_refs: [
      "WIKA/docs/framework/WIKA_订单草稿链路说明.md",
      "WIKA/docs/framework/WIKA_订单入口候选清单.md"
    ]
  }
]);

const TASK_LEVEL_NO_CANDIDATE_RESULTS = Object.freeze({
  task4: {
    primary_status: "DOC_INSUFFICIENT",
    why_not_ready:
      "仓内当前没有找到与平台内回复写侧直接相关、且同时具备官方方法名、字段说明、参数契约的 direct candidate。",
    evidence_refs: [
      "WIKA/docs/framework/WIKA_任务3_4_5工作台说明.md",
      "WIKA/docs/framework/WIKA_外部草稿工作流说明.md"
    ]
  }
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function groupCandidatesByTask() {
  const groups = new Map(
    Object.keys(TASK_METADATA).map((taskId) => [taskId, []])
  );

  for (const item of DIRECT_CANDIDATES) {
    groups.get(item.task_id)?.push(clone(item));
  }

  return groups;
}

function buildTaskMatrixEntry(taskId, candidates) {
  const metadata = TASK_METADATA[taskId];
  return {
    ...clone(metadata),
    direct_candidate_count: candidates.length,
    runtime_ready_candidate_count: candidates.filter(
      (item) => item.runtime_test_ready === true
    ).length,
    candidates
  };
}

function buildTaskPreflightEntry(taskId, candidates, candidateResults) {
  const metadata = TASK_METADATA[taskId];
  if (candidates.length === 0) {
    const blocked = TASK_LEVEL_NO_CANDIDATE_RESULTS[taskId] ?? {
      primary_status: "DOC_INSUFFICIENT",
      why_not_ready: "当前没有 direct candidate。"
    };
    return {
      ...clone(metadata),
      direct_candidate_count: 0,
      runtime_ready_candidate_count: 0,
      primary_status: blocked.primary_status,
      why_not_ready: blocked.why_not_ready,
      evidence_refs: blocked.evidence_refs ?? metadata.evidence_refs,
      candidates: []
    };
  }

  const filteredResults = candidateResults.filter((item) => item.task_id === taskId);
  const runtimeReady = filteredResults.filter((item) => item.runtime_test_ready === true);

  return {
    ...clone(metadata),
    direct_candidate_count: candidates.length,
    runtime_ready_candidate_count: runtimeReady.length,
    primary_status:
      runtimeReady.length > 0
        ? "RUNTIME_READY"
        : filteredResults[0]?.preflight_primary_status ?? "NOT_RUNTIME_READY",
    why_not_ready:
      runtimeReady.length > 0
        ? null
        : filteredResults[0]?.why_not_ready ??
          "当前没有满足安全前置条件的 direct candidate。",
    evidence_refs: metadata.evidence_refs,
    candidates: filteredResults
  };
}

function buildStage35Decision(candidate) {
  switch (candidate.method_name) {
    case "alibaba.icbu.photobank.upload":
      return {
        preflight_primary_status: "NO_ROLLBACK_PATH",
        preflight_secondary_statuses: ["NO_TEST_SCOPE", "NOT_RUNTIME_READY"],
        doc_anchor_status: "OFFICIAL_DOC_PATTERN_CONFIRMED_IN_REPO",
        parameter_contract_ready: false,
        auth_ready: true,
        sandbox_or_test_scope_ready: false,
        draft_mode_ready: false,
        readback_ready: true,
        cleanup_or_rollback_ready: false,
        why_not_ready:
          "成功调用会创建真实图片银行资产；当前只证明可观测，不存在可审计删除/回滚闭环，也没有测试素材隔离证据。"
      };
    case "alibaba.icbu.product.add.draft":
      return {
        preflight_primary_status: "NO_ROLLBACK_PATH",
        preflight_secondary_statuses: ["NO_TEST_SCOPE", "NOT_RUNTIME_READY"],
        doc_anchor_status: "OFFICIAL_DOC_PATTERN_CONFIRMED_IN_REPO",
        parameter_contract_ready: false,
        auth_ready: true,
        sandbox_or_test_scope_ready: false,
        draft_mode_ready: true,
        readback_ready: false,
        cleanup_or_rollback_ready: false,
        why_not_ready:
          "成功调用会创建真实 draft 对象；当前没有 draft 查询/删除/管理闭环，也没有可接受的测试店铺隔离证据。"
      };
    case "alibaba.icbu.product.schema.add.draft":
      return {
        preflight_primary_status: "PARAM_CONTRACT_UNSTABLE",
        preflight_secondary_statuses: [
          "NO_TEST_SCOPE",
          "NO_ROLLBACK_PATH",
          "NOT_RUNTIME_READY"
        ],
        doc_anchor_status: "OFFICIAL_DOC_PATTERN_CONFIRMED_IN_REPO",
        parameter_contract_ready: false,
        auth_ready: false,
        sandbox_or_test_scope_ready: false,
        draft_mode_ready: true,
        readback_ready: false,
        cleanup_or_rollback_ready: false,
        why_not_ready:
          "当前仓内只确认它属于 draft publish 方向，不能支撑安全写侧边界证明；参数契约和回滚路径都不足。"
      };
    case "alibaba.trade.order.create":
      return {
        preflight_primary_status: "NO_ROLLBACK_PATH",
        preflight_secondary_statuses: ["NO_TEST_SCOPE", "NOT_RUNTIME_READY"],
        doc_anchor_status: "OFFICIAL_DOC_PATTERN_CONFIRMED_IN_REPO",
        parameter_contract_ready: false,
        auth_ready: true,
        sandbox_or_test_scope_ready: false,
        draft_mode_ready: false,
        readback_ready: false,
        cleanup_or_rollback_ready: false,
        why_not_ready:
          "当前只证明到 MissingParameter 边界；没有测试买家/测试订单上下文，也没有非成交、可清理、可回滚的 create 路径。"
      };
    default:
      return {
        preflight_primary_status: "NOT_RUNTIME_READY",
        preflight_secondary_statuses: [],
        doc_anchor_status: "DOC_INSUFFICIENT",
        parameter_contract_ready: false,
        auth_ready: false,
        sandbox_or_test_scope_ready: false,
        draft_mode_ready: false,
        readback_ready: false,
        cleanup_or_rollback_ready: false,
        why_not_ready: "当前没有可安全进入 runtime 的前置条件。"
      };
  }
}

export function buildStage34WriteBoundaryMatrix() {
  const grouped = groupCandidatesByTask();
  const tasks = Object.fromEntries(
    [...grouped.entries()].map(([taskId, candidates]) => [
      taskId,
      buildTaskMatrixEntry(taskId, candidates)
    ])
  );

  const directCandidateCount = DIRECT_CANDIDATES.length;
  const runtimeReadyCount = DIRECT_CANDIDATES.filter(
    (item) => item.runtime_test_ready === true
  ).length;

  return {
    stage: "stage34_write_boundary_candidate_matrix",
    generated_at: new Date().toISOString(),
    scope: {
      thread_scope: "WIKA-only",
      official_transport_only: true,
      official_sync_access_token_sha256_only: true,
      no_runtime_write_attempt_in_stage34: true,
      task6_excluded: true
    },
    tasks,
    summary: {
      direct_candidate_count: directCandidateCount,
      runtime_ready_candidate_count: runtimeReadyCount,
      blocked_task_ids: Object.keys(TASK_LEVEL_NO_CANDIDATE_RESULTS),
      next_gate:
        "Only candidates with complete official doc anchor, stable parameter contract, test scope, readback, and rollback may enter runtime."
    }
  };
}

export function buildStage35WriteBoundaryPreflight() {
  const matrix = buildStage34WriteBoundaryMatrix();
  const candidateResults = DIRECT_CANDIDATES.map((candidate) => ({
    ...clone(candidate),
    ...buildStage35Decision(candidate)
  }));

  const grouped = groupCandidatesByTask();
  const task_results = Object.fromEntries(
    [...grouped.entries()].map(([taskId, candidates]) => [
      taskId,
      buildTaskPreflightEntry(taskId, candidates, candidateResults)
    ])
  );

  if (!task_results.task4) {
    task_results.task4 = buildTaskPreflightEntry("task4", [], []);
  }

  const runtimeReadyCandidates = candidateResults.filter(
    (item) => item.runtime_test_ready === true
  );

  return {
    stage: "stage35_write_boundary_preflight",
    generated_at: new Date().toISOString(),
    matrix_reference: {
      stage: matrix.stage,
      direct_candidate_count: matrix.summary.direct_candidate_count
    },
    direct_candidate_results: candidateResults,
    task_results,
    summary: {
      runtime_ready_candidate_count: runtimeReadyCandidates.length,
      runtime_ready_candidates: runtimeReadyCandidates.map((item) => item.method_name),
      stop_reason:
        runtimeReadyCandidates.length === 0
          ? "当前 direct candidate 全部缺少测试隔离、回滚闭环或稳定参数契约，继续推进将跨入高风险真实写入。"
          : null,
      recommended_external_conditions: [
        "可复核的官方 page-level 文档 URL 与稳定参数契约",
        "seller 侧可隔离的测试对象 / 测试会话 / 测试订单上下文",
        "写后 readback 路径",
        "可执行的 cleanup / rollback 路径"
      ]
    }
  };
}
