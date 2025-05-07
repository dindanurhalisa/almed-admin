"use client";

import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { UserColumn, columns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { ApiList } from "@/components/ui/api-list";

interface UserClientProps {
  data: UserColumn[]
}

export const UserClient: React.FC<UserClientProps> = ({
  data
}) => {

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading title={`List User (${data.length})`} description="User List" />
      </div>
      <Separator />
      <DataTable data={data} columns={columns} searchKey="name" />
    </>
  );
};
