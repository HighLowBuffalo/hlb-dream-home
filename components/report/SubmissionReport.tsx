"use client";

import { PROGRAM_QUESTIONS, SOUL_QUESTIONS } from "@/lib/data/questions";
import { buildSpaceTable, type Space } from "@/lib/report/buildSpaceTable";
import QuestionFlags, { type FlagType } from "@/components/ui/QuestionFlags";
import UploadedImages from "@/components/ui/UploadedImages";

// The client report page and admin detail page render the exact same report
// body (title block → space program table → program sections → soul → footer).
// Top chrome (Print, Back, Status pill) lives in the page shell, not here.

interface Answer {
  question_key: string;
  answer_text: string | null;
  answer_data?: Record<string, unknown> | null;
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

export interface ReportSubmission {
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

// Group program questions into labeled sections for display
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

function SpaceRow({ space }: { space: Space }) {
  return (
    <tr className="border-b border-gray-200">
      <td className="py-2">{space.name}</td>
      <td className="py-2 text-gray-600">{space.dims}</td>
      <td className="py-2 text-right">{space.sqft.toLocaleString()}</td>
    </tr>
  );
}

export default function SubmissionReport({ submission }: { submission: ReportSubmission }) {
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

  const { mainHouse, detached, mainHouseSqft, detachedSqft, totalSqft } =
    buildSpaceTable(programMap);

  const completedDate = submission.completed_at
    ? new Date(submission.completed_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 max-w-3xl mx-auto w-full">
      {/* Title block */}
      <div className="mb-12">
        <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-gray-400 mb-4">
          High, Low, Buffalo
        </p>
        <h1 className="text-3xl font-light leading-tight mb-2">
          {submission.project_name || "Home Vision"}
        </h1>
        <div className="text-sm font-light text-gray-600 space-y-1">
          {submission.client_name && <p>{submission.client_name}</p>}
          {submission.address && <p>{submission.address}</p>}
          {submission.project_type && <p>{submission.project_type}</p>}
          {completedDate && <p>Completed {completedDate}</p>}
        </div>
      </div>

      {/* Space Program Table */}
      <div className="mb-12">
        <h2 className="text-[10px] font-medium tracking-[0.18em] uppercase text-gray-400 mb-4">
          Space Program
        </h2>
        <table className="w-full text-sm font-light">
          <thead>
            <tr className="border-b border-black">
              <th className="text-left py-2 text-[10px] font-medium tracking-[0.18em] uppercase">
                Space
              </th>
              <th className="text-left py-2 text-[10px] font-medium tracking-[0.18em] uppercase">
                Dimensions
              </th>
              <th className="text-right py-2 text-[10px] font-medium tracking-[0.18em] uppercase">
                Sq Ft
              </th>
            </tr>
          </thead>
          <tbody>
            {mainHouse.length > 0 && (
              <>
                <tr>
                  <td colSpan={3} className="pt-4 pb-2 text-[10px] font-medium tracking-[0.18em] uppercase text-gray-400">
                    Main House (attached)
                  </td>
                </tr>
                {mainHouse.map((space, i) => (
                  <SpaceRow key={`m-${i}`} space={space} />
                ))}
                <tr className="border-t border-gray-400">
                  <td className="py-2 font-medium">Subtotal</td>
                  <td className="py-2"></td>
                  <td className="py-2 text-right font-medium">
                    {mainHouseSqft.toLocaleString()} sf
                  </td>
                </tr>
              </>
            )}

            {detached.length > 0 && (
              <>
                <tr>
                  <td colSpan={3} className="pt-6 pb-2 text-[10px] font-medium tracking-[0.18em] uppercase text-gray-400">
                    Detached &amp; Outdoor
                  </td>
                </tr>
                {detached.map((space, i) => (
                  <SpaceRow key={`d-${i}`} space={space} />
                ))}
                <tr className="border-t border-gray-400">
                  <td className="py-2 font-medium">Subtotal</td>
                  <td className="py-2"></td>
                  <td className="py-2 text-right font-medium">
                    {detachedSqft.toLocaleString()} sf
                  </td>
                </tr>
              </>
            )}

            <tr className="border-t-2 border-black">
              <td className="pt-3 pb-2 font-medium">Total</td>
              <td className="pt-3 pb-2"></td>
              <td className="pt-3 pb-2 text-right font-medium">
                {totalSqft.toLocaleString()} sf
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Program Answers by Section */}
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

      {/* Footer */}
      <div className="py-8 border-t border-gray-200 text-center">
        <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-gray-400 mb-4">
          High, Low, Buffalo Architecture PLLC
        </p>
        <p className="text-xs font-light text-gray-400">
          highlowbuffalo.co
        </p>
      </div>
    </div>
  );
}
