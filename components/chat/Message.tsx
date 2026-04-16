import QuestionFlags, { type FlagType } from "@/components/ui/QuestionFlags";

interface MessageProps {
  sender: "hlb" | "user";
  text: string;
  extractedKeys?: string[];
  flags?: Record<string, Set<FlagType>>;
  onToggleFlag?: (questionKey: string, flag: FlagType) => void;
}

export default function Message({
  sender,
  text,
  extractedKeys,
  flags,
  onToggleFlag,
}: MessageProps) {
  const isHlb = sender === "hlb";
  const hasFlagBar = !isHlb && extractedKeys && extractedKeys.length > 0;

  return (
    <div className={`flex flex-col ${isHlb ? "items-start" : "items-end"} mb-4`}>
      <div
        className={`max-w-[80%] px-4 py-3 text-sm font-light leading-relaxed ${
          isHlb ? "bg-gray-100 text-black" : "bg-black text-white"
        }`}
      >
        {text}
      </div>
      {hasFlagBar && (
        <div className="mt-1 max-w-[80%]">
          {extractedKeys!.map((key) => (
            <div key={key} className="flex justify-end">
              <QuestionFlags
                activeFlags={flags?.[key] || new Set()}
                onToggle={(flag) => onToggleFlag?.(key, flag)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
