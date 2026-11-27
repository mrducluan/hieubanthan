"use client";
// Chặng 3.2 — "Năm nay lá số, gương mặt và bàn tay nói gì?": ba cách nhìn đọc riêng, không gộp điểm. Có hồ sơ thì dùng
// ngày sinh + giới tính của hồ sơ (không hỏi lại); thiếu mới hỏi, giới tính phải tự chọn (không mặc định). Chữ cố định ở
// lib/chu/nhan-tuong.ts; tên sách + câu trích chỉ trong "Vì sao nói vậy".
import { useState } from "react";
import { BookOpen, Hand, Sparkles } from "lucide-react";
import { ViSao } from "@/components/luan-giai/HopNoiBat";
import { useChuNhanTuong } from "@/components/nhan-tuong/chu-nhan-tuong";
import { ghi } from "@/lib/do-luong";
import { ngaySinhIso, useHoSo } from "@/lib/hoso";
import { loiTheoNgonNgu } from "@/lib/loi-ngon-ngu";
import { kemNgonNgu } from "@/lib/sao-client";

interface KetQuaDoiChieu {
  chuyen_huong_tuoi?: { tuoi: number; thong_bao: string };
  khung?: { tieu_de: string; phu_de: string; ranh_gioi: string };
  goc_menh_nam_nay?: { nhan: string; nam_xem: number; can_chi_nam: string; nhat_chu: string; loi_nhac_nam: string };
  goc_tuong_luu_nien?: { nhan: string; tuoi_mu: number; bo_vi_ten: string; han: string; loi_quan_sat: string };
  goc_chi_tay_dong_tay?: {
    nhan: string;
    sach_co_dien: string;
    hai_tay_nhan_xet: string;
    diem_doi_chieu: { ma: string; ten: string; nguyen_van_en: string; y_ung_dung: string }[];
  };
}

type GioiTinh = "nam" | "nu";
type HaiTay = "can_doi" | "thuan_troi" | "khong_thuan_troi";

