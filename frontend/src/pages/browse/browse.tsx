import { AppLayout } from "@/components/layouts/AppLayout";
import { columns, type UserRow } from "./columns";
import { DataTable } from "./data-table";

function getData(): UserRow[] {
  // Fetch data from API here.
  return [
    {
      id: "728ed52f",
      profilePicture: "https://randomuser.me/api/portraits/women/32.jpg",
      firstName: "John",
      lastName: "Doe",
      age: 25,
      fameRating: 4.5,
      location: "Paris, France",
      interests: [
        { id: "1f7384d0-1c0c-409d-aef7-5d6a0c68c6ea", name: "#Travel" },
        { id: "c5054e43-ec6e-4b15-ada9-ca46534ad3cd", name: "#Music" },
        { id: "533513e9-04be-46bd-90d7-4912893bc59f", name: "#Gym" },
      ],
      liked: false,
    },
  ];
}

export function Browse() {

  const data = getData();
  return (
    <AppLayout>
      <DataTable columns={columns} data={data} />
    </AppLayout>
  );
}
