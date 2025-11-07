import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type SortingState,
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
import { useEffect, useState, useRef } from "react";
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
import { Search } from "lucide-react";
import {
  DataTableFacetedFilter,
  type DataTableFacetedFilterRef,
} from "@/components/ui/data-table-faceted-filter";
import {
  DataTableRangeFilter,
  type DataTableRangeFilterRef,
} from "@/components/ui/data-table-faceted-range-filter";
import { useInterests } from "@/hooks/useInterests";
import type { Interest } from "@/types/user";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocationList } from "@/hooks/useLocationList";
import { type Filters } from "@/hooks/useUsers";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  hasMore?: boolean;
  fetchNextPage?: () => void;
  isFetchingNextPage?: boolean;
  setFilters: (filters: Filters) => void;
  filters?: Filters;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  hasMore = false,
  fetchNextPage,
  isFetchingNextPage = false,
  filters,
  setFilters,
}: DataTableProps<TData, TValue>) {
  const { data: interests, isLoading: isInterestsLoading } = useInterests();
  const { data: locations, isLoading: isLocationsLoading } = useLocationList();
  const firstNameInputRef = useRef<HTMLInputElement>(null);
  const ageRangeRef = useRef<DataTableRangeFilterRef>(null);
  const fameRangeRef = useRef<DataTableRangeFilterRef>(null);
  const locationFilterRef = useRef<DataTableFacetedFilterRef>(null);
  const interestsFilterRef = useRef<DataTableFacetedFilterRef>(null);

  const [activeTab, setActiveTab] = useState<string>("browse-all");

  const [localSorting, setLocalSorting] = useState<SortingState>(() => {
    if (filters?.sort) {
      return [
        {
          id: filters.sort.sortBy,
          desc: filters.sort.sortOrder === "desc",
        },
      ];
    }
    return [];
  });

  useEffect(() => {
    if (filters?.sort) {
      setLocalSorting([
        {
          id: filters.sort.sortBy,
          desc: filters.sort.sortOrder === "desc",
        },
      ]);
    } else {
      setLocalSorting([]);
    }
  }, [filters?.sort]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    state: {
      sorting: localSorting,
    },
    onSortingChange: (updater) => {
      const newSorting =
        typeof updater === "function" ? updater(localSorting) : updater;
      setLocalSorting(newSorting);
    },
  });

  // Infinite scroll
  const observerTarget = useRef<HTMLTableRowElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !isFetchingNextPage &&
          fetchNextPage
        ) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }
    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isFetchingNextPage, fetchNextPage]);

  const handleSearch = () => {
    const firstName = firstNameInputRef.current?.value?.trim() || undefined;

    const ageRange = ageRangeRef.current?.getValue();
    const minAge = ageRange?.from !== 18 ? ageRange?.from : undefined;
    const maxAge = ageRange?.to !== 99 ? ageRange?.to : undefined;

    const fameRange = fameRangeRef.current?.getValue();
    const minFame = fameRange?.from !== 0 ? fameRange?.from : undefined;
    const maxFame = fameRange?.to !== 100 ? fameRange?.to : undefined;

    const locations = locationFilterRef.current?.getValue() || [];

    const tags = interestsFilterRef.current?.getValue() || [];

    const sortState = localSorting.length > 0 ? localSorting[0] : null;
    const sort = sortState
      ? {
          sortBy: sortState.id as "age" | "fameRating" | "interests",
          sortOrder: (sortState.desc ? "desc" : "asc") as "asc" | "desc",
        }
      : undefined;

    setFilters({
      firstName,
      minAge,
      maxAge,
      minFame,
      maxFame,
      locations,
      tags,
      sort,
    });
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="flex flex-col flex-1 min-h-0"
    >
      <div className="flex items-center justify-between flex-shrink-0">
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
      {!isInterestsLoading && interests && !isLocationsLoading && locations ? (
        <div className="flex items-center gap-2 flex-shrink-0">
          <Input
            placeholder="Search by first name..."
            ref={firstNameInputRef}
            className="max-w-sm"
          />
          <DataTableRangeFilter
            ref={ageRangeRef}
            title="Age range"
            min={18}
            max={99}
            currentFrom={filters?.minAge}
            currentTo={filters?.maxAge}
          />
          <DataTableRangeFilter
            ref={fameRangeRef}
            title="Fame rating range"
            min={0}
            max={100}
            currentFrom={filters?.minFame}
            currentTo={filters?.maxFame}
          />
          <DataTableFacetedFilter
            ref={locationFilterRef}
            title="Location"
            options={(locations || []).map((location) => ({
              label: `${location.cityName}, ${location.countryName}`,
              value: `${location.cityName}, ${location.countryName}`,
            }))}
            selectedValues={filters?.locations || []}
          />
          <DataTableFacetedFilter
            ref={interestsFilterRef}
            title="Interests"
            options={interests.map((interest: Interest) => ({
              label: interest.name,
              value: interest.name,
            }))}
            selectedValues={filters?.tags || []}
          />
          <Button
            size="sm"
            disabled={isLoading}
            className="ml-auto"
            onClick={handleSearch}
          >
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-shrink-0">
          <Skeleton className="h-10 w-full" />
        </div>
      )}
      <TabsContent value="browse-all" className="flex-1 flex flex-col min-h-0">
        <div className="rounded-md border flex-1 overflow-auto min-h-0">
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
                  {hasMore && (
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
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
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
      </TabsContent>
      <TabsContent value="suggested">
        <div>
          <h1>Suggested</h1>
        </div>
      </TabsContent>
    </Tabs>
  );
}
