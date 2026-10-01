"use client";
// VZ-3 — Bát tự trực quan: bảng tứ trụ đầy đủ (thập thần, can chi tô ngũ hành, tàng can, nạp âm,
// trường sinh, thần sát, không vong) · vòng 12 địa chi với hợp/xung/hình/hại/phá · ngũ giác ngũ hành
// sinh–khắc · dải đại vận + lưu niên/lưu nguyệt. Chỉ VẼ số liệu engine; màu theo biến --ls-* (2 giao diện).
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { LaSoBatTu, LuuNienBatTu, QuanHe } from "@/lib/battu-kieu";
import { cn } from "@/lib/utils";

const TEN_TRU = ["Năm", "Tháng", "Ngày", "Giờ"];
const Y_TRU = ["Tổ nghiệp · gốc rễ", "Cha mẹ · môi trường", "Bản thân · hôn phối", "Con cái · hậu vận"];
const VAR_HANH: Record<string, string> = {
  "Kim": "var(--ls-kim)", "Mộc": "var(--ls-moc)", "Thủy": "var(--ls-thuy)", "Hỏa": "var(--ls-hoa)", "Thổ": "var(--ls-tho)",
};
const mau = (h?: string) => (h ? VAR_HANH[h] ?? "var(--ls-chu)" : "var(--ls-chu)");
const MAU_TS: Record<string, string> = { "cát": "var(--ls-cat)", "hung": "var(--ls-sat)", "trung": "var(--ls-luu)" };

// --------------------------------------------------------------------------- bảng tứ trụ
export function BangTuTru({ ls }: { ls: LaSoBatTu }) {
  const m = ls.mo_rong;
  const hc = (c: string) => m?.bang_hanh.can[c];
  const hz = (c: string) => m?.bang_hanh.chi[c];
  const dong = "grid grid-cols-[4.6rem_repeat(4,minmax(0,1fr))] items-center gap-x-1.5 sm:grid-cols-[6rem_repeat(4,minmax(0,1fr))] sm:gap-x-3";
  const nhan = "text-[0.68rem] uppercase tracking-[0.12em] text-[var(--ls-mo)] sm:text-xs";
  return (
    <div role="table" aria-label="Bảng tứ trụ" className="space-y-0 text-[var(--ls-chu)]">
      <div role="row" className={cn(dong, "pb-2")}>
        <span role="columnheader" className="sr-only">Mục</span>
        {TEN_TRU.map((t, i) => (
          <div key={t} role="columnheader" className="text-center">
            <p className={cn("font-semibold", i === 2 ? "text-[var(--ls-nhan)]" : "")}>Trụ {t.toLowerCase()}</p>
            <p className="hidden text-[0.7rem] text-[var(--ls-mo)] sm:block">{Y_TRU[i]}</p>
          </div>
        ))}
      </div>
      <Hang ten="Thập thần" lop={dong} nhan={nhan}>
        {ls.thap_than_can.map((t, i) => <span key={i} className={cn("text-sm", i === 2 ? "font-semibold text-[var(--ls-nhan)]" : "")}>{i === 2 ? "Nhật chủ" : t}</span>)}
      </Hang>
      <Hang ten="Thiên can" lop={dong} nhan={nhan} dam>
        {ls.tru.map((t, i) => (
          <span key={i} className="flex flex-col items-center">
            <span className={cn("font-serif text-4xl leading-none sm:text-5xl", i === 2 && "underline decoration-[var(--ls-nhan)] decoration-2 underline-offset-8")} style={{ color: mau(hc(t.can)) }}>{t.can}</span>
            {hc(t.can) && <span className="mt-1.5 text-[0.7rem] text-[var(--ls-mo)]">{hc(t.can)}</span>}
          </span>
        ))}
      </Hang>
      <Hang ten="Địa chi" lop={dong} nhan={nhan} dam>
        {ls.tru.map((t, i) => (
          <span key={i} className="relative flex flex-col items-center">
            <span className="font-serif text-4xl leading-none sm:text-5xl" style={{ color: mau(hz(t.chi)) }}>{t.chi}</span>
            <span className="mt-1.5 text-[0.7rem] text-[var(--ls-mo)]">
              {hz(t.chi)}{m?.khong_vong.ngay.includes(t.chi) && i !== 2 ? <b className="ml-1 rounded bg-[var(--ls-tt-nen)] px-1 text-[var(--ls-tt-chu)]" title="Không vong (tuần không theo trụ ngày)">KV</b> : null}
            </span>
          </span>
        ))}
      </Hang>
      <Hang ten="Tàng can" lop={dong} nhan={nhan}>
        {ls.tang_can.map((x, i) => (
          <span key={i} className="flex flex-col items-center gap-0.5">
            {x.map((c, k) => (
              <span key={k} className="whitespace-nowrap text-xs sm:text-sm">
                <b style={{ color: mau(hc(c)) }}>{c}</b> <span className="text-[var(--ls-mo)]">{ls.thap_than_chi[i]?.[k]}</span>
              </span>
            ))}
          </span>
        ))}
      </Hang>
      {m && (
        <>
          <Hang ten="Nạp âm" lop={dong} nhan={nhan}>
            {m.nap_am.map((n, i) => <span key={i} className="text-xs sm:text-sm" style={{ color: mau(n.hanh) }}>{n.ten}</span>)}
          </Hang>
          <Hang ten="Tinh vận" goiY="12 trường sinh của nhật chủ tại mỗi chi" lop={dong} nhan={nhan}>
            {m.truong_sinh.map((s, i) => <span key={i} className="text-xs sm:text-sm">{s}</span>)}
          </Hang>
          <Hang ten="Tự toạ" goiY="Can mỗi trụ ngồi trên chi của chính nó" lop={dong} nhan={nhan}>
            {m.tu_toa.map((s, i) => <span key={i} className="text-xs text-[var(--ls-mo)] sm:text-sm">{s}</span>)}
          </Hang>
          <Hang ten="Thần sát" lop={dong} nhan={nhan} canTren>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="flex flex-wrap justify-center gap-1">
                {m.than_sat.filter((t) => t.tru.includes(i)).map((t) => (
                  <span key={t.ten} title={t.y} className="rounded-full border px-1.5 py-px text-[0.65rem] leading-4 sm:text-xs"
                    style={{ color: MAU_TS[t.loai], borderColor: MAU_TS[t.loai] }}>{t.ten}</span>
                ))}
              </span>
            ))}
          </Hang>
        </>
      )}
    </div>
  );
}

