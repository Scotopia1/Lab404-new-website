"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
  RowSelectionState,
} from "@tanstack/react-table";
import { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Trash2,
  Download,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface BulkAction<TData> {
  label: string;
  icon?: React.ReactNode;
  variant?: "default" | "destructive" | "outline";
  onClick: (selectedRows: TData[]) => void;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  isLoading?: boolean;
  // Bulk selection props
  enableSelection?: boolean;
  bulkActions?: BulkAction<TData>[];
  getRowId?: (row: TData) => string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
  pagination,
  onPageChange,
  onLimitChange,
  isLoading,
  enableSelection = false,
  bulkActions = [],
  getRowId,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Memoize pagination to prevent unnecessary re-renders
  const stablePagination = useMemo(() => pagination, [
    pagination?.page,
    pagination?.limit,
    pagination?.total,
    pagination?.totalPages,
  ]);

  // Reset selection when data changes
  useEffect(() => {
    setRowSelection({});
  }, [data]);

  // Add selection column if enabled
  const columnsWithSelection: ColumnDef<TData, TValue>[] = enableSelection
    ? [
        {
          id: "select",
          header: ({ table }) => (
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && "indeterminate")
              }
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(!!value)
              }
              aria-label="Select all"
            />
          ),
          cell: ({ row }) => (
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
          ),
          enableSorting: false,
          enableHiding: false,
          size: 40,
        } as ColumnDef<TData, TValue>,
        ...columns,
      ]
    : columns;

  const table = useReactTable({
    data,
    columns: columnsWithSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: stablePagination ? undefined : getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    enableRowSelection: enableSelection,
    getRowId: getRowId ? (row) => getRowId(row) : undefined,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
    manualPagination: !!stablePagination,
    pageCount: stablePagination?.totalPages ?? -1,
    autoResetPageIndex: false, // Prevent automatic page index reset
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedData = selectedRows.map((row) => row.original);

  return (
    <div className="space-y-4">
      {/* Search and Bulk Actions Bar */}
      <div className="flex items-center justify-between gap-4">
        {/* Search */}
        {searchKey && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={
                (table.getColumn(searchKey)?.getFilterValue() as string) ?? ""
              }
              onChange={(event) =>
                table.getColumn(searchKey)?.setFilterValue(event.target.value)
              }
              className="pl-9"
            />
          </div>
        )}

        {/* Bulk Actions */}
        {enableSelection && selectedRows.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-muted-foreground">
              {selectedRows.length} selected
            </span>

            {/* Primary bulk actions (first 2) */}
            {bulkActions.slice(0, 2).map((action, index) => (
              <Button
                key={index}
                variant={action.variant || "outline"}
                size="sm"
                onClick={() => action.onClick(selectedData)}
              >
                {action.icon}
                <span className="ml-2">{action.label}</span>
              </Button>
            ))}

            {/* More actions dropdown if more than 2 */}
            {bulkActions.length > 2 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="ml-2">More</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {bulkActions.slice(2).map((action, index) => (
                    <DropdownMenuItem
                      key={index}
                      onClick={() => action.onClick(selectedData)}
                      className={
                        action.variant === "destructive"
                          ? "text-destructive focus:text-destructive"
                          : ""
                      }
                    >
                      {action.icon}
                      <span className="ml-2">{action.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRowSelection({})}
            >
              Clear selection
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      style={{
                        width:
                          header.column.columnDef.size !== undefined
                            ? header.column.columnDef.size
                            : undefined,
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columnsWithSelection.length}
                  className="h-24 text-center"
                >
                  <div className="flex items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={row.getIsSelected() ? "bg-muted/50" : ""}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columnsWithSelection.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        {/* Selection count or results count */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {enableSelection && selectedRows.length > 0 ? (
            <span>
              {selectedRows.length} of {stablePagination?.total ?? data.length} row(s)
              selected
            </span>
          ) : stablePagination ? (
            <span>
              Showing {(stablePagination.page - 1) * stablePagination.limit + 1} to{" "}
              {Math.min(stablePagination.page * stablePagination.limit, stablePagination.total)}{" "}
              of {stablePagination.total} results
            </span>
          ) : (
            <span>{data.length} results</span>
          )}
        </div>

        {/* Pagination controls */}
        {stablePagination && (
          <div className="flex items-center gap-2">
            <Select
              value={stablePagination.limit.toString()}
              onValueChange={(value) => onLimitChange?.(parseInt(value))}
            >
              <SelectTrigger className="w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange?.(1)}
                disabled={stablePagination.page <= 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange?.(stablePagination.page - 1)}
                disabled={stablePagination.page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-2 text-sm">
                Page {stablePagination.page} of {stablePagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange?.(stablePagination.page + 1)}
                disabled={stablePagination.page >= stablePagination.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange?.(stablePagination.totalPages)}
                disabled={stablePagination.page >= stablePagination.totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
