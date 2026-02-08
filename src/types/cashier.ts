export type CashierSession = {
  openedAt: string;
  openingAmount: number;
  closedAt: string | null;
  closingAmount: number | null;
};

export type CashierOpenRequest = {
  openingAmount: number;
};

export type CashierCloseRequest = {
  closingAmount: number;
};
