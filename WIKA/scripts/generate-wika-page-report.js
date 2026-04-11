import fs from "node:fs";
import path from "node:path";
import {
  buildWikaOverviewManagementSummary,
  fetchWikaOverviewSnapshot
} from "../projects/wika/data/overview/module.js";
import {
  buildWikaOrderManagementSummary,
  fetchWikaOrderSummaryAndTrends
} from "../projects/wika/data/orders/module.js";
import {
  buildUnifiedProductManagementSummary,
  buildUnifiedProductRecommendations,
  buildProductPerformanceSummary,
  buildProductRecommendations,
  fetchWikaProductPerformanceList,
  fetchWikaUnifiedProductView
} from "../projects/wika/data/products/module.js";
import {
  buildWikaManagementSummaryReport,
  renderWikaManagementSummaryMarkdown
} from "../projects/wika/data/reports/management-summary.js";
import {
  buildWikaOrderReport,
  buildWikaProductReport,
  buildWikaTrafficMarketReport,
  renderWikaOrderReportMarkdown,
  renderWikaProductReportMarkdown,
  renderWikaTrafficMarketReportMarkdown
} from "../projects/wika/data/reports/domain-reports.js";

const DEFAULT_PERIODS = ["7d", "30d"];
const SUPPORTED_PERIODS = new Set(["7d", "30d"]);
const DEFAULT_WIKA_PRODUCTS_API_BASE_URL = "https://api.wikapacking.com";

function resolvePeriods(argv) {
  const inputPeriods = argv
    .map((item) => String(item).trim())
    .filter((item) => item.length > 0);

  if (inputPeriods.length === 0) {
    return DEFAULT_PERIODS;
  }

  return inputPeriods.filter((item) => SUPPORTED_PERIODS.has(item));
}

function ensureDirectory(targetPath) {
  fs.mkdirSync(targetPath, {
    recursive: true
  });
}

