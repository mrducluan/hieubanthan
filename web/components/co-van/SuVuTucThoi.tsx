"use client";
// Chặng 3.1 — Việc sắp làm trong vài ngày: hai cách xem đọc riêng (bàn giờ theo hướng · gieo quẻ sáu hào), không gộp điểm (CD-1).
// Chữ cố định ở lib/chu/co-van-su-vu.ts; thuật ngữ + câu sách chỉ trong "Vì sao nói vậy".
import { useState } from "react";
import { ArrowUpRight, Clock, Compass, Dices, ShieldAlert, Sparkles } from "lucide-react";
import Link from "@/components/khung/Lien";
import { ViSao } from "@/components/luan-giai/HopNoiBat";
import { CHU_SU_VU as C, MA_TINH_HUONG_SU_VU, dienChu, type MaTinhHuongSuVu } from "@/lib/chu/co-van-su-vu";
import { ghi } from "@/lib/do-luong";
import { ngaySinhIso, useHoSo } from "@/lib/hoso";
import { loiTheoNgonNgu } from "@/lib/loi-ngon-ngu";
import { cn } from "@/lib/utils";

type MaTinhHuong = MaTinhHuongSuVu;
const cauTrich = (t: { sach: string; han: string }) => `${t.sach}: 「${t.han}」`;

