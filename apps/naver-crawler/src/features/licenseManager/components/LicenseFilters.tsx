import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  X,
  Download,
  ChevronDown,
  ChevronUp,
  Zap,
  Clock,
  UserX,
  Shield,
  Users,
} from "lucide-react";

// 타입 정의
interface LicenseFilter {
  search?: string;
  status?: string;
  licenseType?: string;
  productName?: string;
  dateFrom?: string;
  dateTo?: string;
  expiringSoon?: string;
}

interface LicenseFiltersProps {
  onFilterChange: (filter: LicenseFilter) => void;
  onExport: () => void;
  totalCount: number;
}

export const LicenseFilters: React.FC<LicenseFiltersProps> = ({
  onFilterChange,
  onExport,
  totalCount,
}) => {
  const [filter, setFilter] = useState<LicenseFilter>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = (key: keyof LicenseFilter, value: string) => {
    const newFilter = { ...filter };

    if (!value || value === "all") {
      delete newFilter[key];
    } else {
      newFilter[key] = value;
    }

    setFilter(newFilter);
    onFilterChange(newFilter);
  };

  const clearFilters = () => {
    setFilter({});
    onFilterChange({});
  };

  const getActiveFilterCount = () => {
    return Object.values(filter).filter((value) => value && value.trim() !== "")
      .length;
  };

  const activeFilterCount = getActiveFilterCount();

  // 프리셋 필터 함수들
  const applyPresetFilter = (preset: string) => {
    const now = new Date();
    let newFilter = { ...filter };

    switch (preset) {
      case "expiring":
        newFilter.status = "active";
        // 30일 내 만료 로직은 백엔드에서 처리되도록 특별한 필터 추가
        newFilter.expiringSoon = "true";
        break;
      case "expired":
        newFilter.status = "expired";
        break;
      case "admin":
        newFilter.licenseType = "admin";
        break;
      case "recent":
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        newFilter.dateFrom = sevenDaysAgo.toISOString().split("T")[0];
        newFilter.dateTo = now.toISOString().split("T")[0];
        break;
      default:
        break;
    }

    setFilter(newFilter);
    onFilterChange(newFilter);
  };

  return (
    <div className="space-y-4">
      {/* 컴팩트 필터 헤더 */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        {/* 메인 필터 바 */}
        <div className="p-4">
          <div className="flex items-center gap-4">
            {/* 검색 입력 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="라이센스 키, 이메일, 제품명으로 검색..."
                value={filter.search || ""}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* 빠른 필터 */}
            <div className="flex items-center gap-2">
              <Select
                value={filter.status || "all"}
                onValueChange={(value) => handleFilterChange("status", value)}
              >
                <SelectTrigger className="w-32 border-gray-300">
                  <SelectValue placeholder="상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 상태</SelectItem>
                  <SelectItem value="active">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      활성
                    </div>
                  </SelectItem>
                  <SelectItem value="expired">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
                      만료
                    </div>
                  </SelectItem>
                  <SelectItem value="revoked">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                      해지
                    </div>
                  </SelectItem>
                  <SelectItem value="suspended">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                      일시정지
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filter.licenseType || "all"}
                onValueChange={(value) =>
                  handleFilterChange("licenseType", value)
                }
              >
                <SelectTrigger className="w-32 border-gray-300">
                  <SelectValue placeholder="타입" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 타입</SelectItem>
                  <SelectItem value="user">
                    <div className="flex items-center">
                      <Users className="w-3 h-3 mr-2 text-blue-500" />
                      일반
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center">
                      <Shield className="w-3 h-3 mr-2 text-orange-500" />
                      관리자
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* 고급 필터 토글 */}
              <Button
                variant="outline"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="px-3 border-gray-300 hover:bg-gray-50"
              >
                <Filter className="w-4 h-4 mr-2" />
                고급
                {showAdvanced ? (
                  <ChevronUp className="w-4 h-4 ml-1" />
                ) : (
                  <ChevronDown className="w-4 h-4 ml-1" />
                )}
              </Button>

              {/* 내보내기 버튼 */}
              <Button
                variant="outline"
                onClick={onExport}
                className="px-3 border-gray-300 hover:bg-gray-50"
              >
                <Download className="w-4 h-4 mr-2" />
                내보내기
              </Button>
            </div>
          </div>

          {/* 활성 필터 및 통계 */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <>
                  <Badge
                    variant="secondary"
                    className="bg-blue-50 text-blue-700 border-blue-200"
                  >
                    {activeFilterCount}개 필터 적용
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-3 h-3 mr-1" />
                    초기화
                  </Button>
                </>
              )}
            </div>
            <div className="text-sm text-gray-600">
              총{" "}
              <span className="font-semibold text-gray-900">
                {totalCount.toLocaleString()}
              </span>
              개 라이센스
            </div>
          </div>
        </div>

        {/* 고급 필터 패널 */}
        {showAdvanced && (
          <div className="border-t border-gray-200 bg-gray-50/50 p-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* 제품 필터 */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  제품
                </Label>
                <Select
                  value={filter.productName || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("productName", value)
                  }
                >
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue placeholder="모든 제품" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">모든 제품</SelectItem>
                    <SelectItem value="Standard License">
                      Standard License
                    </SelectItem>
                    <SelectItem value="Pro License">Pro License</SelectItem>
                    <SelectItem value="Enterprise License">
                      Enterprise License
                    </SelectItem>
                    <SelectItem value="Trial License">Trial License</SelectItem>
                    <SelectItem value="Admin License">Admin License</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 날짜 범위 */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  발급일 범위
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={filter.dateFrom || ""}
                    onChange={(e) =>
                      handleFilterChange("dateFrom", e.target.value)
                    }
                    className="bg-white border-gray-300 text-sm"
                    placeholder="시작일"
                  />
                  <Input
                    type="date"
                    value={filter.dateTo || ""}
                    onChange={(e) =>
                      handleFilterChange("dateTo", e.target.value)
                    }
                    className="bg-white border-gray-300 text-sm"
                    placeholder="종료일"
                  />
                </div>
              </div>

              {/* 빠른 프리셋 */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  빠른 선택
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyPresetFilter("expiring")}
                    className="justify-start text-xs bg-white border-gray-300 hover:bg-yellow-50 hover:border-yellow-300"
                  >
                    <Clock className="w-3 h-3 mr-2 text-yellow-600" />
                    만료 예정
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyPresetFilter("expired")}
                    className="justify-start text-xs bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                  >
                    <UserX className="w-3 h-3 mr-2 text-gray-600" />
                    만료됨
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyPresetFilter("admin")}
                    className="justify-start text-xs bg-white border-gray-300 hover:bg-orange-50 hover:border-orange-300"
                  >
                    <Shield className="w-3 h-3 mr-2 text-orange-600" />
                    관리자
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyPresetFilter("recent")}
                    className="justify-start text-xs bg-white border-gray-300 hover:bg-blue-50 hover:border-blue-300"
                  >
                    <Zap className="w-3 h-3 mr-2 text-blue-600" />
                    최근 7일
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 활성 필터 태그 (상세) */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filter.search && (
            <Badge
              variant="secondary"
              className="bg-purple-50 text-purple-700 border-purple-200"
            >
              검색: "{filter.search}"
              <button
                onClick={() => handleFilterChange("search", "")}
                className="ml-2 hover:bg-purple-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filter.status && filter.status !== "all" && (
            <Badge
              variant="secondary"
              className="bg-green-50 text-green-700 border-green-200"
            >
              상태:{" "}
              {filter.status === "active"
                ? "활성"
                : filter.status === "expired"
                  ? "만료"
                  : filter.status === "revoked"
                    ? "해지"
                    : "일시정지"}
              <button
                onClick={() => handleFilterChange("status", "all")}
                className="ml-2 hover:bg-green-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filter.licenseType && filter.licenseType !== "all" && (
            <Badge
              variant="secondary"
              className="bg-orange-50 text-orange-700 border-orange-200"
            >
              타입: {filter.licenseType === "admin" ? "관리자" : "일반 사용자"}
              <button
                onClick={() => handleFilterChange("licenseType", "all")}
                className="ml-2 hover:bg-orange-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {filter.productName && filter.productName !== "all" && (
            <Badge
              variant="secondary"
              className="bg-blue-50 text-blue-700 border-blue-200"
            >
              제품: {filter.productName}
              <button
                onClick={() => handleFilterChange("productName", "all")}
                className="ml-2 hover:bg-blue-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {(filter.dateFrom || filter.dateTo) && (
            <Badge
              variant="secondary"
              className="bg-indigo-50 text-indigo-700 border-indigo-200"
            >
              기간: {filter.dateFrom || "처음"} ~ {filter.dateTo || "지금"}
              <button
                onClick={() => {
                  handleFilterChange("dateFrom", "");
                  handleFilterChange("dateTo", "");
                }}
                className="ml-2 hover:bg-indigo-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
