"use client";

import { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "outline";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-black text-white hover:opacity-80",
  outline:
    "border border-gray-200 text-black hover:border-black",
};

export default function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`px-8 py-3 text-xs font-medium tracking-widest uppercase transition-all ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
