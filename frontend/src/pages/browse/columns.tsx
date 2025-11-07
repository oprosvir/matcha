import type { ColumnDef } from "@tanstack/react-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { Heart } from "lucide-react";
import type { UserListItem } from "@/types/browse";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";

export const columns: ColumnDef<UserListItem>[] = [
  {
    accessorKey: "profilePicture",
    header: "Profile Picture",
    cell: ({ row }) => {
      return (
        <Avatar className="size-10">
          <AvatarImage
            src={row.original.profilePicture}
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
      return <div>{`${row.original.fameRating}`}</div>;
    },
  },
  {
    id: "location",
    header: "Location",
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
        <div className="max-w-[200px] overflow-x-auto">
          {row.original.interests.map((interest) => (
            <Badge key={interest.id} className="mr-2">
              {interest.name}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <div className="flex gap-2">
          <Toggle
            onPressedChange={() => {
              row.original.liked = !row.original.liked;
            }}
            pressed={row.original.liked}
            variant="outline"
            className="data-[state=on]:bg-red-400 data-[state=on]:text-white transition-colors duration-200"
          >
            <Heart className="w-4 h-4" />
          </Toggle>
        </div>
      );
    },
  },
];
