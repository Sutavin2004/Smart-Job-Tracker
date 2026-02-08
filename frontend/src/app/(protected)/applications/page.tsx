"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { JobApplication } from "@/types/api";

export default function ApplicationsPage() {
  const [apps, setApps] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<{ items: JobApplication[] }>("/applications")
      .then((res) => setApps(res.items))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Applications</h1>

      <div className="overflow-x-auto">
        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Company</th>
              <th className="p-2 border">Role</th>
              <th className="p-2 border">Status</th>
            </tr>
          </thead>
          <tbody>
            {apps.map((app) => (
              <tr key={app.id}>
                <td className="p-2 border">{app.company_name}</td>
                <td className="p-2 border">{app.job_title}</td>
                <td className="p-2 border">{app.current_status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
