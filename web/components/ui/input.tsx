import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-12 w-full rounded-xl border border-line bg-bg/60 px-4 text-base text-fg placeholder:text-fg-faint/70",
        "transition-colors focus-visible:border-gold/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/30",
        "disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "h-12 w-full appearance-none rounded-xl border border-line bg-bg/60 px-4 text-base text-fg",
        "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%228%22><path d=%22M1 1l5 5 5-5%22 stroke=%22%23b3b1cf%22 fill=%22none%22 stroke-width=%221.5%22/></svg>')] bg-[right_1rem_center] bg-no-repeat pr-10",
        "focus-visible:border-gold/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/30",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = "Select";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full resize-none rounded-xl border border-line bg-bg/60 px-4 py-3 text-base text-fg placeholder:text-fg-faint/70",
        "focus-visible:border-gold/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/30",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
