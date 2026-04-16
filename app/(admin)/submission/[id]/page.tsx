"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import SubmissionReport, {
  type ReportSubmission,
} from "@/components/report/SubmissionReport";

export default function AdminSubmissionPage() {
  const params = useParams();
  const router = useRouter();
  const [submission, setSubmission] = useState<ReportSubmission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/submissions/${params.id}`);
        if (res.status === 401 || res.status === 403) {
          router.push("/login");
          return;
        }
        if (res.ok) {
          setSubmission(await res.json());
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id, router]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm font-light text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="flex flex-1 items-center justify-center px-6">
        <p className="text-sm font-light text-gray-600">Submission not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* pr-56 clears the fixed SAVED/SIGN OUT pills top-right. */}
      <div className="flex items-center justify-between pl-6 pr-56 py-4 border-b border-gray-200 gap-4">
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          &larr; All submissions
        </Button>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-medium tracking-[0.18em] uppercase text-gray-400">
            {submission.status}
          </span>
          <Button variant="outline" onClick={() => window.print()}>
            Print / Save PDF
          </Button>
        </div>
      </div>

      <SubmissionReport submission={submission} />
    </div>
  );
}
