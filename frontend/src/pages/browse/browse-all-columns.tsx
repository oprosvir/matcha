import type { ColumnDef } from "@tanstack/react-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { UserListItem } from "@/types/browse";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { getPhotoUrl } from "@/utils/photoUtils";

export function createBrowseAllColumns(): ColumnDef<UserListItem>[] {
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
    },
    {
      id: "distance",
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
    },
  ];
}
