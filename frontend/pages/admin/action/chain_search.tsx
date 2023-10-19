import "react-json-view-lite/dist/index.css";

// eslint-disable-next-line import/named
import { ColumnDef, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useAtom, useAtomValue } from "jotai";
import Link from "next/link";
import React, { FormEvent, useEffect, useState } from "react";
import { darkStyles,JsonView } from "react-json-view-lite";

import { Action } from "../../../../backend/db/models/action";
import { Where } from "../../../../backend/endpoints/action/types";
import { errorsAtom } from "../../../components/common/errors";
import Header from "../../../components/common/header";
import Table from "../../../components/table";
import { atomWithHash } from "../../../lib/atomWithHash";
import useAuthToken from "../../../lib/hooks/use_auth_token";
import useRequest from "../../../lib/hooks/use_request";
import styles from "../../../public/styles/pages/admin/actions/chain_search.module.sass";
import headerStyles from "../../../public/styles/pages/auth/header.module.sass";

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

const defaultChain: Where = {
  type: "AND",
  clause: "where",
  key: "id",
  operator: "",
  value: ""
};

export const currentPageAtom = atomWithHash<number>("curPage", 1);

export const perPageAtom = atomWithHash<string>("perPage", "10");
export const chainsAtom = atomWithHash<Where[]>("chains", [defaultChain]);
export const highlightedRecordAtom = atomWithHash<string | undefined>("hiRec", undefined);

export default function ChainSearch(): React.JSX.Element {
  const authToken = useAuthToken();
  const [ chains, setChains ] = useAtom(chainsAtom);
  const perPage = useAtomValue(perPageAtom);
  const [ currentPage, setCurrentPage ] = useAtom(currentPageAtom);

  const [ defaultRows ] = useState([]);
  const [ isClient, setIsClient ] = useState(false);

  const { request, result } = useRequest({
    url: "action/chainWhereSearch",
    data: {
      chain: chains,
      perPage,
      currentPage
    },
    errorsAtom
  });

  useEffect(() => setIsClient(true), []);

  useEffect(() => {
    if (chains[0].value != "" && authToken?.value) {
      request();
    }
  }, [authToken?.value]);

  const table = useReactTable({
    data: result?.data || defaultRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const onChange = (key: keyof Where, index: number) => {
    return (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => setChains(prev => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      prev[index][key] = e.target.value;

      return prev;
    });
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setCurrentPage(1);
    request();
  };

  const chainElements: React.JSX.Element[] = [];

  if (isClient) {
    chainElements.push(...chains.map((chain, i) => <div className={styles.chain} key={i}>
      <select name="type" value={chain.type} onChange={onChange("type", i)} required>
        <option value="AND">AND</option>
        <option value="OR">OR</option>
      </select>
      <select name="clause" value={chain.clause} onChange={onChange("clause", i)} required>
        <option value="where">where</option>
        <option value="whereNot">whereNot</option>
      </select>
      <select name="key" value={chain.key} onChange={onChange("key", i)} required>
        <option value="id">id</option>
        <option value="userId">userId</option>
        <option value="actionType">actionType</option>
        <option value="createdAt">createdAt</option>
        <option value="context">context</option>
      </select>
      <input
        type="text"
        name="operator"
        id="operator"
        placeholder="Operator"
        value={chain.operator}
        onChange={onChange("operator", i)}
        required
      />
      <input
        type="text"
        name="value"
        id="value"
        placeholder="Value"
        value={chain.value}
        onChange={onChange("value", i)}
        required
      />

      <button type="button" onClick={(): void => setChains(prev => [...prev, defaultChain])}>+</button>
      { i != 0 &&
        <button type="button" onClick={(): void => setChains(prev => [...prev.slice(0, i), ...prev.slice(i + 1)])}>
          -
        </button>
      }
    </div>));
  }

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
      <div className={styles.chains}>
        {...chainElements}
      </div>
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