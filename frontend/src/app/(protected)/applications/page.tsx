"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { JobApplication, ApplicationStatus } from "@/types/api";

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  applied: "bg-blue-100 text-blue-700",
  recruiter_screen: "bg-purple-100 text-purple-700",
  interview: "bg-yellow-100 text-yellow-700",
  offer: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  ghosted: "bg-orange-100 text-orange-700",
  withdrawn: "bg-gray-200 text-gray-600",
};

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const cls = STATUS_STYLES[status] ?? "bg-gray-100 text-gray-700";
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${cls}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export default function ApplicationsPage() {
  const [apps, setApps] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<JobApplication[]>("/applications")
      .then(setApps)
      .catch(() => setError("Failed to load applications"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-6">Loading...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Applications</h1>
        <Link
          href="/applications/new"
          className="bg-black text-white px-4 py-2 rounded text-sm hover:bg-gray-800"
        >
          + Add Application
        </Link>
      </div>

      {apps.length === 0 ? (
        <p className="text-gray-500">No applications yet. Add your first one!</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 border border-gray-200 text-left">Company</th>
                <th className="p-3 border border-gray-200 text-left">Role</th>
                <th className="p-3 border border-gray-200 text-left">Status</th>
                <th className="p-3 border border-gray-200 text-left">Applied</th>
                <th className="p-3 border border-gray-200 text-left"></th>
              </tr>
            </thead>
            <tbody>
              {apps.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="p-3 border border-gray-200 font-medium">{app.company}</td>
                  <td className="p-3 border border-gray-200">{app.role}</td>
                  <td className="p-3 border border-gray-200">
                    <StatusBadge status={app.current_status} />
                  </td>
                  <td className="p-3 border border-gray-200 text-gray-500">
                    {app.applied_at ?? "—"}
                  </td>
                  <td className="p-3 border border-gray-200">
                    <Link
                      href={`/applications/${app.id}`}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