function Hang({ ten, goiY, children, lop, nhan, dam, canTren }: {
  ten: string; goiY?: string; children: React.ReactNode; lop: string; nhan: string; dam?: boolean; canTren?: boolean;
}) {
  return (
    <div role="row" className={cn(lop, "border-t border-[var(--ls-vien)] text-center", dam ? "py-3" : "py-2", canTren && "items-start")}>
      <span role="rowheader" className={cn(nhan, "text-left")} title={goiY}>{ten}</span>
      {Array.isArray(children) ? children.map((c, i) => <span key={i} role="cell" className="min-w-0">{c}</span>) : children}
    </div>
  );
}

// --------------------------------------------------------------------------- vòng 12 địa chi
const CHI12 = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
const KIEU_QH: Record<string, { mau: string; net?: string; ten: string }> = {
  "lục hợp": { mau: "var(--ls-moc)", ten: "Lục hợp" },
  "tam hợp": { mau: "var(--ls-moc)", ten: "Tam hợp" },
  "bán hợp": { mau: "var(--ls-moc)", net: "2 4", ten: "Bán hợp" },
  "tam hội": { mau: "var(--ls-cat)", ten: "Tam hội" },
  "lục xung": { mau: "var(--ls-sat)", ten: "Lục xung" },
  "tương hình": { mau: "var(--ls-tho)", net: "7 5", ten: "Tương hình" },
  "tự hình": { mau: "var(--ls-tho)", net: "7 5", ten: "Tự hình" },
  "lục hại": { mau: "var(--ls-luu)", net: "2 5", ten: "Lục hại" },
  "tương phá": { mau: "var(--ls-mo)", net: "2 5", ten: "Tương phá" },
  "can ngũ hợp": { mau: "var(--ls-moc)", ten: "Can ngũ hợp" },
  "can tương xung": { mau: "var(--ls-sat)", ten: "Can tương xung" },
};

