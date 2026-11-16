"use client";
import "@/lib/en/hoso";   // EN-ALL: chuyển hồ sơ cũ của bản Anh (hbt.en.profile.v1) sang hồ sơ chung, chạy một lần
// TR-5 (2026-11-10) — flow dẫn từng bước: chip "chuyện hay hỏi" bấm là có câu mẫu điền sẵn → engine hiểu câu và TỰ CHỌN trải
// bài hợp (đổi được trong "Đổi trải bài") → xáo → rút (có nút rút giúp: lấy các lá trên cùng của bộ engine đã xáo, web không
// random) → lật lá nào hiện nghĩa lá đó ngay theo vị trí → lật đủ thì tự vào bài đọc. Lá là tranh Rider–Waite 1909.
// TR-1 — trang công cụ Tarot (phương án UI đã chọn: "bàn trải bài CSS-3D" — không WebGL, không dependency mới). Năm bước
// liền mạch: 1 Hỏi (câu hỏi + chủ đề + chọn trải bài) → 2 Xáo (nhấn giữ, hạt giống băm trên máy) → 3 Rút (quạt 78 lá úp) →
// 4 Lật (từng lá, CSS 3D) → 5 Đọc (bài đọc khuôn doi_song_1 + đường phẩm giá / hướng nhìn trên bàn). Web không tính gì;
// thứ tự lá, phẩm giá, lời đọc đều của engine. Câu hỏi không rời máy ngoài lượt gọi (engine không trả lại, không lưu).
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Layers, RotateCcw, SlidersHorizontal, Sparkles, Wand2 } from "lucide-react";
import { useChu } from "@/components/cms/DauCms";
import { DauMang } from "@/components/huyen-hoc/KhungMang";
import { KhungChat } from "@/components/hoi/KhungChat";
import { CuoiBaiDoc, useBatDauDoc } from "@/components/khung/CuoiBaiDoc";
import { HoiSau30Ngay } from "@/components/khung/HoiSau30Ngay";
import { NutChiaSeTarot } from "@/components/tarot/NutChiaSeTarot";
import { ghiNhanDung } from "@/lib/kiem-chung-sau";
import { BaoLoi } from "@/components/khung/BaoLoi";
import { KhungTai, TieuDeMuc } from "@/components/khung/TieuDe";
import { Button } from "@/components/ui/button";
import { BanTraiBai } from "@/components/tarot/BanTraiBai";
import { BaoCaoTarot } from "@/components/tarot/BaoCaoTarot";
import { LaNgay } from "@/components/tarot/LaNgay";
import { LichSuTarot } from "@/components/tarot/LichSuTarot";
import { QuatBai } from "@/components/tarot/QuatBai";
import { XaoBai } from "@/components/tarot/XaoBai";
import { YNghiaLa, type MucLa } from "@/components/tarot/YNghiaLa";
import { ghi } from "@/lib/do-luong";
import { postJson } from "@/lib/goi-api";
import { hoiMang } from "@/lib/hoi-mang";
import { useHoSo } from "@/lib/hoso";
import { docTraLoi } from "@/lib/nhan-tuong";
import { luuTraiBai, useBoBai, useLichSuTarot, type TraiBaiDaLuu } from "@/lib/tarot";
import { SO_LA, TRAI_BAI_MAC_DINH, laMaTraiBai, type BaoCaoTarot as Bc, type HieuCau, type LaRut, type MaTraiBai } from "@/lib/tarot-chung";
import { cn } from "@/lib/utils";
import { useChuTarot } from "@/components/tarot/chu-tarot";

// EN-ALL GĐ 7: /en/tarot là rewrite của trang này (một cây component) — chữ cố định ở lib/chu/tarot.ts (chiều `en`), tên lá /
// trải bài / vị trí do engine trả theo ngôn ngữ. Bản Anh không có thẻ chia sẻ câu trả lời và hỏi lại sau 30 ngày.
type Buoc = "hoi" | "xao" | "rut" | "lat" | "doc";
const CAC_BUOC: Buoc[] = ["hoi", "xao", "rut", "lat", "doc"];
const THU_TU_TB: MaTraiBai[] = ["mot_la", "ba_la_loi_khuyen", "ba_la_thoi_gian", "hai_lua_chon", "khi_nao", "nam_la", "celtic"];

