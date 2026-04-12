"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { JobApplication } from "@/types/api";

export default function DashboardPage() {
  const [apps, setApps] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<JobApplication[]>("/applications")
      .then(setApps)
      .finally(() => setLoading(false));
  }, []);

  const total = apps.length;
  const interviewing = apps.filter(
    (a) => a.current_status === "interview" || a.current_status === "recruiter_screen"
  ).length;
  const offered = apps.filter((a) => a.current_status === "offer").length;
  const recent = apps.slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* Stats bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-lg border shadow-sm">
          <p className="text-sm text-gray-500">Total Applications</p>
          <p className="text-3xl font-bold mt-1">{loading ? "—" : total}</p>
        </div>
        <div className="p-4 bg-white rounded-lg border shadow-sm">
          <p className="text-sm text-gray-500">Interviewing</p>
          <p className="text-3xl font-bold mt-1 text-yellow-600">{loading ? "—" : interviewing}</p>
        </div>
        <div className="p-4 bg-white rounded-lg border shadow-sm">
          <p className="text-sm text-gray-500">Offers</p>
          <p className="text-3xl font-bold mt-1 text-green-600">{loading ? "—" : offered}</p>
        </div>
      </div>

      {/* Recent applications */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium">Recent Applications</h2>
          <Link href="/applications" className="text-sm text-blue-600 hover:underline">
            View all
          </Link>
        </div>

        {loading ? (
          <p className="text-gray-400 text-sm">Loading...</p>
        ) : recent.length === 0 ? (
          <div className="text-center py-8 border rounded-lg">
            <p className="text-gray-500 text-sm mb-3">No applications yet.</p>
            <Link
              href="/applications/new"
              className="bg-black text-white px-4 py-2 rounded text-sm"
            >
              Add your first application
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((app) => (
              <Link
                key={app.id}
                href={`/applications/${app.id}`}
                className="flex items-center justify-between p-3 bg-white border rounded-lg hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium text-sm">{app.company}</p>
                  <p className="text-xs text-gray-500">{app.role}</p>
                </div>
                <span className="text-xs text-gray-400 capitalize">
                  {app.current_status.replace("_", " ")}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
