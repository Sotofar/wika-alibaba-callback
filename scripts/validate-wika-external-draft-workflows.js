import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const BASE_URL =
  process.env.WIKA_API_BASE_URL || "https://api.wikapacking.com";
const DOCS_DIR = path.resolve(process.cwd(), "docs/framework");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { parse_error: true, raw: text };
  }

  return {
    status: response.status,
    json
  };
}

function writeJson(fileName, payload) {
  const filePath = path.join(DOCS_DIR, fileName);
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return filePath;
}

function summarizeResult(label, result) {
  return {
    label,
    workflow_profile: result?.workflow_profile ?? null,
    template_version: result?.template_version ?? null,
    hard_blockers_count: Array.isArray(result?.hard_blockers)
      ? result.hard_blockers.length
      : 0,
    soft_blockers_count: Array.isArray(result?.soft_blockers)
      ? result.soft_blockers.length
      : 0,
    handoff_required:
      result?.workflow_meta?.handoff_required ??
      result?.minimum_reply_package?.must_handoff_before_any_send ??
      null,
    draft_usable_externally:
      result?.draft_usable_externally ??
      result?.minimum_reply_package?.draft_usable_externally ??
      null
  };
}

const replySamples = {
  complete_context: {
    inquiry_text:
      "Hello, we need 1000 pcs custom PU sunglasses cases with logo for US shipment. Please share quote, lead time and sample arrangement.",
    customer_profile: {
      company_name: "TEST BUYER / DO-NOT-USE",
      contact_name: "Sample Buyer"
    },
    product_id: "1601700588198",
    quantity: "1000 pcs",
    destination_country: "United States",
    target_price: "0.65",
    expected_lead_time: "25-30 days after artwork approval",
    language: "en",
    notes: ["TEST / DO-NOT-USE", "reply complete context sample"]
  },
  mockup_customization: {
    inquiry_text:
      "Need 500 custom sunglass cases with logo embossing and mockup views before sample approval.",
    customer_profile: {
      company_name: "TEST BUYER / DO-NOT-USE",
      contact_name: "Mockup Buyer"
    },
    product_id: "1601700588198",
    quantity: "500 pcs",
    destination_country: "Germany",
    target_price: "0.72",
    language: "en",
    mockup_required: true,
    color_requirement: "black outside / beige inside",
    notes: ["TEST / DO-NOT-USE", "reply mockup customization sample"]
  },
  minimal_handoff: {
    inquiry_text: "Please quote your case options.",
    language: "en",
    notes: ["TEST / DO-NOT-USE", "reply minimal handoff sample"]
  }
};

const orderSamples = {
  commercial_review: {
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
    notes: ["TEST / DO-NOT-USE", "order commercial review sample"]
  },
  pricing_gap: {
    company_name: "TEST BUYER / DO-NOT-USE",
    contact_name: "Sample Buyer",
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
    notes: ["TEST / DO-NOT-USE", "order pricing gap sample"]
  },
  minimal_handoff: {
    line_items: [
      {
        product_id: "1601700588198"
      }
    ],
    notes: ["TEST / DO-NOT-USE", "order minimal handoff sample"]
  }
};

export async function main() {
  const replyUrl = `${BASE_URL}/integrations/alibaba/wika/tools/reply-draft`;
  const orderUrl = `${BASE_URL}/integrations/alibaba/wika/tools/order-draft`;

  const replyResults = {};
  for (const [label, input] of Object.entries(replySamples)) {
    replyResults[label] = await postJson(replyUrl, input);
    assert(replyResults[label].status === 200, `Reply sample ${label} should return 200`);
  }

  const orderResults = {};
  for (const [label, input] of Object.entries(orderSamples)) {
    orderResults[label] = await postJson(orderUrl, input);
    assert(orderResults[label].status === 200, `Order sample ${label} should return 200`);
  }

  for (const [label, result] of Object.entries(replyResults)) {
    assert(result.json?.workflow_profile, `Reply sample ${label} must contain workflow_profile`);
    assert(result.json?.template_version, `Reply sample ${label} must contain template_version`);
    assert(Array.isArray(result.json?.hard_blockers), `Reply sample ${label} must contain hard_blockers`);
    assert(Array.isArray(result.json?.follow_up_questions), `Reply sample ${label} must contain follow_up_questions`);
    assert(Array.isArray(result.json?.handoff_checklist), `Reply sample ${label} must contain handoff_checklist`);
  }

  for (const [label, result] of Object.entries(orderResults)) {
    assert(result.json?.workflow_profile, `Order sample ${label} must contain workflow_profile`);
    assert(result.json?.template_version, `Order sample ${label} must contain template_version`);
    assert(Array.isArray(result.json?.required_manual_fields), `Order sample ${label} must contain required_manual_fields`);
    assert(Array.isArray(result.json?.required_manual_field_details), `Order sample ${label} must contain required_manual_field_details`);
    assert(Array.isArray(result.json?.handoff_checklist), `Order sample ${label} must contain handoff_checklist`);
  }

  const replyPayload = {
    generated_at: new Date().toISOString(),
    route: replyUrl,
    summary: Object.fromEntries(
      Object.entries(replyResults).map(([label, result]) => [label, summarizeResult(label, result.json)])
    ),
    complete_context_sample: {
      input: replySamples.complete_context,
      output: replyResults.complete_context.json
    },
    mockup_customization_sample: {
      input: replySamples.mockup_customization,
      output: replyResults.mockup_customization.json
    },
    minimal_handoff_sample: {
      input: replySamples.minimal_handoff,
      output: replyResults.minimal_handoff.json
    }
  };

  const orderPayload = {
    generated_at: new Date().toISOString(),
    route: orderUrl,
    summary: Object.fromEntries(
      Object.entries(orderResults).map(([label, result]) => [label, summarizeResult(label, result.json)])
    ),
    commercial_review_sample: {
      input: orderSamples.commercial_review,
      output: orderResults.commercial_review.json
    },
    pricing_gap_sample: {
      input: orderSamples.pricing_gap,
      output: orderResults.pricing_gap.json
    },
    minimal_handoff_sample: {
      input: orderSamples.minimal_handoff,
      output: orderResults.minimal_handoff.json
    }
  };

  const replyFile = writeJson("WIKA_外部回复草稿样例.json", replyPayload);
  const orderFile = writeJson("WIKA_外部订单草稿样例.json", orderPayload);

  console.log(
    JSON.stringify(
      {
        ok: true,
        reply_sample_file: replyFile,
        order_sample_file: orderFile,
        reply_summary: replyPayload.summary,
        order_summary: orderPayload.summary
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
