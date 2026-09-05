export interface AdminStats {
  users: {
    total: number;
    verified: number;
    admins: number;
  };
  subscriptions: {
    total: number;
    active: number;
    canceled: number;
  };
  payments: {
    total: number;
    totalRevenue: number;
    successful: number;
  };
  uploads: {
    total: number;
    totalSize: number;
  };
}
