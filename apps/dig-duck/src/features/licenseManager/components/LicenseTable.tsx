import React, { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type PaginationState,
  type RowSelectionState,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Pause,
  Play,
  User,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Loader2,
  Plus,
} from "lucide-react";
import { DigDuckIcon } from "@/components/icons/DigDuckIcon";

// 🎯 타입 정의
interface LicenseRecord {
  id: string;
  licenseKey: string;
  userEmail: string;
  phoneNumber?: string;
  productName: string;
  licenseType: "user" | "admin";
  status: "active" | "expired" | "revoked" | "suspended";
  issueDate: string;
  expiryDate: string;
  activationCount: number;
  maxActivations: number;
  lastUsed?: string;
}

interface LicenseTableProps {
  licenses: LicenseRecord[];
  loading?: boolean;
  selectedLicenses?: string[];
  onToggleSelection?: (licenseId: string) => void;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onUpdate?: (licenseId: string, data: any) => Promise<boolean>;
  onDelete?: (licenseId: string) => Promise<boolean>;
  onRefresh?: () => void;
  onExport?: () => void;
  onSelectionChange?: (selectedLicenses: LicenseRecord[]) => void;
}

interface EditForm {
  userEmail?: string;
  productName?: string;
  expiryDate?: string;
  maxActivations?: number;
  status?: "active" | "expired" | "revoked" | "suspended";
}

// 🎨 재사용 가능한 셀 컴포넌트들

// 상태 뱃지 컴포넌트
const StatusBadge = ({ status }: { status: string }) => {
  const configs = {
    active: {
      text: "활성",
      icon: CheckCircle,
      className: "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm",
    },
    expired: {
      text: "만료",
      icon: Clock,
      className: "bg-gray-50 text-gray-700 border-gray-200 shadow-sm",
    },
    revoked: {
      text: "해지",
      icon: XCircle,
      className: "bg-red-50 text-red-700 border-red-200 shadow-sm",
    },
    suspended: {
      text: "일시정지",
      icon: AlertTriangle,
      className: "bg-amber-50 text-amber-700 border-amber-200 shadow-sm",
    },
  };

  const config = configs[status as keyof typeof configs] || configs.active;
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={`${config.className} px-2.5 py-1 font-medium`}
    >
      <Icon className="w-3 h-3 mr-1.5" />
      {config.text}
    </Badge>
  );
};

// 라이센스 타입 뱃지 컴포넌트
const LicenseTypeBadge = ({ type }: { type: string }) => {
  return type === "admin" ? (
    <Badge
      variant="outline"
      className="bg-gradient-to-r from-orange-50 to-red-50 text-orange-700 border-orange-200 shadow-sm px-2.5 py-1 font-medium"
    >
      <DigDuckIcon className="mr-1.5" size={12} />
      관리자
    </Badge>
  ) : (
    <Badge
      variant="outline"
      className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 shadow-sm px-2.5 py-1 font-medium"
    >
      <User className="w-3 h-3 mr-1.5" />
      일반 사용자
    </Badge>
  );
};

