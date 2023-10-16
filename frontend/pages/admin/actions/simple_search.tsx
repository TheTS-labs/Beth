import "react-json-view-lite/dist/index.css";

// eslint-disable-next-line import/named
import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useAtom, useAtomValue } from "jotai";
import Link from "next/link";
import React, { FormEvent, useEffect, useState } from "react";
import { darkStyles,JsonView } from "react-json-view-lite";

import { Action } from "../../../../backend/db/models/action";
import { errorsAtom } from "../../../components/common/errors";
import Header from "../../../components/common/header";
import Table from "../../../components/table";
import { atomWithHash } from "../../../lib/common/atomWithHash";
import useAuthToken from "../../../lib/common/token";
import useRequest from "../../../lib/hooks/use_request";
import styles from "../../../public/styles/pages/admin/actions/simple_search.module.sass";
import headerStyles from "../../../public/styles/pages/auth/header.module.sass";

interface Entry {
  value: string
}

interface Event extends FormEvent<HTMLFormElement> {
  target: EventTarget & {
    key: Entry
    operator: Entry
    value: Entry
    perPage: Entry
  }
}

const columns: ColumnDef<Action>[] = [
  {
    accessorKey: "id",
    footer: props => props.column.id,
  },
  {
    id: "userId",
    accessorFn: row => row.userId == -1 ? null : row.userId,
    footer: props => props.column.id,
  },
  {
    accessorKey: "actionType",
    footer: props => props.column.id,
  },
  {
    id: "createdAt",
    accessorFn: row => new Date(row.createdAt).toString(),
    footer: props => props.column.id,
  },
  {
    id: "context",
    header: "context",
    footer: props => props.column.id,
    cell: ({ row }) => <div onClick={(e): void => e.stopPropagation()}>
      <JsonView data={row.original.context} shouldExpandNode={(): false => false} style={darkStyles} />
    </div>
  },
];

export const currentPageAtom = atomWithHash<number>("curPage", 1);
export const keyAtom = atomWithHash<string>("key", "id");
export const operatorAtom = atomWithHash<string | undefined>("op", undefined);
export const valueAtom = atomWithHash<string | undefined>("value", undefined);
export const perPageAtom = atomWithHash<string>("perPage", "10");
export const highlightedRecordAtom = atomWithHash<string | undefined>("hiRec", undefined);

export default function UpdateData(): React.JSX.Element {
  const authToken = useAuthToken();
  const { request, result } = useRequest({ url: "action/simpleSearch", data: {}, errorsAtom });
  const [ defaultRows ] = useState([]);

  const perPage = useAtomValue(perPageAtom);
  const [ currentPage, setCurrentPage ] = useAtom(currentPageAtom);
  const [ key, setKey ] = useAtom(keyAtom);
  const [ operator, setOperator ] = useAtom(operatorAtom);
  const [ value, setValue ] = useAtom(valueAtom);

  const [ proxyKey, setProxyKey ] = useState(key);

  const table = useReactTable({
    data: result?.data || defaultRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  useEffect(() => {
    if (!key || !operator || !value || !authToken.value) {
      return;
    }

    request({ currentPage, perPage, key, operator, value });
  }, [currentPage, perPage, key, operator, value, authToken.value]);

  const onSubmit = (event: Event): void => {
    event.preventDefault();

    setKey(event.target.key.value);
    setOperator(event.target.operator.value);
    setValue(event.target.value.value);
    setCurrentPage(1);
  };

  return <>
    <Header>
      <div className={headerStyles.back}>
        <Link href="/">
          <button>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14" >
              <g id="return-2--arrow-return-enter-keyboard">
                <path 
                  id="Vector" 
                  stroke="#3e3e3e" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M.5 9.5h9a4 4 0 1 0 0-8h-3" 
                />
                <path
                  id="Vector_2"
                  stroke="#3e3e3e"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m3.5 6.5-3 3 3 3"
                />
              </g>
            </svg>
          </button>
        </Link>
      </div>
    </Header>

    <br />

    <form className={styles.form} onSubmit={onSubmit}>
      <select name="key" value={proxyKey} onChange={(e): void => setProxyKey(e.target.value)} required>
        <option value="id">id</option>
        <option value="userId">userId</option>
        <option value="actionType">actionType</option>
        <option value="createdAt">createdAt</option>
        <option value="context">context</option>
      </select>
      <input type="text" name="operator" id="operator" placeholder="Operator" defaultValue={operator} required />
      <input type="text" name="value" id="value" placeholder="Value" defaultValue={value} required />
      <input type="submit" value="Fetch" />
    </form>

    <br />

    <Table
      table={table}
      pagination={result?.pagination}
      perPageAtom={perPageAtom}
      currentPageAtom={currentPageAtom}
      highlightedRecordAtom={highlightedRecordAtom}
    />
  </>;
}