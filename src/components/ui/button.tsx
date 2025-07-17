import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "destructive";
}

export function Button({
  children,
  className,
  size = "md",
  variant = "primary",
  ...props
}: ButtonProps) {
  const sizeClass =
    size === "sm" ? "px-3 py-1 text-sm" : size === "lg" ? "px-6 py-3 text-lg" : "px-4 py-2";

  const variantClass = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-300 text-black hover:bg-gray-400",
    destructive: "bg-red-500 text-white hover:bg-red-600",
  }[variant];

  return (
    <button
      className={cn(
        "rounded-xl transition font-medium",
        sizeClass,
        variantClass,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}