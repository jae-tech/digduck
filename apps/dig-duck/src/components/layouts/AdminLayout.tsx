import { DigDuckIcon } from "@/components/icons/DigDuckIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLicenseStore } from "@/features/license/store/license.store";
import { formatDate } from "@/lib/utils";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Coffee,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  Key,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Settings,
  User,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";

interface MenuItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: string;
  isActive?: boolean;
  onClick?: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({
  to,
  icon,
  label,
  badge,
  isActive,
  onClick,
}) => (
  <Link
    to={to}
    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
      isActive
        ? "bg-blue-100 text-blue-700 border border-blue-200"
        : "text-gray-700 hover:bg-gray-100"
    }`}
    onClick={onClick}
  >
    {icon}
    <span className="font-medium">{label}</span>
    {badge && (
      <Badge variant="secondary" className="ml-auto text-xs">
        {badge}
      </Badge>
    )}
  </Link>
);

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [remainingDays, setRemainingDays] = useState<number | null>(null);
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);
  const [isUserViewMode, setIsUserViewMode] = useState(false);
  const location = useLocation();
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

  // 관리자 전용 메뉴
  const adminMenuItems = [
    {
      to: "/admin/dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
      label: "대시보드",
      badge: undefined,
    },
    {
      to: "/admin/license-manager",
      icon: <Key className="w-5 h-5" />,
      label: "라이센스 관리",
      badge: undefined,
    },
    {
      to: "/admin/settings",
      icon: <Settings className="w-5 h-5" />,
      label: "시스템 설정",
      badge: undefined,
    },
  ];

  // 공통 서비스 메뉴
  const serviceMenuItems = [
    {
      key: "services",
      icon: <Globe className="w-5 h-5" />,
      label: "서비스",
      hasSubmenu: true,
      submenu: [
        {
          to: "/crawler/review",
          icon: <Search className="w-4 h-4" />,
          label: "리뷰 크롤링",
        },
        {
          to: "/crawler/naver-blog",
          icon: <Coffee className="w-4 h-4" />,
          label: "네이버 블로그",
        },
        {
          to: "/crawler/naver-cafe",
          icon: <MessageSquare className="w-4 h-4" />,
          label: "네이버 카페",
        },
      ],
    },
  ];

  // 현재 보기 모드에 따른 메뉴 결정
  const menuItems = isUserViewMode
    ? serviceMenuItems
    : [...adminMenuItems, ...serviceMenuItems];

  const handleLogout = () => {
    clearLicense();
    navigate({ to: "/license" });
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="fixed inset-0 bg-gray-50 flex">
      {/* 사이드바 - 데스크톱 */}
      <aside
        className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 transition-all duration-300 ${isSidebarCollapsed ? "lg:w-16" : "lg:w-64"}`}
      >
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          {/* 로고 영역 */}
          <div className="flex items-center px-4 py-4 border-b border-gray-200">
            <DigDuckIcon className="text-blue-600" size={32} />
            {!isSidebarCollapsed && (
              <div className="ml-3">
                <h1 className="text-lg font-bold text-gray-900">
                  {isUserViewMode ? "Dig Duck" : "Dig Duck Admin"}
                </h1>
                <p className="text-xs text-gray-500">
                  {isUserViewMode ? "사용자 모드" : "관리자 패널"}
                </p>
              </div>
            )}
          </div>

          {/* 네비게이션 메뉴 */}
          <nav className="flex-1 px-4 py-4 space-y-2">
            {menuItems.map((item) => {
              if (item.hasSubmenu) {
                return (
                  <div key={item.key}>
                    {/* 메인 메뉴 */}
                    <button
                      onClick={() => setIsServicesOpen(!isServicesOpen)}
                      className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center px-2" : "justify-between px-3"} py-2 rounded-lg transition-colors group relative text-gray-700 hover:bg-gray-100`}
                    >
                      <div className="flex items-center">
                        {item.icon}
                        {!isSidebarCollapsed && (
                          <span className="font-medium ml-3">{item.label}</span>
                        )}
                      </div>
                      {!isSidebarCollapsed && (
                        <div className="ml-auto">
                          {isServicesOpen ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </div>
                      )}
                      {/* 접힌 상태에서의 툴팁 */}
                      {isSidebarCollapsed && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                          {item.label}
                        </div>
                      )}
                    </button>

                    {/* 서브메뉴 */}
                    {isServicesOpen && !isSidebarCollapsed && (
                      <div className="ml-6 mt-2 space-y-1">
                        {item.submenu.map((subItem) => (
                          <Link
                            key={subItem.to}
                            to={subItem.to}
                            className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors group ${
                              location.pathname === subItem.to
                                ? "bg-blue-100 text-blue-700 border border-blue-200"
                                : "text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            {subItem.icon}
                            <span className="font-medium text-sm">
                              {subItem.label}
                            </span>
                            <ExternalLink className="w-3 h-3 ml-auto opacity-60" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center ${isSidebarCollapsed ? "justify-center px-2" : "space-x-3 px-3"} py-2 rounded-lg transition-colors group relative ${
                    location.pathname === item.to
                      ? "bg-blue-100 text-blue-700 border border-blue-200"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {item.icon}
                  {!isSidebarCollapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                  {/* 접힌 상태에서의 툴팁 */}
                  {isSidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* 메인 컨텐츠 영역 */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarCollapsed ? "lg:ml-16" : "lg:ml-64"}`}
      >
        {/* 모바일 헤더 */}
        <header className="lg:hidden flex-shrink-0 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileMenu}
                className="lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <DigDuckIcon className="text-blue-600" size={24} />
              <h1 className="text-lg font-semibold text-gray-900">
                {isUserViewMode ? "Dig Duck" : "관리자 패널"}
              </h1>
            </div>
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="text-red-600"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* 모바일 메뉴 오버레이 */}
        {isMobileMenuOpen && (
          <>
            {/* 배경 오버레이 - 클릭시 메뉴 닫기 */}
            <div
              className="lg:hidden fixed inset-0 z-40 bg-gray-600 bg-opacity-75"
              onClick={toggleMobileMenu}
            ></div>

            {/* 사이드 메뉴 */}
            <div className="lg:hidden fixed inset-y-0 left-0 w-64 bg-white z-50 shadow-xl">
              <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <DigDuckIcon className="text-blue-600" size={24} />
                  <h1 className="text-lg font-semibold text-gray-900">
                    {isUserViewMode ? "Dig Duck" : "관리자 패널"}
                  </h1>
                </div>
                <Button variant="ghost" size="sm" onClick={toggleMobileMenu}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* 모드 전환 버튼 - 모바일 */}
              <div className="px-4 py-2 border-b border-gray-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsUserViewMode(!isUserViewMode)}
                  className="w-full flex items-center justify-center space-x-2"
                >
                  {isUserViewMode ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      <span>관리자 모드</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      <span>사용자 모드</span>
                    </>
                  )}
                </Button>
              </div>

              <nav className="px-4 py-4 space-y-2">
                {menuItems
                  .filter((item) => typeof item.to === "string")
                  .map((item) => (
                    <MenuItem
                      key={item.to}
                      to={item.to as string}
                      icon={item.icon}
                      label={item.label}
                      badge={item.badge}
                      isActive={location.pathname === item.to}
                      onClick={() => setIsMobileMenuOpen(false)}
                    />
                  ))}
              </nav>
            </div>
          </>
        )}

        {/* 데스크톱 헤더 (페이지 제목) */}
        <header className="hidden lg:block flex-shrink-0 bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSidebar}
                  className="lg:flex hidden"
                >
                  <Menu className="w-5 h-5" />
                </Button>
                <h2 className="text-2xl font-bold text-gray-900">
                  {(() => {
                    // 직접 매치되는 메뉴 찾기
                    let found = menuItems.find(
                      (item) => item.to === location.pathname
                    );
                    if (found) return found.label;

                    // 서브메뉴에서 찾기
                    for (const item of menuItems) {
                      if (item.submenu) {
                        const subItem = item.submenu.find(
                          (sub) => sub.to === location.pathname
                        );
                        if (subItem) return subItem.label;
                      }
                    }

                    return isUserViewMode ? "Dig Duck" : "관리자 패널";
                  })()}
                </h2>
              </div>
              <div className="flex items-center space-x-4">
                {/* 보기 모드 전환 버튼 */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsUserViewMode(!isUserViewMode)}
                  className="flex items-center space-x-2"
                >
                  {isUserViewMode ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      <span>관리자 모드</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      <span>사용자 모드</span>
                    </>
                  )}
                </Button>
                {/* 라이선스 정보 */}
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">
                    {licenseInfo?.userName || "관리자"}
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
                                {licenseInfo?.userName || "관리자"}
                              </p>
                              <p className="text-xs text-gray-500">
                                시스템 관리자
                              </p>
                            </div>
                          </div>

                          {/* 라이선스 정보 */}
                          <div className="mb-3 pb-3 border-b border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-gray-600">
                                라이선스 상태
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
                                🚨 라이선스가 만료되었습니다.
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
          </div>
        </header>

        {/* 메인 컨텐츠 */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-auto px-4 py-6 lg:px-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
