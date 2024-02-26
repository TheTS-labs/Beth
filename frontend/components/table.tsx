// eslint-disable-next-line import/named
import { flexRender, Table as ReactTable } from "@tanstack/react-table";
import { PrimitiveAtom, useAtom, useSetAtom } from "jotai";
import React from "react";

import styles from "../public/styles/components/table.module.sass";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: ReactTable<any>
  pagination: {
    total: number
    lastPage: number
    prevPage: null
    nextPage: number
    perPage: number
    currentPage: number
    from: number
    to: number
  } | undefined

  perPageAtom: PrimitiveAtom<string>
  currentPageAtom: PrimitiveAtom<number>
  highlightedRecordAtom: PrimitiveAtom<string | undefined>
}

export default function Table(props: Props): React.JSX.Element {
  const [ perPage, setPerPage ] = useAtom(props.perPageAtom);
  const [ highlightedRecord, setHighlightedRecord ] = useAtom(props.highlightedRecordAtom);
  const setCurrentPageAtom = useSetAtom(props.currentPageAtom);

  const validatePageChange = (newValue: number): boolean => {
    if (newValue >= 1 && newValue <= (props.pagination?.lastPage || 1)) {
      return true;
    }

    return false;
  };

  return <>
    <table className={styles.container}>
      <thead>
        {props.table.getHeaderGroups().map(headerGroup => <tr key={headerGroup.id}>
            {headerGroup.headers.map(header => 
              <th key={header.id} colSpan={header.colSpan}>
                {header.isPlaceholder ? null : flexRender(
                  header.column.columnDef.header,
                  header.getContext()
                )}
              </th>
            )}
        </tr>)}
      </thead>

      <tbody>
        {props.table.getRowModel().rows.map(row => <tr
            key={row.id}
            data-highlighted={row.id == highlightedRecord}
            onClick={(): void => setHighlightedRecord(prev => row.id == prev ? "" : row.id)}
          >
            {row.getVisibleCells().map(cell => <td key={cell.id}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>)}
          </tr>
        )}
      </tbody>
    </table>

    <div className={styles.pageInfo}>
      <button
        onClick={(): void => setCurrentPageAtom(prev => validatePageChange(prev - 2) ? prev - 2 : prev)}
      >{"<<"}</button>
      <button
        onClick={(): void => setCurrentPageAtom(prev => validatePageChange(prev - 1) ? prev - 1 : prev)}
      >{"<"}</button>
      <button 
        onClick={(): void => setCurrentPageAtom(prev => validatePageChange(prev + 1) ? prev + 1 : prev)}
      >{">"}</button>
      <button 
        onClick={(): void => setCurrentPageAtom(prev => validatePageChange(prev + 2) ? prev + 2 : prev)}
      >{">>"}</button>

      <p>
        Page <b>{props.pagination?.currentPage || "?"} of {props.pagination?.lastPage || "?"}</b>
        {" | Go to page "}
        <input
          type="number"
          min={1}
          max={props.pagination?.lastPage || 1}
          defaultValue={props.pagination?.currentPage || 1}
          onKeyUp={(e): void => {
            if (e.key == "Enter") {
              const page = parseInt((e.target as HTMLInputElement).value);
              if (validatePageChange(page)) {
                setCurrentPageAtom(page);
              }
            }
          }}
        />
      </p>

      <p>
        {" | Per page: "}
        <select name="perPage" onChange={(e): void => setPerPage(e.target.value)} value={perPage}>
          <option value="10">10</option>
          <option value="15">15</option>
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
      </p>
    </div>
  </>;
}