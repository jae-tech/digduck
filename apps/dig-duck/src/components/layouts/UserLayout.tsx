import React, { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Search,
  Globe,
  TrendingUp,
  User,
} from "lucide-react";
import { DigDuckIcon } from "@/components/icons/DigDuckIcon";
import { useLicenseStore } from "@/features/license/store/license.store";

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

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const { licenseInfo, clearLicense } = useLicenseStore();

  const menuItems = [
    {
      to: "/dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
      label: "대시보드",
      badge: undefined,
    },
    {
      to: "/crawler/review",
      icon: <Search className="w-5 h-5" />,
      label: "스마트스토어 리뷰",
      badge: undefined,
    },
    {
      to: "/crawler/naver-blog",
      icon: <Globe className="w-5 h-5" />,
      label: "네이버 블로그",
      badge: undefined,
    },
    {
      to: "/crawler/insights",
      icon: <TrendingUp className="w-5 h-5" />,
      label: "쇼핑 인사이트",
      badge: undefined,
    },
  ];

  const handleLogout = () => {
    clearLicense();
    window.location.href = "/license";
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
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
                <h1 className="text-lg font-bold text-gray-900">Dig Duck</h1>
                <p className="text-xs text-gray-500">크롤링 서비스</p>
              </div>
            )}
          </div>

          {/* 네비게이션 메뉴 */}
          <nav className="flex-1 px-4 py-4 space-y-2">
            {menuItems.map((item) => (
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
                {item.badge && !isSidebarCollapsed && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {item.badge}
                  </Badge>
                )}
                {/* 접힌 상태에서의 툴팁 */}
                {isSidebarCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            ))}
          </nav>

        </div>
      </aside>

      {/* 메인 컨텐츠 영역 */}
      <div
        className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? "lg:ml-16" : "lg:ml-64"}`}
      >
        {/* 모바일 헤더 */}
        <header className="lg:hidden bg-white shadow-sm border-b border-gray-200">
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
              <h1 className="text-lg font-semibold text-gray-900">Dig Duck</h1>
            </div>
            {/* 사용자 메뉴 드롭다운 - 모바일 */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2"
              >
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-3 h-3 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-medium text-gray-900 truncate max-w-[100px]">
                    {licenseInfo?.userEmail || "user@example.com"}
                  </p>
                </div>
              </Button>

              {/* 드롭다운 메뉴 - 모바일 */}
              {isUserMenuOpen && (
                <>
                  {/* 배경 오버레이 */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  
                  {/* 드롭다운 컨텐츠 */}
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                    <div className="p-4">
                      {/* 사용자 정보 */}
                      <div className="flex items-center space-x-3 mb-3 pb-3 border-b border-gray-100">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {licenseInfo?.userEmail || "user@example.com"}
                          </p>
                          <p className="text-xs text-gray-500">사용자</p>
                        </div>
                      </div>

                      {/* 라이센스 정보 */}
                      <div className="mb-3 pb-3 border-b border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-600">라이센스 상태</span>
                          <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                            활성
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500">
                          {licenseInfo?.expiryDate ? 
                            `만료일: ${licenseInfo.expiryDate}` : 
                            "만료일 확인 중..."
                          }
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
                    Dig Duck
                  </h1>
                </div>
                <Button variant="ghost" size="sm" onClick={toggleMobileMenu}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <nav className="px-4 py-4 space-y-2 overflow-y-auto max-h-[calc(100vh-200px)]">
                {menuItems.map((item) => (
                  <MenuItem
                    key={item.to}
                    to={item.to}
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
        <header className="hidden lg:block bg-white shadow-sm border-b border-gray-200">
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
                    const found = menuItems.find(
                      (item) => item.to === location.pathname
                    );
                    return found ? found.label : "대시보드";
                  })()}
                </h2>
              </div>
              <div className="flex items-center space-x-4">
                <Badge
                  variant="outline"
                  className="text-green-600 border-green-200"
                >
                  온라인
                </Badge>
                <div className="text-sm text-gray-600">
                  {new Date().toLocaleDateString("ko-KR")}
                </div>
                {/* 사용자 메뉴 드롭다운 */}
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
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {licenseInfo?.userEmail || "user@example.com"}
                      </p>
                      <p className="text-xs text-gray-500">사용자</p>
                    </div>
                  </Button>

                  {/* 드롭다운 메뉴 */}
                  {isUserMenuOpen && (
                    <>
                      {/* 배경 오버레이 */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsUserMenuOpen(false)}
                      />
                      
                      {/* 드롭다운 컨텐츠 */}
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                        <div className="p-4">
                          {/* 사용자 정보 */}
                          <div className="flex items-center space-x-3 mb-3 pb-3 border-b border-gray-100">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {licenseInfo?.userEmail || "user@example.com"}
                              </p>
                              <p className="text-xs text-gray-500">사용자</p>
                            </div>
                          </div>

                          {/* 라이센스 정보 */}
                          <div className="mb-3 pb-3 border-b border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-gray-600">라이센스 상태</span>
                              <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                                활성
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-500">
                              {licenseInfo?.expiryDate ? 
                                `만료일: ${licenseInfo.expiryDate}` : 
                                "만료일 확인 중..."
                              }
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
        <main className="px-4 py-6 lg:px-6">{children}</main>
      </div>
    </div>
  );
}
