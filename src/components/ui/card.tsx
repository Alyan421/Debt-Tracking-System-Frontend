// card.tsx
import React from "react";
import { cn } from "@/lib/utils";

export function Card({ children, className }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl shadow-md bg-white", className)}>{children}</div>;
}

export function CardContent({ children, className }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4", className)}>{children}</div>;
}