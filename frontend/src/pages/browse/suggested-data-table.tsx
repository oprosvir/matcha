import { useMemo, useState, useEffect } from "react";
import { useInterests } from "@/hooks/useInterests";
import { useSuggestedUsers } from "@/hooks/useSuggestedUsers";
import { Input } from "@/components/ui/input";
import { DataTableRangeFilter } from "@/components/ui/data-table-faceted-range-filter";
import { DataTableFacetedFilter } from "@/components/ui/data-table-faceted-filter";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { UserDataTable } from "./user-data-table";
import { createSuggestedColumns } from "./suggested-columns";
import { useNavigate } from "react-router";

export function SuggestedDataTable() {
  const columns = createSuggestedColumns();
  const navigate = useNavigate();
  const [filterValues, setFilterValues] = useState({
    firstName: "",
    minAge: 18,
    maxAge: 99,
    minFame: 0,
    maxFame: 100,
    locations: [] as string[],
    tags: [] as string[],
  });
  const { users, isLoading } = useSuggestedUsers({});
  const { data: interests, isLoading: isInterestsLoading } = useInterests();
  const locationOptions = useMemo(() => {
    const locationMap = new Map<
      string,
      { cityName: string; countryName: string }
    >();
    users.forEach((user) => {
      if (user.cityName && user.countryName) {
        const key = `${user.cityName}, ${user.countryName}`;
        if (!locationMap.has(key)) {
          locationMap.set(key, {
            cityName: user.cityName,
            countryName: user.countryName,
          });
        }
      }
    });
    return Array.from(locationMap.values()).map((location) => ({
      label: `${location.cityName}, ${location.countryName}`,
      value: `${location.cityName}, ${location.countryName}`,
    }));
  }, [users]);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Table with client-side sorting and filtering
  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualSorting: false,
    manualFiltering: false,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
  });

  useEffect(() => {
    const filters: ColumnFiltersState = [];

    if (filterValues.firstName) {
      filters.push({ id: "firstName", value: filterValues.firstName });
    }

    if (filterValues.minAge !== 18 || filterValues.maxAge !== 99) {
      filters.push({
        id: "age",
        value: { min: filterValues.minAge, max: filterValues.maxAge },
      });
    }

    if (filterValues.minFame !== 0 || filterValues.maxFame !== 100) {
      filters.push({
        id: "fameRating",
        value: { min: filterValues.minFame, max: filterValues.maxFame },
      });
    }

    if (filterValues.locations.length > 0) {
      filters.push({ id: "location", value: filterValues.locations });
    }

    if (filterValues.tags.length > 0) {
      filters.push({ id: "interests", value: filterValues.tags });
    }

    setColumnFilters(filters);
  }, [filterValues]);

  const isReady =
    !isLoading &&
    !isInterestsLoading &&
    interests &&
    locationOptions.length >= 0;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Filters row */}
      {isReady ? (
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-2 flex-shrink-0 pb-2">
          <Input
            placeholder="Search by first name..."
            className="max-w-sm w-full xl:w-auto xl:max-w-sm"
            value={filterValues.firstName}
            onChange={(e) => {
              setFilterValues((prev) => ({
                ...prev,
                firstName: e.target.value,
              }));
            }}
          />
          <div className="flex flex-wrap items-center gap-2 xl:flex-1">
            <DataTableRangeFilter
              title="Age range"
              min={18}
              max={99}
              currentFrom={filterValues.minAge}
              currentTo={filterValues.maxAge}
              setFilter={(range) => {
                setFilterValues((prev) => ({
                  ...prev,
                  minAge: range.from,
                  maxAge: range.to,
                }));
              }}
            />
            <DataTableRangeFilter
              title="Fame rating range"
              min={0}
              max={100}
              currentFrom={filterValues.minFame}
              currentTo={filterValues.maxFame}
              setFilter={(range) => {
                setFilterValues((prev) => ({
                  ...prev,
                  minFame: range.from,
                  maxFame: range.to,
                }));
              }}
            />
            <DataTableFacetedFilter
              title="Location"
              options={locationOptions}
              selectedValues={filterValues.locations}
              onSelectionChange={(selected) => {
                setFilterValues((prev) => ({
                  ...prev,
                  locations: selected,
                }));
              }}
            />
            <DataTableFacetedFilter
              title="Interests"
              options={interests.map((interest) => ({
                label: interest.name,
                value: interest.name,
              }))}
              selectedValues={filterValues.tags}
              onSelectionChange={(selected) => {
                setFilterValues((prev) => ({
                  ...prev,
                  tags: selected,
                }));
              }}
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-shrink-0">
          <Skeleton className="h-10 w-full" />
        </div>
      )}
      <div className="flex-1 flex flex-col min-h-0">
        <UserDataTable
          table={table}
          columns={columns}
          isLoading={isLoading}
          onRowClick={(user) => navigate(`/profile/${user.username}`)}
        />
      </div>
    </div>
  );
}
