"use client";
import { RotateCw } from "lucide-react";
import { useChuChung } from "@/components/cms/ChuChung";
import { Button } from "@/components/ui/button";

/** Lỗi tính toán/kết nối: nói rõ và luôn cho thử lại — không để người dùng mắc kẹt. */
export function BaoLoi({ loi, thuLai }: { loi: string; thuLai: () => void }) {
  const c = useChuChung();
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl bg-cinnabar/10 p-4 text-sm text-cinnabar">
      <span className="flex-1">{loi}</span>
      <Button variant="secondary" size="sm" onClick={thuLai}><RotateCw aria-hidden /> {c("loi.thu_lai")}</Button>
    </div>
  );
}
