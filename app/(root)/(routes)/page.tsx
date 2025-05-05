"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

import { useStoreModal } from "@/hooks/use-store-modal";

const SetupPage = () => {
  const router = useRouter();
  const { userId, isLoaded } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  const onOpen = useStoreModal((state) => state.onOpen);
  const isOpen = useStoreModal((state) => state.isOpen);

  // Check if user has stores and redirect to the first one
  useEffect(() => {
    if (isLoaded) {
      if (!userId) {
        router.push("/sign-in");
        return;
      }

      // Fetch user's stores
      const fetchStores = async () => {
        try {
          const response = await fetch("/api/stores");
          const data = await response.json();
          
          if (data.length > 0) {
            // Redirect to the first store
            router.push(`/${data[0].id}`);
          } else {
            // Open store creation modal if no stores found
            if (!isOpen) {
              onOpen();
            }
            setIsLoading(false);
          }
        } catch (error) {
          console.error("Error fetching stores:", error);
          setIsLoading(false);
          if (!isOpen) {
            onOpen();
          }
        }
      };

      fetchStores();
    }
  }, [userId, isLoaded, router, isOpen, onOpen]);

  if (isLoading || !isLoaded) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default SetupPage;
