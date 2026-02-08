"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { JobApplication } from "@/types/api";

export default function ApplicationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [app, setApp] = useState<JobApplication | null>(null);

  useEffect(() => {
    apiClient
      .get<JobApplication>(`/applications/${params.id}`)
      .then(setApp);
  }, [params.id]);

  if (!app) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6 space-y-2">
      <h1 className="text-2xl font-semibold">
        {app.company_name} — {app.job_title}
      </h1>
      <p>Status: {app.current_status}</p>
      {app.job_url && (
        <a
          href={app.job_url}
          target="_blank"
          className="text-blue-600 underline"
        >
          Job Posting
        </a>
      )}
    </div>
  );
}
