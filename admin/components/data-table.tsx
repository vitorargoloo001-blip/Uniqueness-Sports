"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { createColumnHelper, useTable, type ColumnDef } from "@tanstack/react-table";
import { tableFeatureSet } from "@/lib/table-features";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function createColumns<TData extends Record<string, unknown>>() {
  return createColumnHelper<typeof tableFeatureSet, TData>();
}

export function DataTable<TData extends Record<string, unknown>>({
  columns,
  data,
  searchPlaceholder = "Buscar...",
  emptyMessage = "Nenhum resultado encontrado.",
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches ColumnHelper.columns()'s own return type
  columns: ColumnDef<typeof tableFeatureSet, TData, any>[];
  data: TData[];
  searchPlaceholder?: string;
  emptyMessage?: string;
}) {
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useTable({
    features: tableFeatureSet,
    columns,
    data,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });

  const pagination = table.store.state.pagination;
  const rows = table.getRowModel().rows;

  return (
    <div className="space-y-3">
      <div className="relative max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder={searchPlaceholder}
          className="pl-8"
        />
      </div>

      <div className="overflow-x-auto rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                    className={header.column.getCanSort() ? "cursor-pointer select-none" : undefined}
                  >
                    {header.isPlaceholder ? null : (
                      <span className="inline-flex items-center gap-1">
                        <table.FlexRender header={header} />
                        {header.column.getIsSorted() === "asc" && "↑"}
                        {header.column.getIsSorted() === "desc" && "↓"}
                      </span>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Página {pagination.pageIndex + 1} de {Math.max(1, table.getPageCount())} — {rows.length} de {data.length}{" "}
          registro(s)
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="size-4" />
            Anterior
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Próxima
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
