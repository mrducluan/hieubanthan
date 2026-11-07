"use client";
// TR-1 — trang công cụ Tarot (phương án UI đã chọn: "bàn trải bài CSS-3D" — không WebGL, không dependency mới). Năm bước
// liền mạch: 1 Hỏi (câu hỏi + chủ đề + chọn trải bài) → 2 Xáo (nhấn giữ, hạt giống băm trên máy) → 3 Rút (quạt 78 lá úp) →
// 4 Lật (từng lá, CSS 3D) → 5 Đọc (bài đọc khuôn doi_song_1 + đường phẩm giá / hướng nhìn trên bàn). Web không tính gì;
// thứ tự lá, phẩm giá, lời đọc đều của engine. Câu hỏi không rời máy ngoài lượt gọi (engine không trả lại, không lưu).
import { useEffect, useMemo, useRef, useState } from "react";
import { Layers, RotateCcw, Sparkles } from "lucide-react";
import { useChu } from "@/components/cms/DauCms";
import { DauMang } from "@/components/huyen-hoc/KhungMang";
import { KhungChat } from "@/components/hoi/KhungChat";
import { CuoiBaiDoc, useBatDauDoc } from "@/components/khung/CuoiBaiDoc";
import { BaoLoi } from "@/components/khung/BaoLoi";
import { KhungTai, TieuDeMuc } from "@/components/khung/TieuDe";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BanTraiBai } from "@/components/tarot/BanTraiBai";
import { BaoCaoTarot } from "@/components/tarot/BaoCaoTarot";
import { LaNgay } from "@/components/tarot/LaNgay";
import { LichSuTarot } from "@/components/tarot/LichSuTarot";
import { QuatBai } from "@/components/tarot/QuatBai";
import { XaoBai } from "@/components/tarot/XaoBai";
import { ghi } from "@/lib/do-luong";
import { postJson } from "@/lib/goi-api";
import { hoiMang } from "@/lib/hoi-mang";
import { useHoSo } from "@/lib/hoso";
import { docTraLoi } from "@/lib/nhan-tuong";
import { luuTraiBai, useBoBai, useLichSuTarot, type TraiBaiDaLuu } from "@/lib/tarot";
import { SO_LA, TRAI_BAI_MAC_DINH, laMaTraiBai, type BaoCaoTarot as Bc, type HieuCau, type LaRut, type MaTraiBai } from "@/lib/tarot-chung";
import { cn } from "@/lib/utils";

type Buoc = "hoi" | "xao" | "rut" | "lat" | "doc";
const GOI_Y = [
  { nhom: "Nghĩa lá", cau: ["Lá Tháp nghĩa là gì?", "Ba Cốc ngược trong tình cảm?", "Hoàng hậu Kiếm nói về gì?"] },
  { nhom: "Cách đọc", cau: ["Lá ngược nghĩa là gì?", "Phẩm giá nguyên tố là gì?", "Celtic Cross là trải bài gì?"] },
];
const THU_TU_TB: MaTraiBai[] = ["mot_la", "ba_la_loi_khuyen", "ba_la_thoi_gian", "hai_lua_chon", "nam_la", "celtic"];

