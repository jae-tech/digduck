import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Users, AlertCircle, Zap, Calendar, Clock } from "lucide-react";

// 타입 정의
interface LicenseConfig {
  licenseType: "user" | "admin";
  userEmail: string;
  productName: string;
  expiryDate: string;
  maxActivations: number;
  phoneNumber?: string;
}

// 만료일 기간 옵션
const EXPIRY_PERIODS = [
  { value: "1", label: "1개월", months: 1 },
  { value: "3", label: "3개월", months: 3 },
  { value: "6", label: "6개월", months: 6 },
  { value: "12", label: "12개월", months: 12 },
  { value: "custom", label: "직접 입력", months: 0 },
] as const;

import { useLicenseGenerator } from "../hooks/useLicenseGenerator";

export const LicenseGeneratorForm: React.FC = () => {
  const {
    isGenerating,
    error,
    generateSingleLicense,
    generateBulkLicenses,
    clearError,
  } = useLicenseGenerator();

  const [config, setConfig] = useState<LicenseConfig>({
    licenseType: "user",
    userEmail: "",
    productName: "Standard License",
    expiryDate: "",
    maxActivations: 1,
    phoneNumber: "",
  });

  const [bulkCount, setBulkCount] = useState(5);
  const [expiryPeriod, setExpiryPeriod] = useState("12"); // 기본값: 12개월
  const [customExpiryDate, setCustomExpiryDate] = useState("");

  // 만료일 계산 함수
  const calculateExpiryDate = (months: number): string => {
    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setMonth(expiryDate.getMonth() + months);
    return expiryDate.toISOString().split("T")[0];
  };

  // 기본 만료일 설정 (12개월 후)
  useEffect(() => {
    const defaultExpiry = calculateExpiryDate(12);
    setConfig((prev) => ({
      ...prev,
      expiryDate: defaultExpiry,
    }));
    setCustomExpiryDate(defaultExpiry);
  }, []);

  // 만료일 기간 변경 핸들러
  const handleExpiryPeriodChange = (value: string) => {
    setExpiryPeriod(value);
    clearError();

    if (value === "custom") {
      // 직접 입력 모드
      setConfig((prev) => ({
        ...prev,
        expiryDate: customExpiryDate,
      }));
    } else {
      // 기간 선택 모드
      const selectedPeriod = EXPIRY_PERIODS.find((p) => p.value === value);
      if (selectedPeriod) {
        const newExpiryDate = calculateExpiryDate(selectedPeriod.months);
        setConfig((prev) => ({
          ...prev,
          expiryDate: newExpiryDate,
        }));
      }
    }
  };

  // 커스텀 만료일 변경 핸들러
  const handleCustomExpiryDateChange = (value: string) => {
    setCustomExpiryDate(value);
    setConfig((prev) => ({
      ...prev,
      expiryDate: value,
    }));
    clearError();
  };

  const handleInputChange = (
    field: keyof LicenseConfig,
    value: string | number
  ) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    clearError();
  };

  const handleSingleGenerate = async () => {
    const result = await generateSingleLicense(config);
    if (result.success) {
      // 성공 시 이메일만 리셋
      setConfig((prev) => ({ ...prev, userEmail: "" }));
    }
  };

  const handleBulkGenerate = async () => {
    await generateBulkLicenses(bulkCount, config);
  };

  // 만료일 미리보기 텍스트
  const getExpiryPreview = (): string => {
    if (!config.expiryDate) return "";

    const expiryDate = new Date(config.expiryDate);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return `${expiryDate.toLocaleDateString("ko-KR")} (${diffDays}일 후)`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="w-5 h-5 mr-2 text-blue-600" />
            라이센스 생성기
          </CardTitle>
          <CardDescription>
            새로운 라이센스를 생성하여 사용자에게 배포할 수 있습니다.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="single" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single" className="flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                단일 생성
              </TabsTrigger>
              <TabsTrigger value="bulk" className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                대량 생성
              </TabsTrigger>
            </TabsList>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <TabsContent value="single" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="licenseType">라이센스 타입</Label>
                  <Select
                    value={config.licenseType}
                    onValueChange={(value: "user" | "admin") =>
                      handleInputChange("licenseType", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">일반 사용자</SelectItem>
                      <SelectItem value="admin">관리자</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="userEmail">사용자 이메일</Label>
                  <Input
                    id="userEmail"
                    type="email"
                    value={config.userEmail}
                    onChange={(e) =>
                      handleInputChange("userEmail", e.target.value)
                    }
                    placeholder="user@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productName">제품명</Label>
                  <Select
                    value={config.productName}
                    onValueChange={(value) =>
                      handleInputChange("productName", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Standard License">
                        Standard License
                      </SelectItem>
                      <SelectItem value="Pro License">Pro License</SelectItem>
                      <SelectItem value="Enterprise License">
                        Enterprise License
                      </SelectItem>
                      <SelectItem value="Trial License">
                        Trial License
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxActivations">최대 활성화 횟수</Label>
                  <Input
                    id="maxActivations"
                    type="number"
                    min="1"
                    max="100"
                    value={config.maxActivations}
                    onChange={(e) =>
                      handleInputChange(
                        "maxActivations",
                        parseInt(e.target.value) || 1
                      )
                    }
                  />
                </div>

                {/* 개선된 만료일 설정 */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="expiryPeriod" className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    만료일 설정
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Select
                        value={expiryPeriod}
                        onValueChange={handleExpiryPeriodChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPIRY_PERIODS.map((period) => (
                            <SelectItem key={period.value} value={period.value}>
                              <div className="flex items-center">
                                <Clock className="w-3 h-3 mr-2" />
                                {period.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {expiryPeriod === "custom" ? (
                      <div className="space-y-2">
                        <Input
                          type="date"
                          value={customExpiryDate}
                          onChange={(e) =>
                            handleCustomExpiryDateChange(e.target.value)
                          }
                          min={new Date().toISOString().split("T")[0]}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center px-3 py-2 bg-gray-50 rounded-md border">
                        <span className="text-sm text-gray-600">
                          {getExpiryPreview()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {config.licenseType === "admin" && (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="phoneNumber">휴대폰 번호 (11자리)</Label>
                    <Input
                      id="phoneNumber"
                      type="text"
                      value={config.phoneNumber}
                      onChange={(e) =>
                        handleInputChange(
                          "phoneNumber",
                          e.target.value.replace(/[^0-9]/g, "").slice(0, 11)
                        )
                      }
                      placeholder="01012345678"
                      maxLength={11}
                    />
                  </div>
                )}
              </div>

              <Button
                onClick={handleSingleGenerate}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    생성 중...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    라이센스 생성
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="bulk" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bulkCount">생성 개수</Label>
                  <Input
                    id="bulkCount"
                    type="number"
                    min="1"
                    max="100"
                    value={bulkCount}
                    onChange={(e) =>
                      setBulkCount(parseInt(e.target.value) || 1)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bulkProductName">제품명</Label>
                  <Select
                    value={config.productName}
                    onValueChange={(value) =>
                      handleInputChange("productName", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Standard License">
                        Standard License
                      </SelectItem>
                      <SelectItem value="Pro License">Pro License</SelectItem>
                      <SelectItem value="Enterprise License">
                        Enterprise License
                      </SelectItem>
                      <SelectItem value="Trial License">
                        Trial License
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 대량 생성용 만료일 설정 */}
                <div className="space-y-2 md:col-span-2">
                  <Label
                    htmlFor="bulkExpiryPeriod"
                    className="flex items-center"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    만료일 설정
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Select
                        value={expiryPeriod}
                        onValueChange={handleExpiryPeriodChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPIRY_PERIODS.map((period) => (
                            <SelectItem key={period.value} value={period.value}>
                              <div className="flex items-center">
                                <Clock className="w-3 h-3 mr-2" />
                                {period.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {expiryPeriod === "custom" ? (
                      <div className="space-y-2">
                        <Input
                          type="date"
                          value={customExpiryDate}
                          onChange={(e) =>
                            handleCustomExpiryDateChange(e.target.value)
                          }
                          min={new Date().toISOString().split("T")[0]}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center px-3 py-2 bg-gray-50 rounded-md border">
                        <span className="text-sm text-gray-600">
                          {getExpiryPreview()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bulkMaxActivations">최대 활성화 횟수</Label>
                  <Input
                    id="bulkMaxActivations"
                    type="number"
                    min="1"
                    max="100"
                    value={config.maxActivations}
                    onChange={(e) =>
                      handleInputChange(
                        "maxActivations",
                        parseInt(e.target.value) || 1
                      )
                    }
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>대량 생성 안내:</strong>
                  <br />
                  • 이메일 형식: user1@example.com, user2@example.com, ...
                  <br />
                  • 일반 사용자 라이센스만 생성됩니다
                  <br />
                  • 생성된 라이센스는 자동으로 활성화됩니다
                  <br />• 모든 라이센스의 만료일:{" "}
                  <strong>{getExpiryPreview()}</strong>
                </p>
              </div>

              <Button
                onClick={handleBulkGenerate}
                disabled={isGenerating}
                className="w-full"
                variant="outline"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-2" />
                    대량 생성 중...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    {bulkCount}개 라이센스 생성
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default LicenseGeneratorForm;
