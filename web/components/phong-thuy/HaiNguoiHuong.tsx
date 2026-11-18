"use client";
// UI-HHT (chủ dự án 2026-11-18) — "Vợ chồng, người cùng nhà: hướng nào hợp cả hai?". Nhập năm sinh + giới tính hai người →
// engine (POST /api/phongthuy/hai-cung) trả cung phi từng người, du niên của từng hướng với mỗi người, hướng chung và lệ
// "vợ chồng khác nhóm" của Dương Trạch Thập Thư. Web chỉ vẽ: la bàn HAI VÒNG (vòng trong người 1, vòng ngoài người 2; ô
// viền vàng = hướng tốt chung). Không lưu, không gửi năm sinh lên đo lường.
import { useState } from "react";
import Link from "@/components/khung/Lien";
import { Loader2 } from "lucide-react";
import { ghi } from "@/lib/do-luong";
import { cn } from "@/lib/utils";

const HUONG = ["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"];
interface Nguoi { nam: number; gioi_tinh: "nam" | "nu"; quai: string; nhom: string; slug: string; huong_tot: string[] }
interface KetQua {
  nguoi: [Nguoi, Nguoi]; cung_nhom: boolean; huong_chung: string[]; loi: string; luu_y: string;
  huong: { huong: string; du_nien_a: string; du_nien_b: string; a_cat: boolean; b_cat: boolean }[];
  sach?: { han: string; am?: string; y: string; cach_lam: string } | null;
}

function cung(i: number, r0: number, r1: number) {
  const a0 = ((i * 45 - 22.5 - 90) * Math.PI) / 180, a1 = ((i * 45 + 22.5 - 90) * Math.PI) / 180;
  const p = (r: number, a: number) => `${(100 + r * Math.cos(a)).toFixed(2)} ${(100 + r * Math.sin(a)).toFixed(2)}`;
  return `M ${p(r0, a0)} L ${p(r1, a0)} A ${r1} ${r1} 0 0 1 ${p(r1, a1)} L ${p(r0, a1)} A ${r0} ${r0} 0 0 0 ${p(r0, a0)} Z`;
}

function LaBanHai({ kq }: { kq: KetQua }) {
  const theo = new Map(kq.huong.map((h) => [h.huong, h]));
  const chung = new Set(kq.huong_chung);
  return (
    <svg viewBox="0 0 200 200" role="img" className="mx-auto h-auto w-full max-w-[20rem]"
      aria-label={`La bàn hai vòng: vòng trong cung ${kq.nguoi[0].quai}, vòng ngoài cung ${kq.nguoi[1].quai}. Hướng tốt chung: ${kq.huong_chung.join(", ") || "không có"}.`}>
      {HUONG.map((h, i) => {
        const m = theo.get(h)!;
        const a = ((i * 45 - 90) * Math.PI) / 180;
        return (
          <g key={h}>
            <path d={cung(i, 30, 62)} fill={m.a_cat ? "rgb(var(--jade) / 0.34)" : "rgb(var(--cinnabar) / 0.07)"} stroke="rgb(var(--line))" strokeWidth="0.6"
              className="origin-center [transform-box:fill-box] motion-safe:animate-[cung-hien_0.6s_ease-out_both]" style={{ animationDelay: `${i * 40}ms` }} />
            <path d={cung(i, 64, 96)} fill={m.b_cat ? "rgb(var(--gold) / 0.3)" : "rgb(var(--cinnabar) / 0.07)"} stroke="rgb(var(--line))" strokeWidth="0.6"
              className="origin-center [transform-box:fill-box] motion-safe:animate-[cung-hien_0.6s_ease-out_both]" style={{ animationDelay: `${200 + i * 40}ms` }} />
            {chung.has(h) && <path d={cung(i, 30, 96)} fill="none" stroke="rgb(var(--gold))" strokeWidth="1.8" />}
            <text x={100 + 80 * Math.cos(a)} y={100 + 80 * Math.sin(a) + 2.5} textAnchor="middle" fontSize="7" fill="rgb(var(--fg))">{h}</text>
          </g>
        );
      })}
      <circle cx="100" cy="100" r="28" fill="rgb(var(--surface))" stroke="rgb(var(--gold) / 0.6)" />
      <text x="100" y="98" textAnchor="middle" fontSize="8.5" fill="rgb(var(--jade))">{kq.nguoi[0].quai}</text>
      <text x="100" y="109" textAnchor="middle" fontSize="8.5" fill="rgb(var(--gold))">{kq.nguoi[1].quai}</text>
    </svg>
  );
}

function ONhap({ ten, nam, gioi, datNam, datGioi }: { ten: string; nam: string; gioi: "nam" | "nu"; datNam: (s: string) => void; datGioi: (g: "nam" | "nu") => void }) {
  return (
    <fieldset className="flex flex-wrap items-end gap-2">
      <legend className="mb-1 text-sm text-fg-muted">{ten}</legend>
      <input inputMode="numeric" pattern="\d{4}" maxLength={4} placeholder="Năm sinh" value={nam} aria-label={`${ten}: năm sinh`}
        onChange={(e) => datNam(e.target.value.replace(/\D/g, "").slice(0, 4))}
        className="min-h-11 w-28 rounded-xl border border-line bg-surface px-3 text-base text-fg" />
      {(["nam", "nu"] as const).map((g) => (
        <button key={g} type="button" aria-pressed={gioi === g} onClick={() => datGioi(g)}
          className={cn("min-h-11 rounded-xl border px-3.5 text-sm", gioi === g ? "border-gold bg-gold/10 text-fg" : "border-line text-fg-muted hover:text-fg")}>
          {g === "nam" ? "Nam" : "Nữ"}
        </button>
      ))}
    </fieldset>
  );
}

