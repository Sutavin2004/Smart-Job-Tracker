import { ReactNode } from "react";

/**
 * Auth pages depend on runtime client auth state
 * (login, register use AuthContext).
 * Static prerendering MUST be disabled.
 */
export const dynamic = "force-dynamic";

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      {children}
    </div>
  );
}
