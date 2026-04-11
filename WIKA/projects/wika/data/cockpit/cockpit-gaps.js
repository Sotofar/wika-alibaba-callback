function uniqueStrings(values = []) {
  return [...new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean))];
}

export const STORE_UNAVAILABLE_DIMENSIONS = Object.freeze([
  "traffic_source",
  "country_source",
  "quick_reply_rate"
]);

export const PRODUCT_UNAVAILABLE_DIMENSIONS = Object.freeze([
  "access_source",
  "inquiry_source",
  "country_source",
  "period_over_period_change"
]);

export const ORDER_UNAVAILABLE_DIMENSIONS = Object.freeze(["country_structure"]);

export function buildCrossSectionGaps() {
  return {
    store: {
      unavailable_dimensions: [...STORE_UNAVAILABLE_DIMENSIONS],
      note: "Store coverage currently includes only the confirmed mydata official subset and its derived comparison layer."
    },
    product: {
      unavailable_dimensions: [...PRODUCT_UNAVAILABLE_DIMENSIONS],
      note: "Product coverage still keeps sample/cap boundaries and does not include source, country, inquiry-source, or official period-over-period fields."
    },
    order: {
      unavailable_dimensions: [...ORDER_UNAVAILABLE_DIMENSIONS],
      note: "Order coverage currently remains at conservative derived summary/comparison, and country_structure is still unavailable."
    },
    combined_unavailable_dimensions: uniqueStrings([
      ...STORE_UNAVAILABLE_DIMENSIONS,
      ...PRODUCT_UNAVAILABLE_DIMENSIONS,
      ...ORDER_UNAVAILABLE_DIMENSIONS
    ]),
    task6_excluded: true
  };
}
