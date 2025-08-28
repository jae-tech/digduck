import React, { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ChevronUp,
  ChevronDown,
  Search,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  MoreHorizontal,
  Loader2,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";

// 🎯 타입 정의
interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  title?: string;
  subtitle?: string;
  loading?: boolean;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enablePagination?: boolean;
  enableRowSelection?: boolean;
  getRowId?: (row: TData) => string;
  onRowSelectionChange?: (selectedRows: TData[]) => void;
  searchPlaceholder?: string;
  pageSizeOptions?: number[];
  className?: string;
  maxHeight?: string;
  onRefresh?: () => void;
  onExport?: () => void;
  toolbarActions?: React.ReactNode;
  initialPageSize?: number;
}

// 📊 메인 DataTable 컴포넌트
export function DataTable<TData>({
  data,
  columns,
  title,
  subtitle,
  loading = false,
  enableSorting = true,
  enableFiltering = true,
  enablePagination = true,
  enableRowSelection = false,
  getRowId,
  onRowSelectionChange,
  searchPlaceholder = "검색...",
  pageSizeOptions = [10, 20, 30, 40, 50],
  className = "",
  maxHeight = "600px",
  onRefresh,
  onExport,
  toolbarActions,
  initialPageSize = 10,
}: DataTableProps<TData>) {
  // 🔄 상태 관리
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  // 🏗️ TanStack Table 인스턴스
  const table = useReactTable({
    data,
    columns,
    getRowId,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      rowSelection,
      pagination,
    },
    enableRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    getPaginationRowModel: enablePagination
      ? getPaginationRowModel()
      : undefined,
  });

  // 🎛️ 이벤트 핸들러
  const handleRowSelectionChange = (selectedRows: TData[]) => {
    onRowSelectionChange?.(selectedRows);
  };

  // 선택된 행이 변경될 때마다 콜백 호출
  React.useEffect(() => {
    if (onRowSelectionChange) {
      const selectedRows = table
        .getSelectedRowModel()
        .rows.map((row) => row.original);
      handleRowSelectionChange(selectedRows);
    }
  }, [rowSelection, onRowSelectionChange, table]);

  const selectedRowCount = Object.keys(rowSelection).length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 📋 헤더 & 툴바 */}
      <div className="flex items-center justify-between">
        <div>
          {title && (
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          )}
          {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
        </div>

        <div className="flex items-center space-x-3">
          {/* 전역 검색 */}
          {enableFiltering && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={searchPlaceholder}
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          )}

          {/* 커스텀 액션 */}
          {toolbarActions}

          {/* 기본 액션들 */}
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
      {enableRowSelection && selectedRowCount > 0 && (
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
        <div className="overflow-x-auto" style={{ maxHeight }}>
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider bg-gray-50 dark:bg-gray-800 dark:text-gray-300"
                      style={{
                        width:
                          header.getSize() !== 150
                            ? header.getSize()
                            : undefined,
                      }}
                    >
                      {header.isPlaceholder ? null : (
                        <div className="flex items-center space-x-2">
                          {enableSorting && header.column.getCanSort() ? (
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

            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td
                    colSpan={table.getHeaderGroups()[0]?.headers.length}
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
                    colSpan={table.getHeaderGroups()[0]?.headers.length}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    표시할 데이터가 없습니다
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      row.getIsSelected() ? "bg-blue-50 dark:bg-blue-900/20" : ""
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 text-sm dark:text-gray-300">
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
        {enablePagination &&
          !loading &&
          table.getRowModel().rows.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600 dark:text-gray-300">
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
                    className="text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded px-2 py-1"
                  >
                    {pageSizeOptions.map((size) => (
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

                  <span className="text-sm px-3 py-1 dark:text-gray-300">
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
  );
}

// 🎨 재사용 가능한 셀 컴포넌트들
export const StatusBadge = ({
  status,
  type = "general",
}: {
  status: string;
  type?: string;
}) => {
  const configs: Record<string, Record<string, any>> = {
    general: {
      active: {
        text: "활성",
        icon: CheckCircle,
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      },
      inactive: {
        text: "비활성",
        icon: XCircle,
        className: "bg-gray-50 text-gray-700 border-gray-200",
      },
      pending: {
        text: "대기중",
        icon: Clock,
        className: "bg-amber-50 text-amber-700 border-amber-200",
      },
    },
    license: {
      active: {
        text: "활성",
        icon: CheckCircle,
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      },
      expired: {
        text: "만료",
        icon: Clock,
        className: "bg-gray-50 text-gray-700 border-gray-200",
      },
      revoked: {
        text: "해지",
        icon: XCircle,
        className: "bg-red-50 text-red-700 border-red-200",
      },
      suspended: {
        text: "일시정지",
        icon: AlertTriangle,
        className: "bg-amber-50 text-amber-700 border-amber-200",
      },
    },
  };

  const config = configs[type]?.[status] || configs.general.active;
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={`${config.className} px-2 py-1 font-medium`}
    >
      <Icon className="w-3 h-3 mr-1" />
      {config.text}
    </Badge>
  );
};

export const ActionDropdown = ({
  onView,
  onEdit,
  onDelete,
}: {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 w-8 p-0"
      >
        <MoreHorizontal className="w-4 h-4" />
      </Button>

      {isOpen && (
        <>
          <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="py-1">
              {onView && (
                <button
                  onClick={() => {
                    onView();
                    setIsOpen(false);
                  }}
                  className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <Eye className="w-4 h-4 mr-2 text-gray-600" />
                  보기
                </button>
              )}
              {onEdit && (
                <button
                  onClick={() => {
                    onEdit();
                    setIsOpen(false);
                  }}
                  className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <Edit className="w-4 h-4 mr-2 text-blue-600" />
                  편집
                </button>
              )}
              {onDelete && (
                <>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    onClick={() => {
                      onDelete();
                      setIsOpen(false);
                    }}
                    className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-50 text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    삭제
                  </button>
                </>
              )}
            </div>
          </div>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
        </>
      )}
    </div>
  );
};
