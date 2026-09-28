export type DashboardChartPoint = {
  label: string;
  value: number;
};

export type DashboardSubstitution = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
};

export type DashboardPartner = {
  id: string;
  name: string;
  logoUrl: string | null;
  portalUrl: string | null;
  websiteUrl: string | null;
};

export type DashboardVisit = {
  id: string;
  employee: string;
  fullName: string;
  agenda: string;
  visitType: string;
  outTime: string;
  inTime: string | null;
  remarks: string | null;
  mine: boolean;
  status: string;
};

export type DashboardOverview = {
  adminView: boolean;
  invMonth: string;
  salesMonth: string;
  today: string;
  activeVisitId: string | null;
  leaveBalance: number;
  leavesToday: number;
  substitutions: DashboardSubstitution[];
  partners: DashboardPartner[];
  hasTarget: boolean;
  monthlyTarget: number;
  crmWon: number;
  inventoryAchievement: number;
  progress: {
    achieved: number;
    target: number;
    remaining: number;
    percent: number;
    cappedPercent: number;
  };
  yearly: {
    year: number;
    achieved: number;
    target: number;
    remaining: number;
    percent: number;
    startDate: string;
    endDate: string;
  };
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
  salesDistribution: {
    month: string;
    points: DashboardChartPoint[];
    deliveryMonthTotal: number;
  };
  topDebtors: Array<{ name: string; totalDebt: number }>;
  fieldVisits: DashboardVisit[];
};
