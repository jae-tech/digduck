import React, { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Zap,
  Settings,
  Shield,
  LogOut,
  Menu,
  X,
  Key,
} from "lucide-react";
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
      to: "/admin/license-generator",
      icon: <Zap className="w-5 h-5" />,
      label: "라이센스 생성",
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

  const handleLogout = () => {
    clearLicense();
    window.location.href = "/license";
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 사이드바 - 데스크톱 */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          {/* 로고 영역 */}
          <div className="flex items-center px-4 py-4 border-b border-gray-200">
            <Shield className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">관리자 패널</h1>
              <p className="text-xs text-gray-500">License Manager</p>
            </div>
          </div>

          {/* 네비게이션 메뉴 */}
          <nav className="flex-1 px-4 py-4 space-y-2">
            {menuItems.map((item) => (
              <MenuItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
                isActive={location.pathname === item.to}
              />
            ))}
          </nav>

          {/* 사용자 정보 및 로그아웃 */}
          <div className="px-4 py-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="w-4 h-4 text-blue-600" />
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
      </aside>

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 lg:ml-64">
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
              <Shield className="w-6 h-6 text-blue-600" />
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
          <div className="lg:hidden fixed inset-0 z-50 bg-gray-600 bg-opacity-75">
            <div className="fixed inset-y-0 left-0 w-64 bg-white">
              <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <Shield className="w-6 h-6 text-blue-600" />
                  <h1 className="text-lg font-semibold text-gray-900">
                    관리자 패널
                  </h1>
                </div>
                <Button variant="ghost" size="sm" onClick={toggleMobileMenu}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <nav className="px-4 py-4 space-y-2">
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
          </div>
        )}

        {/* 데스크톱 헤더 (페이지 제목) */}
        <header className="hidden lg:block bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {menuItems.find((item) => item.to === location.pathname)
                    ?.label || "관리자 패널"}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  라이센스 시스템을 관리하고 모니터링하세요
                </p>
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
