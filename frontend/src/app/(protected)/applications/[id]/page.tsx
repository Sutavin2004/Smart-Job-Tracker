"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { JobApplication, ApplicationStatus, ApplicationUpdate } from "@/types/api";

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

export default function ApplicationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [app, setApp] = useState<JobApplication | null>(null);
  const [status, setStatus] = useState<ApplicationStatus>("applied");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get<JobApplication>(`/applications/${params.id}`).then((data) => {
      setApp(data);
      setStatus(data.current_status);
      setNotes(data.notes ?? "");
    });
  }, [params.id]);

  const handleSave = async () => {
    if (!app) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const update: ApplicationUpdate = { current_status: status, notes };
      const updated = await apiClient.put<JobApplication, ApplicationUpdate>(
        `/applications/${app.id}`,
        update
      );
      setApp(updated);
      setSaveMsg("Saved!");
      setTimeout(() => setSaveMsg(null), 2000);
    } catch {
      setSaveMsg("Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleAnalyze = async () => {
    if (!app) return;
    setAnalyzing(true);
    try {
      const updated = await apiClient.post<JobApplication, Record<string, never>>(
        `/applications/${app.id}/analyze`,
        {},
        true
      );
      setApp(updated);
    } catch {
      // ignore
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDelete = async () => {
    if (!app || !confirm("Delete this application?")) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/applications/${app.id}`);
      router.push("/applications");
    } catch {
      setDeleting(false);
    }
  };

  if (!app) return <p className="p-6">Loading...</p>;

  const statusCls = STATUS_STYLES[app.current_status] ?? "bg-gray-100 text-gray-700";

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{app.company}</h1>
          <p className="text-gray-600 mt-0.5">{app.role}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${statusCls}`}>
          {app.current_status.replace("_", " ")}
        </span>
      </div>

      {app.job_url && (
        <a href={app.job_url} target="_blank" rel="noreferrer" className="text-blue-600 underline text-sm">
          View Job Posting
        </a>
      )}

      {/* Edit form */}
      <div className="border rounded-lg p-4 space-y-4">
        <h2 className="font-medium text-sm text-gray-700">Update Application</h2>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
            className="w-full border rounded px-3 py-2 text-sm"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
            rows={3}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-black text-white px-4 py-2 rounded text-sm disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          {saveMsg && <span className="text-sm text-green-600">{saveMsg}</span>}
        </div>
      </div>

      {/* AI suggestion */}
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-sm text-gray-700">AI Suggestion</h2>
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="bg-indigo-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50 hover:bg-indigo-700"
          >
            {analyzing ? "Analyzing..." : "Get AI Suggestion"}
          </button>
        </div>

        {app.ai_suggestion ? (
          <p className="text-sm text-gray-700 leading-relaxed bg-indigo-50 p-3 rounded">
            {app.ai_suggestion}
          </p>
        ) : (
          <p className="text-sm text-gray-400">
            Click "Get AI Suggestion" to receive personalized advice for this application.
          </p>
        )}
      </div>

      {/* Danger zone */}
      <div className="pt-2">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-red-600 text-sm hover:underline disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Delete application"}
        </button>
      </div>
    </div>
  );
}
