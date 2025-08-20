import React, {
  useImperativeHandle,
  useRef,
  useState,
  useCallback,
} from "react";
import { AgGridReact, type AgGridReactProps } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
  themeBalham,
  themeAlpine,
  type GridReadyEvent,
  type SelectionChangedEvent,
  type GridOptions,
} from "ag-grid-community";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

ModuleRegistry.registerModules([AllCommunityModule]);

export type AgGridTableRef = {
  api: any;
  columnApi: any;
  exportToCsv: () => void;
  clearSelection: () => void;
  selectAll: () => void;
  getSelectedRows: () => any[];
  refreshData: () => void;
};

export type AgGridTableTheme = "quartz" | "balham" | "alpine";

export type AgGridTableProps = AgGridReactProps & {
  height?: number | string;
  title?: string;
  subtitle?: string;
  loading?: boolean;
  error?: string;
  theme?: AgGridTableTheme;
  showToolbar?: boolean;
  showSearch?: boolean;
  showExport?: boolean;
  showRefresh?: boolean;
  showSelection?: boolean;
  onSelectionChanged?: (selectedRows: any[]) => void;
  onRefresh?: () => void;
  onExport?: () => void;
  customActions?: React.ReactNode;
  searchPlaceholder?: string;
};

const getTheme = (themeName: AgGridTableTheme) => {
  const themes = {
    quartz: themeQuartz,
    balham: themeBalham,
    alpine: themeAlpine,
  };

  return themes[themeName].withParams({
    browserColorScheme: "light",
    headerFontSize: 12,
    fontSize: 13,
    foregroundColor: "#374151",
    backgroundColor: "#ffffff",
    headerBackgroundColor: "#f9fafb",
    headerTextColor: "#374151",
    borderColor: "#e5e7eb",
  });
};

const AgGridTable = React.forwardRef<AgGridTableRef, AgGridTableProps>(
  (
    {
      height = 500,
      title,
      subtitle,
      loading = false,
      error,
      theme = "quartz",
      showToolbar = true,
      showSearch = true,
      showExport = true,
      showRefresh = true,
      showSelection = false,
      onSelectionChanged,
      onRefresh,
      onExport,
      customActions,
      searchPlaceholder = "검색...",
      ...props
    },
    ref
  ) => {
    const gridRef = useRef<AgGridReact>(null);
    const [selectedRows, setSelectedRows] = useState<any[]>([]);
    const [quickFilterText, setQuickFilterText] = useState<string>("");

    useImperativeHandle(ref, () => ({
      api: gridRef.current?.api,
      columnApi: gridRef.current?.columnApi,
      exportToCsv: () => {
        gridRef.current?.api?.exportDataAsCsv({
          fileName: `export_${new Date().toISOString().split("T")[0]}.csv`,
        });
      },
      clearSelection: () => {
        gridRef.current?.api?.deselectAll();
      },
      selectAll: () => {
        gridRef.current?.api?.selectAll();
      },
      getSelectedRows: () => {
        return gridRef.current?.api?.getSelectedRows() || [];
      },
      refreshData: () => {
        onRefresh?.();
      },
    }));

    const defaultColDef = {
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
      minWidth: 100,
      ...props.defaultColDef,
    };

    const gridOptions: GridOptions = {
      animateRows: true,
      enableRangeSelection: true,
      suppressMenuHide: true,
      rowSelection: showSelection ? "multiple" : undefined,
      suppressRowClickSelection: !showSelection,
      rowMultiSelectWithClick: showSelection,
      ...props.gridOptions,
    };

    const handleGridReady = useCallback(
      (event: GridReadyEvent) => {
        props.onGridReady?.(event);
      },
      [props]
    );

    const handleSelectionChanged = useCallback(
      (event: SelectionChangedEvent) => {
        const selectedRows = event.api.getSelectedRows();
        setSelectedRows(selectedRows);
        onSelectionChanged?.(selectedRows);
        props.onSelectionChanged?.(event);
      },
      [onSelectionChanged, props]
    );

    const handleExport = () => {
      if (onExport) {
        onExport();
      } else {
        gridRef.current?.api?.exportDataAsCsv({
          fileName: `export_${new Date().toISOString().split("T")[0]}.csv`,
        });
      }
    };

    const handleSearch = (value: string) => {
      setQuickFilterText(value);
      gridRef.current?.api?.setQuickFilter(value);
    };

    if (error) {
      return (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="text-red-500 mb-2">오류가 발생했습니다</div>
              <div className="text-sm text-gray-500">{error}</div>
              {onRefresh && (
                <Button variant="outline" className="mt-4" onClick={onRefresh}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  다시 시도
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        {(title || showToolbar) && (
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                {title && (
                  <CardTitle className="flex items-center">
                    {title}
                    {showSelection && selectedRows.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {selectedRows.length}개 선택됨
                      </Badge>
                    )}
                  </CardTitle>
                )}
                {subtitle && (
                  <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
                )}
              </div>

              {showToolbar && (
                <div className="flex items-center space-x-2">
                  {showSearch && (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder={searchPlaceholder}
                        value={quickFilterText}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-10 w-64"
                        size="sm"
                      />
                    </div>
                  )}

                  {customActions}

                  {showExport && (
                    <Button variant="outline" size="sm" onClick={handleExport}>
                      <Download className="w-4 h-4 mr-2" />
                      내보내기
                    </Button>
                  )}

                  {showRefresh && onRefresh && (
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
                </div>
              )}
            </div>
          </CardHeader>
        )}

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              <span>로딩 중...</span>
            </div>
          ) : (
            <div
              style={{
                height: typeof height === "number" ? `${height}px` : height,
                width: "100%",
              }}
              className="ag-theme-custom"
            >
              <AgGridReact
                ref={gridRef}
                theme={getTheme(theme)}
                defaultColDef={defaultColDef}
                gridOptions={gridOptions}
                onGridReady={handleGridReady}
                onSelectionChanged={handleSelectionChanged}
                quickFilterText={quickFilterText}
                loadingOverlayComponent={() => (
                  <div className="flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                    <span>데이터를 불러오는 중...</span>
                  </div>
                )}
                noRowsOverlayComponent={() => (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="text-gray-500 mb-2">
                      표시할 데이터가 없습니다
                    </div>
                    <div className="text-sm text-gray-400">
                      필터를 조정하거나 데이터를 추가해보세요
                    </div>
                  </div>
                )}
                {...props}
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);

AgGridTable.displayName = "AgGridTable";
export default AgGridTable;
