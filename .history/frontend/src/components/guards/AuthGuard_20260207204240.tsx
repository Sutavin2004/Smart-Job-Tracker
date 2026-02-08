"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";

type Props = {
  children: ReactNode;
};

export default function AuthGuard({ children }: Props) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    // Later: show loading skeleton/spinner
    return null;
  }

  if (!isAuthenticated) {
    // While redirecting, render nothing
    return null;
  }

  return <>{children}</>;
}
