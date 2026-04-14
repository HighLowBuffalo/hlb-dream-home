"use client";

import { useRef, useState } from "react";

interface UploadWidgetProps {
  contextKey: string;
  contextLabel: string;
  submissionId?: string;
  onUpload?: (file: File) => void;
}

export default function UploadWidget({
  contextLabel,
  onUpload,
}: UploadWidgetProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selected]);
    selected.forEach((f) => onUpload?.(f));
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
              className="text-[11px] text-gray-400 font-light"
            >
              {f.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
