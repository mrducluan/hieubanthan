"use client";
// Thẻ xông đất theo năm (khâu MỜI, mùa Tết): link /tuoi-xong-dat/{năm}?tu=xd.<ngẫu nhiên> + ảnh /og/xong-dat. Thẻ chỉ mang
// dữ liệu công khai của NĂM (can chi, mùng 1, giờ hoàng đạo, hướng) — KHÔNG tuổi gia chủ, KHÔNG danh sách tuổi hợp (suy ngược
// được con giáp gia chủ — docs/THE-CHIA-SE.md). Không cần ký mã: không có gì riêng của người gửi.
import { useState } from "react";
import { useChuChung } from "@/components/cms/ChuChung";
import { ghi, maNgauNhien } from "@/lib/do-luong";
import { duongXongDatNam } from "@/lib/tuoi-dan-gian";
import { HopGui, NutRuBan } from "@/components/chia-se/HopChiaSe";
import { CTA_CHIA_SE, loiNhanThe } from "@/lib/loi-nhan-chia-se";

export const maMoiXongDat = () => `xd.${maNgauNhien(10)}`;

export function NutChiaSeXongDat({ nam, canChi, className = "", nho = false }: {
  nam: number; canChi?: string; className?: string; nho?: boolean;
}) {
  const [mo, setMo] = useState(false);
  const [gui, setGui] = useState<{ url: string; tu: string } | null>(null);
  const c = useChuChung();

  function chiaSe() {
    setMo(true);
    if (gui) return;
    const ma = maMoiXongDat();
    ghi("share_created", { kind: "xong_dat", ma_moi: ma });
    const u = new URL(duongXongDatNam(nam), window.location.origin);
    u.searchParams.set("tu", ma);
    setGui({ url: u.toString(), tu: ma });
  }

  return (
    <div className={className}>
      <NutRuBan nhan={c("chia_se.xong_dat")} phu={CTA_CHIA_SE.xong_dat.phu} nho={nho} onClick={chiaSe} testId="chia-se-xong-dat" />
      <HopGui mo={mo} onMoChange={setMo} tieuDeHop={`Tuổi xông đất Tết ${nam}`}
        gui={gui && {
          kind: "xong_dat", url: gui.url, tu: gui.tu, tieuDe: `Tuổi xông đất Tết ${nam}`,
          // Bản dọc 1080×1350, QR trỏ đúng link vừa chia sẻ (?tu=).
          anh: `/og/xong-dat?nam=${nam}&tu=${gui.tu}`, anhDoc: `/og/xong-dat?nam=${nam}&tu=${gui.tu}&khung=doc`,
          tenTep: `tuoi-xong-dat-tet-${nam}.png`, testIdAnh: "tai-anh-xong-dat",
          loiNhan: loiNhanThe("xong_dat", { nam, canChi }),
        }} />
    </div>
  );
}
