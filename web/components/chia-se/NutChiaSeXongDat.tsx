"use client";
// Thẻ xông đất theo năm (khâu MỜI, mùa Tết): link /tuoi-xong-dat/{năm}?tu=xd.<ngẫu nhiên> + ảnh /og/xong-dat. Thẻ chỉ mang
// dữ liệu công khai của NĂM (can chi, mùng 1, giờ hoàng đạo, hướng) — KHÔNG tuổi gia chủ, KHÔNG danh sách tuổi hợp (suy ngược
// được con giáp gia chủ — docs/THE-CHIA-SE.md). Không cần ký mã: không có gì riêng của người gửi.
import { useState } from "react";
import { Check, Download, Share2 } from "lucide-react";
import { useChuChung } from "@/components/cms/ChuChung";
import { Button } from "@/components/ui/button";
import { ghi, maNgauNhien } from "@/lib/do-luong";
import { duongXongDatNam } from "@/lib/tuoi-dan-gian";
import { ChepTay, guiHoacChep } from "@/components/chia-se/GuiLink";

export const maMoiXongDat = () => `xd.${maNgauNhien(10)}`;

export function NutChiaSeXongDat({ nam, canChi, className = "", nho = false }: {
  nam: number; canChi?: string; className?: string; nho?: boolean;
}) {
  const [dang, setDang] = useState(false);
  const [tu, setTu] = useState<string | null>(null);
  const [daChep, setDaChep] = useState(false);
  const [chepTay, setChepTay] = useState<string | null>(null);
  const c = useChuChung();

  async function chiaSe() {
    setDang(true); setChepTay(null);
    try {
      const ma = maMoiXongDat();
      ghi("share_created", { kind: "xong_dat", ma_moi: ma });
      setTu(ma);
      const u = new URL(duongXongDatNam(nam), window.location.origin);
      u.searchParams.set("tu", ma);
      const url = u.toString();
      const chu = `Tết ${canChi ? `${canChi} ` : ""}${nam} nhà mình nên mời tuổi nào xông đất? Gõ năm sinh gia chủ là biết 3 tuổi hợp.`;
      const kq = await guiHoacChep({ title: `Tuổi xông đất Tết ${nam}`, text: chu, url }, `${chu} ${url}`);
      if (kq === "da_chep") { setDaChep(true); setTimeout(() => setDaChep(false), 2500); }
      else if (kq === "khong_duoc") setChepTay(url);
    } finally {
      setDang(false);
    }
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <Button size={nho ? "sm" : "md"} variant="secondary" onClick={() => void chiaSe()} disabled={dang} data-testid="chia-se-xong-dat">
        {daChep ? <Check aria-hidden /> : <Share2 aria-hidden />}{daChep ? c("chia_se.da_chep") : dang ? c("chia_se.dang_tao") : c("chia_se.xong_dat")}
      </Button>
      {/* Bản dọc 1080×1350, QR trỏ đúng link vừa chia sẻ (?tu=). */}
      {tu && (
        <a href={`/og/xong-dat?nam=${nam}&tu=${tu}&khung=doc`} download={`tuoi-xong-dat-tet-${nam}.png`}
          className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg" data-testid="tai-anh-xong-dat">
          <Download className="size-4" aria-hidden /> {c("chia_se.tai_story")}
        </a>
      )}
      {chepTay && <ChepTay url={chepTay} className="w-full" />}
    </div>
  );
}
