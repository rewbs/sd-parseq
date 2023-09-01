import { AgGridReact } from 'ag-grid-react';
import _ from 'lodash';
import { all, create } from 'mathjs';
import { forwardRef, useCallback, useMemo } from 'react';
import { frameToXAxisType, xAxisTypeToFrame } from '../utils/maths';
import { fieldNametoRGBa } from '../utils/utils';
import { GridTooltip } from './GridToolTip';
import { ValueParserParams, ValueSetterParams } from 'ag-grid-community';
import { experimental_extendTheme as extendTheme, useColorScheme } from "@mui/material/styles";
import { themeFactory } from "../theme";

const config = {}
const mathjs = create(all, config)


type RangeSelection = {
  anchor?: { x: number; y: number; };
  tip?: { x: number; y: number; };
}

type ParseqGridProps = {
  onCellValueChanged: () => void,
  onCellKeyPress: () => void,
  onGridReady: () => void,
  onFirstDataRendered: () => void,
  onChangeGridCursorPosition: (frame: number) => void,
  onSelectRange: (range: RangeSelection) => void,
  rangeSelection: RangeSelection,
  showCursors: boolean,
  keyframeLock: 'frames' | 'beats' | 'seconds',
  fps: number,
  bpm: number,
  managedFields: string[],
  agGridProps: {}
  agGridStyle: {}

};

