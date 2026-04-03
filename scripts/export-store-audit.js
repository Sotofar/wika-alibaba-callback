import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const BASE_URL = "https://api.wikapacking.com";
const TIME_ZONE = "Asia/Shanghai";
const PRODUCT_PAGE_SIZE = 100;
const ORDER_PAGE_SIZE = 50;
const ORDER_DETAIL_SAMPLE_SIZE = 20;

function formatLocalDate(date = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function formatLocalDateTime(date = new Date()) {
  const datePart = new Intl.DateTimeFormat("sv-SE", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
  const timePart = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(date);

  return `${datePart} ${timePart}`;
}

function parseShanghaiDateTime(value) {
  if (!value || typeof value !== "string") {
    return null;
  }

  return new Date(value.replace(" ", "T") + "+08:00");
}

function daysBetween(dateValue, base = new Date()) {
  if (!dateValue) {
    return null;
  }

  const target = dateValue instanceof Date ? dateValue : parseShanghaiDateTime(dateValue);
  if (!target || Number.isNaN(target.getTime())) {
    return null;
  }

  return Math.floor((base.getTime() - target.getTime()) / (24 * 60 * 60 * 1000));
}

function formatPercent(value, digits = 2) {
  if (value == null || Number.isNaN(Number(value))) {
    return null;
  }

  return `${(Number(value) * 100).toFixed(digits)}%`;
}

function escapeCsv(value) {
  if (value == null) {
    return "";
  }

  const stringValue = typeof value === "string" ? value : JSON.stringify(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }

  return stringValue;
}

function toCsv(rows, columns) {
  const header = columns.join(",");
  const body = rows.map((row) => columns.map((column) => escapeCsv(row[column])).join(","));
  return `${[header, ...body].join("\n")}\n`;
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      accept: "application/json"
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`请求失败 ${response.status} ${url}\n${text}`);
  }

  return response.json();
}

async function fetchPaginatedProducts(account) {
  let currentPage = 1;
  let totalItem = null;
  let pageSize = PRODUCT_PAGE_SIZE;
  let source = null;
  const items = [];

  while (true) {
    const payload = await fetchJson(
      `${BASE_URL}/integrations/alibaba/${account}/data/products/list?page_size=${PRODUCT_PAGE_SIZE}&current_page=${currentPage}`
    );

    if (!source) {
      source = payload.source;
    }

    const pageItems = payload.items ?? [];
    totalItem ??= payload.response_meta?.total_item ?? pageItems.length;
    pageSize = payload.response_meta?.page_size ?? pageSize;
    items.push(...pageItems);

    const totalPages = Math.max(1, Math.ceil(totalItem / pageSize));
    if (pageItems.length === 0 || currentPage >= totalPages || items.length >= totalItem) {
      break;
    }

    currentPage += 1;
  }

  return {
    account,
    source,
    total_item: totalItem ?? items.length,
    page_size: pageSize,
    pages_fetched: currentPage,
    items
  };
}

async function fetchPaginatedOrderList(account) {
  let startPage = 0;
  let totalCount = null;
  let pageSize = ORDER_PAGE_SIZE;
  let source = null;
  const items = [];

  while (true) {
    const payload = await fetchJson(
      `${BASE_URL}/integrations/alibaba/${account}/data/orders/list?page_size=${ORDER_PAGE_SIZE}&start_page=${startPage}`
    );

    if (!source) {
      source = payload.source;
    }

    const pageItems = payload.items ?? [];
    totalCount ??= payload.response_meta?.total_count ?? pageItems.length;
    pageSize = payload.response_meta?.page_size ?? pageSize;
    items.push(...pageItems);

    if (pageItems.length === 0 || items.length >= totalCount) {
      break;
    }

    startPage += 1;
  }

  return {
    account,
    source,
    total_count: totalCount ?? items.length,
    page_size: pageSize,
    pages_fetched: startPage + 1,
    items
  };
}

async function fetchOrderDetailSample(account, tradeIds) {
  const uniqueTradeIds = [...new Set(tradeIds)].slice(0, ORDER_DETAIL_SAMPLE_SIZE);
  const results = [];

  for (const tradeId of uniqueTradeIds) {
    const payload = await fetchJson(
      `${BASE_URL}/integrations/alibaba/${account}/data/orders/detail?e_trade_id=${encodeURIComponent(tradeId)}`
    );
    results.push(payload.item);
  }

  return results;
}

function countBy(items, getter) {
  const map = new Map();

  for (const item of items) {
    const key = getter(item);
    if (!key) {
      continue;
    }

    map.set(key, (map.get(key) ?? 0) + 1);
  }

  return map;
}

