"use client";
// TV-V2 + NHIP-2 — "3 tháng tới". Engine ghép lưu nguyệt + tứ hoá lưu niên thành mức thuận / bình / cần thận trọng và
// dựng LỜI RIÊNG từng tháng (kết luận, Điểm sáng, Nên để ý + hướng xử lý, Nên làm, tự soi). Web chỉ hiển thị:
// câu so ba tháng → biểu đồ nhịp → thẻ tháng (hộp nổi bật + vòng 12 cung mini). Học thuật (tứ hoá, luật, phái) thu gọn
// sau nút "Vì sao nói vậy". Màu dịu, không biểu tượng cảnh báo — đây là nhịp để tự soi, không phải lời phán.
import { useId, useState } from "react";
import { useChuChung } from "@/components/cms/ChuChung";
import { motion, useReducedMotion } from "motion/react";
import { CalendarClock, ChevronDown, MessageCircleQuestion, MousePointerClick, Sparkles } from "lucide-react";
import type { ChartInputVao, HopThangT, Nhip3ThangOutputT } from "@/app/api/tuvi/schema";
import { NhanLop } from "@/components/huyen-hoc/KhoiMoLuoi";
import { MAU_HOA_DIU } from "@/components/huyen-hoc/PhiHoa";
import { BaoLoi } from "@/components/khung/BaoLoi";
import { KhungTai } from "@/components/khung/TieuDe";
import { KiemChung } from "@/components/huyen-hoc/KiemChung";
import { HopNoiBat } from "@/components/luan-giai/HopNoiBat";
import { Button } from "@/components/ui/button";
import { usePost } from "@/lib/goi-api";
import { maNhip } from "@/lib/kiem-chung";
import { useTyLe, type BangTyLe } from "@/lib/ty-le-kiem-chung";
import { cn } from "@/lib/utils";
import { ChanQr } from "@/components/khung/ChanQr";

type Thang = Nhip3ThangOutputT["thang"][number];
type Muc = Thang["muc"];

const MAU_MUC: Record<Muc, { vien: string; cham: string; chu: string; chip: string; bien: string }> = {
  thuan: { vien: "border-jade/40 bg-jade/5", cham: "bg-jade", chu: "text-jade", chip: "border-jade/40 bg-jade/10", bien: "--jade" },
  binh: { vien: "border-gold/30 bg-gold/5", cham: "bg-gold", chu: "text-gold", chip: "border-gold/40 bg-gold/10", bien: "--gold" },
  can_than: { vien: "border-moon/40 bg-moon/5", cham: "bg-moon", chu: "text-moon", chip: "border-moon/40 bg-moon/10", bien: "--moon" },
};
const DIEM_SANG = "111 211 181";      // cùng màu hộp "Điểm sáng" (.hop-nb diem_manh)
const DE_Y = "245 170 80";            // cùng màu hộp "Nên để ý" (.hop-nb luu_y) — hổ phách, không đỏ

const ngan = (iso: string) => { const [, m, d] = iso.split("-"); return `${Number(d)}/${Number(m)}`; };
const tenThang = (t: Thang) => t.nhan_thang ?? `Tháng ${t.thang}${t.nhuan ? " nhuận" : ""}`;
// Nhãn ngắn (trục biểu đồ, tâm vòng cung): hai nửa tháng nhuận phải khác nhau ("6N·đầu" / "6N·sau" — nửa sau tính
// như tháng sau, can chi theo tháng sau); tháng thường giữ "Tháng 9".
const nhanNgan = (t: Thang) =>
  t.nhuan ? `${t.thang}N${t.phan === "nua_dau" ? "·đầu" : t.phan === "nua_sau" ? "·sau" : ""}` : `Tháng ${t.thang}`;
const idThe = (goc: string, i: number) => `${goc}-thang-${i}`;

/** Engine cũ (trước NHIP-2) chưa có hộp: dựng một hộp "Nên làm" từ gợi ý để thẻ vẫn đọc được. */
function hopCua(t: Thang): HopThangT[] {
  if (t.hop?.length) return t.hop;
  return t.goi_y ? [{ loai: "loi_khuyen", nhan: "Nên làm", tieu_de: "Gợi ý cho tháng", noi_dung: t.goi_y, can_cu: [] }] : [];
}

export function NhipBaThang({ laSo, onChonCungTen, onHoi }: {
  laSo: ChartInputVao; onChonCungTen: (tenCung: string) => void; onHoi: (cau: string) => void;
}) {
  const { data: d, loi, thuLai } = usePost<Nhip3ThangOutputT>("/api/tuvi/nhip-3-thang", { la_so: laSo });
  if (loi) return <BaoLoi loi={loi} thuLai={thuLai} />;
  if (!d) return <KhungTai dong={3} />;
  return <NhipBaThangXem d={d} onChonCungTen={onChonCungTen} onHoi={onHoi} />;
}

