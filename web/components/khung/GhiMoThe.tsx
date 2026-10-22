"use client";
import { useEffect } from "react";
import { ghi, lanDauTrongPhien, maMoiTuToken, nhoMaMoi } from "@/lib/do-luong";

// Trang thẻ công khai là server component — mảnh này chỉ ghi share_clicked + nhớ mã để gán nguồn.
export function GhiMoThe({ ma }: { ma: string }) {
  useEffect(() => {
    const m = maMoiTuToken(ma);
    nhoMaMoi(m);
    ghi("share_clicked", { kind: "card", ma_moi: m });
  }, [ma]);
  return null;
}

/** TCS-1: thẻ có mã ?tu= suy từ mã thẻ (vd "hp.<10 hex>") — người mở link bị cắt mất ?tu vẫn được gán nguồn. Cùng khoá
 *  phiên với GhiVaoTrang → không ghi share_clicked hai lần khi link còn nguyên ?tu. */
export function GhiTu({ tu }: { tu: string }) {
  useEffect(() => {
    nhoMaMoi(tu);
    if (lanDauTrongPhien(`tu.${tu}`)) ghi("share_clicked", { kind: tu.split(".")[0], ma_moi: tu });
  }, [tu]);
  return null;
}
