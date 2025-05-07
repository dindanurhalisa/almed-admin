import db from "@/lib/db";
import { UserClient } from "./components/client";
import { UserColumn } from "./components/columns";

import { format } from "date-fns";

const UserListPage = async ({ params }: { params: { storeId: string } }) => {
  const users = await db.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  const formattedUsers: UserColumn[] = users.map((item) => ({
    id: item.id,
    name: item.name,
    email: item.email,
    createdAt: format(item.createdAt, "MMM do, yyyy"),
  }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <UserClient data={formattedUsers} />
      </div>
    </div>
  );
};

export default UserListPage;
