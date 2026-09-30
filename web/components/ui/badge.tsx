import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wider",
  {
    variants: {
      tone: {
        gold: "bg-gold/15 text-gold",
        jade: "bg-jade/15 text-jade",
        moon: "bg-moon/15 text-moon",
        cinnabar: "bg-cinnabar/15 text-cinnabar",
        muted: "bg-surface-2 text-fg-muted",
      },
    },
    defaultVariants: { tone: "muted" },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
