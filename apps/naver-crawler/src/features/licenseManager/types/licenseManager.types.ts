export interface LicenseRecord {
  id: string;
  licenseKey: string;
  userEmail: string;
  productName: string;
  licenseType: "user" | "admin";
  status: "active" | "expired" | "revoked" | "suspended";
  issueDate: string;
  expiryDate: string;
  lastUsed: string | null;
  activationCount: number;
  maxActivations: number;
  phoneNumber?: string; // 관리자 라이센스용
  ipAddress?: string;
  deviceInfo?: string;
}

export interface LicenseFilter {
  status?: string;
  licenseType?: string;
  productName?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface LicenseUpdateData {
  userEmail?: string;
  productName?: string;
  expiryDate?: string;
  maxActivations?: number;
  status?: "active" | "expired" | "revoked" | "suspended";
}

export interface LicenseStats {
  total: number;
  active: number;
  expired: number;
  revoked: number;
  suspended: number;
  admin: number;
  expiringSoon: number; // 30일 내 만료
}

export interface BulkAction {
  action: "activate" | "suspend" | "revoke" | "extend" | "delete";
  licenseIds: string[];
  data?: {
    expiryDate?: string;
    reason?: string;
  };
}
