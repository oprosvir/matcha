import type { ColumnDef } from "@tanstack/react-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { UserListItem } from "@/types/browse";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { getPhotoUrl } from "@/utils/photoUtils";

export function createSuggestedColumns(): ColumnDef<UserListItem>[] {
  return [
    {
      accessorKey: "profilePicture",
      header: "Profile Picture",
      cell: ({ row }) => {
        return (
          <Avatar className="size-10">
            <AvatarImage
              src={getPhotoUrl(row.original.profilePicture)}
              alt={`${row.original.firstName} ${row.original.lastName}`}
            />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(row.original.firstName, row.original.lastName)}
            </AvatarFallback>
          </Avatar>
        );
      },
    },
    {
      accessorKey: "firstName",
      header: "First Name",
      filterFn: (row, id, value) => {
        const firstName = row.getValue(id) as string;
        return firstName?.toLowerCase().includes(value.toLowerCase()) ?? false;
      },
    },
    {
      accessorKey: "lastName",
      header: "Last Name",
    },
    {
      accessorKey: "age",
      enableSorting: true,
      header: ({ column }) => {
        return <DataTableColumnHeader column={column} title="Age" />;
      },
      filterFn: (row, id, value) => {
        const age = row.getValue(id) as number;
        if (
          !value ||
          typeof value !== "object" ||
          !("min" in value) ||
          !("max" in value)
        ) {
          return true;
        }
        const { min, max } = value as { min: number; max: number };
        return age >= min && age <= max;
      },
    },
    {
      accessorKey: "fameRating",
      enableSorting: true,
      header: ({ column }) => {
        return <DataTableColumnHeader column={column} title="Fame Rating" />;
      },
      cell: ({ row }) => {
        return <div>{row.original.fameRating}</div>;
      },
      filterFn: (row, id, value) => {
        const fameRating = row.getValue(id) as number;
        if (
          !value ||
          typeof value !== "object" ||
          !("min" in value) ||
          !("max" in value)
        ) {
          return true;
        }
        const { min, max } = value as { min: number; max: number };
        return fameRating >= min && fameRating <= max;
      },
    },
    {
      id: "location",
      enableSorting: true,
      header: ({ column }) => {
        return (
          <DataTableColumnHeader
            column={column}
            title="Location"
            firstSortingOption="closest"
            secondSortingOption="farthest"
          />
        );
      },
      accessorFn: (row) => {
        const city = row.cityName || "";
        const country = row.countryName || "";
        if (city && country) {
          return `${city}, ${country}`;
        }
        return city || country || "-";
      },
      cell: ({ row }) => {
        const city = row.original.cityName || "";
        const country = row.original.countryName || "";
        const value =
          city && country ? `${city}, ${country}` : city || country || "-";
        return <div>{value}</div>;
      },
      sortingFn: (rowA, rowB) => {
        // Sort by distance instead of alphabetically
        const distanceA = rowA.original.distance ?? 999999;
        const distanceB = rowB.original.distance ?? 999999;
        return distanceA - distanceB;
      },
      filterFn: (row, _id, value) => {
        if (!value || !Array.isArray(value) || value.length === 0) {
          return true;
        }
        const city = row.original.cityName || "";
        const country = row.original.countryName || "";
        const location =
          city && country ? `${city}, ${country}` : city || country || "-";
        return value.includes(location);
      },
    },
    {
      accessorKey: "interests",
      enableSorting: true,
      header: ({ column }) => {
        return (
          <DataTableColumnHeader
            column={column}
            title="Interests"
            firstSortingOption="least common"
            secondSortingOption="most common"
          />
        );
      },
      cell: ({ row }) => {
        return (
          <div className="max-w-full @md:max-w-[400px] flex flex-wrap gap-1">
            {row.original.interests.map((interest) => (
              <Badge key={interest.id} variant="outline" className="text-xs rounded-full bg-muted border-muted text-foreground transition-all hover:bg-secondary hover:border-secondary dark:bg-[oklch(0.280_0.020_132)] dark:text-[oklch(0.830_0.084_116)] dark:border-[oklch(0.280_0.020_132)] dark:hover:bg-[oklch(0.320_0.030_132)] dark:hover:text-[oklch(0.95_0.008_136)] dark:hover:border-[oklch(0.320_0.030_132)]">
                {interest.name}
              </Badge>
            ))}
          </div>
        );
      },
      filterFn: (row, id, value) => {
        if (!value || !Array.isArray(value) || value.length === 0) {
          return true;
        }
        const interests = row.getValue(id) as Array<{
          id: string;
          name: string;
        }>;
        const interestNames = interests.map((i) => i.name);
        return value.some((tag: string) => interestNames.includes(tag));
      },
    },
  ];
}
