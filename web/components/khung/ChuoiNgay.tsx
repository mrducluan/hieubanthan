"use client";
// HN-1 + SAO-V (0025, phần 4) — dòng "chuỗi ngày ghé" trên thẻ Hôm nay.
//   Khách / tài khoản chưa bật / máy chủ lỗi: chuỗi đếm trên máy (localStorage, không gửi đi) như HN-1.
//   Khách khi site đã bật tài khoản: thêm một dòng mời đăng nhập (+ mức Sao chỉ khi công tắc thưởng bật).
//   Đã đăng nhập: gọi /api/sao/chuoi một lần khi trang mở → chuỗi máy chủ (mọi máy), dài nhất, mốc thưởng, lời chúc.
//   Mất chuỗi chỉ đếm lại, câu trung tính; không màu đỏ, không đếm ngược "sắp mất chuỗi".
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Flame, Gift } from "lucide-react";
import { ghi } from "@/lib/do-luong";
import { loiChuoiMay, loiChuoiMayChu, loiMoiKhach, type TrangThaiChuoi } from "@/lib/chuoi-ngay";

const KHOA_DO = "hbt.chuoi_do";

/** Đo chart_interacted{kind:chuoi_ngay} tối đa một lần mỗi ngày trên máy này. */
function doMotLanMoiNgay(ngay: string, chuoi: number, moi: boolean) {
  try {
    if (localStorage.getItem(KHOA_DO) === ngay) return;
    localStorage.setItem(KHOA_DO, ngay);
  } catch { /* chế độ riêng tư: vẫn đo, chấp nhận trùng */ }
  ghi("chart_interacted", { kind: "chuoi_ngay", chuoi, moi: moi ? 1 : 0 });
}

export function ChuoiNgay({ chuoiMay, batDauLaiMay, ngay }: { chuoiMay: number; batDauLaiMay: boolean; ngay: string }) {
  const [tt, setTt] = useState<TrangThaiChuoi | null>(null);
  const daGoi = useRef(false);

  useEffect(() => {
    if (daGoi.current) return;
    // Một lần mỗi lần mở trang (kể cả StrictMode chạy effect hai lần) — không huỷ khi dọn effect, vì lần chạy lại bỏ qua.
    daGoi.current = true;
    fetch("/api/sao/chuoi", { method: "POST", cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<TrangThaiChuoi>) : null))
      .then((v) => {
        const d: TrangThaiChuoi = v && typeof v === "object" ? v : { tai_khoan: false };
        setTt(d);
        if (d.tai_khoan && d.dang_nhap && d.san_sang) {
          doMotLanMoiNgay(d.ngay, d.chuoi, d.moi);
          if (d.sao > 0) ghi("credit_earned", { kind: "chuoi", so_sao: d.sao, chuoi: d.chuoi });
        }
      })
      .catch(() => setTt({ tai_khoan: false })); // im lặng: giữ chuỗi máy
  }, []);

  const mayChu = tt && tt.tai_khoan && tt.dang_nhap && tt.san_sang ? tt : null;
  const khach = tt && tt.tai_khoan && !tt.dang_nhap ? tt : null;
  const loi = mayChu ? loiChuoiMayChu(mayChu) : loiChuoiMay(chuoiMay, batDauLaiMay);

  useEffect(() => {
    // Khách / chưa bật tài khoản: đo chuỗi máy (một lần mỗi ngày). Người đăng nhập đo ở trên bằng số máy chủ.
    if (tt && !mayChu) doMotLanMoiNgay(ngay, chuoiMay, false);
  }, [tt, mayChu, ngay, chuoiMay]);

  return (
    <div className="space-y-1 text-sm text-fg-muted" data-testid="chuoi-ngay" data-nguon={mayChu ? "tai_khoan" : "may"}>
      <p className="inline-flex flex-wrap items-center gap-x-1.5">
        <Flame className="size-4 text-gold" aria-hidden />
        <span data-testid="chuoi-chinh">{loi.chinh}</span>
        {loi.dai_nhat && <span data-testid="chuoi-dai-nhat">· {loi.dai_nhat}</span>}
      </p>
      {loi.moc && <p className="text-xs" data-testid="chuoi-moc">{loi.moc}</p>}
      {loi.chuc_mung && (
        <p role="status" className="inline-flex items-center gap-1.5 text-jade" data-testid="chuoi-sao">
          <Gift className="size-4" aria-hidden />{loi.chuc_mung}
        </p>
      )}
      {khach && (
        <p className="text-xs" data-testid="chuoi-moi-dang-nhap">
          <Link href={`/dang-nhap?tiep=${encodeURIComponent("/hom-nay")}`} className="text-gold hover:underline">{loiMoiKhach(khach)}</Link>
        </p>
      )}
    </div>
  );
}
