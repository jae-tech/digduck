import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Key, Users, Calendar, TrendingUp } from "lucide-react";
import { LicenseGeneratorForm } from "./LicenseGeneratorForm";
import { GeneratedLicensesList } from "./GeneratedLicensesList";
import { useLicenseGenerator } from "../hooks/useLicenseGenerator";

export const LicenseGeneratorPage: React.FC = () => {
  const { generatedLicenses } = useLicenseGenerator();

  // 통계 계산
  const stats = {
    total: generatedLicenses.length,
    active: generatedLicenses.filter((l) => l.status === "active").length,
    admin: generatedLicenses.filter((l) => l.config.licenseType === "admin")
      .length,
    expiringSoon: generatedLicenses.filter((l) => {
      const expiryDate = new Date(l.config.expiryDate);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return expiryDate <= thirtyDaysFromNow;
    }).length,
  };

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Zap className="w-8 h-8 mr-3 text-blue-600" />
          라이센스 생성기
        </h1>
        <p className="text-gray-600 mt-2">
          새로운 라이센스를 생성하고 관리할 수 있습니다.
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 생성</CardTitle>
            <Key className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              전체 생성된 라이센스
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 라이센스</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.active}
            </div>
            <p className="text-xs text-muted-foreground">
              현재 활성화된 라이센스
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              관리자 라이센스
            </CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.admin}
            </div>
            <p className="text-xs text-muted-foreground">
              관리자 권한 라이센스
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">만료 예정</CardTitle>
            <Calendar className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.expiringSoon}
            </div>
            <p className="text-xs text-muted-foreground">30일 내 만료 예정</p>
          </CardContent>
        </Card>
      </div>

      {/* 빠른 액션 카드 */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">빠른 시작 가이드</CardTitle>
          <CardDescription className="text-blue-700">
            라이센스 생성 과정을 간단히 안내합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start space-x-3">
              <Badge className="bg-blue-100 text-blue-800">1</Badge>
              <div>
                <h4 className="font-semibold text-blue-900">타입 선택</h4>
                <p className="text-sm text-blue-700">
                  일반 사용자 또는 관리자 라이센스를 선택하세요.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Badge className="bg-blue-100 text-blue-800">2</Badge>
              <div>
                <h4 className="font-semibold text-blue-900">정보 입력</h4>
                <p className="text-sm text-blue-700">
                  사용자 이메일, 제품명, 만료일을 입력하세요.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Badge className="bg-blue-100 text-blue-800">3</Badge>
              <div>
                <h4 className="font-semibold text-blue-900">생성 및 배포</h4>
                <p className="text-sm text-blue-700">
                  생성된 라이센스를 복사해서 사용자에게 전달하세요.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 라이센스 생성 폼 */}
      <LicenseGeneratorForm />

      {/* 생성된 라이센스 목록 */}
      <GeneratedLicensesList />
    </div>
  );
};
