"use client";

import React from "react";

interface ProgressProps {
  value: number; // Progress value (0-100)
  color?: string; // Optional color for the progress bar
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  color = "#3b82f6",
}) => {
  return (
    <div className="w-full bg-gray-200 rounded h-2.5 overflow-hidden">
      <div
        className="h-full"
        style={{
          width: `${Math.min(Math.max(value, 0), 100)}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
};
