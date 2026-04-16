"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import SubmissionReport, {
  type ReportSubmission,
} from "@/components/report/SubmissionReport";

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const [submission, setSubmission] = useState<ReportSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/submissions/${params.id}`);
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (!res.ok) {
          setError("Could not load your submission.");
          return;
        }
        const data = await res.json();
        setSubmission(data);
      } catch {
        setError("Something went wrong loading your results.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm font-light text-gray-400">Loading your results...</p>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="text-center">
          <p className="text-sm font-light text-gray-600">{error}</p>
          <button
            onClick={() => router.push("/welcome")}
            className="mt-4 text-sm font-light text-black underline"
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header — pr-28 clears the fixed SIGN OUT pill top-right. */}
      <div className="flex items-center justify-between pl-6 pr-56 py-4 border-b border-gray-200">
        <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-gray-400">
          Programming Analysis
        </p>
        <Button variant="outline" onClick={() => window.print()}>
          Print / Save PDF
        </Button>
      </div>

      <SubmissionReport submission={submission} />
    </div>
  );
}
