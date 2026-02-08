import { ReactNode } from "react";

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Minimal wrapper for auth pages.
  // Later you can add a centered card or logo here.
  return (
    <div className="min-h-screen flex items-center justify-center">
      {children}
    </div>
  );
}
