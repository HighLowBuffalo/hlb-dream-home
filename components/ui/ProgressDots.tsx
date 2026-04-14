interface ProgressDotsProps {
  total: number;
  current: number;
}

export default function ProgressDots({ total, current }: ProgressDotsProps) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`w-[5px] h-[5px] rounded-full transition-colors ${
            i <= current ? "bg-black" : "bg-gray-200"
          }`}
        />
      ))}
    </div>
  );
}
