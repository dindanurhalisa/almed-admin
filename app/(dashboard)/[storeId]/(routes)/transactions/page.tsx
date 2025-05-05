import db from "@/lib/db";
import { TransactionClient } from "./components/client";
import { TransactionColumn } from "./components/columns";

import { format } from "date-fns";
import { formatter } from "@/lib/utils";

const TransactionsPage = async ({ params }: { params: { storeId: string } }) => {
  const transactions = await db.transaction.findMany({
    where: {
      storeId: params.storeId,
    },
    include: {
      orderItems: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const formattedTransactions: TransactionColumn[] = transactions.map((item) => ({
    id: item.id,
    name: item.name,
    phone: item.phone,
    paymentMethod: item.paymentMethod,
    address: item.address,
    isPaid: item.isPaid,
    totalAmount: formatter.format(item.totalAmount.toNumber()),
    itemCount: item.orderItems.length,
    createdAt: format(item.createdAt, "MMM do, yyyy"),
  }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <TransactionClient data={formattedTransactions} />
      </div>
    </div>
  );
};

export default TransactionsPage;
