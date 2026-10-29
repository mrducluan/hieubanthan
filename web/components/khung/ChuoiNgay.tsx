"use client";
// HN-1 + SAO-V (0025, phần 4) — dòng "chuỗi ngày ghé" trên thẻ Hôm nay.
//   Khách / tài khoản chưa bật / máy chủ lỗi: chuỗi đếm trên máy (localStorage, không gửi đi) như HN-1.
//   Khách khi site đã bật tài khoản: thêm một dòng mời đăng nhập (+ mức Sao chỉ khi công tắc thưởng bật).
//   Đã đăng nhập: gọi /api/sao/chuoi một lần khi trang mở → chuỗi máy chủ (mọi máy), dài nhất, mốc thưởng, lời chúc.
//   Mất chuỗi chỉ đếm lại, câu trung tính; không màu đỏ, không đếm ngược "sắp mất chuỗi".
//   SAO-HH (0030): bỏ đúng 1 ngày + còn ngày nghỉ trong tuần → máy chủ nối chuỗi (da_nghi) — dòng "Hôm qua bạn nghỉ…";
//   đo streak_freeze_used (chỉ cờ). `onTrangThai` báo kết quả lên trang (Hẹn với chính mình lấy tiến độ từ chuỗi máy chủ).
//   KV-THANG (0032): gửi kèm {so: số ngày cá nhân engine trả} để máy chủ ghi nhật ký ghé; lịch tháng này (chấm ngày đã ghé —
//   máy chủ trả, không thì nhật ký máy); chạm mốc chuỗi → nút chia sẻ (thẻ ngày sẵn có), không link trống.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Flame, Gift, Leaf, Share2 } from "lucide-react";
import { ghi } from "@/lib/do-luong";
import { loiChuoiMay, loiChuoiMayChu, loiMoiKhach, type TrangThaiChuoi } from "@/lib/chuoi-ngay";
import type { HoSo } from "@/lib/hoso";
import { oLichThang, THU_NGAN } from "@/lib/lich-thang";
import { maMoiNgay, taoLinkNgay } from "@/components/chia-se/NutChiaSeNgay";
import { guiHoacChep } from "@/components/chia-se/GuiLink";

const KHOA_DO = "hbt.chuoi_do";

/** Đo chart_interacted{kind:chuoi_ngay} tối đa một lần mỗi ngày trên máy này. */
function doMotLanMoiNgay(ngay: string, chuoi: number, moi: boolean) {
  try {
    if (localStorage.getItem(KHOA_DO) === ngay) return;
    localStorage.setItem(KHOA_DO, ngay);
  } catch { /* chế độ riêng tư: vẫn đo, chấp nhận trùng */ }
  ghi("chart_interacted", { kind: "chuoi_ngay", chuoi, moi: moi ? 1 : 0 });
}

