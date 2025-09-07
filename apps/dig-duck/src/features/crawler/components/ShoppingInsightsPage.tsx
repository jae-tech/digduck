import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  Search,
  Calendar,
  Filter,
  Info,
  Smartphone,
  Users,
  BarChart3,
} from "lucide-react";
import { useShoppingInsights } from "../hooks/useShoppingInsights";
import { InsightsDashboard } from "@/features/dashboard/components/InsightsDashboard";
import { useDataExport } from "@/features/dashboard/hooks/useDataExport";
import { useGoogleSheets } from "@/features/dashboard/hooks/useGoogleSheets";
import { useReportGenerator } from "@/features/dashboard/hooks/useReportGenerator";
import { CompactRadio } from "@/components/ui/compact-radio";
import type {
  TimeUnit,
  DeviceType,
  GenderType,
  AgeGroup,
  InsightsDataPoint,
} from "../types/crawler.types";

const ShoppingInsightsPage: React.FC = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timeUnit, setTimeUnit] = useState<TimeUnit>("month");
  const [category, setCategory] = useState("");
  const [device, setDevice] = useState<DeviceType | "" | "all">("all");
  const [gender, setGender] = useState<GenderType | "" | "all">("all");
  const [selectedAges, setSelectedAges] = useState<AgeGroup[]>([]);
  const [lastSearchParams, setLastSearchParams] = useState<{
    startDate: string;
    endDate: string;
    timeUnit: TimeUnit;
    categoryName: string;
    device?: DeviceType | "all";
    gender?: GenderType | "all";
    ages?: AgeGroup[];
  } | null>(null);

  // 카테고리 옵션들
  const categoryOptions = [
    {
      value: "50000000",
      label: "패션의류",
      description: "의류, 신발, 가방 등",
    },
    {
      value: "50000001",
      label: "패션잡화",
      description: "액세서리, 시계, 지갑 등",
    },
    {
      value: "50000002",
      label: "화장품/미용",
      description: "스킨케어, 메이크업 등",
    },
    {
      value: "50000003",
      label: "디지털/가전",
      description: "스마트폰, 컴퓨터 등",
    },
    {
      value: "50000004",
      label: "가구/인테리어",
      description: "가구, 홈데코 등",
    },
    {
      value: "50000005",
      label: "출산/육아",
      description: "유아용품, 장난감 등",
    },
    { value: "50000006", label: "식품", description: "건강식품, 간식 등" },
    {
      value: "50000007",
      label: "스포츠/레저",
      description: "운동용품, 아웃도어 등",
    },
    {
      value: "50000008",
      label: "생활/건강",
      description: "생활용품, 건강관리 등",
    },
    {
      value: "50000009",
      label: "여가/문화",
      description: "도서, 음반, 게임 등",
    },
  ];

  // 빠른 날짜 선택 옵션들
  const quickDateOptions = [
    { label: "최근 1개월", days: 30 },
    { label: "최근 3개월", days: 90 },
    { label: "최근 6개월", days: 180 },
    { label: "최근 1년", days: 365 },
  ];

  // 연령대 옵션들
  const ageGroups: { value: AgeGroup; label: string }[] = [
    { value: "10", label: "10대" },
    { value: "20", label: "20대" },
    { value: "30", label: "30대" },
    { value: "40", label: "40대" },
    { value: "50", label: "50대" },
    { value: "60", label: "60대 이상" },
  ];

  const setQuickDateRange = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    setEndDate(endDate.toISOString().split("T")[0]);
    setStartDate(startDate.toISOString().split("T")[0]);
  };

  const { fetchInsights, isLoading, data, error } = useShoppingInsights();
  const { exportToExcel, exportToCSV, exportToPDF } = useDataExport();
  const { createSpreadsheet } = useGoogleSheets();
  const { generateReport } = useReportGenerator();

  const handleAgeChange = (age: AgeGroup, checked: boolean) => {
    if (checked) {
      setSelectedAges([...selectedAges, age]);
    } else {
      setSelectedAges(selectedAges.filter((a) => a !== age));
    }
  };

  const handleSelectAllAges = (checked: boolean) => {
    if (checked) {
      // 전체 선택 - 모든 연령대 선택
      setSelectedAges(ageGroups.map((group) => group.value));
    } else {
      // 전체 해제 - 모든 연령대 해제
      setSelectedAges([]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !category) return;

    // 선택된 카테고리 정보 찾기
    const selectedCategory = categoryOptions.find(
      (opt) => opt.value === category
    );

    // 검색 파라미터 저장
    setLastSearchParams({
      startDate,
      endDate,
      timeUnit,
      categoryName: selectedCategory?.label || category,
      device: device === "all" ? undefined : device,
      gender: gender === "all" ? undefined : gender,
      ages:
        selectedAges.length > 0 && selectedAges.length < ageGroups.length
          ? selectedAges
          : undefined,
    });

    fetchInsights({
      startDate,
      endDate,
      timeUnit,
      category: selectedCategory
        ? [
            {
              name: selectedCategory.label,
              param: [selectedCategory.value],
            },
          ]
        : undefined,
      device: device === "all" ? undefined : device || undefined,
      gender: gender === "all" ? undefined : gender || undefined,
      ages:
        selectedAges.length > 0 && selectedAges.length < ageGroups.length
          ? selectedAges
          : undefined,
    });
  };

  // Export handlers
  const handleExport = async (format: "excel" | "csv" | "pdf") => {
    if (!data || !lastSearchParams) return;

    const exportData = {
      data,
      searchParams: lastSearchParams,
    };

    try {
      switch (format) {
        case "excel":
          await exportToExcel(exportData);
          break;
        case "csv":
          await exportToCSV(exportData);
          break;
        case "pdf":
          await exportToPDF(exportData);
          break;
      }
    } catch (error) {
      console.error(`${format.toUpperCase()} 내보내기 오류:`, error);
    }
  };

  const handleShareToSheets = async () => {
    if (!data || !lastSearchParams) return;

    const exportData = {
      data,
      searchParams: lastSearchParams,
    };

    try {
      await createSpreadsheet(exportData);
    } catch (error) {
      console.error("Google Sheets 공유 오류:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* User-Friendly Search Form */}
        <Card>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 날짜 설정 섹션 */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <Label className="text-base font-semibold text-gray-900">
                    조회 기간
                  </Label>
                </div>

                {/* 빠른 날짜 선택 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    빠른 선택
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {quickDateOptions.map((option) => (
                      <Button
                        key={option.days}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setQuickDateRange(option.days)}
                        className="text-xs"
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 직접 날짜 입력 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="startDate"
                      className="text-sm font-medium flex items-center space-x-1"
                    >
                      <span>시작 날짜</span>
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="endDate"
                      className="text-sm font-medium flex items-center space-x-1"
                    >
                      <span>종료 날짜</span>
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                      className="h-10"
                    />
                  </div>
                </div>
              </div>

              {/* 카테고리 설정 섹션 */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4 text-blue-600" />
                  <Label className="text-base font-semibold text-gray-900">
                    카테고리 선택
                  </Label>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center space-x-1">
                    <span>쇼핑 카테고리</span>
                    <span className="text-red-500">*</span>
                  </Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="분석할 카테고리를 선택해주세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{option.label}</span>
                            <span className="text-xs text-gray-500">
                              {option.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-start space-x-1 text-xs text-gray-500">
                    <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>
                      네이버 쇼핑에서 제공하는 주요 카테고리 기준으로 데이터를
                      분석합니다.
                    </span>
                  </div>
                </div>
              </div>

              {/* 분석 조건 섹션 */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <Label className="text-base font-semibold text-gray-900">
                    분석 조건
                  </Label>
                </div>

                {/* 컴팩트한 분석 옵션들 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* 데이터 구간 */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>데이터 구간</span>
                    </Label>
                    <CompactRadio
                      value={timeUnit}
                      onChange={(value) => setTimeUnit(value as TimeUnit)}
                      name="timeUnit"
                      variant="buttons"
                      size="sm"
                      options={[
                        { value: "date", label: "일간" },
                        { value: "week", label: "주간" },
                        { value: "month", label: "월간" },
                      ]}
                    />
                  </div>

                  {/* 접속 기기 */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center space-x-1">
                      <Smartphone className="w-3 h-3" />
                      <span>접속 기기</span>
                    </Label>
                    <CompactRadio
                      value={device}
                      onChange={(value) =>
                        setDevice(value as DeviceType | "all")
                      }
                      name="device"
                      variant="buttons"
                      size="sm"
                      options={[
                        { value: "all", label: "전체" },
                        { value: "pc", label: "PC" },
                        { value: "mobile", label: "모바일" },
                      ]}
                    />
                  </div>

                  {/* 성별 */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center space-x-1">
                      <Users className="w-3 h-3" />
                      <span>성별</span>
                    </Label>
                    <CompactRadio
                      value={gender}
                      onChange={(value) =>
                        setGender(value as GenderType | "all")
                      }
                      name="gender"
                      variant="buttons"
                      size="sm"
                      options={[
                        { value: "all", label: "전체" },
                        { value: "m", label: "남성" },
                        { value: "f", label: "여성" },
                      ]}
                    />
                  </div>
                </div>

                {/* 연령대 선택 - 컴팩트 체크박스 */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    연령대 (다중선택 가능)
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {/* 전체 선택 버튼 */}
                    <label
                      className={`cursor-pointer transition-all duration-200 ${
                        selectedAges.length === ageGroups.length
                          ? "scale-105"
                          : "hover:scale-102"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedAges.length === ageGroups.length}
                        onChange={(e) => handleSelectAllAges(e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition-all duration-200 ${
                          selectedAges.length === ageGroups.length
                            ? "border-blue-500 bg-blue-500 text-white shadow-md"
                            : "border-gray-300 bg-white hover:border-blue-300 hover:bg-blue-50"
                        }`}
                      >
                        전체
                      </div>
                    </label>

                    {ageGroups.map(({ value, label }) => (
                      <label
                        key={value}
                        className={`cursor-pointer transition-all duration-200 ${
                          selectedAges.includes(value)
                            ? "scale-105"
                            : "hover:scale-102"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedAges.includes(value)}
                          onChange={(e) =>
                            handleAgeChange(value, e.target.checked)
                          }
                          className="sr-only"
                        />
                        <div
                          className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition-all duration-200 ${
                            selectedAges.includes(value)
                              ? "border-blue-500 bg-blue-500 text-white shadow-md"
                              : "border-gray-300 bg-white hover:border-blue-300 hover:bg-blue-50"
                          }`}
                        >
                          {label}
                        </div>
                      </label>
                    ))}
                  </div>
                  {selectedAges.length > 0 && (
                    <div className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2 flex items-center space-x-1">
                      <Users className="w-3 h-3" />
                      <span>
                        선택된 연령대:{" "}
                        {selectedAges
                          .map(
                            (age) =>
                              ageGroups.find((g) => g.value === age)?.label
                          )
                          .join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                <div className="flex-1">
                  <div className="text-sm text-gray-600">
                    {!startDate || !endDate || !category ? (
                      <div className="flex items-center space-x-1 text-red-600">
                        <Info className="w-3 h-3" />
                        <span>
                          필수 항목을 모두 입력해주세요 (기간, 카테고리)
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 text-green-600">
                        <Info className="w-3 h-3" />
                        <span>조회 준비 완료!</span>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={isLoading || !startDate || !endDate || !category}
                  className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                  size="lg"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>데이터 분석 중...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Search className="w-5 h-5" />
                      <span>쇼핑 인사이트 분석</span>
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-red-700">
                <span className="font-medium">오류:</span>
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results - 새로운 대시보드 시스템 */}
        {data && lastSearchParams && (
          <InsightsDashboard
            data={data}
            searchParams={lastSearchParams}
            onExport={handleExport}
            onShareToSheets={handleShareToSheets}
          />
        )}
      </div>
    </div>
  );
};

export default ShoppingInsightsPage;
