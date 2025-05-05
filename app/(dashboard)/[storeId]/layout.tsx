import Navbar from "@/components/navbar";
import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { storeId: string };
}) {
  const { userId } = await auth();
  
  // Debug: Log authentication status
  console.log('Dashboard Layout - User ID:', userId);
  console.log('Dashboard Layout - Store ID:', params.storeId);
  
  if (!userId) {
    console.log('Dashboard Layout - No user ID, redirecting to sign-in');
    redirect("/sign-in");
  }

  try {
    // Validate the storeId format to avoid database errors
    if (!params.storeId || typeof params.storeId !== 'string' || params.storeId.length < 10) {
      console.log('Dashboard Layout - Invalid store ID format');
      return redirect("/");
    }

    // Find the store with the given ID that belongs to the current user
    const store = await db.store.findFirst({
      where: {
        id: params.storeId,
        userId,
      },
    });

    console.log('Dashboard Layout - Store found:', !!store);
    
    if (!store) {
      console.log('Dashboard Layout - No store found, redirecting to home');
      redirect("/");
    }
    
    return (
      <>
        <Navbar />
        {children}
      </>
    );
  } catch (error) {
    console.error('Dashboard Layout - Error:', error);
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error Loading Dashboard</h1>
          <p className="text-red-500">There was an error connecting to the database. Please try again later.</p>
        </div>
      </div>
    );
  }
}
