"use client";

import { ReactNode } from "react";
import AuthGuard from "@/components/guards/AuthGuard";

/**
 * Protected routes depend on runtime auth state.
 * We must disable static prerendering.
 */
export const dynamic = "force-dynamic";

export default function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
