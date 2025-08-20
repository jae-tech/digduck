export interface LicenseConfig {
  licenseType: "user" | "admin";
  userEmail: string;
  productName: string;
  expiryDate: string;
  maxActivations: number;
  phoneNumber?: string; // 관리자 라이센스용
}

export interface GeneratedLicense {
  licenseKey: string;
  config: LicenseConfig;
  generatedAt: string;
  status: "active" | "pending";
}

export interface LicenseGenerationResult {
  success: boolean;
  licenseKey?: string;
  message: string;
  error?: string;
}

export interface BulkLicenseConfig {
  count: number;
  config: LicenseConfig;
  prefix?: string;
}

export interface LicenseStats {
  totalGenerated: number;
  activeCount: number;
  pendingCount: number;
  expiredCount: number;
}
