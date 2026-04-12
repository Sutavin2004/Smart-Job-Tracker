"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { ApplicationCreate, ApplicationStatus, JobApplication } from "@/types/api";

const STATUSES: { value: ApplicationStatus; label: string }[] = [
  { value: "applied", label: "Applied" },
  { value: "draft", label: "Draft / Saved" },
  { value: "recruiter_screen", label: "Recruiter Screen" },
  { value: "interview", label: "Interviewing" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
  { value: "ghosted", label: "Ghosted" },
  { value: "withdrawn", label: "Withdrawn" },
];

export default function NewApplicationPage() {
  const router = useRouter();
  const [form, setForm] = useState<ApplicationCreate>({
    company: "",
    role: "",
    job_url: "",
    notes: "",
    status: "applied",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof ApplicationCreate, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: ApplicationCreate = {
        ...form,
        job_url: form.job_url || undefined,
        notes: form.notes || undefined,
      };
      await apiClient.post<JobApplication, ApplicationCreate>(
        "/applications",
        payload,
        true
      );
      router.push("/applications");
    } catch {
      setError("Failed to create application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg">
      <h1 className="text-2xl font-semibold mb-6">Add Application</h1>

      {error && <p className="mb-4 text-red-600 text-sm">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Company *</label>
          <input
            required
            type="text"
            value={form.company}
            onChange={(e) => set("company", e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="e.g. Acme Corp"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Role *</label>
          <input
            required
            type="text"
            value={form.role}
            onChange={(e) => set("role", e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="e.g. Software Engineer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Job URL</label>
          <input
            type="url"
            value={form.job_url}
            onChange={(e) => set("job_url", e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
            rows={3}
            placeholder="Any notes about this application..."
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white px-5 py-2 rounded text-sm disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Application"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="border px-5 py-2 rounded text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
