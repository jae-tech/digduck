import React, { useImperativeHandle, useRef } from "react";
import { AgGridReact, type AgGridReactProps } from "ag-grid-react";

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

// to use myTheme in an application, pass it to the theme grid option
const theme = themeQuartz.withParams({
  browserColorScheme: "light",
  headerFontSize: 12,
});

const AgGridTable = React.forwardRef<AgGridTableRef, AgGridTableProps>(
  ({ height = 500, ...props }, ref) => {
    const gridRef = useRef<AgGridReact>(null);

    useImperativeHandle(ref, () => ({
      api: gridRef.current?.api,
      columnApi: gridRef.current?.columnApi,
    }));

    const defaultColDef = {
      sortable: true,
      filter: true,
      resizable: true,
      flex: 1,
    };

    return (
      <div
        style={{ height: typeof height === "number" ? `${height}px` : height }}
      >
        <AgGridReact
          ref={gridRef}
          theme={theme}
          defaultColDef={defaultColDef}
          {...props}
        />
      </div>
    );
  }
);

AgGridTable.displayName = "AgGridTable";
export default AgGridTable;