/** Ngày + giờ + múi giờ theo đồng hồ máy người dùng (như KyMonHomNay) — engine lập bàn theo đúng giờ nơi người ấy. */
function dongHoMay(): { ngay: string; gio: string; utc: number } {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return {
    ngay: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`,
    gio: `${p(d.getHours())}:${p(d.getMinutes())}`,
    utc: Math.round((-d.getTimezoneOffset() / 60) * 4) / 4,
  };
}

interface TrichCoThu {
  sach: string;
  han: string;
  y_nghia: string;
}

interface KetQuaSuVu {
  an_toan_chan?: { xu_ly: string; loai: string; cau_tra_loi: string };
  chuyen_huong_tuoi?: { tuoi: number; thong_bao: string };
  chuyen_huong?: { ly_do: string; thong_bao: string };
  khung?: { tieu_de: string; phu_de: string; ranh_gioi: string };
  tinh_huong?: { ma: string; ten: string; mo_ta: string };
  goc_ky_mon?: {
    nhan: string;
    ngay: string;
    gio_thuan: { chi: string; khung: string; phuong: string; cua: string; noi_bat?: boolean; loi: string }[];
    ghi_chu_gio?: string | null;
    trich_co_thu: TrichCoThu;
  };
  goc_luc_hao?: {
    nhan: string;
    nguon_gieo: string;
    gia_tri_hao: number[];
    que_ban: { so: number; ten: string; hao_dong: number[] };
    que_bien?: { so: number; ten: string } | null;
    dung_than: string;
    ly_do_dung_than: string;
    muc: "thuan" | "can_bang" | "can_chu_dong";
    nhan_muc: string;
    tom_tat: string;
    can_cu: string[];
    ung_ky: { chi: string; ly_do: string; hao: number; ngay_gan_nhat: string; sau_bao_nhieu_ngay: number }[];
    ung_ky_ghi_chu: string;
    the_que?: string | null;
    trich_co_thu: TrichCoThu;
  };
  chuan_bi_thuc_te?: string[];
  ranh_gioi?: string;
}

function mauMuc(m?: string) {
  if (m === "thuan") return "border-jade/45 bg-jade/10 text-jade";
  if (m === "can_chu_dong") return "border-amber-400/45 bg-amber-500/10 text-amber-300";
  return "border-gold/45 bg-gold/10 text-gold";
}

export function SuVuTucThoi() {
  const hs = useHoSo();
  const [tinhHuong, setTinhHuong] = useState<MaTinhHuong>("dam_phan_thuong_vu");
  const [cauHoi, setCauHoi] = useState(C.tinh_huong.dam_phan_thuong_vu.goi_y);
  const [ngayXem, setNgayXem] = useState("");
  const [nhapTay, setNhapTay] = useState(false);
  const [haoTay, setHaoTay] = useState<number[]>([7, 8, 7, 8, 9, 8]);
  const [dangTai, setDangTai] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [kq, setKq] = useState<KetQuaSuVu | null>(null);

  function chonTinhHuong(ma: MaTinhHuong) {
    setTinhHuong(ma);
    setCauHoi(C.tinh_huong[ma].goi_y);
  }

  async function guiXem(e: React.FormEvent) {
    e.preventDefault();
    setLoi(null);
    setDangTai(true);
    try {
      const ns = hs ? ngaySinhIso(hs) : null;
      const may = dongHoMay();
      // Để trống ngày = hôm nay theo máy: gửi kèm giờ hiện tại. Chọn ngày khác: chỉ gửi ngày (giờ do engine lấy cả ngày).
      const homNay = !ngayXem || ngayXem === may.ngay;
      const res = await fetch("/api/co-van/su-vu", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          cau_hoi: cauHoi.trim(),
          tinh_huong: tinhHuong,
          ngay_xem: homNay ? may.ngay : ngayXem,
          gio_xem: homNay ? may.gio : null,
          utc: may.utc,
          gia_tri_hao: nhapTay ? haoTay : null,
          ngay_sinh: ns || null,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLoi(loiTheoNgonNgu(body.error, false, C.loi));
        return;
      }
      setKq(body as KetQuaSuVu);
      ghi("chart_interacted", { mo_dun: "co_van", kind: "su_vu_xem", tinh_huong: tinhHuong, tu_gieo: nhapTay });
    } catch {
      setLoi(C.loi_mang);
    } finally {
      setDangTai(false);
    }
  }

  return (
    <section className="space-y-6" data-testid="su-vu-tuc-thoi">
      <form onSubmit={guiXem} className="space-y-5 rounded-2xl border border-line/80 bg-surface/40 p-5 sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gold">{C.nho}</p>
          <h2 className="mt-1 text-xl font-semibold text-fg">{C.tieu_de}</h2>
          <p className="mt-1 text-sm text-fg-muted">{C.mo_ta}</p>
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label={C.chon_aria}>
          {MA_TINH_HUONG_SU_VU.map((ma) => (
            <button
              key={ma}
              type="button"
              aria-pressed={tinhHuong === ma}
              data-testid={`su-vu-chip-${ma}`}
              onClick={() => chonTinhHuong(ma)}
              className={cn(
                "min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                tinhHuong === ma ? "border-gold bg-gold/15 text-gold" : "border-line/80 text-fg-muted hover:text-fg",
              )}
            >
              {C.tinh_huong[ma].ten}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <label htmlFor="su-vu-cau-hoi" className="block text-xs font-medium text-fg-muted">
            {C.o_cau}
          </label>
          <textarea
            id="su-vu-cau-hoi"
            data-testid="su-vu-cau-hoi"
            rows={2}
            value={cauHoi}
            onChange={(e) => setCauHoi(e.target.value)}
            className="w-full rounded-xl border border-line bg-bg/70 px-3.5 py-2.5 text-sm text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="su-vu-ngay" className="block text-xs font-medium text-fg-muted">
              {C.o_ngay}
            </label>
            <input
              id="su-vu-ngay"
              type="date"
              value={ngayXem}
              onChange={(e) => setNgayXem(e.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-line bg-bg/70 px-3 text-sm text-fg"
            />
          </div>
          <div className="flex items-end">
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm text-fg-muted">
              <input
                type="checkbox"
                checked={nhapTay}
                onChange={(e) => setNhapTay(e.target.checked)}
                className="size-5 rounded border-line accent-gold"
              />
              {C.tu_gieo}
            </label>
          </div>
        </div>

        {nhapTay && (
          <div className="rounded-xl border border-line/60 bg-bg/50 p-3.5">
            <p className="mb-2 text-xs text-fg-faint">{C.hao_tu_duoi}</p>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {haoTay.map((val, idx) => (
                <div key={idx}>
                  <label htmlFor={`su-vu-hao-${idx + 1}`} className="block text-xs text-fg-muted">{dienChu(C.hao, { n: idx + 1 })}</label>
                  <select
                    id={`su-vu-hao-${idx + 1}`}
                    data-testid={`su-vu-hao-${idx + 1}`}
                    value={val}
                    onChange={(e) => {
                      const next = [...haoTay];
                      next[idx] = Number(e.target.value);
                      setHaoTay(next);
                    }}
                    className="mt-1 h-11 w-full rounded-lg border border-line bg-bg px-2 text-sm text-fg"
                  >
                    <option value={7}>{C.hao_7}</option>
                    <option value={8}>{C.hao_8}</option>
                    <option value={9}>{C.hao_9}</option>
                    <option value={6}>{C.hao_6}</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {loi && <p role="alert" className="text-sm text-amber-300">{loi}</p>}

        <button
          type="submit"
          disabled={dangTai || cauHoi.trim().length < 3}
          data-testid="su-vu-nut-xem"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-bg transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Dices className="size-4" aria-hidden />
          {dangTai ? C.dang : C.nut}
        </button>
      </form>

      {kq?.an_toan_chan && (
        <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-5 text-sm text-fg" data-testid="su-vu-an-toan">
          <p className="flex items-center gap-2 font-semibold text-amber-300">
            <ShieldAlert className="size-4" aria-hidden /> {C.an_toan}
          </p>
          <p className="mt-2 leading-relaxed">{kq.an_toan_chan.cau_tra_loi}</p>
        </div>
      )}

      {kq?.chuyen_huong_tuoi && (
        <div className="rounded-2xl border border-line bg-surface/40 p-5 text-sm text-fg-muted">
          {kq.chuyen_huong_tuoi.thong_bao}
        </div>
      )}

      {kq?.chuyen_huong && (
        <div className="rounded-2xl border border-line bg-surface/40 p-5 text-sm text-fg-muted">
          {kq.chuyen_huong.thong_bao}
        </div>
      )}

      {kq?.goc_ky_mon && kq?.goc_luc_hao && (
        <div className="space-y-5" data-testid="su-vu-ket-qua">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* GÓC NHÌN 1: KỲ MÔN THỜI GIA */}
            <div className="space-y-4 rounded-2xl border border-line/80 bg-surface/40 p-5" data-testid="su-vu-goc-ky-mon">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-gold">{kq.goc_ky_mon.nhan}</p>
                  <p className="mt-0.5 text-xs text-fg-faint">{dienChu(C.ngay_xem, { ngay: kq.goc_ky_mon.ngay })}</p>
                </div>
                <Clock className="size-4 shrink-0 text-gold" aria-hidden />
              </div>

              {kq.goc_ky_mon.gio_thuan.length > 0 ? (
                <ul className="space-y-2.5">
                  {kq.goc_ky_mon.gio_thuan.map((g) => (
                    <li key={`${g.chi}-${g.khung}`} className="rounded-xl border border-line/70 bg-bg/50 p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-fg">{dienChu(C.gio, { chi: g.chi, khung: g.khung })}</span>
                        <span className="rounded-full border border-jade/40 bg-jade/10 px-2.5 py-0.5 text-xs text-jade">
                          {dienChu(C.huong, { phuong: g.phuong })}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-fg-muted">{g.loi}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-xl border border-line/60 bg-bg/50 p-3 text-xs text-fg-muted">
                  {kq.goc_ky_mon.ghi_chu_gio}
                </p>
              )}

              <div className="text-xs text-fg-muted">
                <p className="leading-relaxed">{kq.goc_ky_mon.trich_co_thu.y_nghia}</p>
                <ViSao nho canCu={[
                  ...kq.goc_ky_mon.gio_thuan.map((g) => dienChu(C.vi_sao_gio, { chi: g.chi, cua: g.cua, phuong: g.phuong })),
                  cauTrich(kq.goc_ky_mon.trich_co_thu),
                ]} />
              </div>

              <Link href="/ky-mon" className="inline-flex min-h-11 items-center gap-1 text-sm text-gold hover:underline">
                {C.mo_ky_mon} <ArrowUpRight className="size-3.5" aria-hidden />
              </Link>
            </div>

            {/* GÓC NHÌN 2: LỤC HÀO NẠP GIÁP */}
            <div className="space-y-4 rounded-2xl border border-line/80 bg-surface/40 p-5" data-testid="su-vu-goc-luc-hao">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-gold">{kq.goc_luc_hao.nhan}</p>
                  <p className="mt-0.5 text-xs text-fg-faint">{kq.goc_luc_hao.nguon_gieo}</p>
                </div>
                <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium", mauMuc(kq.goc_luc_hao.muc))}>
                  {kq.goc_luc_hao.nhan_muc}
                </span>
              </div>

              <div className="rounded-xl border border-line/70 bg-bg/50 p-3.5 text-sm">
                <p className="font-semibold text-fg">
                  {dienChu(C.que, { ten: kq.goc_luc_hao.que_ban.ten })}
                  {kq.goc_luc_hao.que_bien ? dienChu(C.que_bien, { ten: kq.goc_luc_hao.que_bien.ten }) : C.que_tinh}
                </p>
                {kq.goc_luc_hao.tom_tat && <p className="mt-1 text-sm leading-relaxed text-fg-muted">{kq.goc_luc_hao.tom_tat}</p>}
                <p className="mt-1 text-xs text-gold">{dienChu(C.dung_than, { x: kq.goc_luc_hao.dung_than })}</p>
                <ViSao nho canCu={[kq.goc_luc_hao.ly_do_dung_than, ...kq.goc_luc_hao.can_cu, cauTrich(kq.goc_luc_hao.trich_co_thu)]} />
              </div>

              {kq.goc_luc_hao.ung_ky.length > 0 && (
                <div className="rounded-xl border border-gold/30 bg-gold/5 p-3 text-xs">
                  <p className="font-semibold text-gold">{C.ung_ky}</p>
                  <ul className="mt-1 space-y-1 text-fg">
                    {kq.goc_luc_hao.ung_ky.map((u, idx) => (
                      <li key={idx}>
                        • {dienChu(C.ung_ky_dong, { chi: u.chi, ngay: u.ngay_gan_nhat, n: u.sau_bao_nhieu_ngay })}: {u.ly_do}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1.5 text-[11px] text-fg-faint">{kq.goc_luc_hao.ung_ky_ghi_chu}</p>
                </div>
              )}

              <p className="text-xs leading-relaxed text-fg-muted">{kq.goc_luc_hao.trich_co_thu.y_nghia}</p>

              <Link href="/kinh-dich" className="inline-flex min-h-11 items-center gap-1 text-sm text-gold hover:underline">
                {C.mo_kinh_dich} <ArrowUpRight className="size-3.5" aria-hidden />
              </Link>
            </div>
          </div>

          {kq.chuan_bi_thuc_te && kq.chuan_bi_thuc_te.length > 0 && (
            <div className="rounded-2xl border border-jade/35 bg-jade/5 p-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-jade">
                <Sparkles className="size-4" aria-hidden /> {C.chuan_bi}
              </p>
              <ul className="mt-2.5 space-y-1.5 text-sm text-fg-muted">
                {kq.chuan_bi_thuc_te.map((v, idx) => (
                  <li key={idx}>• {v}</li>
                ))}
              </ul>
              {kq.khung?.ranh_gioi && (
                <p className="mt-3 border-t border-line/50 pt-2.5 text-xs text-fg-faint">
                  <Compass className="mr-1 inline size-3.5 text-gold" aria-hidden />
                  {kq.khung.ranh_gioi}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
