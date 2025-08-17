import React, { useImperativeHandle, useRef } from "react";
import { AgGridReact, type AgGridReactProps } from "ag-grid-react";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
} from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);

export type AgGridTableRef = {
  api: any;
  columnApi: any;
};

export type AgGridTableProps = AgGridReactProps & {
  height?: number | string;
};

const theme = themeQuartz.withParams({
  browserColorScheme: "light",
  headerFontSize: 14,
});

const AgGridTable = React.forwardRef<AgGridTableRef, AgGridTableProps>(
  ({ height = 500, ...props }, ref) => {
    const gridRef = useRef<AgGridReact>(null);

    useImperativeHandle(ref, () => ({
      api: gridRef.current?.api,
      columnApi: gridRef.current?.columnApi,
    }));

    return (
      <div
        style={{ height: typeof height === "number" ? `${height}px` : height }}
      >
        <AgGridReact ref={gridRef} theme={theme} {...props} />
      </div>
    );
  }
);

AgGridTable.displayName = "AgGridTable";
export default AgGridTable;
