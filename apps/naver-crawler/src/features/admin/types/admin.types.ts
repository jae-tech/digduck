export interface AdminSession {
  isAuthenticated: boolean;
  adminId: string | null;
  loginTime: Date | null;
  lastActivity: Date | null;
}

export interface LicenseData {
  id: string;
  licenseKey: string;
  userEmail: string;
  productName: string;
  issueDate: string;
  expiryDate: string;
  status: "active" | "expired" | "revoked" | "suspended";
  activationCount: number;
  maxActivations: number;
  lastUsed: string | null;
}

export interface AdminStats {
  totalLicenses: number;
  activeLicenses: number;
  expiredLicenses: number;
  revokedLicenses: number;
  recentActivations: number;
}

export interface AdminAction {
  id: string;
  adminId: string;
  action: "create" | "revoke" | "suspend" | "reactivate" | "extend";
  targetLicense: string;
  timestamp: string;
  details?: string;
}
