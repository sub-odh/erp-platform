export interface SalesOrderStaffRow {
  userId: string | null;
  name: string;
  amount: number;
}

export interface SalesOrderWonStaffRow extends SalesOrderStaffRow {
  vsTargetPercent: number;
}

export interface SalesOrderReportMonth {
  key: string;
  label: string;
  salesOrderValue: number;
  salesOrderCount: number;
  wonDealValue: number;
  staffSalesOrders: SalesOrderStaffRow[];
  staffWonDeals: SalesOrderStaffRow[];
}

export interface SalesOrderReport {
  months: SalesOrderReportMonth[];
  staffSalesOrders: SalesOrderStaffRow[];
  staffWonDeals: SalesOrderWonStaffRow[];
}
