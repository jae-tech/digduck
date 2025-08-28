import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Key,
  TrendingUp,
  AlertTriangle,
  Pause,
  Users,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Play,
  AlertCircle,
} from "lucide-react";
import { LicenseTable } from "./LicenseTable";
import { LicenseFilters } from "./LicenseFilters";
import { useLicenseManager } from "../hooks/useLicenseManager";
import { type LicenseFilter } from "../types/licenseManager.types";

export const LicenseManagerPage: React.FC = () => {
  const {
    licenses,
    stats,
    isLoading,
    error,
    currentPage,
    totalPages,
    totalCount,
    selectedLicenses,
    loadLicenses,
    updateLicense,
    deleteLicense,
    performBulkAction,
    toggleLicenseSelection,
    selectAllLicenses,
    clearSelection,
    clearError,
  } = useLicenseManager();

  const [currentFilter, setCurrentFilter] = useState<LicenseFilter>({});

  const handleFilterChange = (filter: LicenseFilter) => {
    setCurrentFilter(filter);
    loadLicenses(filter, 1);
  };

  const handlePageChange = (page: number) => {
    loadLicenses(currentFilter, page);
  };


  const handleExport = () => {
    // CSV 내보내기 로직
    const headers = [
      "라이센스 키",
      "사용자 이메일",
      "제품명",
      "타입",
      "상태",
      "발급일",
      "만료일",
      "활성화 횟수",
      "최대 활성화",
    ];
    const rows = licenses.map((license) => [
      license.licenseKey,
      license.userEmail,
      license.productName,
      license.licenseType === "admin" ? "관리자" : "일반",
      license.status,
      license.issueDate,
      license.expiryDate,
      license.activationCount.toString(),
      license.maxActivations.toString(),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `licenses_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const handleBulkActivate = async () => {
    await performBulkAction({
      action: "activate",
      licenseIds: selectedLicenses,
    });
  };

  const handleBulkSuspend = async () => {
    await performBulkAction({
      action: "suspend",
      licenseIds: selectedLicenses,
    });
  };

  const handleBulkRevoke = async () => {
    await performBulkAction({
      action: "revoke",
      licenseIds: selectedLicenses,
    });
  };

  const handleBulkDelete = async () => {
    if (
      window.confirm(
        `선택된 ${selectedLicenses.length}개의 라이센스를 모두 삭제하시겠습니까?`
      )
    ) {
      await performBulkAction({
        action: "delete",
        licenseIds: selectedLicenses,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Key className="w-8 h-8 mr-3 text-green-600" />
          라이센스 관리
        </h1>
        <p className="text-gray-600 mt-2">
          발급된 모든 라이센스를 조회하고 관리할 수 있습니다.
        </p>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 라이센스</CardTitle>
              <Key className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.total.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">활성</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.active.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">만료</CardTitle>
              <Calendar className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                {stats.expired.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">해지</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.revoked.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">일시정지</CardTitle>
              <Pause className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.suspended.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">관리자</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.admin.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">만료 예정</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.expiringSoon.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">30일 내</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button
              variant="link"
              className="ml-2 p-0 h-auto"
              onClick={clearError}
            >
              닫기
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* 필터 */}
      <LicenseFilters
        onFilterChange={handleFilterChange}
        onExport={handleExport}
        totalCount={totalCount}
      />

      {/* 대량 작업 버튼 */}
      {selectedLicenses.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">
                  {selectedLicenses.length}개 선택됨
                </Badge>
                <span className="text-sm text-gray-600">대량 작업:</span>
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={handleBulkActivate}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="w-4 h-4 mr-1" />
                  활성화
                </Button>
                <Button size="sm" variant="outline" onClick={handleBulkSuspend}>
                  <Pause className="w-4 h-4 mr-1" />
                  일시정지
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkRevoke}
                  className="text-orange-600 hover:text-orange-700"
                >
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  해지
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkDelete}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  삭제
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 라이센스 테이블 */}
      <LicenseTable
        licenses={licenses}
        selectedLicenses={selectedLicenses}
        onToggleSelection={toggleLicenseSelection}
        onSelectAll={selectAllLicenses}
        onClearSelection={clearSelection}
        onUpdate={updateLicense}
        onDelete={deleteLicense}
      />

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                페이지 {currentPage} / {totalPages} (총{" "}
                {totalCount.toLocaleString()}개)
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1 || isLoading}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  이전
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages || isLoading}
                >
                  다음
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
