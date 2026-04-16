"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PROGRAM_QUESTIONS, SOUL_QUESTIONS } from "@/lib/data/questions";
import Button from "@/components/ui/Button";
import QuestionFlags, { type FlagType } from "@/components/ui/QuestionFlags";
import UploadedImages from "@/components/ui/UploadedImages";

interface Answer {
  question_key: string;
  answer_text: string | null;
}

interface Flag {
  question_key: string;
  flag_type: FlagType;
}

interface Image {
  id: string;
  context_key: string;
  storage_path: string;
  file_name: string | null;
  signed_url: string | null;
}

interface Submission {
  id: string;
  client_name: string | null;
  project_name: string | null;
  address: string | null;
  project_type: string | null;
  status: string;
  created_at: string;
  completed_at: string | null;
  programAnswers: Answer[];
  soulAnswers: Answer[];
  flags?: Flag[];
  images?: Image[];
}

const PROGRAM_SECTIONS = [
  { title: "Project Basics", keys: ["name", "address", "projectName", "projectType"] },
  { title: "Bedrooms & Bathrooms", keys: ["beds", "baths", "guests", "primaryBed", "primaryBedMore", "primaryBath", "primaryBathMore", "primaryCloset", "guestBeds"] },
  { title: "Kitchen", keys: ["kitchen", "kitchenUsage", "kitchenFeatures", "kitchenMore", "kitchenAdj"] },
  { title: "Dining", keys: ["dining", "diningSeats", "diningNotes", "diningMore"] },
  { title: "Living Spaces", keys: ["living", "livingMore"] },
  { title: "Entry & Mudroom", keys: ["entryMud", "entryMore"] },
  { title: "Laundry", keys: ["laundry"] },
  { title: "Office", keys: ["office", "officeAdj"] },
  { title: "Special Rooms", keys: ["specialRooms", "specialMore"] },
  { title: "Garage", keys: ["garageCount"] },
  { title: "Outdoor Living", keys: ["outdoor", "outdoorPool", "outdoorKitchen", "outdoorMore"] },
  { title: "Entertaining", keys: ["entertaining"] },
  { title: "Final Notes", keys: ["pNotes"] },
];

export default function AdminSubmissionPage() {
  const params = useParams();
  const router = useRouter();
  const [submission, setSubmission] = useState<Submission | null>(null);
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

  const programMap: Record<string, string> = {};
  for (const a of submission.programAnswers) {
    if (a.answer_text) programMap[a.question_key] = a.answer_text;
  }

  const soulMap: Record<string, string> = {};
  for (const a of submission.soulAnswers) {
    if (a.answer_text) soulMap[a.question_key] = a.answer_text;
  }

  const flagMap: Record<string, Set<FlagType>> = {};
  for (const f of submission.flags || []) {
    if (!flagMap[f.question_key]) flagMap[f.question_key] = new Set();
    flagMap[f.question_key].add(f.flag_type);
  }

  const images = submission.images || [];

  const questionTextMap: Record<string, string> = {};
  for (const q of PROGRAM_QUESTIONS) {
    questionTextMap[q.key] = q.text;
  }

  const completedDate = submission.completed_at
    ? new Date(submission.completed_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          &larr; All submissions
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          Print / Save PDF
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 max-w-3xl mx-auto w-full">
        <div className="mb-12">
          <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-gray-400 mb-4">
            Client Submission
          </p>
          <h1 className="text-3xl font-light leading-tight mb-2">
            {submission.project_name || "Untitled Project"}
          </h1>
          <div className="text-sm font-light text-gray-600 space-y-1">
            {submission.client_name && <p>{submission.client_name}</p>}
            {submission.address && <p>{submission.address}</p>}
            {submission.project_type && <p>{submission.project_type}</p>}
            <p>
              Status:{" "}
              <span className="text-[10px] font-medium tracking-widest uppercase">
                {submission.status}
              </span>
            </p>
            {completedDate && <p>Completed {completedDate}</p>}
          </div>
        </div>

        {/* Program Answers */}
        <div className="mb-12">
          <h2 className="text-[10px] font-medium tracking-[0.18em] uppercase text-gray-400 mb-6">
            The Program
          </h2>
          {PROGRAM_SECTIONS.map((section) => {
            const sectionAnswers = section.keys
              .filter((key) => programMap[key])
              .map((key) => ({
                key,
                question: questionTextMap[key] || key,
                answer: programMap[key],
              }));
            if (sectionAnswers.length === 0) return null;
            return (
              <div key={section.title} className="mb-8">
                <h3 className="text-xs font-medium tracking-wide uppercase text-gray-600 mb-3 pb-1 border-b border-gray-200">
                  {section.title}
                </h3>
                <div className="space-y-3">
                  {sectionAnswers.map(({ key, question, answer }) => (
                    <div key={key}>
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-xs text-gray-400 mb-0.5 flex-1">{question}</p>
                        {flagMap[key] && flagMap[key].size > 0 && (
                          <QuestionFlags activeFlags={flagMap[key]} readOnly />
                        )}
                      </div>
                      <p className="text-sm font-light leading-relaxed">{answer}</p>
                      <UploadedImages images={images} contextKey={key} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Soul Answers */}
        {Object.keys(soulMap).length > 0 && (
          <div className="mb-12">
            <h2 className="text-[10px] font-medium tracking-[0.18em] uppercase text-gray-400 mb-6">
              The Soul of Your Home
            </h2>
            <div className="space-y-6">
              {SOUL_QUESTIONS.filter((q) => soulMap[q.key] || images.some((img) => img.context_key === q.key)).map((q) => (
                <div key={q.key}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs text-gray-400 mb-1 flex-1">{q.label}</p>
                    {flagMap[q.key] && flagMap[q.key].size > 0 && (
                      <QuestionFlags activeFlags={flagMap[q.key]} readOnly />
                    )}
                  </div>
                  {soulMap[q.key] && (
                    <p className="text-sm font-light leading-relaxed whitespace-pre-wrap">
                      {soulMap[q.key]}
                    </p>
                  )}
                  <UploadedImages images={images} contextKey={q.key} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
