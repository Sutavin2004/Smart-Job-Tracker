import { ReactNode } from "react";

export default function ApplicationsLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Shared wrapper for all /applications routes.
  // Later, you can add tabs (Table / Kanban), filters, etc. here.
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Applications</h1>
      {children}
    </div>
  );
}
