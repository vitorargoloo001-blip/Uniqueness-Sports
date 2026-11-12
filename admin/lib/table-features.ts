import {
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  createFilteredRowModel,
  createSortedRowModel,
  createPaginatedRowModel,
  filterFn_includesString,
  sortFn_alphanumeric,
  tableFeatures,
} from "@tanstack/react-table";

/**
 * TanStack Table v9 registra features explicitamente (breaking change vs a
 * v8 mais conhecida) — ver node_modules/@tanstack/react-table/skills/migrate-v8-to-v9.
 * Um único conjunto de features, reaproveitado por todas as tabelas do
 * admin (produtos, pedidos, clientes, etc).
 */
export const tableFeatureSet = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  filterFns: { includesString: filterFn_includesString },
  sortFns: { alphanumeric: sortFn_alphanumeric },
});
