import { useState, useCallback, useEffect } from "react";
import {
  type LicenseRecord,
  type LicenseFilter,
  type LicenseStats,
  type BulkAction,
} from "../types/licenseManager.types";
import { LicenseManagerService } from "../services/licenseManager.service";

export const useLicenseManager = () => {
  const [licenses, setLicenses] = useState<LicenseRecord[]>([]);
  const [stats, setStats] = useState<LicenseStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedLicenses, setSelectedLicenses] = useState<string[]>([]);

  const loadLicenses = useCallback(async (filter?: LicenseFilter, page = 1) => {
    setIsLoading(true);
    setError("");

    try {
      const result = await LicenseManagerService.getLicenses(filter, page, 20);
      setLicenses(result.licenses);
      setCurrentPage(result.page);
      setTotalPages(result.totalPages);
      setTotalCount(result.total);
    } catch (error) {
      setError("라이센스 목록을 불러오는데 실패했습니다.");
      console.error("Failed to load licenses:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const statsData = await LicenseManagerService.getLicenseStats();
      setStats(statsData);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  }, []);

  const updateLicense = useCallback(
    async (licenseId: string, data: any) => {
      try {
        const success = await LicenseManagerService.updateLicense(
          licenseId,
          data
        );
        if (success) {
          // 목록 새로고침
          await loadLicenses();
          await loadStats();
          return true;
        } else {
          setError("라이센스 업데이트에 실패했습니다.");
          return false;
        }
      } catch (error) {
        setError("라이센스 업데이트 중 오류가 발생했습니다.");
        console.error("Failed to update license:", error);
        return false;
      }
    },
    [loadLicenses, loadStats]
  );

  const deleteLicense = useCallback(
    async (licenseId: string) => {
      try {
        const success = await LicenseManagerService.deleteLicense(licenseId);
        if (success) {
          // 목록 새로고침
          await loadLicenses();
          await loadStats();
          return true;
        } else {
          setError("라이센스 삭제에 실패했습니다.");
          return false;
        }
      } catch (error) {
        setError("라이센스 삭제 중 오류가 발생했습니다.");
        console.error("Failed to delete license:", error);
        return false;
      }
    },
    [loadLicenses, loadStats]
  );

  const performBulkAction = useCallback(
    async (action: BulkAction) => {
      try {
        const success = await LicenseManagerService.bulkAction(action);
        if (success) {
          // 선택 초기화 및 목록 새로고침
          setSelectedLicenses([]);
          await loadLicenses();
          await loadStats();
          return true;
        } else {
          setError("대량 작업에 실패했습니다.");
          return false;
        }
      } catch (error) {
        setError("대량 작업 중 오류가 발생했습니다.");
        console.error("Failed to perform bulk action:", error);
        return false;
      }
    },
    [loadLicenses, loadStats]
  );

  const toggleLicenseSelection = useCallback((licenseId: string) => {
    setSelectedLicenses((prev) => {
      if (prev.includes(licenseId)) {
        return prev.filter((id) => id !== licenseId);
      } else {
        return [...prev, licenseId];
      }
    });
  }, []);

  const selectAllLicenses = useCallback(() => {
    setSelectedLicenses(licenses.map((license) => license.id));
  }, [licenses]);

  const clearSelection = useCallback(() => {
    setSelectedLicenses([]);
  }, []);

  const clearError = useCallback(() => {
    setError("");
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    loadLicenses();
    loadStats();
  }, [loadLicenses, loadStats]);

  return {
    licenses,
    stats,
    isLoading,
    error,
    currentPage,
    totalPages,
    totalCount,
    selectedLicenses,
    loadLicenses,
    loadStats,
    updateLicense,
    deleteLicense,
    performBulkAction,
    toggleLicenseSelection,
    selectAllLicenses,
    clearSelection,
    clearError,
  };
};
