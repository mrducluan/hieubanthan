"use client";
// BT-ĐS — trực quan trong Luận giải Bát tự đời sống (docs/LUAN-GIAI-DOI-SONG.md mục 6). Chỉ VẼ số engine đã tính:
//   * ThanhThan: sức tự thân (tỉ lệ trợ lực) trên thang 0–100% với hai ngưỡng công bố (yếu ≤ 45% · mạnh ≥ 55%).
//   * BieuDoNguHanh: 5 cột ngũ hành theo thứ tự sinh (Mộc → Hỏa → Thổ → Kim → Thủy), đánh dấu hành mỗi CÁCH đọc gợi ý
//     bù — hai cách song song, không chọn thay người dùng.
//   * DaiVanHaiCach: dải 8 đại vận, mỗi ô tô theo mức gộp, chấm trên = cách 1, chấm dưới = cách 2 → thấy ngay chỗ hai
//     cách nói khác nhau.
// SVG / div nội dòng (hợp CSP), `motion` sẵn có; tôn trọng prefers-reduced-motion (không chạy hiệu ứng). Điện thoại
// 360px: mọi khối co theo bề ngang, không cuộn ngang.
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { ChanQr } from "@/components/khung/ChanQr";
import { NHAN_MUC, type BieuDoNguHanh as BieuDoT, type HaiCach, type MocDaiHan, type Muc, type ThanDo } from "./kieu";

const SLUG: Record<string, string> = { "Kim": "kim", "Mộc": "moc", "Thủy": "thuy", "Hỏa": "hoa", "Thổ": "tho" };
const pct = (x: number) => Math.round(Math.min(1, Math.max(0, x)) * 100);

export function ThanhThan({ than }: { than: ThanDo }) {
  const giam = useReducedMotion();
  const vi = pct(than.ti_le), duoi = pct(than.nhuoc_duoi), tren = pct(than.vuong_tu);
  return (
    <figure className="mt-5 rounded-2xl border border-line/70 p-4" data-testid="thanh-than" data-muc-than={than.muc}>
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span className="font-semibold text-fg">{than.nhan}</span>
        <span className="text-xs text-fg-faint">thang điểm công bố · {vi}% trợ lực</span>
      </figcaption>
      <div className="relative mt-3 h-3 rounded-full" role="img"
        aria-label={`Sức tự thân ${vi}%: dưới ${duoi}% là cần thêm điểm tựa, từ ${tren}% là mạnh`}>
        <div className="absolute inset-0 flex overflow-hidden rounded-full">
          <span className="h-full bg-[rgb(245_170_80/0.35)]" style={{ width: `${duoi}%` }} />
          <span className="h-full bg-[rgb(170_180_214/0.3)]" style={{ width: `${tren - duoi}%` }} />
          <span className="h-full flex-1 bg-[rgb(111_211_181/0.35)]" />
        </div>
        <motion.span aria-hidden data-testid="kim-than"
          className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-bg bg-gold shadow-glow"
          initial={giam ? false : { left: "0%" }} animate={{ left: `${vi}%` }}
          transition={giam ? { duration: 0 } : { duration: 1.1, ease: [0.22, 1, 0.36, 1] }} style={{ left: `${vi}%` }} />
      </div>
      <div className="mt-2 grid grid-cols-3 text-[0.7rem] text-fg-faint">
        <span>Cần điểm tựa</span><span className="text-center">Cân bằng</span><span className="text-right">Mạnh</span>
      </div>
      <ChanQr nhan="Quét để xem sức tự thân của bạn" />
    </figure>
  );
}

export function BieuDoNguHanh({ bd, haiCach }: { bd: BieuDoT; haiCach?: HaiCach }) {
  const giam = useReducedMotion();
  const lon = Math.max(0.01, ...bd.hanh.map((h) => h.ty_le));
  return (
    <figure className="mt-5 rounded-2xl border border-line/70 p-4" data-testid="bieu-do-ngu-hanh">
      <figcaption className="text-sm font-semibold text-fg">Năm phần năng lượng trong bạn</figcaption>
      <ul className="mt-3 space-y-3">
        {bd.hanh.map((h, i) => (
          <li key={h.hanh} data-testid="cot-hanh" data-hanh={SLUG[h.hanh] ?? h.hanh} data-trang-thai={h.trang_thai}
            className="bd-hanh grid grid-cols-[2.6rem_minmax(0,1fr)_2.6rem] items-center gap-x-2 gap-y-1">
            <span className={cn("text-sm font-semibold", h.hanh === bd.nhat_chu && "underline decoration-gold underline-offset-4")}
              title={h.hanh === bd.nhat_chu ? "Hành của chính bạn" : undefined}>{h.hanh}</span>
            <div className="h-3 overflow-hidden rounded-full bg-line/40" role="img" aria-label={`${h.hanh}: ${pct(h.ty_le)}%`}>
              <motion.span className="block h-full rounded-full bg-[rgb(var(--hanh))]"
                initial={giam ? false : { width: 0 }} animate={{ width: `${(h.ty_le / lon) * 100}%` }}
                transition={giam ? { duration: 0 } : { duration: 0.8, delay: 0.1 + i * 0.09, ease: "easeOut" }}
                style={{ width: `${(h.ty_le / lon) * 100}%` }} />
            </div>
            <span className="text-right text-xs tabular-nums text-fg-muted">{pct(h.ty_le)}%</span>
            <span className="col-start-2 col-end-4 flex min-w-0 flex-wrap items-center gap-1.5 text-[0.7rem] text-fg-faint">
              <span className="min-w-0">{h.nhom}</span>
              {h.trang_thai === "thieu" && <span className="rounded-full border border-[rgb(245_170_80/0.6)] px-1.5 text-[rgb(245_170_80)]">đang thiếu</span>}
              {h.trang_thai === "thua" && <span className="rounded-full border border-line px-1.5">đang dư</span>}
              {h.cach_1 && <span className="rounded-full bg-moon/15 px-1.5 text-moon" data-testid="goi-y-cach-1">cách 1 gợi ý bù</span>}
              {h.cach_2 && <span className="rounded-full border border-moon/50 px-1.5 text-moon" data-testid="goi-y-cach-2">cách 2 gợi ý bù</span>}
            </span>
          </li>
        ))}
      </ul>
      {haiCach && (
        <p className="mt-3 text-xs leading-relaxed text-fg-faint">
          Cách 1 — {haiCach.cach_1.ten.toLowerCase()}: {haiCach.cach_1.hanh.join(", ") || "đã khá cân"} · Cách 2 —{" "}
          {haiCach.cach_2.ten.toLowerCase()}: {haiCach.cach_2.hanh.join(", ") || "chưa rõ"}. Hai trường phái, hệ thống không chọn thay bạn.
        </p>
      )}
      <ChanQr nhan="Quét để xem ngũ hành của bạn" />
    </figure>
  );
}

