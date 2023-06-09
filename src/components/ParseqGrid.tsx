import { AgGridReact } from 'ag-grid-react';
import { GridTooltip } from './GridToolTip';
import { forwardRef, useCallback, useMemo } from 'react';
import _ from 'lodash';
import { frameToXAxisType, xAxisTypeToFrame } from '../utils/maths';
import { fieldNametoRGBa } from '../utils/utils';



type RangeSelection = {
    anchor?: { x: number; y: number; };
    tip?: { x: number; y: number; };
}

type ParseqGridProps = {
    onCellValueChanged : () => {},
    onCellKeyPress : () => {},
    onGridReady : () => {},
    onFirstDataRendered : () => {},
    onChangeGridCursorPosition: (frame:number) => {},
    onSelectRange: (range: RangeSelection) => {},
    rangeSelection: RangeSelection,
    showCursors : boolean,
    keyframeLock : 'frames' | 'beats' | 'seconds',
    fps: number,
    bpm: number,
    managedFields: string[],
    
};

export const ParseqGrid = forwardRef(({ rangeSelection, onSelectRange, onGridReady, onCellValueChanged, onCellKeyPress, onFirstDataRendered, onChangeGridCursorPosition, showCursors, keyframeLock, fps, bpm, managedFields }: ParseqGridProps, gridRef) => {


    const navigateToNextCell = useCallback((params: { previousCellPosition: any; nextCellPosition: any; api: { getDisplayedRowAtIndex: (arg0: any) => any; }; event: { shiftKey: any; }; }) => {
        const previousCell = params.previousCellPosition, nextCell = params.nextCellPosition;
        if (!nextCell || nextCell.rowIndex < 0) {
          return;
        }
    
        if (showCursors) {
          const nextRow = params.api.getDisplayedRowAtIndex(nextCell.rowIndex);
          if (nextRow && nextRow.data && !isNaN(nextRow.data.frame)) {
            onChangeGridCursorPosition(nextRow.data.frame);
          }
        }
        if (params.event.shiftKey) {
          if (rangeSelection.anchor === undefined) {
            onSelectRange({
              anchor: { x: previousCell.column.instanceId, y: previousCell.rowIndex },
              tip: { x: nextCell.column.instanceId, y: nextCell.rowIndex }
            })
          } else {
            onSelectRange({
              ...rangeSelection,
              tip: { x: nextCell.column.instanceId, y: nextCell.rowIndex }
            })
          }
        } else {
          onSelectRange({});
        }
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
        valueSetter: (params: { newValue: string; data: { frame: number; }; }) => {
          var newValue = parseFloat(params.newValue);
          if (newValue && !isNaN(newValue)) {
            const newFrame = Math.round(xAxisTypeToFrame(newValue, keyframeLock, fps, bpm));
            params.data.frame = newFrame;
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
        cellEditorParams: {
          useFormatter: true,
        },
        cellStyle: (params: { api: { getFocusedCell: () => any; }; }) => ({
          borderRight: isSameCellPosition(params, params.api.getFocusedCell()) ? '' : '1px solid lightgrey'
        })
      },
      {
        headerName: 'Info',
        field: 'info',
        valueSetter: (params: { data: { info: any; }; newValue: any; }) => {
          params.data.info = params.newValue;
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
        cellStyle: (params: any) : any => {
          if (isInRangeSelection(params)) {
            return {
              backgroundColor: 'lightgrey',
              borderRight: isSameCellPosition(params, params.api.getFocusedCell()) ? '' : '1px solid lightgrey'
            }
          } else {
            return {
              backgroundColor: 'white', 
              borderRight: isSameCellPosition(params, params.api.getFocusedCell()) ? '' : '1px solid lightgrey'
            }
          }
        }        
      },
      ...(managedFields ? managedFields.flatMap((field: string) => [
        {
          field: field,
          valueSetter: (params: { data: { [x: string]: string | number; }; newValue: string; }) => {
            params.data[field] = isNaN(parseFloat(params.newValue)) ? "" : parseFloat(params.newValue);
          },
          suppressMovable: true,
          cellStyle: (params: any) => {
            if (isInRangeSelection(params)) {
              return {
                backgroundColor: fieldNametoRGBa(field, 0.4),
                borderRight: isSameCellPosition(params, params.api.getFocusedCell()) ? '' : '1px solid lightgrey'
              }
            } else {
              return {
                backgroundColor: fieldNametoRGBa(field, 0.1),
                borderRight: isSameCellPosition(params, params.api.getFocusedCell()) ? '' : '1px solid lightgrey'
              }
            }
          }

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
          },
          suppressMovable: true,
          cellStyle: (params: any ) => {
            if (isInRangeSelection(params)) {
              return {
                backgroundColor: fieldNametoRGBa(field, 0.4),
                borderRight: isSameCellPosition(params, params.api.getFocusedCell()) ? '' : '1px solid black'
              }
            } else {
              return {
                backgroundColor: fieldNametoRGBa(field, 0.1),
                borderRight: isSameCellPosition(params, params.api.getFocusedCell()) ? '' : '1px solid black'
              }
            }
          }
        }
      ]) : [])
    ]

  }, [managedFields, isInRangeSelection, keyframeLock, fps, bpm]);

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

  //@ts-ignore
  return <div className="ag-theme-alpine" style={{ width: '100%', minHeight: '150px', maxHeight: '1150px', height: '150px' }}> <AgGridReact
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
    onCellKeyDown={(e : any) => {
      if (e.event.keyCode === 46 || e.event.keyCode === 8) {
        if (rangeSelection.anchor && rangeSelection.tip) {
          const x1 = Math.min(rangeSelection.anchor.x, rangeSelection.tip.x);
          const x2 = Math.max(rangeSelection.anchor.x, rangeSelection.tip.x);
          const y1 = Math.min(rangeSelection.anchor.y, rangeSelection.tip.y);
          const y2 = Math.max(rangeSelection.anchor.y, rangeSelection.tip.y);
          for (let colInstanceId = x1; colInstanceId <= x2; colInstanceId++) {
            const col = e.columnApi.getAllGridColumns().find((c:any) => c.instanceId === colInstanceId);
            if (col && col.visible && col.colId !== 'frame') {
              for (let rowIndex = y1; rowIndex <= y2; rowIndex++) {
                e.api.getDisplayedRowAtIndex(rowIndex).setDataValue(col.colId, "");
              }
            }
          }
        }
      }
    }}
    onCellClicked={(e : any) => {
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
    onCellMouseOver={(e : any) => {
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
