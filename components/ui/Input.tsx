"use client";

import { InputHTMLAttributes, forwardRef } from "react";

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full border-0 border-b border-gray-200 pb-3 pt-3 text-sm font-light focus:border-black focus:outline-none transition-colors placeholder:text-gray-400 ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
export default Input;
