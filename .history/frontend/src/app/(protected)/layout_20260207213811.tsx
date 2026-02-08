"use client";

import { ReactNode } from "react";
import AuthGuard from "@/components/guards/AuthGuard";

export default function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  // All protected routes are wrapped in AuthGuard.
  // This ensures client-side protection even if cookies change.
  return <AuthGuard>{children}</AuthGuard>;
}
