"use client";

type SaveStatus = "idle" | "saving" | "saved";

interface SaveIndicatorProps {
  status: SaveStatus;
}

export default function SaveIndicator({ status }: SaveIndicatorProps) {
  if (status === "idle") return null;

  return (
    <span className="text-[10px] font-medium tracking-widest uppercase text-gray-400 transition-opacity">
      {status === "saving" && "Saving..."}
      {status === "saved" && "Saved"}
    </span>
  );
}
