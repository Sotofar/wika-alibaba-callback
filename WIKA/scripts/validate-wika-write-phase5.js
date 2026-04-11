const PRODUCTION_BASE_URL = "https://api.wikapacking.com";

async function fetchJson(pathname) {
  const response = await fetch(`${PRODUCTION_BASE_URL}${pathname}`);
  const text = await response.text();
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("json")) {
    throw new Error(`Expected JSON from ${pathname}, got ${contentType}`);
  }

  return {
    status: response.status,
    body: JSON.parse(text)
  };
}

function summarizeResult(label, result) {
  return {
    label,
    status: result.status,
    ok: result.body?.ok ?? null,
    error_category: result.body?.error_category ?? null,
    raw_root_key: result.body?.raw_root_key ?? null,
    request_meta: result.body?.request_meta ?? null,
    response_meta: result.body?.response_meta ?? null
  };
}

async function main() {
  const productList = await fetchJson(
    "/integrations/alibaba/wika/data/products/list?page_size=1"
  );
  const firstProduct = productList.body?.items?.[0];
  if (!firstProduct?.id) {
    throw new Error("No WIKA product sample available");
  }

  const productDetail = await fetchJson(
    `/integrations/alibaba/wika/data/products/detail?product_id=${firstProduct.id}`
  );
  const categoryId = Number(
    productDetail.body?.product?.category_id ??
      firstProduct.category_id ??
      firstProduct.cat_id
  );
  if (!Number.isFinite(categoryId)) {
    throw new Error("Product detail did not return category_id");
  }

  const mediaList = await fetchJson(
    "/integrations/alibaba/wika/data/media/list?current_page=1&page_size=2&location_type=ALL_GROUP"
  );
  const mediaGroups = await fetchJson(
    "/integrations/alibaba/wika/data/media/groups"
  );
  const schemaRenderDraft = await fetchJson(
    `/integrations/alibaba/wika/data/products/schema/render/draft?cat_id=${categoryId}&product_id=${firstProduct.id}`
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        product_reference: {
          product_id: Number(firstProduct.id),
          category_id: categoryId
        },
        routes: [
          summarizeResult("media_list", mediaList),
          summarizeResult("media_groups", mediaGroups),
          summarizeResult("schema_render_draft", schemaRenderDraft)
        ]
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
