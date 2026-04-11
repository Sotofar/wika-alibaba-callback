export function createEmptyManagementReport({ account, period }) {
  return {
    reportType: "management_summary",
    account,
    period,
    dataStatus: "pending_data_connection",
    overview: {},
    orderHighlights: {
      current: {},
      comparison: null,
      trend: {}
    },
    trafficSourceHighlights: [],
    growthPoints: [],
    issues: [],
    productHighlights: {
      topTraffic: [],
      highBusinessRate: [],
      highTrafficLowBusiness: []
    },
    marketHighlights: [],
    actionsReady: [],
    actionsNeedMoreData: [],
    nextActions: []
  };
}

export function createEmptyOperationsReport({ account, period }) {
  return {
    reportType: "operations_execution",
    account,
    period,
    dataStatus: "pending_data_connection",
    overview: {},
    productRanking: {
      trafficDrivers: [],
      highConversion: [],
      problemProducts: []
    },
    orderAnalysis: {},
    marketAnalysis: {},
    trafficAnalysis: {},
    adsAnalysis: {},
    actions: []
  };
}
