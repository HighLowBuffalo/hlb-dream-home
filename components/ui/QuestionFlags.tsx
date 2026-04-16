"use client";

export type FlagType = "revisit" | "flexible";

interface QuestionFlagsProps {
  activeFlags: Set<FlagType>;
  onToggle?: (flag: FlagType) => void;
  readOnly?: boolean;
  size?: "sm" | "md";
}

const LABELS: Record<FlagType, string> = {
  revisit: "Come back to this",
  flexible: "Flexible depending on budget",
};

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="miter"
    >
      <path d="M3 1.5 V10.5 L6 8.25 L9 10.5 V1.5 Z" />
    </svg>
  );
}

function DollarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
    >
      <rect x="1.5" y="1.5" width="11" height="11" fill={filled ? "currentColor" : "none"} />
      <text
        x="7"
        y="10.25"
        textAnchor="middle"
        fontFamily="inherit"
        fontSize="9"
        fontWeight="500"
        stroke="none"
        fill={filled ? "#fff" : "currentColor"}
      >
        $
      </text>
    </svg>
  );
}

export default function QuestionFlags({
  activeFlags,
  onToggle,
  readOnly = false,
  size = "sm",
}: QuestionFlagsProps) {
  const dim = size === "sm" ? "h-5 w-5" : "h-6 w-6";

  function renderButton(type: FlagType, icon: React.ReactNode) {
    const active = activeFlags.has(type);
    const base = `group relative flex items-center justify-center ${dim} transition-colors`;
    const interactive = readOnly
      ? "cursor-default"
      : "cursor-pointer hover:text-black";
    const color = active
      ? "text-black"
      : "text-gray-400";

    return (
      <button
        type="button"
        aria-label={LABELS[type]}
        aria-pressed={active}
        onClick={readOnly ? undefined : () => onToggle?.(type)}
        disabled={readOnly}
        className={`${base} ${interactive} ${color}`}
      >
        {icon}
        <span
          role="tooltip"
          className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap border border-gray-200 bg-white px-2 py-1 text-[10px] font-medium tracking-widest uppercase text-black opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >
          {LABELS[type]}
        </span>
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-1">
      {renderButton("revisit", <BookmarkIcon filled={activeFlags.has("revisit")} />)}
      {renderButton("flexible", <DollarIcon filled={activeFlags.has("flexible")} />)}
    </div>
  );
}