export function Tarot() {
  const c = useChu();
  const { c: t, en, la: chuLa } = useChuTarot();
  const GOI_Y = [
    { nhom: t("goi_y.nhom_nghia"), cau: [t("goi_y.nghia_1"), t("goi_y.nghia_2"), t("goi_y.nghia_3")] },
    { nhom: t("goi_y.nhom_cach"), cau: [t("goi_y.cach_1"), t("goi_y.cach_2"), t("goi_y.cach_3")] },
  ];
  const hoSo = useHoSo();
  const { bo, loi: loiBo, thuLai } = useBoBai(t("loi.bo_thu_lai"));
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
  // TR-5: trải bài do máy chọn theo câu hỏi cho tới khi người dùng tự bấm chọn (tbTay); chip chuyện hay hỏi đang mở; lá vừa lật.
  const [tbTay, setTbTay] = useState(false);
  const [nhom, setNhom] = useState<string | null>(null);
  const [moTuyChinh, setMoTuyChinh] = useState(false);
  const [vuaLat, setVuaLat] = useState<number | null>(null);
  const dangDoc = useRef(false);
  const refCau = useRef<HTMLTextAreaElement>(null);
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
  // TR-5: engine hiểu câu → trải bài hợp nhất được chọn LUÔN (bớt một việc phải quyết); người dùng đã tự chọn thì giữ lựa chọn đó.
  const goiYTb = hieu && !hieu.chan && cau.trim().length >= 6 && laMaTraiBai(hieu.goi_y_trai_bai) && bo?.trai_bai[hieu.goi_y_trai_bai] ? hieu.goi_y_trai_bai : null;
  useEffect(() => { if (buoc === "hoi" && goiYTb && !tbTay) setMaTb(goiYTb); }, [goiYTb, tbTay, buoc]);
  const dungGoiY = () => {
    if (!hieu) return;
    if (laMaTraiBai(hieu.goi_y_trai_bai)) setMaTb(hieu.goi_y_trai_bai);
    setTbTay(false);
    if (!chuDe && hieu.chu_de) setChuDe(hieu.chu_de);
    ghi("chart_interacted", { mo_dun: "tarot", kind: "dung_goi_y", y_dinh: hieu.y_dinh, trai_bai: hieu.goi_y_trai_bai });
  };
  const chonNhom = (g: { ma: string; chu_de: string | null }) => {
    const mo = nhom === g.ma ? null : g.ma;
    setNhom(mo);
    if (mo && g.chu_de) setChuDe(g.chu_de);
    ghi("chart_interacted", { mo_dun: "tarot", kind: "chon_nhom_hoi", nhom: g.ma });
  };
  const dienCau = (ma: string, c: string) => {
    setCau(c); setTbTay(false);
    ghi("chart_interacted", { mo_dun: "tarot", kind: "goi_y_dien_san", nhom: ma });   // chỉ mã chip, không gửi câu
    refCau.current?.focus();
  };
  const lamLai = () => { setBuoc("hoi"); setThuTu([]); setCoNguoc([]); setDaRut([]); setLat([]); setBc(null); setLoi(null); setVuaLat(null); };
  const batDau = () => { setBuoc("xao"); setLoi(null); ghi("chart_interacted", { mo_dun: "tarot", kind: "bat_dau", trai_bai: maTb, co_cau: cau.trim().length > 0, chu_de: chuDe ?? "khong", y_dinh: hieu?.y_dinh ?? "khong" }); setTimeout(() => refBan.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); };
  const xao = async (hatGiong: string | null) => {
    setDang(true); setLoi(null);
    try {
      const d = await postJson<{ thu_tu: string[]; nguoc: boolean[]; nguon: string }>("/api/tarot/xao-bai", { ...(hatGiong ? { hat_giong: hatGiong } : {}), nguoc });
      setThuTu(d.thu_tu); setCoNguoc(d.nguoc); setDaRut([]); setLat([]); setBuoc("rut");
      ghi("chart_interacted", { mo_dun: "tarot", kind: "xao", nguon: d.nguon, nguoc });
    } catch (e) { setLoi(e instanceof Error ? e.message : t("loi.xao")); } finally { setDang(false); }
  };
  const rut = (i: number) => {
    if (daRut.length >= soLa || daRut.includes(i)) return;          // bấm đúp / đã đủ lá → bỏ qua, không đo
    setDaRut([...daRut, i]);
    ghi("chart_interacted", { mo_dun: "tarot", kind: "rut", so: daRut.length + 1 });
  };
  // "Rút giúp tôi": lấy các lá TRÊN CÙNG của bộ engine đã xáo (như người đọc bài chia từ trên xuống) — web không random.
  const rutGiup = () => {
    const them: number[] = [];
    for (let i = 0; i < thuTu.length && daRut.length + them.length < soLa; i++) if (!daRut.includes(i)) them.push(i);
    if (!them.length) return;
    setDaRut([...daRut, ...them]);
    ghi("chart_interacted", { mo_dun: "tarot", kind: "rut_giup", so: them.length });
  };
  const latLa = (i: number) => { setLat((l) => { const m = Array.from({ length: soLa }, (_, k) => l[k] ?? false); m[i] = true; return m; }); setVuaLat(i); };
  const latHet = () => { setLat(Array.from({ length: soLa }, () => true)); setVuaLat((v) => v ?? tb?.trong_tam ?? 0); };
  const doc = async (ds?: LaRut[], ma?: MaTraiBai, cauCu?: string, chuDeCu?: string | null) => {
    const laGui = ds ?? (la.filter(Boolean) as LaRut[]);
    const maGui = ma ?? maTb;
    if (dangDoc.current) return;
    dangDoc.current = true;
    setDang(true); setLoi(null);
    try {
      const tl = docTraLoi();
      const body = {
        trai_bai: maGui, la: laGui, ...(cauCu ?? cau ? { cau_hoi: (cauCu ?? cau).trim().slice(0, 500), dien_dat: true } : {}), ...((chuDeCu ?? chuDe) ? { chu_de: chuDeCu ?? chuDe } : {}),
        ...(hoSo?.nam && hoSo.thang && hoSo.ngay && hoSo.am == null ? { ngay_sinh: `${hoSo.nam}-${String(hoSo.thang).padStart(2, "0")}-${String(hoSo.ngay).padStart(2, "0")}` } : hoSo?.nam ? { nam_sinh: hoSo.nam } : {}),
        ...(hoSo?.gioi_tinh ? { gioi_tinh: hoSo.gioi_tinh } : {}), ...(Object.keys(tl).length ? { tra_loi_nhan_tuong: tl } : {}),
      };
      const d = await postJson<Bc>("/api/tarot/doc-bai", body);
      setBc(d); setBuoc("doc");
      if (!ds) {
        // Tâm điểm = hộp cốt lõi đầu tiên engine trả (hop của vị trí trọng tâm theo KB) — web không tự chọn vị trí.
        const tt = d.cot_loi[0]?.la;
        luuTraiBai({ trai_bai: maGui, la: laGui, cau: cauCu ?? cau, chu_de: chuDeCu ?? chuDe, tom_tat: tt ? `${tt.ten}${tt.nguoc ? chuLa.nguoc : ""}` : d.da_tinh.ten_trai_bai });
        docLichSu();
        // TR-3: câu hỏi "có nên / có thành / khi nào…" → máy nhớ MÃ hộp trả lời (không câu hỏi, không lá) để ≥ 30 ngày sau hỏi
        // "việc đó ra sao?" (phiếu kiem_chung_sau 0022, cùng khung Q7 như quẻ Kinh Dịch).
        const yd = d.hieu_cau?.y_dinh;
        const h0 = d.chuong.find((x) => x.ma === "tra_loi")?.hop?.[0];
        if (!en && yd && ["quyet_dinh", "lua_chon", "ket_qua", "thoi_diem", "cach_lam"].includes(yd) && h0?.ma_mau && h0.phai) {
          ghiNhanDung({ loai: "doi_song", mau: h0.ma_mau, phai: h0.phai, mo_dun: "tarot", loai_hoi: "tarot",
            nhan: `${h0.tieu_de}${d.hieu_cau?.nhan_viec ? ` — ${d.hieu_cau.nhan_viec}` : ""}`.slice(0, 80) });
        }
      }
      ghi("chart_interacted", { mo_dun: "tarot", kind: "doc_bai", trai_bai: maGui, an_chinh: d.da_tinh.an_chinh.so, xem_lai: Boolean(ds), y_dinh: d.hieu_cau?.y_dinh ?? "khong", nghieng: d.hieu_cau?.nghieng?.nghieng ?? "khong", ...(en ? { ngon_ngu: "en" } : {}) });
      setTimeout(() => refDoc.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (e) { setLoi(e instanceof Error ? e.message : t("loi.doc")); } finally { setDang(false); dangDoc.current = false; }
  };
  // TR-5: lật đủ lá → tự vào bài đọc sau một nhịp ngắn (đủ để nhìn lá cuối); lỗi thì dừng, người dùng bấm thử lại.
  const refDocTuDong = useRef(doc);
  refDocTuDong.current = doc;
  useEffect(() => {
    if (!(duLat && buoc === "lat") || loi) return;
    const t = setTimeout(() => void refDocTuDong.current(), 1500);
    return () => clearTimeout(t);
  }, [duLat, buoc, loi]);
  // Nghĩa nhanh của các lá ĐÃ LẬT (từ khoá đúng chiều + câu hỏi của vị trí — đều từ bộ bài engine trả).
  const mucDaLat: MucLa[] = tb && bo ? la.flatMap((lr, i) => {
    const lb = lr ? bo.la[lr.id] : null, v = tb.vi_tri[i];
    if (!lr || !lb || !v || !lat[i]) return [];
    return [{ so: i, viTri: v.ten, hoi: v.hoi, la: lb, nguoc: lr.nguoc, tuKhoa: lr.nguoc ? lb.tu_khoa_nguoc ?? [] : lb.tu_khoa }];
  }) : [];
  const xemLai = (q: TraiBaiDaLuu) => {
    if (!laMaTraiBai(q.trai_bai)) return;
    setMaTb(q.trai_bai); setTbTay(true); setCau(q.cau); setChuDe(q.chu_de);
    setThuTu(q.la.map((l) => l.id)); setCoNguoc(q.la.map((l) => l.nguoc)); setDaRut(q.la.map((_, i) => i)); setLat(q.la.map(() => true));
    void doc(q.la, q.trai_bai, q.cau, q.chu_de);
  };

  const dau = (
    <DauMang Icon={Layers} hinh="tarot" ten={t("dau.ten")} mo_ta={t("dau.mo_ta")} />
  );
  if (!bo && !loiBo) return <div>{dau}<KhungTai nhan={t("tai")} /></div>;
  if (!bo) return <div>{dau}<BaoLoi loi={loiBo ?? t("loi.bo")} thuLai={thuLai} /></div>;

  return (
    <div>
      {dau}
      {/* Thanh bước — biết mình đang ở đâu trong 5 bước */}
      <ol className="mx-auto mb-4 flex max-w-5xl flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-fg-faint sm:gap-x-2" aria-label={t("buoc.aria")} data-testid="thanh-buoc">
        {CAC_BUOC.map((b, i) => { const vt = CAC_BUOC.indexOf(buoc); const xong = i < vt, dangO = i === vt; return (
          <li key={b} className="flex items-center gap-1.5 sm:gap-2" aria-current={dangO ? "step" : undefined}>
            <span className={cn("inline-flex size-5 items-center justify-center rounded-full border text-[10px]", dangO ? "border-gold bg-gold/20 text-fg" : xong ? "border-gold/50 text-gold" : "border-line")}>{xong ? <Check className="size-3" aria-hidden /> : i + 1}</span>
            <span className={cn(dangO && "text-fg")}>{t(`buoc.${b}`)}</span>
            {i < CAC_BUOC.length - 1 && <span className="h-px w-3 bg-line sm:w-8" aria-hidden />}
          </li>
        ); })}
      </ol>

      {/* Bước 1 — Hỏi */}
      <section aria-labelledby="buoc-hoi" className="mx-auto mb-8 max-w-5xl scroll-mt-24" id="trai-bai">
        <TieuDeMuc id="buoc-hoi" nho={c("hoi_bai.nho")} lon={c("hoi_bai.lon")} />
        {buoc !== "hoi" ? (
          <div className="glass flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl px-5 py-3 text-sm" data-testid="buoc-hoi-gon">
            <p className="min-w-0 flex-1 text-fg-muted">
              {cau.trim() ? <>{t("hoi_gon.ban_hoi")} <span className="text-fg">“{cau.trim()}”</span> · </> : null}{tb ? <>{t("hoi_gon.trai_bai")} <b className="text-fg">{tb.ngan}</b></> : null}
            </p>
            <Button variant="secondary" size="sm" onClick={lamLai} data-testid="nut-lam-lai"><RotateCcw aria-hidden /> {t("nut.hoi_khac")}</Button>
          </div>
        ) : (
        <div className="glass rounded-2xl p-5 sm:p-6" data-testid="buoc-hoi">
          {bo.goi_y_hoi && bo.goi_y_hoi.length > 0 && (
            <div data-testid="goi-y-hoi">
              <p className="text-sm text-fg-muted">{t("goi_y_hoi.dan")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {bo.goi_y_hoi.map((g) => (
                  <button key={g.ma} type="button" aria-pressed={nhom === g.ma} onClick={() => chonNhom(g)} data-testid={`nhom-hoi-${g.ma}`}
                    className={cn("rounded-full border px-3 py-1.5 text-sm transition-colors", nhom === g.ma ? "border-gold bg-gold/15 text-fg" : "border-line text-fg-muted hover:border-gold/40 hover:text-fg")}>{g.ten}</button>
                ))}
              </div>
              {bo.goi_y_hoi.filter((g) => g.ma === nhom).map((g) => (
                <ul key={g.ma} className="mt-3 grid gap-2 sm:grid-cols-2" aria-label={t("goi_y_hoi.aria", { ten: g.ten })}>
                  {g.cau.map((q) => (
                    <li key={q}>
                      <button type="button" onClick={() => dienCau(g.ma, q)} data-testid="cau-mau"
                        className={cn("w-full rounded-xl border px-3 py-2 text-left text-sm transition-colors", cau === q ? "border-gold bg-gold/10 text-fg" : "border-line/70 text-fg hover:border-gold/50")}>{q}</button>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          )}
          <label className="mt-4 block text-sm text-fg-muted" htmlFor="cau-hoi-tarot">{t("o_cau.nhan")}</label>
          <textarea ref={refCau} id="cau-hoi-tarot" rows={2} value={cau} onChange={(e) => setCau(e.target.value.replace(/\n/g, " ").slice(0, 200))} placeholder={t("o_cau.goi_y")} data-testid="o-cau-hoi"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); batDau(); } }}
            className="mt-1 block w-full resize-none rounded-xl border border-line bg-bg/60 px-4 py-3 text-base text-fg placeholder:text-fg-faint transition-colors hover:border-gold/30 focus-visible:border-gold/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/30" />
          {hieu && cau.trim().length >= 6 && (
            <div className="mt-2 rounded-xl border border-gold/30 bg-gold/5 px-3 py-2 text-sm" data-testid="goi-y-cau-hoi" aria-live="polite">
              {hieu.chan === "an_toan" && hieu.loi ? <p className="text-fg">{hieu.loi}</p> : (
                <>
                  <p className="text-fg-muted">
                    {t("hieu.hieu")} <b className="text-fg">{hieu.ten_y_dinh}</b>{hieu.nhan_viec ? <> {t("hieu.ve")} <b className="text-fg">{hieu.nhan_viec}</b></> : null}
                    {hieu.lua_chon ? <> — {t("hieu.duong_a")} <b className="text-fg">{hieu.lua_chon[0]}</b>, {t("hieu.duong_b")} <b className="text-fg">{hieu.lua_chon[1]}</b></> : null}.
                    {" "}{t("hieu.mo")}
                  </p>
                  {hieu.loi && <p className="mt-1 text-fg-faint">{hieu.loi}</p>}
                  {tbTay && goiYTb && goiYTb !== maTb && (
                    <p className="mt-1">
                      {t("hieu.hop_nhat")} <b className="text-fg">{hieu.ten_goi_y}</b>{" "}
                      <button type="button" onClick={dungGoiY} className="ml-1 rounded-full border border-gold/50 px-2.5 py-0.5 text-xs text-gold hover:bg-gold/10" data-testid="nut-dung-goi-y">{t("nut.dung_goi_y")}</button>
                    </p>
                  )}
                </>
              )}
            </div>
          )}
          {/* Trải bài đang dùng: máy chọn theo câu hỏi, đổi được */}
          {tb && (
            <div className="mt-4 flex flex-wrap items-start gap-x-4 gap-y-2 rounded-xl border border-line/60 bg-bg/40 px-4 py-3" data-testid="trai-bai-dang-chon" data-ma={maTb}>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-fg">
                  <span className="text-fg-muted">{t("tb.nhan")} </span><b>{tb.ten}</b> <span className="text-fg-muted">· {t("tb.so_la", { n: String(soLa) })}</span>
                  {goiYTb === maTb && !tbTay && <span className="ml-2 inline-block whitespace-nowrap rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-xs text-gold" data-testid="nhan-tu-chon">{t("tb.hop")}</span>}
                </p>
                <p className="mt-0.5 text-xs text-fg-faint">{tb.mo_ta}</p>
              </div>
              <button type="button" onClick={() => setMoTuyChinh((m) => !m)} aria-expanded={moTuyChinh} aria-controls="tuy-chinh-tarot" data-testid="nut-tuy-chinh"
                className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-fg-muted hover:border-gold/40 hover:text-fg"><SlidersHorizontal className="size-3.5" aria-hidden /> {moTuyChinh ? t("nut.thu_gon") : t("nut.tuy_chinh")}</button>
            </div>
          )}
          {moTuyChinh && (
            <div id="tuy-chinh-tarot" className="mt-3" data-testid="tuy-chinh">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7" role="radiogroup" aria-label={t("tuy.aria_tb")}>
                {THU_TU_TB.filter((ma) => bo.trai_bai[ma]).map((ma) => { const t = bo.trai_bai[ma]; return (
                  <button key={ma} type="button" role="radio" aria-checked={maTb === ma} onClick={() => { setMaTb(ma); setTbTay(true); }} data-testid={`trai-bai-${ma}`}
                    className={cn("rounded-xl border p-3 text-left text-sm transition-colors", maTb === ma ? "border-gold bg-gold/10" : "border-line hover:border-gold/40")}>
                    <span className="block font-medium text-fg">{t.ngan}</span>
                    <span className="mt-0.5 block text-xs text-fg-muted">{t.ten.replace(/^.*?: /, "")}</span>
                  </button>
                ); })}
              </div>
              <p className="mt-3 text-sm text-fg-muted">{t("tuy.mang")}</p>
              <div className="mt-1 flex flex-wrap gap-2" role="radiogroup" aria-label={t("tuy.aria_cd")}>
                {Object.entries(bo.chu_de).map(([ma, x]) => (
                  <button key={ma} type="button" role="radio" aria-checked={chuDe === ma} onClick={() => setChuDe(chuDe === ma ? null : ma)}
                    className={cn("rounded-full border px-3 py-1 text-sm", chuDe === ma ? "border-gold bg-gold/15 text-fg" : "border-line text-fg-muted hover:text-fg")} data-testid={`chu-de-${ma}`}>{x.ten}</button>
                ))}
              </div>
            </div>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={batDau} data-testid="nut-bat-dau"><Sparkles aria-hidden /> {t("nut.bat_dau", { n: String(soLa) })}</Button>
            {!cau.trim() && <p className="text-xs text-fg-faint">{t("khong_cau")}</p>}
          </div>
        </div>
        )}
      </section>

      {/* Bước 2–4 — Xáo · Rút · Lật */}
      {buoc !== "hoi" && buoc !== "doc" && tb && (
        <section ref={refBan} aria-labelledby="buoc-rut" className="mx-auto mb-8 max-w-5xl scroll-mt-24">
          <TieuDeMuc id="buoc-rut" nho={buoc === "xao" ? t("buoc.2") : buoc === "rut" ? t("buoc.3") : t("buoc.4")} lon={buoc === "xao" ? t("tieu.xao") : buoc === "rut" ? t("tieu.rut", { n: String(soLa) }) : t("tieu.lat")} />
          {buoc === "xao" && <XaoBai onXong={(hg) => void xao(hg)} dang={dang} nguoc={nguoc} onNguoc={setNguoc} />}
          {buoc !== "xao" && (
            <div className="space-y-4">
              <BanTraiBai tb={tb} la={la} lat={lat} onLat={latLa} boLa={bo.la} />
              {buoc === "rut" && (
                <>
                  <QuatBai thuTu={thuTu} daRut={daRut} onRut={rut} conLai={soLa - daRut.length} />
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="secondary" size="sm" onClick={rutGiup} data-testid="nut-rut-giup"><Wand2 aria-hidden /> {t("nut.rut_giup", { n: String(soLa - daRut.length) })}</Button>
                    <p className="text-xs text-fg-faint">{t("rut.dan")}</p>
                  </div>
                </>
              )}
              {buoc === "lat" && (
                <div className="flex flex-wrap items-center gap-3">
                  {!duLat && <Button variant="secondary" onClick={latHet} data-testid="nut-lat-het">{t("nut.lat_het")}</Button>}
                  <Button onClick={() => void doc()} disabled={!duLat || dang} data-testid="nut-doc-bai">{dang ? t("nut.dang_doc") : duLat ? t("nut.doc_ngay") : t("nut.doc")}</Button>
                  <p className="text-sm text-fg-muted" aria-live="polite">{duLat ? t("lat.du") : t("lat.dan")}</p>
                </div>
              )}
              {buoc === "lat" && mucDaLat.length > 0 && (
                <div className="glass rounded-2xl p-4 sm:p-5">
                  <YNghiaLa muc={mucDaLat} chon={vuaLat !== null && lat[vuaLat] ? vuaLat : mucDaLat[mucDaLat.length - 1]!.so} onChon={setVuaLat} tieuDe={t("ynl.vua_lat")} ghiChu={t("ynl.nhanh")} />
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
          <BaoCaoTarot bc={bc} tb={bo.trai_bai[bc.da_tinh.trai_bai] ?? tb} boLa={bo.la} ten={hoSo?.ho_ten?.trim() ? hoSo.ho_ten : t("ten.ban")} cau={cau.trim() || null} />
          <div className="mt-6 flex flex-wrap items-start gap-3">
            <Button variant="secondary" onClick={lamLai} data-testid="nut-trai-bai-moi"><RotateCcw aria-hidden /> {t("nut.trai_bai_moi")}</Button>
            {!en && bc.hieu_cau && bc.hieu_cau.co_cau && !bc.hieu_cau.chan && (
              <NutChiaSeTarot traiBai={bc.da_tinh.trai_bai} la={bc.da_tinh.vi_tri.map((v) => ({ id: v.id, nguoc: v.nguoc }))}
                yDinh={bc.hieu_cau.y_dinh} viec={bc.hieu_cau.viec} linhVuc={bc.hieu_cau.linh_vuc} />
            )}
          </div>
          <div className="mt-6"><CuoiBaiDoc moDun="tarot" cauHoi={t("cuoi.hoi")} khongCta={en} /></div>
        </section>
      )}

      <div className="mx-auto mb-8 max-w-5xl"><LaNgay hoSo={hoSo} tieuDe={c("la_ngay.tieu_de")} /></div>

      {!en && <div className="mx-auto mb-8 max-w-5xl empty:hidden"><HoiSau30Ngay homNay={new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10)} moDun="tarot" /></div>}

      {lichSu && lichSu.length > 0 && <div className="mx-auto mb-10 max-w-5xl"><LichSuTarot ds={lichSu} bo={bo} onXemLai={xemLai} onDoi={docLichSu} /></div>}

      <section aria-labelledby="hoi-dap" id="hoi-dap" className="mx-auto max-w-5xl scroll-mt-24">
        <TieuDeMuc id="hoi-dap" nho={c("hoi.nho")} lon={c("hoi.lon")} />
        <KhungChat moDun="tarot" goiY={GOI_Y}
          loiChao={bc ? t("chat.loi_chao_bai") : t("chat.loi_chao")}
          gui={(q) => hoiMang("/api/tarot/hoi", { cau_hoi: q, ...(bc ? { trai_bai: bc.da_tinh.trai_bai, la: bc.da_tinh.vi_tri.map((v) => ({ id: v.id, nguoc: v.nguoc })) } : {}) })} />
      </section>
    </div>
  );
}
