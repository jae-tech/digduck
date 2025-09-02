import { LicenseSubscriptionType, PlatformType, ItemType } from '@prisma/client'

// 디바이스 정보 타입
export interface DeviceInfo {
  deviceId: string
  platform: PlatformType
  activatedAt: string
}

// 라이센스 사용자 생성 요청
export interface CreateLicenseUserRequest {
  email: string
  allowedDevices?: number
  maxTransfers?: number
}

// 구독 생성 요청
export interface CreateSubscriptionRequest {
  userEmail: string
  subscriptionType: LicenseSubscriptionType
  paymentId?: string
}

// 구독 연장 요청
export interface ExtendSubscriptionRequest {
  userEmail: string
  months: number
  subscriptionType?: LicenseSubscriptionType
  paymentId?: string
}

// 디바이스 활성화 요청
export interface ActivateDeviceRequest {
  userEmail: string
  deviceId: string
  platform: PlatformType
}

// 디바이스 이전 요청
export interface TransferDeviceRequest {
  userEmail: string
  oldDeviceId: string
  newDeviceId: string
  platform: PlatformType
}

// 아이템 구매 요청
export interface PurchaseItemRequest {
  userEmail: string
  itemType: ItemType
  quantity: number
}

// 라이센스 검증 응답
export interface LicenseVerificationResponse {
  isValid: boolean
  isActive: boolean
  userEmail: string
  licenseKey: string
  allowedDevices: number
  activatedDevices: DeviceInfo[]
  maxTransfers: number
  subscription?: {
    type: LicenseSubscriptionType
    startDate: Date
    endDate: Date
    isActive: boolean
  }
}

// 라이센스 상태 응답
export interface LicenseStatusResponse {
  userEmail: string
  licenseKey: string
  allowedDevices: number
  maxTransfers: number
  activatedDevices: DeviceInfo[]
  activeDeviceCount: number
  hasActiveSubscription: boolean
  subscription?: {
    id: number
    type: LicenseSubscriptionType
    startDate: Date
    endDate: Date
    isActive: boolean
    paymentId?: string
  }
  items: {
    id: number
    itemType: ItemType
    quantity: number
    purchasedAt: Date
  }[]
  deviceTransfers: {
    id: number
    oldDeviceId: string
    newDeviceId: string
    platform: PlatformType
    transferDate: Date
  }[]
}

// 에러 타입
export class LicenseError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'LicenseError'
  }
}

// 에러 코드
export enum LicenseErrorCodes {
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  LICENSE_NOT_FOUND = 'LICENSE_NOT_FOUND',
  INVALID_LICENSE_KEY = 'INVALID_LICENSE_KEY',
  SUBSCRIPTION_NOT_FOUND = 'SUBSCRIPTION_NOT_FOUND',
  SUBSCRIPTION_EXPIRED = 'SUBSCRIPTION_EXPIRED',
  DEVICE_LIMIT_EXCEEDED = 'DEVICE_LIMIT_EXCEEDED',
  DEVICE_NOT_FOUND = 'DEVICE_NOT_FOUND',
  TRANSFER_LIMIT_EXCEEDED = 'TRANSFER_LIMIT_EXCEEDED',
  DUPLICATE_LICENSE = 'DUPLICATE_LICENSE',
  INVALID_SUBSCRIPTION_TYPE = 'INVALID_SUBSCRIPTION_TYPE'
}