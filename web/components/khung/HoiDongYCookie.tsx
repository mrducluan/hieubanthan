"use client";
// Hộp hỏi đồng ý cookie đo lường (chỉ hiện khi có cài GTM/GA). Không có ô tích sẵn; "Từ chối" ngang hàng "Đồng ý".
import Link from "next/link";
import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { coGoogle, docLuaChon, ghiLuaChon, hoiLai, SU_KIEN, type LuaChon } from "@/lib/dong-y";

export function HoiDongYCookie() {
  const [hien, setHien] = useState(false);
  useEffect(() => {
    if (!coGoogle()) return;
    setHien(docLuaChon() === null);
    const nghe = (e: Event) => setHien((e as CustomEvent<LuaChon | null>).detail === null);
    window.addEventListener(SU_KIEN, nghe);
    return () => window.removeEventListener(SU_KIEN, nghe);
  }, []);
  if (!hien) return null;
  return (
    <div role="dialog" aria-live="polite" aria-label="Đồng ý cookie đo lường" data-testid="hoi-dong-y-cookie"
      className="glass fixed inset-x-3 bottom-24 z-50 mx-auto max-w-xl rounded-2xl p-4 shadow-xl md:bottom-6">
      <div className="flex gap-3">
        <Cookie className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden />
        <p className="text-sm leading-relaxed text-fg-muted">
          Cho phép chúng tôi dùng Google Analytics (cookie đo lường) để biết trang nào hữu ích? Không gửi họ tên, ngày giờ
          sinh; không quảng cáo. Bạn đổi ý bất cứ lúc nào ở chân trang.{" "}
          <Link href="/chinh-sach-rieng-tu#trinh-duyet" className="text-gold underline">Chi tiết</Link>
        </p>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={() => ghiLuaChon("tu_choi")}>Từ chối</Button>
        <Button size="sm" onClick={() => ghiLuaChon("dong_y")}>Đồng ý</Button>
      </div>
    </div>
  );
}

/** Link ở chân trang để mở lại hộp hỏi. */
export function NutTuyChonCookie() {
  const [co, setCo] = useState(false);
  useEffect(() => setCo(coGoogle()), []);
  if (!co) return null;
  return <button type="button" onClick={hoiLai} className="underline hover:text-fg">Tuỳ chọn cookie</button>;
}
