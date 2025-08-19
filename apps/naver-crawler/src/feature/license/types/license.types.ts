export interface LicenseKey {
  value: string;
  formatted: string;
  isValid: boolean;
}

export interface LicenseVerificationResult {
  success: boolean;
  message?: string;
  licenseInfo?: {
    expiryDate: string;
    userEmail: string;
    productName: string;
  };
}

export interface LicenseState {
  licenseKey: string;
  isVerifying: boolean;
  error: string;
  isValid: boolean;
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
