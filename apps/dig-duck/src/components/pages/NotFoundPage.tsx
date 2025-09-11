import React from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { DigDuckIcon } from "@/components/icons/DigDuckIcon";
import { Home, ArrowLeft, Search } from "lucide-react";

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate({ to: "/" });
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="mb-8">
          <DigDuckIcon size={120} className="mx-auto mb-4" />
          <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            페이지를 찾을 수 없어요
          </h2>
        </div>

        {/* Description */}
        <div className="mb-8">
          <p className="text-gray-600 mb-2">
            요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          </p>
          <p className="text-gray-500 text-sm">
            URL을 다시 확인해주시거나 홈으로 돌아가 주세요.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleGoHome}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            <Home className="w-4 h-4 mr-2" />
            홈으로 이동
          </Button>

          <Button
            onClick={handleGoBack}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            이전 페이지로
          </Button>
        </div>

        {/* Additional Help */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center justify-center">
            <Search className="w-5 h-5 mr-2" />
            자주 찾는 페이지
          </h3>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <Button
              variant="ghost"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={() => navigate({ to: "/license" })}
            >
              라이센스 활성화
            </Button>
            <Button
              variant="ghost"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={() => navigate({ to: "/admin/dashboard" })}
            >
              관리자 패널
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-xs text-gray-400">
          <p>© 2024 Dig Duck. 더 스마트한 쇼핑의 시작</p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
