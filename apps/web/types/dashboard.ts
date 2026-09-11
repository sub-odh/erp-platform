export type DashboardChartPoint = {
  label: string;
  value: number;
};

export type DashboardOverview = {
  leaveBalance: number;
  leavesToday: number;
  availableInventory: number;
  pendingMemos: number;
  totalDue: number;
  yearTrend: DashboardChartPoint[];
  salesPerformance: {
    "7d": DashboardChartPoint[];
    "30d": DashboardChartPoint[];
    "90d": DashboardChartPoint[];
    "1y": DashboardChartPoint[];
  };
  fieldVisits: Array<{
    employee: string;
    agenda: string;
    status: string;
  }>;
  progress: {
    month: string;
    achieved: number;
    target: number;
    remaining: number;
    percent: number;
  };
  crmWon: number;
  inventoryAchievement: {
    month: string;
    achieved: number;
  };
  salesDistribution: {
    month: string;
    points: DashboardChartPoint[];
  };
  topDebtors: Array<{ name: string; totalDebt: number }>;
  yearly: {
    year: number;
    achieved: number;
    target: number;
    remaining: number;
    percent: number;
  };
};
