"use client";
// QTE — Numerology (English) phía trình duyệt: form (tên, ngày sinh, cách cộng) → /api/thanso/luan-giai với header `x-ngon-ngu: en`
// → hiện 4 số cốt lõi (nghĩa, mặt tối, câu phản chứng, thẻ tự tích), chân dung 4 mặt, đỉnh cao / thử thách / năm cá nhân,
// chỉ số phụ, rồi hỏi đáp. Hồ sơ chỉ trên máy. Web không tính gì — mọi con số và chữ của engine.
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { HoiEn, type TraLoiEn } from "@/components/en/HoiEn";
import { postEn } from "@/lib/en/api";
import { hoTen, useProfileEn, type ProfileEn } from "@/lib/en/hoso";
import type { LuanGiaiResult, MatChanDung, ViTriLuanGiai } from "@/lib/engine";
import { ghi } from "@/lib/do-luong";
import { cn } from "@/lib/utils";

const THANG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const GOI_Y = ["What does my Life Path number say about me?", "How do I tend to behave in love?", "How does my number show up at work?", "What is my personal year about?", "What is this month about for me?"];
type Loai = "name" | "nickname" | "day" | "month" | "year" | "method";

function Form({ banDau, onXong }: { banDau: ProfileEn | null; onXong: (p: ProfileEn) => void }) {
  const [f, setF] = useState<Record<Loai, string>>({ name: banDau?.name ?? "", nickname: banDau?.nickname ?? "", day: banDau ? String(banDau.day) : "", month: banDau ? String(banDau.month) : "", year: banDau ? String(banDau.year) : "", method: banDau?.method ?? "tung_phan" });
  const [loi, setLoi] = useState<string | null>(null);
  const dat = (k: Loai, v: string) => setF((x) => ({ ...x, [k]: v }));
  const gui = (e: React.FormEvent) => {
    e.preventDefault();
    const d = Number(f.day), m = Number(f.month), y = Number(f.year);
    if (!/[A-Za-z]/.test(f.name)) return setLoi("Please enter your name using Latin letters.");
    const ok = Number.isInteger(d) && Number.isInteger(m) && Number.isInteger(y) && y >= 1900 && y <= 2100 && new Date(Date.UTC(y, m - 1, d)).getUTCDate() === d;
    if (!ok) return setLoi("That date does not exist — please check the day, month and year.");
    setLoi(null);
    onXong({ name: f.name.trim().slice(0, 80), nickname: f.nickname.trim().slice(0, 80) || undefined, day: d, month: m, year: y, method: f.method === "tong_het" ? "tong_het" : "tung_phan" });
  };
  return (
    <form onSubmit={gui} className="glass rounded-2xl p-5 sm:p-6" data-testid="form-en" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-fg-muted">Full name (as on your birth certificate)
          <Input value={f.name} onChange={(e) => dat("name", e.target.value)} className="mt-1" placeholder="e.g. Mary Ann Lee" autoComplete="name" data-testid="o-ten-en" required /></label>
        <label className="block text-sm text-fg-muted">Name people call you (optional)
          <Input value={f.nickname} onChange={(e) => dat("nickname", e.target.value)} className="mt-1" placeholder="e.g. Molly" autoComplete="nickname" /></label>
      </div>
      <fieldset className="mt-4"><legend className="text-sm text-fg-muted">Date of birth</legend>
        <div className="mt-1 grid grid-cols-3 gap-2">
          <Input inputMode="numeric" value={f.day} onChange={(e) => dat("day", e.target.value.replace(/\D/g, "").slice(0, 2))} placeholder="Day" aria-label="Day" autoComplete="bday-day" data-testid="o-ngay-en" />
          <Select value={f.month} onChange={(e) => dat("month", e.target.value)} aria-label="Month" autoComplete="bday-month" data-testid="o-thang-en">
            <option value="">Month</option>{THANG.map((t, i) => <option key={t} value={i + 1}>{t}</option>)}
          </Select>
          <Input inputMode="numeric" value={f.year} onChange={(e) => dat("year", e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="Year" aria-label="Year" autoComplete="bday-year" data-testid="o-nam-en" />
        </div>
      </fieldset>
      <fieldset className="mt-4"><legend className="text-sm text-fg-muted">How to add the Life Path</legend>
        <div className="mt-1 grid gap-2 sm:grid-cols-2">
          {([["tung_phan", "Reduce day, month and year first", "The method of Western numerology books."], ["tong_het", "Add every digit at once", "Common on Vietnamese sites; sometimes gives a different number."]] as const).map(([v, t, m]) => (
            <label key={v} className={cn("cursor-pointer rounded-xl border p-3 text-sm", f.method === v ? "border-gold bg-gold/10" : "border-line")}>
              <input type="radio" name="method" value={v} checked={f.method === v} onChange={() => dat("method", v)} className="mr-2 accent-[rgb(var(--gold))]" />
              <span className="text-fg">{t}</span><span className="mt-0.5 block text-xs text-fg-faint">{m}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {loi && <p role="alert" className="mt-3 text-sm text-cinnabar">{loi}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="submit" data-testid="nut-xem-en">Show my numbers</Button>
        <p className="text-xs text-fg-faint">Your name and date stay in this browser and are sent only to compute. No account, nothing stored with your identity.</p>
      </div>
    </form>
  );
}

function TheSo({ vt }: { vt: ViTriLuanGiai }) {
  const [tick, setTick] = useState<Set<number>>(new Set());
  const kc = vt.kiem_chung;
  const n = tick.size;
  const kq = kc ? (n >= kc.nguong.khop ? kc.ket_qua.khop : n >= kc.nguong.mot_phan ? kc.ket_qua.mot_phan : n > 0 ? kc.ket_qua.chua_khop : null) : null;
  return (
    <article className="glass rounded-2xl p-5" data-testid={`so-en-${vt.vi_tri}`}>
      <div className="flex items-baseline justify-between gap-3">
        <div><p className="eyebrow">{vt.ten}</p><p className="text-sm text-fg-faint">{vt.khung}</p></div>
        <p className="font-serif text-5xl text-gold">{vt.gia_tri}</p>
      </div>
      {vt.nghia ? (
        <>
          <p className="mt-3 text-fg">{vt.nghia.tu_khoa}{vt.nghia.so_cai ? " · master number" : ""}</p>
          <p className="mt-1 text-sm text-fg-muted"><span className="text-fg-faint">Shadow side: </span>{vt.nghia.mat_toi}</p>
          <p className="mt-1 text-sm text-fg-muted"><span className="text-fg-faint">Counter-question: </span>{vt.nghia.phan_chung}</p>
        </>
      ) : <p className="mt-3 text-sm text-fg-muted">{vt.ghi_chu_do_nhay}</p>}
      {vt.ghi_chu_do_nhay && vt.nghia && <p className="mt-2 text-xs text-fg-faint">{vt.ghi_chu_do_nhay}</p>}
      {kc && (
        <div className="mt-4 rounded-xl border border-line/60 bg-bg/40 p-3 text-sm">
          <p className="text-fg-muted">{kc.cau_hoi}</p>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            {kc.net.map((x, i) => (
              <li key={i}><label className="flex cursor-pointer items-start gap-2"><input type="checkbox" className="mt-1 accent-[rgb(var(--gold))]" checked={tick.has(i)} onChange={(e) => setTick((s) => { const t = new Set(s); e.target.checked ? t.add(i) : t.delete(i); return t; })} />
                <span><span className={cn("mr-1 text-xs", x.loai === "manh" ? "text-jade" : "text-[#f0b35c]")}>{x.loai === "manh" ? "strength" : "blind spot"}</span>{x.chu}</span></label></li>
            ))}
          </ul>
          {kq && <p className="mt-2 text-fg" data-testid="ket-qua-tick">{kq}</p>}
        </div>
      )}
      {vt.cach_tinh && <details className="mt-3 text-xs text-fg-faint"><summary className="cursor-pointer text-gold">How it was calculated</summary><p className="mt-1 break-words">{vt.cach_tinh.dien_giai}</p></details>}
    </article>
  );
}

const TRUONG_MAT: Record<string, [string, string][]> = {
  tong_quan: [["chan_dung", "Portrait"], ["dong_luc", "What drives you"], ["khi_cang_thang", "Under stress"], ["huong_lon", "Big direction"]],
  tinh_cam: [["cach_yeu", "How you love"], ["can_duoc", "What you need"], ["diem_mu", "Blind spot"], ["hop_kieu_nguoi", "Who suits you"], ["dau_hieu_lech", "Warning sign"], ["hon_nhan", "In marriage"]],
  cong_viec: [["the_manh", "Strengths"], ["moi_truong", "Environment"], ["vai_tro", "Roles"], ["cai_bay", "The trap"], ["tien_bac", "Money"]],
  bien_co: [["kieu_bien_co", "Typical turning points"], ["bai_hoc", "The lesson"], ["cach_di_qua", "How to get through"]],
};

function ChanDungEn({ mat }: { mat: MatChanDung[] }) {
  const [chon, setChon] = useState(mat[0]?.ma ?? "tong_quan");
  const m = mat.find((x) => x.ma === chon) ?? mat[0];
  if (!m) return null;
  const rec = m as unknown as Record<string, unknown>;
  return (
    <div className="glass rounded-2xl p-5" data-testid="chan-dung-en">
      <div className="flex flex-wrap gap-2" role="tablist">
        {mat.map((x) => <button key={x.ma} role="tab" aria-selected={chon === x.ma} type="button" onClick={() => setChon(x.ma)} className={cn("rounded-full border px-3 py-1 text-sm", chon === x.ma ? "border-gold bg-gold/15 text-fg" : "border-line text-fg-muted")}>{x.ten}</button>)}
      </div>
      <dl className="mt-4 space-y-3">
        {(TRUONG_MAT[m.ma] ?? []).map(([k, nhan]) => typeof rec[k] === "string" ? <div key={k}><dt className="text-xs text-fg-faint">{nhan}</dt><dd className="text-fg-muted">{rec[k] as string}</dd></div> : null)}
        {Array.isArray(rec.diem_manh) && <div><dt className="text-xs text-fg-faint">Strengths</dt><dd><ul className="list-disc pl-5 text-fg-muted">{(rec.diem_manh as string[]).map((x) => <li key={x}>{x}</li>)}</ul></dd></div>}
        {Array.isArray(rec.diem_mu) && m.ma === "tong_quan" && <div><dt className="text-xs text-fg-faint">Blind spots</dt><dd><ul className="list-disc pl-5 text-fg-muted">{(rec.diem_mu as string[]).map((x) => <li key={x}>{x}</li>)}</ul></dd></div>}
        {Array.isArray(rec.nghe) && <div><dt className="text-xs text-fg-faint">Directions that fit</dt><dd className="text-fg-muted">{(rec.nghe as string[]).join(" · ")}</dd></div>}
      </dl>
      {m.lop_them.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-line/60 pt-3">
          {m.lop_them.map((l) => <p key={l.nhan} className="text-sm"><span className="text-fg-faint">{l.nhan}: </span><span className="text-fg-muted">{l.noi_dung}</span></p>)}
        </div>
      )}
    </div>
  );
}

export function Numerology() {
  const [p, setP] = useProfileEn();
  const [sua, setSua] = useState(false);
  const [bc, setBc] = useState<LuanGiaiResult | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const body = useMemo(() => (p ? { ho_ten: hoTen(p), ngay: p.day, thang: p.month, nam: p.year, quy_uoc_duong_doi: p.method } : null), [p]);
  useEffect(() => {
    if (!body) return;
    let huy = false;
    setBc(null); setLoi(null);
    postEn<LuanGiaiResult>("/api/thanso/luan-giai", body).then((d) => { if (!huy) { setBc(d); ghi("reading_started", { mo_dun: "thanso", ngon_ngu: "en" }); } })
      .catch((e: unknown) => { if (!huy) setLoi(e instanceof Error ? e.message : "Something went wrong."); });
    return () => { huy = true; };
  }, [body]);
  if (p === undefined) return <div className="glass h-40 animate-pulse rounded-2xl" aria-busy />;
  if (!p || sua) return <Form banDau={p} onXong={(x) => { setP(x); setSua(false); ghi("profile_created", { ngon_ngu: "en" }); }} />;
  const cs = bc?.chieu_sau;
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3 text-sm text-fg-muted" data-testid="dong-ho-so-en">
        <span><b className="text-fg">{p.name}</b> · born {p.day} {THANG[p.month - 1]} {p.year}</span>
        <button type="button" onClick={() => setSua(true)} className="text-gold hover:underline">Edit</button>
        <button type="button" onClick={() => { setP(null); setBc(null); }} className="text-fg-faint hover:text-fg" data-testid="nut-xoa-en">Clear from this browser</button>
      </div>
      {loi && <p role="alert" className="rounded-xl bg-cinnabar/10 p-4 text-sm text-cinnabar">{loi}</p>}
      {!bc && !loi && <div className="glass h-60 animate-pulse rounded-2xl" aria-busy />}
      {bc && (
        <>
          <section aria-labelledby="core"><h2 id="core" className="mb-4 text-2xl">Your four core numbers</h2>
            {bc.duong_doi_hai_cach?.lech && <p className="mb-3 rounded-xl border border-gold/30 bg-gold/5 px-4 py-2 text-sm text-fg-muted">Your Life Path differs by method: {bc.duong_doi_hai_cach.tung_phan} when the day, month and year are reduced first, {bc.duong_doi_hai_cach.tong_het} when every digit is added at once. The reading uses the method you chose — try the other one too.</p>}
            {bc.tom_tat_do_tin && <p className="mb-3 text-sm text-fg-muted">{bc.tom_tat_do_tin}</p>}
            <div className="grid gap-4 md:grid-cols-2">{bc.cac_vi_tri.map((vt) => <TheSo key={vt.vi_tri} vt={vt} />)}</div>
            <p className="mt-3 text-xs text-fg-faint">{bc.cach_doc}</p>
          </section>
          {bc.chan_dung && <section aria-labelledby="portrait"><h2 id="portrait" className="mb-1 text-2xl">Portrait of Life Path {bc.chan_dung.so_truc}</h2><p className="mb-4 text-sm text-fg-muted">{bc.chan_dung.cach_doc}</p><ChanDungEn mat={bc.chan_dung.mat} /></section>}
          {cs && (
            <section aria-labelledby="rhythm" className="space-y-4"><h2 id="rhythm" className="text-2xl">Stages, challenge and your years</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="glass rounded-2xl p-5"><h3 className="text-lg">Pinnacles (stages of life)</h3>
                  <ol className="mt-2 space-y-2 text-sm">{cs.dinh_cao.map((d) => <li key={d.dinh}><span className="text-fg-faint">Ages {d.tu_tuoi}–{d.den_tuoi ?? "…"} · </span><b className="text-fg">{d.so}</b>{d.nghia && <> — {d.nghia.chu_de}. <span className="text-fg-muted">{d.nghia.y_nghia}</span></>}</li>)}</ol></div>
                <div className="glass rounded-2xl p-5"><h3 className="text-lg">Main challenge: {cs.thu_thach_chinh.so}</h3>
                  {cs.thu_thach_chinh.nghia && <p className="mt-2 text-sm text-fg-muted"><b className="text-fg">{cs.thu_thach_chinh.nghia.mo_ta}.</b> {cs.thu_thach_chinh.nghia.y_nghia} <span className="text-fg">{cs.thu_thach_chinh.nghia.cach_vuot}</span></p>}
                  <h3 className="mt-4 text-lg">Personal years</h3>
                  <ul className="mt-2 space-y-2 text-sm">{cs.nam_ca_nhan.map((n) => <li key={n.nam}><b className="text-fg">{n.nam}</b> · personal year {n.so}{n.nghia && <> — {n.nghia.chu_de}. <span className="text-fg-muted">{n.nghia.nen}</span></>}</li>)}</ul></div>
              </div>
              <p className="text-xs text-fg-faint">{cs.cach_doc_chieu_sau}</p>
            </section>
          )}
          {bc.mo_rong && (
            <section aria-labelledby="more" className="glass rounded-2xl p-5"><h2 id="more" className="text-2xl">More numbers</h2>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                {[["Birth Day", bc.mo_rong.so_ngay_sinh], ["Attitude", bc.mo_rong.so_thai_do], ["Maturity", bc.mo_rong.so_truong_thanh]].map(([t, x]) => { const v = x as { so: number; nghia: string | null }; return <div key={t as string}><dt className="text-fg-faint">{t as string} · <b className="text-fg">{v.so}</b></dt>{v.nghia && <dd className="text-fg-muted">{v.nghia}</dd>}</div>; })}
                <div><dt className="text-fg-faint">Personal month {bc.mo_rong.thang_ca_nhan.thang}/{bc.mo_rong.thang_ca_nhan.nam} · <b className="text-fg">{bc.mo_rong.thang_ca_nhan.so}</b></dt>{bc.mo_rong.thang_ca_nhan.nghia && <dd className="text-fg-muted">{bc.mo_rong.thang_ca_nhan.nghia.chu_de}. {bc.mo_rong.thang_ca_nhan.nghia.nen}</dd>}</div>
                {bc.mo_rong.no_nghiep.map((n) => <div key={n.vi_tri}><dt className="text-fg-faint">{n.nghia?.ten ?? `Karmic debt ${n.so}`}</dt>{n.nghia && <dd className="text-fg-muted">{n.nghia.y_nghia} {n.nghia.goi_y}</dd>}</div>)}
                {bc.mo_rong.bieu_do.mui_ten.filter((m) => m.ten).map((m) => <div key={`${m.ma}${m.trong}`}><dt className="text-fg-faint">{m.ten}</dt><dd className="text-fg-muted">{m.y_nghia}</dd></div>)}
              </dl>
            </section>
          )}
          <section aria-labelledby="ask"><h2 id="ask" className="mb-3 text-2xl">Ask about your numbers</h2>
            <HoiEn moDun="thanso" goiY={GOI_Y} loiChao="Ask about yourself, love, work, money, family, well-being, this year or this month. Answers come from your own numbers and the knowledge base — tendencies to check, not predictions."
              gui={(q) => postEn<TraLoiEn>("/api/thanso/hoi", { ...body, cau_hoi: q })} /></section>
          <p className="text-xs text-fg-faint">{bc.trich_nguon_chung}</p>
        </>
      )}
    </div>
  );
}
