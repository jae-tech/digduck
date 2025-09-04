import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
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
  BarChart3,
  Calendar,
  Smartphone,
  Users,
  Filter,
  Info,
} from "lucide-react";
import { useShoppingInsights } from "../hooks/useShoppingInsights";
import { DataTable } from "@/components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
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

  const setQuickDateRange = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    setEndDate(endDate.toISOString().split("T")[0]);
    setStartDate(startDate.toISOString().split("T")[0]);
  };

  const { fetchInsights, isLoading, data, error } = useShoppingInsights();

  // 테이블 컬럼 정의
  const columns = useMemo<ColumnDef<InsightsDataPoint>[]>(
    () => [
      {
        accessorKey: "period",
        header: "기간",
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.getValue("period")}</span>
        ),
      },
      {
        accessorKey: "ratio",
        header: "검색 비율",
        cell: ({ row }) => (
          <div className="text-right">
            <Badge
              variant="secondary"
              className="bg-blue-100 text-blue-800 font-medium"
            >
              {row.getValue("ratio")}
            </Badge>
          </div>
        ),
      },
      // title은 InsightsDataPoint에 없으므로 제거
    ],
    [data]
  );

  const ageGroups: { value: AgeGroup; label: string }[] = [
    { value: "10", label: "10대" },
    { value: "20", label: "20대" },
    { value: "30", label: "30대" },
    { value: "40", label: "40대" },
    { value: "50", label: "50대" },
    { value: "60", label: "60대" },
  ];

  const handleAgeChange = (age: AgeGroup, checked: boolean) => {
    if (checked) {
      setSelectedAges([...selectedAges, age]);
    } else {
      setSelectedAges(selectedAges.filter((a) => a !== age));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !category) return;

    fetchInsights({
      startDate,
      endDate,
      timeUnit,
      category,
      device: device === "all" ? undefined : device || undefined,
      gender: gender === "all" ? undefined : gender || undefined,
      ages: selectedAges.length > 0 ? selectedAges : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <TrendingUp className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              네이버 쇼핑 인사이트
            </h1>
            <p className="text-gray-600 mt-1">
              쇼핑 트렌드 데이터를 분석하고 인사이트를 얻으세요
            </p>
          </div>
        </div>

        {/* User-Friendly Search Form */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-blue-600" />
              <span>조회 조건 설정</span>
            </CardTitle>
          </CardHeader>
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

                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="space-y-4">
                    {/* 데이터 구간 단위 */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-gray-700">
                        데이터 구간 단위
                      </Label>
                      <RadioGroup
                        value={timeUnit}
                        onValueChange={(value) =>
                          setTimeUnit(value as TimeUnit)
                        }
                        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                      >
                        <div
                          className={`relative cursor-pointer ${timeUnit === "date" ? "ring-2 ring-blue-500" : ""}`}
                        >
                          <input
                            type="radio"
                            id="date"
                            value="date"
                            checked={timeUnit === "date"}
                            onChange={() => setTimeUnit("date")}
                            className="sr-only"
                          />
                          <label
                            htmlFor="date"
                            className={`block w-full p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                              timeUnit === "date"
                                ? "border-blue-500 bg-blue-50 text-blue-900"
                                : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-semibold text-base">
                                  일간 분석
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  세밀한 트렌드 분석
                                </div>
                              </div>
                              <div
                                className={`w-5 h-5 rounded-full border-2 ${
                                  timeUnit === "date"
                                    ? "border-blue-500 bg-blue-500"
                                    : "border-gray-300"
                                }`}
                              >
                                {timeUnit === "date" && (
                                  <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1"></div>
                                )}
                              </div>
                            </div>
                          </label>
                        </div>

                        <div
                          className={`relative cursor-pointer ${timeUnit === "week" ? "ring-2 ring-blue-500" : ""}`}
                        >
                          <input
                            type="radio"
                            id="week"
                            value="week"
                            checked={timeUnit === "week"}
                            onChange={() => setTimeUnit("week")}
                            className="sr-only"
                          />
                          <label
                            htmlFor="week"
                            className={`block w-full p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                              timeUnit === "week"
                                ? "border-blue-500 bg-blue-50 text-blue-900"
                                : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-semibold text-base">
                                  주간 분석
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  중간 단위 트렌드
                                </div>
                              </div>
                              <div
                                className={`w-5 h-5 rounded-full border-2 ${
                                  timeUnit === "week"
                                    ? "border-blue-500 bg-blue-500"
                                    : "border-gray-300"
                                }`}
                              >
                                {timeUnit === "week" && (
                                  <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1"></div>
                                )}
                              </div>
                            </div>
                          </label>
                        </div>

                        <div
                          className={`relative cursor-pointer ${timeUnit === "month" ? "ring-2 ring-blue-500" : ""}`}
                        >
                          <input
                            type="radio"
                            id="month"
                            value="month"
                            checked={timeUnit === "month"}
                            onChange={() => setTimeUnit("month")}
                            className="sr-only"
                          />
                          <label
                            htmlFor="month"
                            className={`block w-full p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                              timeUnit === "month"
                                ? "border-blue-500 bg-blue-50 text-blue-900"
                                : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-semibold text-base">
                                  월간 분석
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  장기 트렌드 분석
                                </div>
                              </div>
                              <div
                                className={`w-5 h-5 rounded-full border-2 ${
                                  timeUnit === "month"
                                    ? "border-blue-500 bg-blue-500"
                                    : "border-gray-300"
                                }`}
                              >
                                {timeUnit === "month" && (
                                  <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1"></div>
                                )}
                              </div>
                            </div>
                          </label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </div>

                {/* 필터링 조건 */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium text-gray-700">
                    필터링 조건 (선택사항)
                  </Label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 기기 조건 */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Smartphone className="w-4 h-4 text-gray-600" />
                        <Label className="text-sm font-medium text-gray-700">
                          접속 기기
                        </Label>
                      </div>
                      <div className="space-y-2">
                        <div
                          className={`relative cursor-pointer ${device === "all" ? "ring-2 ring-blue-500" : ""}`}
                        >
                          <input
                            type="radio"
                            id="device-all"
                            value="all"
                            checked={device === "all"}
                            onChange={() => setDevice("all")}
                            className="sr-only"
                          />
                          <label
                            htmlFor="device-all"
                            className={`block w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                              device === "all"
                                ? "border-blue-500 bg-blue-50 text-blue-900"
                                : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">전체 기기</span>
                              <div
                                className={`w-4 h-4 rounded-full border-2 ${
                                  device === "all"
                                    ? "border-blue-500 bg-blue-500"
                                    : "border-gray-300"
                                }`}
                              >
                                {device === "all" && (
                                  <div className="w-1.5 h-1.5 bg-white rounded-full mx-auto mt-0.5"></div>
                                )}
                              </div>
                            </div>
                          </label>
                        </div>

                        <div
                          className={`relative cursor-pointer ${device === "pc" ? "ring-2 ring-blue-500" : ""}`}
                        >
                          <input
                            type="radio"
                            id="device-pc"
                            value="pc"
                            checked={device === "pc"}
                            onChange={() => setDevice("pc")}
                            className="sr-only"
                          />
                          <label
                            htmlFor="device-pc"
                            className={`block w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                              device === "pc"
                                ? "border-blue-500 bg-blue-50 text-blue-900"
                                : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">PC</span>
                              <div
                                className={`w-4 h-4 rounded-full border-2 ${
                                  device === "pc"
                                    ? "border-blue-500 bg-blue-500"
                                    : "border-gray-300"
                                }`}
                              >
                                {device === "pc" && (
                                  <div className="w-1.5 h-1.5 bg-white rounded-full mx-auto mt-0.5"></div>
                                )}
                              </div>
                            </div>
                          </label>
                        </div>

                        <div
                          className={`relative cursor-pointer ${device === "mo" ? "ring-2 ring-blue-500" : ""}`}
                        >
                          <input
                            type="radio"
                            id="device-mo"
                            value="mo"
                            checked={device === "mo"}
                            onChange={() => setDevice("mo")}
                            className="sr-only"
                          />
                          <label
                            htmlFor="device-mo"
                            className={`block w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                              device === "mo"
                                ? "border-blue-500 bg-blue-50 text-blue-900"
                                : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">모바일</span>
                              <div
                                className={`w-4 h-4 rounded-full border-2 ${
                                  device === "mo"
                                    ? "border-blue-500 bg-blue-500"
                                    : "border-gray-300"
                                }`}
                              >
                                {device === "mo" && (
                                  <div className="w-1.5 h-1.5 bg-white rounded-full mx-auto mt-0.5"></div>
                                )}
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* 성별 조건 */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-600" />
                        <Label className="text-sm font-medium text-gray-700">
                          성별
                        </Label>
                      </div>
                      <div className="space-y-2">
                        <div
                          className={`relative cursor-pointer ${gender === "all" ? "ring-2 ring-blue-500" : ""}`}
                        >
                          <input
                            type="radio"
                            id="gender-all"
                            value="all"
                            checked={gender === "all"}
                            onChange={() => setGender("all")}
                            className="sr-only"
                          />
                          <label
                            htmlFor="gender-all"
                            className={`block w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                              gender === "all"
                                ? "border-blue-500 bg-blue-50 text-blue-900"
                                : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">전체</span>
                              <div
                                className={`w-4 h-4 rounded-full border-2 ${
                                  gender === "all"
                                    ? "border-blue-500 bg-blue-500"
                                    : "border-gray-300"
                                }`}
                              >
                                {gender === "all" && (
                                  <div className="w-1.5 h-1.5 bg-white rounded-full mx-auto mt-0.5"></div>
                                )}
                              </div>
                            </div>
                          </label>
                        </div>

                        <div
                          className={`relative cursor-pointer ${gender === "m" ? "ring-2 ring-blue-500" : ""}`}
                        >
                          <input
                            type="radio"
                            id="gender-m"
                            value="m"
                            checked={gender === "m"}
                            onChange={() => setGender("m")}
                            className="sr-only"
                          />
                          <label
                            htmlFor="gender-m"
                            className={`block w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                              gender === "m"
                                ? "border-blue-500 bg-blue-50 text-blue-900"
                                : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">남성</span>
                              <div
                                className={`w-4 h-4 rounded-full border-2 ${
                                  gender === "m"
                                    ? "border-blue-500 bg-blue-500"
                                    : "border-gray-300"
                                }`}
                              >
                                {gender === "m" && (
                                  <div className="w-1.5 h-1.5 bg-white rounded-full mx-auto mt-0.5"></div>
                                )}
                              </div>
                            </div>
                          </label>
                        </div>

                        <div
                          className={`relative cursor-pointer ${gender === "f" ? "ring-2 ring-blue-500" : ""}`}
                        >
                          <input
                            type="radio"
                            id="gender-f"
                            value="f"
                            checked={gender === "f"}
                            onChange={() => setGender("f")}
                            className="sr-only"
                          />
                          <label
                            htmlFor="gender-f"
                            className={`block w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                              gender === "f"
                                ? "border-blue-500 bg-blue-50 text-blue-900"
                                : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">여성</span>
                              <div
                                className={`w-4 h-4 rounded-full border-2 ${
                                  gender === "f"
                                    ? "border-blue-500 bg-blue-500"
                                    : "border-gray-300"
                                }`}
                              >
                                {gender === "f" && (
                                  <div className="w-1.5 h-1.5 bg-white rounded-full mx-auto mt-0.5"></div>
                                )}
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 연령대 선택 */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">
                      연령대 (다중선택 가능)
                    </Label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                      {ageGroups.map(({ value, label }) => (
                        <div
                          key={value}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`age-${value}`}
                            checked={selectedAges.includes(value)}
                            onCheckedChange={(checked) =>
                              handleAgeChange(value, checked as boolean)
                            }
                            className="w-4 h-4"
                          />
                          <Label
                            htmlFor={`age-${value}`}
                            className="text-sm cursor-pointer font-medium"
                          >
                            {label}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {selectedAges.length > 0 && (
                      <div className="text-xs text-blue-600 bg-blue-50 rounded px-2 py-1">
                        선택된 연령대:{" "}
                        {selectedAges
                          .map(
                            (age) =>
                              ageGroups.find((g) => g.value === age)?.label
                          )
                          .join(", ")}
                      </div>
                    )}
                  </div>
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

        {/* Results */}
        {data && (
          <div className="space-y-6">
            {/* Data Table */}
            <DataTable
              data={data.data}
              columns={columns}
              title="인사이트 결과"
              subtitle={`${data.title}${data.keywords.length > 0 ? ` | 키워드: ${data.keywords.join(", ")}` : ""}`}
              loading={isLoading}
              enableSorting={true}
              enableFiltering={true}
              enablePagination={true}
              searchPlaceholder="기간 또는 비율로 검색..."
              initialPageSize={20}
              pageSizeOptions={[10, 20, 50, 100]}
              maxHeight="500px"
            />

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm font-medium text-blue-900">
                  총 데이터 포인트
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {data.data.length}
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm font-medium text-green-900">
                  최대 검색 비율
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {Math.max(...data.data.map((d) => d.ratio))}
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm font-medium text-purple-900">
                  평균 검색 비율
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(
                    data.data.reduce((sum, d) => sum + d.ratio, 0) /
                      data.data.length
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShoppingInsightsPage;
