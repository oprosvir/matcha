import type { ColumnDef } from "@tanstack/react-table";
import type { Table as ReactTable } from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { flexRender } from "@tanstack/react-table";

interface UserDataTableProps<TData> {
  table: ReactTable<TData>;
  columns: ColumnDef<TData, any>[];
  isLoading: boolean;
  hasMore?: boolean;
  isFetchingNextPage?: boolean;
  observerTarget?: React.RefObject<HTMLTableRowElement | null>;
}

export function UserDataTable<TData>({
  table,
  columns,
  isLoading,
  hasMore = false,
  isFetchingNextPage = false,
  observerTarget,
}: UserDataTableProps<TData>) {
  return (
    <div className="bg-card rounded-md border flex-1 overflow-auto min-h-0">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
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
          {table.getRowModel().rows?.length ? (
            <>
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
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
              ))}
              {hasMore && observerTarget && (
                <TableRow ref={observerTarget}>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    {isFetchingNextPage ? (
                      <div className="flex items-center justify-center">
                        <Skeleton className="h-4 w-32" />
                      </div>
                    ) : (
                      <span className="text-muted-foreground">
                        Loading more...
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </>
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                <div className="flex items-center justify-center">
                  {isLoading ? (
                    <Skeleton className="h-4 w-32" />
                  ) : (
                    "No results."
                  )}
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
