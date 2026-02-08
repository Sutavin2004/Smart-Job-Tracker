"use client";

import { ReactNode } from "react";
import AuthGuard from "./AuthGuard";

export default function ProtectedClient({
  children,
}: {
  children: ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
