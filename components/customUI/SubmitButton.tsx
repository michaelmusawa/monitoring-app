// components/ui/SubmitButton.tsx
"use client";

import React from "react";
import { ArrowRight, Loader2 } from "lucide-react";

interface SubmitButtonProps {
  isPending: boolean;
  label?: string;
  className?: string;
}

export default function SubmitButton({
  isPending,
  label = "Submit",
  className,
}: SubmitButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isPending) {
      e.preventDefault();
    }
  };

  return (
    <button
      type="submit"
      disabled={isPending}
      onClick={handleClick}
      className={`${className} flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-white shadow transition-all hover:shadow-md ${
        isPending
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-gradient-to-r from-green-300 to-green-700 hover:from-green-600 hover:to-green-400"
      }`}
    >
      <span>{isPending ? "Processing..." : label}</span>
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <ArrowRight className="w-4 h-4" />
      )}
    </button>
  );
}
