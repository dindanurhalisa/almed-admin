import db from "@/lib/db";
import { UserForm } from "./components/user-form";
import { redirect } from "next/navigation";

const UserPage = async ({
    params
}: {
    params: {userId: string, storeId: string}
}) => {
    const user = await db.user.findUnique({
        where: {
            id: params.userId
        },
    })

    if (!user) {
        redirect(`/${params.storeId}/user-list`);
    }

    return ( 
        <div className="flex-col">
           <div className="flex-1 space-y-4 p-8 pt-6">
            <UserForm initialData={user} />
           </div>
        </div>
     );
}
 
export default UserPage;