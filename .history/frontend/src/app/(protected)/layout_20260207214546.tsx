import { ReactNode } from "react";
import ProtectedClient from "@/components/guards/ProtectedClient";

/**
 * Protected routes depend on runtime auth state.
 * Static prerendering MUST be disabled.
 */
export const dynamic = "force-dynamic";

export default function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <ProtectedClient>{children}</ProtectedClient>;
}
