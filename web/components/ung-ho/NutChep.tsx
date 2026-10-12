"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NutChep({ chu, nhan }: { chu: string; nhan: string }) {
  const [da, setDa] = useState(false);
  return (
    <Button variant="secondary" size="icon" aria-label={`Sao chép ${nhan}`} onClick={() => {
      void navigator.clipboard?.writeText(chu).then(() => { setDa(true); setTimeout(() => setDa(false), 2000); });
    }}>{da ? <Check aria-hidden /> : <Copy aria-hidden />}</Button>
  );
}