export function NhipBaThangXem({ d, onChonCungTen, onHoi }: { d: Nhip3ThangOutputT; onChonCungTen: (tenCung: string) => void; onHoi: (cau: string) => void }) {
  const goc = useId().replace(/:/g, "");
  const giam = useReducedMotion();
  const [chon, setChon] = useState<number | null>(null);
  const tyLe = useTyLe(d.thang.map(maNhip));         // "x% thấy đúng" khi mã đủ ≥ 30 phiếu (LG-ĐS mục 5)
  const toi = (i: number) => {
    setChon(i);
    document.getElementById(idThe(goc, i))?.scrollIntoView({ behavior: giam ? "auto" : "smooth", block: "start" });
  };
  return (
    <div className="space-y-5" data-testid="nhip-3-thang-noi-dung">
      {d.tom_tat_3_thang && (
        <p className="flex gap-2.5 rounded-2xl border border-gold/45 bg-gold/[0.07] p-4 text-[0.98rem] leading-relaxed text-fg"
          data-testid="nhip-tom-tat">
          <Sparkles className="mt-1 size-4 shrink-0 text-gold" aria-hidden />
          <span>{d.tom_tat_3_thang}</span>
        </p>
      )}
      <BieuDoNhip thang={d.thang} chon={chon} onChon={toi} />
      <ol className="space-y-4" aria-label="Ba tháng âm lịch tới">
        {d.thang.map((t, i) => (
          <TheThang key={`${t.nam_am}-${t.thang}-${t.nhuan}-${t.phan}`} id={idThe(goc, i)} t={t} i={i} d={d}
            noiBat={chon === i} onChonCungTen={onChonCungTen} onHoi={onHoi} tyLe={tyLe} />
        ))}
      </ol>
      <HocThuatNam d={d} />
    </div>
  );
}

// ------------------------------------------------------------------ biểu đồ nhịp
const W = 320, H = 132, X0 = 92, BUOC = 100;
const Y_MUC: Record<Muc, number> = { thuan: 30, binh: 60, can_than: 90 };
const NHAN_TRUC: [Muc, string][] = [["thuan", "Thuận"], ["binh", "Bình"], ["can_than", "Thận trọng"]];

