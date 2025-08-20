import {
  type LicenseRecord,
  type LicenseFilter,
  type LicenseUpdateData,
  type LicenseStats,
  type BulkAction,
} from "../types/licenseManager.types";

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
      const params = new URLSearchParams();
      if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
      }
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const response = await fetch(
        `${this.API_BASE_URL}/api/admin/licenses?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // 개발용 시뮬레이션
      return this.simulateGetLicenses(filter, page, limit);
    }
  }

  // 라이센스 상세 조회
  static async getLicenseDetail(
    licenseId: string
  ): Promise<LicenseRecord | null> {
    try {
      const response = await fetch(
        `${this.API_BASE_URL}/api/admin/licenses/${licenseId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to get license detail:", error);
      return null;
    }
  }

  // 라이센스 업데이트
  static async updateLicense(
    licenseId: string,
    data: LicenseUpdateData
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.API_BASE_URL}/api/admin/licenses/${licenseId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
          body: JSON.stringify(data),
        }
      );

      return response.ok;
    } catch (error) {
      console.error("Failed to update license:", error);
      return false;
    }
  }

  // 라이센스 삭제
  static async deleteLicense(licenseId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.API_BASE_URL}/api/admin/licenses/${licenseId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        }
      );

      return response.ok;
    } catch (error) {
      console.error("Failed to delete license:", error);
      return false;
    }
  }

  // 대량 작업
  static async bulkAction(action: BulkAction): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.API_BASE_URL}/api/admin/licenses/bulk`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
          body: JSON.stringify(action),
        }
      );

      return response.ok;
    } catch (error) {
      console.error("Failed to perform bulk action:", error);
      return false;
    }
  }

  // 라이센스 통계 조회
  static async getLicenseStats(): Promise<LicenseStats> {
    try {
      const response = await fetch(
        `${this.API_BASE_URL}/api/admin/licenses/stats`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
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
        userEmail: "user1@example.com",
        productName: "Standard License",
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
        userEmail: "admin@company.com",
        productName: "Admin License",
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
        userEmail: "user2@example.com",
        productName: "Pro License",
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
        userEmail: "test@example.com",
        productName: "Trial License",
        licenseType: "user",
        status: "suspended",
        issueDate: "2024-08-01",
        expiryDate: "2024-09-01",
        lastUsed: null,
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
