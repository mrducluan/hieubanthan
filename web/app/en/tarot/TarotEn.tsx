"use client";
// QTE — Tarot tiếng Anh phía trình duyệt: cùng năm bước và cùng component vẽ (XaoBai, QuatBai, BanTraiBai) của /tarot, chữ giao
// diện tiếng Anh; bài đọc hiển thị bằng khung báo cáo CHUNG BaoCaoDoiSongView (chữ khung theo ngôn ngữ, lib/chu/bao-cao.ts). Mọi lượt gọi kèm header `x-ngon-ngu: en`.
// Không lưu câu hỏi; lịch sử rút bài không lưu ở bản Anh (giữ gọn).
import { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BanTraiBai } from "@/components/tarot/BanTraiBai";
import { QuatBai } from "@/components/tarot/QuatBai";
import { XaoBai } from "@/components/tarot/XaoBai";
import { LaBai } from "@/components/tarot/LaBai";
import { BaoCaoDoiSongView } from "@/components/luan-giai/BaoCaoDoiSong";
import { KhungChat, type KetQuaHoi } from "@/components/hoi/KhungChat";
import type { TraLoiEn } from "@/lib/en/api";
import { getEn, postEn } from "@/lib/en/api";
import { useProfileEn } from "@/lib/en/hoso";
import { ghi } from "@/lib/do-luong";
import { SO_LA, laMaTraiBai, type BaoCaoTarot as Bc, type BoBai, type HieuCau, type LaNgay, type LaRut, type MaTraiBai } from "@/lib/tarot-chung";
import { cn } from "@/lib/utils";

/** EN-ALL: lời đáp engine (bản Anh) → dạng khung hỏi đáp chung. */
const sangKetQua = (d: TraLoiEn): KetQuaHoi => ({ van: d.cau_tra_loi, canCu: d.can_cu, hoiTiep: d.hoi_tiep });
const CHU_THICH_HOI = "Answers are assembled from a sourced knowledge base, not written by an AI, and are not predictions. Your question is sent only to compute the answer and is not stored with your name.";
type Buoc = "hoi" | "xao" | "rut" | "lat" | "doc";
const THU_TU_TB: MaTraiBai[] = ["mot_la", "ba_la_loi_khuyen", "ba_la_thoi_gian", "hai_lua_chon", "khi_nao", "nam_la", "celtic"];
export const CHU_LA_EN = { nguoc: " (reversed)", up: "Face-down card", nhan_nguoc: "REVERSED", nguoc_nhan: " · reversed" };
const CHU_XAO_EN = {
  buoc: "Step 2", tieu_de: "Hold to shuffle",
  mo_ta: "Hold the button for at least a second and move your finger or mouse a little. The rhythm of your hand becomes the shuffle seed — only a hash leaves your device, never coordinates.",
  nguoc: "Use reversed cards (Waite). Untick to read by neighbouring cards instead (Marseille / Thoth).",
  dang: "Shuffling…", giu: "Hold… move gently", nhan: "Hold to shuffle", may: "Let the machine shuffle",
};
const CHU_QUAT_EN = {
  quat: (n: number, con: number) => `Fan of ${n} face-down cards — ${con} left to draw`, la_up: (i: number) => `Face-down card ${i}`,
  du: "All drawn — flip the cards above.", huong_dan: (con: number) => `Tap or click a card to draw · ${con} left · drag sideways to turn the fan`,
};
const GOI_Y_HOI = ["What does the Tower mean?", "Three of Cups reversed in love?", "What is the Celtic Cross?", "What does a reversed card mean?"];
const CHU_DE_EN: Record<string, string> = { tinh_cam: "Love", cong_viec: "Work", tien_bac: "Money", gia_dinh: "Family", suc_khoe: "Health & rhythm", ban_than: "Myself" };