function BieuDoNhip({ thang, chon, onChon }: { thang: Thang[]; chon: number | null; onChon: (i: number) => void }) {
  const giam = useReducedMotion();
  const diem = thang.map((t, i) => ({ x: X0 + i * BUOC, y: Y_MUC[t.muc] }));
  // Đường cong mềm qua 3 điểm (nửa khoảng cách làm tay đòn Bézier).
  const duong = diem.reduce((s, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const q = diem[i - 1]!, k = (p.x - q.x) / 2;
    return `${s} C ${q.x + k} ${q.y}, ${p.x - k} ${p.y}, ${p.x} ${p.y}`;
  }, "");
  const moTa = thang.map((t) => `${tenThang(t)}: ${t.nhan_muc}`).join("; ");
  return (
    <figure className="rounded-2xl border border-line bg-surface/60 px-2 pb-1 pt-2" data-testid="nhip-bieu-do">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Nhịp ba tháng — ${moTa}`} className="mx-auto h-auto w-full max-w-xl">
        {NHAN_TRUC.map(([m, ten]) => (
          <g key={m}>
            <line x1={58} x2={W - 8} y1={Y_MUC[m]} y2={Y_MUC[m]} stroke="rgb(var(--line))" strokeDasharray="3 4" />
            <text x={4} y={Y_MUC[m] + 3.5} fontSize="10" fill={`rgb(var(${MAU_MUC[m].bien}))`}>{ten}</text>
          </g>
        ))}
        <motion.path d={duong} fill="none" stroke="rgb(var(--gold) / 0.65)" strokeWidth="2" strokeLinecap="round"
          {...(giam ? {} : { initial: { pathLength: 0 }, animate: { pathLength: 1 }, transition: { duration: 0.9, ease: "easeInOut" } })} />
        {thang.map((t, i) => {
          const p = diem[i]!, mau = `rgb(var(${MAU_MUC[t.muc].bien}))`;
          return (
            <motion.g key={i} role="button" tabIndex={0} aria-label={`${tenThang(t)} — ${t.nhan_muc}. Xem chi tiết`}
              className="cursor-pointer outline-none" onClick={() => onChon(i)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onChon(i); } }}
              style={{ transformOrigin: `${p.x}px ${p.y}px` }}
              {...(giam ? {} : { initial: { opacity: 0, scale: 0.3 }, animate: { opacity: 1, scale: 1 }, transition: { delay: 0.25 + i * 0.25, type: "spring", stiffness: 260, damping: 18 } })}>
              {/* Vùng bấm cả cột (dễ chạm trên điện thoại). */}
              <rect x={p.x - BUOC / 2 + 4} y={14} width={BUOC - 8} height={H - 14} rx={10}
                fill={chon === i ? "rgb(var(--gold) / 0.07)" : "transparent"} />
              <circle cx={p.x} cy={p.y} r={chon === i ? 13 : 11} fill={mau} opacity={0.18} />
              <circle cx={p.x} cy={p.y} r={6.5} fill={mau} stroke="rgb(var(--bg))" strokeWidth="2" />
              <text x={p.x} y={H - 18} textAnchor="middle" fontSize="11" fill="rgb(var(--fg))">{nhanNgan(t)}</text>
              <text x={p.x} y={H - 5} textAnchor="middle" fontSize="9.5" fill={mau}>{t.nhan_muc}</text>
            </motion.g>
          );
        })}
      </svg>
      <figcaption className="sr-only">{moTa}</figcaption>
      <ChanQr className="mx-2 pb-2" nhan="Quét để xem nhịp của bạn" />
    </figure>
  );
}

// ------------------------------------------------------------------ vòng 12 cung mini
// Bố cục lá số Tử vi: hàng trên Tỵ Ngọ Mùi Thân, cột phải Dậu Tuất, hàng dưới Hợi Tý Sửu Dần (phải → trái), cột trái Mão Thìn.
const VI_TRI: Record<string, [number, number]> = {
  "Tỵ": [0, 0], "Ngọ": [1, 0], "Mùi": [2, 0], "Thân": [3, 0], "Dậu": [3, 1], "Tuất": [3, 2],
  "Hợi": [3, 3], "Tý": [2, 3], "Sửu": [1, 3], "Dần": [0, 3], "Mão": [0, 2], "Thìn": [0, 1],
};
const O = 41;

function VongCung({ cung, t }: { cung: NonNullable<Nhip3ThangOutputT["cung"]>; t: Thang }) {
  const giam = useReducedMotion();
  const loai = (ten: string) => [ten === t.cung_goc && "chinh", ten === t.diem_sang && "sang", ten === t.de_y && "de_y"].filter(Boolean) as string[];
  const tom = [`chuyện chính: ${cung.find((c) => c.ten === t.cung_goc)?.nhan_ngan ?? ""}`,
    t.diem_sang && `điểm sáng: ${cung.find((c) => c.ten === t.diem_sang)?.nhan_ngan ?? ""}`,
    t.de_y && `nên để ý: ${cung.find((c) => c.ten === t.de_y)?.nhan_ngan ?? ""}`].filter(Boolean).join(", ");
  return (
    <svg viewBox={`0 0 ${O * 4} ${O * 4}`} role="img" aria-label={`Vòng 12 mảng đời sống của ${tenThang(t).toLowerCase()} — ${tom}`}
      className="h-auto w-40 shrink-0 sm:w-44" data-testid="vong-cung-thang">
      {cung.map((c) => {
        const vt = VI_TRI[c.chi];
        if (!vt) return null;
        const [cx, cy] = vt, x = cx * O, y = cy * O, l = loai(c.ten);
        const chinh = l.includes("chinh");
        return (
          <g key={c.ten}>
            <rect x={x + 1.5} y={y + 1.5} width={O - 3} height={O - 3} rx={6}
              fill={chinh ? "rgb(var(--gold) / 0.16)" : "rgb(var(--surface-2) / 0.7)"}
              stroke={chinh ? "rgb(var(--gold))" : "rgb(var(--line))"} strokeWidth={chinh ? 1.6 : 1} />
            {c.nhan_ngan.split(" ").length > 1 && c.nhan_ngan.length > 7
              ? c.nhan_ngan.split(" ").slice(0, 2).map((w, k) => (
                <text key={k} x={x + O / 2} y={y + 17 + k * 10} textAnchor="middle" fontSize="8.5" fill={chinh ? "rgb(var(--fg))" : "rgb(var(--fg-faint))"}>{w}</text>))
              : <text x={x + O / 2} y={y + 22} textAnchor="middle" fontSize="8.5" fill={chinh ? "rgb(var(--fg))" : "rgb(var(--fg-faint))"}>{c.nhan_ngan}</text>}
            {l.includes("sang") && (
              <motion.circle cx={x + O - 8} cy={y + 8} r={4} fill={`rgb(${DIEM_SANG})`}
                {...(giam ? {} : { animate: { opacity: [1, 0.45, 1] }, transition: { duration: 2.4, repeat: Infinity } })} />
            )}
            {l.includes("de_y") && <circle cx={x + 8} cy={y + O - 8} r={4} fill={`rgb(${DE_Y})`} />}
          </g>
        );
      })}
      <g fontSize="8.5" fill="rgb(var(--fg-muted))">
        <text x={O * 2} y={O + 16} textAnchor="middle" fontSize="10" fill="rgb(var(--fg))">{nhanNgan(t)}</text>
        <rect x={O + 8} y={O + 27} width={9} height={9} rx={2} fill="rgb(var(--gold) / 0.16)" stroke="rgb(var(--gold))" />
        <text x={O + 21} y={O + 35}>Chuyện chính</text>
        <circle cx={O + 12.5} cy={O + 47} r={3.5} fill={`rgb(${DIEM_SANG})`} />
        <text x={O + 21} y={O + 50}>Điểm sáng</text>
        <circle cx={O + 12.5} cy={O + 61} r={3.5} fill={`rgb(${DE_Y})`} />
        <text x={O + 21} y={O + 64}>Nên để ý</text>
      </g>
    </svg>
  );
}

// ------------------------------------------------------------------ thẻ tháng
function TheThang({ id, t, i, d, noiBat, onChonCungTen, onHoi, tyLe }: {
  id: string; t: Thang; i: number; d: Nhip3ThangOutputT; noiBat: boolean;
  onChonCungTen: (tenCung: string) => void; onHoi: (cau: string) => void; tyLe?: BangTyLe;
}) {
  const giam = useReducedMotion();
  const mau = MAU_MUC[t.muc];
  const hop = hopCua(t);
  return (
    <motion.li id={id} data-testid="the-thang" data-muc={t.muc}
      className={cn("scroll-mt-20 rounded-2xl border p-4 transition-shadow sm:p-5", mau.vien, noiBat && "shadow-glow")}
      {...(giam ? {} : { initial: { opacity: 0, y: 12 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-40px" }, transition: { duration: 0.4, delay: i * 0.08 } })}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="text-sm text-fg-muted">
              <CalendarClock className="mr-1.5 inline size-4" aria-hidden />
              <b className="font-medium text-fg">{tenThang(t)}</b> · {t.can_chi}
              <span className="text-fg-faint"> · {ngan(t.tu)}–{ngan(t.den)}/{t.den.slice(0, 4)}</span>
            </p>
            <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium", mau.chu, mau.chip)}>
              <span className={cn("size-2 rounded-full", mau.cham)} aria-hidden />{t.nhan_muc}
            </span>
          </div>
          <h4 className="mt-2 font-serif text-xl leading-snug text-fg" data-testid="tieu-de-thang">{t.tieu_de_thang ?? t.nhan_muc}</h4>
          {(t.chu_de_thang ?? t.chu_de) && <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{t.chu_de_thang ?? t.chu_de}</p>}
        </div>
        {d.cung?.length === 12 && <div className="flex justify-center sm:block"><VongCung cung={d.cung} t={t} /></div>}
      </div>

      {hop.length > 0 && (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3" data-testid="hop-thang">
          {/* Căn cứ của từng hộp gom vào "Vì sao nói vậy" của cả tháng — hộp chỉ giữ lời đời thường. */}
          {hop.map((h) => (
            <HopNoiBat key={h.loai} hop={{ loai: h.loai, nhan: h.nhan, tieu_de: h.tieu_de, noi_dung: h.noi_dung,
              ...(h.huong_xu_ly ? { huong_xu_ly: h.huong_xu_ly } : {}) }} />
          ))}
        </div>
      )}

      {t.cau_tu_soi && (
        <p className="mt-4 text-sm text-moon"><NhanLop lop="soi" /> <span className="ml-1">{t.cau_tu_soi}</span></p>
      )}

      <ViSaoThang t={t} />

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => onChonCungTen(t.cung_goc)}>
          <MousePointerClick aria-hidden /> Xem cung tháng
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onHoi(`Tháng ${t.thang}${t.nhuan ? " nhuận" : ""} âm năm ${t.nam_am} của tôi thế nào?`)}>
          <MessageCircleQuestion aria-hidden /> Hỏi thêm
        </Button>
      </div>
      {/* Chỉ tháng đã bắt đầu (hiện tại / đã qua) mới hỏi kiểm chứng — tháng chưa tới thì chưa ai biết đúng hay không. */}
      {t.tu <= d.ngay_xem && (
        <div className="mt-3">
          <KiemChung loai="nhip_3_thang" mau={maNhip(t)} phai={d.phai_luu_nguyet} khoa={`${t.nam_am}-${t.thang}-${t.nhuan ? 1 : 0}-${t.phan}`}
            tyLe={tyLe?.[maNhip(t)]}
            cauHoi="Tháng này có đúng nhịp với bạn?" />
        </div>
      )}
    </motion.li>
  );
}

/** "Vì sao nói vậy" của một tháng: chip tứ hoá tháng + căn cứ (cung tháng, tứ hoá năm, luật xếp mức, ưu tiên). */
function ViSaoThang({ t }: { t: Thang }) {
  const [mo, setMo] = useState(false);
  const id = useId();
  const c = useChuChung();
  const canCu = t.can_cu?.length ? t.can_cu : t.ly_do.map((l) => l.noi_dung);
  return (
    <div className="mt-3" data-testid="vi-sao">
      <button type="button" aria-expanded={mo} aria-controls={id} onClick={() => setMo((v) => !v)}
        className="inline-flex items-center gap-1 rounded-full text-sm text-fg-muted underline-offset-4 hover:text-fg hover:underline">
        {c("doc.vi_sao")} <ChevronDown className={cn("size-3.5 transition-transform", mo && "rotate-180")} aria-hidden />
      </button>
      <div id={id} hidden={!mo} className="mt-2 space-y-2 border-l-2 border-line pl-3" data-testid="can-cu">
        <p className="text-xs text-fg-faint"><NhanLop lop="tinh" /> <span className="ml-1">Cung tháng: <b className="text-fg-muted">{t.cung_goc}</b> · tứ hoá theo can tháng {t.can_chi}</span></p>
        {t.tu_hoa_thang.length > 0 && (
          <ul className="flex flex-wrap gap-1" aria-label="Tứ hoá theo can tháng">
            {t.tu_hoa_thang.map((h) => (
              <li key={h.hoa} className={cn("rounded-md px-2 py-0.5 text-[11px]", MAU_HOA_DIU[h.hoa] ?? "bg-surface-2")}>
                {h.hoa} {h.sao}{h.cung_goc ? ` · ${h.cung_goc}` : ""}
              </li>
            ))}
          </ul>
        )}
        <ul className="space-y-1 text-xs leading-relaxed text-fg-faint">
          {canCu.map((c) => <li key={c}>· {c}</li>)}
        </ul>
      </div>
    </div>
  );
}

/** Tứ hoá của năm, phái lưu nguyệt, thứ tự ưu tiên — phần học thuật chung của cả khung, thu gọn. */
function HocThuatNam({ d }: { d: Nhip3ThangOutputT }) {
  const luuY = Array.isArray(d.luu_y) ? d.luu_y.join(" ") : d.luu_y;
  const tuHoaNam = (n: Nhip3ThangOutputT["luu_nien"]) =>
    `Năm ${n.can_chi}: tứ hoá của năm ${n.tu_hoa.map((h) => `${h.hoa} ${h.sao}${h.cung_goc ? ` (${h.cung_goc})` : ""}`).join(" · ")}.`;
  return (
    <details className="group rounded-2xl border border-line bg-surface/40 px-4 py-3 text-sm" data-testid="nhip-hoc-thuat">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-fg-muted hover:text-fg">
        <span>Cách tính: tứ hoá của năm, phái lưu nguyệt, thứ tự ưu tiên</span>
        <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="mt-3 space-y-2 text-xs leading-relaxed text-fg-faint">
        <p>
          {tuHoaNam(d.luu_nien)}
          {d.luu_nien_sau && <> Sang năm âm mới — {tuHoaNam(d.luu_nien_sau)}</>}
          {" "}Mỗi tháng đọc cùng tứ hoá của tháng đó và của năm âm chứa tháng đó.
        </p>
        {d.ten_phai_luu_nguyet && <p>Cung tháng theo phái lưu nguyệt: {d.ten_phai_luu_nguyet} (đổi trong khung Trường phái).</p>}
        {(d.uu_tien?.ghi_chu || luuY) && (
          <p data-testid="nhip-3-thang-uu-tien">
            {d.uu_tien?.ghi_chu && <>Thứ tự ưu tiên: {d.uu_tien.ghi_chu} </>}{luuY}
          </p>
        )}
      </div>
    </details>
  );
}
