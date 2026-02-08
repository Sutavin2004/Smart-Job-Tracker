"use client";

import { ReactNode } from "react";
import AuthGuard from "@/components/guards/AuthGuard";

export default function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Later: wrap with app shell (sidebar, header, etc.)
  return <AuthGuard>{children}</AuthGuard>;
}
