"use client";
// HCS-1 — nút chia sẻ cho TRANG công khai (kiến thức, blog, ngày tốt, lịch âm, năm, tuổi…): nội dung công khai nên không ký mã;
// link = chính trang + ?tu=tr.<ngẫu nhiên> (đo share_clicked → referral_signup như mọi thẻ). Ảnh xem trước = ảnh og:image của
// trang (đã có QR + hieuban.com). Lời nhắn soạn theo trang: câu hỏi + câu trả lời ngắn của chính trang, nỗi lo theo cụm.
import { useState } from "react";
import { usePathname } from "next/navigation";
import { HopGui, NutRuBan } from "@/components/chia-se/HopChiaSe";
import { CTA_CHIA_SE, loiNhanTrang } from "@/lib/loi-nhan-chia-se";
import { ghi, maNgauNhien } from "@/lib/do-luong";

/** Ảnh og:image của trang, đổi về đường dẫn trong site (ảnh luôn do site dựng). */
function anhCuaTrang(): string | null {
  const m = document.querySelector<HTMLMetaElement>('meta[property="og:image"]')?.content;
  if (!m) return null;
  try {
    const u = new URL(m, window.location.origin);
    return u.pathname.startsWith("/og") || u.origin === window.location.origin ? `${u.pathname}${u.search}` : null;
  } catch { return null; }
}

export function NutChiaSeTrang({ tieuDe, traLoi, className = "" }: { tieuDe?: string | null; traLoi?: string | null; className?: string }) {
  const duong = usePathname() ?? "/";
  const [mo, setMo] = useState(false);
  const [gui, setGui] = useState<{ url: string; tu: string; anh: string | null; tieuDe: string } | null>(null);

  function chiaSe() {
    setMo(true);
    if (gui) return;
    const tu = `tr.${maNgauNhien(10)}`;
    const u = new URL(duong, window.location.origin);
    u.searchParams.set("tu", tu);
    const td = (tieuDe ?? document.querySelector("h1")?.textContent ?? document.title).trim();
    ghi("share_created", { kind: "trang", ma_moi: tu });
    setGui({ url: u.toString(), tu, anh: anhCuaTrang(), tieuDe: td });
  }

  return (
    <div className={className} data-nosnippet>
      <NutRuBan nhan={CTA_CHIA_SE.trang.nhan} nho onClick={chiaSe} testId="chia-se-trang" />
      <HopGui mo={mo} onMoChange={setMo} tieuDeHop="Gửi trang này"
        gui={gui && {
          kind: "trang", url: gui.url, tu: gui.tu, tieuDe: gui.tieuDe, anh: gui.anh, tenTep: "hieu-ban-than.png",
          loiNhan: loiNhanTrang(duong, gui.tieuDe, traLoi),
        }} />
    </div>
  );
}