// 라이센스 키 복사 컴포넌트
const LicenseKeyCell = ({ licenseKey }: { licenseKey: string }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(licenseKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("복사 실패:", error);
    }
  };

  return (
    <div className="flex items-center space-x-2 group">
      <code className="bg-gray-100 hover:bg-gray-200 transition-colors px-2.5 py-1.5 rounded-md text-xs font-mono max-w-[120px] truncate border">
        {licenseKey}
      </code>
      <Button
        variant="ghost"
        size="sm"
        onClick={copyToClipboard}
        className={`h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 ${
          copied ? "text-green-600 opacity-100" : "hover:bg-gray-200"
        }`}
        title={copied ? "복사됨!" : "클립보드에 복사"}
      >
        {copied ? (
          <CheckCircle className="w-3.5 h-3.5" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </Button>
    </div>
  );
};

// 사용자 정보 컴포넌트
const UserInfoCell = ({ license }: { license: LicenseRecord }) => {
  return (
    <div className="py-1">
      <div
        className="text-sm font-medium text-gray-900 truncate max-w-[180px]"
        title={license.userEmail}
      >
        {license.userEmail}
      </div>
      {license.phoneNumber && (
        <div className="text-xs text-gray-500 mt-0.5 flex items-center">
          <span className="w-3 h-3 mr-1">📱</span>
          {license.phoneNumber}
        </div>
      )}
    </div>
  );
};

// 활성화 진행률 컴포넌트
const ActivationProgress = ({ license }: { license: LicenseRecord }) => {
  const { activationCount, maxActivations } = license;
  const percentage = Math.min((activationCount / maxActivations) * 100, 100);
  const isNearLimit = percentage >= 80;
  const isFull = percentage >= 100;

  return (
    <div className="py-1">
      <div className="flex items-center justify-between text-sm text-gray-900 mb-1.5">
        <span className="font-medium">{activationCount}</span>
        <span className="text-gray-500 text-xs">/ {maxActivations}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${
            isFull ? "bg-red-500" : isNearLimit ? "bg-amber-500" : "bg-blue-500"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {isFull && (
        <div className="text-xs text-red-600 mt-1 flex items-center">
          <AlertCircle className="w-3 h-3 mr-1" />
          한계 도달
        </div>
      )}
    </div>
  );
};

// 만료일 컴포넌트
const ExpiryDateCell = ({ expiryDate }: { expiryDate: string }) => {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const isExpired = expiry <= now;
  const daysUntilExpiry = Math.ceil(
    (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  const isExpiringSoon = !isExpired && daysUntilExpiry <= 30;

  return (
    <div className="py-1">
      <div
        className={`text-sm font-medium ${
          isExpired
            ? "text-red-600"
            : isExpiringSoon
              ? "text-amber-600"
              : "text-gray-900"
        }`}
      >
        {expiry.toLocaleDateString("ko-KR")}
      </div>
      {isExpired && (
        <div className="text-xs text-red-500 flex items-center mt-1">
          <XCircle className="w-3 h-3 mr-1" />
          만료됨
        </div>
      )}
      {isExpiringSoon && !isExpired && (
        <div className="text-xs text-amber-600 flex items-center mt-1">
          <Clock className="w-3 h-3 mr-1" />
          {daysUntilExpiry}일 남음
        </div>
      )}
    </div>
  );
};

// 액션 드롭다운 컴포넌트
const ActionDropdown = ({
  license,
  onEdit,
  onDelete,
  onUpdate,
}: {
  license: LicenseRecord;
  onEdit: (license: LicenseRecord) => void;
  onDelete: (license: LicenseRecord) => void;
  onUpdate?: (licenseId: string, data: any) => Promise<boolean>;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (onUpdate) {
      await onUpdate(license.id, { status: newStatus });
    }
    setIsOpen(false);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(license.licenseKey);
      setIsOpen(false);
    } catch (error) {
      console.error("복사 실패:", error);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-gray-100 transition-colors"
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={() => {
            onEdit(license);
            setIsOpen(false);
          }}
          className="cursor-pointer"
        >
          <Edit className="w-4 h-4 mr-2 text-blue-600" />
          편집
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyToClipboard} className="cursor-pointer">
          <Copy className="w-4 h-4 mr-2 text-gray-600" />키 복사
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {license.status === "active" ? (
          <DropdownMenuItem
            onClick={() => handleStatusChange("suspended")}
            className="cursor-pointer text-amber-600"
          >
            <Pause className="w-4 h-4 mr-2" />
            일시정지
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={() => handleStatusChange("active")}
            className="cursor-pointer text-green-600"
          >
            <Play className="w-4 h-4 mr-2" />
            활성화
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={() => handleStatusChange("revoked")}
          className="cursor-pointer text-orange-600"
        >
          <AlertCircle className="w-4 h-4 mr-2" />
          해지
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            onDelete(license);
            setIsOpen(false);
          }}
          className="cursor-pointer text-red-600"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          삭제
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// 📊 메인 라이센스 테이블 컴포넌트
export const LicenseTable: React.FC<LicenseTableProps> = ({
  licenses,
  loading = false,
  onUpdate,
  onDelete,
  onRefresh,
  onExport,
  onSelectionChange,
}) => {
  // 🔄 상태 관리
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // 편집/삭제 다이얼로그 상태
  const [editingLicense, setEditingLicense] = useState<LicenseRecord | null>(
    null
  );
  const [deletingLicense, setDeletingLicense] = useState<LicenseRecord | null>(
    null
  );
  const [editForm, setEditForm] = useState<EditForm>({});

  // 🏗️ 컬럼 정의
  const columns: ColumnDef<LicenseRecord>[] = useMemo(
    () => [
      // 선택 체크박스
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={(e) => table.toggleAllRowsSelected(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={(e) => row.toggleSelected(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        ),
        enableSorting: false,
        size: 50,
      },
      // 라이센스 키
      {
        accessorKey: "licenseKey",
        header: "라이센스 키",
        cell: ({ getValue }) => (
          <LicenseKeyCell licenseKey={getValue() as string} />
        ),
        size: 200,
      },
      // 사용자 정보
      {
        accessorKey: "userEmail",
        header: "사용자",
        cell: ({ row }) => <UserInfoCell license={row.original} />,
        size: 200,
      },
      // 제품명
      {
        accessorKey: "productName",
        header: "제품",
        cell: ({ getValue }) => (
          <span className="text-sm font-medium text-gray-900">
            {getValue() as string}
          </span>
        ),
        size: 150,
      },
      // 라이센스 타입
      {
        accessorKey: "licenseType",
        header: "타입",
        cell: ({ getValue }) => (
          <LicenseTypeBadge type={getValue() as string} />
        ),
        size: 120,
      },
      // 상태
      {
        accessorKey: "status",
        header: "상태",
        cell: ({ getValue }) => <StatusBadge status={getValue() as string} />,
        size: 120,
      },
      // 만료일
      {
        accessorKey: "expiryDate",
        header: "만료일",
        cell: ({ getValue }) => (
          <ExpiryDateCell expiryDate={getValue() as string} />
        ),
        size: 140,
      },
      // 활성화 진행률
      {
        id: "activations",
        header: "활성화",
        cell: ({ row }) => <ActivationProgress license={row.original} />,
        enableSorting: false,
        size: 150,
      },
      // 발급일
      {
        accessorKey: "issueDate",
        header: "발급일",
        cell: ({ getValue }) => {
          const date = new Date(getValue() as string);
          return (
            <span className="text-sm text-gray-600">
              {date.toLocaleDateString("ko-KR")}
            </span>
          );
        },
        size: 120,
      },
      // 액션
      {
        id: "actions",
        header: "액션",
        cell: ({ row }) => (
          <ActionDropdown
            license={row.original}
            onEdit={setEditingLicense}
            onDelete={setDeletingLicense}
            onUpdate={onUpdate}
          />
        ),
        enableSorting: false,
        size: 80,
      },
    ],
    [onUpdate]
  );

  // 🏗️ TanStack Table 인스턴스
  const table = useReactTable({
    data: licenses,
    columns,
    getRowId: (row) => row.id,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
      pagination,
    },
    enableRowSelection: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // 선택된 행 변경 시 콜백 호출
  React.useEffect(() => {
    if (onSelectionChange) {
      const selectedRows = table
        .getSelectedRowModel()
        .rows.map((row) => row.original);
      onSelectionChange(selectedRows);
    }
  }, [rowSelection, onSelectionChange, table]);

  // 📝 편집/삭제 핸들러
  const handleSaveEdit = async () => {
    if (editingLicense && onUpdate) {
      const success = await onUpdate(editingLicense.id, editForm);
      if (success) {
        setEditingLicense(null);
        setEditForm({});
      }
    }
  };

  const handleDelete = async () => {
    if (deletingLicense && onDelete) {
      const success = await onDelete(deletingLicense.id);
      if (success) {
        setDeletingLicense(null);
      }
    }
  };


  const selectedRowCount = Object.keys(rowSelection).length;

  return (
    <>
      {/* 📋 헤더 & 툴바 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">라이센스 관리</h2>
            <p className="text-gray-600 mt-1">
              총 {licenses.length}개의 라이센스
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* 전역 검색 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="라이센스 키, 이메일, 제품명으로 검색..."
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            {/* 액션 버튼들 */}
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              라이센스 추가
            </Button>

            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={loading}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                새로고침
              </Button>
            )}

            {onExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="w-4 h-4 mr-2" />
                내보내기
              </Button>
            )}
          </div>
        </div>

        {/* 📊 선택된 항목 정보 */}
        {selectedRowCount > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {selectedRowCount}개 항목 선택됨
              </Badge>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => table.resetRowSelection()}
                >
                  선택 해제
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 🗂️ 메인 테이블 */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto" style={{ maxHeight: "600px" }}>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                        style={{
                          width:
                            header.getSize() !== 150
                              ? header.getSize()
                              : undefined,
                        }}
                      >
                        {header.isPlaceholder ? null : (
                          <div className="flex items-center space-x-2">
                            {header.column.getCanSort() ? (
                              <button
                                onClick={header.column.getToggleSortingHandler()}
                                className="flex items-center space-x-1 hover:text-gray-900 transition-colors group"
                              >
                                <span>
                                  {flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                                </span>
                                {{
                                  asc: <ChevronUp className="w-4 h-4" />,
                                  desc: <ChevronDown className="w-4 h-4" />,
                                }[header.column.getIsSorted() as string] ?? (
                                  <ArrowUpDown className="w-4 h-4 opacity-0 group-hover:opacity-50" />
                                )}
                              </button>
                            ) : (
                              flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )
                            )}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-6 py-12 text-center"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        <span className="text-gray-600">
                          데이터를 불러오는 중...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      표시할 라이센스가 없습니다
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        row.getIsSelected() ? "bg-blue-50" : ""
                      }`}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3 text-sm">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 📄 페이지네이션 */}
          {!loading && table.getRowModel().rows.length > 0 && (
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">
                    {table.getRowModel().rows.length > 0 ? (
                      <>
                        {table.getState().pagination.pageIndex *
                          table.getState().pagination.pageSize +
                          1}
                        -
                        {Math.min(
                          (table.getState().pagination.pageIndex + 1) *
                            table.getState().pagination.pageSize,
                          table.getFilteredRowModel().rows.length
                        )}{" "}
                        / {table.getFilteredRowModel().rows.length}개
                      </>
                    ) : (
                      "결과 없음"
                    )}
                  </div>

                  <select
                    value={table.getState().pagination.pageSize}
                    onChange={(e) => table.setPageSize(Number(e.target.value))}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    {[5, 10, 20, 50].map((size) => (
                      <option key={size} value={size}>
                        {size}개씩 보기
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  <span className="text-sm px-3 py-1">
                    페이지 {table.getState().pagination.pageIndex + 1} /{" "}
                    {table.getPageCount()}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 📝 편집 다이얼로그 */}
      <Dialog
        open={!!editingLicense}
        onOpenChange={() => setEditingLicense(null)}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Edit className="w-5 h-5 mr-2 text-blue-600" />
              라이센스 편집
            </DialogTitle>
            <DialogDescription>
              라이센스 정보를 수정할 수 있습니다. 변경사항은 즉시 적용됩니다.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right font-medium">
                사용자 이메일
              </Label>
              <Input
                id="edit-email"
                value={editForm.userEmail || ""}
                onChange={(e) =>
                  setEditForm((prev: EditForm) => ({
                    ...prev,
                    userEmail: e.target.value,
                  }))
                }
                className="col-span-3"
                placeholder="user@example.com"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-product" className="text-right font-medium">
                제품명
              </Label>
              <Input
                id="edit-product"
                value={editForm.productName || ""}
                onChange={(e) =>
                  setEditForm((prev: EditForm) => ({
                    ...prev,
                    productName: e.target.value,
                  }))
                }
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-expiry" className="text-right font-medium">
                만료일
              </Label>
              <Input
                id="edit-expiry"
                type="date"
                value={editForm.expiryDate || ""}
                onChange={(e) =>
                  setEditForm((prev: EditForm) => ({
                    ...prev,
                    expiryDate: e.target.value,
                  }))
                }
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label
                htmlFor="edit-max-activations"
                className="text-right font-medium"
              >
                최대 활성화
              </Label>
              <Input
                id="edit-max-activations"
                type="number"
                min="1"
                value={editForm.maxActivations || ""}
                onChange={(e) =>
                  setEditForm((prev: EditForm) => ({
                    ...prev,
                    maxActivations: parseInt(e.target.value) || 1,
                  }))
                }
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-status" className="text-right font-medium">
                상태
              </Label>
              <select
                id="edit-status"
                value={editForm.status || ""}
                onChange={(e) =>
                  setEditForm((prev: EditForm) => ({ ...prev, status: e.target.value as "active" | "expired" | "revoked" | "suspended" }))
                }
                className="col-span-3 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">활성</option>
                <option value="suspended">일시정지</option>
                <option value="revoked">해지</option>
                <option value="expired">만료</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingLicense(null)}>
              취소
            </Button>
            <Button
              onClick={handleSaveEdit}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🗑️ 삭제 확인 다이얼로그 */}
      <Dialog
        open={!!deletingLicense}
        onOpenChange={() => setDeletingLicense(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <Trash2 className="w-5 h-5 mr-2" />
              라이센스 삭제
            </DialogTitle>
            <DialogDescription>
              정말로 이 라이센스를 삭제하시겠습니까? 이 작업은 되돌릴 수
              없습니다.
            </DialogDescription>
          </DialogHeader>

          {deletingLicense && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm space-y-2">
                <div className="flex items-center">
                  <strong className="text-gray-700 w-20">라이센스:</strong>
                  <code className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                    {deletingLicense.licenseKey}
                  </code>
                </div>
                <div className="flex items-center">
                  <strong className="text-gray-700 w-20">사용자:</strong>
                  <span className="text-gray-900">
                    {deletingLicense.userEmail}
                  </span>
                </div>
                <div className="flex items-center">
                  <strong className="text-gray-700 w-20">제품:</strong>
                  <span className="text-gray-900">
                    {deletingLicense.productName}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingLicense(null)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// 📝 사용 예시
const sampleLicenses: LicenseRecord[] = [
  {
    id: "1",
    licenseKey: "LIC-ABCD-1234-EFGH",
    userEmail: "john.doe@example.com",
    phoneNumber: "010-1234-5678",
    productName: "Pro License",
    licenseType: "admin",
    status: "active",
    issueDate: "2024-01-15",
    expiryDate: "2025-01-15",
    activationCount: 2,
    maxActivations: 5,
    lastUsed: "2024-12-01",
  },
  {
    id: "2",
    licenseKey: "LIC-WXYZ-5678-IJKL",
    userEmail: "jane.smith@company.com",
    productName: "Standard License",
    licenseType: "user",
    status: "suspended",
    issueDate: "2024-03-20",
    expiryDate: "2024-12-20",
    activationCount: 1,
    maxActivations: 3,
    lastUsed: "2024-11-15",
  },
  {
    id: "3",
    licenseKey: "LIC-MNOP-9012-QRST",
    userEmail: "bob.wilson@startup.io",
    phoneNumber: "010-9876-5432",
    productName: "Enterprise License",
    licenseType: "user",
    status: "expired",
    issueDate: "2023-06-10",
    expiryDate: "2024-06-10",
    activationCount: 5,
    maxActivations: 5,
    lastUsed: "2024-06-05",
  },
  {
    id: "4",
    licenseKey: "LIC-UVWX-3456-YZAB",
    userEmail: "alice.brown@tech.co",
    productName: "Trial License",
    licenseType: "user",
    status: "active",
    issueDate: "2024-11-01",
    expiryDate: "2024-12-01",
    activationCount: 0,
    maxActivations: 1,
  },
  {
    id: "5",
    licenseKey: "LIC-CDEF-7890-GHIJ",
    userEmail: "mike.johnson@corp.com",
    productName: "Enterprise License",
    licenseType: "admin",
    status: "revoked",
    issueDate: "2024-02-15",
    expiryDate: "2025-02-15",
    activationCount: 3,
    maxActivations: 10,
  },
];

export default function LicenseTableDemo() {
  const [selectedLicenses, setSelectedLicenses] = useState<LicenseRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (licenseId: string, data: any) => {
    console.log("Updating license:", licenseId, data);
    // 실제로는 API 호출
    return true;
  };

  const handleDelete = async (licenseId: string) => {
    console.log("Deleting license:", licenseId);
    // 실제로는 API 호출
    return true;
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  const handleExport = () => {
    const csv = [
      [
        "라이센스 키",
        "사용자 이메일",
        "제품명",
        "타입",
        "상태",
        "발급일",
        "만료일",
        "활성화",
      ],
      ...sampleLicenses.map((license) => [
        license.licenseKey,
        license.userEmail,
        license.productName,
        license.licenseType === "admin" ? "관리자" : "일반",
        license.status,
        license.issueDate,
        license.expiryDate,
        `${license.activationCount}/${license.maxActivations}`,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "licenses.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <LicenseTable
        licenses={sampleLicenses}
        loading={loading}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onRefresh={handleRefresh}
        onExport={handleExport}
        onSelectionChange={setSelectedLicenses}
      />

      {/* 선택된 라이센스 정보 표시 */}
      {selectedLicenses.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">선택된 라이센스:</h3>
          <div className="text-sm text-blue-700">
            {selectedLicenses.map((license) => license.licenseKey).join(", ")}
          </div>
        </div>
      )}
    </div>
  );
}