export function TarotEn() {
  const [p] = useProfileEn();
  const [bo, setBo] = useState<BoBai | null>(null);
  const [loiBo, setLoiBo] = useState<string | null>(null);
  const [laNgay, setLaNgay] = useState<LaNgay | null>(null);
  const [buoc, setBuoc] = useState<Buoc>("hoi");
  const [cau, setCau] = useState("");
  const [chuDe, setChuDe] = useState<string | null>(null);
  const [maTb, setMaTb] = useState<MaTraiBai>("ba_la_loi_khuyen");
  const [nguoc, setNguoc] = useState(true);
  const [thuTu, setThuTu] = useState<string[]>([]);
  const [coNguoc, setCoNguoc] = useState<boolean[]>([]);
  const [daRut, setDaRut] = useState<number[]>([]);
  const [lat, setLat] = useState<boolean[]>([]);
  const [bc, setBc] = useState<Bc | null>(null);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [hieu, setHieu] = useState<HieuCau | null>(null);
  const [chon, setChon] = useState<number | null>(null);
  const refBan = useRef<HTMLDivElement>(null);
  const refDoc = useRef<HTMLDivElement>(null);
  const taiBo = () => { setLoiBo(null); getEn<BoBai>("/api/tarot/bo-bai").then(setBo).catch((e: unknown) => setLoiBo(e instanceof Error ? e.message : "Could not load the deck.")); };
  useEffect(taiBo, []);
  useEffect(() => {
    const d = new Date(); const ngay = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;   // ngày theo đồng hồ máy người dùng
    getEn<LaNgay>(`/api/tarot/la-ngay?ngay=${ngay}`).then(setLaNgay).catch(() => setLaNgay(null));
  }, []);

  const tb = bo?.trai_bai[maTb] ?? null;
  const soLa = SO_LA[maTb];
  const la: (LaRut | null)[] = useMemo(() => Array.from({ length: soLa }, (_, i) => (daRut[i] !== undefined ? { id: thuTu[daRut[i]!]!, nguoc: coNguoc[daRut[i]!] ?? false } : null)), [daRut, thuTu, coNguoc, soLa]);
  const duLa = la.every(Boolean);
  const duLat = duLa && lat.length === soLa && lat.every(Boolean);
  useEffect(() => { if (duLa && buoc === "rut") setBuoc("lat"); }, [duLa, buoc]);
  useEffect(() => {
    if (buoc !== "hoi") return;
    const q = cau.trim();
    if (q.length < 6) { setHieu(null); return; }
    let huy = false;
    const t = setTimeout(() => { postEn<HieuCau>("/api/tarot/hieu-cau", { cau_hoi: q.slice(0, 500), ...(chuDe ? { chu_de: chuDe } : {}) }).then((h) => { if (!huy) setHieu(h); }).catch(() => { if (!huy) setHieu(null); }); }, 700);
    return () => { huy = true; clearTimeout(t); };
  }, [cau, chuDe, buoc]);

  const lamLai = () => { setBuoc("hoi"); setThuTu([]); setCoNguoc([]); setDaRut([]); setLat([]); setBc(null); setLoi(null); setChon(null); };
  const batDau = () => { setBuoc("xao"); setLoi(null); ghi("chart_interacted", { mo_dun: "tarot", kind: "bat_dau", trai_bai: maTb, co_cau: cau.trim().length > 0, ngon_ngu: "en" }); setTimeout(() => refBan.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); };
  const xao = async (hatGiong: string | null) => {
    setDang(true); setLoi(null);
    try {
      const d = await postEn<{ thu_tu: string[]; nguoc: boolean[]; nguon: string }>("/api/tarot/xao-bai", { ...(hatGiong ? { hat_giong: hatGiong } : {}), nguoc });
      setThuTu(d.thu_tu); setCoNguoc(d.nguoc); setDaRut([]); setLat([]); setBuoc("rut");
    } catch (e) { setLoi(e instanceof Error ? e.message : "Could not shuffle."); } finally { setDang(false); }
  };
  const rut = (i: number) => { if (daRut.length >= soLa || daRut.includes(i)) return; setDaRut([...daRut, i]); };
  const latLa = (i: number) => setLat((l) => { const m = Array.from({ length: soLa }, (_, k) => l[k] ?? false); m[i] = true; return m; });
  const latHet = () => setLat(Array.from({ length: soLa }, () => true));
  const doc = async () => {
    const laGui = la.filter(Boolean) as LaRut[];
    setDang(true); setLoi(null);
    try {
      const body = { trai_bai: maTb, la: laGui, ...(cau.trim() ? { cau_hoi: cau.trim().slice(0, 500) } : {}), ...(chuDe ? { chu_de: chuDe } : {}),
        ...(p ? { ngay_sinh: `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}` } : {}) };
      const d = await postEn<Bc>("/api/tarot/doc-bai", body);
      setBc(d); setBuoc("doc");
      ghi("reading_started", { mo_dun: "tarot", ngon_ngu: "en" });
      ghi("chart_interacted", { mo_dun: "tarot", kind: "doc_bai", trai_bai: maTb, y_dinh: d.hieu_cau?.y_dinh ?? "khong", ngon_ngu: "en" });
      setTimeout(() => refDoc.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (e) { setLoi(e instanceof Error ? e.message : "Could not read the cards right now."); } finally { setDang(false); }
  };

  if (!bo && !loiBo) return <div className="glass h-48 animate-pulse rounded-2xl" aria-busy />;
  if (!bo) return <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl bg-cinnabar/10 p-4 text-sm text-cinnabar"><span className="flex-1">{loiBo}</span><Button variant="secondary" size="sm" onClick={taiBo}>Try again</Button></div>;

  return (
    <div>
      {laNgay && (
        <section className="glass mb-8 flex flex-wrap items-center gap-4 rounded-2xl p-4" data-testid="la-ngay-en">
          <div className="w-16 shrink-0"><LaBai la={laNgay.la} lat tatHieuUng chu={CHU_LA_EN} /></div>
          <div className="min-w-0 flex-1"><p className="eyebrow">Card of the day · {laNgay.ngay}</p><h2 className="text-lg">{laNgay.la.ten}</h2><p className="text-sm text-fg-muted">{laNgay.la.y_xuoi}</p><p className="mt-1 text-xs text-fg-faint">Try today: {laNgay.la.viec}</p></div>
        </section>
      )}
      <section aria-labelledby="buoc-hoi" className="mb-8 scroll-mt-24">
        <header className="mb-4"><p className="eyebrow">Step 1</p><h2 id="buoc-hoi" className="mt-1 text-2xl sm:text-3xl">Your question</h2></header>
        <div className="glass rounded-2xl p-5 sm:p-6" data-testid="buoc-hoi-en">
          <label className="block text-sm text-fg-muted" htmlFor="cau-hoi-en">Question (optional — it makes the reading specific; not stored on the server)</label>
          <Input id="cau-hoi-en" value={cau} onChange={(e) => setCau(e.target.value.slice(0, 200))} placeholder="e.g. Should I take the new job offer?" className="mt-1" disabled={buoc !== "hoi"} data-testid="o-cau-hoi-en" />
          {hieu && buoc === "hoi" && cau.trim().length >= 6 && (
            <div className="mt-2 rounded-xl border border-gold/30 bg-gold/5 px-3 py-2 text-sm" data-testid="goi-y-cau-hoi-en" aria-live="polite">
              {hieu.chan === "an_toan" && hieu.loi ? <p className="text-fg">{hieu.loi}</p> : (
                <>
                  <p className="text-fg-muted">I read this as <b className="text-fg">{hieu.ten_y_dinh}</b>{hieu.nhan_viec ? <> about <b className="text-fg">{hieu.nhan_viec}</b></> : null}{hieu.lua_chon ? <> — path A: <b className="text-fg">{hieu.lua_chon[0]}</b>, path B: <b className="text-fg">{hieu.lua_chon[1]}</b></> : null}. The reading will open with the answer to exactly this.</p>
                  {hieu.goi_y_trai_bai !== maTb && bo.trai_bai[hieu.goi_y_trai_bai] && (
                    <p className="mt-1">Best spread for it: <b className="text-fg">{hieu.ten_goi_y}</b>{" "}
                      <button type="button" onClick={() => { if (laMaTraiBai(hieu.goi_y_trai_bai)) setMaTb(hieu.goi_y_trai_bai); if (!chuDe && hieu.chu_de) setChuDe(hieu.chu_de); }} className="ml-1 rounded-full border border-gold/50 px-2.5 py-0.5 text-xs text-gold hover:bg-gold/10" data-testid="nut-dung-goi-y-en">Use this spread</button></p>
                  )}
                </>
              )}
            </div>
          )}
          <p className="mt-3 text-sm text-fg-muted">It is about</p>
          <div className="mt-1 flex flex-wrap gap-2" role="radiogroup" aria-label="Topic">
            {Object.entries(bo.chu_de).map(([ma, x]) => (
              <button key={ma} type="button" role="radio" aria-checked={chuDe === ma} disabled={buoc !== "hoi"} onClick={() => setChuDe(chuDe === ma ? null : ma)}
                className={cn("rounded-full border px-3 py-1 text-sm", chuDe === ma ? "border-gold bg-gold/15 text-fg" : "border-line text-fg-muted hover:text-fg")} data-testid={`chu-de-en-${ma}`}>{CHU_DE_EN[ma] ?? x.ten}</button>
            ))}
          </div>
          <p className="mt-4 text-sm text-fg-muted">Spread</p>
          <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7" role="radiogroup" aria-label="Spread">
            {THU_TU_TB.filter((ma) => bo.trai_bai[ma]).map((ma) => { const t = bo.trai_bai[ma]; return (
              <button key={ma} type="button" role="radio" aria-checked={maTb === ma} disabled={buoc !== "hoi"} onClick={() => setMaTb(ma)} data-testid={`trai-bai-en-${ma}`}
                className={cn("rounded-xl border p-3 text-left text-sm transition-colors", maTb === ma ? "border-gold bg-gold/10" : "border-line hover:border-gold/40")}>
                <span className="block font-medium text-fg">{t.ngan}</span><span className="mt-0.5 block text-xs text-fg-muted">{t.ten.replace(/^.*?: /, "")}</span></button>
            ); })}
          </div>
          {tb && <p className="mt-2 text-xs text-fg-faint">{tb.mo_ta}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {buoc === "hoi" ? <Button onClick={batDau} data-testid="nut-bat-dau-en"><Sparkles aria-hidden /> Shuffle</Button>
              : <Button variant="secondary" onClick={lamLai} data-testid="nut-lam-lai-en"><RotateCcw aria-hidden /> Ask another question</Button>}
          </div>
        </div>
      </section>

      {buoc !== "hoi" && buoc !== "doc" && tb && (
        <section ref={refBan} aria-labelledby="buoc-rut" className="mb-8 scroll-mt-24">
          <header className="mb-4"><p className="eyebrow">{buoc === "xao" ? "Step 2" : buoc === "rut" ? "Step 3" : "Step 4"}</p><h2 id="buoc-rut" className="mt-1 text-2xl sm:text-3xl">{buoc === "xao" ? "Shuffle" : buoc === "rut" ? `Draw ${soLa} card${soLa > 1 ? "s" : ""} from the fan` : "Flip each card"}</h2></header>
          {buoc === "xao" && <XaoBai onXong={(hg) => void xao(hg)} dang={dang} nguoc={nguoc} onNguoc={setNguoc} chu={CHU_XAO_EN} />}
          {buoc !== "xao" && (
            <div className="space-y-4">
              <BanTraiBai tb={tb} la={la} lat={lat} onLat={latLa} boLa={bo.la} chu={CHU_LA_EN} />
              {buoc === "rut" && <QuatBai thuTu={thuTu} daRut={daRut} onRut={rut} conLai={soLa - daRut.length} chu={CHU_QUAT_EN} />}
              {buoc === "lat" && (
                <div className="flex flex-wrap items-center gap-3">
                  {!duLat && <Button variant="secondary" onClick={latHet} data-testid="nut-lat-het-en">Flip all</Button>}
                  <Button onClick={() => void doc()} disabled={!duLat || dang} data-testid="nut-doc-bai-en">{dang ? "Reading…" : "Read the cards"}</Button>
                  <p className="text-sm text-fg-muted">{duLat ? "All cards are up — read them." : "Tap each card to flip it, or flip all."}</p>
                </div>
              )}
            </div>
          )}
          {loi && <p role="alert" className="mt-4 rounded-xl bg-cinnabar/10 p-4 text-sm text-cinnabar">{loi}</p>}
        </section>
      )}

      {bc && tb && buoc === "doc" && (
        <section ref={refDoc} aria-labelledby="bai-doc" className="mb-10 scroll-mt-24">
          <header className="mb-4"><p className="eyebrow">Step 5</p><h2 id="bai-doc" className="mt-1 text-2xl sm:text-3xl">Your reading</h2></header>
          {cau.trim() && <p className="mb-3 rounded-xl border border-line/60 bg-bg/40 px-4 py-2.5 text-sm text-fg-muted">You asked: <span className="text-fg">“{cau.trim()}”</span></p>}
          <div className="glass mb-6 rounded-2xl p-4 sm:p-6">
            <BanTraiBai tb={bo.trai_bai[bc.da_tinh.trai_bai] ?? tb} la={bc.da_tinh.vi_tri.map((v) => ({ id: v.id, nguoc: v.nguoc }))} lat={bc.da_tinh.vi_tri.map(() => true)} boLa={bo.la} pt={bc.da_tinh} chon={chon} onChon={setChon} chu={CHU_LA_EN} />
            <p className="mt-3 text-xs text-fg-faint">Solid gold line: two cards support each other · dashed amber line: they pull against each other · arrow: where the figure on the card is looking (Marseille). A REVERSED label means the card was drawn upside down — its quality is blocked or turned inward, not a bad sign.</p>
            {chon !== null && bc.da_tinh.vi_tri[chon] && <p className="mt-2 text-sm"><b className="text-fg">{bc.da_tinh.vi_tri[chon]!.ten_la}{bc.da_tinh.vi_tri[chon]!.nguoc ? " (reversed)" : ""}</b> — {bc.da_tinh.vi_tri[chon]!.ten}</p>}
          </div>
          <BaoCaoDoiSongView bc={bc} ten="tarot" nhan="Your spread" moSan={["tra_loi", "cau_chuyen"]} />
          <div className="mt-6 flex flex-wrap gap-3"><Button variant="secondary" onClick={lamLai} data-testid="nut-trai-bai-moi-en"><RotateCcw aria-hidden /> New spread</Button></div>
        </section>
      )}

      <section aria-labelledby="hoi-dap" className="scroll-mt-24">
        <header className="mb-4"><p className="eyebrow">Ask</p><h2 id="hoi-dap" className="mt-1 text-2xl sm:text-3xl">About a card, a spread or a concept</h2></header>
        <KhungChat moDun="tarot" goiY={[{ nhom: "Suggestions", cau: GOI_Y_HOI }]} loiChao={bc ? "Ask about a card in the spread you just drew (“what does the outcome card mean”) or about any card — upright, reversed, in love, work or money." : "Ask what a card means (upright, reversed, in love, work or money), what a spread is, or a concept. I do not read other people and do not predict events."}
          gui={(q) => postEn<TraLoiEn>("/api/tarot/hoi", { cau_hoi: q, ...(bc ? { trai_bai: bc.da_tinh.trai_bai, la: bc.da_tinh.vi_tri.map((v) => ({ id: v.id, nguoc: v.nguoc })) } : {}) }).then(sangKetQua)} />
        <p className="mt-3 text-xs text-fg-faint">{CHU_THICH_HOI}</p>
      </section>
    </div>
  );
}
