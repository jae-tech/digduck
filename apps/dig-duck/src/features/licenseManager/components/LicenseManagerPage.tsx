import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Key, Plus, Search, Filter } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { LicenseGeneratorDialog } from "../../licenseGenerator/components/LicenseGeneratorDialog";
import { DataTable } from "@/components/DataTable";

interface LicenseData {
  id: string;
  licenseKey: string;
  userEmail: string;
  type: string;
  status: string;
  deviceCount: string;
  expiryDate: string;
}

export const LicenseManagerPage: React.FC = () => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [licenseData, setLicenseData] = useState<LicenseData[]>([]);
  const [stats, setStats] = useState({
    active: 0,
    user: 0,
    expired: 0,
    suspended: 0,
    expiringSoon: 0
  });
  const [loading, setLoading] = useState(true);

  // 라이센스 데이터 로드
  useEffect(() => {
    loadLicenseData();
    loadStats();
  }, []);

  const loadLicenseData = async () => {
    try {
      const response = await fetch('http://localhost:8000/license/admin/users');
      const result = await response.json();
      
      if (result.success) {
        const licenses: LicenseData[] = result.data.users.map((user: any) => ({
          id: user.licenseKey,
          licenseKey: user.licenseKey,
          userEmail: user.email,
          type: user.licenseKey.startsWith('ADMIN') ? "admin" : "user",
          status: user.license_subscriptions?.[0]?.isActive ? "active" : "expired",
          deviceCount: `${user.activatedDevices?.length || 0}/${user.allowedDevices}`,
          expiryDate: user.license_subscriptions?.[0]?.endDate ? 
            new Date(user.license_subscriptions[0].endDate).toLocaleDateString() : "N/A"
        }));
        
        setLicenseData(licenses.filter(l => l.type !== "admin"));
      }
    } catch (error) {
      console.error('Failed to load license data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('http://localhost:8000/admin/licenses/stats');
      const result = await response.json();
      
      if (result.success) {
        setStats({
          active: result.data.active,
          user: result.data.total - result.data.admin,
          expired: result.data.expired,
          suspended: result.data.suspended,
          expiringSoon: result.data.expiringSoon
        });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  // 필터링된 데이터
  const filteredData = licenseData.filter((license) => {
    const matchesSearch =
      license.licenseKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
      license.userEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || license.status === statusFilter;
    const matchesType = typeFilter === "all" || license.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // 테이블 컬럼 정의
  const columns: ColumnDef<LicenseData>[] = [
    {
      accessorKey: "licenseKey",
      header: "라이센스 키",
      cell: ({ getValue }) => (
        <span className="font-mono text-sm">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: "userEmail",
      header: "사용자 이메일",
    },
    {
      accessorKey: "type",
      header: "타입",
      cell: ({ getValue }) => {
        const type = getValue() as string;
        return (
          <Badge
            variant={type === "admin" ? "default" : "secondary"}
            className={
              type === "admin"
                ? "bg-purple-100 text-purple-800 hover:bg-purple-200"
                : ""
            }
          >
            {type === "admin" ? "관리자" : "일반"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: "상태",
      cell: ({ getValue }) => {
        const status = getValue() as string;
        return (
          <Badge
            variant={status === "active" ? "default" : "secondary"}
            className={
              status === "active"
                ? "bg-green-100 text-green-800 hover:bg-green-200"
                : ""
            }
          >
            {status === "active"
              ? "활성"
              : status === "expired"
                ? "만료"
                : "일시정지"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "deviceCount",
      header: "디바이스 수",
    },
    {
      accessorKey: "expiryDate",
      header: "만료일",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-end">
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          라이센스 추가
        </Button>
      </div>

      {/* 라이센스 현황 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="w-5 h-5 mr-2 text-green-600" />
            라이센스 발급 현황
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-gray-600">활성 라이센스</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.user}</div>
              <div className="text-sm text-gray-600">일반 라이센스</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{stats.expired}</div>
              <div className="text-sm text-gray-600">만료된 라이센스</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{stats.suspended}</div>
              <div className="text-sm text-gray-600">일시정지</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{stats.expiringSoon}</div>
              <div className="text-sm text-gray-600">만료 예정</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 라이센스 목록 테이블 */}
      <Card>
        <CardContent className="pt-6">
          {/* 필터 및 검색 */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-8 gap-4 mb-4">
              {/* 검색 */}
              <div className="md:col-span-5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="라이센스 키 또는 이메일 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
              </div>

              {/* 상태 필터 */}
              <div className="md:col-span-1">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="상태" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 상태</SelectItem>
                    <SelectItem value="active">활성</SelectItem>
                    <SelectItem value="expired">만료</SelectItem>
                    <SelectItem value="suspended">일시정지</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 타입 필터 */}
              <div className="md:col-span-1">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="타입" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 타입</SelectItem>
                    <SelectItem value="user">일반</SelectItem>
                    <SelectItem value="admin">관리자</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 필터 초기화 */}
              <div className="md:col-span-1">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setTypeFilter("all");
                  }}
                >
                  초기화
                </Button>
              </div>
            </div>

            {/* 결과 개수 */}
            <div className="text-sm text-gray-600">
              총 {filteredData.length}개의 라이센스
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">라이센스 데이터를 불러오는 중...</div>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredData}
              enableFiltering={false}
            />
          )}
        </CardContent>
      </Card>

      {/* 라이센스 생성 다이얼로그 */}
      {showAddDialog && (
        <LicenseGeneratorDialog
          isOpen={showAddDialog}
          onClose={() => setShowAddDialog(false)}
          onSuccess={() => {
            setShowAddDialog(false);
            loadLicenseData();
            loadStats();
          }}
        />
      )}
    </div>
  );
};
