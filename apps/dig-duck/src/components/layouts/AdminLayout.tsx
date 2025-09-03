import React, { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Settings,
  LogOut,
  Menu,
  X,
  Key,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Globe,
  TrendingUp,
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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const location = useLocation();
  const { licenseInfo, clearLicense } = useLicenseStore();

  const menuItems = [
    {
      to: "/admin/dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
      label: "대시보드",
      badge: undefined,
    },
    {
      key: "services",
      icon: <Globe className="w-5 h-5" />,
      label: "서비스",
      hasSubmenu: true,
      submenu: [
        {
          to: "/crawler/review",
          icon: <Search className="w-4 h-4" />,
          label: "크롤링 서비스",
        },
        {
          to: "/crawler/insights",
          icon: <TrendingUp className="w-4 h-4" />,
          label: "쇼핑 인사이트",
        },
      ],
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
                <h1 className="text-lg font-bold text-gray-900">
                  Dig Duck Admin
                </h1>
                <p className="text-xs text-gray-500">관리자 패널</p>
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

          {/* 사용자 정보 및 로그아웃 */}
          <div className="px-4 py-4 border-t border-gray-200">
            {!isSidebarCollapsed ? (
              <>
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <DigDuckIcon className="text-blue-600" size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {licenseInfo?.userEmail || "admin@company.com"}
                    </p>
                    <p className="text-xs text-gray-500">관리자</p>
                  </div>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  로그아웃
                </Button>
              </>
            ) : (
              <div className="flex justify-center">
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="sm"
                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 group relative"
                >
                  <LogOut className="w-5 h-5" />
                  {/* 접힌 상태에서의 툴팁 */}
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                    로그아웃
                  </div>
                </Button>
              </div>
            )}
          </div>
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
              <h1 className="text-lg font-semibold text-gray-900">
                관리자 패널
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
                    관리자 패널
                  </h1>
                </div>
                <Button variant="ghost" size="sm" onClick={toggleMobileMenu}>
                  <X className="w-5 h-5" />
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

              {/* 모바일 메뉴 하단 사용자 정보 */}
              <div className="absolute bottom-0 left-0 right-0 px-4 py-4 border-t border-gray-200 bg-white">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <DigDuckIcon className="text-blue-600" size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {licenseInfo?.userEmail || "admin@company.com"}
                    </p>
                    <p className="text-xs text-gray-500">관리자</p>
                  </div>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  로그아웃
                </Button>
              </div>
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

                    return "관리자 패널";
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
