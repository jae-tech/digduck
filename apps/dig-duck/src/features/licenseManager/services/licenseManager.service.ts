import {
  type LicenseRecord,
  type LicenseFilter,
  type LicenseUpdateData,
  type LicenseStats,
  type BulkAction,
} from "../types/licenseManager.types";
import { apiHelpers } from "@/lib/apiClient";

export class LicenseManagerService {
  private static readonly API_BASE_URL = import.meta.env.VITE_API_URL || "";

  // 라이센스 목록 조회
  static async getLicenses(
    filter?: LicenseFilter,
    page = 1,
    limit = 20
  ): Promise<{
    licenses: LicenseRecord[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      // 실제 API 엔드포인트 사용
      const params = new URLSearchParams();
      if (filter?.search) {
        params.append("search", filter.search);
      }
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      // 실제 서버가 켜져있으면 실제 API 사용
      const result = await apiHelpers.get(`/license/admin/users`, Object.fromEntries(params));
      
      if (result.success) {
        // API 응답을 프론트엔드 형식으로 변환
        const licenses: LicenseRecord[] = result.data.users.map((user: any) => ({
          id: user.licenseKey,
          licenseKey: user.licenseKey,
          userEmail: user.email,
          productName: "Naver Crawler License",
          licenseType: user.licenseKey.startsWith('ADMIN') ? "admin" : "user",
          status: user.license_subscriptions?.[0]?.isActive ? "active" : "expired",
          issueDate: new Date(user.createdAt).toISOString().split('T')[0],
          expiryDate: user.license_subscriptions?.[0]?.endDate ? 
            new Date(user.license_subscriptions[0].endDate).toISOString().split('T')[0] : "N/A",
          lastUsed: undefined,
          activationCount: user.activatedDevices?.length || 0,
          maxActivations: user.allowedDevices,
          deviceInfo: user.activatedDevices?.map((d: any) => `${d.platform || 'Unknown'} - ${d.device_id}`).join(', ') || 'No devices',
        }));

        return {
          licenses,
          total: result.data.pagination.total,
          page: result.data.pagination.page,
          totalPages: result.data.pagination.totalPages
        };
      }
      
      throw new Error('Failed to fetch licenses');
    } catch (error) {
      console.error('Failed to get licenses:', error);
      // 개발용 시뮬레이션
      return this.simulateGetLicenses(filter, page, limit);
    }
  }

  // 라이센스 상세 조회
  static async getLicenseDetail(
    licenseId: string
  ): Promise<LicenseRecord | null> {
    try {
      return await apiHelpers.get(`/api/admin/licenses/${licenseId}`);
    } catch (error) {
      console.error("Failed to get license detail:", error);
      return null;
    }
  }

  // 라이센스 상태 업데이트
  static async updateLicense(
    licenseKey: string,
    data: LicenseUpdateData
  ): Promise<boolean> {
    try {
      const response = await apiHelpers.put(`/admin/licenses/${licenseKey}/status`, {
        action: data.status === 'active' ? 'activate' : data.status === 'suspended' ? 'suspend' : 'revoke'
      });

      return response.success;
    } catch (error) {
      console.error("Failed to update license:", error);
      return false;
    }
  }

  // 라이센스 삭제
  static async deleteLicense(licenseKey: string): Promise<boolean> {
    try {
      const response = await apiHelpers.delete(`/admin/licenses/${licenseKey}`);
      return response.success;
    } catch (error) {
      console.error("Failed to delete license:", error);
      return false;
    }
  }

  // 대량 작업
  static async bulkAction(action: BulkAction): Promise<boolean> {
    try {
      const response = await apiHelpers.post('/admin/licenses/bulk', action);
      return response.success;
    } catch (error) {
      console.error("Failed to perform bulk action:", error);
      return false;
    }
  }

