import { PlatformType } from "@prisma/client";

export interface JWTPayload {
  userId: string;
  email: string;
  licenseKey?: string;
  deviceId?: string;
  iat?: number;
  exp?: number;
}

// Service-related types
export interface LicenseLoginCredentials {
  licenseKey: string;
  deviceId: string;
  platform?: PlatformType;
}

export interface RegisterData {
  email: string;
  name: string;
}

export interface User {
  id: number;
  email: string;
  name: string | null;
  nickname: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LicenseInfo {
  allowedDevices: number;
  activatedDevices: any[];
  isActive: boolean;
}

export interface LoginResult {
  token: string;
  user: User;
  licenseInfo: LicenseInfo;
  purchasedItems?: any[];
}
