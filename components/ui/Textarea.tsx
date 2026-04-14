"use client";

import { TextareaHTMLAttributes, forwardRef } from "react";

const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className = "", ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={`w-full border border-gray-200 p-3 text-sm font-light focus:border-black focus:outline-none resize-none transition-colors placeholder:text-gray-400 placeholder:italic ${className}`}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";
export default Textarea;
