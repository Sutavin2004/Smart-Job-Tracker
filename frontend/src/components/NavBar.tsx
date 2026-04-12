"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import useAuth from "@/hooks/useAuth";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/applications", label: "Applications" },
  { href: "/applications/kanban", label: "Kanban" },
  { href: "/analytics", label: "Analytics" },
];

export default function NavBar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <nav className="bg-white border-b px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <span className="font-semibold text-sm">Smart Job Tracker</span>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`text-sm hover:text-black transition-colors ${
              pathname === l.href ? "text-black font-medium" : "text-gray-500"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>
      <button
        onClick={logout}
        className="text-sm text-gray-500 hover:text-black"
      >
        Logout
      </button>
    </nav>
  );
}
