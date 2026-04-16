"use client";

import { useRef, useState } from "react";
import { uploadImage } from "@/lib/upload";

interface UploadWidgetProps {
  contextKey: string;
  contextLabel: string;
  submissionId?: string;
}

interface UploadedFile {
  name: string;
  status: "uploading" | "done" | "error";
}

export default function UploadWidget({
  contextKey,
  contextLabel,
  submissionId,
}: UploadWidgetProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Single-file mode: take only the first selection. The OS picker
    // also enforces this via the absence of the `multiple` attribute on
    // the input, but we guard the array too in case of edge cases.
    const file = e.target.files?.[0];
    if (!submissionId || !file) return;

    setFiles((prev) => [...prev, { name: file.name, status: "uploading" }]);
    const result = await uploadImage(file, submissionId, contextKey);
    setFiles((prev) =>
      prev.map((f) =>
        f.name === file.name
          ? { ...f, status: result.ok ? "done" : "error" }
          : f
      )
    );

    // Reset input so same file can be selected again
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="border border-gray-200 px-4 py-2 text-[11px] font-medium tracking-widest uppercase hover:border-black transition-colors flex items-center gap-2"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7 1v12M1 7h12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
          />
        </svg>
        Upload {contextLabel}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {files.map((f, i) => (
            <span
              key={i}
              className={`text-[11px] font-light ${
                f.status === "error"
                  ? "text-red-600"
                  : f.status === "uploading"
                  ? "text-gray-400"
                  : "text-gray-600"
              }`}
            >
              {f.name}
              {f.status === "uploading" && " ..."}
              {f.status === "error" && " (failed)"}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
