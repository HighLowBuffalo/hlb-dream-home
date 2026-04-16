"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Submission {
  id: string;
  client_name: string | null;
  project_name: string | null;
  address: string | null;
  project_type: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/submissions");
        if (res.status === 401 || res.status === 403) {
          router.push("/login");
          return;
        }
        if (res.ok) {
          setSubmissions(await res.json());
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  function formatDate(d: string | null) {
    if (!d) return "\u2014";
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm font-light text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-gray-200">
        <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-gray-400 mb-1">
          High, Low, Buffalo
        </p>
        <h1 className="text-xl font-light">Client Submissions</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {submissions.length === 0 ? (
          <p className="text-sm font-light text-gray-400">No submissions yet.</p>
        ) : (
          <table className="w-full text-sm font-light">
            <thead>
              <tr className="border-b border-black text-left">
                <th className="py-2 text-[10px] font-medium tracking-[0.18em] uppercase">
                  Client
                </th>
                <th className="py-2 text-[10px] font-medium tracking-[0.18em] uppercase">
                  Project
                </th>
                <th className="py-2 text-[10px] font-medium tracking-[0.18em] uppercase">
                  Status
                </th>
                <th className="py-2 text-[10px] font-medium tracking-[0.18em] uppercase">
                  Started
                </th>
                <th className="py-2 text-[10px] font-medium tracking-[0.18em] uppercase">
                  Completed
                </th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => (
                <tr
                  key={sub.id}
                  onClick={() => router.push(`/submission/${sub.id}`)}
                  className="border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <td className="py-3">{sub.client_name || "Unknown"}</td>
                  <td className="py-3 text-gray-600">
                    {sub.project_name || "\u2014"}
                  </td>
                  <td className="py-3">
                    <span
                      className={`text-[10px] font-medium tracking-widest uppercase ${
                        sub.status === "completed"
                          ? "text-black"
                          : "text-gray-400"
                      }`}
                    >
                      {sub.status}
                    </span>
                  </td>
                  <td className="py-3 text-gray-600">{formatDate(sub.created_at)}</td>
                  <td className="py-3 text-gray-600">
                    {formatDate(sub.completed_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
