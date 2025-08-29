import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Key,
  User,
  Calendar,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { apiHelpers } from "@/lib/apiClient";

interface LicenseGeneratorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface GenerateLicenseRequest {
  email: string;
  name: string;
  allowedDevices?: number;
  maxTransfers?: number;
  subscriptionType: "ONE_MONTH" | "THREE_MONTHS" | "SIX_MONTHS" | "TWELVE_MONTHS";
}

export const LicenseGeneratorDialog: React.FC<LicenseGeneratorDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<GenerateLicenseRequest>({
    email: "",
    name: "",
    allowedDevices: 3,
    maxTransfers: 5,
    subscriptionType: "TWELVE_MONTHS",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // 1. 사용자 등록 또는 확인
      let userResponse = await apiHelpers.post('/auth/register', {
        email: formData.email,
        name: formData.name,
      });

      // 이미 존재하는 사용자인 경우는 무시
      if (!userResponse.success && !userResponse.error?.includes('이미 존재')) {
        throw new Error(userResponse.error || '사용자 생성 실패');
      }

      // 2. 라이센스 사용자 생성
      const licenseResponse = await apiHelpers.post('/license/users', {
        email: formData.email,
        allowedDevices: formData.allowedDevices,
        maxTransfers: formData.maxTransfers,
      });

      if (!licenseResponse.success) {
        throw new Error(licenseResponse.error || '라이센스 사용자 생성 실패');
      }

      // 3. 구독 생성
      const subscriptionResponse = await apiHelpers.post('/license/subscriptions', {
        userEmail: formData.email,
        subscriptionType: formData.subscriptionType,
        paymentId: `admin-generated-${Date.now()}`,
      });

      if (!subscriptionResponse.success) {
        throw new Error(subscriptionResponse.error || '구독 생성 실패');
      }

      setSuccess('라이센스가 성공적으로 생성되었습니다!');
      
      // 2초 후 성공 콜백 호출
      setTimeout(() => {
        onSuccess();
      }, 2000);

    } catch (error: any) {
      setError(error.message || '라이센스 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: "",
      name: "",
      allowedDevices: 3,
      maxTransfers: 5,
      subscriptionType: "TWELVE_MONTHS",
    });
    setError("");
    setSuccess("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Key className="w-5 h-5 mr-2 text-green-600" />
            라이센스 생성
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 이메일 */}
          <div>
            <Label htmlFor="email" className="flex items-center mb-2">
              <User className="w-4 h-4 mr-1" />
              사용자 이메일
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          {/* 사용자 이름 */}
          <div>
            <Label htmlFor="name" className="block mb-2">
              사용자 이름
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="홍길동"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          {/* 허용 디바이스 수 */}
          <div>
            <Label htmlFor="allowedDevices" className="block mb-2">
              허용 디바이스 수
            </Label>
            <Input
              id="allowedDevices"
              type="number"
              min="1"
              max="10"
              value={formData.allowedDevices}
              onChange={(e) => setFormData({ ...formData, allowedDevices: parseInt(e.target.value) })}
            />
          </div>

          {/* 최대 전송 수 */}
          <div>
            <Label htmlFor="maxTransfers" className="block mb-2">
              최대 전송 수
            </Label>
            <Input
              id="maxTransfers"
              type="number"
              min="1"
              max="20"
              value={formData.maxTransfers}
              onChange={(e) => setFormData({ ...formData, maxTransfers: parseInt(e.target.value) })}
            />
          </div>

          {/* 구독 기간 */}
          <div>
            <Label className="flex items-center mb-2">
              <Calendar className="w-4 h-4 mr-1" />
              구독 기간
            </Label>
            <Select
              value={formData.subscriptionType}
              onValueChange={(value: any) => setFormData({ ...formData, subscriptionType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ONE_MONTH">1개월</SelectItem>
                <SelectItem value="THREE_MONTHS">3개월</SelectItem>
                <SelectItem value="SIX_MONTHS">6개월</SelectItem>
                <SelectItem value="TWELVE_MONTHS">12개월</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* 성공 메시지 */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {/* 버튼 */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.email || !formData.name}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isLoading ? "생성 중..." : "라이센스 생성"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};