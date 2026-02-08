import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  // Later: add auth-specific chrome (logo, centered card, etc.)
  return <>{children}</>;
}
