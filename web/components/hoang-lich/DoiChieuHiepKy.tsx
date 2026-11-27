"use client";
// Chặng 4.3 — Khung Đối chiếu Trạch Nhật cổ điển theo Khâm Định Hiệp Kỷ Biện Phương Thư trên /xem-ngay-tot.
import { useState } from "react";
import { BookOpen, Sparkles } from "lucide-react";

interface NgayHiepKy {
  ngay: string;
  am_lich: string;
  can_chi_ngay: string;
  ngu_loai_ma: string;
  ngu_loai_ten: string;
  ngu_loai_y_nghia: string;
  phuong_tam_sat_nam: string;
  luu_y_hiep_ky: string[];
}

interface KetQuaHiepKy {
  khung: { tieu_de: string; phu_de: string; ranh_gioi: string };
  ngay_phan_tich: NgayHiepKy[];
  trich_co_thu: { sach: string; han: string; y_nghia: string }[];
}

// Gửi MÃ hướng cho engine; nhãn hiển thị theo ngôn ngữ trang.
const HUONG_8: { ma: string; vi: string; en: string }[] = [
  { ma: "bac", vi: "Bắc", en: "North" }, { ma: "dong_bac", vi: "Đông Bắc", en: "Northeast" },
  { ma: "dong", vi: "Đông", en: "East" }, { ma: "dong_nam", vi: "Đông Nam", en: "Southeast" },
  { ma: "nam", vi: "Nam", en: "South" }, { ma: "tay_nam", vi: "Tây Nam", en: "Southwest" },
  { ma: "tay", vi: "Tây", en: "West" }, { ma: "tay_bac", vi: "Tây Bắc", en: "Northwest" },
];

export function DoiChieuHiepKy({ ngayMacDinh, en = false }: { ngayMacDinh: string; en?: boolean }) {
  const [tuNgay, setTuNgay] = useState(ngayMacDinh);
  const [huong, setHuong] = useState("");
  const [dangTai, setDangTai] = useState(false);
  const [kq, setKq] = useState<KetQuaHiepKy | null>(null);

  async function traHiepKy(e: React.FormEvent) {
    e.preventDefault();
    setDangTai(true);
    try {
      const res = await fetch("/api/lich/hiep-ky-doi-chieu", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(en ? { "x-ngon-ngu": "en" } : {}),
        },
        body: JSON.stringify({
          tu_ngay: tuNgay || null,
          so_ngay: 7,
          huong_tu_tao: huong || null,
        }),
      });
      if (res.ok) setKq((await res.json()) as KetQuaHiepKy);
    } finally {
      setDangTai(false);
    }
  }

  return (
    <section className="mt-10 rounded-2xl border border-line/80 bg-surface/35 p-5" data-testid="doi-chieu-hiep-ky">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gold">
            {en ? "Classical Imperial Almanac · Xie Ji Bian Fang Shu" : "Trạch Nhật Cổ điển · Khâm Định Hiệp Kỷ Biện Phương Thư"}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-fg">
            {en ? "Inspect 7-Day Classical Stem–Branch & Seasonal Cusps" : "Soi 7 ngày theo Ngũ loại nhật, Tứ Ly – Tứ Tuyệt & Biện Ngoa"}
          </h2>
        </div>
        <BookOpen className="size-4 shrink-0 text-gold" aria-hidden />
      </div>

      <form onSubmit={traHiepKy} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="hk-tu-ngay" className="block text-xs text-fg-muted">
            {en ? "Start date" : "Từ ngày dương lịch"}
          </label>
          <input
            id="hk-tu-ngay"
            type="date"
            value={tuNgay}
            onChange={(e) => setTuNgay(e.target.value)}
            className="mt-1 h-10 w-full rounded-xl border border-line bg-bg/70 px-3 text-sm text-fg"
          />
        </div>
        <div>
          <label htmlFor="hk-huong" className="block text-xs text-fg-muted">
            {en ? "Construction direction (optional)" : "Hướng động thổ / sửa chữa (tuỳ chọn)"}
          </label>
          <select
            id="hk-huong"
            value={huong}
            onChange={(e) => setHuong(e.target.value)}
            className="mt-1 h-10 w-full rounded-xl border border-line bg-bg/70 px-3 text-sm text-fg"
          >
            <option value="">{en ? "Not doing earthwork" : "Không động thổ / giao dịch thường"}</option>
            {HUONG_8.map((h) => (
              <option key={h.ma} value={h.ma}>{en ? h.en : h.vi}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={dangTai}
            data-testid="hk-nut-soi"
            className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-gold px-4 text-xs font-semibold text-bg hover:opacity-90 disabled:opacity-50"
          >
            <Sparkles className="size-3.5" aria-hidden />
            {dangTai ? (en ? "Checking…" : "Đang đối chiếu…") : (en ? "Inspect 7 Days" : "Đối chiếu Hiệp Kỷ 7 ngày")}
          </button>
        </div>
      </form>

      {kq && (
        <div className="mt-5 space-y-4" data-testid="hk-ket-qua">
          <p className="text-xs leading-relaxed text-fg-muted">{kq.khung.phu_de}</p>
          <div className="space-y-2.5">
            {kq.ngay_phan_tich.map((ng) => (
              <div key={ng.ngay} className="rounded-xl border border-line/70 bg-bg/50 p-3.5 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-fg">
                    {ng.ngay} ({en ? "Lunar" : "Âm"}: {ng.am_lich}) · {ng.can_chi_ngay}
                  </span>
                  <span className="rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 font-medium text-gold">
                    {ng.ngu_loai_ten}
                  </span>
                </div>
                <p className="mt-1 text-fg-muted">{ng.ngu_loai_y_nghia}</p>
                {ng.luu_y_hiep_ky.map((ly, idx) => (
                  <p key={idx} className="mt-1 text-amber-300/90">• {ly}</p>
                ))}
              </div>
            ))}
          </div>

          <details className="rounded-xl border border-line/60 bg-bg/40 p-3 text-xs text-fg-muted">
            <summary className="cursor-pointer font-medium text-gold">
              {en ? "Classical CJK Excerpts (Xie Ji Bian Fang Shu)" : "Nguyên văn căn cứ Khâm Định Hiệp Kỷ Biện Phương Thư"}
            </summary>
            <ul className="mt-2.5 space-y-2">
              {kq.trich_co_thu.map((t, i) => (
                <li key={i}>
                  <span className="font-medium text-fg">{t.sach}:</span>{" "}
                  <span className="font-serif text-gold/90">「{t.han}」</span> — {t.y_nghia}
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}
    </section>
  );
}