export function VongDiaChi({ ls, them }: { ls: LaSoBatTu; them?: { chi: string; nhan: string } | null }) {
  const m = ls.mo_rong;
  const [chon, setChon] = useState<number | null>(null);
  const giam = useReducedMotion();
  if (!m) return null;
  const C = 180, R = 128;
  const pos = (chi: string, r = R): [number, number] => {
    const a = (CHI12.indexOf(chi) * 30 - 90) * (Math.PI / 180);
    return [C + r * Math.cos(a), C + r * Math.sin(a)];
  };
  const truChi = ls.tru.map((t) => t.chi);
  const tatCaChi = them ? [...truChi, them.chi] : truChi;
  const nhanTai = (chi: string) => [...TEN_TRU, them?.nhan ?? ""].filter((_, i) => tatCaChi[i] === chi);
  const qh = m.quan_he.filter((q) => !q.loai.startsWith("can "));
  const qhCan = m.quan_he.filter((q) => q.loai.startsWith("can "));
  return (
    <figure className="space-y-3">
      <svg viewBox="0 0 360 360" className="mx-auto block w-full max-w-[22rem]" role="img"
        aria-label={`Vòng 12 địa chi: ${qh.map((q) => q.mo_ta).join("; ") || "không có hợp xung giữa các trụ"}`}>
        <circle cx={C} cy={C} r={R} fill="none" stroke="var(--ls-vien)" />
        <circle cx={C} cy={C} r={R - 34} fill="none" stroke="var(--ls-vien)" strokeDasharray="2 6" />
        {qh.map((q, k) => {
          const k2: { mau: string; net?: string } = KIEU_QH[q.loai] ?? { mau: "var(--ls-mo)" };
          const diem = [...new Set(q.tru.map((i) => truChi[i]!))].map((c) => pos(c, R - 18));
          const mo = chon !== null && chon !== k ? 0.15 : 0.9;
          if (diem.length === 1) {
            const [x, y] = diem[0]!;
            return <circle key={k} cx={x + (C - x) * 0.18} cy={y + (C - y) * 0.18} r={14} fill="none" stroke={k2.mau} strokeWidth={2} strokeDasharray={k2.net} opacity={mo} />;
          }
          const d = diem.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join(" ") + (diem.length > 2 ? " Z" : "");
          return (
            <motion.path key={`${q.loai}-${q.tru.join()}`} d={d} fill={diem.length > 2 ? k2.mau : "none"} fillOpacity={diem.length > 2 ? 0.08 : 0}
              stroke={k2.mau} strokeWidth={2.2} strokeDasharray={k2.net} strokeLinejoin="round" opacity={mo}
              initial={giam ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, delay: k * 0.06 }} />
          );
        })}
        {CHI12.map((c) => {
          const [x, y] = pos(c);
          const co = nhanTai(c);
          const [lx, ly] = pos(c, R + 30);
          return (
            <g key={c}>
              <circle cx={x} cy={y} r={co.length ? 19 : 13} fill={co.length ? "var(--ls-o-sang)" : "var(--ls-o)"}
                stroke={co.length ? mau(m.bang_hanh.chi[c]) : "var(--ls-vien)"} strokeWidth={co.length ? 2 : 1} />
              <text x={x} y={y + 4.5} textAnchor="middle" fontSize={co.length ? 13 : 11} fontWeight={co.length ? 700 : 400}
                fill={co.length ? mau(m.bang_hanh.chi[c]) : "var(--ls-mo)"}>{c}</text>
              {co.length > 0 && <text x={lx} y={ly + 4} textAnchor="middle" fontSize={10.5} fill="var(--ls-chu)">{co.join("·")}</text>}
            </g>
          );
        })}
        <text x={C} y={C - 4} textAnchor="middle" fontSize={11} letterSpacing="0.2em" fill="var(--ls-mo)">ĐỊA CHI</text>
        <text x={C} y={C + 14} textAnchor="middle" fontSize={12} fill="var(--ls-han)" style={{ fontFamily: "var(--font-han), serif" }}>地支</text>
      </svg>
      <figcaption>
        <DanhSachQuanHe ds={[...qh, ...qhCan]} chon={chon} setChon={(k) => setChon(k !== null && k < qh.length ? k : null)} />
      </figcaption>
    </figure>
  );
}

