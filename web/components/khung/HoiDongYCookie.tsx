"use client";
// Hộp hỏi đồng ý cookie đo lường (chỉ hiện khi có cài GTM/GA). Không có ô tích sẵn; "Từ chối" ngang hàng "Đồng ý".
import Link from "@/components/khung/Lien";
import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDuong, useNgonNgu } from "@/components/khung/NgonNgu";
import { CHU_KHUNG } from "@/lib/khung-en";
import { coGoogle, docLuaChon, ghiLuaChon, hoiLai, HOI_DONG_Y, SU_KIEN, type LuaChon } from "@/lib/dong-y";

export function HoiDongYCookie() {
  const [hien, setHien] = useState(false);
  const { ngonNgu } = useNgonNgu();
  const en = ngonNgu === "en";
  const k = CHU_KHUNG[ngonNgu];
  const d = useDuong();
  useEffect(() => {
    if (!coGoogle()) return;
    setHien(HOI_DONG_Y && docLuaChon() === null);   // tắt hỏi khi mở trang: chỉ hiện khi bấm "Tuỳ chọn cookie"
    const nghe = (e: Event) => setHien((e as CustomEvent<LuaChon | null>).detail === null);
    window.addEventListener(SU_KIEN, nghe);
    return () => window.removeEventListener(SU_KIEN, nghe);
  }, []);
  if (!hien) return null;
  return (
    <div role="dialog" aria-live="polite" aria-label={k.cookie_hoi} data-testid="hoi-dong-y-cookie"
      className="glass fixed inset-x-3 bottom-24 z-50 mx-auto max-w-xl rounded-2xl p-4 shadow-xl md:bottom-6">
      <div className="flex gap-3">
        <Cookie className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden />
        <p className="text-sm leading-relaxed text-fg-muted">
          {k.cookie_loi}{" "}
          <Link href={en ? d("/chinh-sach-rieng-tu") : "/chinh-sach-rieng-tu#trinh-duyet"} className="text-gold underline">{k.cookie_chi_tiet}</Link>
        </p>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={() => ghiLuaChon("tu_choi")}>{k.cookie_tu_choi}</Button>
        <Button size="sm" onClick={() => ghiLuaChon("dong_y")}>{k.cookie_dong_y}</Button>
      </div>
    </div>
  );
}

/** Link ở chân trang để mở lại hộp hỏi. */
export function NutTuyChonCookie() {
  const [co, setCo] = useState(false);
  const k = CHU_KHUNG[useNgonNgu().ngonNgu];
  useEffect(() => setCo(coGoogle()), []);
  if (!co) return null;
  return <button type="button" onClick={hoiLai} className="vung-cham underline underline-offset-2 hover:text-fg">{k.tuy_chon_cookie}</button>;
}
