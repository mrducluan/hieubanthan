"use client";
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// Sheet trượt từ dưới lên trên điện thoại, hộp giữa màn hình trên máy tính.
export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

export const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { title: string; description?: string }
>(({ className, children, title, description, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 max-h-[92dvh] overflow-y-auto border border-line bg-surface p-6 shadow-card",
        "inset-x-0 bottom-0 rounded-t-2xl pb-[max(1.5rem,env(safe-area-inset-bottom))]",
        "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl",
        "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-8 sm:data-[state=open]:slide-in-from-bottom-2 data-[state=open]:fade-in-0",
        className,
      )}
      {...props}
    >
      <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line sm:hidden" aria-hidden />
      <DialogPrimitive.Title className="font-serif text-2xl">{title}</DialogPrimitive.Title>
      {description ? (
        <DialogPrimitive.Description className="mt-1 text-sm text-fg-muted">{description}</DialogPrimitive.Description>
      ) : (
        <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
      )}
      <div className="mt-5">{children}</div>
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full p-2 text-fg-faint hover:text-fg" aria-label="Đóng">
        <X className="size-5" />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
SheetContent.displayName = "SheetContent";