export const ParseqGrid = forwardRef(({ rangeSelection, onSelectRange, onGridReady, onCellValueChanged, onCellKeyPress, onFirstDataRendered, onChangeGridCursorPosition, showCursors, keyframeLock, fps, bpm, managedFields, agGridProps, agGridStyle }: ParseqGridProps, gridRef) => {

  const theme = extendTheme(themeFactory());
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {colorScheme, setColorScheme }  = useColorScheme();
  

  if (!rangeSelection) {
    rangeSelection = {};
  }

  const navigateToNextCell = useCallback((params: { previousCellPosition: any; nextCellPosition: any; api: { getDisplayedRowAtIndex: (arg0: any) => any; }; event: { shiftKey: any; }; }) => {
    const previousCell = params.previousCellPosition, nextCell = params.nextCellPosition;
    if (!nextCell || nextCell.rowIndex < 0) {
      return;
    }

    // Update and broadcast the cursor position
    // TODO: showCursors doesn't need to be a prop, it could be local
    // to the parent (this isn't perf sensitive so we could call the callback unconditionally)
    if (showCursors) {
      const nextRow = params.api.getDisplayedRowAtIndex(nextCell.rowIndex);
      if (nextRow && nextRow.data && !isNaN(nextRow.data.frame)) {
        onChangeGridCursorPosition(nextRow.data.frame);
      }
    }

    // Update and broadcast the range selection
    const newRangeSelection = (params.event.shiftKey) ? {
      anchor: (rangeSelection.anchor) || { x: previousCell.column.instanceId, y: previousCell.rowIndex },
      tip: { x: nextCell.column.instanceId, y: nextCell.rowIndex }
    } : {};
    onSelectRange(newRangeSelection);

    return nextCell;

  }, [onChangeGridCursorPosition, onSelectRange, rangeSelection, showCursors]);

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Grid config & utils - TODO move out into Grid component
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  const isInRangeSelection = useCallback((cell: { rowIndex: number; column: { instanceId: number; }; }) => {
    return rangeSelection
      && rangeSelection.anchor && rangeSelection.tip && cell
      && cell.rowIndex >= Math.min(rangeSelection.anchor.y, rangeSelection.tip.y)
      && cell.rowIndex <= Math.max(rangeSelection.anchor.y, rangeSelection.tip.y)
      && cell.column.instanceId >= Math.min(rangeSelection.anchor.x, rangeSelection.tip.x)
      && cell.column.instanceId <= Math.max(rangeSelection.anchor.x, rangeSelection.tip.x);
  }, [rangeSelection]);

  //@ts-ignore - get cell type
  const isSameCellPosition = (cell1, cell2) => {
    return cell1 && cell2 && cell1.rowIndex === cell2.rowIndex
      && cell1.column.instanceId === cell2.column.instanceId;
  }

  const columnDefs = useMemo(() => {
    return [
      {
        headerName: _.startCase(keyframeLock).slice(0, -1) + (keyframeLock !== 'frames' ? ` (frame)` : ''), // Frame / Second / Beat
        field: 'frame',
        comparator: (valueA: number, valueB: number, nodeA: any, nodeB: any, isDescending: any) => valueA - valueB,
        sort: 'asc',
        valueSetter: (params: ValueParserParams) => {
          var newValue = parseFloat(params.newValue);
          if (newValue && !isNaN(newValue)) {
            const newFrame = Math.round(xAxisTypeToFrame(newValue, keyframeLock, fps, bpm));
            params.data.frame = newFrame;
            return true;
          }
        },
        valueFormatter: (params: { value: any; }) => {
          return frameToXAxisType(params.value, keyframeLock, fps, bpm);
        },
        cellRenderer: (params: { value: any; }) => {
          return frameToXAxisType(params.value, keyframeLock, fps, bpm) + (keyframeLock !== 'frames' ? ` (${params.value})` : '');
        },
        pinned: 'left',
        suppressMovable: true,
        cellEditor: 'agTextCellEditor',
        cellEditorParams: {
          useFormatter: true,
        },
        cellStyle: (params: { api: { getFocusedCell: () => any; }; }) => ({
          borderRight: isSameCellPosition(params, params.api.getFocusedCell()) ? '' : '1px solid ' + theme.vars.palette.gridColSeparatorMinor.main,
        }),
        flex: 1,

      },
      {
        headerName: 'Info',
        field: 'info',
        valueSetter: (params: ValueParserParams) => {
          params.data.info = params.newValue;
          return true;
        },
        cellEditor: 'agLargeTextCellEditor',
        cellEditorPopup: true,
        cellEditorParams: {
          maxLength: 1000,
          rows: 2,
          cols: 50
        },
        pinned: 'left',
        suppressMovable: true,
        cellStyle: (params: any): any => {
          if (isInRangeSelection(params)) {
            return {
              backgroundColor: theme.vars.palette.gridInfoField.dark,
              borderRight: isSameCellPosition(params, params.api.getFocusedCell()) ? '' : '1px solid ' + theme.vars.palette.gridColSeparatorMajor.main
            }
          } else {
            return {
              backgroundColor: theme.vars.palette.gridInfoField.light,
              borderRight: isSameCellPosition(params, params.api.getFocusedCell()) ? '' : '1px solid '+ theme.vars.palette.gridColSeparatorMajor.main
            }
          }
        },
        flex: 2,
      },
      ...(managedFields ? managedFields.flatMap((field: string) => [
        {
          field: field,
          valueSetter: (params: ValueSetterParams) => {
            if (!params.newValue) {
              params.data[field] = '';
              return true;
            }
            try {
              const mathsResult = mathjs.evaluate(''+params.newValue)
              if (!mathjs.isNumber(mathsResult)) {
                console.log(`Value eval did not parse to a number ${params.newValue}: ${mathsResult}`);
                return false;
              } 
              params.data[field] = mathsResult;
              return true;
             } catch (e:any) {
              console.log(`Value eval error when parsing ${params.newValue}: ${e.message}`);
              return false;
            }
          },
          suppressMovable: true,
          cellDataType: 'text',
          cellStyle: (params: any) => {
            if (isInRangeSelection(params)) {
              return {
                backgroundColor: fieldNametoRGBa(field, 0.4),
                borderRight: isSameCellPosition(params, params.api.getFocusedCell()) ? '' : '1px solid ' + theme.vars.palette.gridColSeparatorMinor.main
              }
            } else {
              return {
                backgroundColor: fieldNametoRGBa(field, 0.1),
                borderRight: isSameCellPosition(params, params.api.getFocusedCell()) ? '' : '1px solid ' + theme.vars.palette.gridColSeparatorMinor.main
              }
            }
          },
          //flex: 2,
        },
        {
          headerName: '➟' + field,
          field: field + '_i',
          cellEditor: 'agLargeTextCellEditor',
          cellEditorPopup: true,
          cellEditorParams: {
            maxLength: 1000,
            rows: 2,
            cols: 50
          },
          valueSetter: (params: { data: { [x: string]: any; }; newValue: any; }) => {
            params.data[field + '_i'] = params.newValue;
            return true;
          },
          suppressMovable: true,
          cellStyle: (params: any) => {
            if (isInRangeSelection(params)) {
              return {
                backgroundColor: fieldNametoRGBa(field, 0.4),
                borderRight: isSameCellPosition(params, params.api.getFocusedCell()) ? '' : '1px solid ' + theme.vars.palette.gridColSeparatorMajor.main
              }
            } else {
              return {
                backgroundColor: fieldNametoRGBa(field, 0.1),
                borderRight: isSameCellPosition(params, params.api.getFocusedCell()) ? '' : '1px solid ' + theme.vars.palette.gridColSeparatorMajor.main
              }
            }
          },
          //flex: 3,

        }
      ]) : [])
    ]

  }, [managedFields, isInRangeSelection, keyframeLock, fps, bpm, theme]);

  const defaultColDef = useMemo(() => ({
    editable: true,
    resizable: true,
    tooltipField: 'frame',
    tooltipComponent: GridTooltip,
    tooltipComponentParams: { getBpm: (_: any) => bpm, getFps: (_: any) => fps },
    suppressKeyboardEvent: (params: { event: { ctrlKey: any; key: string; }; }) => {
      return params.event.ctrlKey && (
        params.event.key === 'a'
        || params.event.key === 'd'
        || params.event.key === 'r'
      );
    }
  }), [fps, bpm]);

  
  return <div id='grid-container' className={colorScheme==='dark'?"ag-theme-alpine-dark":"ag-theme-alpine"} style={agGridStyle}>
    {/* @ts-ignore  */}
    <AgGridReact
      {...agGridProps}
      ref={gridRef}
      columnDefs={columnDefs}
      defaultColDef={defaultColDef}
      onCellValueChanged={onCellValueChanged}
      onCellKeyPress={onCellKeyPress}
      onGridReady={onGridReady}
      onFirstDataRendered={onFirstDataRendered}
      animateRows={true}
      columnHoverHighlight={true}
      enableCellChangeFlash={true}
      tooltipShowDelay={0}
      navigateToNextCell={navigateToNextCell}
      suppressColumnVirtualisation={process.env?.NODE_ENV === "test"}
      suppressRowVirtualisation={process.env?.NODE_ENV === "test"}
      onCellKeyDown={(e: any) => {
        if (e.event.keyCode === 46 || e.event.keyCode === 8) {
          if (rangeSelection.anchor && rangeSelection.tip) {
            const x1 = Math.min(rangeSelection.anchor.x, rangeSelection.tip.x);
            const x2 = Math.max(rangeSelection.anchor.x, rangeSelection.tip.x);
            const y1 = Math.min(rangeSelection.anchor.y, rangeSelection.tip.y);
            const y2 = Math.max(rangeSelection.anchor.y, rangeSelection.tip.y);
            for (let colInstanceId = x1; colInstanceId <= x2; colInstanceId++) {
              const col = e.columnApi.getAllGridColumns().find((c: any) => c.instanceId === colInstanceId);
              if (col && col.visible && col.colId !== 'frame') {
                for (let rowIndex = y1; rowIndex <= y2; rowIndex++) {
                  e.api.getDisplayedRowAtIndex(rowIndex).setDataValue(col.colId, "");
                }
              }
            }
          }
        }
      }}
      onCellClicked={(e: any) => {
        if (showCursors) {
          onChangeGridCursorPosition(e.data.frame);
        }
        if (e.event.shiftKey) {
          onSelectRange({
            anchor: { x: e.api.getFocusedCell().column.instanceId, y: e.api.getFocusedCell().rowIndex },
            tip: { x: e.column.instanceId, y: e.rowIndex }
          })
        } else {
          onSelectRange({});
        }
      }}
      onCellMouseOver={(e: any) => {
        if (e.event.buttons === 1) {
          onSelectRange({
            anchor: { x: e.api.getFocusedCell().column.instanceId, y: e.api.getFocusedCell().rowIndex },
            tip: { x: e.column.instanceId, y: e.rowIndex }
          })
        }
      }}
    />
  </div>

});
