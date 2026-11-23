"use client";
// NHIP-1 — chia sẻ thẻ "Hôm nay {tên} là Ngày cá nhân N — còn bạn?": máy chủ ký mã (engine tính số), link về /hom-nay
// mang ?tu=hn.<ngẫu nhiên> (đo referral_signup, Gate 2) + &the=<mã> (ảnh xem trước khi dán vào Zalo/Messenger).
import { useState } from "react";
import { useChuChung } from "@/components/cms/ChuChung";
import { postJson } from "@/lib/goi-api";
import { hoTenList, tenGoi, type HoSo } from "@/lib/hoso";
import { ghi, maNgauNhien } from "@/lib/do-luong";
import { docQuyUocDD } from "@/lib/quy-uoc-dd";
import { HopGui, NutRuBan } from "@/components/chia-se/HopChiaSe";
import { CTA_CHIA_SE, loiNhanThe } from "@/lib/loi-nhan-chia-se";

/** Mã ?tu= của link (ngẫu nhiên, không định danh) — tạo trước để ghi share_created ngay lúc bấm. */
export const maMoiNgay = () => `hn.${maNgauNhien(10)}`;

/** Tạo link chia sẻ thẻ ngày (có ảnh). Lỗi ký mã (thiếu khoá…) → vẫn trả link /hom-nay không ảnh. */
export async function taoLinkNgay(hoSo: HoSo, tu = maMoiNgay()): Promise<{ url: string; ma: string | null; tu: string }> {
  const u = new URL("/hom-nay", window.location.origin);
  u.searchParams.set("tu", tu);
  let ma: string | null = null;
  try {
    ({ ma } = await postJson<{ ma: string }>("/api/chia-se/ngay", { ten_hien_thi: tenGoi(hoSo), ho_ten: hoTenList(hoSo), ngay: hoSo.ngay, thang: hoSo.thang, nam: hoSo.nam,
      quy_uoc_duong_doi: docQuyUocDD() }));
    u.searchParams.set("the", ma);
  } catch { /* không có ảnh vẫn chia sẻ được */ }
  return { url: u.toString(), ma, tu };
}

export function NutChiaSeNgay({ hoSo, soNgay, chuDe, className = "", nho = false, kind = "the_ngay", testId = "chia-se-the-ngay" }: {
  hoSo: HoSo; soNgay: number; chuDe?: string; className?: string; nho?: boolean; kind?: "the_ngay" | "hom_nay"; testId?: string;
}) {
  const [mo, setMo] = useState(false);
  const [dang, setDang] = useState(false);
  const [gui, setGui] = useState<{ url: string; ma: string | null; tu: string } | null>(null);
  const c = useChuChung();
  const cta = CTA_CHIA_SE.ngay;

  async function chiaSe() {
    setMo(true);
    if (gui) return;
    setDang(true);
    try {
      const tu = maMoiNgay();
      ghi("share_created", { kind, ma_moi: tu });
      setGui(await taoLinkNgay(hoSo, tu));
    } finally {
      setDang(false);
    }
  }

  return (
    <div className={className}>
      <NutRuBan nhan={c("chia_se.the_ngay")} phu={cta.phu} nho={nho} dang={dang} onClick={() => void chiaSe()} testId={testId} />
      <HopGui mo={mo} onMoChange={setMo} tieuDeHop="Gửi thẻ hôm nay" dang={dang}
        gui={gui && {
          kind, url: gui.url, tu: gui.tu, tieuDe: "Hôm nay của bạn",
          // TCS-1: ảnh dọc 1080×1350 + mã QR trỏ đúng link vừa chia sẻ (?tu=).
          anh: gui.ma ? `/og/ngay?ma=${encodeURIComponent(gui.ma)}&tu=${gui.tu}` : null,
          anhDoc: gui.ma ? `/og/ngay?ma=${encodeURIComponent(gui.ma)}&khung=doc&tu=${gui.tu}` : null,
          tenTep: "hom-nay-cua-toi.png", testIdAnh: "tai-anh-the-ngay",
          loiNhan: loiNhanThe("ngay", { so: soNgay, tuKhoa: chuDe }),
        }} />
    </div>
  );
}
