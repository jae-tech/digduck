import { DigDuckIcon } from "@/components/icons/DigDuckIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLicenseStore } from "@/features/license/store/license.store";
import { formatDate } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { Calendar, ChevronDown, LogOut, User } from "lucide-react";
import React, { useEffect, useState } from "react";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [remainingDays, setRemainingDays] = useState<number | null>(null);
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);
  const navigate = useNavigate();
  const { licenseInfo, clearLicense } = useLicenseStore();

  // 남은 일수 계산 함수
  const calculateRemainingDays = (expiryDate: string | null): number | null => {
    if (!expiryDate) return null;

    try {
      const expiry = new Date(expiryDate);
      const now = new Date();
      const diffTime = expiry.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return diffDays > 0 ? diffDays : 0;
    } catch (error) {
      console.error("Error calculating remaining days:", error);
      return null;
    }
  };

  // 실시간 남은 일수 업데이트
  useEffect(() => {
    const updateRemainingDays = () => {
      const days = calculateRemainingDays(licenseInfo?.expiryDate || null);
      setRemainingDays(days);
      setIsExpiringSoon(days !== null && days <= 7); // 7일 이하면 곧 만료
    };

    // 초기 계산
    updateRemainingDays();

    // 1시간마다 업데이트 (실시간이지만 너무 자주 업데이트할 필요는 없음)
    const interval = setInterval(updateRemainingDays, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [licenseInfo?.expiryDate]);

  const handleLogout = () => {
    clearLicense();
    navigate({ to: "/license" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 헤더 - 라이센스 정보 */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <DigDuckIcon className="text-blue-600" size={32} />
            <div>
              <h1 className="text-lg lg:text-xl font-bold text-gray-900">
                Dig Duck
              </h1>
              <p className="text-sm text-gray-600">
                {licenseInfo?.serviceName || "크롤링 서비스"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 lg:space-x-6">
            {/* 라이센스 정보 - 데스크톱에서만 표시 */}
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">
                {licenseInfo?.userName || "이름 없음"}
              </p>
              <div className="flex items-center space-x-2">
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    isExpiringSoon
                      ? "text-orange-600 border-orange-300"
                      : "text-green-600 border-green-300"
                  }`}
                >
                  {remainingDays !== null
                    ? remainingDays === 0
                      ? "만료됨"
                      : `${remainingDays}일 남음`
                    : "활성"}
                </Badge>
                <span className="text-xs text-gray-500">
                  만료:{" "}
                  {licenseInfo?.expiryDate
                    ? formatDate(licenseInfo.expiryDate)
                    : "확인 중..."}
                </span>
              </div>
            </div>

            {/* 사용자 메뉴 */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 hover:bg-gray-100"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                {/* 모바일에서만 사용자 이메일 표시 */}
                <div className="text-left sm:hidden">
                  <p className="text-xs font-medium text-gray-900 truncate max-w-[80px]">
                    {licenseInfo?.userEmail?.split("@")[0] || "user"}
                  </p>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-500 transition-transform ${
                    isUserMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </Button>

              {/* 드롭다운 메뉴 */}
              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                    <div className="p-4">
                      {/* 사용자 정보 */}
                      <div className="flex items-center space-x-3 mb-3 pb-3 border-b border-gray-100">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {licenseInfo?.userName || "user@example.com"}
                          </p>
                          <p className="text-xs text-gray-500">사용자</p>
                        </div>
                      </div>

                      {/* 라이센스 정보 */}
                      <div className="mb-3 pb-3 border-b border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-600">
                            라이센스 상태
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              isExpiringSoon
                                ? "text-orange-600 border-orange-300"
                                : remainingDays === 0
                                  ? "text-red-600 border-red-300"
                                  : "text-green-600 border-green-300"
                            }`}
                          >
                            {remainingDays !== null
                              ? remainingDays === 0
                                ? "만료됨"
                                : `${remainingDays}일 남음`
                              : "활성"}
                          </Badge>
                        </div>

                        {/* 남은 일수 상세 표시 */}
                        <div className="flex items-center space-x-1 mb-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {licenseInfo?.expiryDate
                              ? `만료일: ${formatDate(licenseInfo.expiryDate)}`
                              : "만료일 확인 중..."}
                          </span>
                        </div>

                        {/* 만료 경고 메시지 */}
                        {isExpiringSoon &&
                          remainingDays !== null &&
                          remainingDays > 0 && (
                            <div className="text-xs text-orange-600 mt-1 font-medium">
                              ⚠️ 곧 만료됩니다! 연장을 고려해주세요.
                            </div>
                          )}

                        {remainingDays === 0 && (
                          <div className="text-xs text-red-600 mt-1 font-medium">
                            🚨 라이센스가 만료되었습니다.
                          </div>
                        )}

                        <div className="text-xs text-gray-500 mt-1">
                          서비스: {licenseInfo?.serviceName || "확인 중..."}
                        </div>
                      </div>

                      {/* 로그아웃 버튼 */}
                      <Button
                        onClick={() => {
                          handleLogout();
                          setIsUserMenuOpen(false);
                        }}
                        variant="outline"
                        size="sm"
                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        로그아웃
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 - 풀 너비 */}
      <main className="px-4 lg:px-6 py-6">{children}</main>
    </div>
  );
}
