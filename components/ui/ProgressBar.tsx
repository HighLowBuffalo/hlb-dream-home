interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

export default function ProgressBar({ current, total, label }: ProgressBarProps) {
  const pct = Math.min(100, Math.round((current / total) * 100));

  return (
    <div className="flex items-center gap-3 w-full">
      {label && (
        <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-gray-400 shrink-0">
          {label}
        </p>
      )}
      <div className="flex-1 h-[2px] bg-gray-200 relative">
        <div
          className="absolute top-0 left-0 h-full bg-black transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] font-medium tracking-widest text-gray-400 shrink-0">
        {current}/{total}
      </span>
    </div>
  );
}
