"use client";
// Chặng 5 — Hệ trực quan chuyên sâu Chiêm tinh (HeTrucQuanChiemTinh.tsx):
//   1. Ma trận Lưới Góc Chiếu Tương Tác 13×13 (Interactive Lower-Triangle Aspect Matrix)
//   2. Bản đồ 4 Nguyên Tố × 3 Phẩm Chất & Bảng Phẩm Giá Cổ Điển Ptolemy (Essential Dignities)
//   3. Đường Thời Gian Chu Kỳ Đời (Jupiter / Saturn / Uranus / Chiron Return Timeline)
// Bất biến bảng màu: 0% sắc đỏ — chỉ dùng Gold (#E5C76B), Jade (#34D399), Moon (#7DD3FC), Amber (#FBBF24), Slate (#94A3B8).
import { useMemo, useState } from "react";
import { useNgonNgu } from "@/components/khung/NgonNgu";
import { cn } from "@/lib/utils";
import type { GocChieuBieuDo } from "./BanDoSaoSvg";

export interface GocChieuDayDu extends GocChieuBieuDo {
  ten_diem_1: string;
  ten_diem_2: string;
  ten_loai: string;
  goc_chuan?: number;
  sai_so: number;
  dang_hoi_vao?: boolean;
  cach_doc: string;
}

export interface OHanhTinhMaTran {
  nguyen_to: "lua" | "dat" | "khi" | "nuoc";
  pham_chat: "thong_linh" | "kien_dinh" | "linh_hoat";
  cung_ma: string;
  cung_ten: string;
  cung_ky_hieu: string;
  hanh_tinh: { ma: string; ten: string; ky_hieu: string }[];
}

export interface HanhTinhPhamGia {
  ma: string;
  ten: string;
  ky_hieu: string;
  cung_ten: string;
  cung_ky_hieu: string;
  do_cung: number;
  pham_gia?: { ma: string; ten: string; giai_thich: string } | null;
}

export interface MocChuKyDoi {
  ma: string;
  hanh_tinh: string;
  ky_hieu: string;
  nam: number;
  tuoi: number;
  trang_thai: "da_qua" | "dang_dien_ra" | "sap_toi";
  ten: string;
  y_nghia: string;
}

const KY_HIEU_GOC: Record<string, { ky: string; lop: string }> = {
  trung_hop: { ky: "☌", lop: "text-sky-300 bg-sky-400/10 border-sky-400/35" },
  luc_hop: { ky: "⚹", lop: "text-jade bg-jade/10 border-jade/35" },
  tam_hop: { ky: "△", lop: "text-jade bg-jade/15 border-jade/45" },
  vuong_goc: { ky: "□", lop: "text-amber-300 bg-amber-400/10 border-amber-400/40" },
  doi_xung: { ky: "☍", lop: "text-gold bg-gold/15 border-gold/45" },
};

const NHAN_NGUYEN_TO: Record<string, { vi: string; en: string; mau: string; thanh: string }> = {
  lua: { vi: "Lửa (Nhiệt huyết)", en: "Fire (Initiative)", mau: "text-amber-300 border-amber-400/35 bg-amber-400/10", thanh: "bg-amber-300" },
  dat: { vi: "Đất (Thực chất)", en: "Earth (Grounded)", mau: "text-gold border-gold/35 bg-gold/10", thanh: "bg-gold" },
  khi: { vi: "Khí (Tư duy)", en: "Air (Dialogue)", mau: "text-sky-300 border-sky-400/35 bg-sky-400/10", thanh: "bg-sky-300" },
  nuoc: { vi: "Nước (Thấu cảm)", en: "Water (Empathy)", mau: "text-jade border-jade/35 bg-jade/10", thanh: "bg-jade" },
};

const NHAN_PHAM_CHAT: Record<string, { vi: string; en: string }> = {
  thong_linh: { vi: "Thống lĩnh (Khởi xướng)", en: "Cardinal (Initiating)" },
  kien_dinh: { vi: "Kiên định (Bền gốc)", en: "Fixed (Sustaining)" },
  linh_hoat: { vi: "Linh hoạt (Thích ứng)", en: "Mutable (Adapting)" },
};

