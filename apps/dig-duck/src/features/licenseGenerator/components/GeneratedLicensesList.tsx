import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Copy,
  Download,
  Trash2,
  Search,
  Key,
  Mail,
  Calendar,
  User,
} from "lucide-react";
import { DigDuckIcon } from "@/components/icons/DigDuckIcon";
import { useLicenseGenerator } from "../hooks/useLicenseGenerator";

export const GeneratedLicensesList: React.FC = () => {
  const { generatedLicenses, removeLicense } = useLicenseGenerator();
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedKey, setCopiedKey] = useState<string>("");

  const filteredLicenses = generatedLicenses.filter(
    (license) =>
      license.licenseKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
      license.config.userEmail
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      license.config.productName
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const copyToClipboard = async (text: string, licenseKey: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(licenseKey);
      setTimeout(() => setCopiedKey(""), 2000);
    } catch (error) {
      console.error("클립보드에 복사 실패:", error);
    }
  };

  const downloadAsCSV = () => {
    const headers = [
      "라이센스 키",
      "타입",
      "이메일",
      "제품명",
      "만료일",
      "최대 활성화",
      "생성일",
    ];
    const rows = generatedLicenses.map((license) => [
      license.licenseKey,
      license.config.licenseType === "admin" ? "관리자" : "일반",
      license.config.userEmail,
      license.config.productName,
      license.config.expiryDate,
      license.config.maxActivations.toString(),
      new Date(license.generatedAt).toLocaleDateString("ko-KR"),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `licenses_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (generatedLicenses.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Key className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">아직 생성된 라이센스가 없습니다.</p>
            <p className="text-sm text-gray-400 mt-2">
              위의 폼을 사용하여 라이센스를 생성해보세요.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <Key className="w-5 h-5 mr-2 text-green-600" />
              생성된 라이센스 ({generatedLicenses.length}개)
            </CardTitle>
            <Button onClick={downloadAsCSV} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              CSV 다운로드
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* 검색 */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="라이센스 키, 이메일, 제품명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* 라이센스 목록 */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredLicenses.map((license) => (
              <div
                key={license.licenseKey}
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    {/* 라이센스 키와 타입 */}
                    <div className="flex items-center space-x-2 flex-wrap">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono break-all">
                        {license.licenseKey}
                      </code>
                      <Badge
                        variant={
                          license.config.licenseType === "admin"
                            ? "destructive"
                            : "default"
                        }
                      >
                        {license.config.licenseType === "admin" ? (
                          <>
                            <DigDuckIcon className="mr-1" size={12} />
                            관리자
                          </>
                        ) : (
                          <>
                            <User className="w-3 h-3 mr-1" />
                            일반
                          </>
                        )}
                      </Badge>
                      <Badge variant="outline">
                        {license.status === "active" ? "활성" : "대기"}
                      </Badge>
                    </div>

                    {/* 사용자 정보 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-2" />
                        {license.config.userEmail}
                      </div>
                      <div className="flex items-center">
                        <Key className="w-4 h-4 mr-2" />
                        {license.config.productName}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        만료: {formatDate(license.config.expiryDate)}
                      </div>
                      <div className="flex items-center">
                        <span className="w-4 h-4 mr-2 text-center text-xs bg-blue-100 text-blue-600 rounded">
                          {license.config.maxActivations}
                        </span>
                        최대 {license.config.maxActivations}회 활성화
                      </div>
                    </div>

                    {/* 관리자 전화번호 (관리자인 경우) */}
                    {license.config.licenseType === "admin" &&
                      license.config.phoneNumber && (
                        <div className="text-sm text-orange-600">
                          📱 {license.config.phoneNumber}
                        </div>
                      )}

                    {/* 생성일 */}
                    <div className="text-xs text-gray-400">
                      생성일: {formatDate(license.generatedAt)}
                    </div>
                  </div>

                  {/* 액션 버튼들 */}
                  <div className="flex space-x-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        copyToClipboard(license.licenseKey, license.licenseKey)
                      }
                      className="h-8"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedKey === license.licenseKey ? "복사됨!" : "복사"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeLicense(license.licenseKey)}
                      className="h-8 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* 복사 성공 알림 */}
                {copiedKey === license.licenseKey && (
                  <Alert className="mt-2 border-green-200 bg-green-50">
                    <AlertDescription className="text-green-700 text-sm">
                      라이센스 키가 클립보드에 복사되었습니다!
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ))}
          </div>

          {/* 검색 결과 없음 */}
          {filteredLicenses.length === 0 && searchTerm && (
            <div className="text-center py-8">
              <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">검색 결과가 없습니다.</p>
              <p className="text-sm text-gray-400">
                다른 검색어를 시도해보세요.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