export function DoiChieuTuongMenh({ moDun = "nhantuong" }: { moDun?: "nhantuong" | "chitay" }) {
  const { t, en } = useChuNhanTuong();
  const hs = useHoSo();
  const nsHoSo = hs ? ngaySinhIso(hs) : "";
  const gtHoSo: GioiTinh | "" = hs?.gioi_tinh === "nam" || hs?.gioi_tinh === "nu" ? hs.gioi_tinh : "";
  const [nsNhap, setNsNhap] = useState("");
  const [gtNhap, setGtNhap] = useState<GioiTinh | "">("");
  const [haiTay, setHaiTay] = useState<HaiTay>("can_doi");
  const [dangTai, setDangTai] = useState(false);
  const [kq, setKq] = useState<KetQuaDoiChieu | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  const ngaySinh = nsHoSo || nsNhap;
  const gioiTinh = gtHoSo || gtNhap;
  const du = !!ngaySinh && !!gioiTinh;

  async function xemDoiChieu(e: React.FormEvent) {
    e.preventDefault();
    if (!du) return;
    setDangTai(true);
    setLoi(null);
    setKq(null);
    try {
      const url = "/api/nhan-tuong/doi-chieu-menh";
      const res = await fetch(url, kemNgonNgu(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ngay_sinh: ngaySinh,
          gioi_tinh: gioiTinh,
          gio_sinh: nsHoSo && hs?.gio && hs.do_tin_gio !== "unknown" ? hs.gio : null,
          do_lech_hai_tay: haiTay,
        }),
      }));
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoi(loiTheoNgonNgu(body?.error, en, t("dctm.loi")));
        return;
      }
      setKq(body as KetQuaDoiChieu);
      ghi("chart_interacted", { mo_dun: moDun, kind: "doi_chieu_menh_xem", hai_tay: haiTay, tu_ho_so: !!nsHoSo });
    } catch {
      setLoi(t("dctm.loi_mang"));
    } finally {
      setDangTai(false);
    }
  }

  const ngayHien = nsHoSo ? nsHoSo.split("-").reverse().join("/") : "";

  return (
    <section className="mx-auto my-8 max-w-5xl rounded-2xl border border-line/80 bg-surface/35 p-5 sm:p-6" data-testid="doi-chieu-tuong-menh">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gold">{t("dctm.nho")}</p>
          <h2 className="mt-1 text-lg font-semibold text-fg">{t("dctm.tieu_de")}</h2>
        </div>
        <Hand className="size-4 text-gold" aria-hidden />
      </div>

      <form onSubmit={xemDoiChieu} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
        {nsHoSo ? (
          <p className="text-sm text-fg-muted sm:col-span-2 sm:self-end" data-testid="dctm-theo-ho-so">
            {t("dctm.theo_ho_so", { ngay: ngayHien })}
            {gtHoSo && <>, {t("dctm.gt_theo_ho_so", { gt: t(gtHoSo === "nam" ? "dctm.nam" : "dctm.nu").toLowerCase() })}</>}
          </p>
        ) : (
          <div>
            <label htmlFor="dctm-ns" className="block text-xs text-fg-muted">{t("dctm.ns")}</label>
            <input id="dctm-ns" data-testid="dctm-ngay-sinh" type="date" value={nsNhap} onChange={(e) => setNsNhap(e.target.value)} required
              className="mt-1 h-11 w-full rounded-xl border border-line bg-bg/70 px-3 text-sm text-fg" />
          </div>
        )}
        {!gtHoSo && (
          <div>
            <label htmlFor="dctm-gt" className="block text-xs text-fg-muted">{t("dctm.gt")}</label>
            <select id="dctm-gt" data-testid="dctm-gioi-tinh" value={gtNhap} required onChange={(e) => setGtNhap(e.target.value as GioiTinh | "")}
              className="mt-1 h-11 w-full rounded-xl border border-line bg-bg/70 px-3 text-sm text-fg">
              <option value="" disabled>{t("dctm.gt_chon")}</option>
              <option value="nam">{t("dctm.nam")}</option>
              <option value="nu">{t("dctm.nu")}</option>
            </select>
          </div>
        )}
        <div>
          <label htmlFor="dctm-tay" className="block text-xs text-fg-muted">{t("dctm.tay")}</label>
          <select id="dctm-tay" value={haiTay} onChange={(e) => setHaiTay(e.target.value as HaiTay)}
            className="mt-1 h-11 w-full rounded-xl border border-line bg-bg/70 px-3 text-sm text-fg">
            <option value="can_doi">{t("dctm.tay_can_doi")}</option>
            <option value="thuan_troi">{t("dctm.tay_thuan")}</option>
            <option value="khong_thuan_troi">{t("dctm.tay_khong")}</option>
          </select>
        </div>
        <div className="flex items-end">
          <button type="submit" disabled={dangTai || !du} data-testid="dctm-nut-xem"
            className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-gold px-4 text-sm font-semibold text-bg hover:opacity-90 disabled:opacity-50">
            <Sparkles className="size-3.5" aria-hidden />
            {dangTai ? t("dctm.dang") : t("dctm.nut")}
          </button>
        </div>
      </form>

      {loi && <p role="alert" className="mt-3 text-sm text-amber-300">{loi}</p>}

      {kq?.chuyen_huong_tuoi && (
        <p className="mt-4 rounded-xl border border-line/60 bg-bg/50 p-3 text-sm text-fg-muted">{kq.chuyen_huong_tuoi.thong_bao}</p>
      )}

      {kq?.goc_menh_nam_nay && kq?.goc_tuong_luu_nien && kq?.goc_chi_tay_dong_tay && (
        <div className="mt-5 space-y-4" data-testid="dctm-ket-qua">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-line/70 bg-bg/50 p-4 text-sm">
              <p className="text-xs font-semibold text-gold">{kq.goc_menh_nam_nay.nhan}</p>
              <p className="mt-1 font-medium text-fg">
                {t("dctm.ban", { x: kq.goc_menh_nam_nay.nhat_chu })} · {kq.goc_menh_nam_nay.nam_xem} ({kq.goc_menh_nam_nay.can_chi_nam})
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{kq.goc_menh_nam_nay.loi_nhac_nam}</p>
            </div>
            <div className="rounded-xl border border-line/70 bg-bg/50 p-4 text-sm">
              <p className="text-xs font-semibold text-gold">{kq.goc_tuong_luu_nien.nhan}</p>
              <p className="mt-1 font-medium text-fg">{kq.goc_tuong_luu_nien.bo_vi_ten}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{kq.goc_tuong_luu_nien.loi_quan_sat}</p>
              {kq.goc_tuong_luu_nien.han && <ViSao nho canCu={[`「${kq.goc_tuong_luu_nien.han}」`]} />}
            </div>
          </div>

          <div className="rounded-xl border border-line/70 bg-bg/50 p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-gold">
              <BookOpen className="size-3.5" aria-hidden /> {kq.goc_chi_tay_dong_tay.nhan}
            </p>
            <p className="mt-1.5 text-sm text-fg">{kq.goc_chi_tay_dong_tay.hai_tay_nhan_xet}</p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {kq.goc_chi_tay_dong_tay.diem_doi_chieu.map((d) => (
                <div key={d.ma} className="min-w-0 rounded-lg border border-line/60 bg-surface/40 p-3 text-sm">
                  <p className="font-semibold text-fg">{d.ten}</p>
                  <p className="mt-1 leading-relaxed text-fg-muted">{d.y_ung_dung}</p>
                </div>
              ))}
            </div>
            <ViSao nho canCu={[
              kq.goc_chi_tay_dong_tay.sach_co_dien,
              ...kq.goc_chi_tay_dong_tay.diem_doi_chieu.map((d) => `${d.ten}: “${d.nguyen_van_en}”`),
            ].filter(Boolean)} />
            {kq.khung?.ranh_gioi && <p className="mt-3 text-xs text-fg-faint">{kq.khung.ranh_gioi}</p>}
          </div>
        </div>
      )}
    </section>
  );
}