function DanhSachQuanHe({ ds, chon, setChon }: { ds: QuanHe[]; chon: number | null; setChon: (k: number | null) => void }) {
  if (!ds.length) return <p className="text-center text-sm text-[var(--ls-mo)]">Bốn trụ không có hợp, xung, hình, hại đáng kể.</p>;
  return (
    <ul className="flex flex-wrap justify-center gap-1.5">
      {ds.map((q, k) => {
        const k2 = KIEU_QH[q.loai];
        return (
          <li key={k}>
            <button type="button" onMouseEnter={() => setChon(k)} onMouseLeave={() => setChon(null)} onFocus={() => setChon(k)} onBlur={() => setChon(null)}
              className={cn("rounded-full border px-2.5 py-1 text-xs transition-opacity", chon !== null && chon !== k && "opacity-50")}
              style={{ borderColor: k2?.mau, color: "var(--ls-chu)" }}>
              <b style={{ color: k2?.mau }}>{k2?.ten ?? q.loai}</b> · {q.mo_ta.split(":")[0]}{q.mo_ta.includes(":") ? ` (${q.mo_ta.split(": ")[1]?.split(" ")[0]})` : ""}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

// --------------------------------------------------------------------------- ngũ giác ngũ hành
const VONG_SINH = ["Mộc", "Hỏa", "Thổ", "Kim", "Thủy"];   // theo chiều kim đồng hồ: mỗi hành sinh hành kế tiếp

export function NguGiacNguHanh({ ls }: { ls: LaSoBatTu }) {
  const m = ls.mo_rong;
  const diem = ls.ngu_hanh.diem;
  const max = Math.max(...Object.values(diem), 0.01);
  const tong = Object.values(diem).reduce((a, b) => a + b, 0) || 1;
  const C = 180, R = 118;
  const p = (i: number, r = R): [number, number] => {
    const a = (i * 72 - 90) * (Math.PI / 180);
    return [C + r * Math.cos(a), C + 12 + r * Math.sin(a)];
  };
  const nc = ls.nhat_chu.ngu_hanh;
  return (
    <figure className="space-y-3">
      <svg viewBox="0 0 360 372" className="mx-auto block w-full max-w-[22rem]" role="img"
        aria-label={`Ngũ hành: ${VONG_SINH.map((h) => `${h} ${diem[h] ?? 0}`).join(", ")}. Nhật chủ hành ${nc}.`}>
        <defs>
          <marker id="mui-sinh" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="var(--ls-moc)" />
          </marker>
          <marker id="mui-khac" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="var(--ls-sat)" />
          </marker>
        </defs>
        {VONG_SINH.map((h, i) => {
          // sinh: i → i+1 (cạnh ngũ giác); khắc: i → i+2 (đường chéo ngôi sao)
          const rut = (a: [number, number], b: [number, number], d: number): [[number, number], [number, number]] => {
            const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy);
            return [[a[0] + (dx / l) * d, a[1] + (dy / l) * d], [b[0] - (dx / l) * d, b[1] - (dy / l) * d]];
          };
          const [s1, s2] = rut(p(i), p((i + 1) % 5), 40);
          const [k1, k2] = rut(p(i), p((i + 2) % 5), 40);
          return (
            <g key={h}>
              <line x1={s1[0]} y1={s1[1]} x2={s2[0]} y2={s2[1]} stroke="var(--ls-moc)" strokeOpacity={0.7} strokeWidth={1.6} markerEnd="url(#mui-sinh)" />
              <line x1={k1[0]} y1={k1[1]} x2={k2[0]} y2={k2[1]} stroke="var(--ls-sat)" strokeOpacity={0.45} strokeWidth={1.2} strokeDasharray="4 4" markerEnd="url(#mui-khac)" />
            </g>
          );
        })}
        {VONG_SINH.map((h, i) => {
          const [x, y] = p(i);
          const d = diem[h] ?? 0;
          const r = 14 + 22 * Math.sqrt(d / max);
          const laNc = h === nc;
          const nhanY = y + (i === 0 ? -r - 26 : r + 16);
          return (
            <g key={h}>
              {laNc && <circle cx={x} cy={y} r={r + 7} fill="none" stroke="var(--ls-nhan)" strokeWidth={2} strokeDasharray="3 3" />}
              <circle cx={x} cy={y} r={r} fill={mau(h)} fillOpacity={d ? 0.85 : 0.12} stroke={mau(h)} strokeWidth={1.5} />
              <text x={x} y={y + 4.5} textAnchor="middle" fontSize={13} fontWeight={700} fill={d ? "var(--ls-nen)" : mau(h)}>{h}</text>
              <text x={x} y={nhanY} textAnchor="middle" fontSize={11.5} fill="var(--ls-chu)">
                {Math.round((d / tong) * 100)}%{m?.vai_tro_hanh[h] ? <tspan fill="var(--ls-mo)"> · {laNc ? "Nhật chủ" : m.vai_tro_hanh[h]}</tspan> : null}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="space-y-2 text-center text-sm">
        <ThanhVuongNhuoc ti_le={ls.than.ti_le} ket={ls.than.ket_luan} />
        <p className="text-xs text-[var(--ls-mo)]"><span style={{ color: "var(--ls-moc)" }}>→ mũi tên liền</span>: tương sinh · <span style={{ color: "var(--ls-sat)" }}>⇢ nét đứt</span>: tương khắc · vòng lớn = điểm cao{ls.ngu_hanh.thieu.length ? ` · thiếu ${ls.ngu_hanh.thieu.join(", ")}` : ""}</p>
      </figcaption>
    </figure>
  );
}

function ThanhVuongNhuoc({ ti_le, ket }: { ti_le: number; ket: string }) {
  return (
    <div className="mx-auto max-w-xs">
      <div className="flex justify-between text-[0.7rem] text-[var(--ls-mo)]"><span>Thân nhược</span><span>Trung hoà</span><span>Thân vượng</span></div>
      <div className="relative mt-1 h-2 rounded-full" style={{ background: "linear-gradient(90deg, var(--ls-thuy), var(--ls-cat), var(--ls-hoa))", opacity: 0.85 }}>
        <span className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--ls-nen)] bg-[var(--ls-chu)]"
          style={{ left: `${Math.min(98, Math.max(2, ti_le * 100))}%` }} aria-hidden />
      </div>
      <p className="mt-1.5 text-[var(--ls-chu)]">Thân <b>{ket}</b> · phe ta {Math.round(ti_le * 100)}%</p>
    </div>
  );
}

// --------------------------------------------------------------------------- đại vận + lưu niên
export function DaiVanLuuNien({ ls, ln, namXem, setNamXem }: {
  ls: LaSoBatTu; ln: LuuNienBatTu | null; namXem: number; setNamXem: (n: number) => void;
}) {
  const m = ls.mo_rong;
  const hc = (c: string) => m?.bang_hanh.can[c];
  const hz = (c: string) => m?.bang_hanh.chi[c];
  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <p className="eyebrow">Đại vận · mỗi vận 10 năm</p>
          {ls.dai_van.khoi_van && <p className="text-xs text-[var(--ls-mo)]">Khởi vận sau {ls.dai_van.khoi_van.nam} năm {ls.dai_van.khoi_van.thang} tháng · đi {ls.dai_van.thuan ? "thuận" : "nghịch"}</p>}
        </div>
        <ol className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:thin]" aria-label="Đại vận">
          {ls.dai_van.ds.map((v, i) => {
            const on = namXem >= v.tu_nam && namXem <= v.den_nam;
            return (
              <li key={v.tu_nam}>
                <button type="button" aria-pressed={on} onClick={() => setNamXem(on ? namXem : v.tu_nam)}
                  className={cn("min-w-[5.6rem] rounded-xl border px-2 py-2.5 text-center transition-colors",
                    on ? "border-[var(--ls-nhan)] bg-[var(--ls-menh-nen)]" : "border-[var(--ls-vien)] bg-[var(--ls-o)] hover:border-[var(--ls-nhan-mo)]")}>
                  <p className="text-[0.7rem] text-[var(--ls-mo)]">{m?.dai_van_thap_than[i] ?? ""}</p>
                  <p className="font-serif text-2xl leading-tight"><span style={{ color: mau(hc(v.can)) }}>{v.can}</span></p>
                  <p className="font-serif text-2xl leading-tight"><span style={{ color: mau(hz(v.chi)) }}>{v.chi}</span></p>
                  <p className="mt-1 text-[0.7rem] text-[var(--ls-chu)]">{v.tu_nam}–{v.den_nam}</p>
                  <p className="text-[0.65rem] text-[var(--ls-mo)]">từ {v.tu_tuoi_thuc} tuổi</p>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {ln && (
        <div className="grid gap-4 md:grid-cols-[minmax(0,15rem)_1fr]" data-testid="luu-nien-bat-tu">
          <div className="rounded-2xl border border-[var(--ls-vien)] bg-[var(--ls-o)] p-4 text-center">
            <p className="eyebrow">Lưu niên {ln.nam}</p>
            <p className="mt-2 font-serif text-4xl"><span style={{ color: mau(hc(ln.can)) }}>{ln.can}</span> <span style={{ color: mau(hz(ln.chi)) }}>{ln.chi}</span></p>
            <p className="mt-1 text-sm">{ln.thap_than} <span className="text-[var(--ls-mo)]">/ chi {ln.thap_than_chi}</span></p>
            <p className="text-xs text-[var(--ls-mo)]">{ln.nap_am.ten} · nhật chủ {ln.truong_sinh}</p>
            {ln.dai_van && <p className="mt-2 text-xs text-[var(--ls-mo)]">Trong vận {ln.dai_van.can} {ln.dai_van.chi} ({ln.dai_van.thap_than})</p>}
            {ln.quan_he.length > 0 && (
              <ul className="mt-3 space-y-1 text-left text-xs">
                {ln.quan_he.map((q, k) => <li key={k}><b style={{ color: KIEU_QH[q.loai]?.mau }}>{KIEU_QH[q.loai]?.ten ?? q.loai}</b> <span className="text-[var(--ls-mo)]">{q.mo_ta.split(": ")[0]}</span></li>)}
              </ul>
            )}
          </div>
          <div>
            <p className="eyebrow mb-2">12 lưu nguyệt (tháng theo tiết, khởi tháng Dần)</p>
            <ol className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-6">
              {ln.luu_nguyet.map((t) => (
                <li key={t.thang} className="rounded-xl border border-[var(--ls-vien)] bg-[var(--ls-o)] px-2 py-1.5 text-center">
                  <p className="text-[0.65rem] text-[var(--ls-mo)]">Tháng {t.thang}</p>
                  <p className="font-serif text-lg leading-tight"><span style={{ color: mau(hc(t.can)) }}>{t.can}</span> <span style={{ color: mau(hz(t.chi)) }}>{t.chi}</span></p>
                  <p className="text-[0.65rem] text-[var(--ls-chu)]">{t.thap_than}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------- dụng thần
export function DungThan({ ls }: { ls: LaSoBatTu }) {
  const the = (ten: string, d: { hanh: string[]; giai_thich: string }) => (
    <div className="rounded-2xl border border-[var(--ls-vien)] bg-[var(--ls-o)] p-4">
      <p className="eyebrow">{ten}</p>
      <p className="mt-2 flex flex-wrap gap-2">
        {d.hanh.length ? d.hanh.map((h) => (
          <span key={h} className="rounded-full px-3 py-0.5 font-serif text-lg" style={{ color: mau(h), border: `1px solid ${mau(h)}` }}>{h}</span>
        )) : <span className="text-sm text-[var(--ls-mo)]">không cần bù</span>}
      </p>
      <p className="mt-2 text-sm text-[var(--ls-mo)]">{d.giai_thich}</p>
    </div>
  );
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {the("Dụng thần · Phù ức", ls.dung_than.phu_uc)}
      {the("Dụng thần · Điều hậu", ls.dung_than.dieu_hau)}
      <p className="text-xs text-[var(--ls-mo)] sm:col-span-2">
        Hai cách xác định dụng thần có thể khác nhau — hệ thống trình bày cả hai, không tự chọn thay bạn.
        {ls.dung_than.cach_cuc ? ` Cách cục theo nguyệt lệnh: ${ls.dung_than.cach_cuc.ten}.` : ""}
      </p>
    </div>
  );
}

