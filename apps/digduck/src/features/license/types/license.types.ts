export interface LicenseKey {
  value: string;
  formatted: string;
  isValid: boolean;
}

export interface LicenseVerificationResult {
  success: boolean;
  message?: string;
  userType: "user" | "admin";
  licenseInfo?: {
    expiryDate: string;
    userEmail: string;
    productName: string;
    phoneNumber?: string;
    userName?: string;
    allowedDevices?: number;
    activatedDevices?: any[];
  };
  token?: string;
  user?: {
    id: number;
    email: string;
    name: string;
  };
}

export interface LicenseState {
  licenseKey: string;
  isVerifying: boolean;
  error: string;
  isValid: boolean;
  userType?: "user" | "admin";
  verificationResult?: LicenseVerificationResult;
}

export interface LicenseVerificationProps {
  onLicenseVerified?: (
    licenseKey: string,
    result: LicenseVerificationResult
  ) => void;
  onError?: (error: string) => void;
}

export type LicenseStatus =
  | "idle"
  | "verifying"
  | "valid"
  | "invalid"
  | "error";