const SO: Record<Muc, number> = { thuan: 1, can_bang: 0, can_chu_dong: -1 };

/** Dải đại vận theo hai cách đọc. Chỉ hiện khi engine trả mức từng cách (báo cáo Bát tự). */
export function DaiVanHaiCach({ ds }: { ds: MocDaiHan[] }) {
  const giam = useReducedMotion();
  if (!ds.length || !ds.every((m) => m.muc_cach_1 && m.muc_cach_2)) return null;
  const W = 640, H = 92, pad = 4, w = (W - pad * 2) / ds.length;
  const y = (m?: Muc) => 46 - (m ? SO[m] : 0) * 14;
  return (
    <figure className="mt-5 min-w-0" data-testid="dai-van-hai-cach">
      {/* Điện thoại: giữ chữ đọc được (≥ 26rem), cuộn ngang TRONG khung, trang không cuộn ngang. */}
      <div className="overflow-x-auto pb-1">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[26rem]" role="img"
        aria-label={`Mức ${ds.length} giai đoạn mười năm theo hai cách đọc: ${ds.map((m) => `${m.tu_tuoi}–${m.den_tuoi} tuổi ${NHAN_MUC[m.muc].toLowerCase()}`).join("; ")}`}>
        {ds.map((m, i) => {
          const x = pad + i * w;
          return (
            <g key={`${m.tu_tuoi}-${m.cung}`}>
              <motion.rect x={x + 2} y={18} width={w - 4} height={56} rx={10} data-muc={m.muc}
                className="cham-muc" style={{ fill: "rgb(var(--muc) / 0.16)", stroke: m.hien_tai ? "rgb(var(--gold))" : "rgb(var(--muc) / 0.45)", transformOrigin: `${x + w / 2}px 46px`, transformBox: "view-box" }}
                strokeWidth={m.hien_tai ? 2 : 1}
                initial={giam ? false : { opacity: 0, scaleY: 0.2 }} animate={{ opacity: 1, scaleY: 1 }}
                transition={giam ? { duration: 0 } : { duration: 0.45, delay: i * 0.07 }} />
              <circle cx={x + w / 2 - 9} cy={y(m.muc_cach_1)} r={5} fill="rgb(var(--moon))" />
              <circle cx={x + w / 2 + 9} cy={y(m.muc_cach_2)} r={5} fill="none" stroke="rgb(var(--moon))" strokeWidth={2} />
              {m.hai_cach_khac && <text x={x + w / 2} y={70} textAnchor="middle" fontSize={11} fill="rgb(var(--fg-faint))">≠</text>}
              <text x={x + w / 2} y={12} textAnchor="middle" fontSize={11} fill={m.hien_tai ? "rgb(var(--gold))" : "rgb(var(--fg-faint))"}>{m.tu_tuoi}</text>
              <text x={x + w / 2} y={88} textAnchor="middle" fontSize={10} fill="rgb(var(--fg-faint))">{m.nam_tu}</text>
            </g>
          );
        })}
      </svg>
      </div>
      <figcaption className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.7rem] text-fg-faint">
        <span className="inline-flex items-center gap-1"><span className="inline-block size-2.5 rounded-full bg-moon" aria-hidden /> cách 1 — cân sức</span>
        <span className="inline-flex items-center gap-1"><span className="inline-block size-2.5 rounded-full border-2 border-moon" aria-hidden /> cách 2 — theo tháng sinh</span>
        <span>chấm cao = thuận, giữa = cân bằng, thấp = cần lưu ý · ≠ hai cách khác nhau</span>
      </figcaption>
      <ChanQr nhan="Quét để xem đại vận của bạn" />
    </figure>
  );
}