export function Tarot() {
  const c = useChu();
  const hoSo = useHoSo();
  const { bo, loi: loiBo, thuLai } = useBoBai();
  const [lichSu, docLichSu] = useLichSuTarot();
  const [buoc, setBuoc] = useState<Buoc>("hoi");
  const [cau, setCau] = useState("");
  const [chuDe, setChuDe] = useState<string | null>(null);
  const [maTb, setMaTb] = useState<MaTraiBai>(TRAI_BAI_MAC_DINH);
  const [nguoc, setNguoc] = useState(true);
  const [thuTu, setThuTu] = useState<string[]>([]);
  const [coNguoc, setCoNguoc] = useState<boolean[]>([]);
  const [daRut, setDaRut] = useState<number[]>([]);
  const [lat, setLat] = useState<boolean[]>([]);
  const [bc, setBc] = useState<Bc | null>(null);
  const [dang, setDang] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [hieu, setHieu] = useState<HieuCau | null>(null);
  const refBan = useRef<HTMLDivElement>(null);
  const refDoc = useRef<HTMLDivElement>(null);
  useBatDauDoc("tarot", Boolean(bc));

  const tb = bo?.trai_bai[maTb] ?? null;
  const soLa = SO_LA[maTb];
  const la: (LaRut | null)[] = useMemo(() => Array.from({ length: soLa }, (_, i) => (daRut[i] !== undefined ? { id: thuTu[daRut[i]!]!, nguoc: coNguoc[daRut[i]!] ?? false } : null)), [daRut, thuTu, coNguoc, soLa]);
  const duLa = la.every(Boolean);
  const duLat = duLa && lat.length === soLa && lat.every(Boolean);
  useEffect(() => { if (duLa && buoc === "rut") setBuoc("lat"); }, [duLa, buoc]);

  // TR-2: gõ xong câu hỏi (dừng 700 ms) → engine nhận ra kiểu câu + trải bài hợp. Câu chỉ đi qua lượt gọi, không lưu.
  useEffect(() => {
    if (buoc !== "hoi") return;
    const q = cau.trim();
    if (q.length < 6) { setHieu(null); return; }
    let huy = false;
    const t = setTimeout(() => {
      postJson<HieuCau>("/api/tarot/hieu-cau", { cau_hoi: q.slice(0, 500), ...(chuDe ? { chu_de: chuDe } : {}) })
        .then((h) => { if (!huy) setHieu(h); }).catch(() => { if (!huy) setHieu(null); });
    }, 700);
    return () => { huy = true; clearTimeout(t); };
  }, [cau, chuDe, buoc]);
  const dungGoiY = () => {
    if (!hieu) return;
    if (laMaTraiBai(hieu.goi_y_trai_bai)) setMaTb(hieu.goi_y_trai_bai);
    if (!chuDe && hieu.chu_de) setChuDe(hieu.chu_de);
   
    ghi("chart_interacted", { mo_dun: "tarot", kind: "dung_goi_y", y_dinh: hieu.y_dinh, trai_bai: hieu.goi_y_trai_bai });
  };
  const lamLai = () => { setBuoc("hoi"); setThuTu([]); setCoNguoc([]); setDaRut([]); setLat([]); setBc(null); setLoi(null); };
  const batDau = () => { setBuoc("xao"); setLoi(null); ghi("chart_interacted", { mo_dun: "tarot", kind: "bat_dau", trai_bai: maTb, co_cau: cau.trim().length > 0, chu_de: chuDe ?? "khong", y_dinh: hieu?.y_dinh ?? "khong" }); setTimeout(() => refBan.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); };
  const xao = async (hatGiong: string | null) => {
    setDang(true); setLoi(null);
    try {
      const d = await postJson<{ thu_tu: string[]; nguoc: boolean[]; nguon: string }>("/api/tarot/xao-bai", { ...(hatGiong ? { hat_giong: hatGiong } : {}), nguoc });
      setThuTu(d.thu_tu); setCoNguoc(d.nguoc); setDaRut([]); setLat([]); setBuoc("rut");
      ghi("chart_interacted", { mo_dun: "tarot", kind: "xao", nguon: d.nguon, nguoc });
    } catch (e) { setLoi(e instanceof Error ? e.message : "Chưa xáo được."); } finally { setDang(false); }
  };
  const rut = (i: number) => {
    if (daRut.length >= soLa || daRut.includes(i)) return;          // bấm đúp / đã đủ lá → bỏ qua, không đo
    setDaRut([...daRut, i]);
    ghi("chart_interacted", { mo_dun: "tarot", kind: "rut", so: daRut.length + 1 });
  };
  const latLa = (i: number) => setLat((l) => { const m = Array.from({ length: soLa }, (_, k) => l[k] ?? false); m[i] = true; return m; });
  const latHet = () => setLat(Array.from({ length: soLa }, () => true));
  const doc = async (ds?: LaRut[], ma?: MaTraiBai, cauCu?: string, chuDeCu?: string | null) => {
    const laGui = ds ?? (la.filter(Boolean) as LaRut[]);
    const maGui = ma ?? maTb;
    setDang(true); setLoi(null);
    try {
      const tl = docTraLoi();
      const body = {
        trai_bai: maGui, la: laGui, ...(cauCu ?? cau ? { cau_hoi: (cauCu ?? cau).trim().slice(0, 500) } : {}), ...((chuDeCu ?? chuDe) ? { chu_de: chuDeCu ?? chuDe } : {}),
        ...(hoSo?.nam && hoSo.thang && hoSo.ngay && hoSo.am == null ? { ngay_sinh: `${hoSo.nam}-${String(hoSo.thang).padStart(2, "0")}-${String(hoSo.ngay).padStart(2, "0")}` } : hoSo?.nam ? { nam_sinh: hoSo.nam } : {}),
        ...(hoSo?.gioi_tinh ? { gioi_tinh: hoSo.gioi_tinh } : {}), ...(Object.keys(tl).length ? { tra_loi_nhan_tuong: tl } : {}),
      };
      const d = await postJson<Bc>("/api/tarot/doc-bai", body);
      setBc(d); setBuoc("doc");
      if (!ds) {
        // Tâm điểm = hộp cốt lõi đầu tiên engine trả (hop của vị trí trọng tâm theo KB) — web không tự chọn vị trí.
        const tt = d.cot_loi[0]?.la;
        luuTraiBai({ trai_bai: maGui, la: laGui, cau: cauCu ?? cau, chu_de: chuDeCu ?? chuDe, tom_tat: tt ? `${tt.ten}${tt.nguoc ? " (ngược)" : ""}` : d.da_tinh.ten_trai_bai });
        docLichSu();
      }
      ghi("chart_interacted", { mo_dun: "tarot", kind: "doc_bai", trai_bai: maGui, an_chinh: d.da_tinh.an_chinh.so, xem_lai: Boolean(ds), y_dinh: d.hieu_cau?.y_dinh ?? "khong", nghieng: d.hieu_cau?.nghieng?.nghieng ?? "khong" });
      setTimeout(() => refDoc.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (e) { setLoi(e instanceof Error ? e.message : "Chưa đọc được lúc này."); } finally { setDang(false); }
  };
  const xemLai = (q: TraiBaiDaLuu) => {
    if (!laMaTraiBai(q.trai_bai)) return;
    setMaTb(q.trai_bai); setCau(q.cau); setChuDe(q.chu_de);
    setThuTu(q.la.map((l) => l.id)); setCoNguoc(q.la.map((l) => l.nguoc)); setDaRut(q.la.map((_, i) => i)); setLat(q.la.map(() => true));
    void doc(q.la, q.trai_bai, q.cau, q.chu_de);
  };

  const dau = (
    <DauMang Icon={Layers} ten="Tarot" chip
      mo_ta="Đặt một câu hỏi, nhấn giữ để xáo, tự rút lá từ quạt 78 lá rồi lật từng lá. Bài đọc mở bằng câu trả lời cho đúng câu bạn hỏi — nghiêng về có, có điều kiện hay chưa nên vội, vì sao, điều cần gỡ trước và 3 việc nên làm — rồi mới tới từng vị trí, dòng chảy giữa các lá, nhịp thời gian gợi ý, ghép bốn trường phái có sách (Waite, Golden Dawn, Marseille, B.O.T.A.). Không phán, không điểm số, không đọc người khác." />
  );
  if (!bo && !loiBo) return <div>{dau}<KhungTai /></div>;
  if (!bo) return <div>{dau}<BaoLoi loi={loiBo ?? "Chưa tải được bộ bài."} thuLai={thuLai} /></div>;

  return (
    <div>
      {dau}
      <div className="mb-8"><LaNgay hoSo={hoSo} tieuDe={c("la_ngay.tieu_de")} /></div>

      {/* Bước 1 — Hỏi */}
      <section aria-labelledby="buoc-hoi" className="mx-auto mb-8 max-w-5xl scroll-mt-24" id="trai-bai">
        <TieuDeMuc id="buoc-hoi" nho={c("hoi_bai.nho")} lon={c("hoi_bai.lon")} />
        <div className="glass rounded-2xl p-5 sm:p-6" data-testid="buoc-hoi">
          <label className="block text-sm text-fg-muted" htmlFor="cau-hoi-tarot">Câu hỏi (tuỳ chọn — giúp bài đọc nói đúng chuyện; không lưu trên máy chủ)</label>
          <Input id="cau-hoi-tarot" value={cau} onChange={(e) => setCau(e.target.value.slice(0, 200))} placeholder="Ví dụ: Tôi có nên nhận lời hợp tác với đối tác mới không?" className="mt-1" disabled={buoc !== "hoi"} data-testid="o-cau-hoi" />
          {hieu && buoc === "hoi" && cau.trim().length >= 6 && (
            <div className="mt-2 rounded-xl border border-gold/30 bg-gold/5 px-3 py-2 text-sm" data-testid="goi-y-cau-hoi" aria-live="polite">
              {hieu.chan === "an_toan" && hieu.loi ? <p className="text-fg">{hieu.loi}</p> : (
                <>
                  <p className="text-fg-muted">
                    Mình hiểu đây là <b className="text-fg">{hieu.ten_y_dinh}</b>{hieu.nhan_viec ? <> về <b className="text-fg">{hieu.nhan_viec}</b></> : null}
                    {hieu.lua_chon ? <> — đường A: <b className="text-fg">{hieu.lua_chon[0]}</b>, đường B: <b className="text-fg">{hieu.lua_chon[1]}</b></> : null}.
                    {" "}Bài đọc sẽ mở bằng phần trả lời cho đúng câu này.
                  </p>
                  {hieu.loi && <p className="mt-1 text-fg-faint">{hieu.loi}</p>}
                  {hieu.goi_y_trai_bai !== maTb && bo.trai_bai[hieu.goi_y_trai_bai] && (
                    <p className="mt-1">
                      Trải bài hợp nhất: <b className="text-fg">{hieu.ten_goi_y}</b>{" "}
                      <button type="button" onClick={dungGoiY} className="ml-1 rounded-full border border-gold/50 px-2.5 py-0.5 text-xs text-gold hover:bg-gold/10" data-testid="nut-dung-goi-y">Dùng trải bài này</button>
                    </p>
                  )}
                </>
              )}
            </div>
          )}
          <p className="mt-3 text-sm text-fg-muted">Chuyện về</p>
          <div className="mt-1 flex flex-wrap gap-2" role="radiogroup" aria-label="Chủ đề">
            {Object.entries(bo.chu_de).map(([ma, x]) => (
              <button key={ma} type="button" role="radio" aria-checked={chuDe === ma} disabled={buoc !== "hoi"} onClick={() => setChuDe(chuDe === ma ? null : ma)}
                className={cn("rounded-full border px-3 py-1 text-sm", chuDe === ma ? "border-gold bg-gold/15 text-fg" : "border-line text-fg-muted hover:text-fg")} data-testid={`chu-de-${ma}`}>{x.ten}</button>
            ))}
          </div>
          <p className="mt-4 text-sm text-fg-muted">Trải bài</p>
          <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6" role="radiogroup" aria-label="Trải bài">
            {THU_TU_TB.map((ma) => { const t = bo.trai_bai[ma]; return (
              <button key={ma} type="button" role="radio" aria-checked={maTb === ma} disabled={buoc !== "hoi"} onClick={() => setMaTb(ma)} data-testid={`trai-bai-${ma}`}
                className={cn("rounded-xl border p-3 text-left text-sm transition-colors", maTb === ma ? "border-gold bg-gold/10" : "border-line hover:border-gold/40")}>
                <span className="block font-medium text-fg">{t.ngan}</span>
                <span className="mt-0.5 block text-xs text-fg-muted">{t.ten.replace(/^.*?: /, "")}</span>
              </button>
            ); })}
          </div>
          {tb && <p className="mt-2 text-xs text-fg-faint">{tb.mo_ta}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {buoc === "hoi" ? <Button onClick={batDau} data-testid="nut-bat-dau"><Sparkles aria-hidden /> Xáo bài</Button>
              : <Button variant="secondary" onClick={lamLai} data-testid="nut-lam-lai"><RotateCcw aria-hidden /> Hỏi câu khác</Button>}
          </div>
        </div>
      </section>

      {/* Bước 2–4 — Xáo · Rút · Lật */}
      {buoc !== "hoi" && buoc !== "doc" && tb && (
        <section ref={refBan} aria-labelledby="buoc-rut" className="mx-auto mb-8 max-w-5xl scroll-mt-24">
          <TieuDeMuc id="buoc-rut" nho={buoc === "xao" ? "Bước 2" : buoc === "rut" ? "Bước 3" : "Bước 4"} lon={buoc === "xao" ? "Xáo bài" : buoc === "rut" ? `Rút ${soLa} lá từ quạt` : "Lật từng lá"} />
          {buoc === "xao" && <XaoBai onXong={(hg) => void xao(hg)} dang={dang} nguoc={nguoc} onNguoc={setNguoc} />}
          {buoc !== "xao" && (
            <div className="space-y-4">
              <BanTraiBai tb={tb} la={la} lat={lat} onLat={latLa} boLa={bo.la} />
              {buoc === "rut" && <QuatBai thuTu={thuTu} daRut={daRut} onRut={rut} conLai={soLa - daRut.length} />}
              {buoc === "lat" && (
                <div className="flex flex-wrap items-center gap-3">
                  {!duLat && <Button variant="secondary" onClick={latHet} data-testid="nut-lat-het">Lật tất cả</Button>}
                  <Button onClick={() => void doc()} disabled={!duLat || dang} data-testid="nut-doc-bai">{dang ? "Đang đọc…" : "Đọc bài"}</Button>
                  <p className="text-sm text-fg-muted">{duLat ? "Đủ lá rồi — bấm Đọc bài." : "Chạm từng lá để lật, hoặc lật tất cả."}</p>
                </div>
              )}
            </div>
          )}
          {loi && <div className="mt-4"><BaoLoi loi={loi} thuLai={() => (buoc === "lat" ? void doc() : lamLai())} /></div>}
        </section>
      )}

      {/* Bước 5 — Đọc */}
      {bc && tb && buoc === "doc" && (
        <section ref={refDoc} aria-labelledby="bai-doc" id="bai-doc" className="mx-auto mb-10 max-w-5xl scroll-mt-24">
          <TieuDeMuc id="bai-doc" nho={c("bai_doc.nho")} lon={c("bai_doc.lon")} />
          <BaoCaoTarot bc={bc} tb={bo.trai_bai[bc.da_tinh.trai_bai] ?? tb} boLa={bo.la} ten={hoSo?.ho_ten?.trim() ? hoSo.ho_ten : "bạn"} cau={cau.trim() || null} />
          <div className="mt-6 flex flex-wrap gap-3"><Button variant="secondary" onClick={lamLai} data-testid="nut-trai-bai-moi"><RotateCcw aria-hidden /> Trải bài mới</Button></div>
          <div className="mt-6"><CuoiBaiDoc moDun="tarot" cauHoi="Bài đọc này có lá nào nói đúng chuyện bạn đang gặp?" /></div>
        </section>
      )}

      {lichSu && lichSu.length > 0 && <div className="mx-auto mb-10 max-w-5xl"><LichSuTarot ds={lichSu} bo={bo} onXemLai={xemLai} onDoi={docLichSu} /></div>}

      <section aria-labelledby="hoi-dap" id="hoi-dap" className="mx-auto max-w-5xl scroll-mt-24">
        <TieuDeMuc id="hoi-dap" nho={c("hoi.nho")} lon={c("hoi.lon")} />
        <KhungChat moDun="tarot" goiY={GOI_Y}
          loiChao={bc ? "Hỏi về một lá trong trải bài vừa rút (“lá thứ 2 nghĩa gì”, “kết quả thế nào”) hay nghĩa bất kỳ lá nào — xuôi, ngược, theo tình cảm, công việc, tiền bạc." : "Hỏi nghĩa một lá (xuôi, ngược, trong tình cảm, công việc), một trải bài hay một khái niệm. Mình không đọc người khác và không phán chuyện gì sẽ xảy ra."}
          gui={(q) => hoiMang("/api/tarot/hoi", { cau_hoi: q, ...(bc ? { trai_bai: bc.da_tinh.trai_bai, la: bc.da_tinh.vi_tri.map((v) => ({ id: v.id, nguoc: v.nguoc })) } : {}) })} />
      </section>
    </div>
  );
}
