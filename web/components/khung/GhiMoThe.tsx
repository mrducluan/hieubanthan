"use client";
import { useEffect } from "react";
import { ghi, maMoiTuToken, nhoMaMoi } from "@/lib/do-luong";

// Trang thẻ công khai là server component — mảnh này chỉ ghi share_clicked + nhớ mã để gán nguồn.
export function GhiMoThe({ ma }: { ma: string }) {
  useEffect(() => {
    const m = maMoiTuToken(ma);
    nhoMaMoi(m);
    ghi("share_clicked", { kind: "card", ma_moi: m });
  }, [ma]);
  return null;
}
