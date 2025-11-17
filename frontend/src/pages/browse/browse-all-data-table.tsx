import {
  getCoreRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { useEffect, useState, useRef } from "react";
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
import { useUsers } from "@/hooks/useUsers";
import { UserDataTable } from "./user-data-table";
import { createBrowseAllColumns } from "./browse-all-columns";
import { useNavigate } from "react-router";

interface BrowseAllTableProps {
  filters: Filters;
  localSorting: SortingState;
  setLocalSorting: (
    sorting: SortingState | ((prev: SortingState) => SortingState)
  ) => void;
}

function BrowseAllTable({
  filters,
  localSorting,
  setLocalSorting,
}: Omit<BrowseAllTableProps, "columns">) {
  const columns = createBrowseAllColumns();
  const navigate = useNavigate();
  const { users, isLoading, hasMore, fetchNextPage, isFetchingNextPage } =
    useUsers(filters);

  const table = useReactTable({
    data: users,
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

  return (
    <UserDataTable
      table={table}
      columns={columns}
      isLoading={isLoading}
      hasMore={hasMore}
      isFetchingNextPage={isFetchingNextPage}
      observerTarget={observerTarget}
      onRowClick={(user) => navigate(`/profile/${user.username}`)}
    />
  );
}

export function BrowseAllDataTable() {
  const { data: interests, isLoading: isInterestsLoading } = useInterests();
  const { data: locations, isLoading: isLocationsLoading } = useLocationList();
  const firstNameInputRef = useRef<HTMLInputElement>(null);
  const ageRangeRef = useRef<DataTableRangeFilterRef>(null);
  const fameRangeRef = useRef<DataTableRangeFilterRef>(null);
  const locationFilterRef = useRef<DataTableFacetedFilterRef>(null);
  const interestsFilterRef = useRef<DataTableFacetedFilterRef>(null);
  const [filters, setFilters] = useState<Filters>({
    minAge: 18,
    maxAge: 99,
    minFame: 0,
    maxFame: 100,
    locations: [],
    tags: [],
    firstName: "",
  });

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
    <div className="flex flex-col flex-1 min-h-0">
      {/* Filters row */}
      {!isInterestsLoading && interests && !isLocationsLoading && locations ? (
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-2 flex-shrink-0 pb-2">
          <Input
            placeholder="Search by first name..."
            ref={firstNameInputRef}
            className="max-w-sm w-full xl:w-auto xl:max-w-sm"
            defaultValue={filters?.firstName}
          />
          <div className="flex flex-wrap items-center gap-2 xl:flex-1">
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
              className="hidden md:flex ml-auto shrink-0"
              onClick={handleSearch}
            >
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
          <Button
            size="sm"
            className="md:hidden shrink-0"
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
      <div className="flex-1 flex flex-col min-h-0">
        <BrowseAllTable
          filters={filters}
          localSorting={localSorting}
          setLocalSorting={setLocalSorting}
        />
      </div>
    </div>
  );
}