function summarizeProducts(fullCatalog) {
  const items = fullCatalog.items ?? [];
  const statusMap = countBy(items, (item) => item.status ?? "unknown");
  const groupMap = countBy(items, (item) => item.group_name ?? "未分组");
  const now = new Date();
  let staleOver180 = 0;
  let staleOver365 = 0;
  let updatedIn30 = 0;
  let updatedIn90 = 0;
  let noGroupCount = 0;
  let latestModified = null;

  for (const item of items) {
    if (!item.group_name) {
      noGroupCount += 1;
    }

    const ageDays = daysBetween(item.gmt_modified, now);
    if (ageDays != null) {
      if (ageDays <= 30) {
        updatedIn30 += 1;
      }
      if (ageDays <= 90) {
        updatedIn90 += 1;
      }
      if (ageDays > 180) {
        staleOver180 += 1;
      }
      if (ageDays > 365) {
        staleOver365 += 1;
      }
    }

    if (item.gmt_modified && (!latestModified || item.gmt_modified > latestModified)) {
      latestModified = item.gmt_modified;
    }
  }

  return {
    total_item: fullCatalog.total_item ?? items.length,
    page_size: fullCatalog.page_size,
    pages_fetched: fullCatalog.pages_fetched,
    approved_count: statusMap.get("approved") ?? 0,
    non_approved_count: items.length - (statusMap.get("approved") ?? 0),
    no_group_count: noGroupCount,
    latest_modified: latestModified,
    updated_in_30_days: updatedIn30,
    updated_in_90_days: updatedIn90,
    stale_over_180_days: staleOver180,
    stale_over_365_days: staleOver365,
    top_groups: [...groupMap.entries()]
      .map(([groupName, count]) => ({ group_name: groupName, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    status_distribution: [...statusMap.entries()]
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count)
  };
}

function buildDailyCountSeries(orderItems) {
  const dateMap = new Map();

  for (const item of orderItems) {
    const label = item.create_date?.format_date;
    if (!label) {
      continue;
    }

    const dayKey = label.split(",").slice(0, 2).join(",");
    dateMap.set(dayKey, (dateMap.get(dayKey) ?? 0) + 1);
  }

  return [...dateMap.entries()]
    .map(([date_label, order_count]) => ({ date_label, order_count }))
    .sort((a, b) => new Date(a.date_label) - new Date(b.date_label));
}

function summarizeOfficialOrderDetails(detailItems) {
  const tradeStatusMap = new Map();
  const shipmentMethodMap = new Map();
  const fulfillmentMap = new Map();
  let totalAmount = 0;
  let productAmount = 0;
  let shipmentFee = 0;
  let advanceAmount = 0;
  const productMap = new Map();

  for (const item of detailItems) {
    const tradeStatus = item.trade_status ?? "unknown";
    tradeStatusMap.set(tradeStatus, (tradeStatusMap.get(tradeStatus) ?? 0) + 1);

    const shipmentMethod = item.shipment_method ?? "unknown";
    shipmentMethodMap.set(shipmentMethod, (shipmentMethodMap.get(shipmentMethod) ?? 0) + 1);

    const fulfillment = item.fulfillment_channel ?? "unknown";
    fulfillmentMap.set(fulfillment, (fulfillmentMap.get(fulfillment) ?? 0) + 1);

    totalAmount += Number(item.amount?.amount ?? 0);
    productAmount += Number(item.product_total_amount?.amount ?? 0);
    shipmentFee += Number(item.shipment_fee?.amount ?? 0);
    advanceAmount += Number(item.advance_amount?.amount ?? 0);

    for (const product of item.order_products ?? []) {
      const key = product.product_id ?? product.name;
      const existing = productMap.get(key) ?? {
        product_id: product.product_id ?? null,
        product_name: product.name ?? "未命名产品",
        order_count: 0,
        quantity_total: 0,
        estimated_amount_total: 0
      };

      existing.order_count += 1;
      existing.quantity_total += Number(product.quantity ?? 0);
      existing.estimated_amount_total += Number(product.quantity ?? 0) * Number(product.unit_price?.amount ?? 0);
      productMap.set(key, existing);
    }
  }

  return {
    sample_size: detailItems.length,
    trade_status_distribution: [...tradeStatusMap.entries()]
      .map(([code, count]) => ({ code, label: code, count }))
      .sort((a, b) => b.count - a.count),
    shipment_method_distribution: [...shipmentMethodMap.entries()]
      .map(([code, count]) => ({ code, label: code, count }))
      .sort((a, b) => b.count - a.count),
    fulfillment_channel_distribution: [...fulfillmentMap.entries()]
      .map(([code, count]) => ({ code, label: code, count }))
      .sort((a, b) => b.count - a.count),
    amount_summary: {
      total_amount: Number(totalAmount.toFixed(2)),
      product_total_amount: Number(productAmount.toFixed(2)),
      shipment_fee_amount: Number(shipmentFee.toFixed(2)),
      advance_amount: Number(advanceAmount.toFixed(2))
    },
    top_products: [...productMap.values()]
      .sort((a, b) => b.estimated_amount_total - a.estimated_amount_total)
      .slice(0, 10)
      .map((item) => ({
        ...item,
        quantity_total: Number(item.quantity_total.toFixed(2)),
        estimated_amount_total: Number(item.estimated_amount_total.toFixed(2))
      }))
  };
}

function buildModuleStatus({ status, source, verification, note }) {
  return { status, source, verification, note };
}

function buildIndustrySamples() {
  return [
    {
      企业品牌名称: "OptiPak",
      来源类型: "独立站",
      网址或来源说明: "https://optipak.com/",
      主要产品方向: "眼镜盒、眼镜布、眼镜袋、展示与包装配套",
      产品层面优势: "产品线围绕光学包装高度集中，结构清晰。",
      产品层面值得学习点: "把 case、cloth、pouch、display 作为一站式组合表达。",
      产品层面当前不建议照搬点: "欧美本地供货和库存叙事不适合直接复制到国内工厂场景。",
      运营层面优势: "首页和目录结构围绕采购分类展开，导航清楚。",
      运营层面值得学习点: "把采购入口、系列入口、配套入口明确分开。",
      运营层面当前需要改进点: "WIKA/XD 都需要更强的系列化目录表达。",
      对WIKA的启发: "强化 case + pouch + cloth 组合采购逻辑。",
      对XD的启发: "先缩窄主线，再做一站式配套表达。",
      优先级: "高"
    },
    {
      企业品牌名称: "TOPYOU Packaging",
      来源类型: "独立站",
      网址或来源说明: "https://topyoupackaging.com/",
      主要产品方向: "定制眼镜盒、眼镜袋、纸盒、礼品包装",
      产品层面优势: "强调定制和包装方案，适合礼品包装与品牌客户。",
      产品层面值得学习点: "把材料、工艺、logo 工艺、定制能力前置。",
      产品层面当前不建议照搬点: "过度礼品化的视觉不适合所有工业采购场景。",
      运营层面优势: "强调整体包装解决方案而不是散装单品。",
      运营层面值得学习点: "把定制能力、MOQ、打样、交期做成标准模块。",
      运营层面当前需要改进点: "WIKA/XD 都需要更明确的定制流程表达。",
      对WIKA的启发: "提升包装套装、礼品化包装方案的表达完整度。",
      对XD的启发: "建立“定制包装主线”，避免目录过散。",
      优先级: "高"
    },
    {
      企业品牌名称: "Classic Packing",
      来源类型: "独立站",
      网址或来源说明: "https://www.classicpacking.com/",
      主要产品方向: "眼镜包装盒、皮盒、纸盒、展示盒",
      产品层面优势: "强调外观与展示感，适合高感知价值包装。",
      产品层面值得学习点: "高展示感包装与标准包装并行。",
      产品层面当前不建议照搬点: "过多高展示包装会拉高沟通门槛，不适合全部 SKU。",
      运营层面优势: "产品分类与图片风格更偏陈列和礼品采购。",
      运营层面值得学习点: "重点款露出更集中，首页视觉层级更鲜明。",
      运营层面当前需要改进点: "WIKA/XD 的重点款露出都还不够强。",
      对WIKA的启发: "可增加高展示感包装组合作为形象款。",
      对XD的启发: "先聚焦核心包装系列，再做形象款补充。",
      优先级: "中"
    },
    {
      企业品牌名称: "Lesi Packing",
      来源类型: "独立站",
      网址或来源说明: "https://www.lesi-packing.com/",
      主要产品方向: "眼镜盒、眼镜袋、镜布、包装套装",
      产品层面优势: "产品线完整，强调配套和定制。",
      产品层面值得学习点: "适合学习如何把 packaging set 讲清楚。",
      产品层面当前不建议照搬点: "过多同质 SKU 会稀释焦点。",
      运营层面优势: "配套产品和定制能力并列展示。",
      运营层面值得学习点: "把配套配件做成标准跟单入口。",
      运营层面当前需要改进点: "WIKA/XD 需要更清晰的套装入口。",
      对WIKA的启发: "强化清洁配件与包装主产品的组合销售。",
      对XD的启发: "建立标准套装和单品的分层展示。",
      优先级: "高"
    },
    {
      企业品牌名称: "Albinex / Royal Case",
      来源类型: "独立站",
      网址或来源说明: "https://en.albinex.pl/",
      主要产品方向: "眼镜盒、光学包装、展示与配件",
      产品层面优势: "系列清晰，结构标准化，适合采购对比。",
      产品层面值得学习点: "同一系列多材质多结构并列展示。",
      产品层面当前不建议照搬点: "欧洲本地市场导向内容不必原样照搬。",
      运营层面优势: "目录规整，系列感强。",
      运营层面值得学习点: "用系列管理代替零散产品堆叠。",
      运营层面当前需要改进点: "XD 特别需要先完成系列收口。",
      对WIKA的启发: "把现有 case/pouch/folding case 整理成更清晰系列。",
      对XD的启发: "先做系列聚焦，再做内容扩展。",
      优先级: "中"
    },
    {
      企业品牌名称: "Hermitin",
      来源类型: "独立站",
      网址或来源说明: "https://www.hermitin.com/",
      主要产品方向: "镜布、清洁套装、眼镜配件、包装辅材",
      产品层面优势: "对镜布和清洁配套规格表达更清晰。",
      产品层面值得学习点: "把耗材和清洁类做参数化、规格化表达。",
      产品层面当前不建议照搬点: "不宜让 cleaner/cloth 抢占包装主线位置。",
      运营层面优势: "参数和规格说明更完整。",
      运营层面值得学习点: "小件配套也要讲清尺寸、材质、印刷和包装方式。",
      运营层面当前需要改进点: "WIKA/XD 都要减少空泛描述，增加规格信息。",
      对WIKA的启发: "镜布、清洁液、喷雾套件可以更参数化。",
      对XD的启发: "辅助品类需要更清晰规格和组合表达。",
      优先级: "中"
    },
    {
      企业品牌名称: "Alibaba 眼镜盒头部卖家样本",
      来源类型: "阿里国际站公开列表",
      网址或来源说明: "https://www.alibaba.com/showroom/eyeglass-case.html",
      主要产品方向: "眼镜盒、眼镜袋、镜布、清洁配件",
      产品层面优势: "公开市场上可见大量包装套装和低 MOQ 表达。",
      产品层面值得学习点: "标题通常直接带 custom logo、MOQ、材质和用途。",
      产品层面当前不建议照搬点: "部分标题堆词严重，不适合直接复制。",
      运营层面优势: "标题与主图更强地围绕采购关键词。",
      运营层面值得学习点: "把 custom logo、MOQ、packaging set 放进首屏关键信息。",
      运营层面当前需要改进点: "WIKA/XD 都要强化采购关键词与首屏信息密度。",
      对WIKA的启发: "优化标题和首屏信息密度，提高 B2B 检索匹配。",
      对XD的启发: "先做主线 SKU 的关键词和首屏标准化。",
      优先级: "高"
    }
  ];
}

function buildWikaData({
  productionDebug,
  productionProductSummary,
  fullProducts,
  fullOrderList,
  orderDetailSample,
  localManagement30d,
  localOrder30d,
  localProduct30d,
  localTraffic30d
}) {
  const productSummary = summarizeProducts(fullProducts);
  const orderListSeries = buildDailyCountSeries(fullOrderList.items);
  const orderDetailSummary = summarizeOfficialOrderDetails(orderDetailSample);
  const orderHighlights = localManagement30d.orderHighlights ?? {};
  const marketConcentration = localTraffic30d.marketConcentration ?? {};

  return {
    storeKey: "wika",
    accountName: "WIKA 国际站",
    generatedAt: formatLocalDateTime(),
    sourceScope: {
      auth_products_orders: "生产环境实时抓取（products + orders 最小官方路由）",
      orders_overview_market_analysis: "已验证本地卖家页面态导出（非生产无状态）"
    },
    runtimeStatus: {
      bootstrapTokenPresent: productionDebug.wika_bootstrap_refresh_token_present,
      tokenFileExists: productionDebug.wika_token_file_exists,
      tokenLoaded: productionDebug.wika_token_loaded,
      runtimeLoadedFrom: productionDebug.wika_runtime_loaded_from,
      hasRefreshToken: productionDebug.wika_has_refresh_token,
      lastRefreshReason: productionDebug.wika_last_refresh_reason,
      lastRefreshError: productionDebug.wika_last_refresh_error
    },
    moduleStatus: {
      authBootstrap: buildModuleStatus({
        status: "已完成并已线上验证",
        source: "生产 OAuth + bootstrap refresh token",
        verification: "已完成生产授权、回调、写回 Railway 与冷启动恢复",
        note: `debug 显示 ${productionDebug.wika_runtime_loaded_from}`
      }),
      productsMain: buildModuleStatus({
        status: "已完成并已线上验证",
        source: "生产官方 API",
        verification: "已通过 /sync + access_token + sha256 返回真实产品主数据",
        note: `官方产品总数 ${productionProductSummary.summary?.snapshot?.total_item ?? productSummary.total_item}`
      }),
      productsPerformance: buildModuleStatus({
        status: "已验证真实数据",
        source: "本地卖家页面态（非生产无状态）",
        verification: "已验证 30d 产品表现、重点产品与优化清单",
        note: "仅能作为已验证真实数据，不可误写为生产无状态模块"
      }),
      ordersListDetail: buildModuleStatus({
        status: "已完成并已线上验证（最小 list/detail）",
        source: "生产官方 API",
        verification: "已上线并线上验证 /data/orders/list 与 /data/orders/detail",
        note: "当前只完成最小字段返回，不等于 orders 模块整体完成"
      }),
      ordersAnalysis: buildModuleStatus({
        status: "已验证真实数据",
        source: "本地卖家页面态（非生产无状态）",
        verification: "已验证订单汇总、趋势、分页池、国家结构、产品贡献",
        note: "当前不是生产无状态 API 路径"
      }),
      overview: buildModuleStatus({
        status: "已验证真实数据",
        source: "本地卖家页面态（非生产无状态）",
        verification: "已验证概览核心指标、访客国家、市场结构变化",
        note: "当前不是生产无状态 API 路径"
      }),
      inquiriesCustomers: buildModuleStatus({
        status: "未接通",
        source: "无独立生产数据源",
        verification: "当前没有可单独导出的 inquiries/messages/customers 模块",
        note: "不能做完整询盘质量与客户画像分析"
      })
    },
    products: {
      productionSummarySnapshot: productionProductSummary.summary,
      fullCatalogSummary: productSummary,
      sampleProducts: fullProducts.items.slice(0, 20),
      performance30d: {
        coverage: localProduct30d.coverage,
        topTrafficProducts: localProduct30d.topTrafficProducts?.slice(0, 10) ?? [],
        highTrafficLowBusinessProducts: localProduct30d.highTrafficLowBusinessProducts?.slice(0, 10) ?? [],
        orderSignalProducts: localProduct30d.orderSignalProducts?.slice(0, 10) ?? [],
        focusOptimizationList: localProduct30d.focusOptimizationList?.slice(0, 10) ?? [],
        limitations: localProduct30d.limitations ?? []
      }
    },
    orders: {
      listSnapshot: {
        totalCount: fullOrderList.total_count,
        pageSize: fullOrderList.page_size,
        pagesFetched: fullOrderList.pages_fetched,
        sampleTradeIds: fullOrderList.items.slice(0, 20).map((item) => item.trade_id),
        dailyCreateDistribution: orderListSeries,
        sampleItems: fullOrderList.items.slice(0, 20)
      },
      detailSample: {
        sampleSize: orderDetailSample.length,
        summary: orderDetailSummary,
        items: orderDetailSample,
        limitations: [
          "当前 detail 已验证到订单金额、状态、发货方式、订单产品，但仍是最小字段返回。",
          "当前官方 detail 样本仅用于最小结构判断，不替代 WIKA 本地页面态 orders 分析层。"
        ]
      },
      summary30d: orderHighlights.current ?? null,
      comparison30d: orderHighlights.comparison ?? null,
      trend30d: orderHighlights.trend ?? null,
      snapshotCoverage: orderHighlights.snapshotCoverage ?? null,
      buyerCountryDistribution: orderHighlights.buyerCountryDistribution?.slice(0, 10) ?? [],
      shippingCountryDistribution: orderHighlights.shippingCountryDistribution?.slice(0, 10) ?? [],
      productContributionTop: orderHighlights.productContributionTop?.slice(0, 10) ?? [],
      amountBreakdown: localOrder30d.snapshotCoverage?.amount_breakdown ?? null,
      orderStatusDistribution: localOrder30d.snapshotCoverage?.order_status_distribution ?? [],
      shippingTypeDistribution: localOrder30d.snapshotCoverage?.shipping_type_distribution ?? [],
      limitations: [
        "WIKA 当前同时存在两层 orders 能力：官方最小 list/detail 已线上验证，本地页面态分析层已验证但不是生产无状态 API。",
        "产品贡献金额为已验证列表口径，不应等同于最终财务结算口径。"
      ]
    },
    overview: {
      overviewSnapshot30d: localTraffic30d.overviewSnapshot ?? null,
      trafficSourceHighlights: localTraffic30d.trafficSourceHighlights?.slice(0, 10) ?? [],
      marketProfile: localTraffic30d.marketProfile ?? null,
      visitorCountryDistribution: localTraffic30d.visitorCountryDistribution?.slice(0, 10) ?? [],
      marketStructureChanges: localTraffic30d.marketStructureChanges?.slice(0, 10) ?? [],
      marketConcentration,
      limitations: [
        "当前 overview 市场维度来源已验证，但不是生产无状态 API。",
        "extra_info_raw 为原始趋势串，时间语义仍应以页面口径解释。"
      ]
    },
    diagnostics: {
      factual: [
        `WIKA 已完成生产授权、bootstrap 回写与冷启动恢复，当前 runtime 来源为 ${productionDebug.wika_runtime_loaded_from}。`,
        `WIKA 官方产品主数据当前总量为 ${productionProductSummary.summary?.snapshot?.total_item ?? productSummary.total_item} 条。`,
        `WIKA 官方订单 list 当前可读总量为 ${fullOrderList.total_count} 条；本地页面态分析层已验证分页池覆盖 ${orderHighlights.snapshotCoverage?.returnedItemCount ?? 0} 条订单。`,
        `WIKA 30d 访客市场 Top1 为 ${marketConcentration.top1_country ?? "未知"}，占比 ${formatPercent(marketConcentration.top1_share) ?? "未知"}。`
      ],
      inference: [
        "WIKA 当前已具备产品、订单、市场三个层面的持续观察能力，运营成熟度明显高于 XD。",
        "WIKA 的主要压力不在授权接入，而在重点产品承接效率和市场集中度控制。"
      ],
      unknown: [
        "WIKA 当前没有独立 inquiries/messages/customers 生产模块，不能输出完整询盘质量或客户画像诊断。"
      ]
    }
  };
}

function buildXdData({ productionDebug, productSummary, fullProducts, fullOrderList, orderDetailSample }) {
  const productCatalogSummary = summarizeProducts(fullProducts);
  const orderListSeries = buildDailyCountSeries(fullOrderList.items);
  const orderDetailSummary = summarizeOfficialOrderDetails(orderDetailSample);
  const recentOrderIds = fullOrderList.items.slice(0, 20).map((item) => item.trade_id);

  return {
    storeKey: "xd",
    accountName: "XD 国际站",
    generatedAt: formatLocalDateTime(),
    sourceScope: {
      auth_products_orders: "生产环境实时抓取",
      overview: "当前暂无可用生产无状态数据源",
      inquiries_messages_customers: "当前官方接口权限阻塞"
    },
    runtimeStatus: {
      bootstrapTokenPresent: productionDebug.xd_bootstrap_refresh_token_present,
      tokenFileExists: productionDebug.xd_token_file_exists,
      tokenLoaded: productionDebug.xd_token_loaded,
      runtimeLoadedFrom: productionDebug.xd_runtime_loaded_from,
      hasRefreshToken: productionDebug.xd_has_refresh_token,
      lastRefreshReason: productionDebug.xd_last_refresh_reason,
      lastRefreshError: productionDebug.xd_last_refresh_error
    },
    moduleStatus: {
      authBootstrap: buildModuleStatus({
        status: "已完成并已线上验证",
        source: "生产 OAuth + bootstrap refresh token",
        verification: "已完成生产授权、写回 Railway 与冷启动恢复",
        note: `debug 显示 ${productionDebug.xd_runtime_loaded_from}`
      }),
      productsMain: buildModuleStatus({
        status: "已完成并已线上验证",
        source: "生产官方 API",
        verification: "已通过 /sync + access_token + sha256 返回真实产品主数据",
        note: `官方产品总数 ${productSummary.summary?.snapshot?.total_item ?? productCatalogSummary.total_item}`
      }),
      ordersListDetail: buildModuleStatus({
        status: "已完成并已线上验证（最小 list/detail）",
        source: "生产官方 API",
        verification: "已上线并线上验证 /data/orders/list 与 /data/orders/detail",
        note: "当前只完成最小字段返回，不等于 orders 模块整体完成"
      }),
      ordersAnalysis: buildModuleStatus({
        status: "已上线待验收",
        source: "生产官方 API",
        verification: "可基于全量 list + detail 样本做初步结构判断",
        note: "仍缺完整汇总、趋势、国家结构、产品贡献的生产路由"
      }),
      overview: buildModuleStatus({
        status: "未接通",
        source: "暂无可用生产数据源",
        verification: "WIKA 对应实现是本地页面态，当前不能直接复用为 XD 生产路径",
        note: "不得误标为已完成"
      }),
      inquiriesCustomers: buildModuleStatus({
        status: "未接通",
        source: "官方接口权限阻塞",
        verification: "customer batch 探测返回 InsufficientPermission",
        note: "当前没有已验证可用生产数据源"
      })
    },
    products: {
      productionSummarySnapshot: productSummary.summary,
      fullCatalogSummary: productCatalogSummary,
      sampleProducts: fullProducts.items.slice(0, 20)
    },
    orders: {
      listSnapshot: {
        totalCount: fullOrderList.total_count,
        pageSize: fullOrderList.page_size,
        pagesFetched: fullOrderList.pages_fetched,
        sampleTradeIds: recentOrderIds,
        dailyCreateDistribution: orderListSeries,
        sampleItems: fullOrderList.items.slice(0, 20)
      },
      detailSample: {
        sampleSize: orderDetailSample.length,
        summary: orderDetailSummary,
        items: orderDetailSample,
        limitations: [
          "当前 detail 已验证到订单金额、状态、发货方式、订单产品，但尚未稳定拿到国家/地区结构字段。",
          "当前 detail 样本仅用于最小结构判断，不能替代完整 orders 分析层。"
        ]
      }
    },
    overview: {
      status: "未接通",
      reason: "当前暂无已验证可用的生产无状态 overview 数据源。"
    },
    inquiriesMessagesCustomers: {
      status: "未接通",
      reason: "当前官方 customer/inquiry 相关接口权限阻塞。"
    },
    diagnostics: {
      factual: [
        `XD 已完成生产授权、bootstrap 回写与冷启动恢复，当前 runtime 来源为 ${productionDebug.xd_runtime_loaded_from}。`,
        `XD 官方产品主数据当前总量为 ${productSummary.summary?.snapshot?.total_item ?? productCatalogSummary.total_item} 条。`,
        `XD 官方订单列表当前可读总量为 ${fullOrderList.total_count} 条。`,
        `XD 最近 ${orderDetailSample.length} 条 detail 样本中，订单状态以 ${orderDetailSummary.trade_status_distribution[0]?.code ?? "未知"} 为主。`
      ],
      inference: [
        "XD 当前已经完成 auth/bootstrap、products 主数据、orders 最小官方 list/detail，但经营分析层明显落后于 WIKA。",
        "XD 产品目录总量高于 WIKA，但主线仍偏分散，存在非包装核心品类稀释焦点的问题。"
      ],
      unknown: [
        "XD overview 未接通，无法基于真实生产数据判断访客国家、流量来源和市场集中度。",
        "XD inquiries/messages/customers 未接通，无法判断询盘质量与客户结构。",
        "XD orders 当前尚不能给出完整国家结构与产品贡献结论。"
      ]
    }
  };
}

function buildComparisonRows(wika, xd) {
  return [
    {
      模块: "Auth / Bootstrap",
      指标: "冷启动恢复",
      说明: "debug 中 runtime_loaded_from",
      WIKA值: wika.runtimeStatus.runtimeLoadedFrom,
      WIKA状态: wika.moduleStatus.authBootstrap.status,
      XD值: xd.runtimeStatus.runtimeLoadedFrom,
      XD状态: xd.moduleStatus.authBootstrap.status,
      来源说明: "两店都来自生产 auth/debug"
    },
    {
      模块: "Products",
      指标: "官方产品总数",
      说明: "生产官方产品主数据总量",
      WIKA值: wika.products.fullCatalogSummary.total_item,
      WIKA状态: wika.moduleStatus.productsMain.status,
      XD值: xd.products.fullCatalogSummary.total_item,
      XD状态: xd.moduleStatus.productsMain.status,
      来源说明: "两店都来自生产官方 products/list"
    },
    {
      模块: "Products",
      指标: "未分组产品数",
      说明: "主数据中 group_name 为空的产品数",
      WIKA值: wika.products.fullCatalogSummary.no_group_count,
      WIKA状态: wika.moduleStatus.productsMain.status,
      XD值: xd.products.fullCatalogSummary.no_group_count,
      XD状态: xd.moduleStatus.productsMain.status,
      来源说明: "基于全量产品主数据统计"
    },
    {
      模块: "Products",
      指标: "表现数据层",
      说明: "是否已有可用于流量/商机诊断的产品表现数据",
      WIKA值: "已验证真实数据（本地页面态）",
      WIKA状态: wika.moduleStatus.productsPerformance.status,
      XD值: "未接通",
      XD状态: "未接通",
      来源说明: "WIKA 仅限已验证本地页面态；XD 尚无该层"
    },
    {
      模块: "Orders",
      指标: "最小官方 list/detail",
      说明: "是否已有生产官方 orders 最小路由并可读",
      WIKA值: wika.orders.listSnapshot.totalCount,
      WIKA状态: wika.moduleStatus.ordersListDetail.status,
      XD值: xd.orders.listSnapshot.totalCount,
      XD状态: xd.moduleStatus.ordersListDetail.status,
      来源说明: "两店都来自生产官方 orders/list"
    },
    {
      模块: "Orders",
      指标: "订单分析层",
      说明: "是否具备国家结构/产品贡献/状态分布等高层结果",
      WIKA值: "已验证真实数据（本地页面态）",
      WIKA状态: wika.moduleStatus.ordersAnalysis.status,
      XD值: "已上线待验收",
      XD状态: xd.moduleStatus.ordersAnalysis.status,
      来源说明: "XD 当前只有基于 list/detail 样本的初步分析"
    },
    {
      模块: "Overview",
      指标: "市场与流量维度",
      说明: "是否有已验证 overview/market 数据",
      WIKA值: "已验证真实数据（本地页面态）",
      WIKA状态: wika.moduleStatus.overview.status,
      XD值: "暂无可用生产数据源",
      XD状态: xd.moduleStatus.overview.status,
      来源说明: "XD 当前不能误标为已接通"
    },
    {
      模块: "Inquiries / Customers",
      指标: "客户与询盘模块",
      说明: "是否存在独立可用生产数据源",
      WIKA值: "未接通",
      WIKA状态: wika.moduleStatus.inquiriesCustomers.status,
      XD值: "未接通",
      XD状态: xd.moduleStatus.inquiriesCustomers.status,
      来源说明: "XD 当前存在官方权限阻塞"
    }
  ];
}

function buildMainReport({ dateLabel, wika, xd }) {
  const lines = [];
  const wikaTopTraffic = wika.products.performance30d.topTrafficProducts?.[0];
  const xdTopGroup = xd.products.fullCatalogSummary.top_groups?.[0];
  const xdTopStatus = xd.orders.detailSample.summary.trade_status_distribution?.[0];
  const wikaTopBuyerMarket = wika.overview.marketConcentration?.top1_country;

  lines.push(`# WIKA + XD 运营总报告（${dateLabel}）`);
  lines.push("");
  lines.push(`生成时间：${formatLocalDateTime()}`);
  lines.push("");
  lines.push("## 一、整体状态");
  lines.push("");
  lines.push("| 模块 | WIKA | XD | 备注 |");
  lines.push("| --- | --- | --- | --- |");
  lines.push(`| Auth / Bootstrap | ${wika.moduleStatus.authBootstrap.status} | ${xd.moduleStatus.authBootstrap.status} | 两店都已验证冷启动恢复 |`);
  lines.push(`| Products 主数据 | ${wika.moduleStatus.productsMain.status} | ${xd.moduleStatus.productsMain.status} | 两店都已线上验证官方主数据 |`);
  lines.push(`| Products 表现层 | ${wika.moduleStatus.productsPerformance.status} | 未接通 | WIKA 为本地页面态验证；XD 仍缺表现层 |`);
  lines.push(`| Orders 最小官方路由 | ${wika.moduleStatus.ordersListDetail.status} | ${xd.moduleStatus.ordersListDetail.status} | 两店都已线上验证官方 list/detail |`);
  lines.push(`| Orders 分析层 | ${wika.moduleStatus.ordersAnalysis.status} | ${xd.moduleStatus.ordersAnalysis.status} | WIKA 为本地页面态验证；XD 仍缺完整生产分析层 |`);
  lines.push(`| Overview / Market | ${wika.moduleStatus.overview.status} | ${xd.moduleStatus.overview.status} | XD 当前暂无生产数据源 |`);
  lines.push(`| Inquiries / Customers | ${wika.moduleStatus.inquiriesCustomers.status} | ${xd.moduleStatus.inquiriesCustomers.status} | XD 当前存在权限阻塞 |`);
  lines.push("");
  lines.push("## 二、WIKA 诊断");
  lines.push("");
  lines.push("### 基于真实数据的结论");
  for (const item of wika.diagnostics.factual) {
    lines.push(`- ${item}`);
  }
  lines.push("");
  lines.push("### 基于现有结构的推断");
  for (const item of wika.diagnostics.inference) {
    lines.push(`- ${item}`);
  }
  lines.push("");
  lines.push("### 暂不能判断");
  for (const item of wika.diagnostics.unknown) {
    lines.push(`- ${item}`);
  }
  lines.push("");
  lines.push("### WIKA 当前重点问题");
  lines.push(`- 市场集中度：Top1 市场 ${wikaTopBuyerMarket ?? "未知"}，占比 ${formatPercent(wika.overview.marketConcentration?.top1_share) ?? "未知"}，风险等级 ${wika.overview.marketConcentration?.risk_level ?? "未知"}。`);
  lines.push(`- 订单覆盖：当前官方 list 已可读 ${wika.orders.listSnapshot.totalCount ?? 0} 条订单；更完整的国家结构与产品贡献仍主要来自本地页面态分析层。`);
  lines.push(`- 产品表现：当前重点流量产品是 ${wikaTopTraffic?.product_name ?? "未知"}，商机率 ${wikaTopTraffic?.business_rate_label ?? "未知"}，需要持续优化承接效率。`);
  lines.push("");
  lines.push("## 三、XD 诊断");
  lines.push("");
  lines.push("### 基于真实数据的结论");
  for (const item of xd.diagnostics.factual) {
    lines.push(`- ${item}`);
  }
  lines.push("");
  lines.push("### 基于现有结构的推断");
  for (const item of xd.diagnostics.inference) {
    lines.push(`- ${item}`);
  }
  lines.push("");
  lines.push("### 暂不能判断");
  for (const item of xd.diagnostics.unknown) {
    lines.push(`- ${item}`);
  }
  lines.push("");
  lines.push("### XD 当前短板");
  lines.push(`- 产品主线：当前目录 Top1 分组是 ${xdTopGroup?.group_name ?? "未分组"}（${xdTopGroup?.count ?? 0} 条），但整体目录仍比 WIKA 更宽，更容易分散包装主线。`);
  lines.push(`- Orders：当前只完成官方 list/detail 最小路由，detail 样本里状态以 ${xdTopStatus?.code ?? "未知"} 为主，但还不能替代完整订单分析层。`);
  lines.push(`- Overview / Customers：当前都未接通，不能输出流量市场与客户质量判断。`);
  lines.push("");
  lines.push("## 四、WIKA vs XD 差距分析");
  lines.push("");
  lines.push(`- 数据成熟度：WIKA 已形成“产品主数据 + 产品表现 + 订单结构 + 市场结构”的持续观察能力；XD 目前完成的是“auth/bootstrap + products 主数据 + orders 最小 list/detail”。`);
  lines.push(`- 产品结构：XD 官方产品主数据 ${xd.products.fullCatalogSummary.total_item} 条，高于 WIKA 的 ${wika.products.fullCatalogSummary.total_item} 条，但更宽的目录不等于更好的经营焦点。`);
  lines.push(`- 经营洞察：WIKA 已能识别高流量低商机率产品与市场集中度风险；XD 目前还不能对流量来源、访客国家和询盘质量做真实诊断。`);
  lines.push("");
  lines.push("## 五、最优先的 5 条运营建议");
  lines.push("");
  lines.push("1. WIKA：围绕美国市场的主打包装套装、镜布、清洁套件，优先优化主图、MOQ、样品、交期和定制说明，降低高流量产品的转化损耗。");
  lines.push("2. WIKA：不要只盯美国，优先针对法国、巴西、墨西哥等已出现访客的市场补充国家级文案和产品组合页，降低单一市场依赖。");
  lines.push("3. XD：先做产品目录收口，弱化 frames/goggles 等非包装主线，把 case、pouch、cloth、cleaner、gift bag 作为核心包装体系重新整理。");
  lines.push("4. XD：在已上线的官方 orders list/detail 基础上，下一步只补最小汇总/趋势层，不要回退到本地页面 cookie 路线，也不要跳到未验证 overview。");
  lines.push("5. 两店：把 MOQ、打样、交期、logo 工艺、材料、环保选项、工厂能力做成固定模板，提升 B2B 采购决策信息密度。");
  lines.push("");
  lines.push("## 六、行业头部样本摘要");
  lines.push("");
  lines.push("- 公开样本普遍把 case、pouch、cloth、cleaner、bag 做成一站式采购组合，而不是零散单品堆叠。");
  lines.push("- 头部样本通常把定制能力、MOQ、交期、打样和材料工艺放在首屏或分类入口，而不是放到后续沟通中。");
  lines.push("- WIKA 更需要学习如何把已有包装主线做得更像采购解决方案；XD 更需要先收窄主线，再扩充运营层。");
  lines.push("");
  lines.push("## 七、未完成模块");
  lines.push("");
  lines.push("- XD overview：当前暂无已验证可用的生产无状态数据源。");
  lines.push("- XD inquiries / messages / customers：当前官方接口权限阻塞，不能标记为已接通。");
  lines.push("- XD orders 高层汇总/趋势/国家结构：当前仍未形成完整生产路由。");
  return `${lines.join("\n")}\n`;
}

function buildReadme({ dateLabel, outputDir }) {
  return `# README_交付说明

生成时间：${formatLocalDateTime()}

桌面交付目录：\`${outputDir}\`

## 文件清单
- README_交付说明.md：本说明
- WIKA_XD_运营总报告_${dateLabel}.md：主报告
- WIKA_完整数据_${dateLabel}.json：WIKA 结构化数据
- XD_完整数据_${dateLabel}.json：XD 结构化数据
- WIKA_XD_对比汇总_${dateLabel}.csv：两店关键指标与模块状态对比
- 行业领头企业对比表_${dateLabel}.csv：行业样本对比表
- 行业领头企业分析报告_${dateLabel}.md：行业样本分析结论

## 口径说明
- 只导出真实可读、已验证来源的数据。
- WIKA 的 products 与 orders 最小 list/detail 当前来自生产官方 API。
- WIKA 的 overview / orders 分析层 / 市场维度当前来自已验证本地卖家页面态，不是生产无状态 API。
- XD 的 products 与 orders 最小 list/detail 当前来自生产官方 API。
- XD overview 当前暂无可用生产数据源；XD inquiries / customers 当前存在权限阻塞。

## 状态纪律
- “路由存在”不等于“模块已完成”
- “授权成功”不等于“数据可读”
- “token 落盘”不等于“冷启动恢复已验证”
- “orders 最小 list/detail 可读”不等于“orders 模块整体完成”
`;
}

function buildIndustryReport({ dateLabel, industrySamples }) {
  const lines = [];
  lines.push(`# 行业领头企业分析报告（${dateLabel}）`);
  lines.push("");
  lines.push(`生成时间：${formatLocalDateTime()}`);
  lines.push("");
  lines.push("## 1. 行业头部企业样本选择逻辑");
  lines.push("- 优先选择与眼镜盒、眼镜袋、镜布、清洁配件、礼品包装高度相关的公开样本。");
  lines.push("- 优先选择能直接观察到产品分类、MOQ、交期、定制能力、视觉表达和 B2B 采购信息组织方式的企业。");
  lines.push("- 不根据公开站点推断其内部销售额，只比较公开可观察的产品层和运营层。");
  lines.push("");
  lines.push("## 2. 产品层面对比结论");
  lines.push("- 头部样本普遍不是只卖单一眼镜盒，而是把 case、pouch、cloth、cleaner、bag 组合成一站式采购方案。");
  lines.push("- 更强的同行会把材料、工艺、MOQ、交期、打样、环保与认证前置，减少客户二次追问。");
  lines.push("- WIKA 与 XD 共同短板是“组合方案表达还不够强”，尤其在包装套装和配套耗材的结构化呈现上。");
  lines.push("- XD 还存在目录过宽的问题，frames/goggles 等非包装主线会稀释包装供应商定位。");
  lines.push("");
  lines.push("## 3. 运营层面对比结论");
  lines.push("- 头部样本更强调采购入口、系列入口、应用场景入口，而不是简单产品堆叠。");
  lines.push("- 标题和首屏文案通常直接写 custom logo、MOQ、lead time、sample、material、OEM/ODM。");
  lines.push("- 相比之下，WIKA/XD 仍需要进一步把“采购决策信息”放到前面，而不是只展示产品。");
  lines.push("");
  lines.push("## 4. WIKA 当前最需要学习的点");
  lines.push("- 强化包装套装与配套耗材的一站式表达。");
  lines.push("- 把样品、交期、定制流程、环保材料和工厂能力模块化前置。");
  lines.push("- 针对美国以外市场增加更有针对性的产品组合和内容入口。");
  lines.push("");
  lines.push("## 5. XD 当前最需要学习的点");
  lines.push("- 先聚焦包装主线，再扩展非核心目录。");
  lines.push("- 用系列化管理替代“什么都卖一点”的目录感。");
  lines.push("- 在已有官方 products + orders 最小链路之上，补经营分析层，但不要跳过验证。");
  lines.push("");
  lines.push("## 6. WIKA 当前最需要改进的点");
  lines.push("- 控制美国市场依赖风险。");
  lines.push("- 继续提升高流量低商机率产品的承接效率。");
  lines.push("- 将已验证的产品/订单/市场观察沉淀成固定运营节奏。");
  lines.push("");
  lines.push("## 7. XD 当前最需要改进的点");
  lines.push("- 收窄目录、聚焦包装核心品类。");
  lines.push("- 继续只走已验证的官方链路补 orders 分析层。");
  lines.push("- 在 overview 未接通前，不做伪流量诊断。");
  lines.push("");
  lines.push("## 8. 哪些同行做法不适合直接照搬");
  lines.push("- 欧美本地库存供应商的站点叙事不适合直接复制到当前国内工厂型账号。");
  lines.push("- 过度礼品化或过宽的 accessories 目录会稀释包装主线，不应直接照搬到 XD。");
  lines.push("- 头部网站的高信息密度值得学习，但不能无差别堆词或堆概念。");
  lines.push("");
  lines.push("## 9. 最终建议：短期 / 中期 / 长期");
  lines.push("### 短期");
  lines.push("- WIKA：围绕包装套装、镜布、清洁件补齐首屏采购信息。");
  lines.push("- XD：先做目录收口与包装主线聚焦。");
  lines.push("### 中期");
  lines.push("- WIKA：持续优化重点产品承接页与市场分层内容。");
  lines.push("- XD：继续在官方 orders 路径上补最小汇总/趋势，不回退本地页面态。");
  lines.push("### 长期");
  lines.push("- 两店都要把 MOQ、打样、交期、定制能力、材料与工厂能力做成稳定的 B2B 内容资产。");
  lines.push("");
  lines.push("## 样本清单");
  for (const sample of industrySamples) {
    lines.push(`- **${sample.企业品牌名称}**（${sample.来源类型}）：${sample.网址或来源说明}`);
  }
  return `${lines.join("\n")}\n`;
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function main() {
  const dateLabel = formatLocalDate();
  const desktopDir = path.join(os.homedir(), "Desktop", `Alibaba_Store_Audit_${dateLabel}`);
  await ensureDir(desktopDir);

  const [productionDebug, xdDebug, wikaProductSummary, xdProductSummary] = await Promise.all([
    fetchJson(`${BASE_URL}/integrations/alibaba/auth/debug`),
    fetchJson(`${BASE_URL}/integrations/alibaba/xd/auth/debug`),
    fetchJson(`${BASE_URL}/integrations/alibaba/wika/reports/products/management-summary?page_size=10`),
    fetchJson(`${BASE_URL}/integrations/alibaba/xd/reports/products/management-summary?page_size=10`)
  ]);

  const [wikaProductsFull, xdProductsFull, wikaOrdersFull, xdOrdersFull] = await Promise.all([
    fetchPaginatedProducts("wika"),
    fetchPaginatedProducts("xd"),
    fetchPaginatedOrderList("wika"),
    fetchPaginatedOrderList("xd")
  ]);

  const [wikaOrderDetailSample, xdOrderDetailSample] = await Promise.all([
    fetchOrderDetailSample(
      "wika",
      wikaOrdersFull.items.map((item) => item.trade_id)
    ),
    fetchOrderDetailSample(
      "xd",
      xdOrdersFull.items.map((item) => item.trade_id)
    )
  ]);

  const wikaManagement30d = JSON.parse(
    await fs.readFile(path.join("projects", "wika", "data", "reports", "generated", "30d", "management-summary.json"), "utf8")
  );
  const wikaOrder30d = JSON.parse(
    await fs.readFile(path.join("projects", "wika", "data", "reports", "generated", "30d", "order-report.json"), "utf8")
  );
  const wikaProduct30d = JSON.parse(
    await fs.readFile(path.join("projects", "wika", "data", "reports", "generated", "30d", "product-report.json"), "utf8")
  );
  const wikaTraffic30d = JSON.parse(
    await fs.readFile(path.join("projects", "wika", "data", "reports", "generated", "30d", "traffic-market-report.json"), "utf8")
  );

  const wikaData = buildWikaData({
    productionDebug,
    productionProductSummary: wikaProductSummary,
    fullProducts: wikaProductsFull,
    fullOrderList: wikaOrdersFull,
    orderDetailSample: wikaOrderDetailSample,
    localManagement30d: wikaManagement30d,
    localOrder30d: wikaOrder30d,
    localProduct30d: wikaProduct30d,
    localTraffic30d: wikaTraffic30d
  });

  const xdData = buildXdData({
    productionDebug: xdDebug,
    productSummary: xdProductSummary,
    fullProducts: xdProductsFull,
    fullOrderList: xdOrdersFull,
    orderDetailSample: xdOrderDetailSample
  });

  const comparisonRows = buildComparisonRows(wikaData, xdData);
  const industrySamples = buildIndustrySamples();

  const files = {
    readme: path.join(desktopDir, "README_交付说明.md"),
    report: path.join(desktopDir, `WIKA_XD_运营总报告_${dateLabel}.md`),
    wikaJson: path.join(desktopDir, `WIKA_完整数据_${dateLabel}.json`),
    xdJson: path.join(desktopDir, `XD_完整数据_${dateLabel}.json`),
    compareCsv: path.join(desktopDir, `WIKA_XD_对比汇总_${dateLabel}.csv`),
    industryCsv: path.join(desktopDir, `行业领头企业对比表_${dateLabel}.csv`),
    industryReport: path.join(desktopDir, `行业领头企业分析报告_${dateLabel}.md`)
  };

  await Promise.all([
    fs.writeFile(files.readme, buildReadme({ dateLabel, outputDir: desktopDir }), "utf8"),
    fs.writeFile(files.report, buildMainReport({ dateLabel, wika: wikaData, xd: xdData }), "utf8"),
    writeJson(files.wikaJson, wikaData),
    writeJson(files.xdJson, xdData),
    fs.writeFile(
      files.compareCsv,
      toCsv(comparisonRows, ["模块", "指标", "说明", "WIKA值", "WIKA状态", "XD值", "XD状态", "来源说明"]),
      "utf8"
    ),
    fs.writeFile(
      files.industryCsv,
      toCsv(industrySamples, [
        "企业品牌名称",
        "来源类型",
        "网址或来源说明",
        "主要产品方向",
        "产品层面优势",
        "产品层面值得学习点",
        "产品层面当前不建议照搬点",
        "运营层面优势",
        "运营层面值得学习点",
        "运营层面当前需要改进点",
        "对WIKA的启发",
        "对XD的启发",
        "优先级"
      ]),
      "utf8"
    ),
    fs.writeFile(files.industryReport, buildIndustryReport({ dateLabel, industrySamples }), "utf8")
  ]);

  console.log(JSON.stringify({ desktopDir, files }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