export function HaiNguoiHuong({ duongCung }: { duongCung: Record<string, string> }) {
  const [a, setA] = useState({ nam: "", gioi: "nam" as "nam" | "nu" });
  const [b, setB] = useState({ nam: "", gioi: "nu" as "nam" | "nu" });
  const [kq, setKq] = useState<KetQua | null>(null);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const hopLe = (s: string) => /^\d{4}$/.test(s) && +s >= 1900 && +s <= 2100;

  async function xem() {
    if (!hopLe(a.nam) || !hopLe(b.nam)) { setLoi("Nhập năm sinh 4 chữ số (1900–2100) cho cả hai người."); return; }
    setDang(true); setLoi(null);
    try {
      const r = await fetch("/api/phongthuy/hai-cung", { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ a: { nam: +a.nam, gioi_tinh: a.gioi }, b: { nam: +b.nam, gioi_tinh: b.gioi } }) });
      if (!r.ok) throw new Error();
      const d = (await r.json()) as KetQua;
      setKq(d);
      ghi("chart_interacted", { mo_dun: "phongthuy", kind: "hai_cung", cung_nhom: d.cung_nhom, so_chung: d.huong_chung.length });
    } catch {
      setLoi("Chưa xem được lúc này, bạn thử lại sau ít phút.");
    } finally { setDang(false); }
  }

  return (
    <section className="glass mt-10 rounded-2xl p-5 sm:p-6" aria-labelledby="hai-nguoi" data-testid="hai-nguoi-huong">
      <h2 id="hai-nguoi" className="text-xl sm:text-2xl">Vợ chồng, người cùng nhà: hướng nào hợp cả hai?</h2>
      <p className="mt-2 text-sm text-fg-muted">Nhập năm sinh hai người (không lưu). Cùng nhóm Đông hoặc Tây tứ mệnh thì chung bốn hướng tốt; khác nhóm thì có cách chia phòng.</p>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
        <ONhap ten="Người thứ nhất" nam={a.nam} gioi={a.gioi} datNam={(s) => setA({ ...a, nam: s })} datGioi={(g) => setA({ ...a, gioi: g })} />
        <ONhap ten="Người thứ hai" nam={b.nam} gioi={b.gioi} datNam={(s) => setB({ ...b, nam: s })} datGioi={(g) => setB({ ...b, gioi: g })} />
      </div>
      <button type="button" onClick={xem} disabled={dang} data-testid="hai-nguoi-xem"
        className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-gold px-5 text-sm font-medium text-bg disabled:opacity-60">
        {dang && <Loader2 className="size-4 animate-spin" aria-hidden />} Xem hướng chung
      </button>
      {loi && <p className="mt-3 text-sm text-fg-muted" role="alert">{loi}</p>}
      {kq && (
        <div className="mt-6 grid items-start gap-6 md:grid-cols-[minmax(0,20rem)_1fr]" data-testid="hai-nguoi-ket-qua" aria-live="polite">
          <figure>
            <LaBanHai kq={kq} />
            <figcaption className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-fg-muted">
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-jade/50" /> Vòng trong: người 1</span>
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-gold/50" /> Vòng ngoài: người 2</span>
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm border-2 border-gold" /> Tốt cho cả hai</span>
            </figcaption>
          </figure>
          <div className="min-w-0 space-y-3">
            <ul className="space-y-1.5 text-sm">
              {kq.nguoi.map((n, i) => (
                <li key={i} className="text-fg-muted">
                  Người {i + 1} ({n.gioi_tinh === "nam" ? "nam" : "nữ"} {n.nam}):{" "}
                  <Link href={duongCung[n.slug] ?? "#"} className="text-gold underline underline-offset-2">cung {n.quai}</Link>, {n.nhom}
                </li>
              ))}
            </ul>
            <p className="leading-relaxed text-fg">{kq.loi}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-fg-faint"><tr><th className="py-1.5 pr-3 font-normal">Hướng</th><th className="py-1.5 pr-3 font-normal">Người 1</th><th className="py-1.5 font-normal">Người 2</th></tr></thead>
                <tbody>
                  {kq.huong.map((h) => (
                    <tr key={h.huong} className={cn("border-t border-line/50", h.a_cat && h.b_cat && "bg-gold/5")}>
                      <td className="py-1.5 pr-3 text-fg">{h.huong}</td>
                      <td className={cn("py-1.5 pr-3", h.a_cat ? "text-jade" : "text-fg-faint")}>{h.du_nien_a}</td>
                      <td className={cn("py-1.5", h.b_cat ? "text-jade" : "text-fg-faint")}>{h.du_nien_b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!kq.cung_nhom && kq.sach && (
              <div className="rounded-xl border border-line/70 p-4 text-sm">
                <p className="text-fg-faint">Sách xưa ghi</p>
                <p className="mt-1 leading-relaxed text-fg-muted">{kq.sach.y}</p>
                <p className="mt-1 font-serif text-fg-faint" lang="zh-Hant">{kq.sach.han}</p>
              </div>
            )}
            <p className="text-xs text-fg-faint">{kq.luu_y}</p>
          </div>
        </div>
      )}
    </section>
  );
}
