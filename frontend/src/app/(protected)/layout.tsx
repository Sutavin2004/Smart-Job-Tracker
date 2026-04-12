import { ReactNode } from "react";
import ProtectedClient from "@/components/guards/ProtectedClient";
import NavBar from "@/components/NavBar";

export const dynamic = "force-dynamic";

export default function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ProtectedClient>
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <main>{children}</main>
      </div>
    </ProtectedClient>
  );
}
