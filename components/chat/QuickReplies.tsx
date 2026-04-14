"use client";

interface QuickRepliesProps {
  options: string[];
  selected: string[];
  multi?: boolean;
  onSelect: (value: string) => void;
}

export default function QuickReplies({
  options,
  selected,
  multi = false,
  onSelect,
}: QuickRepliesProps) {
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option)}
            className={`border px-4 py-2 text-[11px] font-medium tracking-widest uppercase transition-colors ${
              isSelected
                ? "border-black bg-black text-white"
                : "border-gray-200 text-black hover:border-black"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
