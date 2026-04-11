import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";
import { buildWikaExternalReplyDraftPackage } from "../../shared/data/modules/alibaba-external-reply-drafts.js";
import { buildWikaExternalOrderDraftPackage } from "../../shared/data/modules/alibaba-order-drafts.js";
import {
  buildWikaExternalDraftReview,
  buildWikaOrderHandoffPack,
  buildWikaReplyHandoffPack,
  renderWikaOrderHandoffPackMarkdown,
  renderWikaReplyHandoffPackMarkdown
} from "../../shared/data/modules/alibaba-external-draft-review.js";
import {
  WIKA_EXTERNAL_DRAFT_REVIEW_VERSION,
  WIKA_EXTERNAL_WORKFLOW_TEMPLATE_VERSION,
  WIKA_WORKFLOW_PROFILE_COVERAGE_MATRIX
} from "../../shared/data/modules/alibaba-external-workflow-governance.js";
import {
  WIKA_WORKFLOW_BLOCKER_TAXONOMY_VERSION,
  WIKA_WORKFLOW_BLOCKER_USAGE_MATRIX
} from "../../shared/data/modules/alibaba-external-workflow-taxonomy.js";

const DOCS_DIR = path.resolve(process.cwd(), "docs/framework");
const BASE_URL =
  process.env.WIKA_API_BASE_URL || "https://api.wikapacking.com";
