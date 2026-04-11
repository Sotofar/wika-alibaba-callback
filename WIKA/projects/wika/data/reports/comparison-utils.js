function toNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function roundNumber(value, digits = 4) {
  if (!Number.isFinite(value)) {
    return null;
  }

  return Number(value.toFixed(digits));
}

function parseIsoDateParts(value) {
  const text = String(value ?? "").trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) {
    return null;
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3])
  };
}

function formatIsoDate({ year, month, day }) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function shiftIsoDateByDays(value, days) {
  const parts = parseIsoDateParts(value);
  if (!parts) {
    return null;
  }

  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function shiftIsoDateByMonths(value, months) {
  const parts = parseIsoDateParts(value);
  if (!parts) {
    return null;
  }

  const totalMonths = (parts.year * 12 + (parts.month - 1)) + months;
  const year = Math.floor(totalMonths / 12);
  const month = (totalMonths % 12) + 1;
  const day = Math.min(parts.day, daysInMonth(year, month));

  return formatIsoDate({ year, month, day });
}

export function calculateInclusiveDaySpan(startDate, endDate) {
  const start = Date.parse(String(startDate ?? ""));
  const end = Date.parse(String(endDate ?? ""));
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return null;
  }

  return Math.floor((end - start) / (24 * 60 * 60 * 1000)) + 1;
}

export function calculatePreviousComparableDateRange(dateRange = {}) {
  const startDate = String(dateRange?.start_date ?? "").trim();
  const endDate = String(dateRange?.end_date ?? "").trim();
  const daySpan = calculateInclusiveDaySpan(startDate, endDate);

  if (!startDate || !endDate || !daySpan) {
    return null;
  }

  const previousEndDate = shiftIsoDateByDays(startDate, -1);
  const previousStartDate = shiftIsoDateByDays(previousEndDate, -(daySpan - 1));
  if (!previousStartDate || !previousEndDate) {
    return null;
  }

  return {
    start_date: previousStartDate,
    end_date: previousEndDate,
    inclusive_day_span: daySpan
  };
}

export function isDateWithinWindows(statDate, dateWindows = []) {
  const target = Date.parse(String(statDate ?? ""));
  if (!Number.isFinite(target)) {
    return false;
  }

  return Array.isArray(dateWindows) && dateWindows.some((window) => {
    const start = Date.parse(String(window?.start_date ?? ""));
    const end = Date.parse(String(window?.end_date ?? ""));
    return Number.isFinite(start) && Number.isFinite(end) && start <= target && target <= end;
  });
}

export function calculatePreviousComparableStatDate(statDate, statisticsType, dateWindows = []) {
  const current = String(statDate ?? "").trim();
  if (!current) {
    return null;
  }

  let candidate = null;
  if (statisticsType === "day") {
    candidate = shiftIsoDateByDays(current, -1);
  } else if (statisticsType === "week") {
    candidate = shiftIsoDateByDays(current, -7);
  } else if (statisticsType === "month") {
    candidate = shiftIsoDateByMonths(current, -1);
  }

  if (!candidate) {
    return null;
  }

  return isDateWithinWindows(candidate, dateWindows) ? candidate : null;
}

export function buildMetricDelta(currentValue, previousValue) {
  const current = toNumber(currentValue);
  const previous = toNumber(previousValue);

  if (current === null && previous === null) {
    return {
      derived: true,
      current_value: null,
      previous_value: null,
      delta_value: null,
      delta_rate: null,
      trend_direction: "unknown"
    };
  }

  const deltaValue =
    current !== null && previous !== null ? roundNumber(current - previous) : null;
  const deltaRate =
    previous !== null && previous !== 0 && deltaValue !== null
      ? roundNumber(deltaValue / previous)
      : null;
  let trendDirection = "unknown";

  if (deltaValue !== null) {
    if (deltaValue > 0) {
      trendDirection = "up";
    } else if (deltaValue < 0) {
      trendDirection = "down";
    } else {
      trendDirection = "flat";
    }
  }

  return {
    derived: true,
    current_value: current,
    previous_value: previous,
    delta_value: deltaValue,
    delta_rate: deltaRate,
    trend_direction: trendDirection
  };
}

export function sumMetric(items = [], selector) {
  return roundNumber(
    (Array.isArray(items) ? items : []).reduce((sum, item) => {
      const value = toNumber(selector(item));
      return value === null ? sum : sum + value;
    }, 0)
  );
}

export function sortMetricDesc(items = [], selector) {
  return [...(Array.isArray(items) ? items : [])].sort((left, right) => {
    const leftValue = toNumber(selector(left)) ?? -Infinity;
    const rightValue = toNumber(selector(right)) ?? -Infinity;
    return rightValue - leftValue;
  });
}

export function toObjectByKey(items = [], keyName = "product_id") {
  const output = new Map();

  for (const item of Array.isArray(items) ? items : []) {
    const key = String(item?.[keyName] ?? "").trim();
    if (!key || output.has(key)) {
      continue;
    }

    output.set(key, item);
  }

  return output;
}

export function summarizeTrendDirections(metricComparisons = {}) {
  const values = Object.values(metricComparisons);

  return {
    up: values.filter((item) => item?.trend_direction === "up").length,
    down: values.filter((item) => item?.trend_direction === "down").length,
    flat: values.filter((item) => item?.trend_direction === "flat").length,
    unknown: values.filter((item) => item?.trend_direction === "unknown").length
  };
}
