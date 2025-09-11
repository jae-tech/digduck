export interface AdminStatsFilter {
  period?: "day" | "week" | "month" | "year";
  startDate?: string;
  endDate?: string;
}

export interface LicenseFilter {
  page?: number;
  limit?: number;
  search?: string;
  status?: "active" | "expired" | "suspended" | "revoked";
  licenseType?: "user" | "admin";
}

export interface LicenseStats {
  total: number;
  active: number;
  expired: number;
  suspended: number;
  revoked: number;
  admin: number;
  expiringSoon: number;
}

export interface LicenseListResult {
  licenses: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Controller request types
export interface AdminStatsQuery {
  period?: "day" | "week" | "month" | "year";
  startDate?: string;
  endDate?: string;
}

export interface LicenseQuery {
  page?: string;
  limit?: string;
  search?: string;
  status?: "active" | "expired" | "suspended" | "revoked";
  licenseType?: "user" | "admin";
}
