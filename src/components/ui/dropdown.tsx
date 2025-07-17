import React from "react";
import { cn } from "@/lib/utils";

interface DropdownProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Dropdown({ label, options, className, ...props }: DropdownProps) {
  return (
    <div className="dropdown">
      {label && <label className="block mb-1 font-medium">{label}</label>}
      <select
        className={cn(
          "border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full",
          className
        )}
        {...props}
      >
        <option value="">Select an option</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}