function writeJson(targetPath, value) {
  fs.writeFileSync(targetPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeText(targetPath, value) {
  fs.writeFileSync(targetPath, `${value}\n`, "utf8");
}

async function fetchOfficialProductSnapshot({ pageSize = 30 } = {}) {
  const baseUrl =
    process.env.WIKA_PRODUCTS_API_BASE_URL?.trim() ||
    DEFAULT_WIKA_PRODUCTS_API_BASE_URL;
  const items = [];
  const pageResults = [];
  const seenIds = new Set();
  let currentPage = 1;
  let totalItem = null;
  let totalPages = 1;

  while (currentPage <= totalPages) {
    const response = await fetch(
      `${baseUrl}/integrations/alibaba/wika/data/products/list?page_size=${pageSize}&current_page=${currentPage}`
    );
    const body = await response.json();

    if (!response.ok || !body?.ok) {
      throw new Error(
        `Official product snapshot failed: ${body?.error || response.status}`
      );
    }

    const pageItems = Array.isArray(body.items) ? body.items : [];
    totalItem = body.response_meta?.total_item ?? totalItem ?? pageItems.length;
    totalPages = Math.max(1, Math.ceil(totalItem / pageSize));

    for (const item of pageItems) {
      const canonicalId = item?.id ?? item?.product_id ?? null;
      if (!canonicalId || seenIds.has(String(canonicalId))) {
        continue;
      }

      seenIds.add(String(canonicalId));
      items.push(item);
    }

    pageResults.push({
      current_page: body.response_meta?.current_page ?? currentPage,
      page_size: body.response_meta?.page_size ?? pageSize,
      returned_item_count: pageItems.length
    });

    currentPage += 1;
  }

  return {
    ...pageResults[0],
    ok: true,
    module: "products",
    account: "wika",
    read_only: true,
    verification_status: "verified",
    evidence_level: "L1",
    source: {
      type: "official_api",
      api_name: "alibaba.icbu.product.list",
      endpoint_url: "https://open-api.alibaba.com/sync",
      request_method: "POST",
      depends_on_current_token: true,
      requires_browser_session: false,
      auth_parameter: "access_token",
      sign_method: "sha256"
    },
    response_meta: {
      current_page: 1,
      page_size: pageSize,
      total_item: totalItem ?? items.length,
      page_results: pageResults,
      pages_fetched: pageResults.length,
      fully_covered: items.length >= (totalItem ?? items.length)
    },
    items
  };
}

async function generateForPeriod(period) {
  const overviewResult = await fetchWikaOverviewSnapshot({
    period
  });
  const orderResult = await fetchWikaOrderSummaryAndTrends({
    period
  });
  const officialProductResult = await fetchOfficialProductSnapshot({
    pageSize: 30
  });
  const productPerformanceResult = await fetchWikaProductPerformanceList({
    window: period,
    requestedPageSize: 100,
    maxPages: 3
  });
  const unifiedProductResult = await fetchWikaUnifiedProductView({
    officialResult: officialProductResult,
    performanceResult: productPerformanceResult,
    performanceWindow: period
  });

  const overviewSummary = buildWikaOverviewManagementSummary(overviewResult);
  const orderSummary = buildWikaOrderManagementSummary(orderResult);
  const productPerformanceSummary =
    buildProductPerformanceSummary(productPerformanceResult);
  const productRecommendations =
    buildProductRecommendations(productPerformanceResult);
  const unifiedProductSummary =
    buildUnifiedProductManagementSummary(unifiedProductResult);
  const unifiedProductRecommendations =
    buildUnifiedProductRecommendations(unifiedProductResult);

  const managementReport = buildWikaManagementSummaryReport({
    period,
    overviewResult,
    overviewSummary,
    orderResult,
    orderSummary,
    productUnifiedResult: unifiedProductResult,
    productUnifiedSummary: unifiedProductSummary,
    productUnifiedRecommendations: unifiedProductRecommendations,
    productPerformanceResult,
    productPerformanceSummary,
    productRecommendations
  });
  const productReport = buildWikaProductReport({
    period,
    unifiedProductResult,
    unifiedProductSummary,
    unifiedProductRecommendations
  });
  const orderReport = buildWikaOrderReport({
    period,
    orderResult,
    orderSummary
  });
  const trafficMarketReport = buildWikaTrafficMarketReport({
    period,
    overviewResult,
    overviewSummary
  });

  const markdown = renderWikaManagementSummaryMarkdown(managementReport);
  const productMarkdown = renderWikaProductReportMarkdown(productReport);
  const orderMarkdown = renderWikaOrderReportMarkdown(orderReport);
  const trafficMarketMarkdown =
    renderWikaTrafficMarketReportMarkdown(trafficMarketReport);
  const output = {
    generatedAt: new Date().toISOString(),
    period,
    overview: overviewResult,
    overviewSummary,
    orders: orderResult,
    orderSummary,
    officialProducts: officialProductResult,
    productPerformance: productPerformanceResult,
    productPerformanceSummary,
    productRecommendations,
    unifiedProducts: unifiedProductResult,
    unifiedProductSummary,
    unifiedProductRecommendations,
    managementReport,
    productReport,
    orderReport,
    trafficMarketReport
  };

  const outputDirectory = path.resolve(
    "projects",
    "wika",
    "data",
    "reports",
    "generated",
    period
  );

  ensureDirectory(outputDirectory);

  const managementJsonPath = path.join(outputDirectory, "management-summary.json");
  const managementMarkdownPath = path.join(
    outputDirectory,
    "management-summary.md"
  );
  const productJsonPath = path.join(outputDirectory, "product-report.json");
  const productMarkdownPath = path.join(outputDirectory, "product-report.md");
  const orderJsonPath = path.join(outputDirectory, "order-report.json");
  const orderMarkdownPath = path.join(outputDirectory, "order-report.md");
  const trafficMarketJsonPath = path.join(
    outputDirectory,
    "traffic-market-report.json"
  );
  const trafficMarketMarkdownPath = path.join(
    outputDirectory,
    "traffic-market-report.md"
  );
  const rawDataPath = path.join(outputDirectory, "wika-page-data.json");

  writeJson(rawDataPath, output);
  writeJson(managementJsonPath, managementReport);
  writeText(managementMarkdownPath, markdown);
  writeJson(productJsonPath, productReport);
  writeText(productMarkdownPath, productMarkdown);
  writeJson(orderJsonPath, orderReport);
  writeText(orderMarkdownPath, orderMarkdown);
  writeJson(trafficMarketJsonPath, trafficMarketReport);
  writeText(trafficMarketMarkdownPath, trafficMarketMarkdown);

  return {
    period,
    overviewResult,
    orderResult,
    unifiedProductResult,
    productPerformanceResult,
    managementReport,
    files: {
      managementJsonPath,
      managementMarkdownPath,
      productJsonPath,
      productMarkdownPath,
      orderJsonPath,
      orderMarkdownPath,
      trafficMarketJsonPath,
      trafficMarketMarkdownPath,
      rawDataPath
    }
  };
}

async function main() {
  const periods = resolvePeriods(process.argv.slice(2));

  if (periods.length === 0) {
    throw new Error("No supported periods were provided. Use 7d and/or 30d.");
  }

  const outputs = [];

  for (const period of periods) {
    const result = await generateForPeriod(period);
    outputs.push({
      period: result.period,
      overview: {
        total_impressions: result.overviewResult.snapshot.total_impressions,
        total_clicks: result.overviewResult.snapshot.total_clicks,
        click_through_rate: result.managementReport.overview.clickThroughRate,
        store_uv: result.overviewResult.snapshot.store_uv,
        daily_inquiries: result.overviewResult.snapshot.daily_inquiries
      },
      orders: {
        created_order_count: result.orderResult.summary.current.created_order_count,
        successful_order_count:
          result.orderResult.summary.current.successful_order_count,
        received_order_amount:
          result.orderResult.summary.current.received_order_amount,
        successful_buyer_count:
          result.orderResult.summary.current.successful_buyer_count,
        trend_points_count: result.orderResult.trends.length
      },
      products: {
        official_total_item:
          result.unifiedProductResult.official_result.total_item,
        matched_count: result.unifiedProductResult.coverage.matched_count,
        official_only_count:
          result.unifiedProductResult.coverage.official_only_count,
        performance_only_count:
          result.unifiedProductResult.coverage.performance_only_count,
        performance_coverage_status:
          result.unifiedProductResult.performance_result.coverage_status
      },
      files: result.files
    });
  }

  console.log(JSON.stringify(outputs, null, 2));
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        error: error.message,
        details: error.details ?? null
      },
      null,
      2
    )
  );
  process.exitCode = 1;
});

