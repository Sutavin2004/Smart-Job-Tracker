"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { JobApplication, ApplicationStatus } from "@/types/api";

const COLUMNS: { status: ApplicationStatus; label: string; color: string }[] = [
  { status: "applied", label: "Applied", color: "bg-blue-50 border-blue-200" },
  { status: "interview", label: "Interviewing", color: "bg-yellow-50 border-yellow-200" },
  { status: "offer", label: "Offer", color: "bg-green-50 border-green-200" },
  { status: "rejected", label: "Rejected", color: "bg-red-50 border-red-200" },
  { status: "ghosted", label: "Ghosted", color: "bg-orange-50 border-orange-200" },
];

export default function KanbanPage() {
  const [apps, setApps] = useState<JobApplication[]>([]);

  useEffect(() => {
    apiClient.get<JobApplication[]>("/applications").then(setApps);
  }, []);

  return (
    <div className="p-6 overflow-x-auto">
      <h1 className="text-2xl font-semibold mb-4">Kanban</h1>

      <div className="flex gap-4 min-w-[900px]">
        {COLUMNS.map(({ status, label, color }) => {
          const col = apps.filter((a) => a.current_status === status);
          return (
            <div key={status} className={`w-56 border rounded-lg p-3 ${color}`}>
              <h2 className="font-medium mb-2 text-sm">
                {label} <span className="text-gray-400 font-normal">({col.length})</span>
              </h2>
              <div className="space-y-2">
                {col.map((a) => (
                  <Link
                    key={a.id}
                    href={`/applications/${a.id}`}
                    className="block bg-white p-2 rounded shadow-sm text-sm hover:shadow"
                  >
                    <p className="font-medium">{a.company}</p>
                    <p className="text-gray-500 text-xs">{a.role}</p>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
