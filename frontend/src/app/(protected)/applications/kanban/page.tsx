"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { JobApplication, ApplicationStatus } from "@/types/api";

const COLUMNS: ApplicationStatus[] = [
  "applied",
  "interview",
  "offer",
  "rejected",
  "ghosted",
];

export default function KanbanPage() {
  const [apps, setApps] = useState<JobApplication[]>([]);

  useEffect(() => {
    apiClient
      .get<{ items: JobApplication[] }>("/applications")
      .then((res) => setApps(res.items));
  }, []);

  return (
    <div className="p-6 overflow-x-auto">
      <h1 className="text-2xl font-semibold mb-4">Kanban</h1>

      <div className="flex gap-4 min-w-[800px]">
        {COLUMNS.map((status) => (
          <div key={status} className="w-64 bg-gray-100 p-3 rounded">
            <h2 className="font-medium mb-2 capitalize">{status}</h2>
            <div className="space-y-2">
              {apps
                .filter((a) => a.current_status === status)
                .map((a) => (
                  <div
                    key={a.id}
                    className="bg-white p-2 rounded shadow text-sm"
                  >
                    <p className="font-medium">{a.company_name}</p>
                    <p className="text-gray-500">{a.job_title}</p>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
