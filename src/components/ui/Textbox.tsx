import React from "react";
import { cn } from "@/lib/utils";

interface TextBoxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function TextBox({ label, className, ...props }: TextBoxProps) {
  return (
    <div className="text-box">
      {label && <label className="block mb-1 font-medium">{label}</label>}
      <input
        className={cn(
          "border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full",
          className
        )}
        {...props}
      />
    </div>
  );
}