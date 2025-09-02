export interface JWTPayload {
  userId: string;
  email: string;
  licenseKey?: string;
  deviceId?: string;
  iat?: number;
  exp?: number;
}
