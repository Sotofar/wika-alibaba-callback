export const ADS_IMPORT_REQUIRED_FIELDS = Object.freeze([
  "date",
  "spend",
  "impressions",
  "clicks"
])

export const ADS_IMPORT_OPTIONAL_FIELDS = Object.freeze([
  "campaign_name",
  "campaign_id",
  "ad_group_name",
  "ad_group_id",
  "keyword",
  "inquiries",
  "ctr",
  "cpc",
  "conversion",
  "inquiry_rate",
  "budget",
  "bid",
  "region",
  "device",
  "currency",
  "source_file"
])

export const ADS_IMPORT_NUMERIC_FIELDS = Object.freeze([
  "spend",
  "impressions",
  "clicks",
  "inquiries",
  "ctr",
  "cpc",
  "conversion",
  "inquiry_rate",
  "budget",
  "bid"
])

export const ADS_IMPORT_DIMENSION_FIELDS = Object.freeze([
  "campaign_name",
  "campaign_id",
  "ad_group_name",
  "ad_group_id",
  "keyword",
  "region",
  "device",
  "currency",
  "source_file"
])

export const ADS_IMPORT_TEMPLATE_COLUMNS = Object.freeze([
  "date",
  "campaign_name",
  "campaign_id",
  "ad_group_name",
  "ad_group_id",
  "keyword",
  "spend",
  "impressions",
  "clicks",
  "inquiries",
  "ctr",
  "cpc",
  "conversion",
  "inquiry_rate",
  "budget",
  "bid",
  "region",
  "device",
  "currency",
  "source_file"
])

export const ADS_IMPORT_SCHEMA = Object.freeze({
  schema_version: "stage42_ads_import_v1",
  source_type: "manual_import",
  required_fields: [...ADS_IMPORT_REQUIRED_FIELDS],
  optional_fields: [...ADS_IMPORT_OPTIONAL_FIELDS],
  numeric_fields: [...ADS_IMPORT_NUMERIC_FIELDS],
  dimension_fields: [...ADS_IMPORT_DIMENSION_FIELDS],
  template_columns: [...ADS_IMPORT_TEMPLATE_COLUMNS],
  identifier_rule: "campaign_name or campaign_id must exist",
  date_rule: "date must be normalizable to YYYY-MM-DD",
  boundary_statement: {
    manual_import_only: true,
    not_official_ads_api: true,
    current_permissions_do_not_confirm_stable_ads_route: true,
    no_platform_write_action_attempted: true
  }
})

export function getAdsImportTemplateColumns() {
  return [...ADS_IMPORT_TEMPLATE_COLUMNS]
}

export function isAdsImportFieldSupported(fieldName) {
  return ADS_IMPORT_TEMPLATE_COLUMNS.includes(String(fieldName ?? "").trim())
}