const RAILWAY_TOKEN_PATH = path.join(os.tmpdir(), "railway-cli-token.txt");
const PROJECT_ID = "7cc408fd-c2a3-403c-9b4e-adaa72a9a712";
const ENVIRONMENT_ID = "4afccea8-ada6-42d5-9bd7-0f73cca404dc";
const SERVICE_ID = "d7abfb5c-25c6-478c-a51a-69d85151127a";
const GRAPHQL_URL = "https://backboard.railway.com/graphql/v2";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function sortKeysDeep(value) {
  if (Array.isArray(value)) {
    return value.map((item) => sortKeysDeep(item));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const sorted = {};
  for (const key of Object.keys(value).sort()) {
    sorted[key] = sortKeysDeep(value[key]);
  }

  return sorted;
}

function writeJson(fileName, payload) {
  const filePath = path.join(DOCS_DIR, fileName);
  fs.writeFileSync(
    filePath,
    `${JSON.stringify(sortKeysDeep(payload), null, 2)}\n`,
    "utf8"
  );
  return filePath;
}

function writeMarkdown(fileName, content) {
  const filePath = path.join(DOCS_DIR, fileName);
  fs.writeFileSync(filePath, `${content.trim()}\n`, "utf8");
  return filePath;
}

function readRailwayToken() {
  return fs.readFileSync(RAILWAY_TOKEN_PATH, "utf8").trim();
}

async function queryRailwayVariables(railwayToken) {
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${railwayToken}`
    },
    body: JSON.stringify({
      query:
        "query($projectId:String!,$environmentId:String!,$serviceId:String!){ variables(projectId:$projectId,environmentId:$environmentId,serviceId:$serviceId) }",
      variables: {
        projectId: PROJECT_ID,
        environmentId: ENVIRONMENT_ID,
        serviceId: SERVICE_ID
      }
    })
  });

  const payload = await response.json();
  if (payload?.errors?.length) {
    throw new Error(JSON.stringify(payload.errors));
  }

  return payload?.data?.variables ?? {};
}

function getRefreshUrl(vars) {
  return String(
    vars.ALIBABA_REFRESH_TOKEN_URL ||
      String(vars.ALIBABA_TOKEN_URL || "").replace(
        "/auth/token/create",
        "/auth/token/refresh"
      )
  ).trim();
}

function signSha256(apiName, params, appSecret) {
  const keys = Object.keys(params)
    .filter((key) => key !== "sign")
    .sort((left, right) =>
      Buffer.from(left, "utf8").compare(Buffer.from(right, "utf8"))
    );

  let payload = apiName;
  for (const key of keys) {
    const value = params[key];
    if (value === undefined || value === null || value === "") {
      continue;
    }

    payload += `${key}${value}`;
  }

  return crypto
    .createHmac("sha256", appSecret)
    .update(payload, "utf8")
    .digest("hex")
    .toUpperCase();
}

async function refreshAccessToken({
  appKey,
  appSecret,
  refreshToken,
  refreshUrl,
  partnerId
}) {
  const params = {
    app_key: appKey,
    sign_method: "sha256",
    timestamp: String(Date.now()),
    refresh_token: refreshToken
  };

  if (partnerId) {
    params.partner_id = partnerId;
  }

  params.sign = signSha256("/auth/token/refresh", params, appSecret);

  const response = await fetch(refreshUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
      Accept: "application/json"
    },
    body: JSON.stringify(params)
  });

  const payload = await response.json();
  if (String(payload?.code ?? "0") !== "0") {
    throw new Error(
      JSON.stringify({
        code: payload?.code ?? null,
        sub_code: payload?.sub_code ?? null,
        msg: payload?.message ?? payload?.msg ?? "refresh failed"
      })
    );
  }

  const accessToken = String(
    payload?.access_token ??
      payload?.model?.access_token ??
      payload?.data?.access_token ??
      ""
  ).trim();
  if (!accessToken) {
    throw new Error("Missing access_token from refresh response");
  }

  return accessToken;
}

async function getWikaReadOnlyClientConfig() {
  const railwayToken = readRailwayToken();
  const vars = await queryRailwayVariables(railwayToken);
  const appKey = String(vars.ALIBABA_CLIENT_ID || "").trim();
  const appSecret = String(vars.ALIBABA_CLIENT_SECRET || "").trim();
  const refreshToken = String(
    vars.ALIBABA_WIKA_BOOTSTRAP_REFRESH_TOKEN || ""
  ).trim();
  const refreshUrl = getRefreshUrl(vars);
  const partnerId = String(vars.ALIBABA_PARTNER_ID || "").trim() || null;

  assert(appKey, "Missing ALIBABA_CLIENT_ID");
  assert(appSecret, "Missing ALIBABA_CLIENT_SECRET");
  assert(refreshToken, "Missing ALIBABA_WIKA_BOOTSTRAP_REFRESH_TOKEN");
  assert(refreshUrl, "Missing refresh URL");

  const accessToken = await refreshAccessToken({
    appKey,
    appSecret,
    refreshToken,
    refreshUrl,
    partnerId
  });

  return {
    account: "wika",
    appKey,
    appSecret,
    accessToken,
    endpointUrl: "https://open-api.alibaba.com/sync"
  };
}

function summarizeSample(label, output, review, expected) {
  return {
    label,
    workflow_profile: output?.workflow_profile ?? null,
    template_version: output?.template_version ?? null,
    hard_blockers_count: Array.isArray(output?.hard_blockers)
      ? output.hard_blockers.length
      : 0,
    soft_blockers_count: Array.isArray(output?.soft_blockers)
      ? output.soft_blockers.length
      : 0,
    handoff_required:
      output?.workflow_meta?.handoff_required ??
      output?.minimum_reply_package?.must_handoff_before_any_send ??
      false,
    draft_usable_externally: Boolean(output?.draft_usable_externally),
    readiness_level: review?.readiness_level ?? null,
    expected
  };
}

function assertCountRange(label, actual, expectedRange, kind) {
  if (typeof expectedRange === "number") {
    assert(
      actual === expectedRange,
      `${label} ${kind} should equal ${expectedRange}, received ${actual}`
    );
    return;
  }

  assert(
    actual >= expectedRange.min && actual <= expectedRange.max,
    `${label} ${kind} should be between ${expectedRange.min} and ${expectedRange.max}, received ${actual}`
  );
}

function validateSample(label, output, review, expected) {
  assert(
    output?.workflow_profile === expected.workflow_profile,
    `${label} workflow_profile mismatch`
  );
  assert(
    output?.template_version === expected.template_version,
    `${label} template_version mismatch`
  );
  assert(
    review?.readiness_level === expected.readiness_level,
    `${label} readiness_level mismatch`
  );
  assert(
    Boolean(output?.workflow_meta?.handoff_required) ===
      expected.handoff_required,
    `${label} handoff_required mismatch`
  );
  assert(
    Boolean(output?.draft_usable_externally) ===
      expected.draft_usable_externally,
    `${label} draft_usable_externally mismatch`
  );
  assertCountRange(
    label,
    Array.isArray(output?.hard_blockers) ? output.hard_blockers.length : 0,
    expected.hard_blockers_count,
    "hard_blockers_count"
  );
  assertCountRange(
    label,
    Array.isArray(output?.soft_blockers) ? output.soft_blockers.length : 0,
    expected.soft_blockers_count,
    "soft_blockers_count"
  );
}

function buildReplySamples() {
  return {
    complete_context: {
      input: {
        inquiry_text:
          "Hello, we need 1000 pcs PU sunglasses cases for US shipment. Please confirm quote and lead time.",
        customer_profile: {
          company_name: "TEST BUYER / DO-NOT-USE",
          contact_name: "Sample Buyer"
        },
        product_id: "1601700588198",
        quantity: "1000 pcs",
        destination_country: "United States",
        language: "en",
        notes: ["TEST / DO-NOT-USE", "reply complete context regression"]
      },
      expected: {
        workflow_profile: "reply_quote_confirmation_needed",
        template_version: WIKA_EXTERNAL_WORKFLOW_TEMPLATE_VERSION,
        hard_blockers_count: 2,
        soft_blockers_count: 0,
        handoff_required: true,
        draft_usable_externally: true,
        readiness_level: "handoff_required"
      }
    },
    mockup_customization: {
      input: {
        inquiry_text:
          "Need 500 custom sunglass cases with logo embossing and mockup views before sample approval.",
        customer_profile: {
          company_name: "TEST BUYER / DO-NOT-USE",
          contact_name: "Mockup Buyer"
        },
        product_id: "1601700588198",
        quantity: "500 pcs",
        destination_country: "Germany",
        language: "en",
        mockup_required: true,
        notes: ["TEST / DO-NOT-USE", "reply mockup customization regression"]
      },
      expected: {
        workflow_profile: "reply_mockup_customization",
        template_version: WIKA_EXTERNAL_WORKFLOW_TEMPLATE_VERSION,
        hard_blockers_count: 2,
        soft_blockers_count: 3,
        handoff_required: true,
        draft_usable_externally: true,
        readiness_level: "handoff_required"
      }
    },
    quantity_gap: {
      input: {
        inquiry_text:
          "Please quote the eyewear case and advise lead time for our project.",
        customer_profile: {
          company_name: "TEST BUYER / DO-NOT-USE",
          contact_name: "Quantity Gap Buyer"
        },
        product_id: "1601700588198",
        destination_country: "Canada",
        language: "en",
        notes: ["TEST / DO-NOT-USE", "reply quantity gap regression"]
      },
      expected: {
        workflow_profile: "reply_minimal_handoff",
        template_version: WIKA_EXTERNAL_WORKFLOW_TEMPLATE_VERSION,
        hard_blockers_count: 2,
        soft_blockers_count: 1,
        handoff_required: true,
        draft_usable_externally: true,
        readiness_level: "handoff_required"
      }
    },
    minimal_handoff: {
      input: {
        inquiry_text: "Please quote your case options.",
        language: "en",
        notes: ["TEST / DO-NOT-USE", "reply minimal handoff regression"]
      },
      expected: {
        workflow_profile: "reply_minimal_handoff",
        template_version: WIKA_EXTERNAL_WORKFLOW_TEMPLATE_VERSION,
        hard_blockers_count: 2,
        soft_blockers_count: 4,
        handoff_required: true,
        draft_usable_externally: false,
        readiness_level: "not_ready"
      }
    }
  };
}

function buildOrderSamples() {
  return {
    commercial_review: {
      input: {
        company_name: "TEST BUYER / DO-NOT-USE",
        contact_name: "Sample Buyer",
        email: "buyer@example.com",
        country_name: "United States",
        country_code: "US",
        line_items: [
          {
            product_id: "1601700588198",
            quantity: "1000",
            unit: "Pieces",
            unit_price: "0.65",
            currency: "USD"
          }
        ],
        payment_terms: {
          currency: "USD",
          total_amount: "650",
          advance_amount: "195",
          payment_terms_text: "30% deposit, balance before shipment"
        },
        shipment_plan: {
          trade_term: "FOB",
          shipment_method: "sea",
          lead_time_text: "25-30 days after artwork approval",
          destination_country: "United States",
          logistics_notes: "TEST / DO-NOT-USE"
        },
        notes: ["TEST / DO-NOT-USE", "order commercial review regression"]
      },
      expected: {
        workflow_profile: "order_commercial_review",
        template_version: WIKA_EXTERNAL_WORKFLOW_TEMPLATE_VERSION,
        hard_blockers_count: 0,
        soft_blockers_count: 0,
        handoff_required: false,
        draft_usable_externally: true,
        readiness_level: "externally_usable"
      }
    },
    logistics_gap: {
      input: {
        company_name: "TEST BUYER / DO-NOT-USE",
        contact_name: "Logistics Buyer",
        email: "buyer@example.com",
        line_items: [
          {
            product_id: "1601700588198",
            quantity: "800",
            unit: "Pieces",
            unit_price: "0.70",
            currency: "USD"
          }
        ],
        payment_terms: {
          currency: "USD",
          total_amount: "560"
        },
        shipment_plan: {
          lead_time_text: "30 days after deposit"
        },
        notes: ["TEST / DO-NOT-USE", "order logistics gap regression"]
      },
      expected: {
        workflow_profile: "order_commercial_review",
        template_version: WIKA_EXTERNAL_WORKFLOW_TEMPLATE_VERSION,
        hard_blockers_count: 0,
        soft_blockers_count: 4,
        handoff_required: false,
        draft_usable_externally: true,
        readiness_level: "externally_usable_with_review"
      }
    },
    pricing_gap: {
      input: {
        company_name: "TEST BUYER / DO-NOT-USE",
        contact_name: "Pricing Gap Buyer",
        email: "buyer@example.com",
        line_items: [
          {
            product_id: "1601700588198",
            quantity: "1000",
            unit: "Pieces",
            currency: "USD"
          }
        ],
        shipment_plan: {
          destination_country: "United States"
        },
        notes: ["TEST / DO-NOT-USE", "order pricing gap regression"]
      },
      expected: {
        workflow_profile: "order_quote_confirmation_needed",
        template_version: WIKA_EXTERNAL_WORKFLOW_TEMPLATE_VERSION,
        hard_blockers_count: 3,
        soft_blockers_count: 3,
        handoff_required: true,
        draft_usable_externally: true,
        readiness_level: "handoff_required"
      }
    },
    minimal_handoff: {
      input: {
        line_items: [
          {
            product_id: "1601700588198"
          }
        ],
        notes: ["TEST / DO-NOT-USE", "order minimal handoff regression"]
      },
      expected: {
        workflow_profile: "order_minimal_handoff",
        template_version: WIKA_EXTERNAL_WORKFLOW_TEMPLATE_VERSION,
        hard_blockers_count: 7,
        soft_blockers_count: 4,
        handoff_required: true,
        draft_usable_externally: true,
        readiness_level: "handoff_required"
      }
    }
  };
}

async function runSampleSet(clientConfig, workflowKind, samples) {
  const results = {};

  for (const [label, config] of Object.entries(samples)) {
    const output =
      workflowKind === "reply"
        ? await buildWikaExternalReplyDraftPackage(clientConfig, config.input)
        : await buildWikaExternalOrderDraftPackage(clientConfig, config.input);
    const review = buildWikaExternalDraftReview(workflowKind, output);
    validateSample(label, output, review, config.expected);

    results[label] = {
      input: config.input,
      assertions: config.expected,
      output,
      review,
      summary: summarizeSample(label, output, review, config.expected)
    };
  }

  return results;
}

function buildSampleDocument({ route, workflowKind, results }) {
  const summary = Object.fromEntries(
    Object.entries(results).map(([label, result]) => [label, result.summary])
  );

  return {
    generated_at: new Date().toISOString(),
    execution_mode: "local_module_with_production_credentials",
    route,
    workflow_kind: workflowKind,
    template_version: WIKA_EXTERNAL_WORKFLOW_TEMPLATE_VERSION,
    review_version: WIKA_EXTERNAL_DRAFT_REVIEW_VERSION,
    blocker_taxonomy_version: WIKA_WORKFLOW_BLOCKER_TAXONOMY_VERSION,
    profile_coverage_matrix: WIKA_WORKFLOW_PROFILE_COVERAGE_MATRIX.filter(
      (item) => item.applies_to === workflowKind
    ),
    blocker_usage_matrix: WIKA_WORKFLOW_BLOCKER_USAGE_MATRIX.filter((item) =>
      item.applies_to.includes(workflowKind)
    ),
    summary,
    samples: results
  };
}

export async function main() {
  const clientConfig = await getWikaReadOnlyClientConfig();
  const replyRoute = `${BASE_URL}/integrations/alibaba/wika/tools/reply-draft`;
  const orderRoute = `${BASE_URL}/integrations/alibaba/wika/tools/order-draft`;
  const replyResults = await runSampleSet(
    clientConfig,
    "reply",
    buildReplySamples()
  );
  const orderResults = await runSampleSet(
    clientConfig,
    "order",
    buildOrderSamples()
  );

  const replyDoc = buildSampleDocument({
    route: replyRoute,
    workflowKind: "reply",
    results: replyResults
  });
  const orderDoc = buildSampleDocument({
    route: orderRoute,
    workflowKind: "order",
    results: orderResults
  });

  const representativeReply = replyResults.complete_context;
  const representativeOrder = orderResults.commercial_review;
  const replyPack = buildWikaReplyHandoffPack(
    representativeReply.output,
    representativeReply.review
  );
  const orderPack = buildWikaOrderHandoffPack(
    representativeOrder.output,
    representativeOrder.review
  );

  const outputFiles = {
    reply_samples: writeJson("WIKA_外部回复草稿样例.json", replyDoc),
    order_samples: writeJson("WIKA_澶栭儴璁㈠崟鑽夌鏍蜂緥.json", orderDoc),
    reply_handoff_json: writeJson("WIKA_外部回复交接包样例.json", replyPack),
    order_handoff_json: writeJson("WIKA_澶栭儴璁㈠崟浜ゆ帴鍖呮牱渚?json", orderPack),
    reply_handoff_md: writeMarkdown(
      "WIKA_外部回复交接包样例.md",
      renderWikaReplyHandoffPackMarkdown(replyPack)
    ),
    order_handoff_md: writeMarkdown(
      "WIKA_澶栭儴璁㈠崟浜ゆ帴鍖呮牱渚?md",
      renderWikaOrderHandoffPackMarkdown(orderPack)
    )
  };

  console.log(
    JSON.stringify(
      {
        ok: true,
        execution_mode: "local_module_with_production_credentials",
        template_version: WIKA_EXTERNAL_WORKFLOW_TEMPLATE_VERSION,
        review_version: WIKA_EXTERNAL_DRAFT_REVIEW_VERSION,
        blocker_taxonomy_version: WIKA_WORKFLOW_BLOCKER_TAXONOMY_VERSION,
        output_files: outputFiles,
        reply_summary: replyDoc.summary,
        order_summary: orderDoc.summary
      },
      null,
      2
    )
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(
      JSON.stringify(
        {
          ok: false,
          error: error instanceof Error ? error.message : String(error)
        },
        null,
        2
      )
    );
    process.exitCode = 1;
  });
}

