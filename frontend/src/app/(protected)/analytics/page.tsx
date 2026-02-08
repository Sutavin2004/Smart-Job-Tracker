"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { AnalyticsOverview } from "@/types/api";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsOverview | null>(null);

  useEffect(() => {
    apiClient.get<AnalyticsOverview>("/analytics").then(setData);
  }, []);

  if (!data) return <p className="p-6">Loading analytics...</p>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <p className="text-gray-500">Response Rate</p>
          <p className="text-2xl font-bold">
            {Math.round(data.response_rate * 100)}%
          </p>
        </div>

        <div className="p-4 bg-white rounded shadow">
          <p className="text-gray-500">Interview Conversion</p>
          <p className="text-2xl font-bold">
            {Math.round(data.interview_conversion_rate * 100)}%
          </p>
        </div>
      </div>
    </div>
  );
}
