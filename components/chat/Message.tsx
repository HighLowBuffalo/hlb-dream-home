interface MessageProps {
  sender: "hlb" | "user";
  text: string;
}

export default function Message({ sender, text }: MessageProps) {
  const isHlb = sender === "hlb";

  return (
    <div className={`flex ${isHlb ? "justify-start" : "justify-end"} mb-4`}>
      <div
        className={`max-w-[80%] px-4 py-3 text-sm font-light leading-relaxed ${
          isHlb
            ? "bg-gray-100 text-black"
            : "bg-black text-white"
        }`}
      >
        {text}
      </div>
    </div>
  );
}
