"use client";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface SaveIndicatorProps {
  status: SaveStatus;
}

export default function SaveIndicator({ status }: SaveIndicatorProps) {
  if (status === "idle") return null;

  return (
    <span
      className={`text-[10px] font-medium tracking-widest uppercase transition-opacity ${
        status === "error" ? "text-red-600" : "text-gray-400"
      }`}
    >
      {status === "saving" && "Saving..."}
      {status === "saved" && "Saved"}
      {status === "error" && "Save failed"}
    </span>
  );
}
