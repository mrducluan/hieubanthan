"use client";
// NHIP-1 — chia sẻ thẻ "Hôm nay {tên} là Ngày cá nhân N — còn bạn?": máy chủ ký mã (engine tính số), link về /hom-nay
// mang ?tu=hn.<ngẫu nhiên> (đo referral_signup, Gate 2) + &the=<mã> (ảnh xem trước khi dán vào Zalo/Messenger).
import { useState } from "react";
import { Check, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { postJson } from "@/lib/goi-api";
import { tenGoi, type HoSo } from "@/lib/hoso";
import { ghi, maNgauNhien } from "@/lib/do-luong";

/** Mã ?tu= của link (ngẫu nhiên, không định danh) — tạo trước để ghi share_created ngay lúc bấm. */
export const maMoiNgay = () => `hn.${maNgauNhien(10)}`;

/** Tạo link chia sẻ thẻ ngày (có ảnh). Lỗi ký mã (thiếu khoá…) → vẫn trả link /hom-nay không ảnh. */
export async function taoLinkNgay(hoSo: HoSo, tu = maMoiNgay()): Promise<{ url: string; ma: string | null; tu: string }> {
  const u = new URL("/hom-nay", window.location.origin);
  u.searchParams.set("tu", tu);
  let ma: string | null = null;
  try {
    ({ ma } = await postJson<{ ma: string }>("/api/chia-se/ngay", { ten_hien_thi: tenGoi(hoSo), ngay: hoSo.ngay, thang: hoSo.thang, nam: hoSo.nam }));
    u.searchParams.set("the", ma);
  } catch { /* không có ảnh vẫn chia sẻ được */ }
  return { url: u.toString(), ma, tu };
}

export function NutChiaSeNgay({ hoSo, soNgay, chuDe, className = "", nho = false }: {
  hoSo: HoSo; soNgay: number; chuDe?: string; className?: string; nho?: boolean;
}) {
  const [dang, setDang] = useState(false);
  const [ma, setMa] = useState<string | null>(null);
  const [daChep, setDaChep] = useState(false);

  async function chiaSe() {
    setDang(true);
    try {
      const tu = maMoiNgay();
      ghi("share_created", { kind: "the_ngay", ma_moi: tu });
      const { url, ma: m } = await taoLinkNgay(hoSo, tu);
      setMa(m);
      const chu = `Hôm nay là Ngày cá nhân ${soNgay} của mình${chuDe ? ` — ${chuDe}` : ""}. Còn bạn hôm nay là ngày mấy?`;
      if (typeof navigator.share === "function") {
        try { await navigator.share({ title: "Hôm nay của bạn", text: chu, url }); return; } catch { /* huỷ → chép */ }
      }
      try { await navigator.clipboard.writeText(`${chu} ${url}`); setDaChep(true); setTimeout(() => setDaChep(false), 2500); } catch { /* bỏ qua */ }
    } finally {
      setDang(false);
    }
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <Button size={nho ? "sm" : "md"} variant="secondary" onClick={() => void chiaSe()} disabled={dang} data-testid="chia-se-the-ngay">
        {daChep ? <Check aria-hidden /> : <Share2 aria-hidden />}{daChep ? "Đã chép link" : dang ? "Đang tạo…" : "Chia sẻ thẻ hôm nay"}
      </Button>
      {ma && (
        <a href={`/og/ngay?ma=${encodeURIComponent(ma)}`} download="hom-nay-cua-toi.png"
          className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg" data-testid="tai-anh-the-ngay">
          <Download className="size-4" aria-hidden /> Tải ảnh (đăng story)
        </a>
      )}
    </div>
  );
}
