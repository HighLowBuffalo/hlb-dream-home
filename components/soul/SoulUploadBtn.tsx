"use client";

import { useRef } from "react";

interface SoulUploadBtnProps {
  contextKey: string;
  onUpload?: (file: File) => void;
}

export default function SoulUploadBtn({ onUpload }: SoulUploadBtnProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    files.forEach((f) => onUpload?.(f));
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
    </>
  );
}
