import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors duration-150 outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Input };
