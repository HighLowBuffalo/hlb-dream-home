"use client";

import { useRef, useState } from "react";
import { uploadImage } from "@/lib/upload";

interface SoulUploadBtnProps {
  contextKey: string;
  submissionId?: string;
}

interface UploadedFile {
  name: string;
  status: "uploading" | "done" | "error";
}

export default function SoulUploadBtn({ contextKey, submissionId }: SoulUploadBtnProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    if (!submissionId || selected.length === 0) return;

    for (const file of selected) {
      setFiles((prev) => [...prev, { name: file.name, status: "uploading" }]);
      const result = await uploadImage(file, submissionId, contextKey);
      setFiles((prev) =>
        prev.map((f) =>
          f.name === file.name
            ? { ...f, status: result.ok ? "done" : "error" }
            : f
        )
      );
    }

    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="border border-gray-200 px-3 py-1.5 text-[10px] font-medium tracking-widest uppercase hover:border-black transition-colors flex items-center gap-1.5"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6 2v8M2 6h8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
          />
        </svg>
        Add image
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleChange}
        className="hidden"
      />
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1">
          {files.map((f, i) => (
            <span
              key={i}
              className={`text-[10px] font-light ${
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
    </>
  );
}
