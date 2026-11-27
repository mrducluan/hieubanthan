"use client";
// Chặng 3.2 — Khung Đối chiếu Nhịp năm Lá số & Tướng lưu niên / Chỉ tay Đông–Tây (Saint-Germain 1897).
import { useEffect, useState } from "react";
import { BookOpen, Hand, Sparkles } from "lucide-react";
import { ngaySinhIso, useHoSo } from "@/lib/hoso";

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

export function DoiChieuTuongMenh({ en = false }: { en?: boolean }) {
  const hs = useHoSo();
  const [ngaySinh, setNgaySinh] = useState("");
  const [gioiTinh, setGioiTinh] = useState<"nam" | "nu">("nam");
  const [haiTay, setHaiTay] = useState<"can_doi" | "thuan_troi" | "khong_thuan_troi">("can_doi");
  const [dangTai, setDangTai] = useState(false);
  const [kq, setKq] = useState<KetQuaDoiChieu | null>(null);
  const [loi, setLoi] = useState<string | null>(null);

  useEffect(() => {
    if (!hs) return;
    setNgaySinh(ngaySinhIso(hs));
    if (hs.gioi_tinh === "nam" || hs.gioi_tinh === "nu") setGioiTinh(hs.gioi_tinh);
  }, [hs]);

  async function xemDoiChieu(e: React.FormEvent) {
    e.preventDefault();
    if (!ngaySinh) return;
    setDangTai(true);
    setLoi(null);
    try {
      const res = await fetch("/api/nhan-tuong/doi-chieu-menh", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(en ? { "x-ngon-ngu": "en" } : {}),
        },
        body: JSON.stringify({
          ngay_sinh: ngaySinh,
          gioi_tinh: gioiTinh,
          gio_sinh: hs?.gio && hs.do_tin_gio !== "unknown" ? hs.gio : null,
          do_lech_hai_tay: haiTay,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoi(body.error ?? (en ? "Unable to load comparison." : "Chưa tải được đối chiếu lúc này."));
        return;
      }
      setKq(body as KetQuaDoiChieu);
    } catch {
      setLoi(en ? "Temporary connection error." : "Mất kết nối tạm thời.");
    } finally {
      setDangTai(false);
    }
  }

  return (
    <section className="mx-auto my-8 max-w-5xl rounded-2xl border border-line/80 bg-surface/35 p-5 sm:p-6" data-testid="doi-chieu-tuong-menh">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gold">
            {en ? "Cross-Perspective Reflection · Zero Merged Score" : "Đối chiếu độc lập · Không gộp điểm"}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-fg">
            {en ? "Annual Chart Rhythm × Facial Zone & Saint-Germain (1897) Palmistry" : "Nhịp năm Lá số × Bộ vị Lưu niên & Chỉ tay Đông–Tây (Saint-Germain 1897)"}
          </h2>
        </div>
        <Hand className="size-4 text-gold" aria-hidden />
      </div>

      <form onSubmit={xemDoiChieu} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div>
          <label htmlFor="dctm-ns" className="block text-xs text-fg-muted">
            {en ? "Birth date" : "Ngày sinh dương lịch"}
          </label>
          <input
            id="dctm-ns"
            data-testid="dctm-ngay-sinh"
            type="date"
            value={ngaySinh}
            onChange={(e) => setNgaySinh(e.target.value)}
            required
            className="mt-1 h-10 w-full rounded-xl border border-line bg-bg/70 px-3 text-sm text-fg"
          />
        </div>
        <div>
          <label htmlFor="dctm-gt" className="block text-xs text-fg-muted">
            {en ? "Gender" : "Giới tính"}
          </label>
          <select
            id="dctm-gt"
            value={gioiTinh}
            onChange={(e) => setGioiTinh(e.target.value as "nam" | "nu")}
            className="mt-1 h-10 w-full rounded-xl border border-line bg-bg/70 px-3 text-sm text-fg"
          >
            <option value="nam">{en ? "Male" : "Nam"}</option>
            <option value="nu">{en ? "Female" : "Nữ"}</option>
          </select>
        </div>
        <div>
          <label htmlFor="dctm-tay" className="block text-xs text-fg-muted">
            {en ? "Two-hand line clarity" : "Độ rõ nét hai bàn tay"}
          </label>
          <select
            id="dctm-tay"
            value={haiTay}
            onChange={(e) => setHaiTay(e.target.value as "can_doi" | "thuan_troi" | "khong_thuan_troi")}
            className="mt-1 h-10 w-full rounded-xl border border-line bg-bg/70 px-3 text-sm text-fg"
          >
            <option value="can_doi">{en ? "Both hands balanced" : "Hai bàn tay tương đương"}</option>
            <option value="thuan_troi">{en ? "Active hand clearer" : "Tay thuận rõ nét hơn"}</option>
            <option value="khong_thuan_troi">{en ? "Passive hand clearer" : "Tay không thuận rõ hơn"}</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={dangTai || !ngaySinh}
            data-testid="dctm-nut-xem"
            className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-gold px-4 text-xs font-semibold text-bg hover:opacity-90 disabled:opacity-50"
          >
            <Sparkles className="size-3.5" aria-hidden />
            {dangTai ? (en ? "Comparing…" : "Đang đối chiếu…") : (en ? "Reflect 3 Lenses" : "Soi 3 góc nhìn")}
          </button>
        </div>
      </form>

      {loi && <p role="alert" className="mt-3 text-xs text-amber-300">{loi}</p>}

      {kq?.chuyen_huong_tuoi && (
        <p className="mt-4 rounded-xl border border-line/60 bg-bg/50 p-3 text-xs text-fg-muted">{kq.chuyen_huong_tuoi.thong_bao}</p>
      )}

      {kq?.goc_menh_nam_nay && kq?.goc_tuong_luu_nien && kq?.goc_chi_tay_dong_tay && (
        <div className="mt-5 space-y-4" data-testid="dctm-ket-qua">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-line/70 bg-bg/50 p-4 text-sm">
              <p className="text-xs font-semibold text-gold">{kq.goc_menh_nam_nay.nhan}</p>
              <p className="mt-1 font-medium text-fg">
                {en ? "Day Master" : "Nhật chủ"}: {kq.goc_menh_nam_nay.nhat_chu} · {kq.goc_menh_nam_nay.nam_xem} ({kq.goc_menh_nam_nay.can_chi_nam})
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-fg-muted">{kq.goc_menh_nam_nay.loi_nhac_nam}</p>
            </div>
            <div className="rounded-xl border border-line/70 bg-bg/50 p-4 text-sm">
              <p className="text-xs font-semibold text-gold">{kq.goc_tuong_luu_nien.nhan}</p>
              <p className="mt-1 font-medium text-fg">
                {kq.goc_tuong_luu_nien.bo_vi_ten} {kq.goc_tuong_luu_nien.han ? `(${kq.goc_tuong_luu_nien.han})` : ""}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-fg-muted">{kq.goc_tuong_luu_nien.loi_quan_sat}</p>
            </div>
          </div>

          <div className="rounded-xl border border-line/70 bg-bg/50 p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-gold">
              <BookOpen className="size-3.5" aria-hidden /> {kq.goc_chi_tay_dong_tay.nhan}
            </p>
            <p className="mt-1.5 text-xs text-fg">{kq.goc_chi_tay_dong_tay.hai_tay_nhan_xet}</p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {kq.goc_chi_tay_dong_tay.diem_doi_chieu.map((d) => (
                <div key={d.ma} className="rounded-lg border border-line/60 bg-surface/40 p-3 text-xs">
                  <p className="font-semibold text-fg">{d.ten}</p>
                  <p className="mt-1 italic text-gold/85">&ldquo;{d.nguyen_van_en}&rdquo;</p>
                  <p className="mt-1.5 leading-relaxed text-fg-muted">{d.y_ung_dung}</p>
                </div>
              ))}
            </div>
            {kq.khung?.ranh_gioi && <p className="mt-3 text-[11px] text-fg-faint">{kq.khung.ranh_gioi}</p>}
          </div>
        </div>
      )}
    </section>
  );
}