export function HeTrucQuanChiemTinh({
  hanhTinh,
  truc,
  tatCaGocChieu,
  phanBoNguyenTo,
  phanBoPhamChat,
  maTranNguyenTo,
  nguonPhamGia,
  mocChuKyDoi,
  onChonHanhTinh,
  onChonCapGoc,
}: {
  hanhTinh: HanhTinhPhamGia[];
  truc?: { asc: { cung_ten: string }; mc: { cung_ten: string } } | null;
  tatCaGocChieu: GocChieuDayDu[];
  phanBoNguyenTo?: { lua: number; dat: number; khi: number; nuoc: number };
  phanBoPhamChat?: { thong_linh: number; kien_dinh: number; linh_hoat: number };
  maTranNguyenTo?: OHanhTinhMaTran[][];
  nguonPhamGia?: string | null;
  mocChuKyDoi?: MocChuKyDoi[];
  onChonHanhTinh?: (ma: string) => void;
  onChonCapGoc?: (cap: [string, string] | null) => void;
}) {
  const { ngonNgu } = useNgonNgu();
  const en = ngonNgu === "en";
  const [gocDangXem, setGocDangXem] = useState<GocChieuDayDu | null>(tatCaGocChieu[0] ?? null);
  const [mocDangXem, setMocDangXem] = useState<MocChuKyDoi | null>(
    () => mocChuKyDoi?.find((m) => m.trang_thai === "dang_dien_ra") ?? mocChuKyDoi?.find((m) => m.trang_thai === "sap_toi") ?? mocChuKyDoi?.[0] ?? null,
  );

  // Tập trục của ma trận góc chiếu (12 điểm chính + Asc/MC nếu có giờ sinh)
  const trucMaTran = useMemo(() => {
    const ds = hanhTinh
      .filter((p) => p.ma !== "ke_do")
      .map((p) => ({ ma: p.ma, ky: p.ky_hieu, ten: p.ten }));
    if (truc) {
      ds.push({ ma: "asc", ky: "AC", ten: en ? "Ascendant" : "Cung Mọc" });
      ds.push({ ma: "mc", ky: "MC", ten: en ? "Midheaven" : "Thiên Đỉnh" });
    }
    return ds;
  }, [hanhTinh, truc, en]);

  const bangTraGoc = useMemo(() => {
    const m = new Map<string, GocChieuDayDu>();
    for (const g of tatCaGocChieu) {
      m.set(`${g.diem_1}:${g.diem_2}`, g);
      m.set(`${g.diem_2}:${g.diem_1}`, g);
    }
    return m;
  }, [tatCaGocChieu]);

  const dsPhamGia = useMemo(
    () => hanhTinh.filter((p) => Boolean(p.pham_gia)),
    [hanhTinh],
  );

  function chonO(g: GocChieuDayDu) {
    setGocDangXem(g);
    onChonCapGoc?.([g.diem_1, g.diem_2]);
  }

  return (
    <div className="space-y-6">
      {/* 1. BẢN ĐỒ 4 NGUYÊN TỐ × 3 PHẨM CHẤT & PHẨM GIÁ CỔ ĐIỂN PTOLEMY */}
      {maTranNguyenTo && maTranNguyenTo.length > 0 && (
        <section
          className="space-y-4 rounded-2xl border border-line/80 bg-surface/40 p-5"
          data-testid="ban-do-nguyen-to-pham-gia"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gold">
                {en ? "4 Elements × 3 Modalities & Classical Dignities" : "Bản đồ 4 Nguyên tố × 3 Phẩm chất & Phẩm giá cổ điển"}
              </p>
              <h3 className="mt-0.5 font-serif text-lg text-fg">
                {en ? "Where your 10 planets concentrate" : "10 hành tinh tập trung ở vùng khí chất nào?"}
              </h3>
            </div>
            {phanBoPhamChat && (
              <div className="flex flex-wrap gap-2 text-[11px] text-fg-muted">
                {(["thong_linh", "kien_dinh", "linh_hoat"] as const).map((pc) => (
                  <span key={pc} className="rounded-full border border-line/70 bg-bg/50 px-2.5 py-1">
                    {en ? NHAN_PHAM_CHAT[pc]!.en : NHAN_PHAM_CHAT[pc]!.vi}:{" "}
                    <b className="text-fg">{phanBoPhamChat[pc]}</b>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Thanh tỷ lệ 4 nguyên tố */}
          {phanBoNguyenTo && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(["lua", "dat", "khi", "nuoc"] as const).map((nt) => {
                const sl = phanBoNguyenTo[nt];
                const meta = NHAN_NGUYEN_TO[nt]!;
                return (
                  <div key={nt} className={cn("rounded-xl border p-3 text-xs", meta.mau)}>
                    <div className="flex items-center justify-between font-medium">
                      <span>{en ? meta.en : meta.vi}</span>
                      <span>{sl}/10</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-bg/60">
                      <div
                        className={cn("h-full rounded-full motion-safe:transition-all", meta.thanh)}
                        style={{ width: `${Math.min(100, sl * 10)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bảng 4 hàng × 3 cột */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-line/60 text-[11px] uppercase tracking-wider text-fg-faint">
                  <th className="py-2 pr-3">{en ? "Element" : "Nguyên tố"}</th>
                  {(["thong_linh", "kien_dinh", "linh_hoat"] as const).map((pc) => (
                    <th key={pc} className="px-2.5 py-2">{en ? NHAN_PHAM_CHAT[pc]!.en : NHAN_PHAM_CHAT[pc]!.vi}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {maTranNguyenTo.map((hang, idx) => {
                  const nt = hang[0]?.nguyen_to ?? "lua";
                  const meta = NHAN_NGUYEN_TO[nt]!;
                  return (
                    <tr key={idx} className="border-b border-line/40 last:border-0">
                      <th scope="row" className="py-2.5 pr-3 font-medium text-fg">
                        {en ? meta.en : meta.vi}
                      </th>
                      {hang.map((o) => (
                        <td key={o.cung_ma} className="px-2.5 py-2.5 align-top">
                          <div className="rounded-xl border border-line/60 bg-bg/45 p-2">
                            <p className="text-[11px] text-fg-muted">
                              <span className="text-gold">{o.cung_ky_hieu}</span> {o.cung_ten}
                            </p>
                            {o.hanh_tinh.length > 0 ? (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {o.hanh_tinh.map((p) => (
                                  <button
                                    key={p.ma}
                                    type="button"
                                    onClick={() => onChonHanhTinh?.(p.ma)}
                                    className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[11px] font-medium text-gold hover:bg-gold/20"
                                  >
                                    <span>{p.ky_hieu}</span>
                                    <span>{p.ten}</span>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <p className="mt-1 text-[11px] text-fg-faint">—</p>
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bảng Phẩm giá hành tinh cổ điển Ptolemy */}
          {dsPhamGia.length > 0 && (
            <div className="space-y-2 border-t border-line/50 pt-3">
              <p className="text-xs font-semibold text-fg">
                {en ? "Classical Essential Dignities (7 Traditional Bodies)" : "Phẩm giá hành tinh cổ điển (7 thiên thể truyền thống)"}
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {dsPhamGia.map((p) => {
                  const pg = p.pham_gia!;
                  const thuan = pg.ma.startsWith("vuong");
                  return (
                    <button
                      key={p.ma}
                      type="button"
                      onClick={() => onChonHanhTinh?.(p.ma)}
                      className={cn(
                        "rounded-xl border p-3 text-left text-xs motion-safe:transition-colors",
                        thuan ? "border-jade/40 bg-jade/5 hover:border-jade/70" : "border-amber-400/35 bg-amber-400/5 hover:border-amber-400/65",
                      )}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="font-semibold text-fg">
                          {p.ky_hieu} {p.ten} · {p.cung_ky_hieu} {p.cung_ten} ({p.do_cung}°)
                        </span>
                        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", thuan ? "bg-jade/15 text-jade" : "bg-amber-400/15 text-amber-300")}>
                          {pg.ten}
                        </span>
                      </div>
                      <p className="mt-1 leading-relaxed text-fg-muted">{pg.giai_thich}</p>
                    </button>
                  );
                })}
              </div>
              {nguonPhamGia && <p className="text-[11px] text-fg-faint">{nguonPhamGia}</p>}
            </div>
          )}
        </section>
      )}

      {/* 2. MA TRẬN LƯỚI GÓC CHIẾU TƯƠNG TÁC */}
      {tatCaGocChieu.length > 0 && (
        <section
          className="space-y-4 rounded-2xl border border-line/80 bg-surface/40 p-5"
          data-testid="ma-tran-goc-chieu"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-jade">
              {en ? "Interactive Aspect Grid" : "Ma trận Lưới Góc Chiếu Tương Tác"}
            </p>
            <h3 className="mt-0.5 font-serif text-lg text-fg">
              {en ? "Click any aspect symbol to inspect its orb and meaning" : "Chạm vào ký hiệu góc chiếu bất kỳ để xem sai số và cách đọc"}
            </h3>
          </div>

          <div className="overflow-x-auto pb-1">
            <table className="border-collapse text-center text-xs">
              <tbody>
                {trucMaTran.map((dong, i) => (
                  <tr key={dong.ma}>
                    {trucMaTran.slice(0, i + 1).map((cot, j) => {
                      if (i === j) {
                        return (
                          <th
                            key={cot.ma}
                            scope="row"
                            title={dong.ten}
                            className="size-9 rounded-lg border border-gold/35 bg-gold/10 font-semibold text-gold"
                          >
                            {dong.ky}
                          </th>
                        );
                      }
                      const g = bangTraGoc.get(`${dong.ma}:${cot.ma}`);
                      if (!g) {
                        return (
                          <td key={cot.ma} className="size-9 border border-line/40 bg-bg/30 text-[10px] text-fg-faint">
                            ·
                          </td>
                        );
                      }
                      const kh = KY_HIEU_GOC[g.loai] ?? { ky: "•", lop: "text-gold border-gold/40 bg-gold/10" };
                      const dangChonO =
                        gocDangXem &&
                        ((gocDangXem.diem_1 === dong.ma && gocDangXem.diem_2 === cot.ma) ||
                          (gocDangXem.diem_1 === cot.ma && gocDangXem.diem_2 === dong.ma));
                      return (
                        <td key={cot.ma} className="size-9 border border-line/50 p-0.5">
                          <button
                            type="button"
                            onClick={() => chonO(g)}
                            title={`${g.ten_diem_1} ${g.ten_loai} ${g.ten_diem_2} (${g.sai_so}°)`}
                            className={cn(
                              "grid size-full place-items-center rounded border text-sm font-semibold motion-safe:transition-transform hover:scale-105",
                              kh.lop,
                              dangChonO ? "ring-2 ring-gold" : "",
                            )}
                          >
                            {kh.ky}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {gocDangXem && (
            <div className="rounded-xl border border-gold/40 bg-bg/55 p-3.5 text-xs" data-testid="chi-tiet-o-goc-chieu">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-gold">
                  {KY_HIEU_GOC[gocDangXem.loai]?.ky ?? "•"} {gocDangXem.ten_diem_1} — {gocDangXem.ten_loai} — {gocDangXem.ten_diem_2}
                </p>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="rounded-full border border-line px-2 py-0.5 text-fg-muted">
                    orb {gocDangXem.sai_so}°
                  </span>
                  {typeof gocDangXem.dang_hoi_vao === "boolean" && (
                    <span className="rounded-full border border-jade/40 bg-jade/10 px-2 py-0.5 text-jade">
                      {gocDangXem.dang_hoi_vao
                        ? (en ? "Applying" : "Đang hội vào")
                        : (en ? "Separating" : "Đang tách ra")}
                    </span>
                  )}
                </div>
              </div>
              <p className="mt-1.5 leading-relaxed text-fg-muted">{gocDangXem.cach_doc}</p>
            </div>
          )}
        </section>
      )}

      {/* 3. ĐƯỜNG THỜI GIAN CHU KỲ ĐỜI (PLANETARY RETURN TIMELINE) */}
      {mocChuKyDoi && mocChuKyDoi.length > 0 && (
        <section
          className="space-y-4 rounded-2xl border border-line/80 bg-surface/40 p-5"
          data-testid="chu-ky-doi-timeline"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-sky-300">
              {en ? "Planetary Life-Cycle Milestones (1926–2049)" : "Đường thời gian Cột mốc Chu kỳ Hành tinh"}
            </p>
            <h3 className="mt-0.5 font-serif text-lg text-fg">
              {en ? "Major Jupiter, Saturn, Uranus & Chiron thresholds across your timeline" : "Các ngưỡng hồi quy Mộc tinh, Thổ tinh, Thiên Vương & Chiron theo năm"}
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {mocChuKyDoi.map((m) => {
              const chon = mocDangXem?.ma === m.ma;
              const lopTt =
                m.trang_thai === "dang_dien_ra"
                  ? "border-gold bg-gold/15 text-gold"
                  : m.trang_thai === "sap_toi"
                    ? "border-jade/45 bg-jade/5 text-fg hover:border-jade"
                    : "border-line/70 bg-bg/45 text-fg-muted hover:text-fg";
              const nhanTt =
                m.trang_thai === "dang_dien_ra"
                  ? (en ? "Active now" : "Đang diễn ra")
                  : m.trang_thai === "sap_toi"
                    ? (en ? "Upcoming" : "Sắp tới")
                    : (en ? "Completed" : "Đã qua");
              return (
                <button
                  key={m.ma}
                  type="button"
                  onClick={() => setMocDangXem(m)}
                  className={cn(
                    "rounded-xl border p-3 text-left text-xs motion-safe:transition-all",
                    lopTt,
                    chon ? "ring-2 ring-gold" : "",
                  )}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold">{m.ky_hieu} {m.nam}</span>
                    <span className="opacity-80">{en ? `Age ~${m.tuoi}` : `~${m.tuoi} tuổi`}</span>
                  </div>
                  <p className="mt-1 font-medium text-fg">{m.ten}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider opacity-80">{nhanTt}</p>
                </button>
              );
            })}
          </div>

          {mocDangXem && (
            <div className="rounded-xl border border-sky-400/35 bg-sky-400/5 p-3.5 text-xs">
              <p className="font-semibold text-fg">
                {mocDangXem.ky_hieu} {mocDangXem.ten} · {mocDangXem.nam} ({en ? `around age ${mocDangXem.tuoi}` : `quanh tuổi ${mocDangXem.tuoi}`})
              </p>
              <p className="mt-1 leading-relaxed text-fg-muted">{mocDangXem.y_nghia}</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
