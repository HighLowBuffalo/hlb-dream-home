"use client";

import { useRef, useState } from "react";

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
    const selected = Array.from(e.target.files || []);
    if (!submissionId || selected.length === 0) return;

    for (const file of selected) {
      setFiles((prev) => [...prev, { name: file.name, status: "uploading" }]);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("submissionId", submissionId);
      formData.append("contextKey", contextKey);

      try {
        const res = await fetch("/api/images", {
          method: "POST",
          body: formData,
        });

        setFiles((prev) =>
          prev.map((f) =>
            f.name === file.name
              ? { ...f, status: res.ok ? "done" : "error" }
              : f
          )
        );
      } catch {
        setFiles((prev) =>
          prev.map((f) =>
            f.name === file.name ? { ...f, status: "error" } : f
          )
        );
      }
    }

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
        multiple
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