  // 라이센스 통계 조회
  static async getLicenseStats(): Promise<LicenseStats> {
    try {
      // 실제 서버가 켜져있으면 실제 API 사용
      const result = await apiHelpers.get(`/admin/licenses/stats`);
      return result.data;
    } catch (error) {
      console.error('Failed to get license stats:', error);
      // 개발용 시뮬레이션
      return this.simulateGetStats();
    }
  }

  // 개발용 시뮬레이션 메서드들
  private static simulateGetLicenses(
    filter?: LicenseFilter,
    page = 1,
    limit = 20
  ) {
    // 시뮬레이션 데이터 생성
    const mockLicenses: LicenseRecord[] = [
      {
        id: "1",
        licenseKey: "ABC123DEF4567890",
        userEmail: "user1@digduck.app",
        productName: "Dig Duck Standard",
        licenseType: "user",
        status: "active",
        issueDate: "2024-01-15",
        expiryDate: "2025-01-15",
        lastUsed: "2024-08-19",
        activationCount: 1,
        maxActivations: 1,
        ipAddress: "192.168.1.100",
        deviceInfo: "Windows 11 - Chrome",
      },
      {
        id: "2",
        licenseKey: "ADMIN01012345678",
        userEmail: "admin@digduck.app",
        productName: "Dig Duck Admin",
        licenseType: "admin",
        status: "active",
        issueDate: "2024-01-01",
        expiryDate: "2025-12-31",
        lastUsed: "2024-08-20",
        activationCount: 3,
        maxActivations: 5,
        phoneNumber: "01012345678",
        ipAddress: "192.168.1.10",
      },
      {
        id: "3",
        licenseKey: "XYZ789GHI0123456",
        userEmail: "user2@digduck.app",
        productName: "Dig Duck Pro",
        licenseType: "user",
        status: "expired",
        issueDate: "2023-06-01",
        expiryDate: "2024-06-01",
        lastUsed: "2024-05-30",
        activationCount: 2,
        maxActivations: 3,
      },
      {
        id: "4",
        licenseKey: "TEST1234DEMO567",
        userEmail: "trial@digduck.app",
        productName: "Dig Duck Trial",
        licenseType: "user",
        status: "suspended",
        issueDate: "2024-08-01",
        expiryDate: "2024-09-01",
        lastUsed: undefined,
        activationCount: 0,
        maxActivations: 1,
      },
      {
        id: "5",
        licenseKey: "ENTERPRISE123456",
        userEmail: "enterprise@company.com",
        productName: "Enterprise License",
        licenseType: "user",
        status: "active",
        issueDate: "2024-03-01",
        expiryDate: "2025-03-01",
        lastUsed: "2024-08-18",
        activationCount: 10,
        maxActivations: 50,
      },
    ];

    // 필터 적용
    let filteredLicenses = [...mockLicenses];

    if (filter) {
      if (filter.status) {
        filteredLicenses = filteredLicenses.filter(
          (l) => l.status === filter.status
        );
      }
      if (filter.licenseType) {
        filteredLicenses = filteredLicenses.filter(
          (l) => l.licenseType === filter.licenseType
        );
      }
      if (filter.productName) {
        filteredLicenses = filteredLicenses.filter(
          (l) => l.productName === filter.productName
        );
      }
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        filteredLicenses = filteredLicenses.filter(
          (l) =>
            l.licenseKey.toLowerCase().includes(searchLower) ||
            l.userEmail.toLowerCase().includes(searchLower) ||
            l.productName.toLowerCase().includes(searchLower)
        );
      }
    }

    // 페이지네이션
    const total = filteredLicenses.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedLicenses = filteredLicenses.slice(startIndex, endIndex);

    return Promise.resolve({
      licenses: paginatedLicenses,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  }

  private static simulateGetStats(): LicenseStats {
    return {
      total: 1250,
      active: 987,
      expired: 156,
      revoked: 89,
      suspended: 18,
      admin: 12,
      expiringSoon: 45,
    };
  }
}
