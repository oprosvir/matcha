import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  type ColumnFiltersState,
  useReactTable,
  getSortedRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { DataTableFacetedFilter } from "@/components/ui/data-table-faceted-filter";
import { DataTableRangeFilter } from "@/components/ui/data-table-faceted-range-filter";
import { useInterests } from "@/hooks/useInterests";
import type { Interest } from "@/types/user";
import { Skeleton } from "@/components/ui/skeleton";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

const locations = [
  { label: "New York", value: "new-york" },
  { label: "Los Angeles", value: "los-angeles" },
  { label: "Chicago", value: "chicago" },
  { label: "Houston", value: "houston" },
  { label: "Miami", value: "miami" },
];

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [activeTab, setActiveTab] = useState<string>("browse-all");
  const [isFiltered, setIsFiltered] = useState(false);
  const { data: interests, isLoading: isInterestsLoading } = useInterests();

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      columnFilters,
    },
  });

  useEffect(() => {
    setIsFiltered(columnFilters.length > 0);
  }, [columnFilters]);

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6 pt-2"
    >
      <div className="flex items-center justify-between">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="browse-all">Browse all</SelectItem>
            <SelectItem value="suggested">Suggested</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="browse-all">Browse all</TabsTrigger>
          <TabsTrigger value="suggested">Suggested</TabsTrigger>
        </TabsList>
      </div>
      {/* Filters row */}
      {!isInterestsLoading && interests ? (
        <div className="flex row gap-2">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search by first name..."
              value={
                (table.getColumn("firstName")?.getFilterValue() as string) ?? ""
              }
              onChange={(event) =>
                table.getColumn("firstName")?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
            {table.getColumn("age") && (
              <DataTableRangeFilter
                column={table.getColumn("age")}
                title="Age range"
                min={18}
                max={99}
              />
            )}
            {table.getColumn("fameRating") && (
              <DataTableRangeFilter
                column={table.getColumn("fameRating")}
                title="Fame rating range"
                min={0}
                max={100}
              />
            )}
            {table.getColumn("location") && (
              <DataTableFacetedFilter
                column={table.getColumn("location")}
                title="Location"
                options={locations}
              />
            )}
            {table.getColumn("interests") && (
              <DataTableFacetedFilter
                column={table.getColumn("interests")}
                title="Interests"
                options={interests.map((interest: Interest) => ({
                  label: interest.name,
                  value: interest.name,
                }))}
              />
            )}
            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => table.resetColumnFilters()}
              >
                Reset
                <X />
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-full" />
        </div>
      )}
      <TabsContent value="browse-all">
        <div className="overflow-hidden rounded-md border">
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
                table.getRowModel().rows.map((row) => (
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
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>
      <TabsContent value="suggested">
        <div>
          <h1>Suggested</h1>
        </div>
      </TabsContent>
    </Tabs>
  );
}