export function ChuoiNgay({ chuoiMay, batDauLaiMay, ngay, onTrangThai, so, ngayGheMay = [], hoSo }: {
  chuoiMay: number; batDauLaiMay: boolean; ngay: string; onTrangThai?: (tt: TrangThaiChuoi) => void;
  /** KV-THANG: số ngày cá nhân hôm nay (engine) → máy chủ ghi nhật ký; ngày đã ghé tháng này theo nhật ký máy; hồ sơ để chia sẻ. */
  so?: number; ngayGheMay?: number[]; hoSo?: HoSo;
}) {
  const [tt, setTt] = useState<TrangThaiChuoi | null>(null);
  const [daChep, setDaChep] = useState(false);
  const daGoi = useRef(false);
  const bao = useRef(onTrangThai);
  bao.current = onTrangThai;

  useEffect(() => {
    if (daGoi.current) return;
    // Một lần mỗi lần mở trang (kể cả StrictMode chạy effect hai lần) — không huỷ khi dọn effect, vì lần chạy lại bỏ qua.
    daGoi.current = true;
    fetch("/api/sao/chuoi", { method: "POST", cache: "no-store", headers: { "content-type": "application/json" }, body: JSON.stringify(so ? { so } : {}) })
      .then((r) => (r.ok ? (r.json() as Promise<TrangThaiChuoi>) : null))
      .then((v) => {
        const d: TrangThaiChuoi = v && typeof v === "object" ? v : { tai_khoan: false };
        setTt(d);
        bao.current?.(d);
        if (d.tai_khoan && d.dang_nhap && d.san_sang) {
          doMotLanMoiNgay(d.ngay, d.chuoi, d.moi);
          if (d.sao > 0) ghi("credit_earned", { kind: "chuoi", so_sao: d.sao, chuoi: d.chuoi });
          if (d.da_nghi && d.moi) ghi("streak_freeze_used", { chuoi: d.chuoi });
        }
      })
      .catch(() => { const d: TrangThaiChuoi = { tai_khoan: false }; setTt(d); bao.current?.(d); }); // im lặng: giữ chuỗi máy
  }, []);

  const mayChu = tt && tt.tai_khoan && tt.dang_nhap && tt.san_sang ? tt : null;
  const khach = tt && tt.tai_khoan && !tt.dang_nhap ? tt : null;
  const loi = mayChu ? loiChuoiMayChu(mayChu) : loiChuoiMay(chuoiMay, batDauLaiMay);
  // Lịch tháng này: máy chủ (0032) → nhật ký máy. Hôm nay luôn sáng (đang ghé).
  const [nam, thang, homNay] = ngay.split("-").map(Number) as [number, number, number];
  const ghe = new Set([...(mayChu?.ngay_ghe_thang ?? ngayGheMay), homNay]);
  // Chạm mốc (vừa nhận Sao, hoặc chuỗi tròn 7 ngày trong lượt ghé mới) → mời chia sẻ bằng thẻ ngày sẵn có.
  const chuoiHien = mayChu ? mayChu.chuoi : chuoiMay;
  const chamMoc = chuoiHien >= 7 && chuoiHien % 7 === 0 && (mayChu ? mayChu.moi : true);
  async function chiaSe() {
    if (!hoSo) return;
    const tu = maMoiNgay();
    ghi("share_created", { kind: "chuoi_moc", ma_moi: tu });
    const { url } = await taoLinkNgay(hoSo, tu);
    const chu = `Mình vừa ghé Hôm nay ${chuoiHien} ngày liền. Còn bạn hôm nay là ngày mấy?`;
    const kq = await guiHoacChep({ title: "Hôm nay của bạn", text: chu, url }, `${chu} ${url}`);
    if (kq === "da_chep") { setDaChep(true); setTimeout(() => setDaChep(false), 2500); }
  }

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
      {loi.nghi && (
        <p className="inline-flex items-center gap-1.5 text-xs" data-testid="chuoi-nghi">
          <Leaf className="size-3.5 text-jade" aria-hidden />{loi.nghi}
        </p>
      )}
      {loi.moc && <p className="text-xs" data-testid="chuoi-moc">{loi.moc}</p>}
      {chamMoc && hoSo && (
        <p>
          <button type="button" onClick={() => void chiaSe()} className="vung-cham inline-flex min-h-8 items-center gap-1 text-xs font-medium text-gold hover:underline" data-testid="chuoi-chia-se">
            {daChep ? <Check className="size-3.5" aria-hidden /> : <Share2 className="size-3.5" aria-hidden />}{daChep ? "Đã chép link" : `Chia sẻ ${chuoiHien} ngày liền`}
          </button>
        </p>
      )}
      <div className="grid w-full max-w-[16rem] grid-cols-7 gap-0.5 pt-1" role="img" aria-label={`Lịch tháng ${thang}: ${ghe.size} ngày đã ghé`} data-testid="chuoi-lich" data-so-ngay={ghe.size}>
        {THU_NGAN.map((t) => <span key={t} className="text-center text-[0.55rem] uppercase tracking-wider text-fg-faint">{t}</span>)}
        {oLichThang(nam, thang).map((d, i) => (
          <span key={i} className={`mx-auto grid size-5 place-items-center rounded-full text-[0.6rem] tabular-nums ${d === null ? "" : ghe.has(d) ? "bg-gold font-semibold text-bg" : d === homNay ? "border border-gold text-gold" : "text-fg-faint"}`}
            data-ghe={d !== null && ghe.has(d) ? 1 : undefined}>{d ?? ""}</span>
        ))}
      </div>
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
